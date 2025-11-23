import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Button, Alert, Badge, Form, Spinner } from 'react-bootstrap';

const API_BASE = 'http://localhost:8000/ixp';
const CONFIGS_API = 'http://localhost:5000/configs';

const Home = () => {
    const [labStatus, setLabStatus] = useState('stopped');
    const [message, setMessage] = useState('');
    const [confFiles, setConfFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState('ixp.conf');
    const pollingRef = useRef(null);

    // Carica i file config disponibili
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

    // Funzione per recuperare lo stato del lab
    const fetchLabStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/running`);
            if (!res.ok) {
                setLabStatus('stopped');
                return;
            }
            const data = await res.json();

            // Se c'è un hash nel lab, il lab è running (indipendentemente da discovered)
            if (data.info && data.info.hash) {
                setLabStatus('running');
                setMessage(`Lab attivo. Hash: ${data.info.hash}`);
            } else {
                setLabStatus('stopped');
                setMessage('');
            }
        } catch {
            setLabStatus('stopped');
            setMessage('');
        }
    };


    // Start polling periodico (5s) per aggiornare stato lab
    useEffect(() => {
        fetchConfigFiles();
        fetchLabStatus();
        pollingRef.current = setInterval(fetchLabStatus, 5000);
        return () => clearInterval(pollingRef.current);
    }, []);

    const handleStart = async () => {
        try {
            setLabStatus('starting');
            setMessage(`Avvio del Digital Twin con file ${selectedFile} in corso...`);

            const res = await fetch(`${API_BASE}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: selectedFile }),
            });

            console.log('Start response status:', res.status);

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Errore nell\'avvio del lab');
            }

            const data = await res.json();
            setLabStatus('running');
            setMessage(`Digital Twin avviato! Hash: ${data.lab_hash || data.lab_hash}`);
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

            const res = await fetch(`${API_BASE}/wipe`, {
                method: 'POST',
            });

            console.log('Stop response status:', res.status);

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Errore nell\'arresto del lab');
            }

            setLabStatus('stopped');
            setMessage('Digital Twin arrestato.');
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

            <Form.Group className="mb-4" style={{ maxWidth: 300, margin: '0 auto' }}>
                <Form.Label>Seleziona file di configurazione IXP (.conf):</Form.Label>
                <Form.Select
                    value={selectedFile}
                    onChange={e => setSelectedFile(e.target.value)}
                    disabled={labStatus !== 'stopped'}
                >
                    {confFiles.map((file) => (
                        <option key={file} value={file}>{file}</option>
                    ))}
                </Form.Select>
            </Form.Group>

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
                            border: `3px solid ${labStatus === 'running'
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
                            {(labStatus === 'starting' || labStatus === 'stopping') && <Spinner animation="border" variant="warning" />}
                        </div>
                    </div>

                    <div className="d-flex gap-3 justify-content-center">
                        <Button
                            variant="success"
                            size="lg"
                            onClick={handleStart}
                            disabled={labStatus !== 'stopped'}
                            style={{
                                minWidth: '140px',
                                fontWeight: 600,
                                boxShadow: 'none'
                            }}
                        >
                            Start Lab
                        </Button>
                        <Button
                            variant="danger"
                            size="lg"
                            onClick={handleStop}
                            disabled={labStatus === 'stopped'}
                            style={{
                                minWidth: '140px',
                                fontWeight: 600,
                                boxShadow: 'none'
                            }}
                        >
                            Stop Lab
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
