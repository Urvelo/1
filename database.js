// Tietokanta-rakenne LocalStoragelle
class Database {
  constructor() {
    this.initializeDatabase();
  }
  
  initializeDatabase() {
    // Alustetaan tietokantataulut jos ne eivät ole olemassa
    
    // Käyttäjät
    if (!localStorage.getItem('registered_users')) {
      localStorage.setItem('registered_users', JSON.stringify([]));
    }
    
    // Admin-tuotteet
    if (!localStorage.getItem('admin_products')) {
      localStorage.setItem('admin_products', JSON.stringify([]));
    }
    
    // Admin-kategoriat
    if (!localStorage.getItem('admin_categories')) {
      const defaultCategories = [
        { id: 1, name: 'Elektroniikka', description: 'Sähkölaitteet ja tarvikkeet', icon: 'fas fa-plug' },
        { id: 2, name: 'Älylaitteet', description: 'Älykellot ja fitness-trackerit', icon: 'fas fa-watch' },
        { id: 3, name: 'Audio', description: 'Kuulokkeet ja kaiuttimet', icon: 'fas fa-headphones' },
        { id: 4, name: 'Kodin tavarat', description: 'Käytännölliset kodinkoneet', icon: 'fas fa-home' }
      ];
      localStorage.setItem('admin_categories', JSON.stringify(defaultCategories));
    }
    
    // Asiakastilaukset
    if (!localStorage.getItem('customer_orders')) {
      localStorage.setItem('customer_orders', JSON.stringify([]));
    }
    
    // Ostoskori
    if (!localStorage.getItem('shopping_cart')) {
      localStorage.setItem('shopping_cart', JSON.stringify([]));
    }
    
    // Toivelista
    if (!localStorage.getItem('wishlist')) {
      localStorage.setItem('wishlist', JSON.stringify([]));
    }
    
    // Kauppasivun tuotteet (synkronoidaan admin-tuotteiden kanssa)
    this.syncShopProducts();
  }
  
  syncShopProducts() {
    const adminProducts = JSON.parse(localStorage.getItem('admin_products'));
    localStorage.setItem('shop_products', JSON.stringify(adminProducts));
  }
  
  // KÄYTTÄJIEN HALLINTA
  createUser(userData) {
    const users = this.getUsers();
    const newUser = {
      id: Date.now(),
      ...userData,
      created: new Date().toISOString(),
      lastLogin: null,
      orderHistory: []
    };
    
    users.push(newUser);
    localStorage.setItem('registered_users', JSON.stringify(users));
    return newUser;
  }
  
  getUsers() {
    return JSON.parse(localStorage.getItem('registered_users')) || [];
  }
  
  getUserById(id) {
    const users = this.getUsers();
    return users.find(user => user.id === id);
  }
  
  getUserByEmail(email) {
    const users = this.getUsers();
    return users.find(user => user.email === email);
  }
  
