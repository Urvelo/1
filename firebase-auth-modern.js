// Firebase Authentication - Moderni v11 versio
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
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

class ModernFirebaseAuth {
  constructor() {
    this.auth = null;
    this.db = null;
    this.currentUser = null;
    this.init();
  }

  async init() {
    try {
      // Odota että Firebase-config on ladattu
      if (window.firebaseAuth && window.firebaseDB) {
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDB.db;
        
        // Kuuntele kirjautumistilan muutoksia
        onAuthStateChanged(this.auth, (user) => {
          this.handleAuthStateChange(user);
        });
        
        console.log('✅ ModernFirebaseAuth alustettu');
      } else {
        setTimeout(() => this.init(), 1000);
      }
    } catch (error) {
      console.error('❌ Virhe Firebase Auth alustuksessa:', error);
    }
  }

  // REKISTERÖINTI
  async register(email, password, userInfo) {
    try {
      console.log('🔐 Rekisteröidään käyttäjä:', email);
      
      // Luo käyttäjä Firebase Auth:iin
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Päivitä käyttäjäprofiili
      await updateProfile(user, {
        displayName: userInfo.name
      });
      
      // Tallenna lisätiedot Firestore:en
      const userData = {
        uid: user.uid,
        name: userInfo.name,
        email: user.email,
        phone: userInfo.phone || '',
        address: userInfo.address || '',
        createdAt: new Date().toISOString(),
        isAdmin: false
      };
      
      await setDoc(doc(this.db, 'users', user.uid), userData);
      
      console.log('✅ Käyttäjä rekisteröity onnistuneesti:', user.uid);
      return { success: true, user: userData };
      
    } catch (error) {
      console.error('❌ Rekisteröinti epäonnistui:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // GOOGLE-KIRJAUTUMINEN (PARANNETTU VERSIO)
  async loginWithGoogle(useRedirect = false) {
    try {
      console.log('🔐 Google-kirjautuminen aloitettu', useRedirect ? '(redirect)' : '(popup)');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // 🔧 Lisätään custom parameters popup-ongelmien välttämiseksi
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      let result;
      
      if (useRedirect) {
        // Redirect-metodi (toimii aina, mutta sivu latautuu uudelleen)
        const { signInWithRedirect, getRedirectResult } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js');
        
        // Tarkista onko redirect-tulos odottamassa
        const redirectResult = await getRedirectResult(this.auth);
        if (redirectResult) {
          result = redirectResult;
        } else {
          await signInWithRedirect(this.auth, provider);
          return { success: true, pending: true }; // Sivu latautuu uudelleen
        }
      } else {
        // Popup-metodi (nopea, mutta voi blokkautua)
        result = await signInWithPopup(this.auth, provider);
      }
      
      const user = result.user;
      console.log('✅ Google-kirjautuminen onnistui:', user.email);
      
      // Tallennetaan/päivitetään käyttäjätiedot Firestore:en
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        provider: 'google',
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      // Tallenna Firestore:en
      await setDoc(doc(this.db, 'users', user.uid), userData, { merge: true });
      
      console.log('✅ Käyttäjätiedot tallennettu Firestore:en');
      
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
      
      // Hae käyttäjätiedot Firestore:sta
      const userDoc = await getDoc(doc(this.db, 'users', user.uid));
      let userData;
      
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        // Jos ei löydy Firestore:sta, luo perustiedot
        userData = {
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          phone: '',
          address: '',
          createdAt: new Date().toISOString(),
          isAdmin: false
        };
        await setDoc(doc(this.db, 'users', user.uid), userData);
      }
      
      // Tarkista admin-oikeudet
      userData.isAdmin = await this.checkAdminStatus(user.email);
      
      console.log('✅ Kirjautuminen onnistui:', user.uid);
      return { success: true, user: userData };
      
    } catch (error) {
      console.error('❌ Kirjautuminen epäonnistui:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // ULOSKIRJAUTUMINEN
  async logout() {
    try {
      await signOut(this.auth);
      localStorage.removeItem('current_user');
      localStorage.removeItem('user_logged_in');
      console.log('✅ Uloskirjautuminen onnistui');
      return { success: true };
    } catch (error) {
      console.error('❌ Uloskirjautuminen epäonnistui:', error);
      return { success: false, error: error.message };
    }
  }

  // ADMIN-OIKEUKSIEN TARKISTUS
  async checkAdminStatus(email) {
    try {
      const adminDoc = await getDoc(doc(this.db, 'admin_users', 'admin'));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        return adminData.email === email;
      }
      return false;
    } catch (error) {
      console.error('Virhe admin-tarkistuksessa:', error);
      return false;
    }
  }

  // KIRJAUTUMISTILAN MUUTOS
  async handleAuthStateChange(user) {
    if (user) {
      console.log('🔄 Käyttäjä kirjautunut:', user.email);
      
      // Hae tai luo käyttäjätiedot
      const userDoc = await getDoc(doc(this.db, 'users', user.uid));
      let userData;
      
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        userData = {
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          phone: '',
          address: '',
          createdAt: new Date().toISOString(),
          isAdmin: await this.checkAdminStatus(user.email)
        };
      }
      
      // Tallenna localStorage:iin yhteensopivuutta varten
      localStorage.setItem('current_user', JSON.stringify(userData));
      localStorage.setItem('user_logged_in', 'true');
      
      this.currentUser = userData;
      
      // Päivitä UI
      if (typeof window.shopApp !== 'undefined') {
        window.shopApp.currentUser = userData;
        window.shopApp.loadUserInfo();
      }
      
    } else {
      console.log('🔄 Käyttäjä kirjautunut ulos');
      this.currentUser = null;
      localStorage.removeItem('current_user');
      localStorage.removeItem('user_logged_in');
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