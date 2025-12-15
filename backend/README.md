# IXP Digital Twin - Backend API

FastAPI-based backend for simulating and managing Internet Exchange Point (IXP) environments using Kathara network emulation framework.

## 🚀 Features

- **Lab Management**: Start, stop, and monitor IXP lab instances
- **Command Execution**: Run commands on virtual network devices
- **RIB Diff Analysis**: Compare BGP routing tables with expected dumps
- **File Management**: Upload and manage configuration files and resources
- **Real-time Monitoring**: Device statistics (CPU, memory, network traffic)
- **Validation**: Configuration file validation before deployment

## 📋 Prerequisites

- Python 3.8+
- [Kathara](https://www.kathara.org/) installed and configured
- Docker (required by Kathara)
- Root/sudo privileges for network emulation

## 🛠️ Installation

### 1. Clone the repository with submodules

**Recommended method (clone with submodule):**

git clone --recurse-submodules <repository-url>
cd backend

Alternative (if already cloned):

git clone <repository-url>
cd backend
git submodule update --init --recursive

2. **Create virtual environment**

python -m venv venv
source venv/bin/activate # Linux/Mac

or
venv\Scripts\activate # Windows

3. **Install dependencies**

pip install -r requirements.txt

4. **Verify submodule**

Check that the digital_twin/ directory is populated:

ls digital_twin/  # Should show ixp/, bin/, etc.

## 🔄 Updating the Submodule

To update digital_twin to the latest version:

git submodule update --remote digital_twin
git add digital_twin
git commit -m "Update digital_twin submodule"

## 🚀 Usage

### Development Mode

uvicorn backend:app --reload --port 8000

### Production Mode

uvicorn backend:app --host 0.0.0.0 --port 8000 --workers 4

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 API Endpoints

### Lab Management
- `POST /ixp/start` - Start IXP lab
- `POST /ixp/wipe` - Stop and clean lab
- `GET /ixp/running` - Get running lab status
- `GET /ixp/devices` - List all devices with stats

### Command Execution
- `POST /ixp/execute_command/{device_name}` - Execute command on device

### RIB Analysis
- `GET /ixp/info/ribs/diff` - Compare RIB with expected dump
  - Query params: `machine_name`, `machine_ip_type` (4/6), `ixp_conf_arg`

### File Management
- `GET /configs` - List configuration files
- `GET /configs/{filename}` - Download config file
- `POST /configs/upload` - Upload config file
- `DELETE /configs/{filename}` - Delete config file
- `GET /resources` - List resource files
- `GET /resources/{filename}` - Download resource file
- `POST /resources/upload` - Upload resource file
- `DELETE /resources/{filename}` - Delete resource file

### Validation
- `POST /validate/conf` - Validate configuration file

## 🔧 Configuration

Environment variables (optional):
LOG_LEVEL=INFO
KATHARA_TIMEOUT=300
MAX_LAB_INSTANCES=5
