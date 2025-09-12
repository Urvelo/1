# 🛒 Ilmainen E-commerce Järjestelmä - Kehittäjän Opas

## 📋 Järjestelmäarkkitehtuuri

### 🔄 Dataflow-kaavio
```
[SIVULLA: JSON Tuotteet] 
         ↓
[Käyttäjä: Ostoskori]
         ↓
[Firebase Auth: Kirjautuminen]
         ↓
[PayPal SDK: Maksu]
         ↓
[Firestore: Tallenna tilaus]
         ↓
[EmailJS: Lähetä tilausinfo kehittäjälle]
```

## 🎯 Komponenttien roolit

### 1️⃣ **Tuotteet & Kuvat - CLIENT-SIDE**
```javascript
// ✅ TÄMÄ: JSON-taulukko sivulla
const products = [
  {
    id: 1,
    name: "iPhone 15",
    price: 999.00,
    image: "images/iphone15.jpg", // GitHub Pages / CDN
    category: "electronics"
  }
];

// ❌ EI TÄTÄ: Firestore tuotteet (kuluttaa free-tieriä)
```

**Edut:**
- ⚡ Nopea lataus (ei API-kutsuja)
- 💰 Säästää Firestore-tilaa
- 🔧 Helppo päivittää (muokkaa vain JS-tiedostoa)

### 2️⃣ **Firestore - VAIN KRIITTISET TIEDOT**
```javascript
// ✅ TALLENNA: Tilaukset ja käyttäjät
firestore.collection('orders').add({
  userId: auth.currentUser.uid,
  products: [
    { id: 1, name: "iPhone 15", qty: 1, price: 999.00 }
  ],
  total: 999.00,
  status: "pending",
  createdAt: new Date(),
  customerInfo: {
    name: "Matti Meikäläinen",
    email: "matti@example.com",
    address: "Katuosoite 123, Helsinki"
  }
});

// ❌ EI TALLENNETA: Tuotteiden tietoja, kuvia, lokitietoja
```

**Free Tier rajat:**
- 📊 50,000 luku/kirjoitus per kuukausi
- 💾 1GB tallennustila
- 🔥 Rajoitettu samtuneisuus

### 3️⃣ **PayPal-integraatio**
```javascript
// ✅ CLIENT-SIDE: Julkinen Client ID
const PAYPAL_CLIENT_ID = "sb-xyz123"; // Sandbox

// ✅ SERVER-SIDE: Secret (Cloud Function tai backend)
const PAYPAL_SECRET = "EON-xxx"; // EI CLIENT-KOODISSA!

// Maksuvirta:
// 1. Client luo PayPal-tilauksen
// 2. Käyttäjä maksaa PayPal:ssa
// 3. PayPal palauttaa transaction_id
// 4. Päivitä Firestore: status = "paid"
```

### 4️⃣ **Sähköposti-notifikaatiot**
```javascript
// ✅ EmailJS - Ilmainen 200 emailia/kk
emailjs.send('service_id', 'template_id', {
  customer_name: "Matti Meikäläinen",
  order_products: "iPhone 15 (1kpl)",
  order_total: "999.00 €",
  customer_email: "matti@example.com",
  customer_address: "Katuosoite 123, Helsinki"
});
```

## 📊 Resurssien käyttö (Free Tier)

| Toiminto | Firestore kulutus | Optimointi |
|----------|------------------|------------|
| Tuotteiden näyttö | 0 lukua | JSON client-side |
| Rekisteröinti | 1 kirjoitus | Firebase Auth + user doc |
| Kirjautuminen | 0-1 lukua | Cache localStorage |
| Tilaus | 1 kirjoitus | Vain kriittiset tiedot |
| Tilauksen päivitys | 1 kirjoitus | Status-muutos |
| Admin-hallinta | 1-10 lukua | Batch-haut |

**Arvio kuukausittain:**
- 100 käyttäjää = ~500 operaatiota
- Free tier: 50,000 operaatiota ✅

