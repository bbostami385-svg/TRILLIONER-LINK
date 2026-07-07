import admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK
 * Requires FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable
 */
export function initializeFirebase() {
  try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    
    if (!serviceAccountBase64) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set');
    }

    // Decode Base64 to get JSON
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
}

/**
 * Get Firebase Auth instance
 */
export function getAuth() {
  return admin.auth();
}

/**
 * Get Firestore instance
 */
export function getFirestore() {
  return admin.firestore();
}

/**
 * Verify Google ID Token
 * @param idToken - Google ID token from frontend
 * @returns Decoded token with user info
 */
export async function verifyGoogleToken(idToken: string) {
  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
}

/**
 * Get or create user in Firestore
 * @param uid - Firebase UID
 * @param userData - User data from token
 */
export async function getOrCreateUser(uid: string, userData: any) {
  try {
    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return userDoc.data();
    }

    // Create new user
    const newUser = {
      uid,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await userRef.set(newUser);
    return newUser;
  } catch (error) {
    console.error('Error getting or creating user:', error);
    throw error;
  }
}

/**
 * Create custom JWT token for session
 * @param uid - Firebase UID
 * @returns Custom token
 */
export async function createCustomToken(uid: string) {
  try {
    const auth = getAuth();
    const customToken = await auth.createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
}

/**
 * Delete user
 * @param uid - Firebase UID
 */
export async function deleteUser(uid: string) {
  try {
    const auth = getAuth();
    await auth.deleteUser(uid);
    
    // Also delete from Firestore
    const db = getFirestore();
    await db.collection('users').doc(uid).delete();
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Update user profile
 * @param uid - Firebase UID
 * @param updates - Fields to update
 */
export async function updateUserProfile(uid: string, updates: any) {
  try {
    const db = getFirestore();
    await db.collection('users').doc(uid).update({
      ...updates,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Initialize Firebase on module load
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  initializeFirebase();
}
