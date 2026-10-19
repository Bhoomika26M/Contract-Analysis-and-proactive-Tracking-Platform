import React, { useState } from 'react';
import { loginUser } from '../services/login';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { cardStyle, primaryButtonStyle } from '../../../uiStyles';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    
    try {
      const data = await loginUser(email, password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', data.role);
      alert('Login Successful!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    }
  };

  return (
    <div style={{ ...cardStyle, maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Sign in to ContractIQ</h2>
      
      {/* This line displays the error variable, which clears the warning */}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={{ ...primaryButtonStyle, padding: '10px 15px' }}>
          Sign In
        </button>
        <div style={{ textAlign: 'center', marginTop: '10px' }}><Link to="/signup" style={{ color: '#4b2bf2', fontSize: '14px' }}>Don't have an account? Sign up</Link></div>
      </form>
    </div>
  );
};

export default LoginForm;