  updateUser(userId, updateData) {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updateData };
      localStorage.setItem('registered_users', JSON.stringify(users));
      return users[userIndex];
    }
    return null;
  }
  
  // TUOTTEIDEN HALLINTA
  createProduct(productData) {
    const products = this.getProducts();
    const newProduct = {
      id: Date.now(),
      ...productData,
      created: new Date().toISOString()
    };
    
    products.push(newProduct);
    localStorage.setItem('admin_products', JSON.stringify(products));
    this.syncShopProducts();
    return newProduct;
  }
  
  getProducts() {
    return JSON.parse(localStorage.getItem('admin_products')) || [];
  }
  
  updateProduct(productId, updateData) {
    const products = this.getProducts();
    const productIndex = products.findIndex(product => product.id === productId);
    
    if (productIndex !== -1) {
      products[productIndex] = { ...products[productIndex], ...updateData };
      localStorage.setItem('admin_products', JSON.stringify(products));
      this.syncShopProducts();
      return products[productIndex];
    }
    return null;
  }
  
  deleteProduct(productId) {
    const products = this.getProducts();
    const filteredProducts = products.filter(product => product.id !== productId);
    localStorage.setItem('admin_products', JSON.stringify(filteredProducts));
    this.syncShopProducts();
  }
  
  // KATEGORIOIDEN HALLINTA
  getCategories() {
    return JSON.parse(localStorage.getItem('admin_categories')) || [];
  }
  
  createCategory(categoryData) {
    const categories = this.getCategories();
    const newCategory = {
      id: Date.now(),
      ...categoryData
    };
    
    categories.push(newCategory);
    localStorage.setItem('admin_categories', JSON.stringify(categories));
    return newCategory;
  }
  
  // TILAUSTEN HALLINTA
  createOrder(orderData) {
    const orders = this.getOrders();
    const newOrder = {
      id: Date.now(),
      ...orderData,
      created: new Date().toISOString(),
      status: 'new'
    };
    
    orders.push(newOrder);
    localStorage.setItem('customer_orders', JSON.stringify(orders));
    
    // Lisää tilaus käyttäjän historiaan
    if (orderData.customer_email) {
      const user = this.getUserByEmail(orderData.customer_email);
      if (user) {
        user.orderHistory = user.orderHistory || [];
        user.orderHistory.push(newOrder.id);
        this.updateUser(user.id, user);
      }
    }
    
    return newOrder;
  }
  
  getOrders() {
    return JSON.parse(localStorage.getItem('customer_orders')) || [];
  }
  
  getOrdersByUser(userEmail) {
    const orders = this.getOrders();
    return orders.filter(order => order.customer_email === userEmail);
  }
  
  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      orders[orderIndex].statusUpdated = new Date().toISOString();
      localStorage.setItem('customer_orders', JSON.stringify(orders));
      return orders[orderIndex];
    }
    return null;
  }
  
  // OSTOSKORIN HALLINTA
  getCart() {
    return JSON.parse(localStorage.getItem('shopping_cart')) || [];
  }
  
  saveCart(cartData) {
    localStorage.setItem('shopping_cart', JSON.stringify(cartData));
  }
  
  clearCart() {
    localStorage.setItem('shopping_cart', JSON.stringify([]));
  }
  
  // TOIVELISTAN HALLINTA
  getWishlist() {
    return JSON.parse(localStorage.getItem('wishlist')) || [];
  }
  
  addToWishlist(productId) {
    const wishlist = this.getWishlist();
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }
  
  removeFromWishlist(productId) {
    const wishlist = this.getWishlist();
    const filteredWishlist = wishlist.filter(id => id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(filteredWishlist));
  }
  
  // TILASTOT
  getStats() {
    const products = this.getProducts();
    const orders = this.getOrders();
    const users = this.getUsers();
    
    const revenue = orders.reduce((sum, order) => {
      const amount = parseFloat(order.order_total?.replace('€', '') || 0);
      return sum + amount;
    }, 0);
    
    const newOrdersThisWeek = orders.filter(order => {
      const orderDate = new Date(order.created || order.order_date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return orderDate > weekAgo;
    }).length;
    
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalUsers: users.length,
      totalRevenue: revenue,
      newOrdersThisWeek,
      averageOrderValue: orders.length > 0 ? revenue / orders.length : 0
    };
  }
  
  // DATAN VIENTI/TUONTI
  exportAllData() {
    return {
      users: this.getUsers(),
      products: this.getProducts(),
      categories: this.getCategories(),
      orders: this.getOrders(),
      timestamp: new Date().toISOString()
    };
  }
  
  importData(data) {
    if (data.users) localStorage.setItem('registered_users', JSON.stringify(data.users));
    if (data.products) localStorage.setItem('admin_products', JSON.stringify(data.products));
    if (data.categories) localStorage.setItem('admin_categories', JSON.stringify(data.categories));
    if (data.orders) localStorage.setItem('customer_orders', JSON.stringify(data.orders));
    
    this.syncShopProducts();
  }
  
  // DATAN TYHJENNYS (VAIN ADMIN)
  clearAllData() {
    const keys = [
      'registered_users',
      'admin_products', 
      'admin_categories',
      'customer_orders',
      'shopping_cart',
      'shop_products',
      'wishlist'
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    this.initializeDatabase();
  }
}

// Luo globaali tietokanta-instanssi
const db = new Database();