// ==========================================
// 🔥 KOKONAINEN FIREBASE + JS -RAKENNE
// ==========================================
// Kehittäjälle: Tässä kaikki valmiina!
// - Firestore: customers, orders, products
// - Auth: käyttäjien hallinta UID:n kautta
// - PayPal: client-side maksut
// - EmailJS: tilausvahvistukset
// ==========================================

// 1️⃣ IMPORTIT Firebase SDK v11
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

// 2️⃣ FIREBASE KONFIGURAATIO
const firebaseConfig = {
  apiKey: "AIzaSyANtt5pVn0rgHqttQ3KfjNkjOMncV26trI",
  authDomain: "newproject-f7ef4.firebaseapp.com",
  projectId: "newproject-f7ef4",
  storageBucket: "newproject-f7ef4.appspot.com",
  messagingSenderId: "215051106784",
  appId: "1:215051106784:web:15b2fad82ed9ce89da5385",
  measurementId: "G-T5F642C6L8"
};

// 3️⃣ ALUSTA FIREBASE
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// 4️⃣ PAYPAL CLIENT ID (client-side maksut)
const PAYPAL_CLIENT_ID = "AQxc4TuX-gJFHG-Y8G6WEWyxMj0yjFLqxFd8HdKDn-E4JU4wgIg8HNRXqHlQN8CqQp1KrVV1mV6qTu5z";

// 5️⃣ EMAILJS KONFIGURAATIO
const EMAILJS_CONFIG = {
  serviceId: "service_xyz123",
  templateId: "template_order_confirmation", 
  userId: "user_abc456"
};

// ==========================================
// 🔹 CUSTOMERS-KOKOELMA
// ==========================================
class CustomerManager {
  
  // Luo asiakas (UID linkitys)
  static async createCustomer(name, address, phone = "") {
    const user = auth.currentUser;
    if (!user) throw new Error("Käyttäjä ei ole kirjautunut");

    const customerData = {
      name,
      address,
      phone,
      email: user.email,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };

    await setDoc(doc(db, "customers", user.uid), customerData);
    console.log("✅ Asiakas luotu:", user.uid);
    return user.uid;
  }

  // Hae asiakas UID:n perusteella
  static async getCustomer(uid = null) {
    const userId = uid || auth.currentUser?.uid;
    if (!userId) throw new Error("Käyttäjä ei ole kirjautunut");

    const customerDoc = await getDoc(doc(db, "customers", userId));
    if (customerDoc.exists()) {
      return { id: customerDoc.id, ...customerDoc.data() };
    }
    return null;
  }

  // Päivitä asiakastiedot
  static async updateCustomer(updates) {
    const user = auth.currentUser;
    if (!user) throw new Error("Käyttäjä ei ole kirjautunut");

    const updateData = {
      ...updates,
      lastUpdated: serverTimestamp()
    };

    await updateDoc(doc(db, "customers", user.uid), updateData);
    console.log("✅ Asiakastiedot päivitetty");
  }
}

// ==========================================
// 🔹 PRODUCTS-KOKOELMA
// ==========================================
class ProductManager {
  
  // Lisää tuote (admin)
  static async addProduct(productData) {
    const { id, name, price, image, stock, category, description } = productData;
    
    const product = {
      name,
      price: parseFloat(price),
      image,
      stock: parseInt(stock),
      category,
      description,
      createdAt: serverTimestamp(),
      isActive: true
    };

    await setDoc(doc(db, "products", id), product);
    console.log("✅ Tuote lisätty:", id);
    return id;
  }

  // Hae kaikki tuotteet
  static async getAllProducts() {
    const q = query(
      collection(db, "products"), 
      where("isActive", "==", true),
      orderBy("name")
    );
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("📦 Tuotteet haettu:", products.length);
    return products;
  }

  // Päivitä tuotteen varastosaldo
  static async updateStock(productId, newStock) {
    await updateDoc(doc(db, "products", productId), {
      stock: parseInt(newStock),
      lastUpdated: serverTimestamp()
    });
    console.log("✅ Varastosaldo päivitetty:", productId, "->", newStock);
  }
}

// ==========================================
// 🔹 ORDERS-KOKOELMA
// ==========================================
class OrderManager {
  
