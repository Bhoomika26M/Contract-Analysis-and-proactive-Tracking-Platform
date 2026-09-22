import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, FolderOpen, CheckSquare, 
  ClipboardList, Calendar, BarChart2, Bell, FileClock, Settings 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'User Management', path: '/users', icon: <Users size={20} /> },
    { name: 'Contracts', path: '/contracts', icon: <FileText size={20} /> },
    { name: 'Contract Repository', path: '/repository', icon: <FolderOpen size={20} /> },
    { name: 'Contract Approval', path: '/approval', icon: <CheckSquare size={20} /> },
    { name: 'Obligations', path: '/obligations', icon: <ClipboardList size={20} /> },
    { name: 'Renewals', path: '/renewals', icon: <Calendar size={20} /> },
    { name: 'Reports', path: '/reports', icon: <BarChart2 size={20} /> },
    { name: 'Notifications', path: '/notifications', icon: <Bell size={20} /> },
    { name: 'Audit Logs', path: '/audit', icon: <FileClock size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div style={{ width: '260px', backgroundColor: '#1E1B4B', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* Logo Section */}
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: '#8B5CF6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          C
        </div>
        <h2 style={{ fontSize: '20px', margin: 0, fontWeight: '600' }}>ContractIQ</h2>
      </div>

      {/* Navigation Links */}
      <div style={{ padding: '16px 8px', flex: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path} 
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                textDecoration: 'none', color: isActive ? 'white' : '#A5B4FC',
                backgroundColor: isActive ? '#4C1D95' : 'transparent',
                borderRadius: '8px', marginBottom: '4px', transition: 'background 0.2s'
              }}
            >
              {item.icon}
              <span style={{ fontSize: '15px', fontWeight: isActive ? '600' : '400' }}>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User Profile Section */}
      <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', backgroundColor: '#E0E7FF', color: '#1E1B4B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          NJ
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Neha James</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#A5B4FC' }}>Administrator</p>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;