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
    
    console.log('🔍 Form debug:');
    console.log('- loginForm löytyi:', !!loginForm);
    console.log('- registerForm löytyi:', !!registerForm);
    
    if (loginForm) {
      console.log('✅ Lisätään login-formin event listener');
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    } else {
      console.error('❌ loginForm elementtiä ei löydy!');
    }
    
    if (registerForm) {
      console.log('✅ Lisätään register-formin event listener');
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    } else {
      console.error('❌ registerForm elementtiä ei löydy!');
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
    // KIRJAUTUMINEN - Firebase v11 Auth
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    console.log('🔑 Kirjaudutaan sisään:', email);
    
    this.showLoading('Kirjaudutaan sisään...');
    
    try {
      // ✅ KÄYTÄ MODERNFIREBASEAUTH:IA
      if (window.modernFirebaseAuth) {
        console.log('� Käytetään Firebase v11 Authentication');
        const result = await window.modernFirebaseAuth.login(email, password);
        
        if (result.success) {
          console.log('✅ Firebase-kirjautuminen onnistui!');
          this.handleSuccessfulLogin(result.user);
          return;
        } else {
          console.log('❌ Firebase-kirjautuminen epäonnistui:', result.error);
          this.showError(result.error || 'Kirjautuminen epäonnistui');
          return;
        }
      }
      
      // Fallback: Tarkista admin-tunnukset Firestore:sta
      console.log('⚠️ Fallback: Tarkistetaan admin-tunnukset...');
      const adminUser = await this.checkAdminLogin(email, password);
      
      if (adminUser) {
        console.log('✅ Admin-tunnukset oikein!');
        this.handleSuccessfulLogin(adminUser);
        return;
      }

      // Jos kumpikaan ei toimi, näytä virhe
      this.showError('Virheelliset kirjautumistiedot! Tarkista sähköposti ja salasana.');
      
    } catch (error) {
      console.error('Kirjautumisvirhe:', error);
      this.showError('Kirjautumisessa tapahtui virhe. Yritä uudelleen.');
    }
  }

  // Admin-tunnusten tarkistus Firestore:sta
  async checkAdminLogin(email, password) {
    console.log('🔐 Tarkistetaan admin-tunnukset Firestore:sta...');
    
    try {
      // Tarkista Firestore:sta
      if (window.firebaseDB && window.firebaseDB.db) {
        const adminRef = window.firebaseDB.db.collection('admin_users').doc('admin');
        const adminDoc = await adminRef.get();
        
        if (adminDoc.exists) {
          const adminData = adminDoc.data();
          console.log('- Admin-tiedot löydetty Firestore:sta');
          
          if (adminData.email === email && adminData.password === password) {
            console.log('✅ Admin-tunnukset oikein!');
            return {
              id: 'admin',
              name: adminData.name || 'Ylläpitäjä',
              email: adminData.email,
              phone: adminData.phone || '',
              address: adminData.address || '',
              isAdmin: true,
              loginTime: new Date().toISOString()
            };
          }
        }
      }
      
      console.log('❌ Admin-tunnukset väärin tai Firestore ei käytettävissä');
      return null;
      
    } catch (error) {
      console.error('Virhe admin-tarkistuksessa:', error);
      return null;
    }
  }

  // KÄSITTELE ONNISTUNUT KIRJAUTUMINEN
  handleSuccessfulLogin(user) {
    console.log('🎉 Kirjautuminen onnistui:', user);
    
    // Admin-käyttäjälle asetetaan admin-flagi jos ei ole jo asetettu
    if (user.email && user.email.includes('admin@loytokauppa.fi') && !user.isAdmin) {
      user.isAdmin = true;
    }
    
    this.loginUser(user);
  }

  // REKISTERÖITYMINEN
  // REKISTERÖITYMINEN - Firebase v11 Auth
  async handleRegister(event) {
    event.preventDefault();
    console.log('🔧 Rekisteröinti aloitettu...');
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const address = document.getElementById('registerAddress').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    console.log('📝 Rekisteröintitiedot:', { name, email, phone, address });
    
    // Yksinkertainen validointi
    if (!name || !email || !password) {
      this.showError('Täytä vähintään nimi, sähköposti ja salasana');
      return;
    }
    
    this.showLoading('Rekisteröidään käyttäjä...');
    
    try {
      // ✅ KÄYTÄ MODERNFIREBASEAUTH:IA
      if (window.modernFirebaseAuth) {
        console.log('� Käytetään Firebase v11 Authentication');
        
        const result = await window.modernFirebaseAuth.register(email, password, {
          name,
          phone,
          address
        });
        
        if (result.success) {
          console.log('✅ Käyttäjä rekisteröity Firebase Auth:iin:', result.user);
          this.showSuccess('Rekisteröinti onnistui! Voit nyt kirjautua sisään.');
          
          // Vaihda kirjautumislomakkeeseen
          setTimeout(() => {
            this.switchTab('login');
          }, 2000);
          return;
        } else {
          console.log('❌ Firebase-rekisteröinti epäonnistui:', result.error);
          this.showError(result.error || 'Rekisteröinti epäonnistui');
          return;
        }
      }
      
      // Fallback: localStorage-systeemi
      console.log('⚠️ Fallback: Käytetään localStorage-rekisteröintiä');
      
      const userData = {
        name,
        email,
        phone,
        address,
        password,
        id: Date.now().toString(),
        registeredAt: new Date().toISOString()
      };
      
      // Tallenna käyttäjä
      const allUsers = JSON.parse(localStorage.getItem('registered_users')) || [];
      allUsers.push(userData);
      localStorage.setItem('registered_users', JSON.stringify(allUsers));
      
      console.log('✅ Käyttäjä rekisteröity localStorage:iin:', userData);
      this.showSuccess('Rekisteröinti onnistui! Voit nyt kirjautua sisään.');
      
      // Vaihda kirjautumislomakkeeseen
      setTimeout(() => {
        this.switchTab('login');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Rekisteröinti epäonnistui:', error);
      this.showError('Rekisteröinti epäonnistui. Yritä uudelleen.');
    }
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
    localStorage.setItem('user_logged_in', 'true');
    this.currentUser = user;
    
    console.log('✅ Käyttäjä kirjautunut sisään:', user.name);
    
    // Päivitä käyttäjä-UI jos ollaan jo etusivulla
    if (typeof window.updateUserUI === 'function') {
      window.updateUserUI();
    }
    
    // Ohjaa etusivulle
    window.location.href = 'index.html';
  }

  // NÄYTÄ LATAUSVIESTI
  showLoading(message) {
    this.hideMessages();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    
    const container = document.querySelector('.auth-container');
    container.insertBefore(loadingDiv, container.firstChild);
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