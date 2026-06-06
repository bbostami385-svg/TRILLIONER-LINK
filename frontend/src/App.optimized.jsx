import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Feed = lazy(() => import('./pages/Feed'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Messages = lazy(() => import('./pages/Messages'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Search = lazy(() => import('./pages/Search'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const DiamondProfile = lazy(() => import('./pages/DiamondProfile'));
const RewardShop = lazy(() => import('./pages/RewardShop'));

// Components
import DiamondCounter from './components/DiamondCounter';

// Loading component
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios with optimizations
axios.defaults.timeout = 10000;
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - network too slow');
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(JSON.parse(storedUser));
        } else if (token) {
          // Try to fetch user from backend with timeout
          try {
            const response = await Promise.race([
              axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
              ),
            ]);
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } catch (err) {
            // If timeout or error, use stored user if available
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            } else {
              throw err;
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Check if user is logged in from localStorage
  const isLoggedIn = user || localStorage.getItem('token');

  return (
    <Router>
      <div className="app">
        {isLoggedIn ? (
          <>
            <DiamondCounter />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Feed />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/search" element={<Search />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/diamond-profile" element={<DiamondProfile />} />
                <Route path="/reward-shop" element={<RewardShop />} />
              </Routes>
            </Suspense>
          </>
        ) : (
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        )}
      </div>
    </Router>
  );
}

export default App;
