// PayPal Auto-Setup Script
// Asettaa automaattisesti PayPal Sandbox Client ID:n

(function() {
    console.log('🔧 PayPal Auto-Setup käynnistyy...');
    
    // Toimiva PayPal Sandbox Client ID (test-tilille)
    const SANDBOX_CLIENT_ID = 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';
    
    // Aseta sessionStorage:een
    try {
        sessionStorage.setItem('paypal_sandbox_client_id', SANDBOX_CLIENT_ID);
        localStorage.setItem('paypal_setup_done', 'true');
        
        console.log('✅ PayPal Client ID asetettu automaattisesti');
        console.log('🔧 Client ID:', SANDBOX_CLIENT_ID.substring(0, 20) + '...');
        
        // Aseta myös window.paypalConfig jos sitä ei ole
        if (!window.paypalConfig) {
            window.paypalConfig = {
                clientId: SANDBOX_CLIENT_ID,
                currency: 'EUR',
                intent: 'capture',
                environment: 'sandbox'
            };
            console.log('✅ window.paypalConfig luotu');
        }
        
    } catch (error) {
        console.error('❌ PayPal Auto-Setup epäonnistui:', error);
    }
})();