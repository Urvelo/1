// Admin Security Helper - Löytökauppa
// Tarkistaa admin-oikeudet ja piilottaa admin-toiminnot

class AdminSecurity {
  constructor() {
    this.currentUser = null;
    this.isAdminUser = false;
    this.init();
  }

  async init() {
    // Kuuntele käyttäjän muutoksia
    if (window.firebaseAuth) {
      // TODO: Lisää Firebase Auth listener kun se on valmis
    }
    
    // Tarkista nykyinen käyttäjä
    this.checkCurrentUser();
    
    // Piilota admin-elementit jos ei ole admin
    this.hideAdminElements();
  }

  checkCurrentUser() {
    const userData = localStorage.getItem('current_user');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.isAdminUser = this.currentUser && this.currentUser.isAdmin === true;
      } catch (error) {
        console.error('Virhe käyttäjätietojen lukemisessa:', error);
        this.isAdminUser = false;
      }
    } else {
      this.isAdminUser = false;
    }
  }

  hideAdminElements() {
    if (!this.isAdminUser) {
      // Piilota admin-linkit
      const adminLinks = document.querySelectorAll('[href="admin.html"], [href*="admin"]');
      adminLinks.forEach(link => {
        link.style.display = 'none';
        link.remove();
      });

      // Piilota admin-toiminnot
      const adminElements = document.querySelectorAll('.admin-only, [data-admin-only]');
      adminElements.forEach(element => {
        element.style.display = 'none';
        element.remove();
      });

      // Poista admin-valikkokohteet
      const adminMenuItems = document.querySelectorAll('.user-menu-item');
      adminMenuItems.forEach(item => {
        if (item.textContent.includes('Hallinta') || item.textContent.includes('Admin')) {
          item.remove();
        }
      });
    }
  }

  // Tarkista onko käyttäjä admin ennen toiminnon suorittamista
  requireAdmin() {
    if (!this.isAdminUser) {
      alert('🔒 Tämä toiminto vaatii ylläpitäjän oikeudet!');
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  // Tarkista admin-oikeudet asynkronisesti Firebase:sta
  async verifyAdminStatus() {
    if (!this.currentUser) return false;

    try {
      // Tarkista Firebase Auth:n kautta
      if (window.firebaseAuth && window.firebaseAuth.auth) {
        const user = window.firebaseAuth.auth.currentUser;
        if (user && user.email === 'admin@löytökauppa.fi') {
          return true;
        }
      }

      // Tarkista Firestore:sta
      if (window.firebaseDB && window.firebaseDB.db) {
        const userDoc = await window.firebaseDB.db
          .collection('users')
          .doc(this.currentUser.id)
          .get();
        
        if (userDoc.exists && userDoc.data().isAdmin === true) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Virhe admin-statuksen tarkistuksessa:', error);
      return false;
    }
  }

  // Logita admin-toimintoja
  async logAdminAction(action, details = {}) {
    if (!this.isAdminUser) return;

    const logEntry = {
      userId: this.currentUser.id,
      userEmail: this.currentUser.email,
      action: action,
      details: details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: 'unknown' // Tämä vaatisi backend-palvelun
    };

    try {
      // Tallenna Firebase:en jos mahdollista
      if (window.firebaseDB && window.firebaseDB.db) {
        await window.firebaseDB.db.collection('admin_logs').add(logEntry);
      } else {
        // Tallenna LocalStorageen fallback
        const logs = JSON.parse(localStorage.getItem('admin_logs')) || [];
        logs.push(logEntry);
        // Pidä vain viimeiset 100 lokia
        if (logs.length > 100) {
          logs.splice(0, logs.length - 100);
        }
        localStorage.setItem('admin_logs', JSON.stringify(logs));
      }
    } catch (error) {
      console.error('Virhe admin-lokin tallennuksessa:', error);
    }
  }

  // Tarkista admin-sivu suoraan URL:sta
  protectAdminPage() {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('admin.html') || currentPath.includes('admin/')) {
      this.checkCurrentUser();
      
      if (!this.isAdminUser) {
        alert('🔒 Pääsy evätty! Tämä sivu vaatii ylläpitäjän oikeudet.');
        window.location.href = 'index.html';
        return false;
      }
      
      // Logita admin-sivun käynti
      this.logAdminAction('page_access', { page: currentPath });
    }
    
    return true;
  }

  // Estä admin-toiminnot konsolista
  preventConsoleAccess() {
    if (!this.isAdminUser) {
      // Ylikirjoita tärkeät globaalit funktiot
      const originalConsole = window.console;
      window.console = {
        ...originalConsole,
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {}
      };
      
      // Piilota admin-funktiot
      delete window.admin;
      delete window.adminPanel;
      delete window.manageProducts;
      delete window.viewOrders;
    }
  }
}

// ADMIN-TOIMINTOJEN WRAPPER
class SecureAdminActions {
  constructor(adminSecurity) {
    this.security = adminSecurity;
  }

  async addProduct(productData) {
    if (!this.security.requireAdmin()) return false;
    
    await this.security.logAdminAction('add_product', { 
      productName: productData.name,
      productId: productData.id 
    });
    
    // Suorita alkuperäinen toiminto
    return window.firebaseDB ? 
      await window.firebaseDB.saveProduct(productData) : 
      this.fallbackAddProduct(productData);
  }

  async deleteProduct(productId) {
    if (!this.security.requireAdmin()) return false;
    
    await this.security.logAdminAction('delete_product', { productId });
    
    return window.firebaseDB ? 
      await window.firebaseDB.deleteProduct(productId) : 
      this.fallbackDeleteProduct(productId);
  }

  async viewOrders() {
    if (!this.security.requireAdmin()) return [];
    
    await this.security.logAdminAction('view_orders');
    
    return window.firebaseDB ? 
      await window.firebaseDB.getOrders() : 
      JSON.parse(localStorage.getItem('customer_orders')) || [];
  }

  fallbackAddProduct(productData) {
    const products = JSON.parse(localStorage.getItem('admin_products')) || [];
    products.push(productData);
    localStorage.setItem('admin_products', JSON.stringify(products));
    return productData;
  }

  fallbackDeleteProduct(productId) {
    const products = JSON.parse(localStorage.getItem('admin_products')) || [];
    const filtered = products.filter(p => p.id !== productId);
    localStorage.setItem('admin_products', JSON.stringify(filtered));
    return true;
  }
}

// Alusta turvallisuus järjestelmä
const adminSecurity = new AdminSecurity();
window.adminSecurity = adminSecurity;
window.secureAdmin = new SecureAdminActions(adminSecurity);

// Suojaa admin-sivut automaattisesti
document.addEventListener('DOMContentLoaded', function() {
  adminSecurity.protectAdminPage();
  adminSecurity.preventConsoleAccess();
  
  // Tarkista admin-status 5 minuutin välein
  setInterval(async () => {
    const isStillAdmin = await adminSecurity.verifyAdminStatus();
    if (adminSecurity.isAdminUser && !isStillAdmin) {
      alert('🔒 Admin-oikeudet on peruttu. Sinut kirjataan ulos.');
      await logout();
    }
  }, 5 * 60 * 1000); // 5 minuuttia
});