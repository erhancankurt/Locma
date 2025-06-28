// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA5Cn2tRFFfbgo2bImnDLvqExhxmItyEXM",
  authDomain: "linkmap-e0782.firebaseapp.com",
  projectId: "linkmap-e0782",
  storageBucket: "linkmap-e0782.firebasestorage.app",
  messagingSenderId: "379077435375",
  appId: "1:379077435375:web:a9dcfacfd730adee4f201a",
  measurementId: "G-8QYK6NEB6T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);