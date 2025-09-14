// Shop JavaScript - Löytökauppa
class ShopApp {
  constructor() {
    this.products = [];
    this.categories = [];
    this.cart = JSON.parse(localStorage.getItem('shopping_cart')) || [];
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    this.currentFilter = 'all';
    this.searchFilter = '';
    
    this.init();
  }
  
  async init() {
    // Päivitä käyttäjätiedot localStorage:sta (voi olla muuttunut)
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    
    this.loadUserInfo();
    await this.loadData();
    this.renderProducts();
    this.updateCartUI();
    this.checkAuth();
    
    // Kuuntele localStorage muutoksia (kun käyttäjä kirjautuu toisessa välilehdessä)
    window.addEventListener('storage', (e) => {
      if (e.key === 'currentUser') {
        console.log('🔄 currentUser muuttui localStorage:ssa');
        this.currentUser = JSON.parse(e.newValue) || null;
        this.loadUserInfo();
      }
    });
    
    // ✅ Kuuntele tuotemuutoksia admin-paneelista
    window.addEventListener('productsDataChanged', (event) => {
      console.log('🔄 Tuotedata muuttui:', event.detail);
      this.refreshProducts();
    });
  }
  
  // DATAN LATAUS - OPTIMOITU FREE TIER:LLE  
  async loadData() {
    try {
      console.log('📦 Ladataan data optimoidusti...');
      
      // ✅ TUOTTEET: Client-side JSON (ei Firestore-kulutusta!)
      if (window.PRODUCTS_JSON) {
        const jsonData = window.PRODUCTS_JSON.loadProductsFromJSON();
        this.products = jsonData.products;
        this.categories = jsonData.categories;
        console.log('✅ Tuotteet ladattu JSON:sta:', this.products.length, 'tuotetta');
      } else {
        // Fallback: Firebase (kuluttaa free tier:ia)
        console.log('⚠️ Fallback: Firebase-tuotteet (kuluttaa Firestore-tilaa)');
        if (window.firebaseDB) {
          this.products = await window.firebaseDB.getProducts();
          this.categories = await window.firebaseDB.getCategories();
        }
      }
      
      // Jos ei saatu tuotteita, näytä tyhjä lista
      if (this.products.length === 0) {
        console.log('📦 Ei tuotteita saatavilla - odottaa admin-lisäyksiä');
        this.products = [];
      }

      console.log('✅ Data ladattu:', this.products.length, 'tuotetta,', this.categories.length, 'kategoriaa');
    } catch (error) {
      console.error('❌ Datan lataus epäonnistui:', error);
      this.products = [];
      this.categories = [
        { id: 1, name: "Elektroniikka", icon: "fas fa-microchip" },
        { id: 2, name: "Älylaitteet", icon: "fas fa-robot" },
        { id: 3, name: "Audio", icon: "fas fa-headphones" },
        { id: 4, name: "Kodin tavarat", icon: "fas fa-home" }
      ];
    }
  }

  // ✅ Päivitä tuotteet kun admin muuttaa dataa
  async refreshProducts() {
    console.log('🔄 Päivitetään tuotedata...');
    try {
      if (window.PRODUCTS_JSON) {
        const jsonData = window.PRODUCTS_JSON.loadProductsFromJSON();
        this.products = jsonData.products;
        this.categories = jsonData.categories;
        this.renderProducts();
        console.log('✅ Tuotteet päivitetty! Tuotteita nyt:', this.products.length);
      }
    } catch (error) {
      console.error('❌ Tuotteiden päivitys epäonnistui:', error);
    }
  }
  
  // Oletustuotteet fallbackina
  getDefaultProducts() {
    return [
      {
        id: 1,
        name: "🔌 Langaton Latausasema",
        price: 19.99,
        category: 1,
        image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400",
        description: "Nopea langaton lataus kaikille laitteille"
      },
      {
        id: 2,
        name: "⌚ Premium Älykello",
        price: 89.99,
        category: 2,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        description: "Täydellinen kumppani aktiiviseen elämään"
      },
      {
        id: 3,
        name: "🎧 Bluetooth Kuulokkeet Pro",
        price: 59.99,
        category: 3,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        description: "Kristallinkirkas ääni ja aktiivinen melunvaimennus"
      }
    ];
  }
  
