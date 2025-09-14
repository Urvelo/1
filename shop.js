// Shop JavaScript - Löytökauppa
// UI helpers for navigation/drawer/search
function toggleCategoryMenu(force) {
  const drawer = document.getElementById('categoryDrawer');
  const overlay = document.getElementById('overlay');
  if(!drawer || !overlay) return;
  const willOpen = typeof force === 'boolean' ? force : !drawer.classList.contains('open');
  if(willOpen){
    drawer.classList.add('open');
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden','false');
  } else {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden','true');
  }
}

function toggleMobileSearch(){
  const bar = document.getElementById('mobileSearchBar');
  if(!bar) return;
  const visible = bar.style.display !== 'none';
  bar.style.display = visible ? 'none' : 'block';
  if(!visible){
    const input = bar.querySelector('input');
    if(input) setTimeout(()=> input.focus(), 50);
  }
}

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
  this.populateCategories();
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

  populateCategories(){
    const list = document.getElementById('categoryList');
    if(!list) return;
    list.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'category-link';
    allBtn.setAttribute('data-category','all');
    allBtn.innerHTML = '<i class="fas fa-layer-group"></i> <span>Kaikki</span>';
    allBtn.onclick = () => { this.currentFilter='all'; this.renderProducts(); toggleCategoryMenu(false); };
    list.appendChild(allBtn);
    this.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-link';
      btn.setAttribute('data-category', cat.id);
      btn.innerHTML = `<i class="${cat.icon || 'fas fa-tag'}"></i> <span>${cat.name}</span>`;
      btn.onclick = () => { this.currentFilter = cat.id; this.renderProducts(); toggleCategoryMenu(false); };
      list.appendChild(btn);
    });
  }
  
  // DATAN LATAUS - OPTIMOITU FREE TIER:LLE  
  async loadData() {
    try {
      console.log('📦 Ladataan tuotteet products-data.js kautta...');
      if (window.PRODUCTS_JSON && window.PRODUCTS_JSON.loadProductsFromJSON) {
        const jsonData = await window.PRODUCTS_JSON.loadProductsFromJSON();
        this.products = jsonData.products || [];
        this.categories = jsonData.categories || [];
        console.log('✅ Tuotteet ladattu JSON:sta:', this.products.length, 'tuotetta');
      } else {
        // Fallback: Firebase (kuluttaa free tier:ia)
        console.log('⚠️ Fallback: Firebase-tuotteet (kuluttaa Firestore-tilaa)');
        if (window.firebaseDB) {
          this.products = await window.firebaseDB.getProducts();
          this.categories = await window.firebaseDB.getCategories();
        } else {
          this.products = this.getDefaultProducts();
          this.categories = [
            { id: 1, name: "Elektroniikka", icon: "fas fa-microchip" },
            { id: 2, name: "Älylaitteet", icon: "fas fa-robot" },
            { id: 3, name: "Audio", icon: "fas fa-headphones" },
            { id: 4, name: "Kodin tavarat", icon: "fas fa-home" }
          ];
        }
      }
      if (!this.products || this.products.length === 0) {
        console.log('📦 Ei tuotteita JSON:sta – käytetään fallback-etuus tuotteita näkymän elävöittämiseksi');
        this.products = this.getDefaultProducts();
      }
      console.log('✅ Data ladattu:', this.products.length, 'tuotetta,', this.categories.length, 'kategoriaa');
    } catch (error) {
      console.error('❌ Datan lataus epäonnistui:', error);
      this.products = this.getDefaultProducts();
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
      if (window.PRODUCTS_JSON && window.PRODUCTS_JSON.loadProductsFromJSON) {
        const jsonData = await window.PRODUCTS_JSON.loadProductsFromJSON();
        this.products = jsonData.products || [];
        this.categories = jsonData.categories || [];
        await this.renderProducts();
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
  async renderProducts() {
    // Ensure products are loaded (async)
    if (window.PRODUCTS_JSON && window.PRODUCTS_JSON.loadProductsFromJSON) {
      const jsonData = await window.PRODUCTS_JSON.loadProductsFromJSON();
      this.products = jsonData.products || [];
      this.categories = jsonData.categories || [];
    }
    const container = document.getElementById('productsGrid');
    if (!container) return;
    container.innerHTML = '';
    let filteredProducts = this.products;
    console.log('🧪 renderProducts: total loaded products =', this.products.length);
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
    console.log('🧪 renderProducts: after filters =', filteredProducts.length, 'filter=', this.currentFilter, 'search=', this.searchFilter);
    if (filteredProducts.length === 0) {
      const suggestions = this.products.slice(0,6).map(p => `<div class="suggestion-chip" onclick="shopApp.viewProduct(${p.id})">${p.name.split(' ').slice(0,2).join(' ')}</div>`).join('');
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon"><i class="fas fa-search"></i></div>
          <h3>Ei tuloksia haulle "${this.searchFilter || 'hakusana'}"</h3>
          <p>Kokeile eri hakusanoja tai selaa kategorioita vasemmasta valikosta.</p>
          <div class="empty-state-actions">
            <button class="btn btn-secondary" onclick="shopApp.clearSearch()">Tyhjennä haku</button>
            <button class="btn btn-primary" onclick="toggleCategoryMenu(true)">Avaa kategoriat</button>
          </div>
          ${suggestions ? `<div class="empty-suggestions">${suggestions}</div>` : ''}
        </div>`;
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
    window.location.href = `products/index.html?id=${productId}`;
  }
  
  // OSTOSKORIN HALLINTA
  addToCart(productId) {
    const product = this.products.find(p => p.id === productId || p.productId === productId);
    if (!product) return;
    
    const pid = product.id || product.productId;
    const existingItem = this.cart.find(item => item.id === pid);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        id: pid,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }
    
    this.saveCart();
    this.updateCartUI();
    
    // Näytä onnistumisviesti
    try { this.showCartNotification(`${product.name} lisätty koriin!`); } catch(_) {}
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
    const cartSidebar = document.getElementById('cartSidebar');
    
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
  if(cartCount) cartCount.textContent = totalItems;
  if(cartTotal) cartTotal.textContent = totalPrice.toFixed(2) + ' €';
    
    if(cartItems){
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
          <button onclick="shopApp.removeFromCart(${item.id})" class="cart-item-remove" aria-label="Poista">
            <i class="fas fa-times"></i>
          </button>
        `;
        cartItems.appendChild(cartItem);
      });
    }

    // Sidebar quick view (minimal if element present)
    if(cartSidebar){
      cartSidebar.innerHTML = `
        <div class="cart-sidebar-header">
          <h3>Ostoskori (${totalItems})</h3>
          <button class="close-btn" onclick="toggleCart()" aria-label="Sulje">&times;</button>
        </div>
        <div class="cart-sidebar-items">${ this.cart.map(item => `
          <div class='mini-item'>
            <div class='mini-thumb'><img src='${item.image}' alt='${item.name}' /></div>
            <div class='mini-info'>
              <div class='mini-name'>${item.name}</div>
              <div class='mini-meta'>${item.quantity} × ${item.price.toFixed(2)}€</div>
            </div>
            <button class='mini-remove' onclick='shopApp.removeFromCart(${item.id})' aria-label='Poista'>×</button>
          </div>`).join('') }
          ${ this.cart.length === 0 ? `<div class='mini-empty'>Ostoskori on tyhjä</div>` : ''}
        </div>
        <div class="cart-sidebar-footer">
          <div class='mini-total-line'>Yhteensä: <strong>${totalPrice.toFixed(2)} €</strong></div>
          <button class='btn btn-primary btn-block' onclick='shopApp.checkout()' ${this.cart.length===0?'disabled':''}>Siirry kassalle</button>
        </div>
      `;
    }
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
    
    const modal = document.createElement('div');
    modal.className = 'checkout-modal';
    modal.innerHTML = `
      <div class="checkout-overlay" onclick="closeCheckoutModal()"></div>
      <div class="checkout-content">
        <div class="checkout-header">
          <h2>🛒 Maksa tilaus</h2>
          <button onclick="closeCheckoutModal()" class="close-btn">&times;</button>
        </div>
        
        <div class="checkout-summary">
          <h3>📦 Tilausyhteenveto</h3>
          <div class="order-items">
            ${this.cart.map(item => `
              <div class="checkout-item">
                <span>${item.name}</span>
                <span>${item.quantity} × ${item.price.toFixed(2)}€</span>
              </div>
            `).join('')}
          </div>
          <div class="checkout-total">
            <strong>Yhteensä: ${total}€</strong>
          </div>
        </div>

        <div class="payment-methods">
          <h3>💳 Valitse maksutapa</h3>
          <div class="payment-options">
            <label class="payment-option">
              <input type="radio" name="payment" value="paypal" checked>
              <div class="payment-card">
                <i class="fab fa-paypal"></i>
                <span>PayPal</span>
                <small>Turvallinen PayPal-maksu</small>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" name="payment" value="sandbox">
              <div class="payment-card">
                <i class="fas fa-credit-card"></i>
                <span>Sandbox Maksu (Testi)</span>
                <small>Turvallinen testausmaksu</small>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" name="payment" value="bank">
              <div class="payment-card">
                <i class="fas fa-university"></i>
                <span>Verkkopankki</span>
                <small>Turvallinen pankkisiirto</small>
              </div>
            </label>
            <label class="payment-option">
              <input type="radio" name="payment" value="cash">
              <div class="payment-card">
                <i class="fas fa-money-bill"></i>
                <span>Postiennakko</span>
                <small>Maksa paketintuonnin yhteydessä</small>
              </div>
            </label>
            <div id="paypal-button-container" style="margin-top: 1rem; display: none;"></div>
          </div>
        </div>

        <div class="checkout-actions">
          <button onclick="closeCheckoutModal()" class="btn btn-secondary">Peruuta</button>
          <button onclick="processPayment()" class="btn btn-primary">
            <i class="fas fa-lock"></i> Maksa turvallisesti
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
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
  const overlay = document.getElementById('cartOverlay') || document.getElementById('overlay');
  
  if (cartSidebar) cartSidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function closeCart() {
  const cartSidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay') || document.getElementById('overlay');
  
  if (cartSidebar) cartSidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

function goToCheckout() {
  window.location.href = 'checkout/';
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
  
  if (!shopApp.currentUser) {
    alert('🔒 Kirjaudu sisään ennen ostamista!');
    return;
  }

  if (shopApp.cart.length === 0) {
    alert('🛒 Ostoskori on tyhjä!');
    return;
  }

  // Laske kokonaishinta
  const total = shopApp.cart.reduce((sum, item) => {
    const product = shopApp.products.find(p => p.id == item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  try {
    // Luo tilaus Firebase Firestore:en
    const orderData = {
      userId: shopApp.currentUser.uid || shopApp.currentUser.id, // Firebase UID tai localStorage ID
      customerInfo: {
        name: shopApp.currentUser.name,
        email: shopApp.currentUser.email,
        phone: shopApp.currentUser.phone,
        address: shopApp.currentUser.address
      },
      products: shopApp.cart.map(item => {
        const product = shopApp.products.find(p => p.id == item.productId);
        return {
          id: item.productId,
          name: product ? product.name : 'Tuntematon tuote',
          price: product ? product.price : 0,
          quantity: item.quantity,
          total: product ? product.price * item.quantity : 0
        };
      }),
      total: total,
      currency: 'EUR',
      paymentMethod: selectedPayment
    };

    console.log('📦 Luodaan tilaus:', orderData);

    let orderResult;
    
    // Käytä modernia Firebase:a jos saatavilla
    if (window.modernFirebaseDB && window.modernFirebaseDB.db) {
      orderResult = await window.modernFirebaseDB.createOrder(orderData);
    } else {
      // Fallback: tallenna localStorage:iin
      orderResult = createLocalOrder(orderData);
    }

    if (!orderResult.success) {
      throw new Error(orderResult.error);
    }

    const orderId = orderResult.orderId;

    if (selectedPayment === 'paypal') {
      // PayPal-maksu
      await processPayPalPayment(total, orderId);
    } else if (selectedPayment === 'sandbox') {
      // Sandbox-maksu (testi)
      await processTestPayment(orderId);
    } else {
      alert('💳 Maksuvaihtoehto "' + selectedPayment + '" ei ole vielä käytössä. Käytä PayPal:ia.');
    }

  } catch (error) {
    console.error('❌ Maksun käsittely epäonnistui:', error);
    alert('❌ Maksun käsittelyssä tapahtui virhe: ' + error.message);
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

// Expose UI toggles globally for inline handlers
window.toggleCategoryMenu = toggleCategoryMenu;
window.toggleMobileSearch = toggleMobileSearch;

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