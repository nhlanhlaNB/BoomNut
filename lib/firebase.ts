import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBZoJnibrBnG7-OCzBv65Y8e1t8hAbFee8",
  authDomain: "tutapp-88bf0.firebaseapp.com",
  projectId: "tutapp-88bf0",
  storageBucket: "tutapp-88bf0.firebasestorage.app",
  messagingSenderId: "999034904150",
  appId: "1:999034904150:web:7499ef525b430d7fd6e5f7",
  measurementId: "G-DEYC1VDELW"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
