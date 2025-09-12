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
    if (this.currentFilter !== 'all') {
      filteredProducts = this.products.filter(p => p.category == this.currentFilter);
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
    
    // Luo tilaus
    const order = {
      id: Date.now(),
      customer_name: this.currentUser?.name || 'Vieras',
      customer_email: this.currentUser?.email || '',
      customer_phone: this.currentUser?.phone || '',
      customer_address: this.currentUser?.address || '',
      order_products: this.cart.map(item => `${item.name} (${item.quantity}kpl)`).join(', '),
      order_total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2) + ' €',
      payment_method: 'Kassalla maksettava',
      order_date: new Date().toLocaleDateString('fi-FI'),
      status: 'new'
    };
    
    // Tallenna tilaus
    const orders = JSON.parse(localStorage.getItem('customer_orders')) || [];
    orders.push(order);
    localStorage.setItem('customer_orders', JSON.stringify(orders));
    
    // Lähetä Formspree-lomakkeella (jos integroitu)
    this.sendOrderToFormspree(order);
    
    // Tyhjennä ostoskori
    this.cart = [];
    this.saveCart();
    this.updateCartUI();
    this.toggleCart();
    
    alert(`✅ Tilaus lähetetty!\nTilausnumero: #${order.id.toString().slice(-6)}\n\nSaat tilausvahvistuksen sähköpostiin.`);
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
  }
});