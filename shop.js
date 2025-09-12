// Shop JavaScript - Moderni verkkokauppa
class ShopApp {
  constructor() {
    this.products = [];
    this.categories = [];
    this.cart = JSON.parse(localStorage.getItem('shopping_cart')) || [];
    this.currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
    this.currentFilter = 'all';
    
    this.init();
  }
  
  async init() {
    this.loadUserInfo();
    await this.loadData();
    this.renderCategories();
    this.renderProducts();
    this.renderFilters();
    this.updateCartUI();
    this.checkAuth();
  }
  
  // DATAN LATAUS
  async loadData() {
    // Lataa admin-tuotteet jos saatavilla
    const adminProducts = JSON.parse(localStorage.getItem('admin_products')) || [];
    const adminCategories = JSON.parse(localStorage.getItem('admin_categories')) || [];
    
    // Jos admin-tuotteita ei ole, käytä oletustuotteita
    if (adminProducts.length > 0) {
      this.products = adminProducts;
      this.categories = adminCategories;
    } else {
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
        }
      ];
      
      this.categories = [
        { id: 1, name: 'Elektroniikka', description: 'Sähkölaitteet ja tarvikkeet', icon: 'fas fa-plug' },
        { id: 2, name: 'Älylaitteet', description: 'Älykellot ja fitness-trackerit', icon: 'fas fa-watch' },
        { id: 3, name: 'Audio', description: 'Kuulokkeet ja kaiuttimet', icon: 'fas fa-headphones' },
        { id: 4, name: 'Kodin tavarat', description: 'Käytännölliset kodinkoneet', icon: 'fas fa-home' }
      ];
    }
  }
  
  // KÄYTTÄJÄTIETOJEN HALLINTA
  loadUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (this.currentUser) {
      userNameElement.textContent = this.currentUser.name.split(' ')[0];
    } else if (localStorage.getItem('guest_mode')) {
      userNameElement.textContent = 'Vieras';
    } else {
      userNameElement.textContent = 'Kirjaudu';
    }
  }
  
  checkAuth() {
    if (!localStorage.getItem('user_logged_in') && !localStorage.getItem('guest_mode')) {
      // Ei kirjautunut sisään
      setTimeout(() => {
        if (confirm('Haluatko kirjautua sisään saadaksesi paremman kokemuksen?')) {
          window.location.href = 'login.html';
        } else {
          localStorage.setItem('guest_mode', 'true');
          this.loadUserInfo();
        }
      }, 3000);
    }
  }
  
  // KATEGORIOIDEN NÄYTTÄMINEN
  renderCategories() {
    const container = document.getElementById('categoriesGrid');
    container.innerHTML = '';
    
    this.categories.forEach(category => {
      const productCount = this.products.filter(p => p.category == category.id).length;
      
      const categoryCard = document.createElement('div');
      categoryCard.className = 'category-card';
      categoryCard.onclick = () => this.filterByCategory(category.id);
      
      categoryCard.innerHTML = `
        <div class="category-icon">
          <i class="${category.icon || 'fas fa-cube'}"></i>
        </div>
        <div class="category-name">${category.name}</div>
        <div class="category-count">${productCount} tuotetta</div>
      `;
      
      container.appendChild(categoryCard);
    });
  }
  
  // SUODATTIMIEN NÄYTTÄMINEN
  renderFilters() {
    const container = document.getElementById('productFilters');
    container.innerHTML = '';
    
    // Kaikki tuotteet -suodatin
    const allFilter = document.createElement('button');
    allFilter.className = 'filter-btn active';
    allFilter.textContent = 'Kaikki';
    allFilter.onclick = () => this.setFilter('all', allFilter);
    container.appendChild(allFilter);
    
    // Kategoria-suodattimet
    this.categories.forEach(category => {
      const button = document.createElement('button');
      button.className = 'filter-btn';
      button.textContent = category.name;
      button.onclick = () => this.setFilter(category.id, button);
      container.appendChild(button);
    });
  }
  
  setFilter(filter, buttonElement) {
    this.currentFilter = filter;
    
    // Päivitä painikkeiden ulkoasu
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    buttonElement.classList.add('active');
    
    this.renderProducts();
  }
  
  filterByCategory(categoryId) {
    this.currentFilter = categoryId;
    this.renderProducts();
    
    // Päivitä suodatin-painikkeet
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const targetButton = Array.from(buttons).find(btn => 
      btn.textContent === this.categories.find(c => c.id === categoryId)?.name
    );
    if (targetButton) {
      targetButton.classList.add('active');
    }
    
    // Skrollaa tuotteisiin
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
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
      
      const isNew = Date.now() - (product.created ? new Date(product.created).getTime() : 0) < 7 * 24 * 60 * 60 * 1000;
      
      productCard.innerHTML = `
        <div class="product-image-container">
          <img src="${product.image}" alt="${product.name}" class="product-image" 
               onerror="this.src='https://via.placeholder.com/400x250?text=Kuva+ladataan'">
          ${isNew ? '<div class="product-badge">Uusi!</div>' : ''}
        </div>
        <div class="product-content">
          <h3 class="product-title">${product.name}</h3>
          <div class="product-price">${product.price.toFixed(2)} €</div>
          <div class="product-actions">
            <button class="btn btn-primary" onclick="shop.addToCart(${product.id})">
              <i class="fas fa-cart-plus"></i>
              Lisää koriin
            </button>
            <button class="btn btn-icon" onclick="shop.toggleWishlist(${product.id})">
              <i class="far fa-heart"></i>
            </button>
          </div>
        </div>
      `;
      
      container.appendChild(productCard);
    });
    
    if (filteredProducts.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
          <p style="font-size: 1.2rem;">Ei tuotteita valitussa kategoriassa</p>
        </div>
      `;
    }
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
        ...product,
        quantity: 1,
        addedAt: new Date().toISOString()
      });
    }
    
    this.saveCart();
    this.updateCartUI();
    this.showAddToCartNotification(product.name);
  }
  
  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
    this.updateCartUI();
  }
  
  updateQuantity(productId, change) {
    const item = this.cart.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(1, item.quantity + change);
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
    
    // Päivitä määrä
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    
    // Päivitä ostoskori-sivupalkki
    if (this.cart.length === 0) {
      cartItems.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
          <p>Ostoskori on tyhjä</p>
          <p style="font-size: 0.9rem;">Lisää tuotteita jatkaaksesi ostoksia</p>
        </div>
      `;
    } else {
      cartItems.innerHTML = this.cart.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${item.price.toFixed(2)} € × ${item.quantity}</div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
              <button onclick="shop.updateQuantity(${item.id}, -1)" style="background: var(--gray-light); border: none; color: white; width: 30px; height: 30px; border-radius: 4px; cursor: pointer;">-</button>
              <span style="display: flex; align-items: center; padding: 0 0.5rem;">${item.quantity}</span>
              <button onclick="shop.updateQuantity(${item.id}, 1)" style="background: var(--primary); border: none; color: white; width: 30px; height: 30px; border-radius: 4px; cursor: pointer;">+</button>
              <button onclick="shop.removeFromCart(${item.id})" style="background: var(--danger); border: none; color: white; padding: 0 0.5rem; border-radius: 4px; cursor: pointer; margin-left: auto;"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>
      `).join('');
    }
    
    // Päivitä kokonaissumma
    const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2) + ' €';
  }
  
  showAddToCartNotification(productName) {
    // Luo ilmoitus
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--success);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      z-index: 3000;
      transform: translateX(400px);
      transition: transform 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <strong>${productName}</strong> lisätty ostoskoriin!
    `;
    
    document.body.appendChild(notification);
    
    // Animoi sisään
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Poista 3 sekunnin kuluttua
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
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
              <input type="radio" name="payment" value="sandbox" checked>
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
    
    // Lisää CSS-tyylit
    if (!document.getElementById('checkout-styles')) {
      const styles = document.createElement('style');
      styles.id = 'checkout-styles';
      styles.textContent = `
        .checkout-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .checkout-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
        }
        
        .checkout-content {
          background: var(--gray);
          border-radius: 15px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          z-index: 1;
          border: 1px solid var(--border);
        }
        
        .checkout-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        
        .close-btn {
          background: none;
          border: none;
          color: var(--text);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
        }
        
        .checkout-summary {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        
        .checkout-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
        }
        
        .checkout-total {
          margin-top: 1rem;
          font-size: 1.2rem;
          text-align: right;
        }
        
        .payment-methods {
          padding: 1.5rem;
        }
        
        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .payment-option {
          cursor: pointer;
        }
        
        .payment-option input[type="radio"] {
          display: none;
        }
        
        .payment-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid var(--border);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .payment-option input[type="radio"]:checked + .payment-card {
          border-color: var(--primary);
          background: rgba(37, 99, 235, 0.1);
        }
        
        .payment-card i {
          font-size: 1.5rem;
          color: var(--primary);
          width: 24px;
        }
        
        .payment-card span {
          font-weight: 600;
        }
        
        .payment-card small {
          color: var(--text-muted);
          margin-left: auto;
        }
        
        .checkout-actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          justify-content: flex-end;
        }
        
        .btn-secondary {
          background: var(--gray-light);
          color: var(--text);
        }
      `;
      document.head.appendChild(styles);
    }
  }
  
  sendOrderToFormspree(order) {
    // Käytä index.html:n Formspree-integraatiota jos saatavilla
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
}

