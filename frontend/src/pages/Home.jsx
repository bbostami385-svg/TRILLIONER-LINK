import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home">
      {/* Navigation */}
      <nav className="header">
        <div className="header-content">
          <div className="logo">✨ TRILLIONER LINK</div>
          <ul className="nav">
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero">
        <h1>Welcome to TRILLIONER LINK</h1>
        <p>Connect, share, and create with the world. A comprehensive social media platform built for creators, communities, and businesses.</p>
        <div className="cta-buttons">
          <Link to="/login" className="button button-primary">
            Login
          </Link>
          <Link to="/signup" className="button button-secondary">
            Sign Up
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '40px' }}>
          Powerful Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Connect Card */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Connect</h3>
            <p style={{ color: '#65676b', lineHeight: '1.5' }}>
              Build meaningful connections with friends, followers, and communities worldwide.
            </p>
          </div>

          {/* Share Card */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Share</h3>
            <p style={{ color: '#65676b', lineHeight: '1.5' }}>
              Share your moments, thoughts, and creations with your audience instantly.
            </p>
          </div>

          {/* Create Card */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Create</h3>
            <p style={{ color: '#65676b', lineHeight: '1.5' }}>
              Monetize your content and build your creator business with our marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1877f2 0%, #0a66c2 100%)',
        padding: '60px 20px',
        textAlign: 'center',
        color: 'white',
        marginTop: '40px'
      }}>
        <div className="container">
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
            Ready to join?
          </h2>
          <p style={{ fontSize: '18px', marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px' }}>
            Sign up now and start connecting with millions of creators and users.
          </p>
          <Link to="/signup" className="button button-primary" style={{
            background: 'white',
            color: '#1877f2',
            padding: '12px 32px',
            fontSize: '16px',
            display: 'inline-block'
          }}>
            Create Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#f0f2f5',
        borderTop: '1px solid #ccc',
        padding: '40px 20px',
        textAlign: 'center',
        color: '#65676b',
        marginTop: '40px'
      }}>
        <div className="container">
          <p>&copy; 2026 TRILLIONER LINK. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
