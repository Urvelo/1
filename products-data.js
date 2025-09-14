// 🛒 Tuotteet - Keskitetty tuotehallinta
// Kaikki tuotteet hallitaan admin-paneelista, ei esimerkkituotteita


// 🛒 Tuotteet - Keskitetty tuotehallinta (JSON tiedostosta)
let PRODUCTS_DATA = [];
let PRODUCTS_DATA_LOADED = false;

const CATEGORIES_DATA = [
  { id: 1, name: 'Elektroniikka', description: 'Sähkölaitteet ja tarvikkeet' },
  { id: 2, name: 'Älykkäät laitteet', description: 'Älylaitteet ja IoT' },
  { id: 3, name: 'Kuulokkeet & Audio', description: 'Äänilaitteet ja kuulokkeet' },
  { id: 4, name: 'Kodin tavarat', description: 'Kotitaloustuotteet' }
];

// 🎯 Optimoitu latausfunktio - ei API-kutsuja!
// Lataa tuotteet products.all.json tiedostosta (vain kerran per sessio)
async function loadProductsFromJSON() {
  if (PRODUCTS_DATA_LOADED) {
    return {
      products: PRODUCTS_DATA,
      categories: CATEGORIES_DATA,
      source: 'memory',
      timestamp: new Date().toISOString()
    };
  }
  
  try {
    // 1. Yritä ensin localStorage (välittömät muutokset)
    const localData = localStorage.getItem('products.all.json');
    if (localData) {
      PRODUCTS_DATA = JSON.parse(localData);
      PRODUCTS_DATA_LOADED = true;
      console.log('📦 Tuotteet ladattu localStorage:sta:', PRODUCTS_DATA.length);
      return {
        products: PRODUCTS_DATA,
        categories: CATEGORIES_DATA,
        source: 'localStorage',
        timestamp: new Date().toISOString()
      };
    }
    
    // 2. Jos ei localStorage, lataa tiedostosta
    const resp = await fetch('/products.all.json');
    PRODUCTS_DATA = await resp.json();
    PRODUCTS_DATA_LOADED = true;
    console.log('📦 Tuotteet ladattu products.all.json:', PRODUCTS_DATA.length);
    return {
      products: PRODUCTS_DATA,
      categories: CATEGORIES_DATA,
      source: 'products.all.json',
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    console.error('❌ Tuotteiden lataus epäonnistui:', e);
    PRODUCTS_DATA = [];
    return {
      products: [],
      categories: CATEGORIES_DATA,
      source: 'fallback',
      timestamp: new Date().toISOString()
    };
  }
}

// Helper function to convert category name to ID
function getCategoryIdByName(categoryName) {
  if(!categoryName) return 1;
  const key = categoryName.toString().trim().toLowerCase();
  const categoryMap = {
    'elektroniikka': 1,
    'elektroniikka.': 1,
    'vaatteet': 2, // map "vaatteet" to second slot (reuse Älylaitteet id)
    'älylaitteet': 2,
    'älykkäät laitteet': 2,
    'audio': 3,
    'kuulokkeet & audio': 3,
    'kuulokkeet': 3,
    'koti': 4,
    'kodin tavarat': 4,
    'älykodit': 4
  };
  return categoryMap[key] || 1;
}

// 🔍 Hakutoiminnot (client-side, nopea)
function searchProducts(query, category = null) {
  let filtered = PRODUCTS_DATA;
  
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category == category);
  }
  
  if (query && query.trim() !== '') {
    const searchTerm = query.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.features.some(f => f.toLowerCase().includes(searchTerm))
    );
  }
  
  return filtered;
}

// 📊 Tuotteen haku ID:llä (client-side)
function getProductById(id) {
  return PRODUCTS_DATA.find(p => p.id == id) || null;
}

