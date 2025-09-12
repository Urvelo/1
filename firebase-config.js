// Firebase-konfiguraatio Löytökauppa - compat versio
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

// Alusta Firebase (compat versio)
let firebaseApp;

// Odota että Firebase CDN on ladattu
function initializeFirebaseApp() {
  if (typeof firebase !== 'undefined') {
    try {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase App alustettu:', firebaseApp.name);
      
      // Tee saataville globaalisti
      window.firebaseApp = firebaseApp;
      window.firebaseConfig = firebaseConfig;
    } catch (error) {
      console.warn('⚠️ Firebase App alustus virhe:', error);
      // Jos jo alustettu, käytä olemassa olevaa
      if (firebase.apps.length > 0) {
        firebaseApp = firebase.apps[0];
        window.firebaseApp = firebaseApp;
        console.log('✅ Käytetään olemassa olevaa Firebase App:ia');
      }
    }
  } else {
    console.error('❌ Firebase compat kirjasto ei ole ladattu');
  }
}

// Yritä alustaa heti ja myös DOMContentLoaded:issa
initializeFirebaseApp();
document.addEventListener('DOMContentLoaded', initializeFirebaseApp);