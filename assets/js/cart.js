/**
 * NIJEDEE - Unified Shopping Cart Engine & Order Checkout
 * Handles real-time cart persistence in localStorage and cloud synchronization
 * with user profiles in Supabase. Provides universal drawer, badge counter,
 * quantity stepper, and automated checkout pre-fill for logged in customers.
 *
 * STRICT RULE: ZERO Unicode Emojis. Clean SVG icons and accessible markup only.
 */

(function () {
  'use strict';

  const CART_STORAGE_KEY = 'nijedee_cart';
  let cart = [];

  // Helper: Read cart from local storage
  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      cart = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch (e) {
      cart = [];
    }
    return cart;
  }

  // Helper: Save cart to local storage and sync to Supabase if logged in
  function saveCart(newCart) {
    cart = newCart || [];
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Cart storage error:', e);
    }

    // Sync with Supabase user profile in background
    syncCartToSupabase();
    updateCartUI();
  }

  // Debounced cloud sync to Supabase
  let syncTimer = null;
  function syncCartToSupabase() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      try {
        const user = window.getCurrentUser ? window.getCurrentUser() : null;
        const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
        if (user && user.id && sb) {
          await sb.from('profiles').update({
            cart: cart,
            updated_at: new Date().toISOString()
          }).eq('id', user.id);
        }
      } catch (err) {
        // Non-blocking background sync
      }
    }, 1200);
  }

  // Add Item to Cart
  function addToCart(productOrName, price, image, category) {
    loadCart();

    let itemObj = {};
    if (typeof productOrName === 'object' && productOrName !== null) {
      itemObj = {
        id: productOrName.id || ('prod_' + Math.random().toString(36).substr(2, 9)),
        name: productOrName.name || 'Materials Item',
        price: Number(productOrName.price) || 0,
        image: productOrName.image || 'assets/images/logo.png',
        category: productOrName.category || 'General Materials',
        variant: productOrName.variant || '',
        qty: Number(productOrName.qty) || 1
      };
    } else {
      itemObj = {
        id: 'prod_' + String(productOrName).toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: String(productOrName || 'Materials Item'),
        price: Number(price) || 0,
        image: image || 'assets/images/logo.png',
        category: category || 'General Materials',
        variant: '',
        qty: 1
      };
    }

    const existingIndex = cart.findIndex(i => i.name === itemObj.name && (i.variant || '') === (itemObj.variant || ''));
    if (existingIndex > -1) {
      cart[existingIndex].qty += (itemObj.qty || 1);
    } else {
      cart.push(itemObj);
    }

    saveCart(cart);
    openCartDrawer();

    if (window.showCustomToast) {
      window.showCustomToast(`"${itemObj.name}" added to your materials cart.`);
    }
  }

  // Change Quantity (+1 / -1)
  function changeCartQty(index, delta) {
    loadCart();
    if (index < 0 || index >= cart.length) return;

    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }

    saveCart(cart);
  }

  // Remove Item
  function removeCartItem(index) {
    loadCart();
    if (index >= 0 && index < cart.length) {
      const removedName = cart[index].name;
      cart.splice(index, 1);
      saveCart(cart);
      if (window.showCustomToast) {
        window.showCustomToast(`Removed "${removedName}" from cart.`);
      }
    }
  }

  // Clear Entire Cart
  function clearCart() {
    saveCart([]);
    updateCartUI();
  }

  // Calculate Totals
  function getCartSummary() {
    loadCart();
    const totalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0);
    return {
      totalQty,
      subtotal,
      formattedSubtotal: 'NGN ' + subtotal.toLocaleString()
    };
  }

  // Update All Cart UI Elements Across the Active Page
  function updateCartUI() {
    loadCart();
    const { totalQty, subtotal, formattedSubtotal } = getCartSummary();

    // Update all badges
    document.querySelectorAll('#cartCountBadge, .cart-count-badge, [data-cart-badge]').forEach(el => {
      el.textContent = totalQty;
      el.style.display = totalQty > 0 ? 'inline-flex' : 'none';
    });

    // Update subtotal displays
    document.querySelectorAll('#cartSubtotalAmount, .cart-subtotal-display').forEach(el => {
      el.innerHTML = '&#8358;' + subtotal.toLocaleString();
    });

    // Update modal checkout total if present
    const modalOrderTotal = document.getElementById('modalOrderTotal');
    if (modalOrderTotal) {
      modalOrderTotal.innerHTML = '&#8358;' + subtotal.toLocaleString();
    }

    // Render items inside drawer body
    const itemsContainer = document.getElementById('cartDrawerItems');
    if (!itemsContainer) return;

    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div style="text-align:center; padding:50px 20px; color:var(--tk-neutral-500);">
          <div style="width:60px; height:60px; border-radius:50%; background:var(--tk-page); display:inline-flex; align-items:center; justify-content:center; margin-bottom:16px;">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--tk-neutral-400);">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <h4 style="font-size:1.05rem; font-weight:800; color:var(--tk-navy); margin-bottom:6px;">Your cart is empty</h4>
          <p style="font-size:0.86rem; color:var(--tk-neutral-500); line-height:1.4; margin-bottom:20px;">Browse our verified building materials, electricals, and plumbing inventory.</p>
          <a href="shop.html" class="tk-btn tk-btn--primary tk-btn--sm" onclick="closeCartDrawer();">Explore Materials Shop &rarr;</a>
        </div>
      `;
      return;
    }

    itemsContainer.innerHTML = cart.map((item, index) => {
      const itemSubtotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
      return `
        <div class="cart-item-row" style="display:flex; gap:12px; align-items:center; padding:12px 14px; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; margin-bottom:10px;">
          <img src="${item.image || 'assets/images/logo.png'}" alt="${item.name}" style="width:48px; height:48px; border-radius:8px; object-fit:cover; border:1px solid #CBD5E1; flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:0.88rem; color:var(--tk-navy); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
            ${item.variant ? `<div style="font-size:0.75rem; color:#64748B;">Variant: ${item.variant}</div>` : ''}
            <div style="font-size:0.82rem; font-weight:800; color:var(--tk-primary); margin-top:2px;">&#8358;${itemSubtotal.toLocaleString()}</div>
          </div>
          <div style="display:flex; align-items:center; gap:6px; background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:2px;">
            <button type="button" onclick="window.changeCartQty(${index}, -1)" style="width:24px; height:24px; border:none; background:none; cursor:pointer; font-weight:800; font-size:14px; color:var(--tk-navy); display:flex; align-items:center; justify-content:center;" aria-label="Decrease quantity">&minus;</button>
            <span style="font-size:0.82rem; font-weight:800; min-width:18px; text-align:center; color:var(--tk-navy);">${item.qty}</span>
            <button type="button" onclick="window.changeCartQty(${index}, 1)" style="width:24px; height:24px; border:none; background:none; cursor:pointer; font-weight:800; font-size:14px; color:var(--tk-navy); display:flex; align-items:center; justify-content:center;" aria-label="Increase quantity">&plus;</button>
          </div>
          <button type="button" onclick="window.removeCartItem(${index})" style="background:none; border:none; color:#EF4444; cursor:pointer; padding:6px; display:flex; align-items:center; justify-content:center;" title="Remove from cart" aria-label="Remove item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    }).join('');
  }

  // Open & Close Drawer
  function openCartDrawer() {
    ensureCartDrawerInDOM();
    updateCartUI();
    const drawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.cart-overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    const drawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.cart-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Auto-inject Cart Drawer into DOM if not already present on page
  function ensureCartDrawerInDOM() {
    if (document.querySelector('.cart-drawer')) return;

    const drawerHTML = `
      <div class="cart-drawer">
        <div class="cart-drawer__header" style="display:flex; justify-content:space-between; align-items:center; padding:18px 20px; border-bottom:1px solid #E2E8F0; background:#FFFFFF;">
          <div style="display:flex; align-items:center; gap:8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--tk-primary);">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <h3 style="font-size:1.05rem; color:var(--tk-navy); font-weight:800; margin:0;">Materials Cart</h3>
          </div>
          <button type="button" class="cart-drawer__close" onclick="window.closeCartDrawer()" aria-label="Close cart" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--tk-neutral-400); display:flex; align-items:center; justify-content:center;">&times;</button>
        </div>
        <div class="cart-drawer__body" id="cartDrawerItems" style="padding:16px; overflow-y:auto; flex:1; max-height:calc(100vh - 190px);">
          <div style="text-align:center; padding:40px 0; color:var(--tk-neutral-400);">Your cart is currently empty.</div>
        </div>
        <div class="cart-drawer__footer" style="padding:18px 20px; border-top:1px solid #E2E8F0; background:#FFFFFF;">
          <div style="display:flex; justify-content:space-between; margin-bottom:14px; font-weight:800; color:var(--tk-navy); font-size:1rem;">
            <span>Subtotal:</span>
            <span id="cartSubtotalAmount">&#8358;0</span>
          </div>
          <button type="button" class="tk-btn tk-btn--primary" style="width:100%; justify-content:center; padding:13px; font-size:0.95rem; font-weight:700;" onclick="window.handleProceedToCheckout()">
            Proceed to Delivery Checkout &rarr;
          </button>
        </div>
      </div>
      <div class="cart-overlay tk-drawer-overlay" onclick="window.closeCartDrawer()"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', drawerHTML);
  }

  // Handle Checkout Click
  function handleProceedToCheckout() {
    loadCart();
    if (!cart.length) {
      if (window.showCustomAlert) {
        window.showCustomAlert({
          title: 'Your Cart is Empty',
          message: 'Please add building materials or shop products before proceeding to delivery checkout.',
          type: 'info'
        });
      }
      return;
    }

    closeCartDrawer();

    // If on shop.html with existing checkout modal, use it
    if (typeof window.openCheckoutModal === 'function') {
      window.openCheckoutModal();
      autofillCheckoutFields();
      return;
    }

    // Otherwise redirect to shop.html or open global checkout modal
    if (!window.location.pathname.includes('shop.html')) {
      window.location.href = 'shop.html?checkout=1';
      return;
    }
  }

  // Auto-fill checkout fields if user is signed in
  function autofillCheckoutFields() {
    try {
      const user = window.getCurrentUser ? window.getCurrentUser() : null;
      if (!user) return;

      const nameInput = document.getElementById('checkoutClientName') || document.getElementById('clientName') || document.getElementById('orderCustName');
      const phoneInput = document.getElementById('checkoutClientPhone') || document.getElementById('clientPhone') || document.getElementById('orderCustPhone');
      const whatsappInput = document.getElementById('orderCustWhatsApp');
      const emailInput = document.getElementById('checkoutClientEmail') || document.getElementById('clientEmail');
      const addressInput = document.getElementById('checkoutDeliveryAddress') || document.getElementById('clientAddress') || document.getElementById('orderCustAddress');
      const stateSelect = document.getElementById('checkoutStateSelect') || document.getElementById('orderCustState');
      const lgaSelect = document.getElementById('checkoutLgaSelect') || document.getElementById('orderCustLga');

      if (nameInput && !nameInput.value) nameInput.value = user.full_name || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
      if (whatsappInput && !whatsappInput.value) whatsappInput.value = user.phone || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
      if (addressInput && !addressInput.value) addressInput.value = user.street || '';

      if (stateSelect && user.state && window.populateStateSelect) {
        window.populateStateSelect(stateSelect, user.state);
        if (lgaSelect && user.lga && window.populateLgaSelect) {
          window.populateLgaSelect(lgaSelect, user.state, user.lga);
        }
      }
    } catch (e) {
      console.warn('Autofill error:', e);
    }
  }

  // Global Exports
  window.loadCart = loadCart;
  window.saveCart = saveCart;
  window.addToCart = addToCart;
  window.changeCartQty = changeCartQty;
  window.removeCartItem = removeCartItem;
  window.clearCart = clearCart;
  window.getCartSummary = getCartSummary;
  window.updateCartUI = updateCartUI;
  window.openCartDrawer = openCartDrawer;
  window.closeCartDrawer = closeCartDrawer;
  window.handleProceedToCheckout = handleProceedToCheckout;
  window.autofillCheckoutFields = autofillCheckoutFields;

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    ensureCartDrawerInDOM();
    updateCartUI();

    // Attach open buttons
    document.querySelectorAll('[data-open-cart]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartDrawer();
      });
    });

    // Check if URL has ?checkout=1
    if (window.location.search.includes('checkout=1')) {
      setTimeout(() => {
        if (typeof window.openCheckoutModal === 'function') {
          window.openCheckoutModal();
          autofillCheckoutFields();
        }
      }, 500);
    }
  });

})();
