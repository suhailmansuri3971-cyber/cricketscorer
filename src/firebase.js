// STEP 1 of setup: paste your own Firebase project's config below.
// Get this from Firebase Console -> Project Settings -> General -> "Your apps" -> Web app.
// Full step-by-step guide is in README.md

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, remove, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCRTQyAv_J1_jCS95r5EattXPYmOVsYy-c",
  authDomain: "bamboobasket1-93c9b.firebaseapp.com",
  databaseURL: "https://bamboobasket1-93c9b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bamboobasket1-93c9b",
  storageBucket: "bamboobasket1-93c9b.firebasestorage.app",
  messagingSenderId: "676308957310",
  appId: "1:676308957310:web:d60a5b8e21dddbf576002f",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, onValue, set, remove, get };

// Path convention used throughout the app: matches/{code}
export const matchPath = (code) => `matches/${code}`;

// adminCodes/{adminCode} -> real match code. This keeps a separate secret
// code for the manager, so the public viewing code (shared on WhatsApp)
// can never be used to take over scoring.
export const adminPath = (adminCode) => `adminCodes/${adminCode}`;
