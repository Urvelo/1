// Firebase Authentication - Moderni v11 versio (vain Auth, ei Firestore)
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

class ModernFirebaseAuth {
  constructor() {
    this.auth = null;
    this.currentUser = null;
    this.debugMode = window.location.hostname.includes('localhost') || 
                    window.location.hostname.includes('127.0.0.1') || 
                    window.location.hostname.includes('github.dev') ||
                    window.location.hostname.includes('codespaces');
    
    console.log('🔥 Firebase Auth Manager alustetaan...');
    this.isInitialized = false;
    
    // Odota Firebase config:ia
    this.initPromise = this.waitForFirebaseConfig();
  }

  // ADMIN-DOMAININ TARKISTUS (ei kovakoodattuja sähköposteja)
  checkAdminDomain(email) {
    if (!email) return false;
    
    const adminDomains = [
      '@loytokauppa.fi',
      '@admin.loytokauppa.fi'
    ];
    
    return adminDomains.some(domain => email.endsWith(domain));
  }

  async waitForFirebaseConfig() {
    let attempts = 0;
    const maxAttempts = 50; // 5 sekuntia max
    
    while (attempts < maxAttempts) {
      if (window.firebaseAuth) {
        console.log('✅ Firebase Auth löytyi windowista');
        this.auth = window.firebaseAuth;
        this.isInitialized = true;
        this.init();
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    console.error('❌ Firebase Auth ei alustunu 5 sekunnissa');
    throw new Error('Firebase Auth alustus epäonnistui');
  }

  // Turvallinen debug-logging
  debugLog(message, sensitiveData = null) {
    if (this.debugMode) {
      if (sensitiveData) {
        console.log(message, sensitiveData);
      } else {
        console.log(message);
      }
    } else {
      // Tuotannossa näytä vain perusviesti
      console.log(message.replace(/[:].*/,''));
    }
  }

  async init() {
    let attempts = 0;
    const maxAttempts = 10; // Maksimissaan 10 yritystä (10 sekuntia)
    
    const tryInit = () => {
      try {
        // Odota että Firebase-config on ladattu
        if (window.firebaseAuth) {
          this.auth = window.firebaseAuth;
          
          // Kuuntele kirjautumistilan muutoksia
          onAuthStateChanged(this.auth, (user) => {
            this.handleAuthStateChange(user);
          });
          
          // Tarkista mahdollinen redirect-tulos sivun latauksen yhteydessä
          this.checkRedirectResult();
          
          console.log('✅ ModernFirebaseAuth alustettu (vain Auth)');
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            console.log(`⏳ Odotetaan Firebase-config latautumista... (${attempts}/${maxAttempts})`);
            setTimeout(tryInit, 1000);
          } else {
            console.error('❌ Firebase-config ei latautunut 10 sekunnin kuluessa');
            console.error('🔧 Tarkista että firebase-config.js latautuu oikein');
            
            // Fallback: luo tyhjä auth-objekti virhetilanteessa
            this.auth = null;
            window.modernFirebaseAuthFailed = true;
          }
        }
      } catch (error) {
        console.error('❌ Virhe Firebase Auth alustuksessa:', error);
      }
    };
    
    tryInit();
  }

  // REKISTERÖINTI
  async register(email, password, userInfo) {
    try {
      this.debugLog('🔐 Rekisteröidään käyttäjä', this.debugMode ? email : '[sähköposti]');
      
      // Luo käyttäjä Firebase Auth:iin
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Päivitä käyttäjäprofiili
      await updateProfile(user, {
        displayName: userInfo.name
      });
      
      // Tallenna lisätiedot localStorage:iin (vältetään Firestore-ongelmat)
      const userData = {
        uid: user.uid,
        name: userInfo.name,
        email: user.email,
        phone: userInfo.phone || '',
        address: userInfo.address || '',
        provider: 'email',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isAdmin: this.checkAdminDomain(user.email)
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('user_logged_in', 'true');
      
      console.log('✅ Käyttäjä rekisteröity onnistuneesti:', user.uid);
      return { success: true, user: userData };
      
    } catch (error) {
      console.error('❌ Rekisteröinti epäonnistui:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // GOOGLE-KIRJAUTUMINEN (REDIRECT-POHJAINEN)
  async loginWithGoogle(useRedirect = true) {
    try {
      console.log('� Google-kirjautuminen aloitetaan (redirect:', useRedirect, ')');
      
      // Varmista että Firebase on alustettu
      await this.initPromise;
      
      if (!this.auth) {
        throw new Error('Firebase Auth ei ole käytettävissä');
      }

      // Lataa tarvittavat funktiot
      const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js');
      const provider = new GoogleAuthProvider();
      
      // Lisää scope jos tarvitaan
      provider.addScope('email');
      provider.addScope('profile');
      
      let result;
      
      if (useRedirect) {
        // Redirect-metodi (toimii aina, ei popup-ongelmia)
        const { signInWithRedirect, getRedirectResult } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js');
        
        // Varmista että auth on alustettu
        if (!this.auth) {
          throw new Error('Firebase Auth ei ole alustettu');
        }
        
        // Tarkista onko redirect-tulos odottamassa
        console.log('🔍 Tarkistetaan redirect-tulosta...');
        const redirectResult = await getRedirectResult(this.auth);
        
        if (redirectResult && redirectResult.user) {
          console.log('✅ Redirect-tulos löytyi:', redirectResult.user.email);
          result = redirectResult;
        } else if (redirectResult === null) {
          console.log('🔄 Ei redirect-tulosta, aloitetaan uusi kirjautuminen');
          await signInWithRedirect(this.auth, provider);
          return { success: true, pending: true }; // Sivu latautuu uudelleen
        } else {
          console.log('⏳ Redirect käynnissä tai ei tulosta');
          return { success: false, error: 'Redirect-kirjautuminen kesken' };
        }
      } else {
        // Popup-metodi (fallback)
        if (!this.auth) {
          throw new Error('Firebase Auth ei ole alustettu');
        }
        result = await signInWithPopup(this.auth, provider);
      }
      
      const user = result.user;
      console.log('✅ Google-kirjautuminen onnistui:', user.email);
      
      // Tallennetaan käyttäjätiedot localStorage:iin (vältetään Firestore-ongelmat)
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        provider: 'google',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isAdmin: this.checkAdminDomain(user.email)
      };
      
      // Tallenna localStorage:iin
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('user_logged_in', 'true');
      
      console.log('✅ Käyttäjätiedot tallennettu localStorage:iin');
      
      return { 
        success: true, 
        user: userData 
      };
      
    } catch (error) {
      console.error('❌ Google-kirjautuminen epäonnistui:', error);
      
      // 🔧 PARANNETTU ERROR HANDLING
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Kirjautuminen peruutettiin' };
      } else if (error.code === 'auth/popup-blocked') {
        console.log('🚫 Popup blokattu, yritetään redirect-metodilla...');
        // Automaattinen fallback redirect-metodiin
        return await this.loginWithGoogle(true);
      } else if (error.code === 'auth/unauthorized-domain') {
        return { 
          success: false, 
          error: 'Domain ei ole valtuutettu. Lisää ' + window.location.hostname + ' Firebase-konsoliin.' 
        };
      } else if (error.code === 'auth/network-request-failed') {
        return { success: false, error: 'Verkkovirhe. Tarkista internetyhteytesi.' };
      }
      
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // KIRJAUTUMINEN (EMAIL/PASSWORD - säilytetään varmuuden vuoksi)
  async login(email, password) {
    try {
      console.log('🔐 Kirjaudutaan sisään:', email);
      console.log('🔑 Salasanan pituus:', password?.length);
      console.log('🔥 Auth objekti:', this.auth);
      console.log('🌐 Auth domain:', this.auth?.config?.authDomain);
      
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Luo käyttäjätiedot localStorage:iin (vältetään Firestore-ongelmat)
      const userData = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        phone: '',
        address: '',
        provider: 'email',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isAdmin: this.checkAdminDomain(user.email)
      };
      
      // Tallenna localStorage:iin
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('user_logged_in', 'true');
      
      console.log('✅ Kirjautuminen onnistui:', user.uid);
      return { success: true, user: userData };
      
    } catch (error) {
      console.error('❌ Kirjautuminen epäonnistui:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // KIRJAUTUMINEN SÄHKÖPOSTILLA (erillinen wrapper-funktio)
  async loginWithEmail(email, password) {
    return await this.login(email, password);
  }

  // ULOSKIRJAUTUMINEN
  async logout() {
    try {
      await signOut(this.auth);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user_logged_in');
      console.log('✅ Uloskirjautuminen onnistui');
      return { success: true };
    } catch (error) {
      console.error('❌ Uloskirjautuminen epäonnistui:', error);
      return { success: false, error: error.message };
    }
  }

  // ADMIN-OIKEUKSIEN TARKISTUS (domain-pohjainen)
  async checkAdminStatus(email) {
    return this.checkAdminDomain(email);
  }

  // KIRJAUTUMISTILAN MUUTOS (localStorage-pohjainen)
  async handleAuthStateChange(user) {
    if (user) {
      console.log('🔄 Käyttäjä kirjautunut:', user.email);
      
      // Luo käyttäjätiedot lokaalisti (ei Firestore-yhteyttä)
      const userData = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        phone: '',
        address: '',
        provider: 'firebase',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isAdmin: await this.checkAdminStatus(user.email)
      };
      
      // Tallenna localStorage:iin
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('user_logged_in', 'true');
      
      this.currentUser = userData;
      
      // Päivitä UI
      if (typeof window.shopApp !== 'undefined') {
        window.shopApp.currentUser = userData;
        window.shopApp.loadUserInfo();
      }
      
      console.log('✅ Käyttäjätilan päivitys valmis (localStorage)');
    } else {
      console.log('🔄 Käyttäjä kirjautunut ulos');
      this.currentUser = null;
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user_logged_in');
    }
  }

  // Tarkista redirect-tulos sivun latauksen yhteydessä
  async checkRedirectResult() {
    try {
      const { getRedirectResult } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js');
      const result = await getRedirectResult(this.auth);
      
      if (result && result.user) {
        console.log('🎯 Redirect-kirjautuminen onnistui sivun latauksen yhteydessä:', result.user.email);
        
        // Käsittele kirjautuminen samalla tavalla kuin normaalissa loginWithGoogle:ssa
        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
          photoURL: result.user.photoURL,
          provider: 'google',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('user_logged_in', 'true');
        
        console.log('✅ Redirect-kirjautuminen tallennettu localStorage:iin');
        
        // Päivitä UI jos mahdollista
        if (typeof window.updateUserUI === 'function') {
          window.updateUserUI();
        }
      }
    } catch (error) {
      console.log('🔍 Ei redirect-tulosta tai virhe tarkistuksessa:', error.message);
    }
  }

  // VIRHEVIESTIEN KÄÄNNÖS
  getErrorMessage(errorCode) {
    const messages = {
      'auth/email-already-in-use': 'Sähköpostiosoite on jo käytössä',
      'auth/weak-password': 'Salasana on liian heikko',
      'auth/user-not-found': 'Käyttäjää ei löytynyt',
      'auth/wrong-password': 'Väärä salasana',
      'auth/invalid-email': 'Virheellinen sähköpostiosoite',
      'auth/too-many-requests': 'Liian monta yritystä. Yritä hetken päästä uudelleen.',
      'auth/network-request-failed': 'Verkkovirhe. Tarkista internetyhteytesi.',
      'auth/unauthorized-domain': 'Domain ei ole valtuutettu Firebase-projektissa',
      'auth/popup-blocked': 'Popup-ikkuna blokattiin. Salli popup-ikkunat tai käytä uudelleenohjausta.',
      'auth/popup-closed-by-user': 'Kirjautuminen peruutettiin',
      'auth/cancelled-popup-request': 'Popup-pyyntö peruutettiin'
    };
    
    return messages[errorCode] || 'Tuntematon virhe tapahtui';
  }
}

// Globaali instanssi
window.modernFirebaseAuth = new ModernFirebaseAuth();

export { ModernFirebaseAuth };