  // KÄYTTÄJÄTIETOJEN HALLINTA
  loadUserInfo() {
    console.log('🔍 Ladataan käyttäjätiedot...');
    console.log('- currentUser:', this.currentUser);
    console.log('- localStorage currentUser:', localStorage.getItem('currentUser'));
    
    const userNameElement = document.getElementById('userName');
    const userMenuElement = document.getElementById('userMenu');
    
    console.log('- userName elementti löytyi:', !!userNameElement);
    console.log('- userMenu elementti löytyi:', !!userMenuElement);
    
    if (this.currentUser) {
      // Kirjautunut käyttäjä
      console.log('✅ Näytetään kirjautuneen käyttäjän tiedot:', this.currentUser.name);
      console.log('🔍 isAdmin tila:', this.currentUser.isAdmin, 'tyyppi:', typeof this.currentUser.isAdmin);
      userNameElement.textContent = this.currentUser.name.split(' ')[0];
      userMenuElement.innerHTML = `
        <a href="profile/index.html" class="user-menu-item">
          <i class="fas fa-user"></i>
          Profiili
        </a>
        <a href="profile/index.html" class="user-menu-item">
          <i class="fas fa-history"></i>
          Tilaushistoria
        </a>
        ${this.currentUser.isAdmin ? '<a href="admin/index.html" class="user-menu-item"><i class="fas fa-cog"></i> Hallinta</a>' : ''}
        <a href="#" class="user-menu-item" onclick="logout()">
          <i class="fas fa-sign-out-alt"></i> Kirjaudu ulos
        </a>
      `;
    } else {
      // Ei kirjautunut
      console.log('ℹ️ Näytetään kirjautumattoman käyttäjän valikko');
      userNameElement.textContent = 'Kirjaudu';
      userMenuElement.innerHTML = `
        <a href="login/" class="user-menu-item">
          <i class="fas fa-sign-in-alt"></i> Kirjaudu sisään
        </a>
        <a href="login/" class="user-menu-item">
          <i class="fas fa-user-plus"></i> Rekisteröidy
        </a>
      `;
    }
  }
  
  checkAuth() {
    // Ei tehdä mitään - annetaan käyttäjän selata vapaasti
  }
  
  // TUOTTEIDEN NÄYTTÄMINEN
  renderProducts() {
    const container = document.getElementById('productsGrid');
    container.innerHTML = '';
    
    let filteredProducts = this.products;
    
    // Suodata kategorian mukaan
    if (this.currentFilter !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.category == this.currentFilter);
    }
    
