import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * Firebase Configuration for Web App
 * Extracted from Android google-services.json
 * Project: trillioner-link
 * 
 * These values should be in your .env file or Vercel environment variables
 */
const firebaseConfig = {
  // From Android google-services.json
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCvyEQoOqjLi6feDBbgU1wiJi7tb_x8zgY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'trillioner-link.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'trillioner-link',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'trillioner-link.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '364286702954',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase
let app;
let auth;

try {
  // Validate that we have the required config
  if (!firebaseConfig.projectId) {
    console.warn('⚠️ Firebase projectId is not configured. Auth features will not work.');
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  console.log('✅ Firebase initialized successfully');
  console.log('📱 Project:', firebaseConfig.projectId);
  console.log('🔐 Auth Domain:', firebaseConfig.authDomain);
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

export { app, auth };
