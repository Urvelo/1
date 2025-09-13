// Login JavaScript - Puhdas versio
class LoginSystem {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    console.log('🔧 Alustus käynnissä...');
    
    // Tarkista onko käyttäjä jo kirjautunut
    this.checkExistingLogin();
    
    // Aseta event listenerit
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login formin käsittely
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    // Register formin käsittely
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', this.handleRegister.bind(this));
    }

    // Logout napin käsittely
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.logout.bind(this));
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    console.log('🔥 Login-tapahtuma käynnistyi');
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password?.length);
    
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

  async handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !email || !password) {
      this.showError('Kaikki kentät vaaditaan');
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

    this.showLoading('Luodaan tiliä...');

    try {
      const result = await window.modernFirebaseAuth.register(email, password, name);
      
      if (result.success) {
        this.showSuccess('Tili luotu onnistuneesti! Voit nyt kirjautua sisään.');
        this.switchTab('login');
        this.clearForm('registerForm');
      } else {
        this.showError(result.error || 'Rekisteröinti epäonnistui');
      }
    } catch (error) {
      console.error('Register error:', error);
      this.showError('Rekisteröinti epäonnistui: ' + error.message);
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
    
    console.log('🔄 Ohjataan index.html:ään');
    // Ohjaa etusivulle
    window.location.href = 'index.html';
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

  switchTab(tabName) {
    // Piilota kaikki tabit
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Näytä valittu tabi
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
      selectedTab.classList.add('active');
    }
    
    // Päivitä tab-napit
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const selectedBtn = document.querySelector(`[onclick*="${tabName}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active');
    }
  }

  verifyCode() {
    const code = document.getElementById('verificationCode').value;
    if (!code) {
      this.showError('Anna vahvistuskoodi');
      return;
    }
    
    this.showLoading('Vahvistetaan koodia...');
    
    // Tässä olisi oikea vahvistuslogiikka
    setTimeout(() => {
      this.showSuccess('Koodi vahvistettu!');
      this.switchTab('login');
    }, 1000);
  }

  resendCode() {
    this.showLoading('Lähetetään uusi koodi...');
    
    // Tässä olisi uudelleenlähetyslogiikka
    setTimeout(() => {
      this.showSuccess('Uusi koodi lähetetty!');
    }, 1000);
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

// Globaalit funktiot HTML:lle
window.switchTab = function(tab) {
  if (window.loginSystem) {
    window.loginSystem.switchTab(tab);
  }
};

window.verifyCode = function() {
  if (window.loginSystem) {
    window.loginSystem.verifyCode();
  }
};

window.resendCode = function() {
  if (window.loginSystem) {
    window.loginSystem.resendCode();
  }
};

// Alusta järjestelmä kun sivu on ladattu
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM ladattu, alustetaan Login System');
  try {
    window.loginSystem = new LoginSystem();
    console.log('✅ LoginSystem alustettu onnistuneesti');
  } catch (error) {
    console.error('❌ LoginSystem alustus epäonnistui:', error);
    console.error('❌ Error stack:', error.stack);
  }
});