    // Suodata haun mukaan
    if (this.searchFilter) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(this.searchFilter) ||
        (p.description && p.description.toLowerCase().includes(this.searchFilter))
      );
    }
    
    if (filteredProducts.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h3>Ei tuloksia haulle "${this.searchFilter || 'hakusana'}"</h3>
          <p style="color: var(--text-muted);">Kokeile eri hakusanoja tai selaa kategorioita.</p>
          <button class="btn btn-primary" onclick="shopApp.clearSearch()" style="margin-top: 1rem;">
            Tyhjennä haku
          </button>
        </div>
      `;
      return;
    }
    
    filteredProducts.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.style.cursor = 'pointer';
      
      const isNew = Date.now() - (product.created ? new Date(product.created).getTime() : 0) < 7 * 24 * 60 * 60 * 1000;
      
      productCard.innerHTML = `
        <div class="product-image-container">
          <img src="${product.image}" alt="${product.name}" class="product-image">
          ${isNew ? '<div class="product-badge">Uusi!</div>' : ''}
        </div>
        <div class="product-content">
          <h3 class="product-title">${product.name}</h3>
          <div class="product-price">${product.price.toFixed(2)} €</div>
        </div>
      `;
      
      // Lisää klikkaustapahtuma koko kortille
      productCard.addEventListener('click', () => {
        this.viewProduct(product.id);
      });
      
      container.appendChild(productCard);
    });
  }

  // TUOTTEEN KATSELU
  viewProduct(productId) {
    console.log('🔍 Siirrytään tuotesivulle, ID:', productId);
    
    // Tallenna tuotteen ID sessionStorageen jotta se voidaan ladata tuotesivulla
    sessionStorage.setItem('viewingProductId', productId);
    
    // Siirry tuotesivulle
    window.location.href = `products/?id=${productId}`;
  }
  
  // OSTOSKORIN HALLINTA
  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = this.cart.find(item => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }
    
    this.saveCart();
    this.updateCartUI();
    
    // Näytä onnistumisviesti
    this.showCartNotification(`${product.name} lisätty koriin!`);
  }
  
  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
    this.updateCartUI();
  }
  
  updateQuantity(productId, quantity) {
    const item = this.cart.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.saveCart();
      this.updateCartUI();
    }
  }
  
  saveCart() {
    localStorage.setItem('shopping_cart', JSON.stringify(this.cart));
  }
  
  updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartCount.textContent = totalItems;
    cartTotal.textContent = totalPrice.toFixed(2) + ' €';
    
    cartItems.innerHTML = '';
    this.cart.forEach(item => {
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${item.price.toFixed(2)} €</div>
          <div class="cart-item-quantity">
            <button onclick="shopApp.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button onclick="shopApp.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
          </div>
        </div>
        <button onclick="shopApp.removeFromCart(${item.id})" class="cart-item-remove">
          <i class="fas fa-times"></i>
        </button>
      `;
      cartItems.appendChild(cartItem);
    });
  }
  
  showCartNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--success);
      color: white;
      padding: 1rem;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  // KASSALLE SIIRTYMINEN
  checkout() {
    if (this.cart.length === 0) {
      alert('🛒 Ostoskori on tyhjä!');
      return;
    }

    // Tallennetaan ostoskori localStorageen kassasivua varten
    localStorage.setItem('cart', JSON.stringify(this.cart));
    
    // Siirrytään kassasivulle
    console.log('� Siirrytään kassalle, ostoskorissa', this.cart.length, 'tuotetta');
    window.location.href = 'checkout/';
  }

  showCheckoutModal() {
    const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    
    // Get user info if logged in
    const userInfo = this.currentUser || {};
    
    const modal = document.createElement('div');
    modal.className = 'checkout-modal';
    modal.innerHTML = `
      <div class="checkout-overlay" onclick="closeCheckoutModal()"></div>
      <div class="checkout-content">
        <div class="checkout-header">
          <h2>🛒 Viimeistele tilaus</h2>
          <button onclick="closeCheckoutModal()" class="close-btn">&times;</button>
        </div>
        
        <div class="checkout-steps">
          <div class="step active" data-step="1">
            <i class="fas fa-user"></i>
            <span>Tiedot</span>
          </div>
          <div class="step" data-step="2">
            <i class="fas fa-credit-card"></i>
            <span>Maksu</span>
          </div>
          <div class="step" data-step="3">
            <i class="fas fa-check"></i>
            <span>Vahvistus</span>
          </div>
        </div>

        <div class="checkout-step-content" id="step1">
          <h3>📦 Tilausyhteenveto</h3>
          <div class="order-items">
            ${this.cart.map(item => `
              <div class="checkout-item">
                <img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                <div class="item-details">
                  <div class="item-name">${item.name}</div>
                  <div class="item-price">${item.quantity} × ${item.price.toFixed(2)}€ = ${(item.quantity * item.price).toFixed(2)}€</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="checkout-total">
            <div class="total-breakdown">
              <div class="subtotal">Tuotteet: ${total}€</div>
              <div class="shipping">Toimitus: ILMAINEN</div>
              <div class="total">Yhteensä: <strong>${total}€</strong></div>
            </div>
          </div>

          <h3>👤 Toimitusosoite</h3>
          <div class="customer-form">
            <div class="form-row">
              <input type="text" id="customerName" placeholder="Koko nimi *" value="${userInfo.name || ''}" required>
              <input type="email" id="customerEmail" placeholder="Sähköposti *" value="${userInfo.email || ''}" required>
            </div>
            <div class="form-row">
              <input type="tel" id="customerPhone" placeholder="Puhelinnumero *" value="${userInfo.phone || ''}" required>
              <input type="text" id="customerAddress" placeholder="Katuosoite *" value="${userInfo.address || ''}" required>
            </div>
            <div class="form-row">
              <input type="text" id="customerPostal" placeholder="Postinumero *" value="${userInfo.postal || ''}" required>
              <input type="text" id="customerCity" placeholder="Kaupunki *" value="${userInfo.city || ''}" required>
            </div>
            <div class="form-row">
              <select id="customerCountry">
                <option value="FI" ${(userInfo.country || 'FI') === 'FI' ? 'selected' : ''}>🇫🇮 Suomi</option>
                <option value="SE" ${userInfo.country === 'SE' ? 'selected' : ''}>🇸🇪 Ruotsi</option>
                <option value="NO" ${userInfo.country === 'NO' ? 'selected' : ''}>🇳🇴 Norja</option>
                <option value="DK" ${userInfo.country === 'DK' ? 'selected' : ''}>🇩🇰 Tanska</option>
              </select>
            </div>
            ${!this.currentUser ? `
              <div class="form-row">
                <label class="checkbox-label">
                  <input type="checkbox" id="saveCustomerInfo">
                  <span class="checkbox-custom"></span>
                  Tallenna tiedot seuraavaa tilausta varten
                </label>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="checkout-step-content" id="step2" style="display: none;">
          <h3>💳 Valitse maksutapa</h3>
          <div class="payment-options">
            <label class="payment-option">
              <input type="radio" name="payment" value="paypal" checked>
              <div class="payment-card">
                <i class="fab fa-paypal"></i>
                <div class="payment-info">
                  <span>PayPal</span>
                  <small>Turvallinen PayPal-maksu</small>
                </div>
                <div class="payment-badge">Suosittu</div>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" name="payment" value="sandbox">
              <div class="payment-card">
                <i class="fas fa-vial"></i>
                <div class="payment-info">
                  <span>Sandbox (Testaus)</span>
                  <small>Turvallinen testiympäristön maksu</small>
                </div>
                <div class="payment-badge test">Testi</div>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" name="payment" value="card">
              <div class="payment-card">
                <i class="fas fa-credit-card"></i>
                <div class="payment-info">
                  <span>Luottokortti</span>
                  <small>Visa, Mastercard, American Express</small>
                </div>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" name="payment" value="bank">
              <div class="payment-card">
                <i class="fas fa-university"></i>
                <div class="payment-info">
                  <span>Verkkopankki</span>
                  <small>Nordea, OP, Danske Bank, Handelsbanken</small>
                </div>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" name="payment" value="cash">
              <div class="payment-card">
                <i class="fas fa-truck"></i>
                <div class="payment-info">
                  <span>Postiennakko</span>
                  <small>Maksa toimituksen yhteydessä (+3€)</small>
                </div>
              </div>
            </label>
          </div>
          <div id="paypal-button-container" style="margin-top: 1rem; display: none;"></div>
          <div id="payment-instructions" style="margin-top: 1rem; display: none;"></div>
        </div>

        <div class="checkout-step-content" id="step3" style="display: none;">
          <div class="order-confirmation">
            <div class="success-icon">✅</div>
            <h3>Tilaus vahvistettu!</h3>
            <p>Tilausnumero: <strong id="orderNumber"></strong></p>
            <p>Saat tilausvahvistuksen sähköpostiin.</p>
          </div>
        </div>

        <div class="checkout-actions">
          <button onclick="closeCheckoutModal()" class="btn btn-secondary">Peruuta</button>
          <button onclick="nextCheckoutStep()" class="btn btn-primary" id="checkoutNextBtn">
            Jatka maksamiseen <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for payment method selection
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
      radio.addEventListener('change', this.handlePaymentMethodChange.bind(this));
    });
  }
  
  handlePaymentMethodChange(event) {
    const paymentMethod = event.target.value;
    const instructionsDiv = document.getElementById('payment-instructions');
    const paypalContainer = document.getElementById('paypal-button-container');
    
    // Hide all payment-specific elements
    if (paypalContainer) paypalContainer.style.display = 'none';
    if (instructionsDiv) instructionsDiv.style.display = 'none';
    
    // Show payment-specific instructions
    if (instructionsDiv) {
      let instructions = '';
      switch (paymentMethod) {
        case 'sandbox':
          instructions = `
            <div class="payment-info-box">
              <i class="fas fa-info-circle"></i>
              <strong>Testiympäristön maksu</strong><br>
              Tämä on turvallinen testiympäristö. Ei oikeaa rahaa veloiteta.
            </div>
          `;
          break;
        case 'card':
          instructions = `
            <div class="payment-info-box">
              <i class="fas fa-shield-alt"></i>
              <strong>Turvallinen luottokorttimaksu</strong><br>
              Tiedot salataan SSL-suojauksella. Hyväksymme Visa, Mastercard ja American Express.
            </div>
          `;
          break;
        case 'bank':
          instructions = `
            <div class="payment-info-box">
              <i class="fas fa-university"></i>
              <strong>Verkkopankkimaksu</strong><br>
              Ohjaamme sinut valitsemaasi verkkopankkiin turvallista maksua varten.
            </div>
          `;
          break;
        case 'cash':
          instructions = `
            <div class="payment-info-box">
              <i class="fas fa-info-circle"></i>
              <strong>Postiennakko (+3€ käsittelymaksu)</strong><br>
              Maksat tilauksen kun paketti toimitetaan. Kokonaissumma: ${(parseFloat(this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)) + 3).toFixed(2)}€
            </div>
          `;
          break;
      }
      if (instructions) {
        instructionsDiv.innerHTML = instructions;
        instructionsDiv.style.display = 'block';
      }
    }
  }

  async sendOrderToFormspree(order) {
    // Tallenna tilaus Firebase-tietokantaan
    if (window.firebaseDB) {
      try {
        await window.firebaseDB.saveOrder(order);
        console.log('✅ Tilaus tallennettu Firebase-tietokantaan');
      } catch (error) {
        console.error('❌ Firebase-virhe, käytetään LocalStorage:', error);
      }
    }
    
    // Käytä Formspree-integraatiota jos saatavilla
    const formspreeUrl = 'https://formspree.io/f/mpwjnrwn';
    
    fetch(formspreeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order)
    }).catch(error => {
      console.log('Formspree-lähetys epäonnistui:', error);
    });
  }
  
  toggleFavorite(productId) {
    // Placeholder suosikkitoiminnolle
    console.log('Lisätty suosikkeihin:', productId);
  }
  
  // Tyhjennä haku
  clearSearch() {
    this.searchFilter = '';
    document.getElementById('searchInput').value = '';
    this.renderProducts();
  }
}

// GLOBAALIT FUNKTIOT
function handleUserClick() {
  if (!window.shopApp?.currentUser) {
    // Jos ei ole kirjautunut, vie login-sivulle
    window.location.href = 'login/';
  } else {
    // Jos on kirjautunut, näytä valikko
    toggleUserMenu();
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  menu.classList.toggle('active');
}

function closeAll() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
  document.getElementById('userMenu').classList.remove('active');
}

function toggleCart() {
  const cartSidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('overlay');
  
  cartSidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

// HAKUTOIMINTO
function searchProducts() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  shopApp.searchFilter = searchTerm;
  shopApp.renderProducts();
  
  if (searchTerm) {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  }
}

// KATEGORIA SUODATUS
function filterByCategory(categoryId) {
  // Päivitä aktiivinen suodatin
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.querySelector(`[data-category="${categoryId}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Aseta suodatin ja renderöi tuotteet
  shopApp.currentFilter = categoryId;
  shopApp.renderProducts();
  
  // Vieritä tuoteosioon
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// FAQ TOIMINNOT
function toggleFaq(element) {
  const faqItem = element.closest('.faq-item');
  const isActive = faqItem.classList.contains('active');
  
  // Sulje kaikki muut FAQ:t
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Avaa tämä FAQ jos se ei ollut auki
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// KÄYTTÄJÄHALLINNAN FUNKTIOT
function logout() {
  if (confirm('Haluatko varmasti kirjautua ulos?')) {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user_logged_in');
    localStorage.removeItem('guest_mode');
    localStorage.removeItem('shopping_cart');
    
    // Päivitä käyttöliittymä
    shopApp.currentUser = null;
    shopApp.cart = [];
    shopApp.loadUserInfo();
    shopApp.updateCartUI();
    
    alert('Kirjauduit ulos onnistuneesti!');
  }
}

async function showOrders() {
  if (!shopApp.currentUser) {
    alert('Kirjaudu sisään nähdäksesi tilaukset!');
    window.location.href = 'login/';
    return;
  }
  
  try {
    // Hakee tilaukset Firebase-tietokannasta tai LocalStoragesta
    let orders = [];
    if (window.firebaseDB) {
      orders = await window.firebaseDB.getOrders();
    } else {
      orders = JSON.parse(localStorage.getItem('customer_orders')) || [];
    }
    
    const userOrders = orders.filter(order => 
      order.customer_email === shopApp.currentUser.email
    );
    
    if (userOrders.length === 0) {
      alert('Sinulla ei ole vielä tilauksia.');
    return;
  }
  
  let orderText = '📦 Tilauksesi:\n\n';
  userOrders.forEach(order => {
    orderText += `Tilaus #${order.id.toString().slice(-6)}\n`;
    orderText += `Päivämäärä: ${order.order_date}\n`;
    orderText += `Tuotteet: ${order.order_products}\n`;
    orderText += `Summa: ${order.order_total}\n`;
    orderText += `Tila: ${order.status === 'new' ? 'Käsittelyssä' : order.status === 'paid' ? 'Maksettu' : 'Odottaa maksua'}\n\n`;
  });
  
  alert(orderText);
  } catch (error) {
    console.error('Virhe tilausten haussa:', error);
    alert('Virhe tilausten haussa. Yritä myöhemmin uudelleen.');
  }
}

// CHECKOUT MODAL FUNCTIONS
function closeCheckoutModal() {
  const modal = document.querySelector('.checkout-modal');
  if (modal) {
    modal.remove();
  }
}

// TILAUSTEN HALLINTA - APUFUNKTIOT
function createLocalOrder(orderData) {
  try {
    const order = {
      id: Date.now().toString(),
      ...orderData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    const orders = JSON.parse(localStorage.getItem('customer_orders')) || [];
    orders.push(order);
    localStorage.setItem('customer_orders', JSON.stringify(orders));
    
    console.log('✅ Tilaus tallennettu localStorage:iin:', order.id);
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error('❌ localStorage tilauksen luonti epäonnistui:', error);
    return { success: false, error: error.message };
  }
}

async function processTestPayment(orderId) {
  try {
    console.log('🧪 Käsitellään testimaksu tilaukelle:', orderId);
    
    // Simuloi maksu
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Päivitä tilauksen tila
    if (window.modernFirebaseDB && window.modernFirebaseDB.db) {
      await window.modernFirebaseDB.updateOrderStatus(orderId, 'paid', 'test_payment_' + Date.now());
    } else {
      updateLocalOrderStatus(orderId, 'paid');
    }
    
    alert('✅ Testmaksu onnistui! Tilaukesi on vahvistettu.');
    
    // Tyhjennä ostoskori
    shopApp.cart = [];
    localStorage.removeItem('shopping_cart');
    shopApp.updateCartUI();
    
    // Ohjaa tilausten näkymään
    window.location.href = 'profile/';
    
  } catch (error) {
    console.error('❌ Testmaksun käsittely epäonnistui:', error);
    alert('❌ Testmaksun käsittelyssä tapahtui virhe.');
  }
}

function updateLocalOrderStatus(orderId, status) {
  try {
    const orders = JSON.parse(localStorage.getItem('customer_orders')) || [];
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      orders[orderIndex].updatedAt = new Date().toISOString();
      localStorage.setItem('customer_orders', JSON.stringify(orders));
      console.log('✅ Tilauksen tila päivitetty localStorage:issa:', orderId, status);
    }
  } catch (error) {
    console.error('❌ localStorage tilauksen päivitys epäonnistui:', error);
  }
}

async function processPayPalPayment(total, orderId) {
  try {
    console.log('💰 Käsitellään PayPal-maksu:', total, 'EUR, tilaus:', orderId);
    
    if (window.paypal && window.initPayPalPayment) {
      // Käytä olemassa olevaa PayPal-integraatiota
      await window.initPayPalPayment(total, orderId);
    } else {
      throw new Error('PayPal-integraatio ei ole käytettävissä');
    }
    
  } catch (error) {
    console.error('❌ PayPal-maksun käsittely epäonnistui:', error);
    alert('❌ PayPal-maksun käsittelyssä tapahtui virhe: ' + error.message);
  }
}

async function processPayment() {
  const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
  
  if (shopApp.cart.length === 0) {
    alert('🛒 Ostoskori on tyhjä!');
    return;
  }

  // Get customer information from form
  const customerInfo = {
    name: document.getElementById('customerName').value,
    email: document.getElementById('customerEmail').value,
    phone: document.getElementById('customerPhone').value,
    address: document.getElementById('customerAddress').value,
    postal: document.getElementById('customerPostal').value,
    city: document.getElementById('customerCity').value,
    country: document.getElementById('customerCountry').value
  };

  // Calculate total with shipping
  const subtotal = shopApp.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = selectedPayment === 'cash' ? 3 : 0;
  const total = subtotal + shipping;

  try {
    // Create order data
    const orderData = {
      userId: shopApp.currentUser?.uid || 'guest_' + Date.now(),
      customerInfo: customerInfo,
      products: shopApp.cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      subtotal: subtotal,
      shipping: shipping,
      total: total,
      paymentMethod: selectedPayment,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    console.log('📦 Luodaan tilaus:', orderData);

    let orderResult;
    
    // Save order to storage
    if (window.modernFirebaseDB && window.modernFirebaseDB.db) {
      orderResult = await window.modernFirebaseDB.createOrder(orderData);
    } else {
      // Fallback: save to localStorage
      orderResult = createLocalOrder(orderData);
    }

    if (!orderResult.success) {
      throw new Error(orderResult.error);
    }

    const orderId = orderResult.orderId;

    // Process payment based on selected method
    switch (selectedPayment) {
      case 'paypal':
        await processPayPalPayment(total, orderId, customerInfo);
        break;
      case 'sandbox':
        await processSandboxPayment(orderId, customerInfo, total);
        break;
      case 'card':
        await processCardPayment(orderId, customerInfo, total);
        break;
      case 'bank':
        await processBankPayment(orderId, customerInfo, total);
        break;
      case 'cash':
        await processCashPayment(orderId, customerInfo, total);
        break;
      default:
        throw new Error('Tuntematon maksutapa: ' + selectedPayment);
    }

  } catch (error) {
    console.error('❌ Maksun käsittely epäonnistui:', error);
    showCheckoutError('Maksun käsittelyssä tapahtui virhe: ' + error.message);
  }
}

// Payment processing functions
async function processSandboxPayment(orderId, customerInfo, total) {
  // Simulate sandbox payment processing
  showCheckoutStep(3);
  document.getElementById('orderNumber').textContent = '#' + orderId.toString().slice(-6);
  
  // Show loading simulation
  const loadingDiv = document.createElement('div');
  loadingDiv.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <i class="fas fa-vial" style="font-size: 2rem; color: var(--primary); animation: pulse 2s infinite;"></i>
      <p style="margin-top: 1rem;">Käsitellään testiympäristön maksua...</p>
      <small style="color: #666;">Tämä on turvallinen testiympäristö</small>
    </div>
  `;
  
  document.getElementById('step3').innerHTML = loadingDiv.innerHTML;
  
  setTimeout(async () => {
    // Complete the order
    await completeOrder(orderId, customerInfo, total, 'Sandbox (Testi)');
  }, 2000);
}

async function processCardPayment(orderId, customerInfo, total) {
  alert('💳 Luottokorttimaksu tulossa pian! Käytä toistaiseksi PayPal:ia tai sandbox-testiä.');
}

async function processBankPayment(orderId, customerInfo, total) {
  alert('🏦 Verkkopankkimaksu tulossa pian! Käytä toistaiseksi PayPal:ia tai sandbox-testiä.');
}

async function processCashPayment(orderId, customerInfo, total) {
  // Process cash on delivery
  showCheckoutStep(3);
  document.getElementById('orderNumber').textContent = '#' + orderId.toString().slice(-6);
  
  const successDiv = document.createElement('div');
  successDiv.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div style="font-size: 4rem; color: #10b981; margin-bottom: 1rem;">📦</div>
      <h3 style="color: #10b981; margin-bottom: 1rem;">Tilaus vahvistettu!</h3>
      <p>Tilausnumero: <strong>#${orderId.toString().slice(-6)}</strong></p>
      <p>Maksutapa: <strong>Postiennakko</strong></p>
      <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
        <p><strong>Kokonaissumma: ${total.toFixed(2)}€</strong></p>
        <small>Maksat tilauksen kun paketti toimitetaan. Käsittelymaksu (3€) sisältyy hintaan.</small>
      </div>
      <p style="margin-top: 1rem;">Saat tilausvahvistuksen sähköpostiin.</p>
    </div>
  `;
  
  document.getElementById('step3').innerHTML = successDiv.innerHTML;
  
  // Complete the order
  await completeOrder(orderId, customerInfo, total, 'Postiennakko');
}

async function completeOrder(orderId, customerInfo, total, paymentMethod) {
  // Clear cart
  shopApp.cart = [];
  shopApp.saveCart();
  shopApp.updateCartUI();
  
  // Send order confirmation email via Formspree
  try {
    const orderData = {
      orderId: orderId,
      customerInfo: customerInfo,
      total: total,
      paymentMethod: paymentMethod,
      products: shopApp.cart,
      timestamp: new Date().toLocaleString('fi-FI')
    };
    
    await shopApp.sendOrderToFormspree(orderData);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
  
  // Update checkout buttons
  const actionsDiv = document.querySelector('.checkout-actions');
  if (actionsDiv) {
    actionsDiv.innerHTML = `
      <button onclick="closeCheckoutModal()" class="btn btn-primary">
        <i class="fas fa-check"></i> Sulje
      </button>
    `;
  }
}

// Helper function to create order in localStorage
function createLocalOrder(orderData) {
  try {
    const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const order = {
      ...orderData,
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // Save to localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    return {
      success: true,
      orderId: orderId,
      order: order
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Vanhat funktiot (poistetaan myöhemmin)

// PayPal-maksu käsittely
function processPayPalPayment(order) {
  if (!window.initPayPalPayment) {
    alert('PayPal-maksu ei ole käytettävissä. Käytä toista maksutapaa.');
    return;
  }
  
  const total = shopApp.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const items = shopApp.cart.map(item => ({
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));
  
  // Näytä PayPal-painikkeet
  document.getElementById('paypal-button-container').style.display = 'block';
  
  window.initPayPalPayment(
    total,
    items,
    (details) => {
      // Maksu onnistui
      shopApp.cart = [];
      shopApp.saveCart();
      shopApp.updateCartUI();
      closeCheckoutModal();
      alert(`✅ PayPal-maksu onnistui!\n\nTilausnumero: #${order.id.toString().slice(-6)}\nMaksutapa: PayPal\n\nSaat tilausvahvistuksen sähköpostiin.`);
    },
    (error) => {
      // Maksu epäonnistui
      console.error('PayPal-maksu epäonnistui:', error);
      alert('❌ PayPal-maksu epäonnistui. Yritä uudelleen tai valitse toinen maksutapa.');
    }
  );
}

function simulateSandboxPayment(order) {
  // Simuloi maksu-proseduuri
  const loadingDiv = document.createElement('div');
  loadingDiv.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
      <p style="margin-top: 1rem;">Käsitellään maksua...</p>
    </div>
  `;
  
  document.querySelector('.checkout-content').innerHTML = loadingDiv.innerHTML;
  
  setTimeout(() => {
    // Tyhjennä ostoskori
    shopApp.cart = [];
    shopApp.saveCart();
    shopApp.updateCartUI();
    
    closeCheckoutModal();
    
    alert(`✅ Maksu onnistui!\n\nTilausnumero: #${order.id.toString().slice(-6)}\nMaksutapa: ${order.payment_method}\n\nSaat tilausvahvistuksen sähköpostiin.`);
  }, 2000);
}

function processOtherPayment(order, paymentType) {
  // Tyhjennä ostoskori
  shopApp.cart = [];
  shopApp.saveCart();
  shopApp.updateCartUI();
  
  closeCheckoutModal();
  
  const messages = {
    bank: 'Sinut ohjataan verkkopankkiin maksua varten.',
    cash: 'Tilaus vahvistettu! Maksa paketti noudettaessa.'
  };
  
  alert(`✅ Tilaus vahvistettu!\n\nTilausnumero: #${order.id.toString().slice(-6)}\n${messages[paymentType]}\n\nSaat tilausvahvistuksen sähköpostiin.`);
}

// Hakupalkki Enter-näppäin
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchProducts();
      }
    });
  }
});

// Sulje valikot kun klikataan muualle
document.addEventListener('click', function(e) {
  if (!e.target.closest('.user-profile') && !e.target.closest('.user-menu')) {
    document.getElementById('userMenu').classList.remove('active');
  }
});

// Estä sivun vieritys kun ostoskori on auki
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeAll();
    closeCheckoutModal();
  }
});

