// Shop JavaScript - Löytökauppa
class ShopApp {
  constructor() {
    this.products = [];
    this.categories = [];
    this.cart = JSON.parse(localStorage.getItem('shopping_cart')) || [];
    this.currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
    this.currentFilter = 'all';
    this.searchFilter = '';
    
    this.init();
  }
  
  async init() {
    // Päivitä käyttäjätiedot localStorage:sta (voi olla muuttunut)
    this.currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
    
    this.loadUserInfo();
    await this.loadData();
    this.renderProducts();
    this.updateCartUI();
    this.checkAuth();
    
    // Kuuntele localStorage muutoksia (kun käyttäjä kirjautuu toisessa välilehdessä)
    window.addEventListener('storage', (e) => {
      if (e.key === 'current_user') {
        console.log('🔄 Käyttäjätiedot muuttuivat, päivitetään UI');
        this.currentUser = JSON.parse(e.newValue) || null;
        this.loadUserInfo();
      }
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
      
      // Jos ei saatu tuotteita, käytä fallback-tuotteita
      if (this.products.length === 0) {
        console.log('📦 Ladataan fallback-tuotteet...');
        this.products = [
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
        },
        {
          id: 4,
          name: "📱 Magneetillinen Autoteline",
          price: 12.99,
          category: 4,
          image: "https://images.unsplash.com/photo-1551798507-629020c81463?w=400",
          description: "Turvallinen ja kätevä puhelinteline autoon"
        },
        {
          id: 5,
          name: "💡 Älykäs LED-valaisin",
          price: 24.99,
          category: 4,
          image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400",
          description: "Säädettävä värilämpötila ja kirkkaus"
        },
        {
          id: 6,
          name: "🔊 Vedenkestävä Kaiutin",
          price: 34.99,
          category: 3,
          image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
          description: "Täydellinen uima-altaalle ja retkille"
        },
        {
          id: 7,
          name: "📷 Mini Action-kamera",
          price: 79.99,
          category: 1,
          image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400",
          description: "4K videotallennus pienessä koossa"
        },
        {
          id: 8,
          name: "🔋 Powerbank 20000mAh",
          price: 29.99,
          category: 1,
          image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400",
          description: "Pikalataus useammalle laitteelle samanaikaisesti"
        },
        {
          id: 9,
          name: "🖥️ USB-C Telakka",
          price: 45.99,
          category: 1,
          image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
          description: "Yhdistä kaikki laitteet yhteen hub:iin"
        },
        {
          id: 10,
          name: "📚 Tabletti-teline",
          price: 15.99,
          category: 4,
          image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
          description: "Säädettävä teline tabletin ja puhelimen katseluun"
        },
        {
          id: 11,
          name: "🌡️ Älythermostaatti",
          price: 129.99,
          category: 4,
          image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
          description: "WiFi-ohjattava lämmönsäätö älypuhelimelta"
        },
        {
          id: 12,
          name: "🔐 Bluetooth Lukko",
          price: 69.99,
          category: 4,
          image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400",
          description: "Avaa ovi älypuhelimella tai sormenjäljellä"
        },
        {
          id: 13,
          name: "🎮 Langaton Peliohain",
          price: 39.99,
          category: 2,
          image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=400",
          description: "Ergonominen ohjain PC ja konsolipelaamiseen"
        },
        {
          id: 14,
          name: "☕ Älyketoni",
          price: 89.99,
          category: 4,
          image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400",
          description: "Keitä kahvi puhelimesta käsin sovelluksella"
        },
        {
          id: 15,
          name: "🚗 Autovarustepaketti",
          price: 55.99,
          category: 4,
          image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400",
          description: "Autoteline, latauskaapeli ja ilmanraikastin"
        }
      ];
      }
      
      // Aseta kategoriat jos ei ole asetettu
      if (this.categories.length === 0) {
        this.categories = [
          { id: 1, name: "Elektroniikka", icon: "fas fa-microchip" },
          { id: 2, name: "Pelit", icon: "fas fa-gamepad" },
          { id: 3, name: "Audio", icon: "fas fa-headphones" },
          { id: 4, name: "Älykodit", icon: "fas fa-home" }
        ];
      }
      
      console.log('✅ Data ladattu:', this.products.length, 'tuotetta,', this.categories.length, 'kategoriaa');
      
    } catch (error) {
      console.error('❌ Datan lataus epäonnistui:', error);
      this.products = this.getDefaultProducts();
      this.categories = [
        { id: 1, name: "Elektroniikka", icon: "fas fa-microchip" },
        { id: 2, name: "Pelit", icon: "fas fa-gamepad" },
        { id: 3, name: "Audio", icon: "fas fa-headphones" },
        { id: 4, name: "Älykodit", icon: "fas fa-home" }
      ];
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
    console.log('- localStorage current_user:', localStorage.getItem('current_user'));
    
    const userNameElement = document.getElementById('userName');
    const userMenuElement = document.getElementById('userMenu');
    
    console.log('- userName elementti löytyi:', !!userNameElement);
    console.log('- userMenu elementti löytyi:', !!userMenuElement);
    
    if (this.currentUser) {
      // Kirjautunut käyttäjä
      console.log('✅ Näytetään kirjautuneen käyttäjän tiedot:', this.currentUser.name);
      userNameElement.textContent = this.currentUser.name.split(' ')[0];
      userMenuElement.innerHTML = `
        <a href="profile.html" class="user-menu-item">
          <i class="fas fa-user"></i> Profiili
        </a>
        <a href="#" class="user-menu-item" onclick="showOrders()">
          <i class="fas fa-box"></i> Tilaukset
        </a>
        ${this.currentUser.isAdmin ? '<a href="admin.html" class="user-menu-item"><i class="fas fa-cog"></i> Hallinta</a>' : ''}
        <a href="#" class="user-menu-item" onclick="logout()">
          <i class="fas fa-sign-out-alt"></i> Kirjaudu ulos
        </a>
      `;
    } else {
      // Ei kirjautunut
      console.log('ℹ️ Näytetään kirjautumattoman käyttäjän valikko');
      userNameElement.textContent = 'Kirjaudu';
      userMenuElement.innerHTML = `
        <a href="login.html" class="user-menu-item">
          <i class="fas fa-sign-in-alt"></i> Kirjaudu sisään
        </a>
        <a href="login.html" class="user-menu-item">
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
          <div class="product-actions">
            <button class="btn btn-primary" onclick="shopApp.viewProduct(${product.id}); event.stopPropagation();">
              <i class="fas fa-eye"></i>
              Katso tuote
            </button>
            <button class="btn btn-icon" onclick="shopApp.toggleFavorite(${product.id}); event.stopPropagation();">
              <i class="fas fa-heart"></i>
            </button>
          </div>
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
    window.location.href = `product.html?id=${productId}`;
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

    if (!this.currentUser) {
      alert('🔒 Kirjaudu sisään ennen ostamista!');
      window.location.href = 'login.html';
      return;
    }

    this.showCheckoutModal();
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
  if (!shopApp.currentUser) {
    // Jos ei ole kirjautunut, vie login-sivulle
    window.location.href = 'login.html';
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
    localStorage.removeItem('current_user');
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
    window.location.href = 'login.html';
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
    window.location.href = 'profile.html';
    
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
    window.shopApp.currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
    window.shopApp.loadUserInfo();
  }
};

// Käynnistä sovellus
const shopApp = new ShopApp();
window.shopApp = shopApp;