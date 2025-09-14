// Yksinkertainen LOGIN SYSTEEMI - EI FIREBASEA
class LoginApp {
  constructor() {
    this.loginForm = document.getElementById('loginForm');
    this.registerForm = document.getElementById('registerForm');
    
    this.init();
  }
  
  init() {
    // Event listeners for forms
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    if (this.registerForm) {
      this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }
    
    // Check if already logged in
    this.checkExistingLogin();
  }
  
  checkExistingLogin() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
      console.log('✅ Käyttäjä on jo kirjautunut:', currentUser.name);
      this.redirectToMain();
    }
  }
  
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('🔍 Kirjautumisyritys:', email);
    
    if (!email || !password) {
      this.showError('Täytä kaikki kentät');
      return;
    }
    
    this.showLoading(true);
    
    try {
      // Check demo credentials
      if (email === 'demo@loytokauppa.fi' && password === 'demo123') {
        console.log('✅ Demo-käyttäjä tunnistettu');
        await this.loginDemoUser();
        return;
      }
      
      // Check registered users from localStorage
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      console.log('📦 Rekisteröityneet käyttäjät:', registeredUsers);
      const user = registeredUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        console.log('✅ Käyttäjä löytyi:', user);
        await this.loginUser(user);
      } else {
        this.showError('Virheelliset kirjautumistiedot');
      }
    } catch (error) {
      console.error('❌ Kirjautumisvirhe:', error);
      this.showError('Kirjautuminen epäonnistui: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }
  
  async handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
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
    
    this.showLoading(true);
    
    try {
      // Check if email already exists
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      
      if (registeredUsers.find(u => u.email === email)) {
        this.showError('Sähköpostiosoite on jo käytössä');
        return;
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password, // In real app, this would be hashed!
        registeredAt: new Date().toISOString(),
        profile: {
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=150`,
          phone: '',
          address: ''
        }
      };
      
      // Save to localStorage
      registeredUsers.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
      
      // Login the new user
      await this.loginUser(newUser);
      
    } catch (error) {
      console.error('❌ Rekisteröitymisvirhe:', error);
      this.showError('Rekisteröityminen epäonnistui: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }
  
  async loginUser(user) {
    // Check if user should have admin rights
    const adminEmails = ['demo@loytokauppa.fi', 'admin@loytokauppa.fi'];
    
    console.log('🔍 DETAILED LOGIN DEBUG:');
    console.log('- Input user object:', JSON.stringify(user, null, 2));
    console.log('- User email (type):', typeof user.email, user.email);
    console.log('- Admin emails array:', adminEmails);
    
    // Test each admin email individually
    adminEmails.forEach((adminEmail, index) => {
      console.log(`- Admin email ${index + 1}: "${adminEmail}" (type: ${typeof adminEmail})`);
      console.log(`- Equals user email? ${adminEmail === user.email}`);
      console.log(`- String comparison: "${adminEmail.trim()}" === "${user.email.trim()}"`);
    });
    
    const isAdmin = adminEmails.includes(user.email);
    console.log('- Final isAdmin result:', isAdmin);
    
    // Save user to localStorage
    const userToSave = {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      loginTime: new Date().toISOString(),
      isAdmin: isAdmin  // Add admin flag
    };
    
    console.log('💾 Tallennettava user object:');
    console.log(JSON.stringify(userToSave, null, 2));
    
    localStorage.setItem('currentUser', JSON.stringify(userToSave));
    localStorage.setItem('user_logged_in', 'true');
    
    // Verify what was actually saved
    const savedUser = JSON.parse(localStorage.getItem('currentUser'));
    console.log('✅ Tallennuksen jälkeen localStorage:ssa:');
    console.log(JSON.stringify(savedUser, null, 2));
    
    // Update parent window if exists
    if (window.parent && window.parent.updateUserUI) {
      window.parent.updateUserUI();
    }
    
    // Redirect immediately
    this.redirectToMain();
  }
  
  async loginDemoUser() {
    const demoUser = {
      id: 'demo',
      name: 'Demo Käyttäjä',
      email: 'demo@loytokauppa.fi',
      profile: {
        avatar: 'https://ui-avatars.com/api/?name=Demo%20Käyttäjä&background=6366f1&color=fff&size=150',
        phone: '+358 40 123 4567',
        address: 'Demokatu 1, 00100 Helsinki'
      },
      loginTime: new Date().toISOString()
    };
    
    await this.loginUser(demoUser);
  }
  
  showError(message) {
    console.error('❌', message);
    alert('Virhe: ' + message);
  }
  
  showSuccess(message) {
    console.log('✅', message);
  }
  
  showLoading(show) {
    const submitBtns = document.querySelectorAll('button[type="submit"]');
    submitBtns.forEach(btn => {
      btn.disabled = show;
      if (show) {
        btn.style.opacity = '0.7';
      } else {
        btn.style.opacity = '1';
      }
    });
  }
  
  redirectToMain() {
    // Go back to main page
    window.location.href = '../index.html';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.loginApp = new LoginApp();
});