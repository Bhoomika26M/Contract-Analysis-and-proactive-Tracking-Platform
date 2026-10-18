import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div style={{ width: '250px', backgroundColor: '#f8f9fa', height: '100vh', padding: '20px', borderRight: '1px solid #ddd', boxSizing: 'border-box' }}>
      <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
        <li style={{ marginBottom: '15px' }}><Link to="/dashboard" style={{ textDecoration: 'none', color: '#333', fontSize: '18px' }}>Dashboard</Link></li>
        <li style={{ marginBottom: '15px' }}><Link to="/contracts" style={{ textDecoration: 'none', color: '#333', fontSize: '18px' }}>Contracts</Link></li>
        <li style={{ marginBottom: '15px' }}><Link to="/obligations" style={{ textDecoration: 'none', color: '#333', fontSize: '18px' }}>Obligations</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;