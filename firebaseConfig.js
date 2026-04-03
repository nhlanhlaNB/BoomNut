import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Replace with your actual project credentials from the Firebase Console
// Found in: Project Settings -> General -> Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyBZoJnibrBnG7-OCzBv65Y8e1t8hAbFee8",
  authDomain: "tutapp-88bf0.firebaseapp.com",
  databaseURL: "https://tutapp-88bf0-default-rtdb.firebaseio.com",
  projectId: "tutapp-88bf0",
  storageBucket: "tutapp-88bf0.firebasestorage.app",
  messagingSenderId: "999034904150",
  appId: "1:999034904150:web:7499ef525b430d7fd6e5f7",
  measurementId: "G-DEYC1VDELW"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);