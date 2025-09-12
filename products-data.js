// 🛒 Tuotteet - Client-side JSON (ei Firestore:a!)
// Tämä säästää Firestore-tilaa ja nopeuttaa sivua

const PRODUCTS_DATA = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    price: 1199.00,
    originalPrice: 1399.00,
    image: "https://images.unsplash.com/photo-1592286130927-570ecd1ded68?w=400",
    category: 1,
    description: "Uusin iPhone huippuominaisuuksilla. A17 Pro -siru, titaanikuori ja ProRAW-kuvaus.",
    features: ["A17 Pro siru", "Titanium design", "ProRAW kuvaus", "5G connectivity"],
    stock: 25,
    rating: 4.8,
    reviews: 1247
  },
  {
    id: 2,
    name: "MacBook Air M3",
    price: 1299.00,
    originalPrice: 1499.00,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    category: 1,
    description: "Kevyt ja tehokas MacBook Air M3-sirulla. Täydellinen työntekoon ja luovuuteen.",
    features: ["M3 chip", "18h akunkesto", "Liquid Retina display", "MagSafe lataus"],
    stock: 12,
    rating: 4.9,
    reviews: 856
  },
  {
    id: 3,
    name: "AirPods Pro 3rd Gen",
    price: 279.00,
    originalPrice: 329.00,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400",
    category: 3,
    description: "Aktiivinen melunpoisto ja spatiaalinen ääni. USB-C latauskotelolla.",
    features: ["Active Noise Cancellation", "Spatial Audio", "USB-C kotelo", "6h kuuntelua"],
    stock: 45,
    rating: 4.7,
    reviews: 2103
  },
  {
    id: 4,
    name: "iPad Pro 12.9\" M3",
    price: 1099.00,
    originalPrice: 1299.00,
    image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400",
    category: 1,
    description: "Ammattilais-tabletti M3-sirulla. Liquid Retina XDR näyttö ja Apple Pencil -tuki.",
    features: ["M3 chip", "Liquid Retina XDR", "Apple Pencil support", "5G cellular"],
    stock: 8,
    rating: 4.8,
    reviews: 432
  },
  {
    id: 5,
    name: "Apple Watch Series 9",
    price: 429.00,
    originalPrice: 499.00,
    image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400",
    category: 2,
    description: "Älykello S9-sirulla. Terveysseuranta, fitness ja älypuhelimen toiminnot.",
    features: ["S9 SiP", "Always-On Retina", "EKG & SpO2", "Crash Detection"],
    stock: 67,
    rating: 4.6,
    reviews: 1893
  },
  {
    id: 6,
    name: "HomePod mini",
    price: 99.00,
    originalPrice: 129.00,
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400",
    category: 2,
    description: "Kompakti älykaiutin. Siri-tuki ja HomeKit-integraatio.",
    features: ["360° ääni", "Siri built-in", "HomeKit hub", "Touch controls"],
    stock: 34,
    rating: 4.4,
    reviews: 567
  },
  {
    id: 7,
    name: "Magic Keyboard",
    price: 179.00,
    originalPrice: 199.00,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400",
    category: 1,
    description: "Langaton näppäimistö Touch ID:llä. Yhteensopiva Mac ja iPad kanssa.",
    features: ["Touch ID", "Backlit keys", "USB-C lataus", "Multi-device"],
    stock: 23,
    rating: 4.5,
    reviews: 789
  },
  {
    id: 8,
    name: "AirTag 4-pack",
    price: 99.00,
    originalPrice: 119.00,
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400",
    category: 2,
    description: "Bluetooth-seurantalaitteet. Löydä kadonneet esineet Find My -verkosta.",
    features: ["Precision Finding", "Privacy built-in", "Water resistant", "1 year battery"],
    stock: 78,
    rating: 4.3,
    reviews: 1245
  }
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
  return {
    products: PRODUCTS_DATA,
    categories: CATEGORIES_DATA,
    source: 'client-json',
    timestamp: new Date().toISOString()
  };
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

// 🔄 Backward compatibility ShopApp:lle
window.PRODUCTS_JSON = {
  loadProductsFromJSON,
  searchProducts,
  getProductById,
  calculateCartTotal,
  getCategoryById,
  getPopularProducts,
  getSaleProducts,
  PRODUCTS_DATA,
  CATEGORIES_DATA
};

console.log('✅ Tuote-JSON ladattu:', PRODUCTS_DATA.length, 'tuotetta,', CATEGORIES_DATA.length, 'kategoriaa');