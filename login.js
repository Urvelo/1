// Login JavaScript - Puhdas versio
class LoginSystem {
  constructor() {
    this.currentUser = null;
    this.verificationData = null;
    this.init();
  }

  init() {
    console.log('🔧 Alustetaan login-järjestelmä');
    
    // Tarkista onko käyttäjä jo kirjautunut
    this.checkExistingLogin();
    
    // Event listenerit
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
      console.log('✅ Lisätään login-formin event listener');
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    if (registerForm) {
      console.log('✅ Lisätään register-formin event listener');
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }
  }

  checkExistingLogin() {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      // Käyttäjä on jo kirjautunut, ohjaa etusivulle
      window.location.href = 'index.html';
    }
  }

  // VÄLILEHDEN VAIHTO
  switchTab(tab) {
    // Poista active-luokat
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    // Lisää active-luokka valitulle
    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
    
    // Piilota virheilmoitukset
    this.hideMessages();
  }

  // KIRJAUTUMINEN
  async handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      this.showError('Täytä kaikki kentät');
      return;
    }
    
    console.log('🔐 Yritetään kirjautua sähköpostilla:', email);
    
    // Tarkista admin-tunnukset
    if (email === 'admin@löytökauppa.fi' && password === 'admin123') {
      console.log('✅ Admin-tunnukset tunnistettu!');
      this.loginUser({
        id: 'admin',
        name: 'Admin',
        email: email,
        isAdmin: true
      });
      return;
    }
    
    // Hae tallennetut käyttäjät
    const users = JSON.parse(localStorage.getItem('registered_users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      this.loginUser(user);
    } else {
      this.showError('Virheelliset kirjautumistiedot! Tarkista sähköposti ja salasana.');
    }
  }

  // REKISTERÖITYMINEN
  async handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const address = document.getElementById('registerAddress').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Tarkistukset
    if (password !== confirmPassword) {
      this.showError('Salasanat eivät täsmää!');
      return;
    }
    
    if (password.length < 6) {
      this.showError('Salasanan on oltava vähintään 6 merkkiä pitkä!');
      return;
    }
    
    // Tarkista onko sähköposti jo käytössä
    const users = JSON.parse(localStorage.getItem('registered_users')) || [];
    if (users.find(u => u.email === email)) {
      this.showError('Sähköposti on jo rekisteröity!');
      return;
    }
    
    // Lähetä vahvistuskoodi
    this.sendVerificationCode(email, {
      name,
      email,
      phone,
      address,
      password,
      id: Date.now().toString()
    });
  }

  // LÄHETÄ VAHVISTUSKOODI
  async sendVerificationCode(email, userData) {
    // Generoi 6-numeroinen koodi
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    this.verificationData = {
      code: code,
      userData: userData,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minuuttia
    };
    
    console.log('Vahvistuskoodi (demo):', code);
    
    // Näytä vahvistus-dialogi
    this.showVerificationDialog(email);
    this.showSuccess(`Vahvistuskoodi lähetetty osoitteeseen ${email}. Tarkista sähköpostisi.`);
  }

  // NÄYTÄ VAHVISTUS-DIALOGI
  showVerificationDialog(email) {
    const dialogHtml = `
      <div class="verification-overlay">
        <div class="verification-dialog">
          <h3>Vahvista sähköpostiosoite</h3>
          <p>Lähetimme 6-numeroisen koodin osoitteeseen:</p>
          <p><strong>${email}</strong></p>
          
          <input type="text" id="verificationCode" placeholder="Syötä 6-numeroinen koodi" maxlength="6">
          
          <div class="verification-buttons">
            <button onclick="verifyCode()" class="verify-btn">Vahvista</button>
            <button onclick="resendCode()" class="resend-btn">Lähetä uudelleen</button>
          </div>
          
          <p class="verification-timer">Koodi vanhenee 5 minuutissa</p>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dialogHtml);
  }

  // VAHVISTA KOODI
  verifyCode() {
    const enteredCode = document.getElementById('verificationCode').value;
    
    if (!this.verificationData) {
      this.showError('Vahvistuskoodi on vanhentunut. Yritä uudelleen.');
      return;
    }
    
    if (Date.now() > this.verificationData.expiresAt) {
      this.showError('Vahvistuskoodi on vanhentunut. Yritä uudelleen.');
      this.verificationData = null;
      return;
    }
    
    if (enteredCode === this.verificationData.code) {
      // Tallenna käyttäjä
      const users = JSON.parse(localStorage.getItem('registered_users')) || [];
      users.push(this.verificationData.userData);
      localStorage.setItem('registered_users', JSON.stringify(users));
      
      // Kirjaudu automaattisesti
      this.loginUser(this.verificationData.userData);
      
      // Sulje dialogi
      this.closeVerificationDialog();
      
      this.showSuccess('Rekisteröityminen onnistui! Tervetuloa!');
    } else {
      this.showError('Virheellinen vahvistuskoodi!');
    }
  }

  // SULJE VAHVISTUS-DIALOGI
  closeVerificationDialog() {
    const overlay = document.querySelector('.verification-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  // LÄHETÄ KOODI UUDELLEEN
  resendCode() {
    if (this.verificationData) {
      this.sendVerificationCode(this.verificationData.userData.email, this.verificationData.userData);
    }
  }

  // KIRJAUDU KÄYTTÄJÄ SISÄÄN
  loginUser(user) {
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUser = user;
    
    console.log('✅ Käyttäjä kirjautunut sisään:', user.name);
    
    // Ohjaa etusivulle
    window.location.href = 'index.html';
  }

  // NÄYTÄ VIRHEILMOITUS
  showError(message) {
    this.hideMessages();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.auth-container');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  // NÄYTÄ ONNISTUMISVIESTI
  showSuccess(message) {
    this.hideMessages();
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const container = document.querySelector('.auth-container');
    container.insertBefore(successDiv, container.firstChild);
    
    setTimeout(() => {
      successDiv.remove();
    }, 5000);
  }

  // PIILOTA VIESTIT
  hideMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(msg => {
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
  window.loginSystem = new LoginSystem();
});