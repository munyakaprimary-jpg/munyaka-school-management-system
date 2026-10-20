import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAEBVxqYzzBA191xqb74TzAYqo9-ud9f0s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "munyaka-school-portal.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "munyaka-school-portal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "munyaka-school-portal.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "440190897416",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:440190897416:web:bf1145daa13aa1d268f0bd",
  measurementId: "G-JN0CH8HD8X"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
