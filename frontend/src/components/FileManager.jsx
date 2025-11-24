import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, ListGroup, Modal, Alert, Tabs, Tab, Badge, Container, Card } from 'react-bootstrap';
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

  const fileInputRef = useRef(null);

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

  const fetchConfigs = async () => {
    try {
      const res = await fetch('http://localhost:5000/configs');
      if (!res.ok) throw new Error('Error loading configs');
      const data = await res.json();
      setConfigs(data);
    } catch (error) {
      setError('Unable to load configs');
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
      setError(error.message || 'Error creating config');
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
      setError(error.message || 'Error updating config');
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
      setError(error.message || 'Error deleting config');
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch('http://localhost:5000/resources');
      if (!res.ok) throw new Error('Error loading resources');
      const data = await res.json();
      setResources(data);
    } catch (error) {
      setError('Unable to load resources');
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
      setError(error.message || 'Error creating resource');
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
      setError(error.message || 'Error updating resource');
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
      setError(error.message || 'Error deleting resource');
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchResources();
  }, []);

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      const fileName = file.name;

      if (type === 'config') {
        if (!fileName.endsWith('.conf')) {
          setError('Config files must have .conf extension');
          return;
        }

        try {
          JSON.parse(content);
        } catch (err) {
          setError('Config file must contain valid JSON');
          return;
        }
      } else {
        const validExtensions = ['.json', '.dump', '.conf'];
        const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));

        if (!hasValidExt) {
          setError('Resource files must have .json, .dump or .conf extension');
          return;
        }
      }

      setCurrentFile({ name: fileName, content });
      setFileType(type);
      setIsEditing(false);
      setShowModal(true);
      setError('');
    };

    reader.onerror = () => {
      setError('Error reading file');
    };

    reader.readAsText(file);
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
        : { name: 'new-resource.json', content: '' };
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
      setError('File name is required');
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
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
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
        <ListGroup.Item className="text-center" style={{ color: '#6c757d', background: '#f8f9fa' }}>
          No files available
        </ListGroup.Item>
      ) : (
        files.map((file, idx) => (
          <ListGroup.Item key={idx} style={{ border: '1px solid #dee2e6', borderRadius: '6px', marginBottom: '0.5rem' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong style={{ color: '#212529' }}>{file.name}</strong>
                <span className="ms-2">{getFileExtensionBadge(file.name)}</span>
              </div>
              <div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleShowModal(file, type)}
                  className="mx-1"
                  style={{ background: '#007bff', border: 'none' }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(file.name, type)}
                  style={{ background: '#dc3545', border: 'none' }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </ListGroup.Item>
        ))
      )}
    </ListGroup>
  );

  return (
    <Container className="py-5" style={{ maxWidth: '1200px' }}>
      <Card style={{ 
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '8px'
      }}>
        <Card.Header style={{
          background: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
          padding: '1.5rem'
        }}>
          <h3 style={{ marginBottom: 0, fontWeight: 600, color: '#212529' }}>
            ⚙️ IXP File Manager
          </h3>
        </Card.Header>
        <Card.Body className="p-4">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

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
                <Button 
                  variant="primary" 
                  onClick={() => handleShowModal(null, 'config')}
                  style={{ background: '#007bff', border: 'none', borderRadius: '6px' }}
                >
                  New Config
                </Button>
                <Button 
                  variant="success" 
                  onClick={() => handleUploadClick('config')}
                  style={{ background: '#28a745', border: 'none', borderRadius: '6px' }}
                >
                  📁 Upload from File
                </Button>
              </div>
              {renderFileList(configs, 'config')}
            </Tab>

            <Tab eventKey="resources" title={`Resources (${resources.length})`}>
              <div className="d-flex gap-2 mb-3">
                <Button 
                  variant="primary" 
                  onClick={() => handleShowModal(null, 'resource')}
                  style={{ background: '#007bff', border: 'none', borderRadius: '6px' }}
                >
                  New Resource
                </Button>
                <Button 
                  variant="success" 
                  onClick={() => handleUploadClick('resource')}
                  style={{ background: '#28a745', border: 'none', borderRadius: '6px' }}
                >
                  📁 Upload from File
                </Button>
              </div>
              {renderFileList(resources, 'resource')}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} size="xl" scrollable>
        <Modal.Header closeButton style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
          <Modal.Title style={{ color: '#212529', fontWeight: 600 }}>
            {isEditing ? 'Edit' : 'Create'} {fileType === 'config' ? 'IXP Config' : 'Resource'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#ffffff' }}>
          {fileType === 'config' ? (
            <ConfigForm
              initialData={currentFile.content}
              initialName={currentFile.name}
              isEditing={isEditing}
              onSave={(fileData) => {
                setCurrentFile(fileData);
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
                <Form.Label style={{ fontWeight: 600, color: '#495057' }}>File name</Form.Label>
                <Form.Control
                  name="name"
                  value={currentFile.name}
                  onChange={handleChange}
                  disabled={isEditing}
                  placeholder="filename.json / filename.dump / filename.conf"
                  style={{ borderRadius: '6px', border: '1px solid #ced4da' }}
                />
                <Form.Text className="text-muted">
                  Valid extensions: .json, .dump, .conf
                </Form.Text>
              </Form.Group>
              <Form.Group className="mt-3">
                <Form.Label style={{ fontWeight: 600, color: '#495057' }}>Content</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={12}
                  name="content"
                  value={currentFile.content}
                  onChange={handleChange}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    borderRadius: '6px',
                    border: '1px solid #ced4da'
                  }}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        {fileType !== 'config' && (
          <Modal.Footer style={{ background: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
            <Button 
              variant="secondary" 
              onClick={handleCloseModal}
              style={{ background: '#6c757d', border: 'none', borderRadius: '6px' }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              style={{ background: '#007bff', border: 'none', borderRadius: '6px' }}
            >
              {isEditing ? 'Save changes' : 'Create'}
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </Container>
  );
};

export default FileManager;
