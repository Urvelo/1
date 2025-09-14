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
    this.products = [];
    this.orders = []; // Alusta tyhjä orders-taulukko
    this.init();
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

  async init() {
    await this.loadProducts();
    this.displayProducts();
    this.loadCategories();
    this.loadOrders();
    this.updateStats();
  }

  async loadProducts() {
    if (window.PRODUCTS_JSON && window.PRODUCTS_JSON.loadProductsFromJSON) {
      const data = await window.PRODUCTS_JSON.loadProductsFromJSON();
      this.products = data.products || [];
      console.log('🔄 Admin: Ladattu', this.products.length, 'tuotetta');
      // Varmistetaan että myös window.PRODUCTS_JSON.PRODUCTS_DATA on ajantasalla
      window.PRODUCTS_JSON.PRODUCTS_DATA = this.products;
    } else {
      this.products = [];
    }
  }

  async displayProducts() {
    await this.loadProducts();
    const container = document.getElementById('productsList');
    if (!container) return;

    // Suodatus UI (kategoria + haku)
    const filterBar = document.getElementById('adminFilterBar') || document.createElement('div');
    filterBar.id = 'adminFilterBar';
    filterBar.style = 'display:flex;gap:1rem;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;';
    filterBar.innerHTML = `
      <select id="adminCategoryFilter" style="background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-light);padding:0.5rem 1rem;border-radius:6px;">
        <option value="all">Kaikki kategoriat</option>
        ${this.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
      </select>
      <input id="adminProductSearch" type="text" placeholder="Hae tuotteita..." style="background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-light);padding:0.5rem 1rem;border-radius:6px;min-width:200px;" />
    `;
    if (!document.getElementById('adminFilterBar')) container.parentNode.insertBefore(filterBar, container);

    // Suodatuslogiikka
    const searchTerm = document.getElementById('adminProductSearch')?.value?.toLowerCase() || '';
    const selectedCategory = document.getElementById('adminCategoryFilter')?.value || 'all';
    let filtered = this.products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || (p.category && p.category == selectedCategory);
      const matchesSearch = !searchTerm ||
        p.name?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        (this.getCategoryNameById(p.category)?.toLowerCase().includes(searchTerm));
      return matchesCategory && matchesSearch;
    });

    // Näytä tuotteet yhtenäisessä grid-layoutissa (ei kategorioittain)
    let html = '';
    
    if (filtered.length === 0) {
      html = `<div style="text-align:center;padding:3rem;color:var(--text-muted);border:2px dashed var(--border-light);border-radius:8px;background:var(--bg-secondary);">
        <div style="font-size:2rem;margin-bottom:1rem;">📦</div>
        <h3>Ei tuotteita</h3>
        <p>Hakuehdoilla ei löytynyt tuotteita.</p>
      </div>`;
    } else {
      // Grid container alkaa
      html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;padding:1rem 0;">';
      
      filtered.forEach(product => {
        const isNew = Date.now() - (product.created ? new Date(product.created).getTime() : 0) < 7 * 24 * 60 * 60 * 1000;
        html += `
          <div class="admin-product-card" style="background:var(--bg-tertiary);border:1px solid var(--border-light);border-radius:8px;overflow:hidden;transition:transform 0.2s ease,box-shadow 0.2s ease;cursor:pointer;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='var(--shadow-sm)'">
            <div style="position:relative;aspect-ratio:16/9;overflow:hidden;background:var(--bg-secondary);">
              <img src="${product.image || 'https://via.placeholder.com/400x225/333/666?text=Ei+kuvaa'}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;" />
              ${product.featured ? '<div style="position:absolute;top:8px;right:8px;background:var(--accent-600);color:white;padding:4px 8px;border-radius:4px;font-size:0.7rem;">⭐ Suosikki</div>' : ''}
              ${isNew ? '<div style="position:absolute;top:8px;left:8px;background:var(--success);color:white;padding:4px 8px;border-radius:4px;font-size:0.7rem;">🆕 Uusi</div>' : ''}
            </div>
            <div style="padding:1rem;">
              <h4 style="font-size:1rem;font-weight:600;color:var(--text-primary);margin:0 0 0.5rem 0;line-height:1.3;">${product.name}</h4>
              <div style="font-size:1.2rem;font-weight:700;color:var(--accent-200);margin:0 0 0.5rem 0;">${product.price ? product.price.toFixed(2) : '0.00'} €</div>
              <div style="font-size:0.85rem;color:var(--text-muted);margin:0 0 0.5rem 0;">${this.getCategoryNameById(product.category) || 'Ei kategoriaa'}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);margin:0 0 1rem 0;line-height:1.4;max-height:2.4em;overflow:hidden;">${(product.description || '').substring(0, 80)}${(product.description || '').length > 80 ? '...' : ''}</div>
              <div style="font-size:0.75rem;color:var(--text-disabled);margin:0 0 1rem 0;">📦 Varasto: ${product.stock || 0} kpl</div>
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                <button onclick="adminPanel.editProduct(${product.id}); event.stopPropagation();" style="flex:1;min-width:70px;background:var(--accent-600);color:white;border:none;border-radius:6px;padding:0.5rem 0.7rem;font-size:0.8rem;cursor:pointer;transition:background 0.2s ease;" onmouseover="this.style.background='var(--accent-700)'" onmouseout="this.style.background='var(--accent-600)'">✏️ Muokkaa</button>
                <button onclick="adminPanel.deleteProduct(${product.id}); event.stopPropagation();" style="flex:1;min-width:70px;background:var(--danger);color:white;border:none;border-radius:6px;padding:0.5rem 0.7rem;font-size:0.8rem;cursor:pointer;transition:background 0.2s ease;" onmouseover="this.style.background='var(--danger-hover)'" onmouseout="this.style.background='var(--danger)'">🗑️ Poista</button>
                <button onclick="adminPanel.toggleFeatured(${product.id}); event.stopPropagation();" style="background:${product.featured ? 'var(--accent-600)' : 'var(--bg-hover)'};color:${product.featured ? 'white' : 'var(--text-muted)'};border:1px solid var(--border-medium);border-radius:6px;padding:0.5rem 0.7rem;font-size:0.8rem;cursor:pointer;transition:background 0.2s ease;" onmouseover="this.style.background='var(--accent-600)'" onmouseout="this.style.background='${product.featured ? 'var(--accent-600)' : 'var(--bg-hover)'}'">${product.featured ? '⭐' : '☆'}</button>
              </div>
            </div>
          </div>
        `;
      });
      
      // Grid container päättyy
      html += '</div>';
    }
    container.innerHTML = html;

    // Suodatuskenttien eventit (vain kerran)
    if (!this._adminFilterEventsBound) {
      document.getElementById('adminCategoryFilter').addEventListener('change', () => this.displayProducts());
      document.getElementById('adminProductSearch').addEventListener('input', () => this.displayProducts());
      this._adminFilterEventsBound = true;
    }
  }

  async addProduct() {
    console.log('🔍 ADMIN DEBUG: addProduct() kutsuttu');
    
    // Debug: tarkista että lomakeelementit löytyvät
    const nameEl = document.getElementById('productName');
    const priceEl = document.getElementById('productPrice');
    const categoryEl = document.getElementById('productCategory');
    const imageEl = document.getElementById('productImage');
    const descEl = document.getElementById('productDescription');
    const stockEl = document.getElementById('productStock');
    const detailedDescEl = document.getElementById('productDetailedDescription');
    const featuresEl = document.getElementById('productFeatures');
    const specsEl = document.getElementById('productSpecs');
    const additionalImagesEl = document.getElementById('productAdditionalImages');
    
    console.log('🔍 DEBUG: Lomakeelementit:');
    console.log('- nameEl:', nameEl);
    console.log('- priceEl:', priceEl);
    console.log('- categoryEl:', categoryEl);
    console.log('- imageEl:', imageEl);
    console.log('- descEl:', descEl);
    console.log('- stockEl:', stockEl);
    console.log('- detailedDescEl:', detailedDescEl);
    console.log('- featuresEl:', featuresEl);
    console.log('- specsEl:', specsEl);
    console.log('- additionalImagesEl:', additionalImagesEl);
    
    if (!nameEl || !priceEl || !categoryEl) {
      console.log('❌ Kriittiset lomakeelementit puuttuvat!');
      alert('❌ Lomakeelementit puuttuvat. Lataa sivu uudelleen.');
      return;
    }
    
    const name = nameEl.value.trim();
    const price = parseFloat(priceEl.value);
    
    // Kategoria-kentän lukeminen turvallisesti
    let categoryRaw = categoryEl.value;
    
    // Jos value on tyhjä, yritä hakea selectedIndex:llä
    if (!categoryRaw || categoryRaw === "") {
      const selectedIndex = categoryEl.selectedIndex;
      if (selectedIndex > 0) { // 0 = "Valitse kategoria"
        categoryRaw = categoryEl.options[selectedIndex].value;
      }
    }
    
    let category = parseInt(categoryRaw);
    
    // Jos kategoria on teksti (esim. "Elektroniikka"), muunna se numeroksi
    if (isNaN(category)) {
      const categoryMap = {
        'Elektroniikka': 1,
        'Älylaitteet': 2,
        'Audio': 3,
        'Älykodit': 4
      };
      category = categoryMap[categoryRaw] || 1;
      console.log('🔄 Muunnettu kategoria-teksti numeroksi:', categoryRaw, '→', category);
    }
    
    const image = imageEl ? imageEl.value.trim() : '';
    const description = descEl ? descEl.value.trim() : '';
    const stock = stockEl ? parseInt(stockEl.value) || 0 : 0;
    
    // Uudet kentät (valinnaisia)
    const detailedDescription = detailedDescEl ? detailedDescEl.value.trim() : '';
    const features = featuresEl ? featuresEl.value.trim() : '';
    const specsText = specsEl ? specsEl.value.trim() : '';
    const additionalImagesText = additionalImagesEl ? additionalImagesEl.value.trim() : '';
    
    // Muunna specs JSON-muotoon jos on annettu
    let specs = {};
    if (specsText) {
        try {
            specs = JSON.parse(specsText);
        } catch (e) {
            console.warn('⚠️ Tekniset tiedot eivät ole validia JSON-muotoa, jätetään tyhjäksi');
            specs = {};
        }
    }
    
    // Muunna lisäkuvat array-muotoon jos on annettu
    let additionalImages = [];
    if (additionalImagesText) {
        additionalImages = additionalImagesText.split('\n').map(img => img.trim()).filter(img => img);
    }
    
    console.log('📦 Lomakkeen RAW arvot:');
    console.log('- name RAW:', `"${nameEl.value}"`);
    console.log('- price RAW:', `"${priceEl.value}"`);
    console.log('- category RAW:', `"${categoryRaw}"`);
    console.log('- category selectedIndex:', categoryEl.selectedIndex);
    console.log('- category options:', Array.from(categoryEl.options).map(o => ({value: o.value, text: o.text, selected: o.selected})));
    
    console.log('📦 Lomakkeen PARSED arvot:');
    console.log('- name:', `"${name}"`);
    console.log('- price:', price, '(tyyppi:', typeof price, ')');
    console.log('- category:', category, '(tyyppi:', typeof category, ') RAW oli:', `"${categoryRaw}"`);
    console.log('- image:', `"${image}"`);
    console.log('- description:', `"${description}"`);
    console.log('- stock:', stock);
    
    // Tarkka validointi debug-tietojen kanssa
    const nameValid = name && name.length > 0;
    const priceValid = !isNaN(price) && price > 0;
    const categoryValid = categoryRaw && categoryRaw !== "" && category && category > 0;
    
    console.log('✅ Validointitarkistukset:');
    console.log('- nameValid:', nameValid, '(nimi on:', `"${name}"`, 'pituus:', name.length, ')');
    console.log('- priceValid:', priceValid, '(hinta on:', price, ')');
    console.log('- categoryValid:', categoryValid, '(kategoria RAW:', `"${categoryRaw}"`, 'parsed:', category, ')');
    
    if (!nameValid || !priceValid || !categoryValid) {
      console.log('❌ Validointi epäonnistui!');
      let errorMsg = '❌ Täytä pakolliset kentät:\n';
      if (!nameValid) errorMsg += '- Tuotteen nimi (vähintään 1 merkki)\n';
      if (!priceValid) errorMsg += '- Hinta (positiivinen luku)\n';
      if (!categoryValid) errorMsg += '- Kategoria (valitse pudotusvalikosta)\n';
      alert(errorMsg);
      return;
    }
    
    console.log('✅ Lomakevalidointi ok');
    
    // Varmista image-kentän oletusarvo
    const finalImage = image || 'https://via.placeholder.com/400x400/333/666?text=Tuote';
    
    try {
      if (this.editingProductId) {
        console.log('🔧 Päivitetään tuote ID:', this.editingProductId);
        const updated = await window.PRODUCTS_JSON.updateProduct(this.editingProductId, {
          name, price, category, image: finalImage, description, stock, featured: false,
          detailedDescription, features, specs, additionalImages
        });
        if (updated) {
          console.log('✅ Tuote päivitetty:', updated);
          // Pakota välitön näkymän päivitys
          window.PRODUCTS_JSON.PRODUCTS_DATA_LOADED = false;
          await this.loadProducts();
          await this.displayProducts();
          alert('✅ Tuote päivitetty!');
        } else {
          alert('❌ Tuotteen päivitys epäonnistui');
        }
        this.cancelEdit();
      } else {
        console.log('➕ Lisätään uusi tuote...');
        const newProduct = await window.PRODUCTS_JSON.addProduct({
          name, price, category, image: finalImage, description, stock, featured: false,
          detailedDescription, features, specs, additionalImages
        });
        console.log('📦 addProduct palautti:', newProduct);
        if (newProduct) {
          console.log('✅ Tuote lisätty onnistuneesti:', newProduct);
          // Pakota välitön näkymän päivitys
          window.PRODUCTS_JSON.PRODUCTS_DATA_LOADED = false;
          await this.loadProducts();
          await this.displayProducts();
          alert('✅ Tuote lisätty: ' + newProduct.name);
        } else {
          alert('❌ Tuotteen lisäys epäonnistui');
        }
      }
      
      this.clearForm();
      this.updateStats();
    } catch (error) {
      console.error('❌ Virhe tuotteen käsittelyssä:', error);
      alert('❌ Tapahtui virhe: ' + error.message);
    }
  }  editProduct(id) {
    const product = this.products.find(p => p.id == id);
    if (!product) return;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productDescription').value = product.description || '';
    const stockElement = document.getElementById('productStock');
    if (stockElement) stockElement.value = product.stock || 0;
    
    // Uudet kentät
    const detailedDescEl = document.getElementById('productDetailedDescription');
    if (detailedDescEl) detailedDescEl.value = product.detailedDescription || '';
    
    const featuresEl = document.getElementById('productFeatures');
    if (featuresEl) featuresEl.value = product.features || '';
    
    const specsEl = document.getElementById('productSpecs');
    if (specsEl) specsEl.value = product.specs ? JSON.stringify(product.specs, null, 2) : '';
    
    const additionalImagesEl = document.getElementById('productAdditionalImages');
    if (additionalImagesEl) additionalImagesEl.value = product.additionalImages ? product.additionalImages.join('\n') : '';
    
    this.editingProductId = id;
    const submitBtn = document.querySelector('#productForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '✅ Päivitä tuote';
      submitBtn.style.background = 'var(--accent-600)';
    }
    if (!document.getElementById('cancelEditBtn')) {
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'cancelEditBtn';
      cancelBtn.type = 'button';
      cancelBtn.style.cssText = 'background: var(--bg-hover); color: var(--text-primary); padding: 0.75rem 1.5rem; border: none; border-radius: 8px; margin-left: 1rem; cursor: pointer;';
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

  async deleteProduct(id) {
    const product = this.products.find(p => p.id == id);
    if (!product) {
      alert('❌ Tuotetta ei löytynyt!');
      return;
    }
    
    if (confirm(`Poista tuote "${product.name}"?`)) {
      const success = await window.PRODUCTS_JSON.deleteProduct(id);
      if (success) {
        alert('🗑️ Tuote poistettu: ' + product.name);
        // Pakota välitön näkymän päivitys
        window.PRODUCTS_JSON.PRODUCTS_DATA_LOADED = false;
        await this.loadProducts();
        await this.displayProducts();
        this.updateStats();
      } else {
        alert('❌ Tuotteen poisto epäonnistui');
      }
    }
  }

  async toggleFeatured(id) {
    const product = this.products.find(p => p.id == id);
    if (product) {
      const updated = await window.PRODUCTS_JSON.updateProduct(id, {
        ...product,
        featured: !product.featured
      });
      if (updated) {
        console.log('✅ Suosikki-status päivitetty:', updated.name, updated.featured);
        // Pakota välitön näkymän päivitys
        window.PRODUCTS_JSON.PRODUCTS_DATA_LOADED = false;
        await this.loadProducts();
        await this.displayProducts();
      } else {
        alert('❌ Suosikki-statuksen päivitys epäonnistui');
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
    // Tyhjennä uudet kentät erikseen
    const detailedDescEl = document.getElementById('productDetailedDescription');
    if (detailedDescEl) detailedDescEl.value = '';
    
    const featuresEl = document.getElementById('productFeatures');
    if (featuresEl) featuresEl.value = '';
    
    const specsEl = document.getElementById('productSpecs');
    if (specsEl) specsEl.value = '';
    
    const additionalImagesEl = document.getElementById('productAdditionalImages');
    if (additionalImagesEl) additionalImagesEl.value = '';
    
    this.editingProductId = null;
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
    // Varmista että tuotedata on saatavilla
    if (!this.products) {
      console.log('⚠️ updateStats: products data ei ole saatavilla');
      return;
    }
    
    // Orders-data ei ole vielä toteutettu, käytä oletusarvoja
    const orders = this.orders || [];
    
    const stats = {
      totalProducts: this.products.length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
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
  
  // Näytä tuotteet-osio turvallisesti
  setTimeout(() => {
    if (typeof showSection === 'function') {
      showSection('products');
    }
  }, 100);
  
  // Form listeners
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await adminPanel.addProduct();
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
