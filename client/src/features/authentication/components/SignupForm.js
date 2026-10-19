import React, { useState } from 'react';
import { registerUser } from '../services/register';
import { useNavigate, Link } from 'react-router-dom';
import { cardStyle, primaryButtonStyle } from '../../../uiStyles';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'Employee'
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
    <div style={{ ...cardStyle, maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Create an Account</h2>
      
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>First Name</label>
          <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Last Name</label>
          <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Role</label>
          <select name="role" value={formData.role} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
            <option value="Administrator">Administrator</option>
            <option value="Legal Manager">Legal Manager</option>
            <option value="Compliance Officer">Compliance Officer</option>
            <option value="Contract Manager">Contract Manager</option>
            <option value="Department Head">Department Head</option>
            <option value="Employee">Employee</option>
          </select>
        </div>
        <button type="submit" style={{ ...primaryButtonStyle, width: '100%', padding: '10px', marginBottom: '10px' }}>
          Sign Up
        </button>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: '14px', color: '#4b2bf2' }}>Already have an account? Log in</Link>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;