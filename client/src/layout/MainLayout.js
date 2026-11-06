import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './navigation.css';

const MainLayout = () => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        {/* The Outlet is where the Dashboard or Contracts page will render */}
        <div className="app-main" style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#f5f8fa' }}>
          <Outlet /> 
        </div>
      </div>
    </div>
  );
};

export default MainLayout;