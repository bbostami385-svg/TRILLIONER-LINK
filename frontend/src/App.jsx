import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Pages
import Home from './pages/Home';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import DiamondProfile from './pages/DiamondProfile';
import RewardShop from './pages/RewardShop';

// Components
import DiamondCounter from './components/DiamondCounter';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
          // Try to fetch user from backend
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Check if user is logged in from localStorage
  const isLoggedIn = user || localStorage.getItem('token');

  return (
    <Router>
      <div className="app">
        {isLoggedIn ? (
          <>
            <DiamondCounter />
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
          </>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="*" element={<Home />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