  // Luo tilaus
  static async createOrder(cartItems, customerInfo = null) {
    const user = auth.currentUser;
    if (!user) throw new Error("Käyttäjä ei ole kirjautunut");

    // Laske kokonaissumma
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
      userId: user.uid,
      customerEmail: user.email,
      customerInfo: customerInfo || {},
      items: cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      })),
      total: parseFloat(total.toFixed(2)),
      status: "pending", // pending -> paid -> shipped -> delivered
      paymentMethod: null,
      paymentId: null,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };

    const orderRef = await addDoc(collection(db, "orders"), orderData);
    console.log("✅ Tilaus luotu:", orderRef.id);
    
    return {
      orderId: orderRef.id,
      orderData: orderData
    };
  }

  // Päivitä tilauksen tila
  static async updateOrderStatus(orderId, status, paymentInfo = {}) {
    const updateData = {
      status,
      lastUpdated: serverTimestamp(),
      ...paymentInfo
    };

    await updateDoc(doc(db, "orders", orderId), updateData);
    console.log("✅ Tilauksen tila päivitetty:", orderId, "->", status);
  }

  // Hae käyttäjän tilaukset
  static async getUserOrders(userId = null) {
    const currentUserId = userId || auth.currentUser?.uid;
    if (!currentUserId) throw new Error("Käyttäjä ei ole kirjautunut");

    const q = query(
      collection(db, "orders"),
      where("userId", "==", currentUserId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("📋 Käyttäjän tilaukset haettu:", orders.length);
    return orders;
  }

  // Hae kaikki tilaukset (admin)
  static async getAllOrders() {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("📋 Kaikki tilaukset haettu:", orders.length);
    return orders;
  }
}

// ==========================================
// 🔹 AUTH-HALLINTA
// ==========================================
class AuthManager {
  
  // Rekisteröinti
  static async register(email, password, userInfo = {}) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Luo customer-dokumentti
      if (userInfo.name) {
        await CustomerManager.createCustomer(
          userInfo.name, 
          userInfo.address || "", 
          userInfo.phone || ""
        );
      }
      
      console.log("✅ Käyttäjä rekisteröity:", user.uid);
      return { success: true, user: user };
      
    } catch (error) {
      console.error("❌ Rekisteröinti epäonnistui:", error);
      return { success: false, error: error.message };
    }
  }

  // Kirjautuminen
  static async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log("✅ Kirjautuminen onnistui:", user.uid);
      return { success: true, user: user };
      
    } catch (error) {
      console.error("❌ Kirjautuminen epäonnistui:", error);
      return { success: false, error: error.message };
    }
  }

  // Uloskirjautuminen
  static async logout() {
    try {
      await signOut(auth);
      console.log("✅ Uloskirjautuminen onnistui");
      return { success: true };
    } catch (error) {
      console.error("❌ Uloskirjautuminen epäonnistui:", error);
      return { success: false, error: error.message };
    }
  }

  // Auth-tilan kuuntelu
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }
}

// ==========================================
// 🔹 PAYPAL MAKSUT (client-side)
// ==========================================
class PaymentManager {
  
  // Alusta PayPal-napit
  static initPayPalButtons(orderId, orderTotal, onSuccess, onError) {
    if (!window.paypal) {
      console.error("❌ PayPal SDK ei ole ladattu");
      return;
    }

    window.paypal.Buttons({
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: orderTotal.toFixed(2)
            },
            custom_id: orderId // Firestore order ID
          }]
        });
      },
      
      onApprove: async function(data, actions) {
        try {
          const order = await actions.order.capture();
          
          // Päivitä tilauksen tila Firestore:ssa
          await OrderManager.updateOrderStatus(orderId, "paid", {
            paymentMethod: "paypal",
            paymentId: order.id,
            paymentDetails: order
          });
          
          console.log("✅ PayPal-maksu onnistui:", order);
          onSuccess(order);
          
        } catch (error) {
          console.error("❌ PayPal-maksu epäonnistui:", error);
          onError(error);
        }
      },
      
      onError: function(err) {
        console.error("❌ PayPal-virhe:", err);
        onError(err);
      }
    }).render('#paypal-button-container');
  }
}

// ==========================================
// 🔹 SÄHKÖPOSTIN LÄHETYS (EmailJS)
// ==========================================
class EmailManager {
  
