import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize Firebase Admin SDK with google-services.json
 */
const initializeFirebaseWithGoogleServices = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase already initialized');
      return admin;
    }

    let serviceAccount;

    // Priority 1: Try to load from google-services.json
    const googleServicesPath = path.join(__dirname, 'google-services.json');
    if (fs.existsSync(googleServicesPath)) {
      try {
        const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
        console.log('✅ Loaded google-services.json');
        
        // Extract Firebase config from google-services.json
        serviceAccount = {
          type: 'service_account',
          project_id: googleServices.project_info.project_id,
          // Note: google-services.json doesn't contain private key
          // We need to get it from environment variables
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
        };
      } catch (e) {
        console.warn('⚠️  Could not parse google-services.json:', e.message);
        serviceAccount = null;
      }
    }

    // Priority 2: Try to parse JSON string from environment
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log('✅ Firebase service account loaded from JSON string');
      } catch (e) {
        console.warn('⚠️  Could not parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON:', e.message);
        serviceAccount = null;
      }
    }

    // Priority 3: Fallback to individual environment variables
    if (!serviceAccount) {
      serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      };
    }

    // Validate that we have required fields
    if (!serviceAccount.project_id) {
      throw new Error('Firebase project_id is missing from service account');
    }

    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      console.warn('⚠️  Firebase private_key or client_email is missing. Some features may not work.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    console.log('✅ Firebase initialized successfully with project:', serviceAccount.project_id);
    return admin;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.warn('⚠️  Continuing without Firebase. Some features may not work.');
    return null;
  }
};

/**
 * Get Firebase project configuration
 */
const getFirebaseConfig = () => {
  try {
    const googleServicesPath = path.join(__dirname, 'google-services.json');
    if (fs.existsSync(googleServicesPath)) {
      const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
      return {
        projectId: googleServices.project_info.project_id,
        projectNumber: googleServices.project_info.project_number,
        storageBucket: googleServices.project_info.storage_bucket,
        apiKey: googleServices.client[0].api_key[0].current_key,
        androidPackage: googleServices.client[0].android_client_info.package_name,
      };
    }
  } catch (error) {
    console.warn('⚠️  Could not read Firebase config:', error.message);
  }
  return null;
};

/**
 * Verify Firebase token
 */
const verifyFirebaseToken = async (token) => {
  try {
    const firebaseAdmin = admin.apps.length > 0 ? admin : initializeFirebaseWithGoogleServices();
    if (!firebaseAdmin) {
      throw new Error('Firebase not initialized');
    }
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error(`Invalid Firebase token: ${error.message}`);
  }
};

/**
 * Get Firebase user
 */
const getFirebaseUser = async (uid) => {
  try {
    const firebaseAdmin = admin.apps.length > 0 ? admin : initializeFirebaseWithGoogleServices();
    if (!firebaseAdmin) {
      throw new Error('Firebase not initialized');
    }
    const user = await firebaseAdmin.auth().getUser(uid);
    return user;
  } catch (error) {
    throw new Error(`Firebase user not found: ${error.message}`);
  }
};

/**
 * Create Firebase user
 */
const createFirebaseUser = async (email, password, displayName) => {
  try {
    const firebaseAdmin = admin.apps.length > 0 ? admin : initializeFirebaseWithGoogleServices();
    if (!firebaseAdmin) {
      throw new Error('Firebase not initialized');
    }
    const user = await firebaseAdmin.auth().createUser({
      email,
      password,
      displayName,
    });
    return user;
  } catch (error) {
    throw new Error(`Could not create Firebase user: ${error.message}`);
  }
};

/**
 * Delete Firebase user
 */
const deleteFirebaseUser = async (uid) => {
  try {
    const firebaseAdmin = admin.apps.length > 0 ? admin : initializeFirebaseWithGoogleServices();
    if (!firebaseAdmin) {
      throw new Error('Firebase not initialized');
    }
    await firebaseAdmin.auth().deleteUser(uid);
    return true;
  } catch (error) {
    throw new Error(`Could not delete Firebase user: ${error.message}`);
  }
};

/**
 * Send custom token
 */
const createCustomToken = async (uid, claims = {}) => {
  try {
    const firebaseAdmin = admin.apps.length > 0 ? admin : initializeFirebaseWithGoogleServices();
    if (!firebaseAdmin) {
      throw new Error('Firebase not initialized');
    }
    const token = await firebaseAdmin.auth().createCustomToken(uid, claims);
    return token;
  } catch (error) {
    throw new Error(`Could not create custom token: ${error.message}`);
  }
};

export {
  initializeFirebaseWithGoogleServices,
  getFirebaseConfig,
  verifyFirebaseToken,
  getFirebaseUser,
  createFirebaseUser,
  deleteFirebaseUser,
  createCustomToken,
};
