import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Firebase credentials hardcoded as fallback for production
const FIREBASE_CONFIG_FALLBACK = {
  apiKey: "AIzaSyBZoJnibrBnG7-OCzBv65Y8e1t8hAbFee8",
  authDomain: "tutapp-88bf0.firebaseapp.com",
  projectId: "tutapp-88bf0",
  storageBucket: "tutapp-88bf0.firebasestorage.app",
  messagingSenderId: "999034904150",
  appId: "1:999034904150:web:7499ef525b430d7fd6e5f7",
  databaseURL: "https://tutapp-88bf0-default-rtdb.firebaseio.com",
  measurementId: "G-DEYC1VDELW",
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || FIREBASE_CONFIG_FALLBACK.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || FIREBASE_CONFIG_FALLBACK.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || FIREBASE_CONFIG_FALLBACK.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || FIREBASE_CONFIG_FALLBACK.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_CONFIG_FALLBACK.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || FIREBASE_CONFIG_FALLBACK.appId,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || FIREBASE_CONFIG_FALLBACK.databaseURL,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || FIREBASE_CONFIG_FALLBACK.measurementId,
};

const isConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app = null;
if (isConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

export const auth = app ? getAuth(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;
export const db = app ? getFirestore(app) : null;
export const rtdb = app ? getDatabase(app) : null;
export const storage = app ? getStorage(app) : null;

export default app;
