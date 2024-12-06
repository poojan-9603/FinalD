// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getAuth } from "firebase/auth"; // Import Firebase Authentication

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZ6jmXTdZpVHpKBeZOr8vU0-eZyqbkdxw",
  authDomain: "mvp1-ddf30.firebaseapp.com",
  projectId: "mvp1-ddf30",
  storageBucket: "mvp1-ddf30.appspot.com",
  messagingSenderId: "443638133647",
  appId: "1:443638133647:web:33492d039a339643c891fa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Initialize Firestore
const auth = getAuth(app); // Initialize Firebase Authentication

export { db, auth }; // Export Firestore and Auth