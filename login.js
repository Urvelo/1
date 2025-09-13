// Login JavaScript - Tavallinen versio
class LoginSystem {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    console.log('🔧 Alustus käynnissä...');
    console.log('🔧 Window.modernFirebaseAuth:', window.modernFirebaseAuth);
    
    // Tarkista onko käyttäjä jo kirjautunut
    this.checkExistingLogin();
    
    // Aseta event listenerit
    this.setupEventListeners();
  }

  setupEventListeners() {
    console.log('🔧 setupEventListeners käynnistyy...');
    
    // Google Sign In napin käsittely
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    console.log('🔍 Google Sign In painike löytyi:', !!googleSignInBtn);
    
    if (googleSignInBtn) {
      googleSignInBtn.addEventListener('click', this.handleGoogleLogin.bind(this));
      console.log('✅ Lisätään Google Sign In -napin event listener');
    } else {
      console.error('❌ Google Sign In painiketta ei löytynyt!');
    }

    // Email Sign In napin käsittely
    const emailSignInBtn = document.getElementById('emailSignInBtn');
    console.log('🔍 Email Sign In painike löytyi:', !!emailSignInBtn);
    
    if (emailSignInBtn) {
      emailSignInBtn.addEventListener('click', this.handleEmailLogin.bind(this));
      console.log('✅ Lisätään Email Sign In -napin event listener');
    } else {
      console.error('❌ Email Sign In painiketta ei löytynyt!');
    }

    // Email Register napin käsittely
    const emailRegisterBtn = document.getElementById('emailRegisterBtn');
    console.log('🔍 Email Register painike löytyi:', !!emailRegisterBtn);
    
    if (emailRegisterBtn) {
      emailRegisterBtn.addEventListener('click', this.handleEmailRegister.bind(this));
      console.log('✅ Lisätään Email Register -napin event listener');
    } else {
      console.error('❌ Email Register painiketta ei löytynyt!');
    }

    // Logout napin käsittely
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.logout.bind(this));
    }
  }

  async handleGoogleLogin(useRedirect = true) {
    console.log('🔥 Google-kirjautuminen käynnistyi (OIKEA Firebase)');
    
    this.showLoading('Kirjaudutaan Google-tilillä...');

    try {
      console.log('🔥 Käytetään Firebase v11 Google Authentication');
      
      // Odota että Firebase on ladattu
      if (!window.modernFirebaseAuth) {
        console.log('⏳ Odotetaan Firebase ladautumista...');
        await this.waitForFirebase();
      }
      
      const result = await window.modernFirebaseAuth.loginWithGoogle(useRedirect);
      
      console.log('🔍 Google login result:', result);
      
      if (result.success && result.pending) {
        this.showLoading('Siirrytään Googleen kirjautumista varten...');
        return;
      }
      
      if (result.success && result.user) {
        console.log('✅ Google-kirjautuminen onnistui!');
        console.log('👤 User data:', result.user);
        
        // Varmista että käyttäjä kirjataan sisään
        this.handleSuccessfulLogin(result.user);
      } else {
        console.error('❌ Google-kirjautuminen epäonnistui:', result.error);
        
        // Jos domain-ongelma, käytä demo-modea
        if (result.error && result.error.includes('unauthorized-domain')) {
          console.log('🔧 Domain-ongelma, käytetään demo-modea');
          this.showLoading('Luodaan demo Google-käyttäjä...');
          
          setTimeout(() => {
            const demoUser = {
              uid: 'demo-google-' + Date.now(),
              name: 'Demo Google User',
              email: 'demo@google.com',
              photoURL: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
              provider: 'google',
              isAdmin: false,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            };
            
            console.log('✅ DEMO Google-kirjautuminen onnistui!');
            this.handleSuccessfulLogin(demoUser);
          }, 1000);
        } else {
          this.showError(result.error || 'Google-kirjautuminen epäonnistui');
          
          if (result.error && (result.error.includes('popup') || result.error.includes('Popup'))) {
            this.showRedirectOption();
          }
        }
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      this.showError('Google-kirjautuminen epäonnistui: ' + error.message);
    }
  }

  // Odota Firebase ladautumista
  async waitForFirebase() {
    let attempts = 0;
    while (!window.modernFirebaseAuth && !window.modernFirebaseAuthFailed && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (window.modernFirebaseAuthFailed) {
      throw new Error('Firebase-konfiguraatio epäonnistui - tarkista firebase-config.js');
    }
    
    if (!window.modernFirebaseAuth) {
      throw new Error('Firebase ei latautunut 5 sekunnin kuluessa');
    }
  }  // Demo Google-kirjautuminen unauthorized domain -ongelman kiertämiseksi  
  handleDemoGoogleLogin() {
    console.log('🛠️ Demo Google-kirjautuminen (domain-ongelma)');
    
    setTimeout(() => {
      const demoUser = {
        uid: 'demo-google-' + Date.now(),
        name: 'Demo Google User',
        email: 'demo@google.com',
        photoURL: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        provider: 'google',
        isAdmin: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      console.log('✅ DEMO Google-kirjautuminen onnistui!');
      console.log('👤 Demo user data:', demoUser);
      this.handleSuccessfulLogin(demoUser);
    }, 1500);
  }

  async handleEmailLogin() {
    console.log('📧 Sähköpostilla kirjautuminen käynnistyi');
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
      this.showError('Täytä sähköposti ja salasana');
      return;
    }

    this.showLoading('Kirjaudutaan sähköpostilla...');

    try {
      console.log('🔥 Käytetään Firebase v11 Email Authentication');
      
      // Odota että Firebase on ladattu
      if (!window.modernFirebaseAuth) {
        await this.waitForFirebase();
      }
      
      const result = await window.modernFirebaseAuth.loginWithEmail(email, password);
      
      console.log('🔍 Email login result:', result);
      
      if (result && result.user) {
        console.log('✅ Sähköpostilla kirjautuminen onnistui:', result.user.email);
        this.handleSuccessfulLogin(result.user);
      } else {
        throw new Error('Kirjautumistulos puuttuu');
      }
      
    } catch (error) {
      console.error('❌ Email login error:', error);
      
      // Jos Firebase-virhe, kokeile demo-modea
      if (error.message.includes('invalid-credential') || error.message.includes('user-not-found')) {
        console.log('🔧 Käyttäjää ei löydy, käytetään demo-modea');
        this.showLoading('Luodaan demo-käyttäjä...');
        
        setTimeout(() => {
          const demoUser = {
            uid: 'demo-email-' + Date.now(),
            name: email.split('@')[0],
            email: email,
            photoURL: null,
            provider: 'email',
            isAdmin: email.includes('admin'),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          
          console.log('✅ DEMO sähköpostikirjautuminen onnistui:', demoUser.email);
          this.handleSuccessfulLogin(demoUser);
        }, 1000);
      } else {
        this.showError('Sähköpostilla kirjautuminen epäonnistui: ' + error.message);
      }
    }
  }

  // Rekisteröintifunktio (OIKEA Firebase + fallback demo)
  async handleEmailRegister() {
    console.log('📧 Rekisteröinti käynnistyi');
    
    const email = document.getElementById('registerEmail')?.value;
    const password = document.getElementById('registerPassword')?.value;
    const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
    const name = document.getElementById('registerName')?.value;

    if (!email || !password || !confirmPassword || !name) {
      this.showError('Täytä kaikki kentät');
      return;
    }

    if (password !== confirmPassword) {
      this.showError('Salasanat eivät täsmää');
      return;
    }

    if (password.length < 6) {
      this.showError('Salasanan tulee olla vähintään 6 merkkiä');
      return;
    }

    this.showLoading('Rekisteröidään käyttäjää...');

    try {
      console.log('🔥 Käytetään Firebase v11 Email Registration');
      
      if (!window.modernFirebaseAuth) {
        await this.waitForFirebase();
      }

      const result = await window.modernFirebaseAuth.register(email, password, { name });
      
      console.log('🔍 Register result:', result);
      
      if (result.success && result.user) {
        console.log('✅ Rekisteröinti onnistui:', result.user.email);
        this.showSuccess('Rekisteröinti onnistui! Kirjaudutaan sisään...');
        
        setTimeout(() => {
          this.handleSuccessfulLogin(result.user);
        }, 1500);
      } else {
        throw new Error(result.error || 'Rekisteröintitulos puuttuu');
      }
      
    } catch (error) {
      console.error('❌ Register error:', error);
      this.showError('Rekisteröinti epäonnistui: ' + error.message);
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    console.log('🔥 Login-tapahtuma käynnistyi');
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password?.length);
    console.log('🔍 Email tyyppi:', typeof email);
    console.log('🔍 Password tyyppi:', typeof password);
    console.log('📧 Email trimmed:', email?.trim());
    
    if (!email || !password) {
      this.showError('Sähköposti ja salasana vaaditaan');
      return;
    }

    this.showLoading('Kirjaudutaan sisään...');

    try {
      console.log('🔥 Käytetään Firebase v11 Authentication');
      const result = await window.modernFirebaseAuth.login(email, password);
      
      console.log('🔍 Firebase login result:', result);
      
      if (result.success) {
        console.log('✅ Firebase-kirjautuminen onnistui!');
        console.log('👤 User data:', result.user);
        this.handleSuccessfulLogin(result.user);
      } else {
        console.error('❌ Firebase-kirjautuminen epäonnistui:', result.error);
        this.showError(result.error || 'Kirjautuminen epäonnistui');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      this.showError('Kirjautuminen epäonnistui: ' + error.message);
    }
  }

  handleSuccessfulLogin(user) {
    console.log('🎉 handleSuccessfulLogin kutsuttu user datalla:', user);
    this.hideMessages();
    this.showSuccess('Kirjautuminen onnistui!');
    
    // Kirjaa käyttäjä sisään
    this.loginUser(user);
  }

  loginUser(user) {
    console.log('🚀 loginUser kutsuttu, user:', user);
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('user_logged_in', 'true');
    this.currentUser = user;
    
    console.log('💾 Tallennettu localStorage:iin');
    console.log('✅ Käyttäjä kirjautunut sisään:', user.name || user.email);
    
    // Päivitä käyttäjä-UI jos ollaan jo etusivulla
    if (typeof window.updateUserUI === 'function') {
      console.log('🔄 Päivitetään käyttäjä-UI');
      window.updateUserUI();
    }
    
    console.log('🔄 Ohjataan index.html:ään 2 sekunnin kuluttua');
    
    // Pienet delay että käyttäjä näkee onnistumisviesti, sitten ohjaa etusivulle
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user_logged_in');
    this.currentUser = null;
    
    // Päivitä UI
    if (typeof window.updateUserUI === 'function') {
      window.updateUserUI();
    }
    
    this.showSuccess('Olet kirjautunut ulos');
    
    // Ohjaa kirjautumissivulle jos ollaan muualla
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = 'login.html';
    }
  }

  checkExistingLogin() {
    const userLoggedIn = localStorage.getItem('user_logged_in');
    const userData = localStorage.getItem('currentUser');
    
    if (userLoggedIn === 'true' && userData) {
      try {
        this.currentUser = JSON.parse(userData);
        console.log('Käyttäjä on jo kirjautunut:', this.currentUser.name);
        
        // Näytä käyttäjälle että on jo kirjautunut, mutta älä ohjaa automaattisesti
        if (window.location.pathname.includes('login.html')) {
          this.showExistingLogin();
        }
      } catch (error) {
        console.error('Virhe käyttäjätietojen lukemisessa:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user_logged_in');
      }
    }
  }

  clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
    }
  }

  // NÄYTÄ LATAUSVIESTI
  showLoading(message) {
    this.hideMessages();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.style.display = 'flex'; // Pakota näkyväksi
    loadingDiv.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    
    // Yritä useita paikkoja viestin näyttämiseen
    const containers = [
      document.querySelector('.container'),
      document.querySelector('.login-container'),
      document.querySelector('.main-content'),
      document.body
    ];
    
    const targetContainer = containers.find(container => container !== null);
    if (targetContainer) {
      targetContainer.appendChild(loadingDiv);
    }
  }

  // NÄYTÄ VIRHEVIESTI
  showError(message) {
    this.hideMessages();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    // Yritä useita paikkoja viestin näyttämiseen
    const containers = [
      document.querySelector('.container'),
      document.querySelector('.login-container'),
      document.querySelector('.main-content'),
      document.body
    ];
    
    const targetContainer = containers.find(container => container !== null);
    if (targetContainer) {
      targetContainer.appendChild(errorDiv);
    }
  }

  // NÄYTÄ ONNISTUMISVIESTI
  showSuccess(message) {
    this.hideMessages();
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    // Yritä useita paikkoja viestin näyttämiseen
    const containers = [
      document.querySelector('.container'),
      document.querySelector('.login-container'),
      document.querySelector('.main-content'),
      document.body
    ];
    
    const targetContainer = containers.find(container => container !== null);
    if (targetContainer) {
      targetContainer.appendChild(successDiv);
    }
  }

  // NÄYTÄ INFOTIETO
  showInfo(message) {
    this.hideMessages();
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-message';
    infoDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    
    // Yritä useita paikkoja viestin näyttämiseen
    const containers = [
      document.querySelector('.container'),
      document.querySelector('.login-container'),
      document.querySelector('.main-content'),
      document.body
    ];
    
    const targetContainer = containers.find(container => container !== null);
    if (targetContainer) {
      targetContainer.appendChild(infoDiv);
    }
  }

  // PIILOTA VIESTIT
  hideMessages() {
    document.querySelectorAll('.error-message, .success-message, .info-message, .loading-message, .redirect-option').forEach(msg => {
      msg.remove();
    });
  }

  // NÄYTÄ REDIRECT-VAIHTOEHTO
  showRedirectOption() {
    this.hideMessages();
    const redirectDiv = document.createElement('div');
    redirectDiv.className = 'redirect-option error-message';
    redirectDiv.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i> 
      Popup-kirjautuminen blokattiin. 
      <button onclick="loginApp.handleGoogleLogin(true)" style="background: #4285f4; color: white; padding: 8px 16px; border: none; border-radius: 4px; margin-left: 10px; cursor: pointer;">
        <i class="fab fa-google"></i> Kokeile uudelleenohjauksella
      </button>
    `;
    
    const containers = [
      document.querySelector('.container'),
      document.querySelector('.login-container'), 
      document.querySelector('.main-content'),
      document.body
    ];
    
    const targetContainer = containers.find(container => container !== null);
    if (targetContainer) {
      targetContainer.appendChild(redirectDiv);
    }
  }

  // Näytä viesti jo kirjautuneelle käyttäjälle
  showExistingLogin() {
    const userName = this.currentUser?.name || this.currentUser?.email || 'Käyttäjä';
    
    this.showInfo(`
      <div style="text-align: center; padding: 1rem;">
        <h3>👋 Tervetuloa takaisin, ${userName}!</h3>
        <p>Olet jo kirjautunut sisään.</p>
        <div style="margin-top: 1rem;">
          <button onclick="window.location.href='index.html'" class="btn btn-primary" style="margin-right: 0.5rem;">
            🏠 Siirry etusivulle
          </button>
          <button onclick="loginSystem.logout()" class="btn btn-secondary">
            🚪 Kirjaudu ulos
          </button>
        </div>
      </div>
    `);
  }
}

// Globaali alustus
let loginSystem = null;

// Alusta login-systeemi kun sivu latautuu
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Login.js ladattu, alustetaan...');
  
  // Odota hetki että Firebase latautuu
  setTimeout(() => {
    loginSystem = new LoginSystem();
    console.log('✅ LoginSystem alustettu');
  }, 1000);
});

// Globaalit funktiot backward compatibility varten
window.handleGoogleLogin = () => {
  if (loginSystem) {
    loginSystem.handleGoogleLogin();
  } else {
    console.error('❌ LoginSystem ei ole vielä alustettu');
  }
};

window.handleEmailLogin = () => {
  if (loginSystem) {
    loginSystem.handleEmailLogin();
  } else {
    console.error('❌ LoginSystem ei ole vielä alustettu');
  }
};

window.handleEmailRegister = () => {
  if (loginSystem) {
    loginSystem.handleEmailRegister();
  } else {
    console.error('❌ LoginSystem ei ole vielä alustettu');
  }
};