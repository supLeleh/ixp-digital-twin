import os
import json
import logging
import shutil
from pathlib import Path

BACKEND_BASE_PATH = os.path.relpath(Path(os.path.dirname(__file__)))
BACKEND_RESOURCES_FOLDER: str = os.path.abspath(os.path.join(BACKEND_BASE_PATH, "resources")) 
BACKEND_IXPCONFIGS_FOLDER: str = os.path.abspath(os.path.join(BACKEND_BASE_PATH, "ixpconfigs"))
BACKEND_LOGS_PATH: str = os.path.abspath(os.path.join(BACKEND_BASE_PATH, "logs", "namex.log"))
SETTINGS_FILE: str = os.path.abspath(os.path.join(BACKEND_BASE_PATH, "settings.json"))
DIGITAL_TWIN_RESOURCES_FOLDER: str = os.path.abspath(os.path.join(BACKEND_BASE_PATH, "digital_twin", "resources"))


def get_max_devices():
    """
    Read MAX_DEVICES from settings.json file.
    
    Returns:
        int or None: Max devices limit, or None for unlimited
    """
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'r') as f:
                settings = json.load(f)
                value = settings.get('max_devices', None)  # ✅ Default None invece di 5
                
                # ✅ Se è None o 0 → unlimited (None)
                if value is None or value == 0:
                    print(f"DEBUG globals.py: max_devices is unlimited (value={value})")
                    return None
                
                print(f"DEBUG globals.py: Read max_devices={value} from {SETTINGS_FILE}")
                return value
        else:
            print(f"DEBUG globals.py: File {SETTINGS_FILE} does not exist, using unlimited")
            return None  # ✅ Default unlimited
    except Exception as e:
        print(f"ERROR globals.py: Could not load max_devices: {e}")
    
    return None  # ✅ Default unlimited in caso di errore

def sync_resources_to_digital_twin():
    """
    Copia tutti i file da backend/resources/ a backend/digital_twin/resources/
    Viene eseguito prima di ogni start/reload del lab.
    """
    try:
        logging.info(f"🔄 Syncing resources from: {BACKEND_RESOURCES_FOLDER}")
        logging.info(f"🔄 Syncing resources to: {DIGITAL_TWIN_RESOURCES_FOLDER}")
        
        # Verifica che la source folder esista
        if not os.path.exists(BACKEND_RESOURCES_FOLDER):
            logging.error(f"❌ Source folder does not exist: {BACKEND_RESOURCES_FOLDER}")
            return False
        
        # Crea la directory di destinazione se non esiste
        os.makedirs(DIGITAL_TWIN_RESOURCES_FOLDER, exist_ok=True)
        logging.info(f"✅ Destination folder created/verified: {DIGITAL_TWIN_RESOURCES_FOLDER}")
        
        # Conta file copiati
        copied_count = 0
        failed_count = 0
        
        # Copia tutti i file
        for filename in os.listdir(BACKEND_RESOURCES_FOLDER):
            src_path = os.path.join(BACKEND_RESOURCES_FOLDER, filename)
            dst_path = os.path.join(DIGITAL_TWIN_RESOURCES_FOLDER, filename)
            
            # Copia solo file (non directory)
            if os.path.isfile(src_path):
                try:
                    shutil.copy2(src_path, dst_path)
                    copied_count += 1
                    logging.info(f"  ✅ {filename} ({os.path.getsize(src_path)} bytes)")
                except Exception as e:
                    failed_count += 1
                    logging.error(f"  ❌ Failed to copy {filename}: {e}")
        
        logging.info(f"✅ Resources sync completed: {copied_count} files copied, {failed_count} failed")
        
        # Verifica che i file critici siano stati copiati
        critical_files = ['rs1-rom-v4.conf', 'rs1-rom-v6.conf', 'config_peerings.json']
        missing_files = []
        for critical_file in critical_files:
            dst_path = os.path.join(DIGITAL_TWIN_RESOURCES_FOLDER, critical_file)
            if not os.path.exists(dst_path):
                missing_files.append(critical_file)
                logging.error(f"❌ Critical file not found after sync: {critical_file}")
        
        if missing_files:
            logging.error(f"❌ Sync incomplete! Missing files: {missing_files}")
            return False
        
        logging.info("✅ All critical files verified!")
        return True
        
    except Exception as e:
        logging.error(f"❌ Failed to sync resources: {e}")
        import traceback
        logging.error(traceback.format_exc())
        return False