// Globaali funktio käyttäjätietojen päivittämiseen (login.js voi kutsua)
window.updateUserUI = function() {
  if (window.shopApp) {
    console.log('🔄 Päivitetään käyttäjä-UI manuaalisesti');
    window.shopApp.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    window.shopApp.loadUserInfo();
  }
};

// 🛠️ DEMO ADMIN (kehityskäyttöön - Firebase-ongelmat kiertäen)
window.enableDemoAdmin = function() {
  const demoUser = {
    uid: 'demo-admin-' + Date.now(),
    name: 'Demo Admin',
    email: 'admin@demo.fi',
    isAdmin: true,
    provider: 'demo'
  };
  
  // Tallenna demo-käyttäjä
  localStorage.setItem('currentUser', JSON.stringify(demoUser));
  localStorage.setItem('user_logged_in', 'true');
  
  // Päivitä shop.js käyttäjätiedot
  if (window.shopApp) {
    window.shopApp.currentUser = demoUser;
    window.shopApp.loadUserInfo();
  }
  
  console.log('🛠️ Demo Admin aktivoitu!');
  alert('🛠️ Demo Admin aktivoitu!\n\nVoit nyt:\n- Käyttää admin-tilaa\n- Testata ostoskorin toimintoja\n- Tehdä PayPal-maksuja\n\nTämä on vain kehityskäyttöön!');
  
  // Sulje user menu
  document.getElementById('userMenu').classList.remove('active');
};

