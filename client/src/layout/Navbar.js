import React from 'react';
import { useNavigate } from 'react-router-dom';
import { primaryButtonStyle } from '../uiStyles';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the JWT token
    localStorage.removeItem('userRole');
    navigate('/login');               // Kick the user back to the login screen
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#ffffff', color: '#1e1e2d', boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: 0 }}>ContractIQ</h3>
      <button 
        onClick={handleLogout} 
        style={{ ...primaryButtonStyle, padding: '8px 15px' }}
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;