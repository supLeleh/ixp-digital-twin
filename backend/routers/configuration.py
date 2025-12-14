import os
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, Response, status

from start_lab import build_lab
from utils.responses import success_2xx, error_4xx, error_5xx
from model.IXPConfFile import IXPConfFile
from model.file import ConfigFileModel
from utils.ixpconf_util import exists_file_in_ixpconfigs, create_file_in_ixpconfigs, get_ribs_content_from_ixpconf_name, get_rib_names_from_ixpconf_name
from utils.server_context import ServerContext

router = APIRouter(prefix="/ixp/file", tags=["IXP Lab Configuration"])

# Directory dei file
CONFIGS_DIR = Path("./ixpconfigs")
RESOURCES_DIR = Path("./resources")

# ==================== UTILITY FUNCTIONS ====================

def ensure_directory_exists(directory: Path):
    """Assicura che la directory esista"""
    if not directory.exists():
        directory.mkdir(parents=True, exist_ok=True)

def list_files_in_directory(directory: Path):
    """Lista tutti i file in una directory"""
    try:
        ensure_directory_exists(directory)
        
        files = []
        for file_path in directory.iterdir():
            if file_path.is_file():
                files.append({
                    "name": file_path.name,
                    "size": file_path.stat().st_size,
                    "modified": file_path.stat().st_mtime,
                    "path": str(file_path)
                })
        
        return sorted(files, key=lambda x: x['name'])
    except Exception as e:
        logging.error(f"Error listing files in {directory}: {e}")
        return []

# ==================== LAB MANAGEMENT ====================

@router.post("/running_ixpconf", status_code=status.HTTP_202_ACCEPTED)
async def set_running_ixpconf(ixp_filename: ConfigFileModel, response: Response):
    filename = ixp_filename.filename
    if not ServerContext.get_is_lab_discovered():
        return error_4xx(response=response,
                         status_code=status.HTTP_406_NOT_ACCEPTABLE,
                         message="ixp.conf file is already known")
    if not exists_file_in_ixpconfigs(filename):
        return error_4xx(response=response,
                         status_code=status.HTTP_406_NOT_ACCEPTABLE,
                         message="ixp.conf file does not exist")
    lab, _ = build_lab(filename)
    ServerContext.set_ixpconf_filename(filename)
    ServerContext.set_lab(lab)
    ServerContext.set_is_lab_discovered(False)
    ServerContext.set_total_machines(lab.machines)
    return success_2xx(message="ixp.conf file set successfully")

# ==================== UPLOAD ENDPOINTS (FormData) ====================

@router.post("/ixpconfigs", status_code=status.HTTP_202_ACCEPTED)
async def upload_ixp_config_file(file: UploadFile, response: Response):
    """Upload config file usando FormData (drag & drop)"""
    try:
        ensure_directory_exists(CONFIGS_DIR)
        file_path = CONFIGS_DIR / file.filename
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        logging.info(f"Config file uploaded: {file.filename}")
        return success_2xx(message="file saved successfully")
    except Exception as e:
        logging.error(f"Error uploading config: {e}")
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")

@router.post("/resources")
async def upload_resource_file(file: UploadFile, response: Response):
    """Upload resource file usando FormData (drag & drop)"""
    try:
        ensure_directory_exists(RESOURCES_DIR)
        file_path = RESOURCES_DIR / file.filename
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        logging.info(f"Resource file uploaded: {file.filename}")
        return success_2xx(message="file saved successfully")
    except Exception as e:
        logging.error(f"Error uploading resource: {e}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")

# ==================== GET ALL FILES ====================

@router.get("/ixpconfigs/all", status_code=status.HTTP_200_OK)
async def get_all_ixp_config_files(response: Response):
    """Lista tutti i file di configurazione"""
    try:
        files = list_files_in_directory(CONFIGS_DIR)
        filenames = [f["name"] for f in files]
        
        logging.info(f"Found {len(filenames)} config files")
        return success_2xx(key_mess="filenames", message=filenames)
    except Exception as e:
        logging.error(f"Error listing configs: {e}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")

@router.get("/resources/all", status_code=status.HTTP_200_OK)
async def get_all_resource_config_files(response: Response):
    """Lista tutti i file resource"""
    try:
        files = list_files_in_directory(RESOURCES_DIR)
        filenames = [f["name"] for f in files]
        
        logging.info(f"Found {len(filenames)} resource files")
        return success_2xx(key_mess="filenames", message=filenames)
    except Exception as e:
        logging.error(f"Error listing resources: {e}")
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")

# ==================== GET SINGLE FILE ====================

@router.get("/ixpconfigs/{filename}", status_code=status.HTTP_200_OK)
async def get_ixp_config_file(filename: str, response: Response):
    """Leggi contenuto di un file di configurazione"""
    try:
        file_path = CONFIGS_DIR / filename
        
        if not file_path.exists() or not file_path.is_file():
            return error_4xx(response=response,
                           status_code=status.HTTP_404_NOT_FOUND,
                           message="file not found")
        
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            logging.info(f"Read config file: {filename}")
            return success_2xx(key_mess="file_content", message=content)
    except FileNotFoundError:
        return error_4xx(response=response,
                         status_code=status.HTTP_404_NOT_FOUND,
                         message="file not found")
    except Exception as e:
        logging.error(f"Error reading config {filename}: {e}")
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")

