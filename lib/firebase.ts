import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB8GU4EEEQR75R-VL1xuNbPf2LINZv7puk",
  authDomain: "chatapp-36c8d.firebaseapp.com",
  databaseURL: "https://chatapp-36c8d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chatapp-36c8d",
  storageBucket: "chatapp-36c8d.appspot.com",
  messagingSenderId: "1097189465835",
  appId: "1:1097189465835:web:f05a1029954e65dd2568ae"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
