import React, { useState } from 'react';
import { registerUser } from '../services/register';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'Employee',
    department: 'IT'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await registerUser(formData);
      alert('Registration Successful! Please log in.');
      navigate('/login'); // Redirect to login page after success
    } catch (err) {
      console.error(err);
      setError('Failed to register. Email might already exist.');
    }
  };

  return (
    <AuthLayout>
        <h2 style={{ margin: '0 0 24px', color: '#1e1e2d', fontSize: '21px' }}>
          Create your account
        </h2>

        {error && <p role="alert" style={{ color: '#b42318', fontWeight: 600 }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="signup-first-name" style={{ display: 'block', marginBottom: '7px', color: '#1e1e2d', fontWeight: 600 }}>First Name</label>
            <input id="signup-first-name" type="text" name="first_name" value={formData.first_name} onChange={handleChange} required style={{ border: '1px solid #dee2e6', padding: '12px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="signup-last-name" style={{ display: 'block', marginBottom: '7px', color: '#1e1e2d', fontWeight: 600 }}>Last Name</label>
            <input id="signup-last-name" type="text" name="last_name" value={formData.last_name} onChange={handleChange} required style={{ border: '1px solid #dee2e6', padding: '12px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="signup-email" style={{ display: 'block', marginBottom: '7px', color: '#1e1e2d', fontWeight: 600 }}>Email</label>
            <input id="signup-email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} required style={{ border: '1px solid #dee2e6', padding: '12px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="signup-password" style={{ display: 'block', marginBottom: '7px', color: '#1e1e2d', fontWeight: 600 }}>Password</label>
            <input id="signup-password" type="password" name="password" autoComplete="new-password" value={formData.password} onChange={handleChange} required style={{ border: '1px solid #dee2e6', padding: '12px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="signup-role" style={{ display: 'block', marginBottom: '7px', color: '#1e1e2d', fontWeight: 600 }}>Role</label>
            <select id="signup-role" name="role" value={formData.role} onChange={handleChange} style={{ border: '1px solid #dee2e6', padding: '12px', borderRadius: '6px', width: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
              <option value="Administrator">Administrator</option>
              <option value="Legal Manager">Legal Manager</option>
              <option value="Compliance Officer">Compliance Officer</option>
              <option value="Contract Manager">Contract Manager</option>
              <option value="Department Head">Department Head</option>
              <option value="Employee">Employee</option>
            </select>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="signup-department" style={{ display: 'block', marginBottom: '7px', color: '#1e1e2d', fontWeight: 600 }}>Department</label>
            <select id="signup-department" name="department" value={formData.department} onChange={handleChange} style={{ border: '1px solid #dee2e6', padding: '12px', borderRadius: '6px', width: '100%', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
              <option value="Global">Global (Admin/Legal/Compliance)</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
          <button className="auth-submit-button" type="submit" style={{ width: '100%', backgroundColor: '#3a1bb1', color: 'white', fontWeight: '600', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '16px' }}>
            Sign Up
          </button>
          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: '14px', color: '#3a1bb1', textDecoration: 'none' }}>
              Already have an account? Log in
            </Link>
          </div>
        </form>
    </AuthLayout>
  );
};

export default SignupForm;