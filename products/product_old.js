// Product page logic extracted from inline script
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

  async function loadProduct() {
    if (!productId) { showProductNotFound(); return; }
    const products = await getProducts();
    const product = products.find(p => p.id == productId);
    if (!product) { showProductNotFound(); return; }
    displayProduct(product);
    loadRelatedProducts(product.category, product.id);
  }

  function displayProduct(product) {
    const container = document.getElementById('productDetails');
    if (!container) return;
    
    // Lisätietojen luominen
    const specs = product.specs || product.technicalSpecs || {};
    const features = product.features || [];
    const detailedDescription = product.detailedDescription || product.description;
    const additionalImages = product.additionalImages || [];
    
    container.innerHTML = `
      <article class="product-hero" aria-labelledby="productTitle">
        <!-- Pääkuva ja lisäkuvat vasemmalla -->
        <div class="product-images-section">
          <div class="product-image-main">
            ${product.image ? 
              `<img src="${product.image}" alt="${product.name}" class="main-product-image" onclick="showFullImage('${product.image}')" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div class="product-image-placeholder" style="display: none;" aria-hidden="true">
                 <i class="fas fa-image"></i>
               </div>` :
              `<div class="product-image-placeholder" aria-hidden="true">
                 <i class="fas fa-image"></i>
               </div>`
            }
          </div>
          
          ${additionalImages.length > 0 ? `
            <div class="product-image-thumbnails">
              <img src="${product.image}" alt="${product.name}" class="thumbnail-image active" onclick="showMainImage('${product.image}')">
              ${additionalImages.map(img => `
                <img src="${img}" alt="${product.name}" class="thumbnail-image" onclick="showMainImage('${img}')">
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Tuotetiedot ja ostosnappi oikealla -->
        <div class="product-info-section">
          <header class="product-header">
            <div class="product-category-badge">${getCategoryName(product.category)}</div>
            <h1 id="productTitle" class="product-title">${product.name}</h1>
            <div class="product-price-section">
              <span class="product-price-main">${product.price.toFixed(2)} €</span>
              ${product.originalPrice && product.originalPrice > product.price ? `
                <span class="product-price-original">${product.originalPrice.toFixed(2)} €</span>
                <span class="product-discount">-${Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
              ` : ''}
            </div>
          </header>
          
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

          ${features && features.length > 0 ? `
            <div class="product-quick-features">
              <h3>Tärkeimmät ominaisuudet</h3>
              <ul class="feature-list">
                ${(typeof features === 'string' ? features.split('\n') : features).slice(0, 4).map(feature => 
                  feature.trim() ? `<li><i class="fas fa-check text-success"></i>${feature.trim()}</li>` : ''
                ).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </article>

      <!-- Tuotteen yksityiskohtaiset tiedot kuvan alla -->
      <section class="product-details-section">
        <div class="product-tabs">
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
                ${(typeof features === 'string' ? features.split('\n') : features).map(feature => 
                  feature.trim() ? `<div class="feature-item"><i class="fas fa-star text-warning"></i>${feature.trim()}</div>` : ''
                ).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </section>`;
            </div>
            <div class="description-full" style="display: none;">
              <p>${detailedDescription || product.description || 'Ei kuvausta saatavilla.'}</p>
              <button class="show-less-btn" onclick="toggleDescription()">Näytä vähemmän</button>
            </div>
          </section>

          ${features.length > 0 ? `
            <section class="product-features">
              <h3>Ominaisuudet</h3>
              <ul class="features-list">
                ${features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
              </ul>
            </section>
          ` : ''}
          
          <section class="product-actions" aria-label="Toiminnot">
            <div class="quantity-selector">
              <label for="quantity">Määrä:</label>
              <div class="quantity-controls">
                <button class="quantity-btn" data-qty-delta="-1" aria-label="Vähennä määrää">-</button>
                <input type="number" id="quantity" value="1" min="1" max="10" aria-live="polite">
                <button class="quantity-btn" data-qty-delta="1" aria-label="Lisää määrää">+</button>
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn btn-primary btn-lg" id="addToCartBtn">
                <i class="fas fa-shopping-cart"></i>
                Lisää ostoskoriin
              </button>
              <button class="btn btn-secondary" id="addToWishlistBtn">
                <i class="fas fa-heart"></i>
                Lisää toivelistaan
              </button>
            </div>
            <div class="cart-actions" style="margin-top: 1rem;">
              <button class="btn btn-success btn-block" id="goToCartBtn" onclick="goToCart()" style="display: none;">
                <i class="fas fa-shopping-cart"></i>
                Siirry ostoskoriin
              </button>
            </div>
          </section>

          ${Object.keys(specs).length > 0 ? `
            <section class="product-specs">
              <h3>Tekniset tiedot</h3>
              <div class="specs-short">
                ${Object.entries(specs).slice(0, 3).map(([key, value]) => `
                  <div class="spec-item">
                    <span class="spec-label">${key}:</span>
                    <span class="spec-value">${value}</span>
                  </div>
                `).join('')}
                ${Object.keys(specs).length > 3 ? '<button class="show-more-btn" onclick="toggleSpecs()">Näytä kaikki tekniset tiedot</button>' : ''}
              </div>
              <div class="specs-full" style="display: none;">
                ${Object.entries(specs).map(([key, value]) => `
                  <div class="spec-item">
                    <span class="spec-label">${key}:</span>
                    <span class="spec-value">${value}</span>
                  </div>
                `).join('')}
                <button class="show-less-btn" onclick="toggleSpecs()">Näytä vähemmän</button>
              </div>
            </section>
          ` : ''}
          
          <section class="product-info-extra" aria-label="Lisätiedot">
            <div class="info-item">
              <i class="fas fa-truck" aria-hidden="true"></i>
              <div>
                <strong>Toimitus</strong>
                <p>Ilmainen toimitus yli 50€ tilauksille</p>
              </div>
            </div>
            <div class="info-item">
              <i class="fas fa-undo" aria-hidden="true"></i>
              <div>
                <strong>Palautus</strong>
                <p>14 päivän palautusoikeus</p>
              </div>
            </div>
            <div class="info-item">
              <i class="fas fa-shield-alt" aria-hidden="true"></i>
              <div>
                <strong>Takuu</strong>
                <p>2 vuoden valmistajan takuu</p>
              </div>
            </div>
          </section>
        </div>
      </article>`;
    document.title = `${product.name} - Löytökauppa`;
    wireActions(product);
  }

  function showProductNotFound() {
    const details = document.getElementById('productDetails');
    const nf = document.getElementById('productNotFound');
    if (details) details.style.display = 'none';
    if (nf) nf.style.display = 'block';
  }

  function loadRelatedProducts(category, excludeId) {
    const products = getProducts();
    const related = products.filter(p => p.category === category && p.id != excludeId).slice(0,4);
    const container = document.getElementById('relatedProducts');
    const section = container ? container.parentElement : null;
    if (!container || !section) return;
    if (related.length === 0) { section.style.display = 'none'; return; }
    container.innerHTML = related.map(p => `
      <div class="product-card" data-related-id="${p.id}" tabindex="0" role="button" aria-pressed="false">
        ${p.image ?
          `<img src="${p.image}" alt="${p.name}" class="product-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="product-image" style="display:none;">📦</div>` :
          `<div class="product-image">📦</div>`}
        <div class="product-info">
          <h3 class="product-title">${p.name}</h3>
          <div class="product-price">${p.price} €</div>
          <span class="product-category">${p.category}</span>
          <p class="product-description">${(p.description||'').substring(0,100)}${(p.description||'').length>100?'...':''}</p>
        </div>
      </div>`).join('');
    container.querySelectorAll('[data-related-id]').forEach(el => {
      el.addEventListener('click', () => navigateToProduct(el.getAttribute('data-related-id')));
      el.addEventListener('keypress', (e) => { if (e.key==='Enter') navigateToProduct(el.getAttribute('data-related-id')); });
    });
  }

  function navigateToProduct(id){
    window.location.search = `?id=${id}`;
  }

  // "Näytä lisää" toiminnallisuudet
  window.toggleDescription = function() {
    const shortDesc = document.querySelector('.description-short');
    const fullDesc = document.querySelector('.description-full');
    if (shortDesc.style.display === 'none') {
      shortDesc.style.display = 'block';
      fullDesc.style.display = 'none';
    } else {
      shortDesc.style.display = 'none';
      fullDesc.style.display = 'block';
    }
  }

  window.toggleSpecs = function() {
    const shortSpecs = document.querySelector('.specs-short');
    const fullSpecs = document.querySelector('.specs-full');
    if (shortSpecs.style.display === 'none') {
      shortSpecs.style.display = 'block';
      fullSpecs.style.display = 'none';
    } else {
      shortSpecs.style.display = 'none';
      fullSpecs.style.display = 'block';
    }
  }

  window.showFullImage = function(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.9); z-index: 10000; display: flex; 
      align-items: center; justify-content: center; cursor: pointer;
    `;
    modal.innerHTML = `
      <img src="${imageSrc}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
      <button style="position: absolute; top: 20px; right: 20px; background: white; border: none; 
                     border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer;">&times;</button>
    `;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
  }

  window.goToCart = function() {
    window.location.href = '../checkout/';
  }

  function changeQuantity(delta) {
    const input = document.getElementById('quantity');
    if (!input) return;
    const newValue = parseInt(input.value || '1', 10) + delta;
    if (newValue >= 1 && newValue <= 10) input.value = newValue;
  }

  function addToCart(product, quantity){
    let cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
    const existing = cart.find(i => i.id == product.id);
    if (existing) existing.quantity += quantity; else cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      quantity
    });
    localStorage.setItem('shopping_cart', JSON.stringify(cart));
    updateCartCount();
    showStatus(`${product.name} lisätty ostoskoriin!`, 'success');
    
    // Näytä ostoskorin nappi
    const goToCartBtn = document.getElementById('goToCartBtn');
    if (goToCartBtn) {
      goToCartBtn.style.display = 'block';
    }
    
    document.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
  }

  function addToWishlist(product){
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (wishlist.find(i => i.id == product.id)) {
      showStatus('Tuote on jo toivelistalla', 'info');
      return;
    }
    wishlist.push({ id: product.id, name: product.name, price: product.price, category: product.category, image: product.image });
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    showStatus(`${product.name} lisätty toivelistaan!`, 'success');
    document.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { wishlist } }));
  }

  function updateCartCount(){
    const cart = JSON.parse(localStorage.getItem('shopping_cart') || '[]');
    const count = cart.reduce((s,i)=>s+i.quantity,0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = count;
  }

  function showStatus(message, type){
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `status-message ${type} show`;
    setTimeout(()=>statusEl.classList.remove('show'),3000);
  }

  function toggleCart(){ window.location.href = '../checkout/'; }

  function wireActions(product){
    const qControls = document.querySelectorAll('[data-qty-delta]');
    qControls.forEach(btn => btn.addEventListener('click', () => changeQuantity(parseInt(btn.getAttribute('data-qty-delta'),10))));
    const addBtn = document.getElementById('addToCartBtn');
    const wishBtn = document.getElementById('addToWishlistBtn');
    if (addBtn) addBtn.addEventListener('click', () => {
      const qty = parseInt(document.getElementById('quantity').value,10) || 1;
      addToCart(product, qty);
    });
    if (wishBtn) wishBtn.addEventListener('click', () => addToWishlist(product));
  }

  // Expose minimal API for debugging
  window.ProductPage = { reload: loadProduct, updateCartCount };

  loadProduct();
  updateCartCount();
})();
