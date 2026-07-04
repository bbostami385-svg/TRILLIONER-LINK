// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsZD3OIeL7i_svUV2aiAeS0fOnZKpbgO8",
  authDomain: "trillioner-link.firebaseapp.com",
  projectId: "trillioner-link",
  storageBucket: "trillioner-link.firebasestorage.app",
  messagingSenderId: "364286702954",
  appId: "1:364286702954:web:2783a137af5ad42cac6113",
  measurementId: "G-N0HHT3FD1W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
