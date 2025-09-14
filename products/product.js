// Product page logic
(function(){
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  // Normalize cart key: migrate legacy 'cart' -> 'shopping_cart'
  (function migrateCart(){
    const oldCart = localStorage.getItem('cart');
    if (oldCart && !localStorage.getItem('shopping_cart')) {
      try { localStorage.setItem('shopping_cart', oldCart); } catch(e) {}
      localStorage.removeItem('cart');
    }
  })();

  async function getProducts(){
    if (window.PRODUCTS_JSON && window.PRODUCTS_JSON.loadProductsFromJSON) {
      const data = await window.PRODUCTS_JSON.loadProductsFromJSON();
      return data.products || [];
    }
    return [];
  }

  async function getCategories(){
    if (window.PRODUCTS_JSON && window.PRODUCTS_JSON.loadProductsFromJSON) {
      const data = await window.PRODUCTS_JSON.loadProductsFromJSON();
      return data.categories || [];
    }
    return [];
  }

  async function loadProduct() {
    if (!productId) { showProductNotFound(); return; }
    const products = await getProducts();
    const product = products.find(p => p.id == productId);
    if (!product) { showProductNotFound(); return; }
    displayProduct(product);
    loadRelatedProducts(product.category, product.id);
  }

  async function getCategoryName(categoryId) {
    const categories = await getCategories();
    const category = categories.find(c => c.id == categoryId);
    return category ? category.name : 'Tuntematon kategoria';
  }

  async function displayProduct(product) {
    const container = document.getElementById('productDetails');
    if (!container) return;
    
    // Lisätietojen luominen
    const specs = product.specs || product.technicalSpecs || {};
    const features = product.features || '';
    const detailedDescription = product.detailedDescription || product.description;
    const additionalImages = product.additionalImages || [];
    const categoryName = await getCategoryName(product.category);
    
    container.innerHTML = `
      <div class="product-layout">
        <!-- Vasemman puolen kuva-alue -->
        <div class="product-images-section">
          <div class="product-image-main">
            <img src="${product.image}" alt="${product.name}" class="main-product-image" onclick="showFullImage('${product.image}')">
          </div>
          
          ${additionalImages.length > 0 ? `
            <div class="product-image-thumbnails">
              <img src="${product.image}" alt="${product.name}" class="thumbnail-image active" onclick="changeMainImage('${product.image}')">
              ${additionalImages.map(img => `
                <img src="${img}" alt="${product.name}" class="thumbnail-image" onclick="changeMainImage('${img}')">
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Oikean puolen tuotetiedot -->
        <div class="product-info-section">
          <div class="product-category-badge">${categoryName}</div>
          <h1 class="product-title">${product.name}</h1>
          
          <div class="product-price-section">
            <span class="product-price-main">${product.price.toFixed(2)} €</span>
            ${product.originalPrice && product.originalPrice > product.price ? `
              <span class="product-price-original">${product.originalPrice.toFixed(2)} €</span>
              <span class="product-discount">-${Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
            ` : ''}
          </div>

          <div class="product-short-description">
            <p>${(product.description || 'Ei kuvausta saatavilla.').substring(0, 150)}${(product.description || '').length > 150 ? '...' : ''}</p>
          </div>

          <div class="product-actions">
            <button class="btn btn-primary btn-large add-to-cart-btn" onclick="addToCart(${product.id})">
              <i class="fas fa-cart-plus"></i>
              Lisää ostoskoriin
            </button>
            
            ${product.stock && product.stock > 0 ? `
              <div class="stock-info">
                <i class="fas fa-check-circle text-success"></i>
                Varastossa ${product.stock} kpl
              </div>
            ` : `
              <div class="stock-info out-of-stock">
                <i class="fas fa-exclamation-triangle text-warning"></i>
                Ei varastossa
              </div>
            `}
          </div>

          ${features ? `
            <div class="product-quick-features">
              <h3>Tärkeimmät ominaisuudet</h3>
              <ul class="feature-list">
                ${features.split('\n').slice(0, 4).map(feature => 
                  feature.trim() ? `<li><i class="fas fa-check text-success"></i> ${feature.trim()}</li>` : ''
                ).filter(item => item).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="product-info-extras">
            <div class="info-item">
              <i class="fas fa-truck"></i>
              <span>Ilmainen toimitus yli 50€</span>
            </div>
            <div class="info-item">
              <i class="fas fa-undo"></i>
              <span>14 päivän palautusoikeus</span>
            </div>
            <div class="info-item">
              <i class="fas fa-shield-alt"></i>
              <span>2 vuoden takuu</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Yksityiskohtaiset tiedot kuvan alla -->
      <div class="product-details-tabs">
        <div class="tab-navigation">
          <button class="tab-btn active" onclick="showTab('description')">Kuvaus</button>
          ${Object.keys(specs).length > 0 ? '<button class="tab-btn" onclick="showTab(\'specs\')">Tekniset tiedot</button>' : ''}
          ${features ? '<button class="tab-btn" onclick="showTab(\'features\')">Ominaisuudet</button>' : ''}
        </div>

        <div class="tab-content">
          <div id="tab-description" class="tab-panel active">
            <h3>Tuotekuvaus</h3>
            <div class="description-content">
              ${detailedDescription || product.description || 'Ei kuvausta saatavilla.'}
            </div>
          </div>

          ${Object.keys(specs).length > 0 ? `
            <div id="tab-specs" class="tab-panel">
              <h3>Tekniset tiedot</h3>
              <div class="specs-grid">
                ${Object.entries(specs).map(([key, value]) => `
                  <div class="spec-item">
                    <span class="spec-label">${key}:</span>
                    <span class="spec-value">${value}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${features ? `
            <div id="tab-features" class="tab-panel">
              <h3>Ominaisuudet</h3>
              <div class="features-list">
                ${features.split('\n').map(feature => 
                  feature.trim() ? `<div class="feature-item"><i class="fas fa-star text-warning"></i> ${feature.trim()}</div>` : ''
                ).filter(item => item).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    document.title = `${product.name} - Löytökauppa`;
    updateCartUI();
  }

  async function loadRelatedProducts(categoryId, currentProductId) {
    const products = await getProducts();
    const related = products.filter(p => p.category == categoryId && p.id != currentProductId).slice(0, 4);
    
    const container = document.getElementById('relatedProducts');
    if (!container || related.length === 0) return;

    container.innerHTML = related.map(p => `
      <div class="product-card" onclick="openRelatedProduct(${p.id})">
        <div class="product-image">
          <img src="${p.image}" alt="${p.name}">
        </div>
        <div class="product-info">
          <h4>${p.name}</h4>
          <p class="price">${p.price.toFixed(2)} €</p>
        </div>
      </div>
    `).join('');
  }

  function showProductNotFound() {
    document.getElementById('productDetails').style.display = 'none';
    document.getElementById('productNotFound').style.display = 'block';
  }

  function openRelatedProduct(id) {
    window.location.search = `?id=${id}`;
  }

  // Image functions
  window.changeMainImage = function(imageSrc) {
    const mainImg = document.querySelector('.main-product-image');
    if (mainImg) mainImg.src = imageSrc;
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail-image').forEach(thumb => thumb.classList.remove('active'));
    document.querySelector(`[onclick="changeMainImage('${imageSrc}')"]`).classList.add('active');
  };

  window.showFullImage = function(imageSrc) {
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    overlay.innerHTML = `
      <div class="image-overlay-content">
        <img src="${imageSrc}" alt="Tuotekuva">
        <button class="close-overlay" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
    `;
    document.body.appendChild(overlay);
  };

  // Tab functions
  window.showTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
  };

  // Cart functions
  window.addToCart = function(productId) {
    const cart = JSON.parse(localStorage.getItem('shopping_cart')) || [];
    const products = window.PRODUCTS_JSON ? window.PRODUCTS_JSON.PRODUCTS_DATA || [] : [];
    const product = products.find(p => p.id == productId);
    
    if (!product) return;
    
    const existingItem = cart.find(item => item.id == productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: productId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }
    
    localStorage.setItem('shopping_cart', JSON.stringify(cart));
    updateCartUI();
    
    // Show feedback
    const button = document.querySelector('.add-to-cart-btn');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Lisätty!';
    button.style.background = 'var(--success)';
    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.background = '';
    }, 2000);
  };

  function updateCartUI() {
    const cart = JSON.parse(localStorage.getItem('shopping_cart')) || [];
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      cartCount.textContent = totalItems;
    }
  }

  window.toggleCart = function() {
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    
    if (cartSidebar) cartSidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  };

  // Initialize page
  document.addEventListener('DOMContentLoaded', function() {
    loadProduct();
  });

})();