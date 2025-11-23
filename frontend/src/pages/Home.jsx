import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Button, Alert, Badge, Form, Spinner, Row, Col, ProgressBar } from 'react-bootstrap';

const API_BASE = 'http://localhost:8000/ixp';
const CONFIGS_API = 'http://localhost:5000/configs';

const Home = () => {
  const [labStatus, setLabStatus] = useState('stopped');
  const [message, setMessage] = useState('');
  const [confFiles, setConfFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('ixp.conf');
  const [devices, setDevices] = useState([]);
  const [statsPollingEnabled, setStatsPollingEnabled] = useState(true);
  
  const pollingRef = useRef(null);
  const statsPollingRef = useRef(null);

  const fetchConfigFiles = async () => {
    try {
      const res = await fetch(CONFIGS_API);
      if (!res.ok) return;
      const data = await res.json();
      const confNames = data.filter(f => f.name.endsWith('.conf')).map(f => f.name);
      setConfFiles(confNames);
      if (confNames.length > 0 && !confNames.includes(selectedFile)) {
        setSelectedFile(confNames[0]);
      }
    } catch (e) {
      console.error('Errore caricando file config:', e);
    }
  };

  const fetchLabStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/running`);
      if (!res.ok) {
        setLabStatus('stopped');
        setDevices([]);
        return;
      }
      const data = await res.json();
      
      if (data.info && data.info.hash) {
        setLabStatus('running');
        setMessage(`Lab attivo. Hash: ${data.info.hash}`);
      } else {
        setLabStatus('stopped');
        setMessage('');
        setDevices([]);
      }
    } catch {
      setLabStatus('stopped');
      setMessage('');
      setDevices([]);
    }
  };

  const fetchDevices = async () => {
    if (labStatus !== 'running') return;
    
    try {
      const res = await fetch(`${API_BASE}/devices`);
      if (!res.ok) return;
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (e) {
      console.error('Errore caricando dispositivi:', e);
    }
  };

  useEffect(() => {
    fetchConfigFiles();
    fetchLabStatus();
    pollingRef.current = setInterval(fetchLabStatus, 5000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (statsPollingRef.current) {
      clearInterval(statsPollingRef.current);
      statsPollingRef.current = null;
    }

    if (labStatus === 'running' && statsPollingEnabled) {
      fetchDevices();
      statsPollingRef.current = setInterval(fetchDevices, 5000);
    }

    return () => {
      if (statsPollingRef.current) {
        clearInterval(statsPollingRef.current);
        statsPollingRef.current = null;
      }
    };
  }, [labStatus, statsPollingEnabled]);

  const handleStart = async () => {
    try {
      setLabStatus('starting');
      setMessage(`Avvio del Digital Twin con file ${selectedFile} in corso...`);

      const res = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedFile }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Errore nell\'avvio del lab');
      }

      const data = await res.json();
      setMessage(`Digital Twin avviato! Hash: ${data.lab_hash}`);
    } catch (error) {
      console.error('Errore start lab:', error);
      setLabStatus('stopped');
      setMessage(`Errore durante l'avvio: ${error.message}`);
    }
  };

  const handleStop = async () => {
    try {
      setLabStatus('stopping');
      setMessage('Arresto del Digital Twin in corso...');

      const res = await fetch(`${API_BASE}/wipe`, { method: 'POST' });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Errore nell\'arresto del lab');
      }

      setLabStatus('stopped');
      setMessage('Digital Twin arrestato.');
      setDevices([]);
    } catch (error) {
      console.error('Errore stop lab:', error);
      setLabStatus('running');
      setMessage(`Errore durante l'arresto: ${error.message}`);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      stopped: { bg: 'secondary', text: 'Arrestato' },
      starting: { bg: 'warning', text: 'Avvio in corso...' },
      running: { bg: 'success', text: 'In esecuzione' },
      stopping: { bg: 'warning', text: 'Arresto in corso...' }
    };
    const config = statusConfig[labStatus];
    return <Badge bg={config.bg} className="fs-6">{config.text}</Badge>;
  };

  const getDeviceStatusBadge = (status) => {
    const statusMap = {
      'running': { bg: 'success', text: 'Running' },
      'stopped': { bg: 'danger', text: 'Stopped' },
      'error': { bg: 'warning', text: 'Error' },
      'not_found': { bg: 'secondary', text: 'Not Found' }
    };
    const config = statusMap[status] || { bg: 'secondary', text: 'Unknown' };
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  const getProgressVariant = (percent) => {
    if (percent < 50) return 'success';
    if (percent < 80) return 'warning';
    return 'danger';
  };

  return (
    <Container className="py-5" style={{ maxWidth: '1200px' }}>
      {message && (
        <Alert 
          variant={labStatus === 'running' ? 'success' : labStatus === 'stopped' ? 'info' : 'warning'}
          dismissible 
          onClose={() => setMessage('')}
          className="mb-4"
        >
          {message}
        </Alert>
      )}

      {/* Card Controllo Lab con Select Config Integrato */}
      <Card style={{ 
        background: '#ffffff',
        border: '1px solid #e0e0e0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        marginBottom: '1.5rem'
      }}>
        <Card.Header className="text-center" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderBottom: 'none',
          padding: '1.5rem'
        }}>
          <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
            🚀 Digital Twin IXP Lab
          </h3>
          {getStatusBadge()}
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="align-items-center mb-4">
            <Col md={4}>
              <Form.Group>
                <Form.Label style={{ fontWeight: 600, color: '#333', marginBottom: '0.5rem' }}>
                  📁 File Configurazione
                </Form.Label>
                <Form.Select 
                  value={selectedFile} 
                  onChange={e => setSelectedFile(e.target.value)}
                  disabled={labStatus !== 'stopped'}
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    padding: '0.6rem'
                  }}
                >
                  {confFiles.map((file) => (
                    <option key={file} value={file}>{file}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8} className="text-center">
              <div style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 1rem',
                borderRadius: '50%',
                background: labStatus === 'running' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : labStatus === 'stopped'
                  ? '#f5f5f5'
                  : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: `3px solid ${
                  labStatus === 'running' 
                    ? '#667eea' 
                    : labStatus === 'stopped'
                    ? '#9e9e9e'
                    : '#f5576c'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                {labStatus === 'running' && '▶️'}
                {labStatus === 'stopped' && '⏹️'}
                {(labStatus === 'starting' || labStatus === 'stopping') && <Spinner animation="border" variant="light" />}
              </div>

              <div className="d-flex gap-3 justify-content-center">
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleStart}
                  disabled={labStatus !== 'stopped'}
                  style={{
                    minWidth: '150px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    border: 'none',
                    boxShadow: '0 4px 8px rgba(17, 153, 142, 0.3)'
                  }}
                >
                  ▶️ Start Lab
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleStop}
                  disabled={labStatus === 'stopped'}
                  style={{
                    minWidth: '150px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                    border: 'none',
                    boxShadow: '0 4px 8px rgba(235, 51, 73, 0.3)'
                  }}
                >
                  ⏹️ Stop Lab
                </Button>
              </div>
            </Col>
          </Row>

          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e0e0e0' }}>
            <Row>
              <Col md={12} className="text-center">
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 0 }}>
                  {labStatus === 'stopped' && '💡 Il laboratorio è pronto per essere avviato. Seleziona un file di configurazione e premi Start.'}
                  {labStatus === 'starting' && '⚙️ Inizializzazione dei container e configurazione rete in corso...'}
                  {labStatus === 'running' && '✅ Il laboratorio è operativo. Tutti i servizi sono attivi.'}
                  {labStatus === 'stopping' && '🔄 Terminazione dei processi e pulizia delle risorse...'}
                </p>
              </Col>
            </Row>
          </div>
        </Card.Body>
      </Card>

      {/* Card Dispositivi e Statistiche */}
      {labStatus === 'running' && (
        <Card style={{ 
          background: '#ffffff',
          border: '1px solid #e0e0e0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          <Card.Header style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderBottom: 'none',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h5 style={{ marginBottom: 0, fontWeight: 600 }}>
              📊 Dispositivi Lab ({devices.length})
            </h5>
            <Form.Check 
              type="switch"
              id="stats-polling-switch"
              label={
                <span style={{ color: 'white', fontWeight: 500 }}>
                  Auto-refresh (5s)
                  {statsPollingEnabled && (
                    <Spinner animation="grow" size="sm" className="ms-2" variant="light" />
                  )}
                </span>
              }
              checked={statsPollingEnabled}
              onChange={(e) => setStatsPollingEnabled(e.target.checked)}
              style={{ fontSize: '0.95rem' }}
            />
          </Card.Header>
          <Card.Body style={{ padding: 0 }}>
            {devices.length === 0 ? (
              <div className="text-center p-5" style={{ color: '#999' }}>
                <Spinner animation="border" size="sm" className="me-2" />
                Caricamento dispositivi...
              </div>
            ) : (
              <div className="p-3">
                {devices.map((device, idx) => (
                  <Card key={idx} className="mb-3" style={{ 
                    border: '1px solid #e0e0e0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}>
                    <Card.Body className="p-3">
                      <Row className="align-items-center mb-3">
                        <Col md={6}>
                          <h6 style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#333' }}>
                            🖥️ {device.name}
                          </h6>
                          <div>
                            {getDeviceStatusBadge(device.status)}
                            <Badge bg="info" className="ms-2">
                              {device.interfaces} interfacce
                            </Badge>
                            <small className="ms-2 text-muted">⏱️ {device.uptime}</small>
                          </div>
                        </Col>
                        <Col md={6} className="text-md-end">
                          <small className="text-muted" style={{ fontWeight: 500 }}>
                            📥 RX: {device.network_rx_mb} MB | 📤 TX: {device.network_tx_mb} MB
                          </small>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6} className="mb-2">
                          <div className="d-flex justify-content-between mb-1">
                            <small style={{ fontWeight: 600, color: '#555' }}>⚡ CPU</small>
                            <small style={{ fontWeight: 700, color: '#333' }}>{device.cpu_percent}%</small>
                          </div>
                          <ProgressBar 
                            now={device.cpu_percent} 
                            variant={getProgressVariant(device.cpu_percent)}
                            style={{ height: '10px', borderRadius: '5px' }}
                          />
                        </Col>
                        <Col md={6} className="mb-2">
                          <div className="d-flex justify-content-between mb-1">
                            <small style={{ fontWeight: 600, color: '#555' }}>💾 Memoria</small>
                            <small style={{ fontWeight: 700, color: '#333' }}>
                              {device.memory_usage_mb} / {device.memory_limit_mb} MB ({device.memory_percent}%)
                            </small>
                          </div>
                          <ProgressBar 
                            now={device.memory_percent} 
                            variant={getProgressVariant(device.memory_percent)}
                            style={{ height: '10px', borderRadius: '5px' }}
                          />
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <div className="text-center mt-5">
        <p style={{ color: '#999', fontSize: '0.9rem' }}>
          ⚙️ Configura i file di laboratorio nella sezione <strong style={{ color: '#667eea' }}>Settings</strong>
        </p>
      </div>
    </Container>
  );
};

export default Home;
