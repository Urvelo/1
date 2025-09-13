// Firebase-konfiguraatio Löytökauppa - Moderni v9+ versio (vain Auth)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

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

// Google OAuth Client ID
const googleClientId = "215051106784-j7g7o42jc18ipckqjkka6gvimuv2cfmj.apps.googleusercontent.com";

// 💳 PayPal Configuration (Turvallinen - hallitaan erillisellä managerilla)
// Lataa PayPal-config manageri ensin
import('./paypal-config-secure.js');

const paypalConfig = {
  clientId: null, // Asetetaan dynaamisesti paypal-config-secure.js:ssä
  currency: "EUR", 
  intent: "capture",
  sandbox: true // ⚠️ MUISTA VAIHTAA false tuotantoon!
};

// Alusta Firebase (vain Auth)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Tee saataville globaalisti yhteensopivuutta varten
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseConfig = firebaseConfig;
window.paypalConfig = paypalConfig; // 💳 PayPal config

console.log('✅ Firebase v11 alustettu onnistuneesti (vain Auth)');
console.log('✅ PayPal Sandbox config ladattu');

export { app, auth, firebaseConfig, paypalConfig };