// YLEISET FUNKTIOT
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('overlay');
  
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
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

function showProfile() {
  closeAll();
  if (shop.currentUser) {
    window.location.href = 'profile.html';
  } else {
    alert('🔐 Kirjaudu sisään nähdäksesi profiilitiedot');
  }
}

function showOrders() {
  closeAll();
  const orders = JSON.parse(localStorage.getItem('customer_orders')) || [];
  const userOrders = orders.filter(order => 
    order.customer_email === shop.currentUser?.email
  );
  
  if (userOrders.length === 0) {
    alert('📦 Ei tilauksia');
  } else {
    const ordersList = userOrders.map(order => 
      `#${order.id.toString().slice(-6)} - ${order.order_date} - ${order.order_total}`
    ).join('\n');
    alert(`📦 Omat tilaukset:\n\n${ordersList}`);
  }
}

function logout() {
  closeAll();
  if (confirm('Haluatko varmasti kirjautua ulos?')) {
    localStorage.removeItem('current_user');
    localStorage.removeItem('user_logged_in');
    localStorage.removeItem('guest_mode');
    window.location.href = 'login.html';
  }
}

// Käynnistä sovellus
const shop = new ShopApp();

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

// CHECKOUT MODAL FUNCTIONS
window.closeCheckoutModal = function() {
  const modal = document.querySelector('.checkout-modal');
  if (modal) {
    modal.remove();
  }
};

