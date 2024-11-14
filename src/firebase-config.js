import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuración
const firebaseConfig = {
    apiKey: "AIzaSyAYrKrANWHBMOUJgrewYg0Wlf37av_YDJg",
    authDomain: "cochera-98439.firebaseapp.com",
    projectId: "cochera-98439",
    storageBucket: "cochera-98439.appspot.com",
    messagingSenderId: "601875067696",
    appId: "1:601875067696:web:d2ce384eaa2792a91e8ef5",
    measurementId: "G-HEXTR4KYC2"
};
  
// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);