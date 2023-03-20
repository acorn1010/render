import {FirebaseOptions, initializeApp} from "firebase/app";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCDDmmymNeYql3uZVC1kX7F6sr2ZbG5SKk",
  authDomain: "render-1010.firebaseapp.com",
  projectId: "render-1010",
  storageBucket: "render-1010.appspot.com",
  messagingSenderId: "263893907468",
  appId: "1:263893907468:web:44d02403da6f19e06ed629",
  measurementId: "G-H4DG1NC8X2",
};
export const app = initializeApp(firebaseConfig, {automaticDataCollectionEnabled: false});
