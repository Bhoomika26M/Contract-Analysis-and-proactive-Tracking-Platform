import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar'; // Adjust path if needed

const PageContainer = ({ children, activeRole, setActiveRole }) => {
  const location = useLocation();

  // Listen to the URL. If the user types a direct link, force the role to match!
  useEffect(() => {
    const path = location.pathname;
    
    if (path === '/legal') setActiveRole('Legal Manager');
    else if (path === '/compliance') setActiveRole('Compliance Officer');
    else if (path === '/contract-manager') setActiveRole('Contract Manager');
    else if (path === '/department-head') setActiveRole('Department Head');
    else if (path === '/employee') setActiveRole('Employee');
    else if (path === '/users') setActiveRole('Administrator'); // Only Admin can see this
    
  }, [location.pathname, setActiveRole]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar now gets the perfectly synced role */}
      <Sidebar activeRole={activeRole} setActiveRole={setActiveRole} />
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;