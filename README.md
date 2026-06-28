Movie Ticket Booking System

Movie Ticket Booking System is a web application built using React.js and Firebase.  
It allows users to browse movies, select seats, and book tickets online. It also includes an admin panel for managing movies and bookings.

---

Features

 User
- View movies
- View movie details
- Select show timings
- Seat selection
- Book tickets
Admin
- Add, update, delete movies
- Manage show timings
- View bookings

---

Tech Stack
- React.js
- JavaScript
- HTML
- CSS
- Firebase

---

Firebase
- Firestore Database used for storing movies and bookings
- Real-time data handling

---

Setup

npm install  
npm start  

Open:
http://localhost:3000

---

Firebase Config

Create file: src/firebase.js

Add:

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

initializeApp(firebaseConfig);
