import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const linksByRole = {
  Administrator: [
    ['Dashboard', '/dashboard'],
    ['User Management', '/users'],
    ['Contracts', '/contracts'],
    ['Contract Repository', '/repository'],
    ['Contract Approval', '/approvals'],
    ['Obligations', '/obligations'],
    ['Renewals', '/renewals'],
    ['Compliance', '/compliance'],
    ['Reports', '/reports'],
    ['Audit Logs', '/audit'],
    ['Settings', '/settings']
  ],
  'Legal Manager': [
    ['Dashboard', '/dashboard'],
    ['Contracts', '/contracts'],
    ['Contract Repository', '/repository'],
    ['Contract Approval', '/approvals'],
    ['Obligations', '/obligations'],
    ['Renewals', '/renewals'],
    ['Settings', '/settings']
  ],
  'Compliance Officer': [
    ['Dashboard', '/dashboard'],
    ['Compliance', '/compliance'],
    ['Obligations', '/obligations'],
    ['Reports', '/reports'],
    ['Audit Logs', '/audit'],
    ['Settings', '/settings']
  ],
  'Contract Manager': [
    ['Dashboard', '/dashboard'],
    ['Contracts', '/contracts'],
    ['Contract Repository', '/repository'],
    ['Contract Approval', '/approvals'],
    ['Obligations', '/obligations'],
    ['Renewals', '/renewals'],
    ['Settings', '/settings']
  ],
  'Department Head': [
    ['Dashboard', '/dashboard'],
    ['Contracts', '/contracts'],
    ['Obligations', '/obligations'],
    ['Reports', '/reports'],
    ['Settings', '/settings']
  ],
  Employee: [
    ['Dashboard', '/dashboard'],
    ['My Contracts', '/contracts'],
    ['My Tasks', '/obligations'],
    ['Settings', '/settings']
  ]
};

const Sidebar = () => {
  const location = useLocation();
  const userRole = localStorage.getItem('userRole') || 'Employee';
  const links = linksByRole[userRole] || linksByRole.Employee;
  const [hoveredPath, setHoveredPath] = React.useState(null);
  const getLinkStyle = (path) => ({
    display: 'block',
    padding: '12px 20px',
    color: location.pathname === path ? '#ffffff' : '#a1a5b7',
    backgroundColor: location.pathname === path
      ? '#4b2bf2'
      : hoveredPath === path ? '#151521' : 'transparent',
    textDecoration: 'none',
    marginBottom: '5px',
    borderRadius: '8px',
    fontSize: '14px'
  });

  return (
    <aside className="app-sidebar" style={{ width: '260px', boxSizing: 'border-box', backgroundColor: '#1e1e2d', minHeight: '100vh', padding: '20px 10px', color: '#a1a5b7', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#ffffff', fontWeight: 600 }}>ContractIQ</h2>
      <nav>
        {links.map(([label, path]) => (
          <Link
            key={label}
            to={path}
            style={getLinkStyle(path)}
            onMouseEnter={() => setHoveredPath(path)}
            onMouseLeave={() => setHoveredPath(null)}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;