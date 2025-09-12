// Firebase Firestore - Moderni v11 versio
import { 
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

class ModernFirebaseDB {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    try {
      if (window.firebaseDB) {
        this.db = window.firebaseDB.db;
        console.log('✅ ModernFirebaseDB alustettu');
      } else {
        setTimeout(() => this.init(), 1000);
      }
    } catch (error) {
      console.error('❌ Virhe Firestore alustuksessa:', error);
    }
  }

  // TILAUSTEN HALLINTA
  async createOrder(orderData) {
    try {
      console.log('📦 Luodaan tilaus:', orderData);
      
      const order = {
        userId: orderData.userId,
        customerInfo: {
          name: orderData.customerInfo.name,
          email: orderData.customerInfo.email,
          phone: orderData.customerInfo.phone,
          address: orderData.customerInfo.address
        },
        products: orderData.products,
        total: orderData.total,
        currency: orderData.currency || 'EUR',
        status: 'pending',
        paymentMethod: orderData.paymentMethod || 'paypal',
        paymentId: orderData.paymentId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(this.db, 'orders'), order);
      console.log('✅ Tilaus luotu ID:llä:', docRef.id);
      
      return { success: true, orderId: docRef.id };
    } catch (error) {
      console.error('❌ Tilauksen luonti epäonnistui:', error);
      return { success: false, error: error.message };
    }
  }

  async updateOrderStatus(orderId, status, paymentId = null) {
    try {
      const updateData = {
        status: status,
        updatedAt: new Date().toISOString()
      };
      
      if (paymentId) {
        updateData.paymentId = paymentId;
      }
      
      await updateDoc(doc(this.db, 'orders', orderId), updateData);
      console.log('✅ Tilauksen tila päivitetty:', orderId, status);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Tilauksen päivitys epäonnistui:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserOrders(userId) {
    try {
      const q = query(
        collection(this.db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('✅ Käyttäjän tilaukset haettu:', orders.length);
      return { success: true, orders };
    } catch (error) {
      console.error('❌ Tilausten haku epäonnistui:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllOrders() {
    try {
      const q = query(
        collection(this.db, 'orders'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('✅ Kaikki tilaukset haettu:', orders.length);
      return { success: true, orders };
    } catch (error) {
      console.error('❌ Tilausten haku epäonnistui:', error);
      return { success: false, error: error.message };
    }
  }

  // KÄYTTÄJÄTIETOJEN HALLINTA
  async getUserData(userId) {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      
      if (userDoc.exists()) {
        return { success: true, user: userDoc.data() };
      } else {
        return { success: false, error: 'Käyttäjää ei löytynyt' };
      }
    } catch (error) {
      console.error('❌ Käyttäjätietojen haku epäonnistui:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUserData(userId, userData) {
    try {
      await updateDoc(doc(this.db, 'users', userId), {
        ...userData,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Käyttäjätiedot päivitetty:', userId);
      return { success: true };
    } catch (error) {
      console.error('❌ Käyttäjätietojen päivitys epäonnistui:', error);
      return { success: false, error: error.message };
    }
  }

  // TUOTTEIDEN HALLINTA (ADMIN)
  async getProducts() {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'products'));
      const products = [];
      
      querySnapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('✅ Tuotteet haettu:', products.length);
      return { success: true, products };
    } catch (error) {
      console.error('❌ Tuotteiden haku epäonnistui:', error);
      // Fallback: käytä localStorage-tuotteita
      const localProducts = JSON.parse(localStorage.getItem('admin_products')) || [];
      return { success: true, products: localProducts, source: 'localStorage' };
    }
  }

  async saveProduct(productData) {
    try {
      if (productData.id) {
        // Päivitä olemassa oleva
        await updateDoc(doc(this.db, 'products', productData.id), {
          ...productData,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Tuote päivitetty:', productData.id);
      } else {
        // Luo uusi
        const docRef = await addDoc(collection(this.db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Tuote luotu ID:llä:', docRef.id);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Tuotteen tallennus epäonnistui:', error);
      return { success: false, error: error.message };
    }
  }

  // REALTIME-KUUNTELIJAT
  listenToUserOrders(userId, callback) {
    try {
      const q = query(
        collection(this.db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, (querySnapshot) => {
        const orders = [];
        querySnapshot.forEach((doc) => {
          orders.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(orders);
      });
    } catch (error) {
      console.error('❌ Realtime-kuuntelija epäonnistui:', error);
      return null;
    }
  }

  listenToAllOrders(callback) {
    try {
      const q = query(
        collection(this.db, 'orders'),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, (querySnapshot) => {
        const orders = [];
        querySnapshot.forEach((doc) => {
          orders.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(orders);
      });
    } catch (error) {
      console.error('❌ Realtime-kuuntelija epäonnistui:', error);
      return null;
    }
  }
}

// Globaali instanssi
window.modernFirebaseDB = new ModernFirebaseDB();

export { ModernFirebaseDB };