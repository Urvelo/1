// 🚀 AliExpress RapidAPI Backend - Integroitu keskitettyyn tuotehallintaan
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 🔧 Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// 🔐 RapidAPI Configuration (turvallisesti backendissä)
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'aliexpress-product1.p.rapidapi.com';

if (!RAPIDAPI_KEY) {
  console.error('❌ RAPIDAPI_KEY puuttuu .env tiedostosta!');
  process.exit(1);
}

// 🛡️ Rate limiting ja cache
const cache = new Map();
const requestCounts = new Map();
const RATE_LIMIT = 10; // 10 requests per minute per IP
const CACHE_DURATION = 300000; // 5 minutes

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const key = `${ip}:${minute}`;
  
  const count = requestCounts.get(key) || 0;
  if (count >= RATE_LIMIT) {
    return res.status(429).json({ 
      error: 'Liikaa pyyntöjä. Odota hetki ja yritä uudelleen.',
      retryAfter: 60 
    });
  }
  
  requestCounts.set(key, count + 1);
  next();
}

// 🔍 Hae tuote AliExpressistä ja palauta keskitetyn formaatin mukaisena
app.get('/api/product/:id', rateLimitMiddleware, async (req, res) => {
  const productId = req.params.id;
  
  // Tarkista cache ensin
  const cacheKey = `product:${productId}`;
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`📋 Cache hit: ${productId}`);
    return res.json(cached.data);
  }
  
  const url = `https://${RAPIDAPI_HOST}/scraper?productId=${productId}`;
  
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST,
      'User-Agent': 'Löytökauppa/1.0'
    }
  };

  try {
    console.log(`🔄 Haetaan tuote AliExpressistä: ${productId}`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 🎯 Muunna AliExpress data keskitetyn järjestelmän muotoon
    const productData = {
      // Perustiedot
      id: productId,
      name: data.title || data.productTitle || 'Tuntematon tuote',
      price: parseFloat(data.price?.value || data.currentPrice || data.salePrice || 0),
      originalPrice: parseFloat(data.originalPrice?.value || data.price?.value || 0),
      
      // Kuvat
      image: data.imageUrl || data.images?.[0] || data.mainImage || '/placeholder.jpg',
      images: data.images || [data.imageUrl || '/placeholder.jpg'],
      
      // Kategoriat (AliExpress -> meidän kategoriat)
      category: mapAliExpressCategory(data.categoryPath || data.category),
      
      // Kuvaus ja ominaisuudet
      description: data.description || data.productDescription || 'Tuotekuvaus ei saatavilla',
      features: extractFeatures(data),
      
      // Myyntitiedot
      stock: data.stock || data.availableQuantity || 1,
      rating: parseFloat(data.rating || data.averageRating || 0),
      reviews: parseInt(data.reviewCount || data.totalReviews || 0),
      
      // Linkit
      sourceUrl: data.productUrl || data.link,
      source: 'AliExpress',
      
      // Metadata
      lastUpdated: new Date().toISOString(),
      imported: true,
      aliexpressId: productId
    };
    
    // Tallenna cacheen
    cache.set(cacheKey, {
      data: productData,
      timestamp: Date.now()
    });
    
    console.log(`✅ Tuote haettu onnistuneesti: ${productData.name}`);
    res.json(productData);
    
  } catch (error) {
    console.error(`❌ Virhe haettaessa tuotetta ${productId}:`, error.message);
    res.status(500).json({ 
      error: 'Virhe haettaessa tuotetta AliExpressistä',
      details: error.message,
      productId: productId
    });
  }
});

// 🗂️ Mapaa AliExpress kategoriat meidän kategorioihin
function mapAliExpressCategory(categoryPath) {
  if (!categoryPath) return 1; // Default: Elektroniikka
  
  const path = categoryPath.toLowerCase();
  
  if (path.includes('computer') || path.includes('electronic') || path.includes('phone') || path.includes('tablet')) {
    return 1; // Elektroniikka
  } else if (path.includes('smart') || path.includes('home') || path.includes('security')) {
    return 2; // Älykodit  
  } else if (path.includes('audio') || path.includes('headphone') || path.includes('speaker')) {
    return 3; // Audio
  } else if (path.includes('game') || path.includes('toy') || path.includes('sport')) {
    return 4; // Pelit & Urheilu
  }
  
  return 1; // Default
}

// ✨ Pura ominaisuuksia AliExpress datasta
function extractFeatures(data) {
  const features = [];
  
  if (data.specifications) {
    Object.entries(data.specifications).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        features.push(`${key}: ${value}`);
      }
    });
  }
  
  if (data.features && Array.isArray(data.features)) {
    features.push(...data.features);
  }
  
  if (data.highlights && Array.isArray(data.highlights)) {
    features.push(...data.highlights);
  }
  
  // Jos ei ominaisuuksia, luo perustiedot
  if (features.length === 0) {
    features.push('Imported from AliExpress');
    if (data.shipping) features.push(`Shipping: ${data.shipping}`);
    if (data.brand) features.push(`Brand: ${data.brand}`);
  }
  
  return features.slice(0, 6); // Max 6 ominaisuutta
}

// 🔍 Hae useita tuotteita kerralla
app.post('/api/products/batch', rateLimitMiddleware, async (req, res) => {
  const { productIds } = req.body;
  
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'productIds array required' });
  }
  
  if (productIds.length > 5) {
    return res.status(400).json({ error: 'Maksimissaan 5 tuotetta kerralla' });
  }
  
  const results = [];
  const errors = [];
  
  for (const productId of productIds) {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/product/${productId}`);
      if (response.ok) {
        const data = await response.json();
        results.push(data);
      } else {
        errors.push({ productId, error: 'Fetch failed' });
      }
    } catch (error) {
      errors.push({ productId, error: error.message });
    }
  }
  
  res.json({ results, errors });
});

// 📊 API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    service: 'AliExpress RapidAPI Backend',
    timestamp: new Date().toISOString(),
    cache_size: cache.size,
    rate_limits: requestCounts.size,
    rapidapi_configured: !!RAPIDAPI_KEY
  });
});

// 🧹 Cache cleanup task
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
  
  // Clean rate limit counters older than 1 hour
  const hourAgo = Math.floor((now - 3600000) / 60000);
  for (const key of requestCounts.keys()) {
    const minute = parseInt(key.split(':')[1]);
    if (minute < hourAgo) {
      requestCounts.delete(key);
    }
  }
}, 300000); // Every 5 minutes

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 AliExpress Backend käynnissä portissa ${PORT}`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/product/{productId}`);
  console.log(`📊 Status: http://localhost:${PORT}/api/status`);
  console.log(`🔐 RapidAPI konfiguroitu: ${!!RAPIDAPI_KEY ? '✅' : '❌'}`);
});

// 🛡️ Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;