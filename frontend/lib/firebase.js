/**
 * firebase.js — Firebase Configuration for BAGA
 * ===============================================
 * Initializes Firebase App, Firestore, and Auth.
 * 
 * SETUP: Replace the firebaseConfig values with your own
 * from the Firebase Console → Project Settings → Web App.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (prevent duplicate initialization in dev mode)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firestore Database
export const db = getFirestore(app);

// Firebase Authentication
export const auth = getAuth(app);

export default app;
