// Firebase Database Helper - Löytökauppa
// Käyttää Firebase CDN:ää GitHub Pages -yhteensopivuutta varten

class FirebaseDB {
  constructor() {
    this.db = null;
    this.auth = null;
    this.isFirebaseReady = false;
    this.fallbackToLocalStorage = false;
  }

  // Alusta Firebase
  async init() {
    try {
      // Firebase-konfiguraatio
      const firebaseConfig = {
        apiKey: "AIzaSyANtt5pVn0rgHqttQ3KfjNkjOMncV26trI",
        authDomain: "newproject-f7ef4.firebaseapp.com",
        projectId: "newproject-f7ef4",
        storageBucket: "newproject-f7ef4.firebasestorage.app",
        messagingSenderId: "215051106784",
        appId: "1:215051106784:web:15b2fad82ed9ce89da5385",
        measurementId: "G-T5F642C6L8"
      };

      // Tarkista onko Firebase saatavilla
      if (typeof firebase !== 'undefined') {
        // Alusta Firebase
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        
        console.log('✅ Firebase Firestore alustettu (ilman persistenssiä)');
        
        // Testaa yhteyttä ennen kuin merkitään valmiiksi
        try {
          // Testaa Firestore-yhteyttä kevyellä kyselyllä
          await this.db.enableNetwork();
          console.log('✅ Firebase Firestore yhteys toimii');
          this.isFirebaseReady = true;
        } catch (firestoreError) {
          console.warn('⚠️ Firestore-yhteysvirhe, käytetään LocalStorage:', firestoreError);
          this.fallbackToLocalStorage = true;
        }
        
        console.log('✅ Firebase yhdistetty onnistuneesti');
      } else {
        throw new Error('Firebase ei ole saatavilla');
      }
    } catch (error) {
      console.warn('⚠️ Firebase-yhteysvirhe, käytetään LocalStorage:', error);
      this.fallbackToLocalStorage = true;
    }
  }

  // TUOTTEIDEN HALLINTA
  async getProducts() {
    if (this.fallbackToLocalStorage || !this.isFirebaseReady) {
      return JSON.parse(localStorage.getItem('admin_products')) || [];
    }

    try {
      const snapshot = await this.db.collection('products').get();
      const products = [];
      snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
      return products;
    } catch (error) {
      console.error('Firebase-virhe, käytetään LocalStorage:', error);
      return JSON.parse(localStorage.getItem('admin_products')) || [];
    }
  }

  async saveProduct(product) {
    if (this.fallbackToLocalStorage || !this.isFirebaseReady) {
      const products = JSON.parse(localStorage.getItem('admin_products')) || [];
      if (product.id) {
        const index = products.findIndex(p => p.id === product.id);
        if (index >= 0) {
          products[index] = product;
        } else {
          products.push(product);
        }
      } else {
        product.id = Date.now();
        products.push(product);
      }
      localStorage.setItem('admin_products', JSON.stringify(products));
      return product;
    }

    try {
      if (product.id) {
        await this.db.collection('products').doc(product.id.toString()).set(product);
      } else {
        const docRef = await this.db.collection('products').add(product);
        product.id = docRef.id;
      }
      return product;
    } catch (error) {
      console.error('Firebase-virhe:', error);
      throw error;
    }
  }

  async deleteProduct(productId) {
    if (this.fallbackToLocalStorage || !this.isFirebaseReady) {
      const products = JSON.parse(localStorage.getItem('admin_products')) || [];
      const filtered = products.filter(p => p.id !== productId);
      localStorage.setItem('admin_products', JSON.stringify(filtered));
      return;
    }

    try {
      await this.db.collection('products').doc(productId.toString()).delete();
    } catch (error) {
      console.error('Firebase-virhe:', error);
      throw error;
    }
  }

