import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { cardStyle, primaryButtonStyle } from '../uiStyles';

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  color: '#6c757d',
  fontSize: '13px',
  fontWeight: 600
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px',
  border: '1px solid #dee2e6',
  borderRadius: '4px'
};

const Settings = () => {
  const userRole = localStorage.getItem('userRole');
  const fullName = localStorage.getItem('userName') || '';
  const email = localStorage.getItem('userEmail') || '';
  const [expirationThreshold, setExpirationThreshold] = useState(30);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const successTimeout = useRef(null);

  useEffect(() => () => {
    if (successTimeout.current) clearTimeout(successTimeout.current);
  }, []);

  const showSuccess = (message) => {
    if (successTimeout.current) clearTimeout(successTimeout.current);
    setSuccessMessage(message);
    successTimeout.current = setTimeout(() => {
      setSuccessMessage('');
      successTimeout.current = null;
    }, 3000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const token = localStorage.getItem('token');

    try {
      await axios.patch(
        'http://127.0.0.1:8000/api/users/me/password',
        {
          current_password: formData.currentPassword,
          new_password: formData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showSuccess('Password updated successfully.');
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Unable to update password.');
    }
  };

  const handleDepartmentManagement = () => {
    showSuccess('Department management will be available soon.');
  };

  return (
    <main style={{ padding: '24px', backgroundColor: '#f5f8fa', minHeight: '100vh' }}>
      <h1 style={{ margin: '0 0 8px', color: '#1e1e2d', fontWeight: 600 }}>Settings</h1>
      <p style={{ margin: '0 0 24px', color: '#6c757d' }}>
        Manage your ContractIQ account and workspace preferences.
      </p>

      {successMessage && (
        <p role="status" style={{ color: '#155724', marginBottom: '20px' }}>
          {successMessage}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <section id="profile" style={{ ...cardStyle, padding: '24px' }}>
          <h2 style={{ margin: '0 0 20px', color: '#1e1e2d', fontSize: '18px' }}>
            My Profile
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            <div>
              <label htmlFor="profile-name" style={labelStyle}>Full Name</label>
              <input id="profile-name" type="text" value={fullName} readOnly style={inputStyle} />
            </div>
            <div>
              <label htmlFor="profile-email" style={labelStyle}>Email ID</label>
              <input id="profile-email" type="email" value={email} readOnly style={inputStyle} />
            </div>
            <div>
              <label htmlFor="profile-role" style={labelStyle}>Position / Role</label>
              <input id="profile-role" type="text" value={userRole || ''} readOnly style={inputStyle} />
            </div>
          </div>
        </section>

        <section id="password" style={{ ...cardStyle, padding: '24px' }}>
          <h2 style={{ margin: '0 0 20px', color: '#1e1e2d', fontSize: '18px' }}>
            Security
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '16px' }}>
              {errorMessage && (
                <p role="alert" style={{ color: '#721c24', margin: 0 }}>
                  {errorMessage}
                </p>
              )}
              <div>
                <label htmlFor="current-password" style={labelStyle}>Current Password</label>
                <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required style={inputStyle} value={formData.currentPassword} onChange={(event) => setFormData({ ...formData, currentPassword: event.target.value })} />
              </div>
              <div>
                <label htmlFor="new-password" style={labelStyle}>New Password</label>
                <input id="new-password" name="newPassword" type="password" autoComplete="new-password" required style={inputStyle} value={formData.newPassword} onChange={(event) => setFormData({ ...formData, newPassword: event.target.value })} />
              </div>
              <div>
                <label htmlFor="confirm-password" style={labelStyle}>Confirm Password</label>
                <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required style={inputStyle} value={formData.confirmPassword} onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })} />
              </div>
              <button type="submit" style={{ ...primaryButtonStyle, padding: '10px 16px', fontWeight: 600 }}>
                Update Password
              </button>
            </div>
          </form>
        </section>

        {userRole === 'Administrator' && (
          <section style={{ ...cardStyle, padding: '24px' }}>
            <h2 style={{ margin: '0 0 20px', color: '#1e1e2d', fontSize: '18px' }}>
              System Configuration
            </h2>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="expiration-threshold" style={labelStyle}>
                Contract Expiration Warning Threshold (Days)
              </label>
              <input
                id="expiration-threshold"
                type="number"
                min="0"
                value={expirationThreshold}
                onChange={(event) => setExpirationThreshold(event.target.value)}
                style={inputStyle}
              />
            </div>
            <button
              type="button"
              onClick={handleDepartmentManagement}
              style={{ ...primaryButtonStyle, padding: '10px 16px', fontWeight: 600 }}
            >
              Manage Departments
            </button>
          </section>
        )}
      </div>
    </main>
  );
};

export default Settings;