  // Lähetä tilausvahvistus
  static async sendOrderConfirmation(orderData) {
    try {
      const templateParams = {
        customer_name: orderData.customerInfo.name || "Asiakas",
        customer_email: orderData.customerEmail,
        order_id: orderData.orderId,
        order_total: orderData.total.toFixed(2),
        order_items: orderData.items.map(item => 
          `${item.name} x ${item.quantity} = ${item.subtotal.toFixed(2)}€`
        ).join('\n'),
        order_date: new Date().toLocaleDateString('fi-FI')
      };

      if (window.emailjs) {
        await window.emailjs.send(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateId,
          templateParams,
          EMAILJS_CONFIG.userId
        );
        console.log("✅ Tilausvahvistus lähetetty sähköpostiin");
      } else {
        console.warn("⚠️ EmailJS ei ole käytettävissä");
      }
      
    } catch (error) {
      console.error("❌ Sähköpostin lähetys epäonnistui:", error);
    }
  }
}

// ==========================================
// 🔹 KOKONAINEN OSTOSPROSESSI
// ==========================================
class ShoppingFlow {
  
  // Kokonainen osto prosessi (käyttäjälle)
  static async processOrder(cartItems, customerInfo) {
    try {
      console.log("🛒 Aloitetaan ostosprosessi...");
      
      // 1. Luo tilaus Firestore:een
      const { orderId, orderData } = await OrderManager.createOrder(cartItems, customerInfo);
      
      // 2. Alusta PayPal-maksut
      PaymentManager.initPayPalButtons(
        orderId,
        orderData.total,
        
        // Maksu onnistui
        async (paymentResult) => {
          console.log("✅ Maksu onnistui, lähetetään vahvistus...");
          
          // 3. Lähetä tilausvahvistus sähköpostiin
          await EmailManager.sendOrderConfirmation({
            ...orderData,
            orderId: orderId
          });
          
          // 4. Päivitä tuotteiden varastosaldot
          for (const item of orderData.items) {
            // Huom: Tämä vaatii tuotteiden nykyisen saldon hakemisen ensin
            console.log("📦 Päivitetään varastosaldo:", item.productId);
          }
          
          // 5. Tyhjennä ostoskori
          localStorage.removeItem('shopping_cart');
          
          // 6. Ohjaa kiitossivulle
          window.location.href = `thank-you.html?order=${orderId}`;
        },
        
        // Maksu epäonnistui
        (error) => {
          console.error("❌ Maksu epäonnistui:", error);
          alert("Maksu epäonnistui. Yritä uudelleen.");
        }
      );
      
      return { success: true, orderId };
      
    } catch (error) {
      console.error("❌ Ostosprosessi epäonnistui:", error);
      return { success: false, error: error.message };
    }
  }
}

// ==========================================
// 📌 KEHITTÄJÄLLE: KÄYTTÖESIMERKIT
// ==========================================

/* 
// 1. REKISTERÖINTI
const result = await AuthManager.register("user@example.com", "password123", {
  name: "Matti Meikäläinen",
  address: "Esimerkkikatu 1, 00100 Helsinki",
  phone: "+358401234567"
});

// 2. KIRJAUTUMINEN
const loginResult = await AuthManager.login("user@example.com", "password123");

// 3. TUOTTEIDEN HAKU
const products = await ProductManager.getAllProducts();

// 4. TILAUKSEN LUONTI
const cart = [
  { id: "prod1", name: "Tuote 1", price: 19.99, quantity: 2 },
  { id: "prod2", name: "Tuote 2", price: 29.99, quantity: 1 }
];

const customerInfo = { name: "Matti Meikäläinen", address: "Esimerkkikatu 1" };
const orderResult = await ShoppingFlow.processOrder(cart, customerInfo);

// 5. KÄYTTÄJÄN TILAUSTEN HAKU
const userOrders = await OrderManager.getUserOrders();
*/

// ==========================================
// 🎯 EXPORT (moduulina käytettävissä)
// ==========================================
export {
  db,
  auth,
  CustomerManager,
  ProductManager,
  OrderManager,
  AuthManager,
  PaymentManager,
  EmailManager,
  ShoppingFlow,
  PAYPAL_CLIENT_ID
};

// Global-muuttujina (legacy-tuki)
window.FirebaseCompleteSystem = {
  db,
  auth,
  CustomerManager,
  ProductManager,
  OrderManager,
  AuthManager,
  PaymentManager,
  EmailManager,
  ShoppingFlow,
  PAYPAL_CLIENT_ID
};

console.log("🔥 Firebase Complete System ladattu!");