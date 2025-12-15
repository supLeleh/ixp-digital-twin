import logging
import os
import docker

from Kathara.setting.Setting import Setting

from log import set_logging
from digital_twin.ixp.configuration.frr_scenario_configuration_applier import FrrScenarioConfigurationApplier
from digital_twin.ixp.foundation.dumps.member_dump.member_dump_factory import MemberDumpFactory
from digital_twin.ixp.foundation.dumps.table_dump.table_dump_factory import TableDumpFactory
from globals import BACKEND_RESOURCES_FOLDER, BACKEND_IXPCONFIGS_FOLDER
from digital_twin.ixp.network_scenario.network_scenario_manager import NetworkScenarioManager
from digital_twin.ixp.network_scenario.rs_manager import RouteServerManager
from digital_twin.ixp.settings.settings import Settings


def load_settings_for_reload(settings, config_file_path):
    """
    Custom settings loader for reload that handles missing probe_ips gracefully.
    """
    import json
    import ipaddress
    
    if not os.path.exists(config_file_path):
        raise FileNotFoundError(f"Config file not found: {config_file_path}")
    
    with open(config_file_path, 'r') as settings_file:
        settings_data = json.load(settings_file)
    
    # Load all settings from JSON
    for name, value in settings_data.items():
        if hasattr(settings, name):
            setattr(settings, name, value)
    
    # Convert IP networks
    settings.peering_lan["4"] = ipaddress.ip_network(settings.peering_lan["4"])
    settings.peering_lan["6"] = ipaddress.ip_network(settings.peering_lan["6"])
    
    # Convert route server addresses
    for rs in settings.route_servers.values():
        rs["address"] = ipaddress.ip_address(rs["address"])
    
    # Convert probe IPs ONLY IF they exist (quarantine is optional)
    if hasattr(settings, 'quarantine') and settings.quarantine:
        if "probe_ips" in settings.quarantine:
            if settings.quarantine["probe_ips"].get("4"):
                settings.quarantine["probe_ips"]["4"] = ipaddress.ip_address(
                    settings.quarantine["probe_ips"]["4"]
                )
            if settings.quarantine["probe_ips"].get("6"):
                settings.quarantine["probe_ips"]["6"] = ipaddress.ip_address(
                    settings.quarantine["probe_ips"]["6"]
                )
        else:
            logging.info("Quarantine probe_ips not configured (optional)")
    else:
        logging.info("Quarantine section not present (optional)")


def get_existing_containers(lab_hash):
    """
    Get list of existing container names for the current lab.
    
    Args:
        lab_hash: Lab hash to filter containers
        
    Returns:
        set: Set of existing device names
    """
    try:
        docker_client = docker.from_env()
        all_containers = docker_client.containers.list(all=True)
        
        existing_devices = set()
        for container in all_containers:
            # Extract device name from container name
            # Format: <hash>_<device_name> or kathara_<hash>_<device_name>
            container_name = container.name
            
            if lab_hash in container_name:
                # Extract device name
                parts = container_name.split('_')
                if len(parts) >= 2:
                    # Remove hash prefix to get device name
                    if container_name.startswith('kathara_'):
                        device_name = '_'.join(parts[2:])  # kathara_hash_devicename
                    else:
                        device_name = '_'.join(parts[1:])  # hash_devicename
                    
                    existing_devices.add(device_name)
        
        return existing_devices
        
    except Exception as e:
        logging.warning(f"Could not get existing containers: {e}")
        return set()