window.processPayment = function() {
  const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
  const paymentMethods = {
    sandbox: 'Sandbox Maksu (Testi)',
    bank: 'Verkkopankki',
    cash: 'Postiennakko'
  };
  
  // Luo tilaus
  const order = {
    id: Date.now(),
    customer_name: shopApp.currentUser?.name || 'Vieras',
    customer_email: shopApp.currentUser?.email || '',
    customer_phone: shopApp.currentUser?.phone || '',
    customer_address: shopApp.currentUser?.address || '',
    order_products: shopApp.cart.map(item => `${item.name} (${item.quantity}kpl)`).join(', '),
    order_total: shopApp.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2) + ' €',
    payment_method: paymentMethods[selectedPayment],
    order_date: new Date().toLocaleDateString('fi-FI'),
    status: selectedPayment === 'sandbox' ? 'paid' : 'pending'
  };
  
  // Tallenna tilaus
  const orders = JSON.parse(localStorage.getItem('customer_orders')) || [];
  orders.push(order);
  localStorage.setItem('customer_orders', JSON.stringify(orders));
  
  // Lähetä Formspree-lomakkeella
  shopApp.sendOrderToFormspree(order);
  
  // Sandbox-maksu simulaatio
  if (selectedPayment === 'sandbox') {
    simulateSandboxPayment(order);
  } else {
    // Muut maksutavat
    processOtherPayment(order, selectedPayment);
  }
};

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
  alert(`✅ Tilaus vahvistettu!\n\nTilausnumero: #${order.id.toString().slice(-6)}\n${messages[paymentType]}\n\nSaat tilausvahvistuksen sähköpostiin.`);
}

// HAKUTOIMINTO
window.searchProducts = function() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  shopApp.searchFilter = searchTerm;
  shopApp.renderProducts();
  
  if (searchTerm) {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  }
};

// Tyhjennä haku
ShopApp.prototype.clearSearch = function() {
  this.searchFilter = '';
  document.getElementById('searchInput').value = '';
  this.renderProducts();
};

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

// FAQ TOIMINNOT
window.toggleFaq = function(element) {
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
};   shopApp.cart = [];
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

// HAKUTOIMINTO
window.searchProducts = function() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  shopApp.searchFilter = searchTerm;
  shopApp.renderProducts();
  
  if (searchTerm) {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  }
};

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

// FAQ TOIMINNOT
window.toggleFaq = function(element) {
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
};