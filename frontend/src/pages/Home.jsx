import React, { useState } from 'react';
import { Container, Card, Button, Alert, Badge } from 'react-bootstrap';

const Home = () => {
  const [labStatus, setLabStatus] = useState('stopped'); // 'stopped', 'starting', 'running', 'stopping'
  const [message, setMessage] = useState('');

  const handleStart = async () => {
    setLabStatus('starting');
    setMessage('Avvio del Digital Twin in corso...');
    
    // TODO: Chiamata API backend per avviare il lab
    // Simulazione per ora
    setTimeout(() => {
      setLabStatus('running');
      setMessage('Digital Twin avviato con successo!');
    }, 2000);
  };

  const handleStop = async () => {
    setLabStatus('stopping');
    setMessage('Arresto del Digital Twin in corso...');
    
    // TODO: Chiamata API backend per fermare il lab
    // Simulazione per ora
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
      <div className="text-center mb-5">
        <h1 style={{ color: 'hsl(200, 100%, 70%)', fontSize: '3rem', fontWeight: 700 }}>
          IXP Digital Twin Control
        </h1>
        <p style={{ color: 'hsl(200, 100%, 90%)', fontSize: '1.2rem' }}>
          Gestisci il laboratorio virtuale IXP
        </p>
      </div>

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
        background: 'hsl(200, 10%, 20%)',
        border: '1px solid hsl(200, 100%, 40%)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <Card.Header className="text-center" style={{
          background: 'hsl(200, 10%, 15%)',
          borderBottom: '1px solid hsl(200, 100%, 40%)',
          padding: '1.5rem'
        }}>
          <h3 style={{ color: 'hsl(200, 100%, 90%)', marginBottom: '1rem' }}>
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
                ? 'hsl(120, 60%, 40%, 0.2)' 
                : labStatus === 'stopped'
                ? 'hsl(0, 0%, 40%, 0.2)'
                : 'hsl(45, 100%, 50%, 0.2)',
              border: `3px solid ${
                labStatus === 'running' 
                  ? 'hsl(120, 60%, 50%)' 
                  : labStatus === 'stopped'
                  ? 'hsl(0, 0%, 50%)'
                  : 'hsl(45, 100%, 50%)'
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
                background: 'hsl(120, 100%, 40%, 0.2)',
                border: '1px solid hsl(120, 100%, 40%)',
                color: 'hsl(120, 100%, 60%)',
                minWidth: '140px',
                fontWeight: 600
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
                background: 'hsl(0, 100%, 40%, 0.2)',
                border: '1px solid hsl(0, 100%, 40%)',
                color: 'hsl(0, 100%, 60%)',
                minWidth: '140px',
                fontWeight: 600
              }}
            >
              {labStatus === 'stopping' ? 'Arresto...' : '⏹️ Stop Lab'}
            </Button>
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid hsl(200, 20%, 30%)' }}>
            <p style={{ color: 'hsl(200, 50%, 60%)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <strong>Info:</strong>
            </p>
            <p style={{ color: 'hsl(200, 100%, 90%)', fontSize: '0.9rem' }}>
              {labStatus === 'stopped' && 'Il laboratorio è pronto per essere avviato.'}
              {labStatus === 'starting' && 'Inizializzazione dei container e configurazione rete...'}
              {labStatus === 'running' && 'Il laboratorio è operativo. Tutti i servizi sono attivi.'}
              {labStatus === 'stopping' && 'Terminazione dei processi e pulizia delle risorse...'}
            </p>
          </div>
        </Card.Body>
      </Card>

      <div className="text-center mt-5">
        <p style={{ color: 'hsl(200, 50%, 60%)' }}>
          Configura i file di laboratorio nella sezione <strong>Settings</strong>
        </p>
      </div>
    </Container>
  );
};

export default Home;
