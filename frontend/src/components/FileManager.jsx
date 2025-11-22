import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, ListGroup, Modal, Alert, Tabs, Tab, Badge } from 'react-bootstrap';
import ConfigForm from './ConfigForm';

const FileManager = () => {
  const [configs, setConfigs] = useState([]);
  const [resources, setResources] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentFile, setCurrentFile] = useState({ name: '', content: '' });
  const [fileType, setFileType] = useState('config');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('configs');

  // Ref per input file
  const fileInputRef = useRef(null);

  // Template IXP Config
  const IXP_CONFIG_TEMPLATE = {
    scenario_name: "namex_ixp",
    host_interface: null,
    peering_lan: {
      "4": "193.201.28.0/23",
      "6": "2001:7f8:10::/48"
    },
    peering_configuration: {
      type: "ixp_manager",
      path: "config_peerings.json"
    },
    rib_dumps: {
      type: "open_bgpd",
      dumps: {
        "4": "rib_v4.dump",
        "6": "rib_v6.dump"
      }
    },
    route_servers: {
      rs1_v4: {
        type: "open_bgpd",
        image: "kathara/openbgpd",
        name: "rs1_v4",
        as_num: 196959,
        config: "rs1-rom-v4.conf",
        address: "193.201.28.60"
      }
    }
  };

  // ... (mantieni tutte le funzioni fetchConfigs, createConfig, etc.)

  const fetchConfigs = async () => {
    try {
      const res = await fetch('http://localhost:5000/configs');
      if (!res.ok) throw new Error('Errore nel caricamento dei config');
      const data = await res.json();
      setConfigs(data);
    } catch (error) {
      setError('Impossibile caricare i config');
      console.error(error);
    }
  };

  const createConfig = async (file) => {
    try {
      const response = await fetch('http://localhost:5000/configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      await fetchConfigs();
      setError('');
    } catch (error) {
      setError(error.message || 'Errore nella creazione del config');
    }
  };

  const updateConfig = async (file) => {
    try {
      const response = await fetch(`http://localhost:5000/configs/${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: file.content }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      await fetchConfigs();
      setError('');
    } catch (error) {
      setError(error.message || 'Errore nell\'aggiornamento del config');
    }
  };

  const deleteConfig = async (fileName) => {
    try {
      const response = await fetch(`http://localhost:5000/configs/${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      await fetchConfigs();
      setError('');
    } catch (error) {
      setError(error.message || 'Errore nell\'eliminazione del config');
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch('http://localhost:5000/resources');
      if (!res.ok) throw new Error('Errore nel caricamento dei resources');
      const data = await res.json();
      setResources(data);
    } catch (error) {
      setError('Impossibile caricare i resources');
      console.error(error);
    }
  };

  const createResource = async (file) => {
    try {
      const response = await fetch('http://localhost:5000/resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      await fetchResources();
      setError('');
    } catch (error) {
      setError(error.message || 'Errore nella creazione del resource');
    }
  };

  const updateResource = async (file) => {
    try {
      const response = await fetch(`http://localhost:5000/resources/${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: file.content }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      await fetchResources();
      setError('');
    } catch (error) {
      setError(error.message || 'Errore nell\'aggiornamento del resource');
    }
  };

  const deleteResource = async (fileName) => {
    try {
      const response = await fetch(`http://localhost:5000/resources/${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      await fetchResources();
      setError('');
    } catch (error) {
      setError(error.message || 'Errore nell\'eliminazione del resource');
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchResources();
  }, []);

  // Nuova funzione per gestire upload file
  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      const fileName = file.name;

      // Validazione per tipo config
      if (type === 'config') {
        if (!fileName.endsWith('.conf')) {
          setError('I file config devono avere estensione .conf');
          return;
        }

        // Verifica che sia un JSON valido
        try {
          JSON.parse(content);
        } catch (err) {
          setError('Il file config deve contenere JSON valido');
          return;
        }
      } else {
        // Validazione per resources
        const validExtensions = ['.json', '.dump', '.conf'];
        const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));

        if (!hasValidExt) {
          setError('I file resource devono avere estensione .json, .dump o .conf');
          return;
        }
      }

      // Imposta il file caricato
      setCurrentFile({ name: fileName, content });
      setFileType(type);
      setIsEditing(false);
      setShowModal(true);
      setError('');
    };

    reader.onerror = () => {
      setError('Errore nella lettura del file');
    };

    reader.readAsText(file);

    // Reset input per permettere di caricare lo stesso file più volte
    event.target.value = '';
  };

  const handleUploadClick = (type) => {
    setFileType(type);
    fileInputRef.current?.click();
  };

  const handleShowModal = (file = null, type = 'config') => {
    if (file) {
      setCurrentFile({ ...file });
      setIsEditing(true);
    } else {
      const template = type === 'config'
        ? {
          name: 'ixp.conf',
          content: JSON.stringify(IXP_CONFIG_TEMPLATE, null, 4)
        }
        : { name: 'nuovo-resource.json', content: '' };
      setCurrentFile(template);
      setIsEditing(false);
    }
    setFileType(type);
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleChange = (e) => {
    setCurrentFile({ ...currentFile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!currentFile.name.trim()) {
      setError('Il nome del file è obbligatorio');
      return;
    }

    if (fileType === 'config') {
      if (isEditing) {
        await updateConfig(currentFile);
      } else {
        await createConfig(currentFile);
      }
    } else {
      if (isEditing) {
        await updateResource(currentFile);
      } else {
        await createResource(currentFile);
      }
    }

    if (!error) {
      setShowModal(false);
    }
  };

  const handleDelete = (fileName, type) => {
    if (window.confirm(`Sei sicuro di voler eliminare "${fileName}"?`)) {
      if (type === 'config') {
        deleteConfig(fileName);
      } else {
        deleteResource(fileName);
      }
    }
  };

  const getFileExtensionBadge = (filename) => {
    const ext = filename.split('.').pop().toUpperCase();
    const colorMap = {
      'CONF': 'primary',
      'JSON': 'info',
      'DUMP': 'warning'
    };
    return <Badge bg={colorMap[ext] || 'secondary'}>{ext}</Badge>;
  };

  const renderFileList = (files, type) => (
    <ListGroup className="mt-3">
      {files.length === 0 ? (
        <ListGroup.Item className="text-center" style={{ color: 'hsl(200, 50%, 60%)' }}>
          Nessun file presente
        </ListGroup.Item>
      ) : (
        files.map((file, idx) => (
          <ListGroup.Item key={idx}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{file.name}</strong>
                <span className="ms-2">{getFileExtensionBadge(file.name)}</span>
              </div>
              <div>
                <Button
                  size="sm"
                  onClick={() => handleShowModal(file, type)}
                  className="mx-1"
                >
                  Modifica
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(file.name, type)}
                >
                  Elimina
                </Button>
              </div>
            </div>
          </ListGroup.Item>
        ))
      )}
    </ListGroup>
  );

  return (
    <>
      <h1>IXP File Manager</h1>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Input file nascosto */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept={fileType === 'config' ? '.conf' : '.json,.dump,.conf'}
        onChange={(e) => handleFileUpload(e, fileType)}
      />

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="configs" title={`IXP Configurations (${configs.length})`}>
          <div className="d-flex gap-2 mb-3">
            <Button variant="primary" onClick={() => handleShowModal(null, 'config')}>
              Nuovo Config
            </Button>
            <Button variant="success" onClick={() => handleUploadClick('config')}>
              📁 Carica da File
            </Button>
          </div>
          {renderFileList(configs, 'config')}
        </Tab>

        <Tab eventKey="resources" title={`Resources (${resources.length})`}>
          <div className="d-flex gap-2 mb-3">
            <Button variant="primary" onClick={() => handleShowModal(null, 'resource')}>
              Nuovo Resource
            </Button>
            <Button variant="success" onClick={() => handleUploadClick('resource')}>
              📁 Carica da File
            </Button>
          </div>
          {renderFileList(resources, 'resource')}
        </Tab>
      </Tabs>

      <Modal show={showModal} onHide={handleCloseModal} size="xl" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? 'Modifica' : 'Crea'} {fileType === 'config' ? 'Config IXP' : 'Resource'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {fileType === 'config' ? (
            <ConfigForm
              initialData={currentFile.content}
              initialName={currentFile.name}  // Passa il nome del file
              isEditing={isEditing}
              onSave={(fileData) => {  // Ora riceve un oggetto con name e content
                setCurrentFile(fileData);
                // Salva con il nome aggiornato
                if (isEditing) {
                  updateConfig(fileData);
                } else {
                  createConfig(fileData);
                }
                if (!error) {
                  setShowModal(false);
                }
              }}
              onCancel={handleCloseModal}
            />
          ) : (
            <Form>
              <Form.Group>
                <Form.Label>Nome file</Form.Label>
                <Form.Control
                  name="name"
                  value={currentFile.name}
                  onChange={handleChange}
                  disabled={isEditing}
                  placeholder="nome.json / nome.dump / nome.conf"
                />
                <Form.Text className="text-muted">
                  Estensioni valide: .json, .dump, .conf
                </Form.Text>
              </Form.Group>
              <Form.Group className="mt-3">
                <Form.Label>Contenuto</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={12}
                  name="content"
                  value={currentFile.content}
                  onChange={handleChange}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        {fileType !== 'config' && (
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Annulla
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {isEditing ? 'Salva modifiche' : 'Crea'}
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
};

export default FileManager;
