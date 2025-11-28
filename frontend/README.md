# IXP Digital Twin - Frontend

Modern React-based web interface for managing and monitoring IXP (Internet Exchange Point) network simulations.

## 🚀 Features

- **Lab Control Dashboard**: Start/stop IXP labs with visual status indicators
- **Device Monitoring**: Real-time CPU, memory, and network statistics
- **Command Execution**: Run commands on virtual devices with live output
- **RIB Diff Analysis**: Compare BGP routing tables with visual reports
- **File Management**: Upload and manage configuration files
- **Responsive Design**: Modern UI with Bootstrap components
- **Auto-refresh**: Optional polling for live updates

## 📋 Prerequisites

- Node.js 16+ and npm
- Backend API running on port 8000

## 🛠️ Installation

1. **Clone the repository**

git clone <repository-url>
cd frontend

2. **Install dependencies**

npm install

3. **Configure API endpoint** (if needed)

Edit `src/components/Home.jsx`:
const API_BASE = 'http://localhost:8000/ixp';
const CONFIGS_API = 'http://localhost:8000/configs';

## 🚀 Usage

### Development Mode

npm start

Opens browser at http://localhost:3000

### Production Build

Creates optimized build in `build/` directory

### Serve Production Build

npm install -g serve
serve -s build -p 3000

## 🎨 Key Components

### Home Dashboard
- **Lab Status**: Visual indicator (stopped/starting/running/stopping)
- **Configuration Selector**: Choose IXP config file
- **Action Buttons**: Start/Stop lab, Run Command, RIB Diff
- **Device Cards**: Live stats for each network device

### Run Command Modal
- Device selector dropdown
- Command input textarea
- Live output display
- 60-second timeout protection

### RIB Diff Modal
- Route server selection
- IPv4/IPv6 toggle
- Comparison statistics table
- Show/Hide routes functionality
- Download routes as .txt files

## 🔧 Configuration

### API Endpoints
Update in component files if backend URL changes:

const API_BASE = 'http://your-backend:8000/ixp';
const CONFIGS_API = 'http://your-backend:8000/configs';

### Polling Intervals

Adjust in `Home.jsx`:

// Lab status polling (default: 10 seconds)
pollingRef.current = setInterval(fetchLabStatus, 10000);

// Device stats polling (default: 10 seconds)
statsPollingRef.current = setInterval(fetchDevices, 10000);

## 📦 Dependencies

- React 18+
- React Bootstrap
- React Router DOM
- Bootstrap 5