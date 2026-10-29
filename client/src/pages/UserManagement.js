import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { cardStyle, tableHeaderCellStyle } from '../uiStyles';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdministrator = localStorage.getItem('userRole') === 'Administrator';

  useEffect(() => {
    if (!isAdministrator) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://127.0.0.1:8000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (active) {
          setUsers(response.data);
          setError('');
        }
      } catch (err) {
        console.error('Failed to load users', err);
        if (active) setError('Failed to load users.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      active = false;
    };
  }, [isAdministrator]);

  if (!isAdministrator) {
    return (
      <div
        role="alert"
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#b02a37',
          fontWeight: 600
        }}
      >
        Access Denied
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '24px', boxSizing: 'border-box', backgroundColor: '#f5f8fa' }}>
      <section style={{ ...cardStyle, padding: '24px' }}>
        <h1 style={{ marginTop: 0, color: '#1e1e2d', fontWeight: 600 }}>User Management</h1>
        <p style={{ color: '#6c757d' }}>View registered users and their workspace roles.</p>

        {error && <p role="alert" style={{ color: '#b02a37' }}>{error}</p>}
        {loading ? (
          <p role="status" style={{ color: '#6c757d' }}>Loading users...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {['User ID', 'Email', 'Role', 'Department'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      style={{
                        ...tableHeaderCellStyle,
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    style={{ borderBottom: '1px solid #dee2e6' }}
                  >
                    <td style={{ padding: '12px' }}>{user.id}</td>
                    <td style={{ padding: '12px' }}>{user.email}</td>
                    <td style={{ padding: '12px' }}>{user.role}</td>
                    <td style={{ padding: '12px' }}>{user.department || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && !error && !loading && (
              <p style={{ textAlign: 'center', marginTop: '20px', color: '#6c757d' }}>
                No registered users found.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default UserManagement;
