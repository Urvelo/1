// Firebase Authentication - Löytökauppa
// Korvaa vanhan 2FA-email-systeemin Firebase Auth:lla

class FirebaseAuth {
  constructor() {
    this.auth = null;
    this.isFirebaseReady = false;
    this.fallbackToOldSystem = false;
  }

  async init() {
    try {
      // Odota että firebase-db.js on alustanut Firebasen
      if (window.firebaseDB) {
        await window.firebaseDB.init();
      }
      
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.apps && firebase.apps.length > 0) {
        this.auth = firebase.auth();
        this.isFirebaseReady = true;
        
        // Kuuntele käyttäjän kirjautumistilaa
        this.auth.onAuthStateChanged(user => {
          this.handleAuthStateChange(user);
        });
        
        console.log('✅ Firebase Auth yhdistetty');
      } else {
        throw new Error('Firebase Auth ei ole saatavilla tai ei ole alustettu');
      }
    } catch (error) {
      console.warn('⚠️ Firebase Auth virhe, käytetään vanhaa systeemiä:', error);
      this.fallbackToOldSystem = true;
    }
  }

  async handleAuthStateChange(user) {
    if (user) {
      // Käyttäjä kirjautunut Firebase:en
      console.log('Käyttäjä kirjautunut Firebase:en:', user.email);
      
      // Tarkista admin-oikeudet
      const isAdmin = await this.checkIfAdmin(user.email);
      
      // Päivitä käyttäjätiedot LocalStorageen yhteensopivuutta varten
      const userData = {
        id: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        phone: '',
        address: '',
        isAdmin: isAdmin,
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem('current_user', JSON.stringify(userData));
      localStorage.setItem('user_logged_in', 'true');
      
      // Päivitä UI
      if (typeof window.shopApp !== 'undefined') {
        window.shopApp.currentUser = userData;
        window.shopApp.loadUserInfo();
      }
      
    } else {
      // Tarkista onko käyttäjä kirjautunut LocalStorage:en (esim. admin)
      const localUser = localStorage.getItem('current_user');
      if (localUser) {
        console.log('ℹ️ Firebase Auth ei tunne käyttäjää, mutta LocalStorage:ssa on käyttäjä');
        // Älä poista LocalStorage käyttäjää jos Firebase vain ei tunne sitä
        return;
      }
      
      // Käyttäjä todella kirjautunut ulos
      console.log('Käyttäjä kirjautunut ulos Firebase:sta');
      localStorage.removeItem('current_user');
      localStorage.removeItem('user_logged_in');
      
      if (typeof window.shopApp !== 'undefined') {
        window.shopApp.currentUser = null;
        window.shopApp.loadUserInfo();
      }
    }
  }

  async loginWithEmail(email, password) {
    if (this.fallbackToOldSystem || !this.isFirebaseReady) {
      return this.fallbackLogin(email, password);
    }

    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Firebase kirjautumisvirhe:', error);
      return { success: false, error: this.getFirebaseErrorMessage(error.code) };
    }
  }

  async registerWithEmail(email, password, userData) {
    if (this.fallbackToOldSystem || !this.isFirebaseReady) {
      return this.fallbackRegister(email, password, userData);
    }

    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      
      // Päivitä käyttäjäprofiili
      await userCredential.user.updateProfile({
        displayName: userData.name
      });
      
      // Tallenna lisätiedot Firestoreen
      if (window.firebaseDB && window.firebaseDB.db) {
        await window.firebaseDB.db.collection('users').doc(userCredential.user.uid).set({
          name: userData.name,
          phone: userData.phone || '',
          address: userData.address || '',
          isAdmin: email === 'admin@löytökauppa.fi',
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Firebase rekisteröintivirhe:', error);
      return { success: false, error: this.getFirebaseErrorMessage(error.code) };
    }
  }

  async logout() {
    if (this.fallbackToOldSystem || !this.isFirebaseReady) {
      return this.fallbackLogout();
    }

    try {
      await this.auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Firebase uloskirjautumisvirhe:', error);
      return { success: false, error: 'Uloskirjautuminen epäonnistui' };
    }
  }

  getCurrentUser() {
    if (this.fallbackToOldSystem || !this.isFirebaseReady) {
      return JSON.parse(localStorage.getItem('current_user')) || null;
    }

    return this.auth.currentUser;
  }

  getFirebaseErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'Käyttäjää ei löydy. Tarkista sähköpostiosoite.',
      'auth/wrong-password': 'Väärä salasana. Yritä uudelleen.',
      'auth/email-already-in-use': 'Sähköpostiosoite on jo käytössä.',
      'auth/weak-password': 'Salasana on liian heikko. Käytä vähintään 6 merkkiä.',
      'auth/invalid-email': 'Virheellinen sähköpostiosoite.',
      'auth/too-many-requests': 'Liian monta kirjautumisyritystä. Yritä myöhemmin uudelleen.',
      'auth/network-request-failed': 'Verkkovirhe. Tarkista internetyhteytesi.'
    };
    
    return errorMessages[errorCode] || 'Tuntematon virhe. Yritä uudelleen.';
  }

  // FALLBACK VANHOIHIN TOIMINTOIHIN
  fallbackLogin(email, password) {
    console.log('Käytetään vanhaa kirjautumisjärjestelmää');
    
    // Tarkista admin-tunnukset Firestore:sta
    return this.checkAdminCredentials(email, password);
  }
  
  async checkAdminCredentials(email, password) {
    try {
      // Tarkista Firestore:sta admin-tunnukset
      if (window.firebaseDB && window.firebaseDB.db) {
        const adminRef = window.firebaseDB.db.collection('admin_users').doc('admin');
        const adminDoc = await adminRef.get();
        
        if (adminDoc.exists) {
          const adminData = adminDoc.data();
          if (adminData.email === email && adminData.password === password) {
            const adminUser = {
              id: 'admin',
              name: adminData.name || 'Ylläpitäjä',
              email: adminData.email,
              phone: adminData.phone || '',
              address: adminData.address || '',
              isAdmin: true,
              loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('current_user', JSON.stringify(adminUser));
            localStorage.setItem('user_logged_in', 'true');
            
            return { success: true, user: adminUser };
          }
        }
      }
      
      // Fallback: tarkista tavalliset käyttäjät
      const users = JSON.parse(localStorage.getItem('registered_users')) || [];
      const user = users.find(u => u.email === email);
      
      if (user && user.password === password) {
        const userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: user.address || '',
          isAdmin: false,
          loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('current_user', JSON.stringify(userData));
        localStorage.setItem('user_logged_in', 'true');
        
        return { success: true, user: userData };
      }
      
      return { success: false, error: 'Väärä sähköposti tai salasana' };
      
    } catch (error) {
      console.error('Kirjautumisvirhe:', error);
      return { success: false, error: 'Kirjautuminen epäonnistui' };
    }
  }

  fallbackRegister(email, password, userData) {
    console.log('Käytetään vanhaa rekisteröintijärjestelmää');
    
    const users = JSON.parse(localStorage.getItem('registered_users')) || [];
    
    // Tarkista onko sähköposti jo käytössä
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Sähköpostiosoite on jo käytössä' };
    }
    
    // Luo uusi käyttäjä
    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: email,
      password: password,
      phone: userData.phone || '',
      address: userData.address || '',
      isAdmin: email === 'admin@löytökauppa.fi',
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('registered_users', JSON.stringify(users));
    
    return { success: true, user: newUser };
  }

  fallbackLogout() {
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_logged_in');
    return { success: true };
  }
}