// Käynnistä sovellus
const shopApp = new ShopApp();
window.shopApp = shopApp;

// Globaali funktio käyttäjän UI:n päivittämiseen (kutsutaan login.js:stä)
window.updateUserUI = function() {
  console.log('🔄 updateUserUI kutsuttu');
  
  // Päivitä käyttäjätiedot localStorage:sta
  window.shopApp.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  
  // Päivitä UI
  window.shopApp.loadUserInfo();
  
  console.log('✅ Käyttäjä-UI päivitetty:', window.shopApp.currentUser?.name || 'Ei kirjautunut');
};

// Globaali checkout-funktio napin kutsulle
window.checkout = function() {
  console.log('🛒 Globaali checkout kutsuttu');
  console.log('🔍 shopApp tila:', !!window.shopApp);
  
  if (window.shopApp) {
    console.log('🔍 Ostoskorin sisältö:', window.shopApp.cart);
    console.log('🔍 Ostoskorin pituus:', window.shopApp.cart?.length);
    
    try {
      window.shopApp.checkout();
    } catch (error) {
      console.error('❌ Virhe checkout-kutsusta:', error);
      alert('Virhe kassalle siirryttäessä: ' + error.message);
    }
  } else {
    console.error('❌ shopApp ei ole saatavilla');
    alert('❌ Sovellus ei ole valmis. Lataa sivu uudelleen.');
  }
};