## 🔒 Turvallisuus

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Käyttäjät näkevät vain omat tilauksensa
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    // Tuotteet ovat julkisia (jos tallennetaan)
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

### Tietoturva Checklist
- ✅ Salasanat: Firebase Auth hoitaa
- ✅ Luottokortit: PayPal hoitaa
- ✅ Käyttäjätiedot: Firestore Rules
- ✅ Admin-oikeudet: UID-pohjainen tarkistus
- ❌ Ei talleteta: Maksutietoja client-puolelle

## 🚀 Käyttöönotto-ohje

### 1. Firebase Setup
```bash
# 1. Luo Firebase-projekti (ilmainen)
# 2. Ota käyttöön Authentication & Firestore
# 3. Kopioi config-tiedot
```

### 2. PayPal Setup
```bash
# 1. Luo PayPal Developer -tili
# 2. Luo Sandbox-app
# 3. Kopioi Client ID (julkinen)
# 4. Pidä Secret turvassa (server-side)
```

### 3. EmailJS Setup
```bash
# 1. Luo EmailJS-tili
# 2. Yhdistä Gmail-tili
# 3. Luo email-template
# 4. Kopioi Service ID & Template ID
```

### 4. Deployment
```bash
# GitHub Pages (ilmainen hosting)
git add .
git commit -m "Deploy e-commerce"
git push origin main
# Ota käyttöön GitHub Pages repositoryn asetuksista
```

## 📈 Skaalaus & Kustannukset

### Free Tier rajat ylittyessä:
- **Firestore**: ~$0.18 per 100k operaatio
- **EmailJS**: $15/kk unlimited emails
- **PayPal**: 2.9% + $0.30 per transaktio
- **Hosting**: GitHub Pages ilmainen

### Optimointi-vinkit:
1. **Cache aggressiivisesti** localStorage:ssa
2. **Batch-operaatiot** Firestore:ssa
3. **Lazy loading** kuville
4. **Minify & gzip** JavaScript
5. **CDN** staattisille resursseille

## 💡 Kehittäjän muistilista

### ✅ DO (Tee näin):
- Tallenna Firestore:ssa vain tilaukset & käyttäjät
- Pidä tuotteet JSON-taulukossa
- Käytä PayPal:n omaa maksurajapintaa
- Lähetä tilausinfo sähköpostilla
- Cache käyttäjätiedot localStorage:ssa

### ❌ DON'T (Älä tee):
- Älä tallenna tuotteita Firestore:en
- Älä tallenna kuvia tietokantaan
- Älä käsittele luottokortitietoja itse
- Älä unohda Firestore Security Rules:ja
- Älä laita PayPal Secret:ia client-koodiin

## 🔧 Troubleshooting

### Yleisimmät ongelmat:
1. **Firestore permission denied** → Tarkista Security Rules
2. **PayPal sandbox ei toimi** → Käytä oikeaa Client ID:tä
3. **EmailJS ei lähetä** → Tarkista template & service ID
4. **Firebase quota ylittyy** → Optimoi operaatioita

### Debug-työkalut:
```javascript
// Firebase Debug
console.log('Firebase user:', firebase.auth().currentUser);
console.log('Firestore rules:', firestore.settings());

// PayPal Debug  
console.log('PayPal loaded:', !!window.paypal);

// EmailJS Debug
console.log('EmailJS service:', emailjs);
```

## 📊 Analytics & Seuranta

### Mittarit joita kannattaa seurata:
- Firestore operaatioiden määrä
- PayPal-konversio (maksut/vierailut)
- Sähköpostien lähetysmäärä
- Sivuston latausnopeus

### Ilmaiset analytiikkatyökalut:
- Google Analytics 4
- Firebase Analytics
- PayPal Analytics
- GitHub Pages traffic

---

**🎯 Tulos: Täysin toimiva e-commerce ilman kuukausimaksuja, turvallisesti ja skaalautuvasti!**