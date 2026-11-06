import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { cardStyle, tableHeaderCellStyle } from '../uiStyles';

const API_URL = 'http://127.0.0.1:8000/api/audit-logs';

const formatLocalTime = (utcString) => {
  if (!utcString) return 'N/A';
  const safeString = utcString.endsWith('Z') ? utcString : `${utcString}Z`;
  const parsedDate = new Date(safeString);
  if (Number.isNaN(parsedDate.getTime())) return 'N/A';
  return parsedDate.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canViewAuditLogs = ['Administrator', 'Compliance Officer'].includes(
    localStorage.getItem('userRole')
  );

  useEffect(() => {
    if (!canViewAuditLogs) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const fetchAuditLogs = async () => {
      try {
        const response = await axios.get(API_URL, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (active) {
          setAuditLogs(response.data);
          setError('');
        }
      } catch (err) {
        console.error(err);
        if (active) setError('Failed to load audit logs.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAuditLogs();
    return () => {
      active = false;
    };
  }, [canViewAuditLogs]);

  if (!canViewAuditLogs) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6c757d',
          textAlign: 'center'
        }}
      >
        Access Denied
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', backgroundColor: '#f5f8fa' }}>
      <section style={{ ...cardStyle, padding: '24px' }}>
        <h1 style={{ marginTop: 0, color: '#1e1e2d', fontWeight: 600 }}>Audit Logs</h1>
        <p style={{ color: '#6c757d' }}>Review recent activity across the workspace.</p>

        {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
        {loading ? (
          <p style={{ color: '#6c757d' }}>Loading audit logs...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '20px',
                backgroundColor: '#ffffff'
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                  {['Timestamp', 'User', 'Action', 'Resource', 'Resource ID'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      style={{
                        ...tableHeaderCellStyle,
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((entry) => (
                  <tr
                    key={entry.id}
                    style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #dee2e6' }}
                  >
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      {formatLocalTime(entry.timestamp)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {entry.user_name || entry.user_email || '—'}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{entry.action}</td>
                    <td style={{ padding: '12px' }}>{entry.target_resource}</td>
                    <td style={{ padding: '12px' }}>{entry.target_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLogs.length === 0 && !error && !loading && (
              <p style={{ textAlign: 'center', marginTop: '20px', color: '#6c757d' }}>
                No audit logs found.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default AuditLogs;
