// 🔧 Firestore Admin-tunnusten alustusscripti
// Ajettava kerran admin-tunnusten luomiseksi Firestore:en

async function setupAdminUser() {
  console.log('🔧 Alustetaan admin-tunnukset Firestore:en...');
  
  try {
    // Tarkista että Firebase on ladattu
    if (!window.firebaseDB || !window.firebaseDB.db) {
      console.error('❌ Firebase ei ole ladattu!');
      return;
    }
    
    const db = window.firebaseDB.db;
    
    // Luo admin_users kokoelma ja admin-dokumentti
    const adminData = {
      email: 'admin@loytokauppa.fi',
      password: 'admin123', // Tuotannossa käytä hashattu salasana!
      name: 'Ylläpitäjä',
      phone: '+358 40 123 4567',
      address: 'Löytökauppa Oy, Esimerkkikatu 1, 00100 Helsinki',
      role: 'admin',
      created: new Date().toISOString(),
      lastLogin: null
    };
    
    // Tallenna admin-käyttäjä
    await db.collection('admin_users').doc('admin').set(adminData);
    
    console.log('✅ Admin-tunnukset luotu onnistuneesti Firestore:en!');
    console.log('📧 Email:', adminData.email);
    console.log('🔐 Password: [piilotettu]');
    
    // Testaa haku
    const adminRef = db.collection('admin_users').doc('admin');
    const adminDoc = await adminRef.get();
    
    if (adminDoc.exists) {
      console.log('✅ Admin-tunnukset haettu onnistuneesti:');
      console.log(adminDoc.data());
    } else {
      console.error('❌ Admin-tunnuksia ei löytynyt!');
    }
    
  } catch (error) {
    console.error('❌ Virhe admin-tunnusten luomisessa:', error);
  }
}

// Aja alustus kun sivu latautuu
window.addEventListener('load', () => {
  // Odota että Firebase on valmis
  setTimeout(() => {
    setupAdminUser();
  }, 2000);
});

console.log('🔧 Admin-alustusscripti ladattu. Aja setupAdminUser() manuaalisesti tarvittaessa.');