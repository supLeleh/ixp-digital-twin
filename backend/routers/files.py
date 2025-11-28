from fastapi import APIRouter, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse, JSONResponse
import os
from pathlib import Path
import logging

router = APIRouter(tags=["Files"])

# Directory dei file
CONFIGS_DIR = Path("./ixpconfigs")
RESOURCES_DIR = Path("./resources")


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
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CONFIGS ENDPOINTS ====================

@router.get("/configs", status_code=status.HTTP_200_OK)
async def list_config_files():
    """Lista tutti i file di configurazione (.conf) nella cartella ixpconfigs"""
    files = list_files_in_directory(CONFIGS_DIR)
    # Filtra solo i file .conf
    conf_files = [f for f in files if f['name'].endswith('.conf')]
    return conf_files


@router.get("/configs/{filename}", status_code=status.HTTP_200_OK)
async def get_config_file(filename: str):
    """Scarica un file di configurazione specifico"""
    file_path = CONFIGS_DIR / filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"Config file '{filename}' not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="text/plain"
    )


@router.post("/configs/upload", status_code=status.HTTP_201_CREATED)
async def upload_config_file(file: UploadFile = File(...)):
    """Carica un nuovo file di configurazione"""
    try:
        ensure_directory_exists(CONFIGS_DIR)
        file_path = CONFIGS_DIR / file.filename
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        logging.info(f"Config file uploaded: {file.filename}")
        return {"message": f"File {file.filename} uploaded successfully", "filename": file.filename}
    except Exception as e:
        logging.error(f"Error uploading config file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/configs/{filename}", status_code=status.HTTP_200_OK)
async def delete_config_file(filename: str):
    """Elimina un file di configurazione"""
    file_path = CONFIGS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Config file '{filename}' not found")
    
    try:
        file_path.unlink()
        logging.info(f"Config file deleted: {filename}")
        return {"message": f"File {filename} deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting config file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== RESOURCES ENDPOINTS ====================

@router.get("/resources", status_code=status.HTTP_200_OK)
async def list_resource_files():
    """Lista tutti i file nella cartella resources"""
    return list_files_in_directory(RESOURCES_DIR)


@router.get("/resources/{filename}", status_code=status.HTTP_200_OK)
async def get_resource_file(filename: str):
    """Scarica un file resource specifico"""
    file_path = RESOURCES_DIR / filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"Resource file '{filename}' not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="text/plain"
    )


@router.post("/resources/upload", status_code=status.HTTP_201_CREATED)
async def upload_resource_file(file: UploadFile = File(...)):
    """Carica un nuovo file resource"""
    try:
        ensure_directory_exists(RESOURCES_DIR)
        file_path = RESOURCES_DIR / file.filename
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        logging.info(f"Resource file uploaded: {file.filename}")
        return {"message": f"File {file.filename} uploaded successfully", "filename": file.filename}
    except Exception as e:
        logging.error(f"Error uploading resource file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/resources/{filename}", status_code=status.HTTP_200_OK)
async def delete_resource_file(filename: str):
    """Elimina un file resource"""
    file_path = RESOURCES_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Resource file '{filename}' not found")
    
    try:
        file_path.unlink()
        logging.info(f"Resource file deleted: {filename}")
        return {"message": f"File {filename} deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting resource file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== UTILITY ENDPOINTS ====================

@router.get("/files/all", status_code=status.HTTP_200_OK)
async def list_all_files():
    """Lista tutti i file (configs + resources)"""
    try:
        configs = list_files_in_directory(CONFIGS_DIR)
        resources = list_files_in_directory(RESOURCES_DIR)
        
        return {
            "configs": configs,
            "resources": resources,
            "total": len(configs) + len(resources)
        }
    except Exception as e:
        logging.error(f"Error listing all files: {e}")
        raise HTTPException(status_code=500, detail=str(e))
