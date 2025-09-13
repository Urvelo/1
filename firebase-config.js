// Firebase-konfiguraatio Löytökauppa - Moderni v9+ versio
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// 🔐 TURVALLINEN KONFIGURAATIO
// Firebase konfig voidaan lukea julkisesti (ei sisällä salaisia avaimia)
const firebaseConfig = {
  apiKey: "AIzaSyANtt5pVn0rgHqttQ3KfjNkjOMncV26trI",
  authDomain: "newproject-f7ef4.firebaseapp.com", 
  projectId: "newproject-f7ef4",
  storageBucket: "newproject-f7ef4.firebasestorage.app",
  messagingSenderId: "215051106784",
  appId: "1:215051106784:web:15b2fad82ed9ce89da5385",
  measurementId: "G-T5F642C6L8"
};

// 💳 PayPal Sandbox Configuration (Turvallinen - PUBLIC Client ID)
const paypalConfig = {
  clientId: "AfB87g-R1Y6r8j0IhP7Rk8NWNSIlwvjhJoFeO1_n3U0JZm-_s4FjDMxz8qG5ElIqEiAInOJo7kX0XqOq", // SANDBOX
  currency: "EUR",
  intent: "capture",
  sandbox: true // ⚠️ MUISTA VAIHTAA false tuotantoon!
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
window.paypalConfig = paypalConfig; // 💳 PayPal config

console.log('✅ Firebase v11 alustettu onnistuneesti');
console.log('✅ PayPal Sandbox config ladattu');

export { app, auth, db, firebaseConfig, paypalConfig };