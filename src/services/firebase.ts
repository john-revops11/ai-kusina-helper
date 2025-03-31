
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, child, set, remove, update } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8PSx24rl7pYGvh8x-L8CNFaJInbY2YE0",
  authDomain: "kusina-d3f76.firebaseapp.com",
  databaseURL: "https://kusina-d3f76-default-rtdb.firebaseio.com",
  projectId: "kusina-d3f76",
  storageBucket: "kusina-d3f76.appspot.com",
  messagingSenderId: "494618596172",
  appId: "1:494618596172:web:fb583689cc1b1b7c3a5dee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, get, child, set, remove, update };
