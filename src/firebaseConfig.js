// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getDatabase } from "firebase/database";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCc5GXnku0BD7gHuh0dnwWDUYRmtmTW28M",
  authDomain: "moviee-41df7.firebaseapp.com",
  databaseURL: "https://moviee-41df7-default-rtdb.firebaseio.com/",
  projectId: "moviee-41df7",
  storageBucket: "moviee-41df7.firebasestorage.app",
  messagingSenderId: "435474502713",
  appId: "1:435474502713:web:0decf5b4e5676cfeff29e8",
  measurementId: "G-41KPDWG5MK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
