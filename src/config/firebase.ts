import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAEBVxqYzzBA191xqb74TzAYqo9-ud9f0s",
  authDomain: "munyaka-school-portal.firebaseapp.com",
  projectId: "munyaka-school-portal",
  storageBucket: "munyaka-school-portal.firebasestorage.app",
  messagingSenderId: "440190897416",
  appId: "1:440190897416:web:bf1145daa13aa1d268f0bd",
  measurementId: "G-JN0CH8HD8X"
};

// Initialize Firebase app safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
