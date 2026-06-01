/**
 * Firebase Client Configuration
 * This configuration is used by the frontend to initialize Firebase SDK
 */

const firebaseClientConfig = {
  // From google-services.json
  projectId: 'novaplus-app',
  projectNumber: '967183591469',
  storageBucket: 'novaplus-app.firebasestorage.app',
  apiKey: 'AIzaSyBqxnaIi72H1S4nxzxsj1Djh3LbXZQ0aUM',
  
  // Standard Firebase Web Config
  authDomain: 'novaplus-app.firebaseapp.com',
  databaseURL: 'https://novaplus-app-default-rtdb.firebaseio.com',
  messagingSenderId: '967183591469',
  appId: '1:967183591469:web:8c9bd404c0632d2465b0a4',
  measurementId: 'G-XXXXXXXXXX', // Add if you have Google Analytics
};

/**
 * Export configuration for frontend
 */
export const getFirebaseClientConfig = () => {
  return firebaseClientConfig;
};

/**
 * Firebase Services Configuration
 */
export const firebaseServices = {
  // Authentication
  auth: {
    enabled: true,
    providers: ['email', 'google', 'phone'],
    persistenceEnabled: true,
  },

  // Realtime Database
  database: {
    enabled: true,
    url: firebaseClientConfig.databaseURL,
  },

  // Cloud Firestore
  firestore: {
    enabled: true,
    persistenceEnabled: true,
  },

  // Cloud Storage
  storage: {
    enabled: true,
    bucket: firebaseClientConfig.storageBucket,
  },

  // Cloud Messaging (Push Notifications)
  messaging: {
    enabled: true,
    vapidKey: process.env.FIREBASE_VAPID_KEY,
  },

  // Cloud Functions
  functions: {
    enabled: true,
    region: 'us-central1',
  },

  // Analytics
  analytics: {
    enabled: process.env.FIREBASE_ANALYTICS_ENABLED === 'true',
  },

  // Performance Monitoring
  performance: {
    enabled: process.env.FIREBASE_PERFORMANCE_ENABLED === 'true',
  },

  // Crashlytics
  crashlytics: {
    enabled: process.env.FIREBASE_CRASHLYTICS_ENABLED === 'true',
  },
};

export default firebaseClientConfig;
