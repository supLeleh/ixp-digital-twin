import React, { useState } from 'react';
import { Container, Card, Button, Alert, Badge } from 'react-bootstrap';

const Home = () => {
  const [labStatus, setLabStatus] = useState('stopped'); // 'stopped', 'starting', 'running', 'stopping'
  const [message, setMessage] = useState('');

  const handleStart = async () => {
    setLabStatus('starting');
    setMessage('Avvio del Digital Twin in corso...');
    
    // TODO: Chiamata API backend per avviare il lab
    setTimeout(() => {
      setLabStatus('running');
      setMessage('Digital Twin avviato con successo!');
    }, 2000);
  };

  const handleStop = async () => {
    setLabStatus('stopping');
    setMessage('Arresto del Digital Twin in corso...');
    
    // TODO: Chiamata API backend per fermare il lab
    setTimeout(() => {
      setLabStatus('stopped');
      setMessage('Digital Twin arrestato.');
    }, 2000);
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

  return (
    <Container className="py-5">
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

      <Card style={{ 
        background: '#ffffff',
        border: '1px solid #e0e0e0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <Card.Header className="text-center" style={{
          background: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          padding: '1.5rem'
        }}>
          <h3 style={{ color: '#333', marginBottom: '1rem', fontWeight: 600 }}>
            Stato del Lab
          </h3>
          {getStatusBadge()}
        </Card.Header>
        <Card.Body className="text-center p-5">
          <div className="mb-4">
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 2rem',
              borderRadius: '50%',
              background: labStatus === 'running' 
                ? '#e8f5e9' 
                : labStatus === 'stopped'
                ? '#f5f5f5'
                : '#fff3e0',
              border: `3px solid ${
                labStatus === 'running' 
                  ? '#4caf50' 
                  : labStatus === 'stopped'
                  ? '#9e9e9e'
                  : '#ff9800'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem'
            }}>
              {labStatus === 'running' && '▶️'}
              {labStatus === 'stopped' && '⏹️'}
              {(labStatus === 'starting' || labStatus === 'stopping') && '⏳'}
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-center">
            <Button
              variant="success"
              size="lg"
              onClick={handleStart}
              disabled={labStatus === 'running' || labStatus === 'starting' || labStatus === 'stopping'}
              style={{
                minWidth: '140px',
                fontWeight: 600,
                boxShadow: 'none'
              }}
            >
              {labStatus === 'starting' ? 'Avvio...' : '▶️ Start Lab'}
            </Button>
            <Button
              variant="danger"
              size="lg"
              onClick={handleStop}
              disabled={labStatus === 'stopped' || labStatus === 'starting' || labStatus === 'stopping'}
              style={{
                minWidth: '140px',
                fontWeight: 600,
                boxShadow: 'none'
              }}
            >
              {labStatus === 'stopping' ? 'Arresto...' : '⏹️ Stop Lab'}
            </Button>
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #e0e0e0' }}>
            <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <strong>Info:</strong>
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              {labStatus === 'stopped' && 'Il laboratorio è pronto per essere avviato.'}
              {labStatus === 'starting' && 'Inizializzazione dei container e configurazione rete...'}
              {labStatus === 'running' && 'Il laboratorio è operativo. Tutti i servizi sono attivi.'}
              {labStatus === 'stopping' && 'Terminazione dei processi e pulizia delle risorse...'}
            </p>
          </div>
        </Card.Body>
      </Card>

      <div className="text-center mt-5">
        <p style={{ color: '#999' }}>
          Configura i file di laboratorio nella sezione <strong style={{ color: '#1565c0' }}>Settings</strong>
        </p>
      </div>
    </Container>
  );
};

export default Home;