def reload_lab(ixp_configs_filename: str):
    """
    Hot-reload lab configuration without full restart.
    Only deploys new/changed devices and updates configurations.
    
    Args:
        ixp_configs_filename: Name of the config file (e.g., 'ixp.conf')
        
    Returns:
        net_scenario: Updated network scenario object
    """
    set_logging()
    
    logging.info("=" * 80)
    logging.info("Starting LAB HOT-RELOAD")
    logging.info("=" * 80)
    logging.info(f"Config filename: {ixp_configs_filename}")
    
    # Get Settings singleton
    settings = Settings.get_instance()
    
    # Build config path
    config_file_path = os.path.join(BACKEND_IXPCONFIGS_FOLDER, ixp_configs_filename)
    logging.info(f"Loading config from: {config_file_path}")
    
    # Verify file exists
    if not os.path.exists(config_file_path):
        raise FileNotFoundError(f"Config file not found: {config_file_path}")
    
    # Load settings with custom loader
    load_settings_for_reload(settings, config_file_path)
    
    # Configure Kathara
    Setting.get_instance().load_from_dict({"manager_type": "docker"})
    
    logging.info(f"Peering configuration: {settings.peering_configuration}")
    
    # Load member dump
    try:
        member_dump_class = MemberDumpFactory(submodule_package="digital_twin").get_class_from_name(
            settings.peering_configuration["type"]
        )
        entries = member_dump_class().load_from_file(
            os.path.join(BACKEND_RESOURCES_FOLDER, settings.peering_configuration["path"])
        )
        logging.info(f"Loaded {len(entries)} member entries")
    except Exception as e:
        logging.error(f"Failed to load member dump: {e}")
        raise
    
    # Load table dump
    try:
        table_dump = TableDumpFactory(submodule_package="digital_twin").get_class_from_name(
            settings.rib_dumps["type"]
        )(entries)
        
        for v, file in settings.rib_dumps["dumps"].items():
            dump_path = os.path.join(BACKEND_RESOURCES_FOLDER, file)
            logging.info(f"Loading RIB dump (IPv{v}): {dump_path}")
            table_dump.load_from_file(dump_path)
        
        logging.info(f"Loaded RIB dumps for {len(settings.rib_dumps['dumps'])} IP versions")
    except Exception as e:
        logging.error(f"Failed to load RIB dumps: {e}")
        raise
    
    # Limit entries for debug/performance
    original_count = len(table_dump.entries)
    table_dump.entries = dict(list(table_dump.entries.items())[0:5])
    logging.info(f"Limited table dump entries: {original_count} -> {len(table_dump.entries)} (debug mode)")
    
    # Initialize managers
    net_scenario_manager = NetworkScenarioManager()
    frr_conf = FrrScenarioConfigurationApplier(table_dump)
    rs_manager = RouteServerManager()
    
    # Build diff
    logging.info("Analyzing configuration changes...")
    try:
        net_scenario = net_scenario_manager.build_diff(table_dump)
        logging.info(f"Network scenario hash: {net_scenario.hash}")
    except Exception as e:
        logging.error(f"Failed to build network scenario diff: {e}")
        raise
    
    # Get existing containers
    existing_devices = get_existing_containers(net_scenario.hash)
    logging.info(f"Found {len(existing_devices)} existing containers: {existing_devices}")
    
    # Extract NEW devices (marked by build_diff)
    new_devices_from_diff = dict(
        x for x in net_scenario.machines.items() 
        if "new" in x[1].meta and x[1].meta["new"]
    )
    
    # Filter out devices that already exist in Docker
    new_devices = {}
    skipped_devices = []
    
    for device_name, device in new_devices_from_diff.items():
        if device_name in existing_devices:
            logging.warning(f"Device {device_name} already exists in Docker, skipping deployment")
            skipped_devices.append(device_name)
        else:
            new_devices[device_name] = device
    
    if skipped_devices:
        logging.info(f"Skipped {len(skipped_devices)} existing devices: {skipped_devices}")
    
    if len(new_devices) == 0:
        logging.info("No new devices to deploy. Updating existing configurations only.")
    else:
        logging.info(f"Will deploy {len(new_devices)} new devices: {list(new_devices.keys())}")
    
    # Deploy new devices
    if new_devices:
        try:
            logging.info("Applying FRR configurations to new devices...")
            frr_conf.apply_to_devices(new_devices)
            logging.info("FRR configurations applied")
        except Exception as e:
            logging.error(f"Failed to apply FRR configurations: {e}")
            raise
        
        try:
            logging.info("Deploying new devices...")
            net_scenario_manager.deploy_devices(new_devices)
            logging.info("New devices deployed")
        except Exception as e:
            logging.error(f"Failed to deploy new devices: {e}")
            raise
        
        try:
            logging.info("Updating network interconnections...")
            net_scenario_manager.update_interconnection(table_dump, new_devices)
            logging.info("Interconnections updated")
        except Exception as e:
            logging.error(f"Failed to update interconnections: {e}")
            raise
    
    # Upload Route Server configurations (always update, even if no new devices)
    try:
        logging.info("Uploading Route Server configurations...")
        rs_info = rs_manager.get_device_info(net_scenario)
        return_code = net_scenario_manager.copy_and_exec_by_device_info(rs_info)
        
        if return_code != 0:
            raise Exception(f"RS configuration upload failed with return code {return_code}")
        
        logging.info("Route Server configurations uploaded")
    except Exception as e:
        logging.error(f"Failed to upload RS configurations: {e}")
        raise Exception(f"Error during RS Copy and Exec: {e}")
    
    # Upload Peering configurations (always update, even if no new devices)
    try:
        logging.info("Uploading Peering configurations...")
        peerings_info = frr_conf.get_device_info(net_scenario)
        return_code = net_scenario_manager.copy_and_exec_by_device_info(peerings_info)
        
        if return_code != 0:
            raise Exception(f"Peering configuration upload failed with return code {return_code}")
        
        logging.info("Peering configurations uploaded")
    except Exception as e:
        logging.error(f"Failed to upload Peering configurations: {e}")
        raise Exception(f"Error during Peerings Copy and Exec: {e}")
    
    # Success
    logging.info("=" * 80)
    logging.info("LAB HOT-RELOAD COMPLETED SUCCESSFULLY!")
    logging.info(f"Total machines in scenario: {len(net_scenario.machines)}")
    logging.info(f"New machines deployed: {len(new_devices)}")
    logging.info(f"Skipped existing machines: {len(skipped_devices)}")
    logging.info(f"Lab hash: {net_scenario.hash}")
    logging.info("=" * 80)
    
    return net_scenario


if __name__ == "__main__":
    try:
        net_scenario = reload_lab("ixp.conf")
        logging.info(f"Reload successful! Lab hash: {net_scenario.hash}")
    except Exception as e:
        logging.error(f"Reload failed: {e}")
        import traceback
        logging.error(traceback.format_exc())
        exit(1)
