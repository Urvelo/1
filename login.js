// Login JavaScript - ES Modules versio
export class LoginSystem {
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

    // Logout napin käsittely
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.logout.bind(this));
    }
  }

  async handleGoogleLogin() {
    console.log('🔥 Google-kirjautuminen käynnistyi');
    
    this.showLoading('Kirjaudutaan Google-tilillä...');

    try {
      console.log('🔥 Käytetään Firebase v11 Google Authentication');
      const result = await window.modernFirebaseAuth.loginWithGoogle();
      
      console.log('🔍 Google login result:', result);
      
      if (result.success) {
        console.log('✅ Google-kirjautuminen onnistui!');
        console.log('👤 User data:', result.user);
        this.handleSuccessfulLogin(result.user);
      } else {
        console.error('❌ Google-kirjautuminen epäonnistui:', result.error);
        this.showError(result.error || 'Google-kirjautuminen epäonnistui');
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      this.showError('Google-kirjautuminen epäonnistui: ' + error.message);
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
    
    localStorage.setItem('current_user', JSON.stringify(user));
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
    localStorage.removeItem('current_user');
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
    const userData = localStorage.getItem('current_user');
    
    if (userLoggedIn === 'true' && userData) {
      try {
        this.currentUser = JSON.parse(userData);
        console.log('Käyttäjä on jo kirjautunut:', this.currentUser.name);
        
        // Jos ollaan kirjautumissivulla ja käyttäjä on jo kirjautunut, ohjaa etusivulle
        if (window.location.pathname.includes('login.html')) {
          window.location.href = 'index.html';
        }
      } catch (error) {
        console.error('Virhe käyttäjätietojen lukemisessa:', error);
        localStorage.removeItem('current_user');
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

  // PIILOTA VIESTIT
  hideMessages() {
    document.querySelectorAll('.error-message, .success-message, .loading-message').forEach(msg => {
      msg.remove();
    });
  }
}