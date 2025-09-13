# 🔐 PayPal Turvallisuusopas

## ⚠️ ONGELMA: Kovakoodatut API-avaimet

PayPal Client ID:t oli kovakoodattuna koodissa, mikä on **VAKAVA TURVALLISUUSRISKI**.

## ✅ RATKAISU: PayPal Configuration Manager

### 🏗️ Arkkitehtuuri

1. **paypal-config-secure.js** - Turvallinen config manager
2. **firebase-config.js** - Keskitetty konfiguraatio  
3. **Ympäristön tunnistus** - Kehitys vs. Tuotanto

### 🛠️ Kehitysympäristö

```javascript
// Console-komento Client ID:n asettamiseen:
setPayPalClientId("YOUR_SANDBOX_CLIENT_ID_HERE");
```

**Tuetut ympäristöt:**
- `localhost`
- `127.0.0.1` 
- `*.github.dev`
- `*.codespaces`

### 🏭 Tuotantoympäristö

**Tapa 1: Palvelin-API** (Suositeltu)
```javascript
// GET /api/paypal-config
{
  "clientId": "PRODUCTION_CLIENT_ID"
}
```

**Tapa 2: Ympäristömuuttuja**
```javascript
window.PAYPAL_CLIENT_ID = "PRODUCTION_CLIENT_ID";
```

### 🔧 Toiminnot

#### **Automaattinen ympäristön tunnistus:**
- 🛠️ **Kehitys**: Käyttää sandbox Client ID:tä
- 🏭 **Tuotanto**: Hakee Client ID:n turvallisesti

#### **Fallback-strategia:**
1. 🌐 **API-pyyntö** (tuotanto)
2. 📦 **sessionStorage** (kehitys)
3. ⚠️ **Oletusarvo** (vain kehitys)

#### **Error handling:**
- ❌ **Konfiguraatiovirhe** → Näyttää käyttäjälle virheilmoituksen
- 🚫 **Ei Client ID** → PayPal-maksut piilotetaan
- 🔒 **Tuotanto-suoja** → Ei salli kovakoodauksia

### 🎯 Käyttö

#### **Kehittäjälle:**
```bash
# 1. Avaa browser console
# 2. Aseta sandbox Client ID:
setPayPalClientId("sb-YOUR_SANDBOX_CLIENT_ID");

# 3. Lataa sivu uudelleen
location.reload();
```

#### **Tuotantoon siirtyessä:**
1. **Poista** kaikki sandbox Client ID:t koodista ✅
2. **Aseta** palvelin palauttamaan Client ID API:sta ✅  
3. **Varmista** että `sandbox: false` tuotannossa ⚠️

### 🛡️ Turvallisuushyödyt

✅ **Ei kovakoodattuja avaimia** koodissa  
✅ **Ympäristökohtainen** konfiguraatio  
✅ **Automaattinen fallback** virhetilanteissa  
✅ **Kehittäjäystävällinen** console-hallinta  
✅ **Tuotanto-suoja** vahingossa tapahtuvaa kovakoodausta vastaan  

### 🚨 Muistutukset

- ⚠️ **ÄLLÄKOSKAAN** laita tuotannon Client ID:tä git-repositorioon
- 🔒 **AINA** käytä palvelin-puolen API:a tuotannossa  
- 🛠️ **TESTAA** PayPal-integraatio sekä sandbox- että tuotanto-ympäristössä
- 📝 **DOKUMENTOI** Client ID:n hallinta tiimille

---

## 📞 Ongelmatilanteissa

1. **PayPal-maksut eivät toimi** → Tarkista browser console
2. **"Client ID puuttuu"** → Käytä `setPayPalClientId()` kehityksessä  
3. **Tuotanto-ongelmat** → Varmista API palauttaa Client ID:n
4. **Turvallisuusauditit** → Tarkista ettei kovakoodattuja avaimia