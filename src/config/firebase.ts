import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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

// Automatically sign in anonymously on startup so request.auth != null is satisfied for Firestore rules
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch((err) => {
        console.warn('Anonymous sign-in warning:', err);
      });
    }
  });
}

export default app;
