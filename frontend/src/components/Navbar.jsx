import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';

const AppNavbar = () => {
  const location = useLocation();

  return (
    <Navbar expand="lg" className="mb-4" style={{ 
      background: '#ffffff',
      borderBottom: '1px solid #e0e0e0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <Container>
        <Navbar.Brand as={Link} to="/" style={{ 
          color: '#1565c0',
          fontWeight: 700,
          fontSize: '1.5rem'
        }}>
          IXP Digital Twin
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              style={{
                color: location.pathname === '/' ? '#1565c0' : '#666',
                fontWeight: location.pathname === '/' ? 600 : 400,
                borderBottom: location.pathname === '/' 
                  ? '2px solid #1565c0' 
                  : 'none',
                paddingBottom: '0.5rem'
              }}
            >
              Home
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/settings" 
              style={{
                color: location.pathname === '/settings' ? '#1565c0' : '#666',
                fontWeight: location.pathname === '/settings' ? 600 : 400,
                borderBottom: location.pathname === '/settings' 
                  ? '2px solid #1565c0' 
                  : 'none',
                paddingBottom: '0.5rem',
                marginLeft: '1rem'
              }}
            >
              Settings
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
