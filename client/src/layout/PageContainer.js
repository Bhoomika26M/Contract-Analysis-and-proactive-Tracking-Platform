import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const PageContainer = ({ children }) => {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F4F7FE' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Navbar />
        <main style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageContainer;