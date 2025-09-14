// Admin Panel JavaScript - KESKITETTY TUOTEHALLINTA

// Globaali adminPanel muuttuja
let adminPanel;

class AdminPanel {
  constructor() {
    this.checkPasswordAccess();
    this.categories = [
      { id: 1, name: 'Elektroniikka', description: 'Sähkölaitteet' },
      { id: 2, name: 'Älylaitteet', description: 'Älykkäät laitteet' },
      { id: 3, name: 'Audio', description: 'Kuulokkeet ja kaiuttimet' },
      { id: 4, name: 'Älykodit', description: 'Älykkäät kodit' }
    ];
    this.editingProductId = null;
    this.init();
  }

  // Käytä suoraan keskitettyä dataa
  get products() {
    console.log('🔍 ADMIN DEBUG: Haetaan tuotteita...');
    console.log('- window.PRODUCTS_JSON olemassa?', !!window.PRODUCTS_JSON);
    
    if (window.PRODUCTS_JSON) {
      console.log('- loadProductsFromJSON funktio olemassa?', !!window.PRODUCTS_JSON.loadProductsFromJSON);
      
      if (window.PRODUCTS_JSON.loadProductsFromJSON) {
        const data = window.PRODUCTS_JSON.loadProductsFromJSON();
        console.log('- loadProductsFromJSON palautti:', data);
        console.log('- products array:', data?.products);
        console.log('- products count:', data?.products?.length);
        return data.products || [];
      }
    }
    
    console.log('❌ PRODUCTS_JSON ei ole saatavilla');
    return [];
  }

  checkPasswordAccess() {
    const hasAccess = sessionStorage.getItem('admin_access') === 'granted';
    if (!hasAccess) {
      this.showPasswordOverlay();
    }
  }

  showPasswordOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'passwordOverlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    overlay.innerHTML = `
      <div style="background: #1f2937; padding: 2rem; border-radius: 10px; text-align: center;">
        <h2 style="color: #f59e0b;">🔒 Admin Panel</h2>
        <p style="color: #d1d5db;">Enter password</p>
        <input type="password" id="adminPassword" placeholder="Password" style="width: 250px; padding: 0.75rem; border: none; border-radius: 5px; background: #374151; color: white; margin-bottom: 1rem;">
        <br>
        <button onclick="checkAdminPassword()" style="background: #f59e0b; color: black; padding: 0.75rem 1.5rem; border: none; border-radius: 5px; cursor: pointer;">🔓 Login</button>
        <p style="color: #9ca3af; font-size: 0.8rem; margin-top: 1rem;">💡 Password: admin123</p>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
      const input = document.getElementById('adminPassword');
      if (input) {
        input.focus();
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') checkAdminPassword();
        });
      }
    }, 100);
  }

  checkPassword() {
    const password = document.getElementById('adminPassword').value;
    if (password === 'admin123') {
      sessionStorage.setItem('admin_access', 'granted');
      const overlay = document.getElementById('passwordOverlay');
      if (overlay) overlay.remove();
    } else {
      alert('❌ Wrong password!');
      document.getElementById('adminPassword').value = '';
      document.getElementById('adminPassword').focus();
    }
  }

  init() {
    this.displayProducts();
    this.loadCategories();
    this.loadOrders();
    this.updateStats();
  }

  displayProducts() {
    console.log('🔍 ADMIN displayProducts kutsuttu');
    const container = document.getElementById('productsList');
    if (!container) {
      console.log('❌ productsList elementtiä ei löydy');
      return;
    }
    
    console.log('📦 Haetaan tuotteita...');
    const products = this.products;
    console.log('📦 Tuotteet saatu:', products);
    console.log('📦 Tuotteiden määrä:', products.length);
    
    if (products.length === 0) {
      console.log('⚠️ Ei tuotteita näytettäväksi');
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
          <h3>📦 Ei tuotteita</h3>
          <p>Lisää ensimmäinen tuote alla olevalla lomakkeella.</p>
          <p style="color: #888; margin-top: 1rem;">💡 Vihje: Jos et näe esimerkkituotteita, lataa sivu uudelleen.</p>
          <p style="color: #f59e0b; margin-top: 1rem;">🔍 Debug: Tarkista console.log viestit</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.products.map(product => `
      <div style="background: #2a2a2a; padding: 1rem; margin: 1rem 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4>${product.name}</h4>
          <p>€${product.price ? product.price.toFixed(2) : '0.00'}</p>
          <p style="color: #888;">${product.category || 'Ei kategoriaa'}</p>
          <small style="color: #666;">Varasto: ${product.stock || 0}</small>
        </div>
        <div>
          <button onclick="adminPanel.editProduct(${product.id})" style="margin: 0.25rem; padding: 0.5rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">✏️ Muokkaa</button>
          <button onclick="adminPanel.deleteProduct(${product.id})" style="margin: 0.25rem; padding: 0.5rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Poista</button>
          <button onclick="adminPanel.toggleFeatured(${product.id})" style="margin: 0.25rem; padding: 0.5rem; background: ${product.featured ? '#f59e0b' : '#6b7280'}; color: white; border: none; border-radius: 4px; cursor: pointer;">${product.featured ? '⭐' : '☆'}</button>
        </div>
      </div>
    `).join('');
  }

  addProduct() {
    console.log('🔍 ADMIN DEBUG: addProduct() kutsuttu');
    
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    const image = document.getElementById('productImage').value;
    const description = document.getElementById('productDescription').value;
    const stockElement = document.getElementById('productStock');
    const stock = stockElement ? parseInt(stockElement.value) || 0 : 0;
    
    console.log('📦 Lomakkeen arvot:');
    console.log('- name:', name);
    console.log('- price:', price);
    console.log('- category:', category);
    console.log('- image:', image);
    console.log('- description:', description);
    console.log('- stock:', stock);
    
    if (!name || !price || !category) {
      console.log('❌ Puuttuvia arvoja!');
      alert('❌ Täytä pakolliset kentät (nimi, hinta, kategoria)');
      return;
    }
    
    console.log('✅ Lomakevalidointi ok, kutsutaan PRODUCTS_JSON.addProduct');
    
    if (this.editingProductId) {
      console.log('🔄 Päivitetään tuotetta ID:', this.editingProductId);
      // Päivitä olemassa olevaa tuotetta
      const success = window.PRODUCTS_JSON.updateProduct(this.editingProductId, {
        name, 
        price, 
        category, 
        image, 
        description, 
        stock,
        featured: false
      });
      
      if (success) {
        alert('✅ Tuote päivitetty!');
      } else {
        alert('❌ Tuotteen päivitys epäonnistui');
      }
      this.cancelEdit();
    } else {
      console.log('➕ Lisätään uusi tuote');
      console.log('🔍 window.PRODUCTS_JSON olemassa?', !!window.PRODUCTS_JSON);
      console.log('🔍 addProduct funktio olemassa?', !!window.PRODUCTS_JSON?.addProduct);
      
      // Lisää uusi tuote
      const newProduct = window.PRODUCTS_JSON.addProduct({
        name, 
        price, 
        category, 
        image, 
        description, 
        stock,
        featured: false
      });
      
      console.log('📦 addProduct palautti:', newProduct);
      
      if (newProduct) {
        console.log('✅ Tuote lisätty onnistuneesti');
        alert('✅ Tuote lisätty: ' + newProduct.name);
      } else {
        console.log('❌ addProduct epäonnistui');
        alert('❌ Tuotteen lisäys epäonnistui');
      }
    }
    
    console.log('🔄 Kutsutaan displayProducts(), clearForm(), updateStats()');
    this.displayProducts();
    this.clearForm();
    this.updateStats();
  }

  editProduct(id) {
    const product = this.products.find(p => p.id == id);
    if (!product) return;
    
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productCategory').value = this.getCategoryNameById(product.category) || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productDescription').value = product.description || '';
    
    const stockElement = document.getElementById('productStock');
    if (stockElement) {
      stockElement.value = product.stock || 0;
    }
    
    this.editingProductId = id;
    const submitBtn = document.querySelector('#productForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '✅ Päivitä tuote';
      submitBtn.style.background = '#f59e0b';
    }
    
    if (!document.getElementById('cancelEditBtn')) {
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'cancelEditBtn';
      cancelBtn.type = 'button';
      cancelBtn.style.cssText = 'background: #ef4444; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; margin-left: 1rem; cursor: pointer;';
      cancelBtn.innerHTML = '❌ Peruuta';
      cancelBtn.onclick = () => this.cancelEdit();
      submitBtn.parentNode.appendChild(cancelBtn);
    }
  }

  getCategoryNameById(categoryId) {
    const categoryMap = {
      1: 'Elektroniikka',
      2: 'Älylaitteet', 
      3: 'Audio',
      4: 'Älykodit'
    };
    return categoryMap[categoryId] || 'Muu';
  }

  cancelEdit() {
    this.editingProductId = null;
    const submitBtn = document.querySelector('#productForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '📦 Add Product';
      submitBtn.style.background = '#2563eb';
    }
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.remove();
    this.clearForm();
  }

  deleteProduct(id) {
    const product = this.products.find(p => p.id == id);
    if (!product) {
      alert('❌ Tuotetta ei löytynyt!');
      return;
    }
    
    if (confirm(`Poista tuote "${product.name}"?`)) {
      const success = window.PRODUCTS_JSON.deleteProduct(id);
      if (success) {
        alert('🗑️ Tuote poistettu: ' + product.name);
        this.displayProducts();
        this.updateStats();
      } else {
        alert('❌ Tuotteen poisto epäonnistui');
      }
    }
  }

  toggleFeatured(id) {
    const product = this.products.find(p => p.id == id);
    if (product) {
      const success = window.PRODUCTS_JSON.updateProduct(id, {
        ...product,
        featured: !product.featured
      });
      
      if (success) {
        this.displayProducts();
        this.updateStats();
        alert(product.featured ? '☆ Suositus poistettu' : '⭐ Tuote merkitty suosituksi!');
      }
    }
  }

  // Poistetaan localStorage-funktiot - käytetään vain keskitettyä dataa
  refreshData() {
    // Vain päivitetään näkymä, data on jo keskitetyssä tiedostossa
    this.displayProducts();
    this.updateStats();
    alert('🔄 Näkymä päivitetty!');
  }

  // Admin utility functions
  clearAllProducts() {
    if (confirm('⚠️ VAROITUS: Tämä poistaa KAIKKI tuotteet!\n\nHaluatko varmasti jatkaa?')) {
      // Tyhjennä keskitetty data
      const productsCopy = [...this.products];
      for (const product of productsCopy) {
        window.PRODUCTS_JSON.deleteProduct(product.id);
      }
      
      this.displayProducts();
      this.updateStats();
      alert('🗑️ Kaikki tuotteet poistettu!');
    }
  }

  exportData() {
    const data = {
      products: this.products,
      categories: this.categories,
      exported: new Date().toISOString(),
      version: '2.0-centralized'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('📥 Data exported successfully!');
  }

  // 🌍 AliExpress Integration Functions
  
  async checkBackendStatus() {
    this.showAliExpressStatus('🔄 Tarkistetaan backend-yhteyttä...', 'info');
    
    try {
      const status = await checkBackendConnection();
      if (status) {
        this.showAliExpressStatus(`✅ Backend yhdistetty! API toimii, cache: ${status.cache_size} tuotetta`, 'success');
      } else {
        this.showAliExpressStatus('❌ Backend ei vastaa. Tarkista että Node.js server on käynnissä portissa 3001', 'error');
      }
    } catch (error) {
      this.showAliExpressStatus(`❌ Yhteysvirhe: ${error.message}`, 'error');
    }
  }

  async fetchFromAliExpress() {
    const input = document.getElementById('aliexpressInput');
    const inputValue = input.value.trim();
    
    if (!inputValue) {
      alert('⚠️ Anna AliExpress tuote ID tai URL');
      return;
    }
    
    // Parse product ID from URL or use as-is
    const productId = this.extractAliExpressId(inputValue);
    if (!productId) {
      alert('❌ Virheellinen AliExpress ID tai URL');
      return;
    }
    
    this.showAliExpressStatus(`🔄 Haetaan tuotetta ${productId}...`, 'info');
    
    try {
      const product = await fetchFromAliExpress(productId);
      
      this.showAliExpressStatus(`✅ Tuote "${product.name}" lisätty onnistuneesti!`, 'success');
      input.value = '';
      
      // Päivitä UI
      this.displayProducts();
      this.updateStats();
      
    } catch (error) {
      this.showAliExpressStatus(`❌ Haku epäonnistui: ${error.message}`, 'error');
      console.error('AliExpress fetch error:', error);
    }
  }

  async fetchBatchFromAliExpress() {
    const textarea = document.getElementById('aliexpressBatch');
    const inputValue = textarea.value.trim();
    
    if (!inputValue) {
      alert('⚠️ Anna tuote ID:t pilkuilla erotettuna');
      return;
    }
    
    // Parse product IDs
    const productIds = inputValue.split(',')
      .map(id => this.extractAliExpressId(id.trim()))
      .filter(id => id);
      
    if (productIds.length === 0) {
      alert('❌ Ei löytynyt kelvollisia tuote ID:itä');
      return;
    }
    
    if (productIds.length > 5) {
      alert('⚠️ Maksimissaan 5 tuotetta kerralla');
      return;
    }
    
    this.showAliExpressStatus(`🔄 Haetaan ${productIds.length} tuotetta...`, 'info');
    
    try {
      const { addedProducts, errors } = await fetchMultipleFromAliExpress(productIds);
      
      let message = `✅ Lisätty ${addedProducts.length}/${productIds.length} tuotetta`;
      if (errors.length > 0) {
        message += `\n⚠️ ${errors.length} virheitä: ${errors.map(e => e.productId).join(', ')}`;
      }
      
      this.showAliExpressStatus(message, addedProducts.length > 0 ? 'success' : 'warning');
      textarea.value = '';
      
      // Päivitä UI
      this.displayProducts();
      this.updateStats();
      
    } catch (error) {
      this.showAliExpressStatus(`❌ Batch-haku epäonnistui: ${error.message}`, 'error');
      console.error('AliExpress batch fetch error:', error);
    }
  }

  extractAliExpressId(input) {
    // Jos on jo numero, käytä sellaisenaan
    if (/^\d+$/.test(input)) {
      return input;
    }
    
    // Yritä poimia ID URL:stä
    const patterns = [
      /\/(\d+)\.html/,           // .../1234567890.html
      /item\/(\d+)/,             // .../item/1234567890
      /product\/(\d+)/,          // .../product/1234567890
      /ali(\d+)/i,               // ali1234567890
      /(\d{10,})/                // mikä tahansa 10+ numeroa
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  showAliExpressStatus(message, type) {
    const statusDiv = document.getElementById('aliexpressStatus');
    if (!statusDiv) return;
    
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = message.replace(/\n/g, '<br>');
    
    // Väritys tyypin mukaan
    statusDiv.style.background = type === 'success' ? '#10b981' : 
                                type === 'error' ? '#dc2626' : 
                                type === 'warning' ? '#f59e0b' : '#3b82f6';
    statusDiv.style.color = '#ffffff';
    
    // Piilota automaattisesti 10 sekunnin kuluttua jos success tai info
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        if (statusDiv.style.display === 'block') {
          statusDiv.style.display = 'none';
        }
      }, 10000);
    }
  }

  clearForm() {
    document.getElementById('productForm').reset();
  }

  filterProducts(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.displayProducts();
      return;
    }
    
    const filtered = this.products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    this.displayFilteredProducts(filtered);
  }

  displayFilteredProducts(products) {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    if (products.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
          <h3>🔍 Ei hakutuloksia</h3>
          <p>Kokeile toista hakusanaa.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = products.map(product => `
      <div style="background: #2a2a2a; padding: 1rem; margin: 1rem 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4>${product.name}</h4>
          <p>€${product.price ? product.price.toFixed(2) : '0.00'}</p>
          <p style="color: #888;">${product.category || 'Ei kategoriaa'}</p>
          <small style="color: #666;">Varasto: ${product.stock || 0}</small>
        </div>
        <div>
          <button onclick="adminPanel.editProduct(${product.id})" style="margin: 0.25rem; padding: 0.5rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">✏️ Muokkaa</button>
          <button onclick="adminPanel.deleteProduct(${product.id})" style="margin: 0.25rem; padding: 0.5rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Poista</button>
          <button onclick="adminPanel.toggleFeatured(${product.id})" style="margin: 0.25rem; padding: 0.5rem; background: ${product.featured ? '#f59e0b' : '#6b7280'}; color: white; border: none; border-radius: 4px; cursor: pointer;">${product.featured ? '⭐' : '☆'}</button>
        </div>
      </div>
    `).join('');
  }

  addCategory() {
    const name = document.getElementById('categoryName').value;
    const description = document.getElementById('categoryDescription').value;
    
    if (!name || name.trim() === '') {
      alert('❌ Kategorian nimi on pakollinen!');
      return;
    }
    
    // Check if category already exists
    const exists = this.categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert('❌ Kategoria on jo olemassa!');
      return;
    }
    
    const newCategory = { 
      id: Date.now(), 
      name: name.trim(), 
      description: description.trim() || 'Ei kuvausta'
    };
    
    this.categories.push(newCategory);
    this.saveCategories();
    this.loadCategories();
    document.getElementById('categoryForm').reset();
    alert('✅ Kategoria lisätty: ' + newCategory.name);
    console.log('✅ Added category:', newCategory);
  }

  deleteCategory(id) {
    const category = this.categories.find(c => c.id === id);
    if (!category) {
      alert('❌ Kategoriaa ei löytynyt!');
      return;
    }
    
    if (confirm(`Poista kategoria "${category.name}"?\n\nTämä ei poista kategoriaan kuuluvia tuotteita.`)) {
      this.categories = this.categories.filter(c => c.id !== id);
      this.saveCategories();
      this.loadCategories();
      alert('🗑️ Kategoria poistettu: ' + category.name);
      console.log('🗑️ Deleted category:', category.name);
    }
  }

  loadCategories() {
    console.log('📂 Loading categories:', this.categories.length, 'categories');
    
    const select = document.getElementById('productCategory');
    if (select) {
      select.innerHTML = '<option value="">Valitse kategoria</option>';
      this.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        select.appendChild(option);
      });
    }
    
    const container = document.getElementById('categoriesList');
    if (container) {
      if (this.categories.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #666;">
            <h3>📂 Ei kategorioita</h3>
            <p>Lisää ensimmäinen kategoria.</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = this.categories.map(cat => `
        <div style="background: #2a2a2a; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4>${cat.name}</h4>
            <p style="color: #888;">${cat.description}</p>
            <small style="color: #666;">ID: ${cat.id}</small>
          </div>
          <button onclick="adminPanel.deleteCategory(${cat.id})" style="background: #ef4444; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">🗑️ Poista</button>
        </div>
      `).join('');
    }
  }

  saveCategories() {
    localStorage.setItem('admin_categories', JSON.stringify(this.categories));
  }

  loadOrders() {
    // Empty implementation for now
  }

  updateStats() {
    // Varmista että data on saatavilla
    if (!this.products || !this.orders) {
      console.log('⚠️ updateStats: products tai orders data ei ole saatavilla');
      return;
    }
    
    const stats = {
      totalProducts: this.products.length,
      totalOrders: this.orders.length,
      totalRevenue: this.orders.reduce((sum, order) => sum + (order.total || 0), 0),
      featuredProducts: this.products.filter(p => p.featured).length
    };
    
    Object.keys(stats).forEach(key => {
      const el = document.getElementById(key);
      if (el) {
        el.textContent = key === 'totalRevenue' ? `€${stats[key].toFixed(2)}` : stats[key];
      }
    });
  }
}

// Global functions
function checkAdminPassword() {
  const password = document.getElementById('adminPassword').value;
  if (password === 'admin123') {
    sessionStorage.setItem('admin_access', 'granted');
    const overlay = document.getElementById('passwordOverlay');
    if (overlay) overlay.remove();
  } else {
    alert('❌ Wrong password!');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
}

function showSection(sectionId) {
  document.querySelectorAll('.admin-section').forEach(section => {
    section.style.display = 'none';
  });
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const targetSection = document.getElementById(sectionId);
  if (targetSection) targetSection.style.display = 'block';
  
  const activeNav = document.querySelector(`[onclick="showSection('\${sectionId}')"]`);
  if (activeNav) activeNav.classList.add('active');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 Admin panel starting...');
  adminPanel = new AdminPanel();
  showSection('products');
  
  // Form listeners
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', (e) => {
      e.preventDefault();
      adminPanel.addProduct();
    });
  }
  
  const categoryForm = document.getElementById('categoryForm');
  if (categoryForm) {
    categoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      adminPanel.addCategory();
    });
  }
});