// Checkout step management functions
let currentCheckoutStep = 1;

function nextCheckoutStep() {
  if (currentCheckoutStep === 1) {
    // Validate customer information
    if (!validateCustomerInfo()) {
      return;
    }
    showCheckoutStep(2);
    currentCheckoutStep = 2;
    document.getElementById('checkoutNextBtn').innerHTML = 'Maksa turvallisesti <i class="fas fa-lock"></i>';
  } else if (currentCheckoutStep === 2) {
    // Process payment
    processPayment();
  }
}

function showCheckoutStep(step) {
  // Hide all steps
  document.querySelectorAll('.checkout-step-content').forEach(content => {
    content.style.display = 'none';
  });
  
  // Update step indicators
  document.querySelectorAll('.step').forEach(stepEl => {
    stepEl.classList.remove('active', 'completed');
    const stepNumber = parseInt(stepEl.dataset.step);
    if (stepNumber < step) {
      stepEl.classList.add('completed');
    } else if (stepNumber === step) {
      stepEl.classList.add('active');
    }
  });
  
  // Show current step
  document.getElementById(`step${step}`).style.display = 'block';
}

function validateCustomerInfo() {
  const requiredFields = [
    { id: 'customerName', name: 'Nimi' },
    { id: 'customerEmail', name: 'Sähköposti' },
    { id: 'customerPhone', name: 'Puhelinnumero' },
    { id: 'customerAddress', name: 'Osoite' },
    { id: 'customerPostal', name: 'Postinumero' },
    { id: 'customerCity', name: 'Kaupunki' }
  ];
  
  for (const field of requiredFields) {
    const element = document.getElementById(field.id);
    if (!element || !element.value.trim()) {
      element.focus();
      showCheckoutError(`Kenttä "${field.name}" on pakollinen`);
      return false;
    }
  }
  
  // Validate email
  const email = document.getElementById('customerEmail').value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    document.getElementById('customerEmail').focus();
    showCheckoutError('Sähköpostiosoite ei ole kelvollinen');
    return false;
  }
  
  // Save customer info if requested
  const saveInfo = document.getElementById('saveCustomerInfo');
  if (saveInfo && saveInfo.checked && !window.shopApp.currentUser) {
    const customerData = {
      name: document.getElementById('customerName').value,
      email: document.getElementById('customerEmail').value,
      phone: document.getElementById('customerPhone').value,
      address: document.getElementById('customerAddress').value,
      postal: document.getElementById('customerPostal').value,
      city: document.getElementById('customerCity').value,
      country: document.getElementById('customerCountry').value
    };
    localStorage.setItem('customerInfo', JSON.stringify(customerData));
  }
  
  return true;
}

function showCheckoutError(message) {
  const errorEl = document.createElement('div');
  errorEl.className = 'checkout-error';
  errorEl.innerHTML = `
    <i class="fas fa-exclamation-triangle"></i>
    ${message}
  `;
  errorEl.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 1rem 1.5rem; border-radius: 8px; z-index: 10002; font-weight: 500;';
  
  document.body.appendChild(errorEl);
  setTimeout(() => errorEl.remove(), 4000);
}

function closeCheckoutModal() {
  const modal = document.querySelector('.checkout-modal');
  if (modal) {
    modal.remove();
  }
  currentCheckoutStep = 1;
}