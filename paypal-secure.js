// PayPal Secure Integration - Client Side
// ✅ Käyttää nyt Firebase-konfiguraation PayPal-asetuksia

class PayPalSecure {
  constructor() {
    this.clientId = null; // 🔐 Haetaan Firebase-konfiguraatiosta
    this.isInitialized = false;
  }

  async init() {
    try {
      // 🔐 Odota Firebase-konfiguraation latautumista
      while (!window.paypalConfig) {
        console.log('⏳ Odotetaan Firebase PayPal-konfiguraatiota...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.clientId = window.paypalConfig.clientId;
      console.log('✅ PayPal Client ID haettu turvallisesti konfiguraatiosta');
      
      if (!this.clientId) {
        throw new Error('PayPal Client ID ei löytynyt konfiguraatiosta');
      }

      if (!window.paypal) {
        await this.loadPayPalSDK();
      }
      this.isLoaded = true;
      console.log('✅ Turvallinen PayPal-integraatio alustettu');
    } catch (error) {
      console.error('❌ PayPal-alustus epäonnistui:', error);
    }
  }

  async loadPayPalSDK() {
    return new Promise((resolve, reject) => {
      if (window.paypal) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${this.clientId}&currency=EUR&intent=capture&enable-funding=venmo,card`;
      script.onload = () => {
        console.log('✅ PayPal SDK ladattu');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('PayPal SDK:n lataus epäonnistui'));
      };
      document.head.appendChild(script);
    });
  }

  // TURVALLINEN TAPA: Luo order server-puolella
  async createSecureOrder(orderData) {
    try {
      console.log('🔒 Luodaan turvallinen PayPal-tilaus server-puolella...');
      
      // SIMULAATIO: Tuotannossa tämä menisi Cloud Function:ille
      // const response = await fetch('/api/create-paypal-order', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(orderData)
      // });
      
      // DEMO: Simuloi server-vastaus
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockServerResponse = {
        success: true,
        orderId: 'PAYPAL_ORDER_' + Date.now(),
        total: orderData.total,
        currency: orderData.currency
      };
      
      console.log('✅ Server-side PayPal order luotu:', mockServerResponse);
      return mockServerResponse;
      
    } catch (error) {
      console.error('❌ Turvallisen PayPal-tilauksen luonti epäonnistui:', error);
      return { success: false, error: error.message };
    }
  }

  // PayPal-painikkeiden renderöinti
  async renderPayPalButtons(containerId, orderData, onSuccess, onError) {
    try {
      if (!this.isLoaded) {
        await this.init();
      }

      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error('PayPal-container ei löytynyt: ' + containerId);
      }

      // Tyhjennä container
      container.innerHTML = '';

      // Luo PayPal-painikkeet
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal'
        },

        // Luo tilaus (server-side)
        createOrder: async () => {
          try {
            const serverOrder = await this.createSecureOrder(orderData);
            if (!serverOrder.success) {
              throw new Error(serverOrder.error);
            }
            
            // DEMO: Tuotannossa palautetaan server:ltä saatu PayPal order ID
            return serverOrder.orderId;
            
          } catch (error) {
            console.error('PayPal createOrder virhe:', error);
            throw error;
          }
        },

        // Viimeistele maksu
        onApprove: async (data, actions) => {
          try {
            console.log('💰 PayPal-maksu hyväksytty:', data);
            
            // TUOTANNOSSA: Lähetä capture-pyyntö server-puolelle
            // const captureResponse = await fetch('/api/capture-paypal-payment', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ orderID: data.orderID })
            // });
            
            // DEMO: Simuloi maksu capture
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const captureResult = {
              success: true,
              transactionId: 'TXN_' + Date.now(),
              amount: orderData.total,
              currency: orderData.currency,
              status: 'COMPLETED'
            };
            
            console.log('✅ PayPal-maksu captured:', captureResult);
            
            // Päivitä tilauksen tila Firestore:ssa
            if (window.modernFirebaseDB && orderData.firestoreOrderId) {
              await window.modernFirebaseDB.updateOrderStatus(
                orderData.firestoreOrderId, 
                'paid', 
                captureResult.transactionId
              );
            }
            
            // Kutsu onnistumis-callback
            if (onSuccess) {
              onSuccess({
                orderID: data.orderID,
                transactionId: captureResult.transactionId,
                amount: captureResult.amount
              });
            }
            
          } catch (error) {
            console.error('PayPal onApprove virhe:', error);
            if (onError) {
              onError(error);
            }
          }
        },

        // Virhetilanteet
        onError: (error) => {
          console.error('PayPal-virhe:', error);
          if (onError) {
            onError(error);
          }
        },

        // Peruutus
        onCancel: (data) => {
          console.log('PayPal-maksu peruutettu:', data);
          alert('Maksu peruutettu.');
        }

      }).render(container);

      console.log('✅ PayPal-painikkeet renderöity:', containerId);

    } catch (error) {
      console.error('❌ PayPal-painikkeiden renderöinti epäonnistui:', error);
      throw error;
    }
  }
}

// Globaali instanssi
window.securePayPal = new PayPalSecure();

// Backward compatibility
window.initPayPalPayment = async function(total, firestoreOrderId) {
  try {
    console.log('🔄 Käynnistetään turvallinen PayPal-maksu:', total, 'EUR');
    
    // Luo container PayPal-painikkeille
    const existingContainer = document.getElementById('secure-paypal-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    const container = document.createElement('div');
    container.id = 'secure-paypal-container';
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h3>💳 Maksa PayPal:lla</h3>
        <p>Turvallinen maksu PayPal:n kautta</p>
        <div id="paypal-buttons-secure" style="max-width: 400px; margin: 0 auto;"></div>
        <button onclick="document.getElementById('secure-paypal-container').remove()" 
                style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">
          Peruuta
        </button>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Renderöi PayPal-painikkeet
    await window.securePayPal.renderPayPalButtons('paypal-buttons-secure', {
      total: total,
      currency: 'EUR',
      firestoreOrderId: firestoreOrderId
    }, 
    // Onnistuminen
    (details) => {
      container.remove();
      
      // Tyhjennä ostoskori
      if (window.shopApp) {
        window.shopApp.cart = [];
        localStorage.removeItem('shopping_cart');
        window.shopApp.updateCartUI();
      }
      
      alert(`✅ PayPal-maksu onnistui!\n\nTransaktio ID: ${details.transactionId}\nSumma: ${details.amount} EUR\n\nTilauksen tila päivitetty!`);
      
      // Ohjaa tilausten näkymään
      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 2000);
    },
    // Virhe
    (error) => {
      container.remove();
      alert('❌ PayPal-maksu epäonnistui: ' + error.message);
    });
    
  } catch (error) {
    console.error('❌ PayPal-maksun käynnistys epäonnistui:', error);
    alert('❌ PayPal-maksun käynnistys epäonnistui: ' + error.message);
  }
};

export { PayPalSecure };