import React, { useState } from 'react';
import { loginUser } from '../services/login';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';

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
      localStorage.setItem('userId', data.user_id);
      localStorage.setItem('userName', data.user_name || '');
      localStorage.setItem('userEmail', data.user_email || email);
      if (data.department) {
        localStorage.setItem('department', data.department);
      } else {
        localStorage.removeItem('department');
      }
      alert('Login Successful!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    }
  };

  return (
    <AuthLayout>
        <h2 style={{ margin: '0 0 24px', color: '#1e1e2d', fontSize: '21px' }}>
          Sign in to your account
        </h2>

        {error && <p role="alert" style={{ color: '#b42318', fontWeight: 600 }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="login-email" style={{ display: 'block', marginBottom: '7px', color: '#1e1e2d', fontWeight: 600 }}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ border: '1px solid #dee2e6', padding: '12px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="login-password" style={{ display: 'block', marginBottom: '7px', color: '#1e1e2d', fontWeight: 600 }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ border: '1px solid #dee2e6', padding: '12px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <button className="auth-submit-button" type="submit" style={{ width: '100%', backgroundColor: '#3a1bb1', color: 'white', fontWeight: '600', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Sign In
          </button>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/signup" style={{ color: '#3a1bb1', fontSize: '14px', textDecoration: 'none' }}>
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </form>
    </AuthLayout>
  );
};

export default LoginForm;