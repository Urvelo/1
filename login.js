// Login JavaScript - 2-vaiheinen tunnistus
class LoginSystem {
  constructor() {
    this.currentUser = null;
    this.verificationData = null;
    this.init();
  }

  init() {
    // Tarkista onko käyttäjä jo kirjautunut
    this.checkExistingLogin();
    
    // Event listenerit
    document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
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
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Tarkista admin-tunnukset
    if (email === 'admin@löytökauppa.fi' && password === 'admin123') {
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
      this.showError('Virheelliset kirjautumistiedot!');
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
      timestamp: Date.now()
    };
    
    // Simuloi sähköpostin lähetys (oikeassa sovelluksessa käytettäisiin oikeaa email-palvelua)
    console.log(`Vahvistuskoodi ${email}: ${code}`);
    
    // Lähetä koodi Formspree:n kautta
    try {
      await fetch('https://formspree.io/f/mpwjnrwn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Löytökauppa - Vahvistuskoodi',
          email: email,
          message: `Hei ${userData.name}!\n\nTervetuloa Löytökauppaan! Vahvistuskoodisi on: ${code}\n\nKoodi on voimassa 10 minuuttia.\n\nYstävällisin terveisin,\nLöytökauppa-tiimi`
        })
      });
    } catch (error) {
      console.log('Sähköpostin lähetys epäonnistui:', error);
    }
    
    // Näytä vahvistuslomake
    this.showVerificationForm(email);
    this.showSuccess(`Vahvistuskoodi lähetetty osoitteeseen ${email}`);
  }

  // NÄYTÄ VAHVISTUSLOMAKE
  showVerificationForm(email) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById('verificationForm').classList.add('active');
    document.getElementById('verificationEmail').textContent = email;
  }

  // VAHVISTA KOODI
  verifyCode() {
    const enteredCode = document.getElementById('verificationCode').value;
    
    if (!this.verificationData) {
      this.showError('Vahvistusdata puuttuu. Yritä rekisteröitymistä uudelleen.');
      return;
    }
    
    // Tarkista onko koodi vanhentunut (10 minuuttia)
    const isExpired = Date.now() - this.verificationData.timestamp > 10 * 60 * 1000;
    if (isExpired) {
      this.showError('Vahvistuskoodi on vanhentunut. Lähetämme uuden koodin.');
      this.resendCode();
      return;
    }
    
    if (enteredCode === this.verificationData.code) {
      // Tallenna käyttäjä
      this.registerUser(this.verificationData.userData);
      this.verificationData = null;
    } else {
      this.showError('Virheellinen vahvistuskoodi!');
    }
  }

  // LÄHETÄ KOODI UUDELLEEN
  resendCode() {
    if (this.verificationData) {
      this.sendVerificationCode(
        this.verificationData.userData.email,
        this.verificationData.userData
      );
    }
  }

  // REKISTERÖI KÄYTTÄJÄ
  registerUser(userData) {
    const users = JSON.parse(localStorage.getItem('registered_users')) || [];
    users.push(userData);
    localStorage.setItem('registered_users', JSON.stringify(users));
    
    this.showSuccess('Rekisteröityminen onnistui! Kirjaudutaan sisään...');
    
    setTimeout(() => {
      this.loginUser(userData);
    }, 1500);
  }

  // KIRJAUDU SISÄÄN
  loginUser(user) {
    // Tallenna käyttäjätiedot
    localStorage.setItem('current_user', JSON.stringify(user));
    
    this.showSuccess(`Tervetuloa ${user.name}!`);
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  }

  // VIRHEILMOITUKSET
  showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 5000);
  }

  hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
  }
}

// GLOBAALIT FUNKTIOT
window.switchTab = function(tab) {
  loginSystem.switchTab(tab);
};

window.verifyCode = function() {
  loginSystem.verifyCode();
};

window.resendCode = function() {
  loginSystem.resendCode();
};

// Käynnistä sovellus
const loginSystem = new LoginSystem();