import threading
import logging
import os

from Kathara.setting.Setting import Setting
  
from log import set_logging
from digital_twin.ixp.configuration.frr_scenario_configuration_applier import (
    FrrScenarioConfigurationApplier,
)
from digital_twin.ixp.foundation.dumps.member_dump.member_dump_factory import (
    MemberDumpFactory,
)
from digital_twin.ixp.foundation.dumps.table_dump.table_dump_factory import (
    TableDumpFactory,
)
from globals import BACKEND_RESOURCES_FOLDER, BACKEND_IXPCONFIGS_FOLDER, get_max_devices, sync_resources_to_digital_twin
from digital_twin.ixp.network_scenario.network_scenario_manager import (
    NetworkScenarioManager,
)
from digital_twin.ixp.network_scenario.rs_manager import RouteServerManager
from digital_twin.ixp.settings.settings import Settings, DEFAULT_SETTINGS_PATH
from utils.dt_utils import load_settings_from_disk
from digital_twin.ixp.globals import PATH_PREFIX


def start_deploy(net_scenario_manager: NetworkScenarioManager):
    logging.info("Deploying lab..")
    net_scenario_manager.undeploy()
    net_scenario_manager.deploy_chunks()
    logging.info("Deploy lab complete")


def build_lab(ixp_configs_filename: str):
    """
    Build lab from IXP configuration file

    Args:
        ixp_configs_filename: Name of the config file (e.g., 'ixp.conf', 'prova.conf')
    """
    set_logging()

    # ✅ Sincronizza resources PRIMA di fare qualsiasi cosa
    logging.info("=" * 80)
    logging.info("🔄 SYNCING RESOURCES TO DIGITAL_TWIN")
    logging.info("=" * 80)
    
    if not sync_resources_to_digital_twin():
        error_msg = "Failed to sync resources to digital_twin. Cannot start lab."
        logging.error(f"❌ {error_msg}")
        raise RuntimeError(error_msg)
    
    logging.info("=" * 80)
    logging.info("Building lab..")
    logging.info(f"Config filename received: {ixp_configs_filename}")

    config_file_path = os.path.join(BACKEND_IXPCONFIGS_FOLDER, ixp_configs_filename)

    logging.info(f"Target config file: {config_file_path}")

    if not os.path.exists(config_file_path):
        raise FileNotFoundError(f"Config file not found: {config_file_path}")

    # Import necessari
    from digital_twin.ixp.settings import settings as settings_module
    from digital_twin.ixp.settings.settings import Settings

    # Reset singleton se esiste
    if hasattr(Settings, "_instance") and Settings._instance is not None:
        logging.warning("Resetting existing Settings singleton...")
        Settings._instance = None

    # Override del path
    settings_module.DEFAULT_SETTINGS_PATH = config_file_path
    logging.info(f"Overridden DEFAULT_SETTINGS_PATH: {config_file_path}")

    # Get instance e inizializza con valori di default
    settings: Settings = Settings.get_instance()

    # ✅ Valori di default completi per la sezione quarantine
    settings.quarantine = {
        "actions": [
            "connectivity.CheckPingAction",
            "connectivity.CheckPingMtuAction",
            "connectivity.CheckProxyArpAction",
            "bgp.CheckBgpSessionAction",
            "bgp.CheckBgpRibAction",
            "security.CheckServicesAction",
            "security.CheckTrafficAction",
        ],
        "proxy_arp_ips": ["8.8.8.8", "10.0.0.1", "192.168.0.1", "172.16.1.1"],
        "max_rib_prefixes": {"4": 5000, "6": 5000},
        "traffic_dump_mins": 1,
        "probe_ips": {
            "4": "193.201.29.254",
            "6": "2001:7f8:10:ffff:ffff:ffff:ffff:ffff",
        },
        "dns_name": "namex.it",
    }

    # Carica dal disco (sovrascriverà solo i campi presenti nel file)
    try:
        settings.load_from_disk()
        logging.info(f"Settings loaded successfully from: {config_file_path}")
    except KeyError as e:
        logging.warning(f"Optional configuration field missing: {e}, using defaults")

    logging.info(f"Quarantine config: {settings.quarantine}")

    # Configura Kathara per usare Docker
    Setting.get_instance().load_from_dict({"manager_type": "docker"})

    logging.info(f"Peering configuration: {settings.peering_configuration}")

    # Carica member dump
    member_dump_class = MemberDumpFactory(
        submodule_package="digital_twin"
    ).get_class_from_name(settings.peering_configuration["type"])
    entries = member_dump_class().load_from_file(
        os.path.join(BACKEND_RESOURCES_FOLDER, settings.peering_configuration["path"])
    )

    # Carica table dump
    table_dump = TableDumpFactory(submodule_package="digital_twin").get_class_from_name(
        settings.rib_dumps["type"]
    )(entries)

    for v, file in settings.rib_dumps["dumps"].items():
        dump_path = os.path.join(BACKEND_RESOURCES_FOLDER, file)
        logging.info(f"Loading RIB dump from: {dump_path}")
        table_dump.load_from_file(dump_path)

    # Limit entries based on MAX_DEVICES configuration (read fresh value)
    max_devices = get_max_devices()
    logging.info(f"DEBUG: get_max_devices() returned: {max_devices}")

    if max_devices is not None and max_devices > 0:
        original_count = len(table_dump.entries)
        table_dump.entries = dict(list(table_dump.entries.items())[0:max_devices])
        logging.info(f"✅ Limited devices: {original_count} -> {max_devices} (MAX_DEVICES)")
    else:
        logging.info(f"No device limit applied (total: {len(table_dump.entries)} devices)")
        
    # Build network scenario
    net_scenario_manager = NetworkScenarioManager()
    frr_conf = FrrScenarioConfigurationApplier(table_dump)
    rs_manager = RouteServerManager()

    net_scenario = net_scenario_manager.build(table_dump)
    frr_conf.apply_to_network_scenario(net_scenario)
    rs_manager.apply_to_network_scenario(net_scenario)
    net_scenario_manager.interconnect(table_dump)

    logging.info(f"Lab built successfully, hash: {net_scenario.hash}")
    logging.info(f"Machines in lab: {list(net_scenario.machines.keys())}")

    return net_scenario, net_scenario_manager


def start_lab(net_scenario_manager):
    """
    Start lab deployment in a separate thread
    """
    deployer_thread = threading.Thread(
        target=start_deploy, args=(net_scenario_manager,)
    )
    deployer_thread.start()


# Used to test locally backend functionalities
if __name__ == "__main__":
    # Per test locale, specifica il file desiderato
    lab, manager = build_lab("ixp.conf")
    start_lab(manager)
