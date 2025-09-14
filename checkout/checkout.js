// checkout.js
// Handles checkout page logic: cart rendering, order summary, validation, mock processing (will integrate PayPal later)

(function(){
  const CART_KEY = 'shopping_cart';

  function getCart(){
    // migrate legacy key 'cart' if exists
    const legacy = localStorage.getItem('cart');
    const modern = localStorage.getItem(CART_KEY);
    if(legacy && !modern){
      localStorage.setItem(CART_KEY, legacy);
      localStorage.removeItem('cart');
    }
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  }

  function saveCart(cart){
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function loadCart(){
    const cart = getCart();
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCart');
    const cartCountEl = document.getElementById('cartCount');

    if(cartCountEl){
      const totalQty = cart.reduce((s,i)=> s + (i.quantity||1),0);
      cartCountEl.textContent = totalQty;
    }

    if(cart.length === 0){
      cartItemsContainer.style.display = 'none';
      emptyCartMessage.style.display = 'block';
      updateOrderSummary(cart);
      return;
    }

    cartItemsContainer.style.display = 'block';
    emptyCartMessage.style.display = 'none';

    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="item-info">
          <h4>${item.name}</h4>
          <p class="text-muted">${item.category || ''}</p>
        </div>
        <div class="item-quantity">
          <span>Määrä: ${item.quantity || 1}</span>
        </div>
        <div class="item-price">
          <strong>${(item.price * (item.quantity||1)).toFixed(2)} €</strong>
        </div>
      </div>
    `).join('');

    updateOrderSummary(cart);
  }

  function updateOrderSummary(cart){
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity||1)), 0);
    const tax = subtotal * 0.24;
    const total = subtotal + tax;

    const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    setText('subtotal', subtotal.toFixed(2) + ' €');
    setText('tax', tax.toFixed(2) + ' €');
    setText('total', total.toFixed(2) + ' €');
  }

  function showStatus(message, type){
    const statusEl = document.getElementById('statusMessage');
    if(!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `status-message ${type} show`;
    setTimeout(()=> statusEl.classList.remove('show'), 3000);
  }

  function validateForm(){
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'postalCode'];
    const missing = requiredFields.filter(id => !document.getElementById(id)?.value.trim());
    if(missing.length){
      showStatus('Täytä kaikki pakolliset kentät', 'error');
      return false;
    }
    return true;
  }

  function processCheckout(){
    if(!validateForm()) return;

    const cart = getCart();
    if(cart.length === 0){
      showStatus('Ostoskorisi on tyhjä', 'error');
      return;
    }

    // Placeholder: later integrate payment method switch + PayPal
    const overlay = document.getElementById('loadingOverlay');
    if(overlay) overlay.style.display = 'flex';

    setTimeout(()=>{
      localStorage.removeItem(CART_KEY);
      if(overlay) overlay.style.display = 'none';
      showStatus('Tilaus vahvistettu! Kiitos ostoksestasi.', 'success');
      setTimeout(()=> window.location.href = '../', 3000);
    }, 1500);
  }

  function loadUserData(){
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if(!currentUser) return;
    const setVal = (id, val) => { const el = document.getElementById(id); if(el && !el.value) el.value = val; };
    const parts = (currentUser.name || '').split(' ');
    setVal('firstName', parts[0] || '');
    setVal('lastName', parts.slice(1).join(' ') || '');
    setVal('email', currentUser.email || '');
    setVal('phone', currentUser.phone || '');
    setVal('address', currentUser.address || '');
  }

  function bindEvents(){
    const checkoutBtn = document.getElementById('checkoutBtn');
    if(checkoutBtn) checkoutBtn.addEventListener('click', processCheckout);
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadUserData();
    bindEvents();
  });
})();
