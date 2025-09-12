// PayPal Configuration - Löytökauppa
window.PAYPAL_CONFIG = {
  CLIENT_ID: 'AegNS5T0gWjYPjNcnWxp_eI3s7tZYZ3in7DDndCf8m8klAN1eUlyauwFoGw72036gKGvL5sI_ul2-uP8',
  CURRENCY: 'EUR',
  INTENT: 'capture',
  ENABLE_FUNDING: 'venmo,card',
  DISABLE_FUNDING: 'credit'
};

// PayPal SDK lataus
function loadPayPalSDK() {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${window.PAYPAL_CONFIG.CLIENT_ID}&currency=${window.PAYPAL_CONFIG.CURRENCY}&intent=${window.PAYPAL_CONFIG.INTENT}&enable-funding=${window.PAYPAL_CONFIG.ENABLE_FUNDING}&disable-funding=${window.PAYPAL_CONFIG.DISABLE_FUNDING}`;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error('PayPal SDK lataus epäonnistui'));
    document.head.appendChild(script);
  });
}

// PayPal maksu-käsittely
async function initPayPalPayment(amount, items, onSuccess, onError) {
  try {
    const paypal = await loadPayPalSDK();
    
    paypal.Buttons({
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount.toFixed(2),
              currency_code: window.PAYPAL_CONFIG.CURRENCY
            },
            items: items.map(item => ({
              name: item.name,
              unit_amount: {
                value: item.price.toFixed(2),
                currency_code: window.PAYPAL_CONFIG.CURRENCY
              },
              quantity: item.quantity.toString()
            }))
          }]
        });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
          console.log('PayPal maksu onnistui:', details);
          if (onSuccess) onSuccess(details);
        });
      },
      onError: function(err) {
        console.error('PayPal virhe:', err);
        if (onError) onError(err);
      },
      onCancel: function(data) {
        console.log('PayPal maksu peruutettu:', data);
      }
    }).render('#paypal-button-container');
    
  } catch (error) {
    console.error('PayPal alustus epäonnistui:', error);
    if (onError) onError(error);
  }
}

console.log('✅ PayPal konfiguraatio ladattu:', window.PAYPAL_CONFIG.CLIENT_ID);