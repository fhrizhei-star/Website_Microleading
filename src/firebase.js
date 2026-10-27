import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

/**
 * Konfigurasi Firebase Laboratorium MPI FTK UIN Alauddin Makassar
 * Project: lab-mpi-becf0
 */
const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyA6fn4z2UyeCU6SeiC9DghnvxywcFHTlbs",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "lab-mpi-becf0.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "lab-mpi-becf0",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "lab-mpi-becf0.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "558694090319",
  appId: env.VITE_FIREBASE_APP_ID || "1:558694090319:web:3f824974597c8dc2fd4c3a",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-6XHTLRP7Q5"
};

// Cek apakah konfigurasi sudah aktif
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId === "lab-mpi-becf0"
);

let app = null;
let db = null;
let storage = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    console.log('🔥 [Firebase Cloud Connected] Berhasil terhubung ke Cloud Firestore:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('⚠️ [Firebase] Gagal inisialisasi Firebase:', err.message);
  }
}

export { app, db, storage, auth };
