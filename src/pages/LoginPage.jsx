import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setToken, setRole } from '../apiCalls';
import '../pages/LoginPage.css';

const LoginPage = ({ setIsAuthenticated }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.username, formData.password);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3081';
      
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: 'teacher'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Success - store credentials and login using correct keys
      setToken(data.token);
      setRole(data.role);
      localStorage.setItem('username', data.username);
      
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
    setFormData({ username: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>TCXR Cares</h1>
        <p className="subtitle">Educational Management System</p>
        
        <div className="auth-toggle">
          <button 
            className={`toggle-btn ${!isSignup ? 'active' : ''}`}
            onClick={() => !isSignup || toggleMode()}
          >
            Log In
          </button>
          <button 
            className={`toggle-btn ${isSignup ? 'active' : ''}`}
            onClick={() => isSignup || toggleMode()}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={isSignup ? handleSignup : handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={isSignup ? "Create a username" : "Enter username"}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isSignup ? "At least 6 characters" : "Enter password"}
              disabled={loading}
              required
            />
          </div>

          {isSignup && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                disabled={loading}
                required
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (isSignup ? 'Creating Account...' : 'Logging in...') : (isSignup ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        {!isSignup && (
          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials:</p>
            <ul>
              <li><strong>Admin:</strong> <code>admin</code> / <code>admin123</code></li>
              <li><strong>Teacher:</strong> <code>teacher</code> / <code>teacher123</code></li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
