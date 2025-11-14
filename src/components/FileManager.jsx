import React, { useState } from 'react';
import { Button, Form, ListGroup, Modal } from 'react-bootstrap';

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentFile, setCurrentFile] = useState({ name: '', content: '' });
  const [editIndex, setEditIndex] = useState(null);

  const handleShowModal = (index = null) => {
    if (index !== null) {
      setCurrentFile(files[index]);
      setEditIndex(index);
    } else {
      setCurrentFile({ name: '', content: '' });
      setEditIndex(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleChange = (e) => {
    setCurrentFile({ ...currentFile, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (editIndex !== null) {
      const updatedFiles = [...files];
      updatedFiles[editIndex] = currentFile;
      setFiles(updatedFiles);
    } else {
      setFiles([...files, currentFile]);
    }
    setShowModal(false);
  };

  const handleDelete = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <>
      <Button variant="primary" onClick={() => handleShowModal()}>Nuovo file</Button>
      <ListGroup className="mt-3">
        {files.map((file, idx) => (
          <ListGroup.Item key={idx}>
            <div className="d-flex justify-content-between align-items-center">
              <div>{file.name}</div>
              <div>
                <Button size="sm" onClick={() => handleShowModal(idx)} className="mx-1">Modifica</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(idx)}>Elimina</Button>
              </div>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editIndex !== null ? 'Modifica file' : 'Crea file'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Nome</Form.Label>
              <Form.Control
                name="name"
                value={currentFile.name}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mt-2">
              <Form.Label>Contenuto</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="content"
                value={currentFile.content}
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Annulla</Button>
          <Button variant="primary" onClick={handleSave}>{editIndex !== null ? 'Salva modifiche' : 'Crea'}</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FileManager;
