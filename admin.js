// Admin-paneelin JavaScript
class AdminPanel {
  constructor() {
    // Tarkista salasanasuojaus heti alussa
    this.checkPasswordAccess();
    
    this.products = JSON.parse(localStorage.getItem('admin_products')) || [];
    this.categories = JSON.parse(localStorage.getItem('admin_categories')) || [
      { id: 1, name: 'Elektroniikka', description: 'Sähkölaitteet ja tarvikkeet' },
      { id: 2, name: 'Älykkäät laitteet', description: 'Älylaitteet ja IoT' },
      { id: 3, name: 'Kuulokkeet & Audio', description: 'Äänilaitteet ja kuulokkeet' },
      { id: 4, name: 'Kodin tavarat', description: 'Kotitaloustuotteet' },
    ];
    this.orders = JSON.parse(localStorage.getItem('customer_orders')) || [];
    
    this.init();
  }
  
  checkPasswordAccess() {
    // Tarkista onko salasana jo syötetty tässä istunnossa
    const hasAccess = sessionStorage.getItem('admin_access') === 'granted';
    
    if (!hasAccess) {
      this.showPasswordOverlay();
    }
  }
  
  showPasswordOverlay() {
    // Luo musta suodatin ja salasanakysely
    const overlay = document.createElement('div');
    overlay.id = 'admin-password-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: Arial, sans-serif;
    `;
    
    overlay.innerHTML = `
      <div style="
        background: #1a1a1a;
        padding: 3rem;
        border-radius: 15px;
        text-align: center;
        border: 2px solid #333;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        max-width: 400px;
        width: 90%;
      ">
        <h2 style="color: #fff; margin-bottom: 2rem; font-size: 1.5rem;">
          🔒 Admin-alue
        </h2>
        <p style="color: #ccc; margin-bottom: 2rem;">
          Anna salasana päästäksesi admin-paneeliin
        </p>
        <input 
          type="password" 
          id="admin-password-input"
          placeholder="Salasana"
          style="
            width: 100%;
            padding: 1rem;
            font-size: 1.1rem;
            border: 2px solid #333;
            border-radius: 8px;
            background: #2a2a2a;
            color: #fff;
            margin-bottom: 1rem;
            text-align: center;
          "
        >
        <div id="password-error" style="color: #ff6b6b; margin-bottom: 1rem; min-height: 20px;"></div>
        <button 
          onclick="adminPanel.checkPassword()"
          style="
            width: 100%;
            padding: 1rem;
            font-size: 1.1rem;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
          "
          onmouseover="this.style.background='#45a049'"
          onmouseout="this.style.background='#4CAF50'"
        >
          🔓 Avaa admin-paneeli
        </button>
        <div style="margin-top: 2rem;">
          <a href="index.html" style="color: #888; text-decoration: none; font-size: 0.9rem;">
            ← Takaisin etusivulle
          </a>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Fokus salasanakenttään
    setTimeout(() => {
      const input = document.getElementById('admin-password-input');
      if (input) {
        input.focus();
        // Enter-näppäin toimii
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.checkPassword();
          }
        });
      }
    }, 100);
  }
  
  checkPassword() {
    const input = document.getElementById('admin-password-input');
    const errorDiv = document.getElementById('password-error');
    const password = input.value;
    
    // Yksinkertainen salasana (voit vaihtaa tämän)
    const correctPassword = 'admin123';
    
    if (password === correctPassword) {
      // Salasana oikein - tallenna istuntoon ja piilota overlay
      sessionStorage.setItem('admin_access', 'granted');
      const overlay = document.getElementById('admin-password-overlay');
      if (overlay) {
        overlay.remove();
      }
      console.log('✅ Admin-pääsy myönnetty');
    } else {
      // Väärä salasana
      errorDiv.textContent = '❌ Väärä salasana';
      input.value = '';
      input.style.borderColor = '#ff6b6b';
      
      // Palaa normaaliksi 2 sekunnin kuluttua
      setTimeout(() => {
        errorDiv.textContent = '';
        input.style.borderColor = '#333';
      }, 2000);
    }
  }
  
  init() {
    this.loadCategories();
    this.loadProducts();
    this.loadOrders();
    this.updateStats();
    this.setupEventListeners();
    
    // Tallenna oletuskategoriat jos ei ole
    if (!localStorage.getItem('admin_categories')) {
      localStorage.setItem('admin_categories', JSON.stringify(this.categories));
    }
  }
  
  setupEventListeners() {
    // Tuotelomake
    document.getElementById('productForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addProduct();
    });
    
    // Kategorialomake
    document.getElementById('categoryForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addCategory();
    });
  }
  
  // TUOTTEIDEN HALLINTA
  addProduct() {
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    const image = document.getElementById('productImage').value;
    const description = document.getElementById('productDescription').value;
    
    const product = {
      id: Date.now(),
      name,
      price,
      category,
      image,
      description,
      created: new Date().toISOString()
    };
    
    this.products.push(product);
    this.saveProducts();
    this.loadProducts();
    this.clearForm();
    this.updateStats();
    
    alert('✅ Tuote lisätty onnistuneesti!');
  }
  
  deleteProduct(id) {
    if (confirm('Haluatko varmasti poistaa tämän tuotteen?')) {
      this.products = this.products.filter(p => p.id !== id);
      this.saveProducts();
      this.loadProducts();
      this.updateStats();
      alert('🗑️ Tuote poistettu!');
    }
  }
  
  loadProducts() {
    const container = document.getElementById('productsList');
    container.innerHTML = '';
    
    this.products.forEach(product => {
      const categoryName = this.categories.find(c => c.id == product.category)?.name || 'Ei kategoriaa';
      
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/200?text=Kuva+puuttuu'">
        <h4>${product.name}</h4>
        <p style="color: #667eea; font-weight: bold;">${product.price}€</p>
        <p style="color: #888; font-size: 14px;">${categoryName}</p>
        <p style="color: #ccc; font-size: 12px; margin: 10px 0;">${product.description}</p>
        <button class="btn btn-danger" onclick="admin.deleteProduct(${product.id})">🗑️ Poista</button>
      `;
      container.appendChild(productCard);
    });
  }
  
  saveProducts() {
    localStorage.setItem('admin_products', JSON.stringify(this.products));
    // Päivitä myös asiakassivun tuotteet
    localStorage.setItem('shop_products', JSON.stringify(this.products));
  }
  
  clearForm() {
    document.getElementById('productForm').reset();
  }
  
  // KATEGORIOIDEN HALLINTA
  addCategory() {
    const name = document.getElementById('categoryName').value;
    const description = document.getElementById('categoryDescription').value;
    
    const category = {
      id: Date.now(),
      name,
      description
    };
    
    this.categories.push(category);
    this.saveCategories();
    this.loadCategories();
    document.getElementById('categoryForm').reset();
    
    alert('✅ Kategoria lisätty!');
  }
  
  deleteCategory(id) {
    if (confirm('Haluatko varmasti poistaa tämän kategorian?')) {
      this.categories = this.categories.filter(c => c.id !== id);
      this.saveCategories();
      this.loadCategories();
      alert('🗑️ Kategoria poistettu!');
    }
  }
  
  loadCategories() {
    // Lataa kategoriat dropdown-valikkoon
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Valitse kategoria</option>';
    
    this.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      select.appendChild(option);
    });
    
    // Lataa kategoriat hallintasivulle
    const container = document.getElementById('categoriesList');
    container.innerHTML = '';
    
    this.categories.forEach(category => {
      const categoryDiv = document.createElement('div');
      categoryDiv.style.cssText = 'background: #2a2a2a; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;';
      categoryDiv.innerHTML = `
        <div>
          <h4>${category.name}</h4>
          <p style="color: #888;">${category.description}</p>
        </div>
        <button class="btn btn-danger" onclick="admin.deleteCategory(${category.id})">🗑️ Poista</button>
      `;
      container.appendChild(categoryDiv);
    });
  }
  
  saveCategories() {
    localStorage.setItem('admin_categories', JSON.stringify(this.categories));
  }
  
  // TILAUSTEN HALLINTA
  loadOrders() {
    this.orders = JSON.parse(localStorage.getItem('customer_orders')) || [];
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';
    
    this.orders.forEach(order => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>#${order.id?.toString().slice(-6) || 'N/A'}</td>
        <td>
          <strong>${order.customer_name || 'N/A'}</strong><br>
          <small>${order.customer_email || 'N/A'}</small>
        </td>
        <td>${order.order_products || 'N/A'}</td>
        <td><strong>${order.order_total || '0€'}</strong></td>
        <td>${order.order_date || 'N/A'}</td>
        <td>
          <select onchange="admin.updateOrderStatus(${order.id || Date.now()}, this.value)">
            <option value="new" ${(order.status || 'new') === 'new' ? 'selected' : ''}>🆕 Uusi</option>
            <option value="processing" ${(order.status || 'new') === 'processing' ? 'selected' : ''}>⚙️ Käsittelyssä</option>
            <option value="shipped" ${(order.status || 'new') === 'shipped' ? 'selected' : ''}>🚚 Lähetetty</option>
          </select>
        </td>
        <td>
          <button class="btn" onclick="admin.viewOrderDetails(${order.id || Date.now()})">👁️ Näytä</button>
          <button class="btn btn-danger" onclick="admin.deleteOrder(${order.id || Date.now()})">🗑️ Poista</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
  
  updateOrderStatus(orderId, newStatus) {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      this.orders[orderIndex].status = newStatus;
      localStorage.setItem('customer_orders', JSON.stringify(this.orders));
      alert(`✅ Tilauksen tila päivitetty: ${newStatus}`);
    }
  }
  
  viewOrderDetails(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      alert(`
📋 Tilauksen tiedot:

👤 Asiakas: ${order.customer_name}
📧 Sähköposti: ${order.customer_email}
📞 Puhelin: ${order.customer_phone || 'Ei annettu'}
📍 Osoite: ${order.customer_address}

🛒 Tuotteet: ${order.order_products}
💰 Yhteensä: ${order.order_total}
💳 Maksutapa: ${order.payment_method}
📅 Tilauksen pvm: ${order.order_date}
      `);
    }
  }
  
  deleteOrder(orderId) {
    if (confirm('Haluatko varmasti poistaa tämän tilauksen?')) {
      this.orders = this.orders.filter(o => o.id !== orderId);
      localStorage.setItem('customer_orders', JSON.stringify(this.orders));
      this.loadOrders();
      this.updateStats();
      alert('🗑️ Tilaus poistettu!');
    }
  }
  
  exportOrders() {
    if (this.orders.length === 0) {
      alert('❌ Ei tilauksia vietäväksi!');
      return;
    }
    
    let csv = 'Tilaus ID,Asiakas,Sähköposti,Tuotteet,Summa,Päivämäärä,Maksutapa\\n';
    
    this.orders.forEach(order => {
      csv += `"${order.id}","${order.customer_name}","${order.customer_email}","${order.order_products}","${order.order_total}","${order.order_date}","${order.payment_method}"\\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tilaukset_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    alert('📥 Tilaukset viety CSV-tiedostoon!');
  }
  
  // TILASTOT
  updateStats() {
    document.getElementById('totalProducts').textContent = this.products.length;
    document.getElementById('totalOrders').textContent = this.orders.length;
    
    const revenue = this.orders.reduce((sum, order) => {
      const amount = parseFloat(order.order_total?.replace('€', '') || 0);
      return sum + amount;
    }, 0);
    
    document.getElementById('totalRevenue').textContent = revenue.toFixed(2) + '€';
  }
}

// YLEISET FUNKTIOT
function showSection(sectionName) {
  // Piilota kaikki osiot
  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Näytä valittu osio
  document.getElementById(sectionName).classList.add('active');
  
  // Päivitä napit
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
}

function logout() {
  if (confirm('Haluatko varmasti kirjautua ulos?')) {
    localStorage.removeItem('admin_logged_in');
    window.location.href = 'login.html';
  }
}

// Käynnistä admin-paneeli kun sivu latautuu
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Admin-sivu ladattu, alustetaan...');
  const admin = new AdminPanel();
});