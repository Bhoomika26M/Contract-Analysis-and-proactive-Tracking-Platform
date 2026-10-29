import React, { useEffect, useMemo, useState } from 'react';
import { getContracts } from '../features/authentication/services/contractsApi';
import { getAllObligations } from '../features/authentication/services/obligationsApi';
import { createNotifications } from '../features/authentication/utils/notifications';
import { cardStyle } from '../uiStyles';

const formatLocalTime = (utcString) => {
  if (!utcString) return 'N/A';
  const safeString = utcString.endsWith('Z') ? utcString : `${utcString}Z`;
  const date = new Date(safeString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const notificationStyles = {
  warning: {
    backgroundColor: '#ffffff',
    color: '#1e1e2d',
    borderLeft: '4px solid #f1416c'
  },
  info: {
    backgroundColor: '#ffffff',
    color: '#1e1e2d',
    borderLeft: '4px solid #4b2bf2'
  }
};

const getStoredReadAlerts = () => {
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

const Notifications = () => {
  const userRole = localStorage.getItem('userRole');
  const userDepartment = localStorage.getItem('department');
  const userId = localStorage.getItem('userId');
  const [contracts, setContracts] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('unread');
  const [readAlerts, setReadAlerts] = useState(getStoredReadAlerts);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const [contractData, obligationData] = await Promise.all([
          ['Administrator', 'Legal Manager', 'Department Head'].includes(userRole)
            ? getContracts()
            : Promise.resolve([]),
          userRole === 'Employee' ? getAllObligations() : Promise.resolve([])
        ]);
        if (active) {
          setContracts(contractData);
          setObligations(obligationData);
          setError('');
        }
      } catch (err) {
        console.error('Failed to load notification source data', err);
        if (active) setError('Failed to load notifications. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNotifications();
    return () => {
      active = false;
    };
  }, [userRole]);

  const notifications = useMemo(() => createNotifications(
    contracts,
    obligations,
    userRole,
    userDepartment,
    userId
  ).map((notification) => ({
    ...notification,
    timestamp: new Date().toISOString()
  })), [contracts, obligations, userRole, userDepartment, userId]);

  const unreadNotifications = notifications.filter(
    (notification) => !readAlerts.includes(notification.id)
  );
  const visibleNotifications = activeTab === 'unread'
    ? unreadNotifications
    : notifications;

  const markAsRead = (notificationId) => {
    if (readAlerts.includes(notificationId)) return;
    const updatedReadAlerts = [...readAlerts, notificationId];
    setReadAlerts(updatedReadAlerts);
    localStorage.setItem('readAlerts', JSON.stringify(updatedReadAlerts));
    window.dispatchEvent(new Event('contractiq-read-alerts-change'));
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px',
        boxSizing: 'border-box',
        backgroundColor: '#f5f8fa'
      }}
    >
      <section style={{ ...cardStyle, padding: '24px' }}>
        <h1 style={{ marginTop: 0, color: '#1e1e2d', fontWeight: 600 }}>
          Notifications
        </h1>
        <p style={{ color: '#6c757d' }}>
          Contract and obligation alerts based on your workspace data.
        </p>

        <div
          role="tablist"
          aria-label="Notification filters"
          style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #dee2e6', marginTop: '20px' }}
        >
          {[
            ['unread', 'Unread'],
            ['all', 'All']
          ].map(([tab, label]) => (
            <button
              key={tab}
              id={`notifications-tab-${tab}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls="notifications-panel"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #4b2bf2' : '2px solid transparent',
                color: activeTab === tab ? '#4b2bf2' : '#6c757d',
                backgroundColor: '#ffffff',
                fontWeight: activeTab === tab ? 600 : 500,
                cursor: 'pointer'
              }}
            >
              {label}{tab === 'unread' ? ` (${unreadNotifications.length})` : ''}
            </button>
          ))}
        </div>

        {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
        {loading ? (
          <p style={{ color: '#6c757d' }}>Loading notifications...</p>
        ) : visibleNotifications.length > 0 ? (
          <div
            id="notifications-panel"
            role="tabpanel"
            aria-labelledby={`notifications-tab-${activeTab}`}
            aria-label="Notifications"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}
          >
            {visibleNotifications.map((notification) => (
              <article
                key={notification.id}
                role={activeTab === 'unread' ? 'button' : 'status'}
                tabIndex={activeTab === 'unread' ? 0 : undefined}
                onClick={activeTab === 'unread' ? () => markAsRead(notification.id) : undefined}
                onKeyDown={activeTab === 'unread' ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    markAsRead(notification.id);
                  }
                } : undefined}
                style={{
                  ...notificationStyles[notification.type],
                  padding: '16px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 6px rgba(30, 30, 45, 0.06)',
                  cursor: activeTab === 'unread' ? 'pointer' : 'default'
                }}
              >
                <h2 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600 }}>
                  {notification.title}
                </h2>
                <p style={{ margin: 0 }}>{notification.message}</p>
                <time
                  dateTime={notification.timestamp}
                  style={{ display: 'block', marginTop: '8px', fontSize: '12px', opacity: 0.75 }}
                >
                  {formatLocalTime(notification.timestamp)}
                </time>
              </article>
            ))}
          </div>
        ) : (
          !error && (
            <p style={{ marginTop: '20px', color: '#6c757d' }}>
              {activeTab === 'unread' ? 'You are all caught up.' : 'No notifications at this time.'}
            </p>
          )
        )}
      </section>
    </main>
  );
};

export default Notifications;