// 💰 Hintalaskennat (client-side)
function calculateCartTotal(cart) {
  return cart.reduce((total, item) => {
    const product = getProductById(item.productId);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
}

// 🏷️ Kategorian haku
function getCategoryById(id) {
  return CATEGORIES_DATA.find(c => c.id == id) || null;
}

// 📈 Suositut tuotteet (rating + reviews)
function getPopularProducts(limit = 4) {
  return PRODUCTS_DATA
    .sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews))
    .slice(0, limit);
}

// 💸 Tarjoustuotteet (alennetut)
function getSaleProducts(limit = 4) {
  return PRODUCTS_DATA
    .filter(p => p.originalPrice > p.price)
    .sort((a, b) => ((b.originalPrice - b.price) / b.originalPrice) - ((a.originalPrice - a.price) / a.originalPrice))
    .slice(0, limit);
}

// 🛠️ ADMIN CRUD FUNKTIOT - KESKITETTY TUOTEHALLINTA
async function addProduct(productData) {
  await ensureProductsLoaded();
  const newProduct = {
    id: Date.now(),
    name: productData.name,
    price: parseFloat(productData.price),
    originalPrice: parseFloat(productData.price) * 1.2,
    image: productData.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    category: getCategoryIdByName(productData.category),
    description: productData.description || '',
    features: productData.features || ['Admin-tuote'],
    stock: parseInt(productData.stock) || 0,
    rating: 4.5,
    reviews: 12,
    featured: productData.featured || false
  };
  PRODUCTS_DATA.push(newProduct);
  await saveProductsToJSON();
  notifyDataChange();
  return newProduct;
}

async function updateProduct(id, productData) {
  await ensureProductsLoaded();
  const index = PRODUCTS_DATA.findIndex(p => p.id == id);
  if (index === -1) return null;
  const updatedProduct = {
    ...PRODUCTS_DATA[index],
    name: productData.name,
    price: parseFloat(productData.price),
    originalPrice: parseFloat(productData.price) * 1.2,
    image: productData.image,
    category: parseInt(productData.category) || productData.category, // Käytä suoraan kategoria-ID:tä
    description: productData.description,
    stock: parseInt(productData.stock) || 0,
    featured: productData.featured || false
  };
  PRODUCTS_DATA[index] = updatedProduct;
  await saveProductsToJSON();
  notifyDataChange();
  return updatedProduct;
}

async function deleteProduct(id) {
  await ensureProductsLoaded();
  const index = PRODUCTS_DATA.findIndex(p => p.id == id);
  if (index === -1) return false;
  const deletedProduct = PRODUCTS_DATA[index];
  PRODUCTS_DATA.splice(index, 1);
  await saveProductsToJSON();
  notifyDataChange();
  return true;
}
// Tallenna tuotteet products.all.json tiedostoon
async function saveProductsToJSON() {
  try {
    // 1. Tallenna localStorage:iin välittömästi (näkyy heti)
    localStorage.setItem('products.all.json', JSON.stringify(PRODUCTS_DATA));
    console.log('💾 Tuotteet tallennettu localStorage:iin');
    
    // 2. Yritä tallentaa oikeaan tiedostoon (dev-ympäristössä)
    try {
      const response = await fetch('/api/save-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(PRODUCTS_DATA)
      });
      if (response.ok) {
        console.log('💾 Tuotteet tallennettu tiedostoon!');
      } else {
        console.log('⚠️ Tiedostotallennus epäonnistui, käytetään localStorage');
      }
    } catch (fileError) {
      console.log('⚠️ Ei API-yhteyttä, käytetään localStorage');
    }
    
    // 3. Pakota uudelleenlataus seuraavalla kerralla
    PRODUCTS_DATA_LOADED = false;
  } catch (e) {
    console.error('❌ Tuotteiden tallennus epäonnistui:', e);
  }
}

async function ensureProductsLoaded() {
  if (!PRODUCTS_DATA_LOADED) {
    await loadProductsFromJSON();
  }
}

// (Duplicate removed; unified implementation above)

