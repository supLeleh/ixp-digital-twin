import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';

const AppNavbar = () => {
  const location = useLocation();

  return (
    <Navbar expand="lg" className="mb-4" style={{ 
      background: 'hsl(200, 10%, 20%)',
      borderBottom: '1px solid hsl(200, 100%, 40%)'
    }}>
      <Container>
        <Navbar.Brand as={Link} to="/" style={{ 
          color: 'hsl(200, 100%, 70%)',
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
                color: location.pathname === '/' 
                  ? 'hsl(200, 100%, 70%)' 
                  : 'hsl(200, 100%, 90%)',
                fontWeight: location.pathname === '/' ? 600 : 400,
                borderBottom: location.pathname === '/' 
                  ? '2px solid hsl(200, 100%, 50%)' 
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
                color: location.pathname === '/settings' 
                  ? 'hsl(200, 100%, 70%)' 
                  : 'hsl(200, 100%, 90%)',
                fontWeight: location.pathname === '/settings' ? 600 : 400,
                borderBottom: location.pathname === '/settings' 
                  ? '2px solid hsl(200, 100%, 50%)' 
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