// LOMAKKEIDEN KÄSITTELY
class AuthFormHandler {
  constructor() {
    this.firebaseAuth = new FirebaseAuth();
    this.currentMode = 'login';
    this.init();
  }

  async init() {
    await this.firebaseAuth.init();
    this.setupEventListeners();
    this.updateFormDisplay();
  }

  setupEventListeners() {
    // Välilehtien vaihto
    document.getElementById('loginTab')?.addEventListener('click', () => this.switchMode('login'));
    document.getElementById('registerTab')?.addEventListener('click', () => this.switchMode('register'));
    
    // Lomakkeiden lähetys
    document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
    
    // Salasanan näyttäminen/piilottaminen
    document.querySelectorAll('.password-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => this.togglePasswordVisibility(toggle));
    });
  }

  switchMode(mode) {
    this.currentMode = mode;
    this.updateFormDisplay();
  }

  updateFormDisplay() {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (this.currentMode === 'login') {
      loginTab?.classList.add('active');
      registerTab?.classList.remove('active');
      loginForm?.classList.add('active');
      registerForm?.classList.remove('active');
    } else {
      loginTab?.classList.remove('active');
      registerTab?.classList.add('active');
      loginForm?.classList.remove('active');
      registerForm?.classList.add('active');
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      this.showMessage('Täytä kaikki kentät', 'error');
      return;
    }

    this.setLoading(true);
    
    try {
      const result = await this.firebaseAuth.loginWithEmail(email, password);
      
      if (result.success) {
        this.showMessage('Kirjautuminen onnistui! 🎉', 'success');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        this.showMessage(result.error, 'error');
      }
    } catch (error) {
      console.error('Kirjautumisvirhe:', error);
      this.showMessage('Kirjautuminen epäonnistui. Yritä uudelleen.', 'error');
    }
    
    this.setLoading(false);
  }

  async handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
      this.showMessage('Täytä kaikki kentät', 'error');
      return;
    }

    if (password !== confirmPassword) {
      this.showMessage('Salasanat eivät täsmää', 'error');
      return;
    }

    if (password.length < 6) {
      this.showMessage('Salasanan tulee olla vähintään 6 merkkiä', 'error');
      return;
    }

    this.setLoading(true);
    
    try {
      const userData = { name };
      const result = await this.firebaseAuth.registerWithEmail(email, password, userData);
      
      if (result.success) {
        this.showMessage('Rekisteröinti onnistui! Kirjaudutaan sisään... 🎉', 'success');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      } else {
        this.showMessage(result.error, 'error');
      }
    } catch (error) {
      console.error('Rekisteröintivirhe:', error);
      this.showMessage('Rekisteröinti epäonnistui. Yritä uudelleen.', 'error');
    }
    
    this.setLoading(false);
  }

  togglePasswordVisibility(toggle) {
    const input = toggle.previousElementSibling;
    const icon = toggle.querySelector('i');
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
    }
  }

  showMessage(message, type) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.className = `message ${type}`;
      messageElement.style.display = 'block';
      
      setTimeout(() => {
        messageElement.style.display = 'none';
      }, 5000);
    }
  }

  setLoading(isLoading) {
    const loginBtn = document.querySelector('#loginForm button[type="submit"]');
    const registerBtn = document.querySelector('#registerForm button[type="submit"]');
    
    if (isLoading) {
      loginBtn?.setAttribute('disabled', 'true');
      registerBtn?.setAttribute('disabled', 'true');
      loginBtn && (loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kirjaudutaan...');
      registerBtn && (registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rekisteröidään...');
    } else {
      loginBtn?.removeAttribute('disabled');
      registerBtn?.removeAttribute('disabled');
      loginBtn && (loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Kirjaudu sisään');
      registerBtn && (registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Rekisteröidy');
    }
  }

  // Tarkista onko käyttäjä admin Firestore:sta
  async checkIfAdmin(email) {
    try {
      if (this.db) {
        const adminRef = this.db.collection('admin_users').doc('admin');
        const adminDoc = await adminRef.get();
        
        if (adminDoc.exists) {
          const adminData = adminDoc.data();
          return adminData.email === email;
        }
      }
      return false;
    } catch (error) {
      console.error('Virhe admin-tarkistuksessa:', error);
      return false;
    }
  }
}

// GLOBAALIT FUNKTIOT YHTEENSOPIVUUDELLE
async function logout() {
  if (window.authHandler?.firebaseAuth) {
    const result = await window.authHandler.firebaseAuth.logout();
    if (result.success) {
      alert('Kirjauduit ulos onnistuneesti!');
      window.location.href = 'index.html';
    }
  } else {
    // Fallback vanhaan systeemiin
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_logged_in');
    alert('Kirjauduit ulos onnistuneesti!');
    window.location.href = 'index.html';
  }
}

// Alusta kun sivu latautuu
document.addEventListener('DOMContentLoaded', function() {
  // Tarkista onko käyttäjä jo kirjautunut
  const currentUser = localStorage.getItem('current_user');
  if (currentUser && window.location.pathname.includes('login.html')) {
    // Ohjaa etusivulle jos jo kirjautunut
    window.location.href = 'index.html';
    return;
  }
  
  // Alusta lomakkeiden käsittelijä
  window.authHandler = new AuthFormHandler();
  window.firebaseAuth = new FirebaseAuth(); // Lisätään debug-sivua varten
});