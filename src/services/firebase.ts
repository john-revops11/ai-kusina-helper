
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, child, set, remove, update } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4w7GqrikNoZlWt9St6C-dzoghE5_VXHY",
  authDomain: "kusina-d3f76.firebaseapp.com",
  databaseURL: "https://kusina-d3f76-default-rtdb.firebaseio.com",
  projectId: "kusina-d3f76",
  storageBucket: "kusina-d3f76.appspot.com",
  messagingSenderId: "494618596172",
  appId: "1:494618596172:web:fb583689cc1b1b7c3a5dee"
};

// Check if Firebase app is already initialized to prevent duplicate initialization
let app;
let database;
let auth;

try {
  // Try to get the existing app instance
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    // If app already exists, use the existing instance
    console.warn("Firebase app already exists, using existing instance");
    app = initializeApp();
    database = getDatabase(app);
    auth = getAuth(app);
  } else {
    // Log other initialization errors
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

export { app, database, auth, ref, get, child, set, remove, update };
