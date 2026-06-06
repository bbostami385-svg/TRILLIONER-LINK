import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Set axios default headers if token exists
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Create axios instance with optimized settings
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout - network too slow'));
    }
    return Promise.reject(error);
  }
);

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [networkSlow, setNetworkSlow] = useState(false);
  const navigate = useNavigate();

  // Memoize form validation
  const isFormValid = useMemo(() => {
    return email.includes('@') && password.length >= 6;
  }, [email, password]);

  // Optimized login handler
  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      setError('Please enter valid email and password');
      return;
    }

    setLoading(true);
    setError('');
    setNetworkSlow(false);

    try {
      // Show timeout warning after 3 seconds
      const timeoutWarning = setTimeout(() => {
        setNetworkSlow(true);
      }, 3000);

      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      clearTimeout(timeoutWarning);

      // Save token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Set axios default header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      // Use hard redirect for faster page load
      window.location.href = '/';
    } catch (err) {
      setLoading(false);
      
      if (err.message === 'Request timeout - network too slow') {
        setError('Network is slow. Please check your connection and try again.');
        setNetworkSlow(true);
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    }
  }, [isFormValid]);

  return (
    <div className="login">
      <div className="container">
        <div className="login-form">
          <h2>Login</h2>
          
          {networkSlow && (
            <div className="warning">
              ⚠️ Your network seems slow. Please wait or check your connection.
            </div>
          )}
          
          {error && <div className="error">{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="current-password"
              />
            </div>

            <button 
              type="submit" 
              className="button button-primary" 
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  {networkSlow ? 'Still loading...' : 'Logging in...'}
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="signup-link">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