  // KATEGORIOIDEN HALLINTA
  async getCategories() {
    if (this.fallbackToLocalStorage || !this.isFirebaseReady) {
      return JSON.parse(localStorage.getItem('admin_categories')) || [
        { id: 1, name: "Elektroniikka", icon: "fas fa-microchip" },
        { id: 2, name: "Pelit", icon: "fas fa-gamepad" },
        { id: 3, name: "Audio", icon: "fas fa-headphones" },
        { id: 4, name: "Älykodit", icon: "fas fa-home" }
      ];
    }

    try {
      const snapshot = await this.db.collection('categories').get();
      const categories = [];
      snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() });
      });
      return categories.length > 0 ? categories : [
        { id: 1, name: "Elektroniikka", icon: "fas fa-microchip" },
        { id: 2, name: "Pelit", icon: "fas fa-gamepad" },
        { id: 3, name: "Audio", icon: "fas fa-headphones" },
        { id: 4, name: "Älykodit", icon: "fas fa-home" }
      ];
    } catch (error) {
      console.error('Firebase-virhe:', error);
      return [
        { id: 1, name: "Elektroniikka", icon: "fas fa-microchip" },
        { id: 2, name: "Pelit", icon: "fas fa-gamepad" },
        { id: 3, name: "Audio", icon: "fas fa-headphones" },
        { id: 4, name: "Älykodit", icon: "fas fa-home" }
      ];
    }
  }

  async saveCategory(category) {
    if (this.fallbackToLocalStorage || !this.isFirebaseReady) {
      const categories = JSON.parse(localStorage.getItem('admin_categories')) || [];
      if (category.id) {
        const index = categories.findIndex(c => c.id === category.id);
        if (index >= 0) {
          categories[index] = category;
        } else {
          categories.push(category);
        }
      } else {
        category.id = Math.max(...categories.map(c => c.id), 0) + 1;
        categories.push(category);
      }
      localStorage.setItem('admin_categories', JSON.stringify(categories));
      return category;
    }

    try {
      if (category.id) {
        await this.db.collection('categories').doc(category.id.toString()).set(category);
      } else {
        const docRef = await this.db.collection('categories').add(category);
        category.id = docRef.id;
      }
      return category;
    } catch (error) {
      console.error('Firebase-virhe:', error);
      throw error;
    }
  }

  // TILAUSTEN HALLINTA
  async saveOrder(order) {
    if (this.fallbackToLocalStorage || !this.isFirebaseReady) {
      const orders = JSON.parse(localStorage.getItem('customer_orders')) || [];
      orders.push(order);
      localStorage.setItem('customer_orders', JSON.stringify(orders));
      return order;
    }

    try {
      await this.db.collection('orders').add({
        ...order,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      return order;
    } catch (error) {
      console.error('Firebase-virhe:', error);
      // Fallback localStorage:een
      const orders = JSON.parse(localStorage.getItem('customer_orders')) || [];
      orders.push(order);
      localStorage.setItem('customer_orders', JSON.stringify(orders));
      return order;
    }
  }

  async getOrders() {
    if (this.fallbackToLocalStorage || !this.isFirebaseReady) {
      return JSON.parse(localStorage.getItem('customer_orders')) || [];
    }

    try {
      const snapshot = await this.db.collection('orders').orderBy('created_at', 'desc').get();
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      return orders;
    } catch (error) {
      console.error('Firebase-virhe:', error);
      return JSON.parse(localStorage.getItem('customer_orders')) || [];
    }
  }

  // KÄYTTÄJIEN HALLINTA (Firebasessa vain)
  async getCurrentUser() {
    if (this.fallbackToLocalStorage || !this.isFirebaseReady) {
      return JSON.parse(localStorage.getItem('current_user')) || null;
    }

    return new Promise((resolve) => {
      this.auth.onAuthStateChanged(user => {
        resolve(user);
      });
    });
  }

  async loginUser(email, password) {
    if (this.fallbackToLocalStorage || !this.isFirebaseReady) {
      // Fallback vanha 2FA-systeemi
      throw new Error('Firebase ei ole käytettävissä, käytä vanhoilla tunnuksilla');
    }

    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  async registerUser(email, password, userData) {
    if (this.fallbackToLocalStorage || !this.isFirebaseReady) {
      throw new Error('Firebase ei ole käytettävissä rekisteröitymiseen');
    }

    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      
      // Tallenna käyttäjätiedot Firestoreen
      await this.db.collection('users').doc(userCredential.user.uid).set({
        ...userData,
        email: email,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  async logoutUser() {
    if (this.fallbackToLocalStorage || !this.isFirebaseReady) {
      localStorage.removeItem('current_user');
      localStorage.removeItem('user_logged_in');
      return;
    }

    try {
      await this.auth.signOut();
    } catch (error) {
      console.error('Uloskirjautumisvirhe:', error);
    }
  }
}

// Luo globaali instanssi
window.firebaseDB = new FirebaseDB();