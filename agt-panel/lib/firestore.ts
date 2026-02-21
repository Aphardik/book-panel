"use client"

import { initializeApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getAuth, type Auth } from "firebase/auth"

// Initialize Firebase (uses NEXT_PUBLIC env variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let db: Firestore
let auth: Auth

try {
  const app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
} catch (error) {
  console.error("Firebase initialization error:", error)
  throw error
}

export { db, auth }
