// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAeh3ccIdod6Z6581SZFL3DG2pMKS7WOFw",
  authDomain: "tddd27-c6360.firebaseapp.com",
  projectId: "tddd27-c6360",
  storageBucket: "tddd27-c6360.firebasestorage.app",
  messagingSenderId: "1002097912945",
  appId: "1:1002097912945:web:0089f90dcda19bb0df3fd0",
  measurementId: "G-NB94E6VYBJ"
};

// Initialize Firebase
//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };