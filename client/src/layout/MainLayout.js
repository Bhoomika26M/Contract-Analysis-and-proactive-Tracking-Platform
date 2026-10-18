import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        {/* The Outlet is where the Dashboard or Contracts page will render */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#f4f6f9' }}>
          <Outlet /> 
        </div>
      </div>
    </div>
  );
};

export default MainLayout;