// Firebase-konfiguraatio Löytökauppa - Moderni v9+ versio
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// Firebase-konfiguraatio
const firebaseConfig = {
  apiKey: "AIzaSyANtt5pVn0rgHqttQ3KfjNkjOMncV26trI",
  authDomain: "newproject-f7ef4.firebaseapp.com",
  projectId: "newproject-f7ef4",
  storageBucket: "newproject-f7ef4.firebasestorage.app",
  messagingSenderId: "215051106784",
  appId: "1:215051106784:web:15b2fad82ed9ce89da5385",
  measurementId: "G-T5F642C6L8"
};

// Alusta Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Tee saataville globaalisti yhteensopivuutta varten
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = { db };
window.firebaseConfig = firebaseConfig;

console.log('✅ Firebase v11 alustettu onnistuneesti');

export { app, auth, db, firebaseConfig };