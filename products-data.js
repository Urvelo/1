// 🛒 Tuotteet - Keskitetty tuotehallinta
// Kaikki tuotteet hallitaan admin-paneelista, ei esimerkkituotteita

const PRODUCTS_DATA = [
  // Tuotteet lisätään admin-paneelista dynaamisesti
];

const CATEGORIES_DATA = [
  { id: 1, name: 'Elektroniikka', description: 'Sähkölaitteet ja tarvikkeet' },
  { id: 2, name: 'Älykkäät laitteet', description: 'Älylaitteet ja IoT' },
  { id: 3, name: 'Kuulokkeet & Audio', description: 'Äänilaitteet ja kuulokkeet' },
  { id: 4, name: 'Kodin tavarat', description: 'Kotitaloustuotteet' }
];

// 🎯 Optimoitu latausfunktio - ei API-kutsuja!
function loadProductsFromJSON() {
  console.log('📦 Ladataan tuotteet client-side JSON:sta (ei Firestore kulutusta)');
  
  // Check if admin has added/modified products
  let products = [...PRODUCTS_DATA];
  const adminProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
  
  if (adminProducts.length > 0) {
    console.log('🔄 Löydettiin admin-tuotteita:', adminProducts.length);
    
    // Convert admin products to the format expected by the main site
    const convertedAdminProducts = adminProducts.map(adminProduct => ({
      id: adminProduct.id,
      name: adminProduct.name,
      price: adminProduct.price,
      originalPrice: adminProduct.price * 1.2, // Add 20% as original price for discount display
      image: adminProduct.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      category: getCategoryIdByName(adminProduct.category),
      description: adminProduct.description || 'Lisätty admin-paneelista',
      features: ['Admin-tuote'],
      stock: adminProduct.stock || 0,
      rating: 4.5,
      reviews: 12,
      featured: adminProduct.featured || false
    }));
    
    // Replace existing products with admin versions or add new ones
    const adminProductIds = adminProducts.map(p => p.id);
    products = products.filter(p => !adminProductIds.includes(p.id));
    products = [...products, ...convertedAdminProducts];
    
    console.log('✅ Synkattu admin-tuotteet pääsivulle:', products.length, 'tuotetta yhteensä');
  }
  
  return {
    products: products,
    categories: CATEGORIES_DATA,
    source: 'client-json-with-admin',
    timestamp: new Date().toISOString()
  };
}

// Helper function to convert category name to ID
function getCategoryIdByName(categoryName) {
  const categoryMap = {
    'Elektroniikka': 1,
    'Älylaitteet': 2, 
    'Audio': 3,
    'Älykodit': 4
  };
  return categoryMap[categoryName] || 1;
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
function addProduct(productData) {
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
  
  // Tallenna myös localStorage:iin että etusivu näkee
  const adminProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
  adminProducts.push(newProduct);
  localStorage.setItem('admin_products', JSON.stringify(adminProducts));
  
  console.log('✅ Tuote lisätty:', newProduct.name);
  console.log('💾 Tallennettu localStorage:iin');
  notifyDataChange();
  return newProduct;
}

function updateProduct(id, productData) {
  const index = PRODUCTS_DATA.findIndex(p => p.id == id);
  if (index === -1) return null;
  
  const updatedProduct = {
    ...PRODUCTS_DATA[index],
    name: productData.name,
    price: parseFloat(productData.price),
    originalPrice: parseFloat(productData.price) * 1.2,
    image: productData.image,
    category: getCategoryIdByName(productData.category),
    description: productData.description,
    stock: parseInt(productData.stock) || 0,
    featured: productData.featured || false
  };
  
  PRODUCTS_DATA[index] = updatedProduct;
  
  // Päivitä myös localStorage
  const adminProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
  const adminIndex = adminProducts.findIndex(p => p.id == id);
  if (adminIndex !== -1) {
    adminProducts[adminIndex] = updatedProduct;
    localStorage.setItem('admin_products', JSON.stringify(adminProducts));
  }
  
  console.log('✅ Tuote päivitetty:', updatedProduct.name);
  console.log('💾 Päivitetty localStorage:iin');
  notifyDataChange();
  return updatedProduct;
}

function deleteProduct(id) {
  const index = PRODUCTS_DATA.findIndex(p => p.id == id);
  if (index === -1) return false;
  
  const deletedProduct = PRODUCTS_DATA[index];
  PRODUCTS_DATA.splice(index, 1);
  
  // Poista myös localStorage:sta
  const adminProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
  const adminIndex = adminProducts.findIndex(p => p.id == id);
  if (adminIndex !== -1) {
    adminProducts.splice(adminIndex, 1);
    localStorage.setItem('admin_products', JSON.stringify(adminProducts));
  }
  
  console.log('✅ Tuote poistettu:', deletedProduct.name);
  console.log('💾 Poistettu localStorage:sta');
  notifyDataChange();
  return true;
}

function getCategoryIdByName(categoryName) {
  const categoryMap = {
    'Elektroniikka': 1,
    'Älylaitteet': 2, 
    'Audio': 3,
    'Älykodit': 4
  };
  return categoryMap[categoryName] || 1;
}

// 📢 Ilmoita muutoksista muille komponenteille
function notifyDataChange() {
  // Päivitä etusivu jos se on auki
  if (window.shopApp && typeof window.shopApp.renderProducts === 'function') {
    window.shopApp.renderProducts();
  }
  
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