import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllObligations } from '../features/authentication/services/obligationsApi';
import { getContracts } from '../features/authentication/services/contractsApi';
import { createNotifications } from '../features/authentication/utils/notifications';

const getReadAlerts = () => {
  try {
    const storedAlerts = JSON.parse(localStorage.getItem('readAlerts') || '[]');
    return Array.isArray(storedAlerts)
      ? storedAlerts.filter((alertId) => typeof alertId === 'string')
      : [];
  } catch (error) {
    console.error('Failed to parse stored read notifications', error);
    return [];
  }
};

const Icon = ({ name, size = 20 }) => {
  const commonProps = {
    'aria-hidden': true,
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };

  if (name === 'bell') {
    return <svg {...commonProps}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
  }
  if (name === 'settings') {
    return <svg {...commonProps}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" /></svg>;
  }
  if (name === 'sun') {
    return <svg {...commonProps}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>;
  }
  if (name === 'moon') {
    return <svg {...commonProps}><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" /></svg>;
  }
  if (name === 'profile') {
    return <svg {...commonProps}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
  }
  return <svg {...commonProps}><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>;
};

const Navbar = () => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [unreadCount, setUnreadCount] = useState(0);
  const name = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'User';
  const email = localStorage.getItem('userEmail') || '';
  const role = localStorage.getItem('userRole') || '';
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase()).join('') || 'U';

  React.useEffect(() => {
    const syncTheme = (event) => {
      const nextTheme = event.detail || localStorage.getItem('theme') || 'light';
      setTheme(nextTheme);
      document.body.classList.toggle('dark-mode', nextTheme === 'dark');
    };
    window.addEventListener('contractiq-theme-change', syncTheme);
    return () => window.removeEventListener('contractiq-theme-change', syncTheme);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const department = localStorage.getItem('department');
    let active = true;

    const loadUnreadCount = async () => {
      try {
        const [contracts, obligations] = await Promise.all([
          ['Administrator', 'Legal Manager', 'Department Head'].includes(role)
            ? getContracts()
            : Promise.resolve([]),
          role === 'Employee' ? getAllObligations() : Promise.resolve([])
        ]);
        if (!active) return;
        const notifications = createNotifications(
          contracts,
          obligations,
          role,
          department,
          userId
        );
        const readAlerts = getReadAlerts();
        setUnreadCount(notifications.filter(
          (notification) => !readAlerts.includes(notification.id)
        ).length);
      } catch (error) {
        console.error('Failed to load unread notification count', error);
        if (active) setUnreadCount(0);
      }
    };

    const syncReadAlerts = () => {
      loadUnreadCount();
    };
    loadUnreadCount();
    window.addEventListener('contractiq-read-alerts-change', syncReadAlerts);
    return () => {
      active = false;
      window.removeEventListener('contractiq-read-alerts-change', syncReadAlerts);
    };
  }, [role]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    document.body.classList.toggle('dark-mode', nextTheme === 'dark');
    window.dispatchEvent(new CustomEvent('contractiq-theme-change', { detail: nextTheme }));
  };

  const handleLogout = () => {
    ['token', 'userRole', 'userId', 'department', 'userName', 'userEmail']
      .forEach((key) => localStorage.removeItem(key));
    navigate('/login');
  };

  const navigateFromMenu = (path) => {
    setProfileOpen(false);
    navigate(path);
  };

  const actionButtonStyle = {
    position: 'relative',
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '8px',
    color: '#6c757d',
    backgroundColor: 'transparent',
    cursor: 'pointer'
  };

  return (
    <header className="app-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: '#ffffff', color: '#1e1e2d', boxShadow: '0px 2px 4px rgba(0,0,0,0.05)', position: 'relative', zIndex: 2 }}>
      <h3 style={{ margin: 0 }}>ContractIQ</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          onClick={() => navigate('/notifications')}
          style={actionButtonStyle}
        >
          <Icon name="bell" />
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} unread notifications`}
              style={{
                position: 'absolute',
                top: '2px',
                right: '0',
                minWidth: '17px',
                height: '17px',
                padding: '0 4px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f1416c',
                borderRadius: '50%',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                border: '1px solid #ffffff'
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          onClick={() => navigate('/settings')}
          style={actionButtonStyle}
        >
          <Icon name="settings" />
        </button>
        <button
          type="button"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          onClick={toggleTheme}
          style={actionButtonStyle}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <div style={{ position: 'relative', marginLeft: '8px' }}>
        <button
          type="button"
          aria-label="Open profile menu"
          aria-expanded={profileOpen}
          onClick={() => setProfileOpen((open) => !open)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 8px 4px 4px',
            border: 'none',
            borderRadius: '24px',
            color: '#1e1e2d',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <span style={{
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            color: '#ffffff',
            backgroundColor: '#4b2bf2',
            fontSize: '13px',
            fontWeight: 700,
            flexShrink: 0
          }}>{initials}</span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{name}</span>
            <span style={{ fontSize: '11px', color: '#6c757d' }}>{role}</span>
          </span>
        </button>
        {profileOpen && (
          <div
            className="app-profile-menu"
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '280px',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              color: '#1e1e2d',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#f6f4ff' }}>
              <span style={{
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                color: '#ffffff',
                backgroundColor: '#4b2bf2',
                fontSize: '14px',
                fontWeight: 700,
                flexShrink: 0
              }}>{initials}</span>
              <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{name}</span>
                <span style={{ color: '#6c757d', fontSize: '12px' }}>{role}</span>
                {email && <span style={{ color: '#6c757d', fontSize: '12px', overflowWrap: 'anywhere' }}>{email}</span>}
              </span>
            </div>
            <div style={{ padding: '8px' }}>
              {[
                ['My Profile', '/settings#profile'],
                ['Account Settings', '/settings#profile'],
                ['Change Password', '/settings#password']
              ].map(([label, path]) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  onClick={() => navigateFromMenu(path)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#343a40',
                    backgroundColor: 'transparent',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = '#f8f7ff'; }}
                  onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #eee', padding: '8px' }}>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                border: 'none',
                borderRadius: '6px',
                color: '#f1416c',
                backgroundColor: 'transparent',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <Icon name="logout" size={18} />
              Logout
            </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;