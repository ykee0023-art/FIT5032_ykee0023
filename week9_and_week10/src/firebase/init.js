// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLl4jc5dZgIlbLbGZOhmHA4_kYJa1PLDg",
  authDomain: "fit5032-1b795.firebaseapp.com",
  projectId: "fit5032-1b795",
  storageBucket: "fit5032-1b795.firebasestorage.app",
  messagingSenderId: "252213767602",
  appId: "1:252213767602:web:8a8d4a7c991166fff0c8ab"
};

//Initialize Firebase
initializeApp(firebaseConfig);
const db = getFirestore();
export { db }
