// Testaa kirjautumista ilman admin-oikeuksia
console.log('🧪 Testataan kirjautumista...');

// Tyhjennä localStorage
localStorage.clear();
console.log('🧹 localStorage tyhjennetty');

// Simuloi normaali käyttäjä
const normalUser = {
  id: 'test123',
  name: 'Testi Käyttäjä',
  email: 'testi@test.fi',
  profile: {
    avatar: 'https://ui-avatars.com/api/?name=Testi%20Käyttäjä&background=6366f1&color=fff&size=150',
    phone: '',
    address: ''
  },
  loginTime: new Date().toISOString()
};

localStorage.setItem('currentUser', JSON.stringify(normalUser));
console.log('👤 Tallennettu normaali käyttäjä:', normalUser);
console.log('📦 localStorage currentUser:', localStorage.getItem('currentUser'));

// Tarkista onko isAdmin-kenttä
const saved = JSON.parse(localStorage.getItem('currentUser'));
console.log('🔍 isAdmin:', saved.isAdmin);
console.log('🔍 isAdmin type:', typeof saved.isAdmin);
