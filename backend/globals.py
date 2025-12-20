import os
import json
from pathlib import Path


BACKEND_BASE_PATH = os.path.relpath(Path(os.path.dirname(__file__)))
BACKEND_RESOURCES_FOLDER: str = os.path.abspath(os.path.join(BACKEND_BASE_PATH, "resources")) 
BACKEND_IXPCONFIGS_FOLDER: str = os.path.abspath(os.path.join(BACKEND_BASE_PATH, "ixpconfigs"))
BACKEND_LOGS_PATH: str = os.path.abspath(os.path.join(BACKEND_BASE_PATH, "logs", "namex.log"))
SETTINGS_FILE: str = os.path.abspath(os.path.join(BACKEND_BASE_PATH, "settings.json"))


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

