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
  apiKey: "AIzaSyBgPpHU3T8ds_FnKMlYTII94UWFHogoxjQ",
  authDomain: "phadderistspelet.firebaseapp.com",
  projectId: "phadderistspelet",
  storageBucket: "phadderistspelet.firebasestorage.app",
  messagingSenderId: "130676103544",
  appId: "1:130676103544:web:99384f932124722840508d",
  measurementId: "G-CX5WNRXQPH"
};

// Initialize Firebase
//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };