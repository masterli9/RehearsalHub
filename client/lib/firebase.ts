// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAjd2O8HrCcWKW9t7jy1r-a_Lg2fqsDZEw",
    authDomain: "backstage-63e63.firebaseapp.com",
    projectId: "backstage-63e63",
    storageBucket: "backstage-63e63.firebasestorage.app",
    messagingSenderId: "1092570739344",
    appId: "1:1092570739344:web:05f60392b80fd39bf95e15",
    measurementId: "G-LW0XR2G2EH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