// 📢 Ilmoita muutoksista muille komponenteille
function notifyDataChange() {
  // Pakota datan uudelleenlataus
  PRODUCTS_DATA_LOADED = false;
  
  console.log('🔄 notifyDataChange: Päivitetään kaikki näkymät');
  
  // Päivitä etusivu jos se on auki
  if (window.shopApp && typeof window.shopApp.refreshProducts === 'function') {
    console.log('🔄 Päivitetään etusivu');
    window.shopApp.refreshProducts();
  }
  
  // Päivitä admin-paneeli jos se on auki - viive varmistaa että localStorage on päivitetty
  setTimeout(() => {
    if (window.adminPanel && typeof window.adminPanel.displayProducts === 'function') {
      console.log('🔄 Päivitetään admin-paneeli');
      window.adminPanel.loadProducts().then(() => {
        window.adminPanel.displayProducts();
      });
    }
  }, 100);
  
  // Lähetä custom event
  window.dispatchEvent(new CustomEvent('productsUpdated', {
    detail: { products: PRODUCTS_DATA, timestamp: new Date() }
  }));
}

// 🔄 Backward compatibility ShopApp:lle + ADMIN CRUD
window.PRODUCTS_JSON = {
  // Haku ja näyttö
  loadProductsFromJSON,
  searchProducts,
  getProductById,
  calculateCartTotal,
  getCategoryById,
  getPopularProducts,
  getSaleProducts,
  
  // Admin CRUD funktiot
  addProduct,
  updateProduct,
  deleteProduct,
  getCategoryIdByName,
  notifyDataChange,
  
  // Data
  PRODUCTS_DATA,
  CATEGORIES_DATA,
  
  // Getterit live-datalle
  get products() { return PRODUCTS_DATA; },
  get categories() { return CATEGORIES_DATA; }
};

// 🌍 AliExpress tuotteiden haku backend-palvelun kautta
async function fetchFromAliExpress(productId) {
  try {
    console.log(`🔄 Haetaan AliExpress tuote: ${productId}`);
    
    const response = await fetch(`http://localhost:3001/api/product/${productId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const productData = await response.json();
    
    // Lisää tuote keskitettyyn järjestelmään
    const addedProduct = addProduct(productData);
    
    console.log(`✅ AliExpress tuote lisätty:`, addedProduct.name);
    return addedProduct;
    
  } catch (error) {
    console.error('❌ AliExpress haku epäonnistui:', error.message);
    throw error;
  }
}

// 🛒 Lisää useita AliExpress tuotteita kerralla
async function fetchMultipleFromAliExpress(productIds) {
  try {
    console.log(`🔄 Haetaan ${productIds.length} tuotetta AliExpressistä...`);
    
    const response = await fetch('http://localhost:3001/api/products/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productIds })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const { results, errors } = await response.json();
    
    // Lisää onnistuneet tuotteet keskitettyyn järjestelmään
    const addedProducts = [];
    for (const productData of results) {
      try {
        const addedProduct = addProduct(productData);
        addedProducts.push(addedProduct);
      } catch (error) {
        console.warn(`⚠️ Tuotteen lisäys epäonnistui:`, error.message);
      }
    }
    
    console.log(`✅ Lisätty ${addedProducts.length}/${productIds.length} tuotetta`);
    
    if (errors.length > 0) {
      console.warn(`⚠️ Virheitä: ${errors.length}`, errors);
    }
    
    return { addedProducts, errors };
    
  } catch (error) {
    console.error('❌ Batch haku epäonnistui:', error.message);
    throw error;
  }
}

// 📊 Tarkista backend yhteys
async function checkBackendConnection() {
  try {
    const response = await fetch('http://localhost:3001/api/status');
    const status = await response.json();
    console.log('🔗 Backend status:', status);
    return status;
  } catch (error) {
    console.error('❌ Backend ei vastaa:', error.message);
    return null;
  }
}

console.log('✅ Tuote-JSON ladattu:', PRODUCTS_DATA.length, 'tuotetta,', CATEGORIES_DATA.length, 'kategoriaa');