@router.get("/resources/{filename}", status_code=status.HTTP_200_OK)
async def get_resource_config_file(filename: str, response: Response):
    """Leggi contenuto di un file resource"""
    try:
        file_path = RESOURCES_DIR / filename
        
        if not file_path.exists() or not file_path.is_file():
            return error_4xx(response=response,
                           status_code=status.HTTP_404_NOT_FOUND,
                           message="file not found")
        
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            logging.info(f"Read resource file: {filename}")
            return success_2xx(key_mess="file_content", message=content)
    except FileNotFoundError:
        return error_4xx(response=response,
                         status_code=status.HTTP_404_NOT_FOUND,
                         message="file not found")
    except Exception as e:
        logging.error(f"Error reading resource {filename}: {e}")
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")

# ==================== CREATE FILES (PUT) ====================

@router.put("/ixpconfigs/", status_code=status.HTTP_201_CREATED)
async def put_ixpconfigs_file(ixp_conf_file: IXPConfFile, response: Response):
    """Crea un nuovo file di configurazione (usando IXPConfFile model)"""
    filename = ixp_conf_file.filename
    content = ixp_conf_file.content.model_dump_json()
    
    if exists_file_in_ixpconfigs(filename):
        return error_4xx(response=response,
                         status_code=status.HTTP_406_NOT_ACCEPTABLE,
                         message="file already exists")
    
    try:
        create_file_in_ixpconfigs(filename, content)
        logging.info(f"Config file created: {filename}")
        return success_2xx(message="file created successfully")
    except Exception as e:
        logging.error(f"Error creating config {filename}: {e}")
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")

@router.put("/resources/", status_code=status.HTTP_201_CREATED)
async def create_resource_file(resource_data: dict, response: Response):
    """Crea un nuovo file resource"""
    filename = resource_data.get("name", "")
    content = resource_data.get("content", "")
    
    if not filename:
        return error_4xx(response=response,
                         status_code=status.HTTP_400_BAD_REQUEST,
                         message="filename is required")
    
    file_path = RESOURCES_DIR / filename
    
    if file_path.exists():
        return error_4xx(response=response,
                         status_code=status.HTTP_409_CONFLICT,
                         message="file already exists")
    
    try:
        ensure_directory_exists(RESOURCES_DIR)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        logging.info(f"Resource file created: {filename}")
        return success_2xx(message="file created successfully")
    except Exception as e:
        logging.error(f"Error creating resource {filename}: {e}")
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")

# ==================== UPDATE FILES (POST) ====================

@router.post("/ixpconfigs/{filename}", status_code=status.HTTP_200_OK)
async def update_ixpconfig_file(filename: str, data: dict, response: Response):
    """Aggiorna un file di configurazione esistente"""
    if not exists_file_in_ixpconfigs(filename):
        return error_4xx(response=response,
                         status_code=status.HTTP_404_NOT_FOUND,
                         message="file not found")
    
    try:
        content = data.get("content", "")
        create_file_in_ixpconfigs(filename, content)
        logging.info(f"Config file updated: {filename}")
        return success_2xx(message="file updated successfully")
    except Exception as e:
        logging.error(f"Error updating config {filename}: {e}")
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")

@router.post("/resources/{filename}", status_code=status.HTTP_200_OK)
async def update_resource_file(filename: str, data: dict, response: Response):
    """Aggiorna un file resource esistente"""
    file_path = RESOURCES_DIR / filename
    
    if not file_path.exists():
        return error_4xx(response=response,
                         status_code=status.HTTP_404_NOT_FOUND,
                         message="file not found")
    
    try:
        content = data.get("content", "")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        logging.info(f"Resource file updated: {filename}")
        return success_2xx(message="file updated successfully")
    except Exception as e:
        logging.error(f"Error updating resource {filename}: {e}")
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")

# ==================== DELETE FILES ====================

@router.delete("/ixpconfigs/{filename}", status_code=status.HTTP_200_OK)
async def delete_ixpconfigs_file(filename: str, response: Response):
    """Elimina un file di configurazione"""
    file_path = CONFIGS_DIR / filename
    
    if not file_path.exists():
        return error_4xx(response=response,
                         status_code=status.HTTP_404_NOT_FOUND,
                         message="file not found")
    
    try:
        file_path.unlink()
        logging.info(f"Config file deleted: {filename}")
        return success_2xx(message="file deleted successfully")
    except Exception as e:
        logging.error(f"Error deleting config {filename}: {e}")
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")

@router.delete("/resources/{filename}", status_code=status.HTTP_200_OK)
async def delete_resources_file(filename: str, response: Response):
    """Elimina un file resource"""
    file_path = RESOURCES_DIR / filename
    
    if not file_path.exists():
        return error_4xx(response=response,
                         status_code=status.HTTP_404_NOT_FOUND,
                         message="file not found")
    
    try:
        file_path.unlink()
        logging.info(f"Resource file deleted: {filename}")
        return success_2xx(message="file deleted successfully")
    except Exception as e:
        logging.error(f"Error deleting resource {filename}: {e}")
        return error_5xx(response=response,
                         message=f"server error: {str(e)}")
