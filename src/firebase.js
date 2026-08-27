import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCEjsYWdKX9wWtzBMg_YnK5_jM-OLap1-M",
  authDomain: "project-x-6fb4a.firebaseapp.com",
  projectId: "project-x-6fb4a",
  storageBucket: "project-x-6fb4a.firebasestorage.app",
  messagingSenderId: "162367286264",
  appId: "1:162367286264:web:2125a56e4c489a88bec40d",
  measurementId: "G-KMVNJS3YQH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
