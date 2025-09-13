// 🔐 PayPal Configuration Manager (Turvallinen)
// Tämä tiedosto hallitsee PayPal Client ID:n turvallisesti

class PayPalConfigManager {
  constructor() {
    this.clientId = null;
    this.isProduction = false;
    this.init();
  }

  init() {
    // Tunnista ympäristö
    this.isProduction = !this.isDevelopment();
    
    console.log(`🔧 PayPal ympäristö: ${this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    
    if (this.isProduction) {
      this.loadProductionConfig();
    } else {
      this.loadDevelopmentConfig();
    }
  }

  isDevelopment() {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname.includes('github.dev') ||
           hostname.includes('codespaces');
  }

  async loadProductionConfig() {
    try {
      // TUOTANNOSSA: Client ID tulee palvelimelta tai ympäristömuuttujasta
      console.log('🏭 Ladataan tuotanto PayPal-konfiguraatio');
      
      // Tapa 1: Hae palvelimelta
      const response = await fetch('/api/paypal-config');
      if (response.ok) {
        const config = await response.json();
        this.clientId = config.clientId;
        return;
      }
      
      // Tapa 2: Ympäristömuuttuja (jos asetettu)
      if (window.PAYPAL_CLIENT_ID) {
        this.clientId = window.PAYPAL_CLIENT_ID;
        return;
      }
      
      throw new Error('PayPal Client ID ei saatavilla tuotannossa');
      
    } catch (error) {
      console.error('❌ PayPal tuotanto-config virhe:', error);
      // Fallback: näytä virheilmoitus käyttäjälle
      this.showConfigError();
    }
  }

  loadDevelopmentConfig() {
    console.log('🛠️ Ladataan kehitys PayPal-konfiguraatio');
    
    // Kehityksessä: käytä sandbox Client ID:tä
    this.clientId = this.getSandboxClientId();
    
    if (this.clientId) {
      console.log('✅ PayPal sandbox Client ID ladattu');
      window.paypalConfig = {
        clientId: this.clientId,
        currency: 'EUR',
        intent: 'capture',
        sandbox: true
      };
    } else {
      console.error('❌ PayPal sandbox Client ID puuttuu');
    }
  }

  getSandboxClientId() {
    // Kokeile sessionStorage (kehittäjä voi asettaa)
    const storedId = sessionStorage.getItem('paypal_sandbox_client_id');
    if (storedId) {
      console.log('📦 Käytetään sessionStorage PayPal Client ID');
      return storedId;
    }
    
    // Fallback: oletusarvo (vain kehitykseen!)
    console.warn('⚠️ Käytetään oletuksena PayPal sandbox Client ID');
    return "AfB87g-R1Y6r8j0IhP7Rk8NWNSIlwvjhJoFeO1_n3U0JZm-_s4FjDMxz8qG5ElIqEiAInOJo7kX0XqOq";
  }

  showConfigError() {
    // Näytä käyttäjälle että PayPal ei ole käytettävissä
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: #ff6b6b; color: white; padding: 1rem;
      border-radius: 8px; max-width: 300px; font-size: 14px;
    `;
    errorDiv.innerHTML = `
      <strong>⚠️ PayPal ei käytettävissä</strong><br>
      PayPal-maksut eivät ole tällä hetkellä käytettävissä. 
      Ota yhteyttä ylläpitoon.
    `;
    
    document.body.appendChild(errorDiv);
    
    // Poista viesti 10 sekunnin kuluttua
    setTimeout(() => errorDiv.remove(), 10000);
  }

  // Julkinen metodi Client ID:n hakemiseen
  getClientId() {
    return this.clientId;
  }

  // Kehittäjän apumetodi Client ID:n asettamiseen
  setDevelopmentClientId(clientId) {
    if (this.isDevelopment()) {
      sessionStorage.setItem('paypal_sandbox_client_id', clientId);
      this.clientId = clientId;
      console.log('✅ PayPal sandbox Client ID päivitetty');
      return true;
    } else {
      console.error('❌ Client ID:n asettaminen ei sallittu tuotannossa');
      return false;
    }
  }
}

// Luo globaali instanssi
window.paypalConfigManager = new PayPalConfigManager();

// Kehittäjän apufunktio (consoleen)
window.setPayPalClientId = (clientId) => {
  return window.paypalConfigManager.setDevelopmentClientId(clientId);
};

console.log('🔐 PayPal Configuration Manager ladattu');