/**
 * NIJEDEE - Customer Authentication & Account Management Engine
 * Handles user sign in, registration with Nigerian State and LGA selection,
 * profile editing, password verification, duplicate prevention, and header session syncing.
 *
 * STRICT RULE: ZERO Unicode Emojis. Clean SVG icons and accessible markup only.
 */

(function () {
  'use strict';

  const USER_SESSION_KEY = 'nijedee_user_session';
  const USER_LOCAL_STORE = 'nijedee_registered_profiles';

  /**
   * Get Active User Session
   */
  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(USER_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Save Active User Session
   */
  function saveUserSession(user) {
    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      // Also cache in local profiles store for offline lookup
      const localProfiles = getLocalProfiles();
      const idx = localProfiles.findIndex(p => p.id === user.id || p.email === user.email || p.phone === user.phone);
      if (idx > -1) {
        localProfiles[idx] = Object.assign(localProfiles[idx], user);
      } else {
        localProfiles.push(user);
      }
      localStorage.setItem(USER_LOCAL_STORE, JSON.stringify(localProfiles));
    } catch (e) {}

    updateHeaderAuthUI();
  }

  /**
   * Clear Session on Logout
   */
  function logoutUser() {
    localStorage.removeItem(USER_SESSION_KEY);
    updateHeaderAuthUI();
    if (window.showCustomToast) {
      window.showCustomToast('You have been signed out successfully.');
    }
    // If on account or change-password page, redirect to home
    if (window.location.pathname.includes('account.html') || window.location.pathname.includes('change-password.html')) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 400);
    }
  }

  /**
   * Get cached local profiles
   */
  function getLocalProfiles() {
    try {
      const raw = localStorage.getItem(USER_LOCAL_STORE);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Generate UUID v4
   */
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Clean and normalize phone number
   */
  function normalizePhone(phone) {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  }

  /**
   * Check for duplicate Email or Phone in Supabase & Local Cache
   * "ensure that no email or phone number can be used to create another account"
   */
  async function checkUserDuplicates(email, phone, excludeUserId) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = normalizePhone(phone);
    const last8Phone = cleanPhone.slice(-8);

    // 1. Check local cache first
    const localProfiles = getLocalProfiles();
    for (const p of localProfiles) {
      if (excludeUserId && p.id === excludeUserId) continue;
      if (p.email && p.email.trim().toLowerCase() === cleanEmail) {
        return { duplicate: true, field: 'email', message: 'An account with this email address already exists. Please sign in or use a different email.' };
      }
      const pPhone = normalizePhone(p.phone);
      if (pPhone && last8Phone && pPhone.endsWith(last8Phone)) {
        return { duplicate: true, field: 'phone', message: 'An account with this phone number already exists. Please sign in or use a different phone number.' };
      }
    }

    // 2. Check live Supabase database
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (sb) {
      try {
        const { data, error } = await sb.from('profiles').select('*');
        if (!error && Array.isArray(data)) {
          for (const p of data) {
            if (excludeUserId && p.id === excludeUserId) continue;
            if (p.email && p.email.trim().toLowerCase() === cleanEmail) {
              return { duplicate: true, field: 'email', message: 'An account with this email address already exists. Please sign in or use a different email.' };
            }
            const pPhone = normalizePhone(p.phone);
            if (pPhone && last8Phone && pPhone.endsWith(last8Phone)) {
              return { duplicate: true, field: 'phone', message: 'An account with this phone number already exists. Please sign in or use a different phone number.' };
            }
          }
        }
      } catch (err) {
        console.warn('Supabase duplicate check query note:', err);
      }
    }

    return { duplicate: false };
  }

  /**
   * Register New Customer Account
   */
  async function handleUserRegister(formData) {
    const firstName = (formData.firstName || '').trim();
    const lastName = (formData.lastName || '').trim();
    const email = (formData.email || '').trim().toLowerCase();
    const phone = (formData.phone || '').trim();
    const state = (formData.state || '').trim();
    const lga = (formData.lga || '').trim();
    const street = (formData.street || '').trim();
    const password = (formData.password || '').trim();
    const confirmPassword = (formData.confirmPassword || '').trim();

    // Field Validations
    if (!firstName || !lastName) {
      throw new Error('Please enter both your First Name and Last Name.');
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      throw new Error('Please enter a valid Nigerian phone number (at least 10 digits).');
    }
    if (!state) {
      throw new Error('Please select your State from the dropdown.');
    }
    if (!lga) {
      throw new Error('Please select your Local Government Area (L.G.A.).');
    }
    if (!street) {
      throw new Error('Please enter your full street or residential address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match. Please re-type your password carefully.');
    }

    // Duplicate Check
    const dupCheck = await checkUserDuplicates(email, phone);
    if (dupCheck.duplicate) {
      throw new Error(dupCheck.message);
    }

    const userId = generateUUID();
    const fullName = `${firstName} ${lastName}`;
    const userProfile = {
      id: userId,
      email: email,
      full_name: fullName,
      phone: phone,
      street: street,
      state: state,
      lga: lga,
      role: 'customer',
      addresses: {
        first_name: firstName,
        last_name: lastName,
        full_address: street,
        state: state,
        lga: lga,
        password: password,
        registered_at: new Date().toISOString()
      },
      cart: window.loadCart ? window.loadCart() : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to Supabase profiles
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (sb) {
      try {
        const { error } = await sb.from('profiles').insert([userProfile]);
        if (error) {
          console.warn('Supabase profile save notice:', error);
        }
      } catch (err) {
        console.warn('Supabase insert error:', err);
      }
    }

    // Save Active Session
    saveUserSession(userProfile);
    closeUserAuthModal();

    if (window.showCustomAlert) {
      await window.showCustomAlert({
        title: 'Account Created Successfully',
        message: `Welcome to NIJEDEE, ${firstName}! Your account has been created and verified. You can now track maintenance requests, manage orders, and chat directly with our operations team.`,
        type: 'success'
      });
    }

    return userProfile;
  }

  /**
   * Log In Existing Customer Account
   */
  async function handleUserLogin(emailOrPhone, password) {
    const input = (emailOrPhone || '').trim();
    const cleanInput = input.toLowerCase();
    const cleanPhone = normalizePhone(input);
    const pass = (password || '').trim();

    if (!input) {
      throw new Error('Please enter your registered email address or phone number.');
    }
    if (!pass || pass.length < 6) {
      throw new Error('Please enter your password (minimum 6 characters).');
    }

    let matched = null;

    // 1. Search Supabase profiles table
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (sb) {
      try {
        const { data, error } = await sb.from('profiles').select('*');
        if (!error && Array.isArray(data)) {
          matched = data.find(p => {
            const pEmail = (p.email || '').toLowerCase().trim();
            const pPhone = normalizePhone(p.phone);
            const matchesIdentifier = pEmail === cleanInput || (cleanPhone && pPhone && pPhone.endsWith(cleanPhone.slice(-8)));
            if (!matchesIdentifier) return false;

            const storedPass = p.addresses?.password || p.password;
            return !storedPass || storedPass === pass;
          });
        }
      } catch (err) {
        console.warn('Supabase login check note:', err);
      }
    }

    // 2. Fallback to local profiles store
    if (!matched) {
      const localProfiles = getLocalProfiles();
      matched = localProfiles.find(p => {
        const pEmail = (p.email || '').toLowerCase().trim();
        const pPhone = normalizePhone(p.phone);
        const matchesIdentifier = pEmail === cleanInput || (cleanPhone && pPhone && pPhone.endsWith(cleanPhone.slice(-8)));
        if (!matchesIdentifier) return false;

        const storedPass = p.addresses?.password || p.password;
        return !storedPass || storedPass === pass;
      });
    }

    if (!matched) {
      throw new Error('Invalid email, phone number, or password. Please verify your credentials and try again.');
    }

    saveUserSession(matched);
    closeUserAuthModal();

    if (window.showCustomToast) {
      window.showCustomToast(`Welcome back, ${matched.addresses?.first_name || matched.full_name || 'Customer'}!`);
    }

    return matched;
  }

  /**
   * Update Profile Information
   */
  async function handleUpdateUserProfile(updateData) {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('You must be signed in to update your profile.');
    }

    const firstName = (updateData.firstName || '').trim();
    const lastName = (updateData.lastName || '').trim();
    const phone = (updateData.phone || '').trim();
    const state = (updateData.state || '').trim();
    const lga = (updateData.lga || '').trim();
    const street = (updateData.street || '').trim();

    if (!firstName || !lastName) {
      throw new Error('First Name and Last Name are required.');
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      throw new Error('A valid Nigerian phone number is required.');
    }
    if (!state) {
      throw new Error('Please select your State.');
    }
    if (!lga) {
      throw new Error('Please select your Local Government Area.');
    }
    if (!street) {
      throw new Error('Please enter your full street address.');
    }

    // Check duplicate phone if phone changed
    if (normalizePhone(phone) !== normalizePhone(user.phone)) {
      const dupCheck = await checkUserDuplicates(user.email, phone, user.id);
      if (dupCheck.duplicate && dupCheck.field === 'phone') {
        throw new Error(dupCheck.message);
      }
    }

    const fullName = `${firstName} ${lastName}`;
    user.full_name = fullName;
    user.phone = phone;
    user.state = state;
    user.lga = lga;
    user.street = street;
    user.updated_at = new Date().toISOString();

    if (!user.addresses) user.addresses = {};
    user.addresses.first_name = firstName;
    user.addresses.last_name = lastName;
    user.addresses.state = state;
    user.addresses.lga = lga;
    user.addresses.full_address = street;

    // Update in Supabase
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (sb) {
      try {
        await sb.from('profiles').update({
          full_name: fullName,
          phone: phone,
          state: state,
          lga: lga,
          street: street,
          addresses: user.addresses,
          updated_at: user.updated_at
        }).eq('id', user.id);
      } catch (err) {
        console.warn('Supabase profile update note:', err);
      }
    }

    saveUserSession(user);

    if (window.showCustomAlert) {
      await window.showCustomAlert({
        title: 'Profile Updated',
        message: 'Your personal and delivery address information has been updated successfully.',
        type: 'success'
      });
    }

    return user;
  }

  /**
   * Change Password Function (Used by change-password.html)
   */
  async function handleChangePassword(oldPassword, newPassword, confirmNewPassword) {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('You must be signed in to change your password.');
    }

    const oldP = (oldPassword || '').trim();
    const newP = (newPassword || '').trim();
    const confP = (confirmNewPassword || '').trim();

    if (!oldP) {
      throw new Error('Please enter your current old password.');
    }
    if (!newP || newP.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    if (newP !== confP) {
      throw new Error('New passwords do not match. Please re-type your new password.');
    }
    if (oldP === newP) {
      throw new Error('Your new password cannot be the same as your old password.');
    }

    // Verify old password
    const currentPass = user.addresses?.password || user.password;
    if (currentPass && currentPass !== oldP) {
      throw new Error('The current old password you entered is incorrect.');
    }

    if (!user.addresses) user.addresses = {};
    user.addresses.password = newP;
    user.password = newP;
    user.updated_at = new Date().toISOString();

    // Update in Supabase
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (sb) {
      try {
        await sb.from('profiles').update({
          addresses: user.addresses,
          updated_at: user.updated_at
        }).eq('id', user.id);
      } catch (err) {
        console.warn('Supabase password update note:', err);
      }
    }

    saveUserSession(user);

    if (window.showCustomAlert) {
      await window.showCustomAlert({
        title: 'Password Changed Successfully',
        message: 'Your account security credentials have been updated. You can now use your new password for future logins.',
        type: 'success'
      });
    }

    return true;
  }

  /**
   * Update Header Navigation across pages to display Sign In button or User Profile Pill
   */
  function updateHeaderAuthUI() {
    const user = getCurrentUser();
    const actionContainers = document.querySelectorAll('.tk-header__actions');
    const mobileDrawers = document.querySelectorAll('.tk-drawer__nav, .tk-header__drawer');

    actionContainers.forEach(container => {
      let authWrap = container.querySelector('.tk-header-user-wrap');
      if (!authWrap) {
        authWrap = document.createElement('div');
        authWrap.className = 'tk-header-user-wrap';
        authWrap.style.display = 'inline-flex';
        authWrap.style.alignItems = 'center';
        // Insert right before Book a Service or at the beginning
        const bookBtn = container.querySelector('a[href*="book.html"]');
        if (bookBtn) {
          container.insertBefore(authWrap, bookBtn);
        } else {
          container.prepend(authWrap);
        }
      }

      if (user) {
        const firstName = user.addresses?.first_name || (user.full_name || '').split(' ')[0] || 'User';
        authWrap.innerHTML = `
          <div class="user-menu-dropdown-wrap" style="position:relative; display:inline-block;">
            <button type="button" class="tk-btn tk-btn--ghost tk-btn--sm user-account-pill-btn" onclick="window.toggleUserMenuDropdown(event)" style="gap:8px; padding:6px 12px; font-weight:700; color:var(--tk-navy); border:1px solid #CBD5E1; border-radius:20px; background:#FFFFFF;">
              <span style="width:24px; height:24px; border-radius:50%; background:var(--tk-primary); color:#FFFFFF; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:800;">
                ${firstName.charAt(0).toUpperCase()}
              </span>
              <span>${escapeHtml(firstName)}</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div id="userHeaderMenuDropdown" class="user-header-menu-dropdown" style="display:none; position:absolute; right:0; top:calc(100% + 8px); width:210px; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; box-shadow:0 10px 25px rgba(7,34,79,0.15); padding:8px 0; z-index:1000;">
              <div style="padding:10px 16px; border-bottom:1px solid #F1F5F9;">
                <div style="font-weight:800; font-size:0.86rem; color:var(--tk-navy);">${escapeHtml(user.full_name || firstName)}</div>
                <div style="font-size:0.75rem; color:#64748B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(user.email || user.phone)}</div>
              </div>
              <a href="account.html" style="display:flex; align-items:center; gap:10px; padding:9px 16px; font-size:0.86rem; font-weight:600; color:var(--tk-navy); text-decoration:none;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='none'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>My Account</span>
              </a>
              <a href="account.html?tab=chat" style="display:flex; align-items:center; gap:10px; padding:9px 16px; font-size:0.86rem; font-weight:600; color:#0B5ED7; text-decoration:none;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='none'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>Live Admin Chat</span>
              </a>
              <a href="change-password.html" style="display:flex; align-items:center; gap:10px; padding:9px 16px; font-size:0.86rem; font-weight:600; color:var(--tk-navy); text-decoration:none;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='none'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Change Password</span>
              </a>
              <div style="border-top:1px solid #F1F5F9; margin:4px 0;"></div>
              <button type="button" onclick="window.logoutUser()" style="width:100%; border:none; background:none; text-align:left; display:flex; align-items:center; gap:10px; padding:9px 16px; font-size:0.86rem; font-weight:700; color:#EF4444; cursor:pointer;" onmouseover="this.style.background='#FEF2F2'" onmouseout="this.style.background='none'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        `;
      } else {
        authWrap.innerHTML = `
          <button type="button" class="tk-btn tk-btn--outline tk-btn--sm" onclick="window.openUserAuthModal('signin')" style="gap:6px; padding:7px 14px; font-weight:700; border-radius:20px;">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Sign In</span>
          </button>
        `;
      }
    });

    // Mobile Drawer Updates
    mobileDrawers.forEach(drawer => {
      let mobileAuthSection = drawer.querySelector('.mobile-auth-drawer-section');
      if (!mobileAuthSection) {
        mobileAuthSection = document.createElement('div');
        mobileAuthSection.className = 'mobile-auth-drawer-section';
        mobileAuthSection.style.padding = '14px 0';
        mobileAuthSection.style.marginTop = '16px';
        mobileAuthSection.style.borderTop = '1px solid rgba(0,0,0,0.08)';
        drawer.appendChild(mobileAuthSection);
      }

      if (user) {
        const firstName = user.addresses?.first_name || (user.full_name || '').split(' ')[0] || 'User';
        mobileAuthSection.innerHTML = `
          <div style="background:#F1F5F9; border-radius:12px; padding:12px 14px; margin-bottom:12px;">
            <div style="font-weight:800; font-size:0.92rem; color:var(--tk-navy);">Hi, ${escapeHtml(firstName)}</div>
            <div style="font-size:0.75rem; color:#64748B;">${escapeHtml(user.email || user.phone)}</div>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <a href="account.html" class="tk-btn tk-btn--outline tk-btn--sm" style="width:100%; justify-content:center;">My Account Dashboard</a>
            <a href="account.html?tab=chat" class="tk-btn tk-btn--ghost tk-btn--sm" style="width:100%; justify-content:center; color:#0B5ED7; border:1px solid #BFDBFE;">Live Support Chat</a>
            <a href="change-password.html" class="tk-btn tk-btn--ghost tk-btn--sm" style="width:100%; justify-content:center;">Change Password</a>
            <button type="button" class="tk-btn tk-btn--danger tk-btn--sm" onclick="window.logoutUser()" style="width:100%; justify-content:center; margin-top:4px;">Sign Out</button>
          </div>
        `;
      } else {
        mobileAuthSection.innerHTML = `
          <div style="display:flex; gap:10px;">
            <button type="button" class="tk-btn tk-btn--outline" onclick="window.openUserAuthModal('signin')" style="flex:1; justify-content:center; font-size:0.88rem;">Sign In</button>
            <button type="button" class="tk-btn tk-btn--primary" onclick="window.openUserAuthModal('register')" style="flex:1; justify-content:center; font-size:0.88rem;">Register</button>
          </div>
        `;
      }
    });
  }

  function toggleUserMenuDropdown(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('userHeaderMenuDropdown');
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userHeaderMenuDropdown');
    if (dropdown && !e.target.closest('.user-menu-dropdown-wrap')) {
      dropdown.style.display = 'none';
    }
  });

  /**
   * Escape HTML helper
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * Ensure Universal Auth Modal exists in DOM
   */
  function ensureAuthModalInDOM() {
    if (document.getElementById('userAuthModalBackdrop')) return;

    const modalHTML = `
      <div id="userAuthModalBackdrop" class="modal-backdrop user-auth-modal-backdrop" onclick="if(event.target === this) window.closeUserAuthModal()" style="display:none; position:fixed; inset:0; background:rgba(7,34,79,0.7); backdrop-filter:blur(4px); z-index:99999; align-items:center; justify-content:center; padding:16px; overflow-y:auto;">
        <div class="user-auth-modal-card" onclick="event.stopPropagation()" style="background:#FFFFFF; border-radius:18px; width:100%; max-width:520px; box-shadow:0 20px 45px rgba(7,34,79,0.25); border:1px solid #E2E8F0; overflow:hidden; position:relative; margin:auto;">
          
          <!-- Modal Header -->
          <div style="background:linear-gradient(135deg, var(--tk-navy, #07224F) 0%, #0F3775 100%); padding:20px 24px; color:#FFFFFF; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="assets/images/logo.png" alt="NIJEDEE" style="height:32px; width:auto; object-fit:contain; background:#FFFFFF; border-radius:4px; padding:2px 4px;">
              <div>
                <h3 id="userAuthModalTitle" style="font-size:1.05rem; font-weight:800; color:#FFFFFF; margin:0;">Customer Portal</h3>
                <p style="font-size:0.75rem; color:#BAE6FD; margin:2px 0 0 0;">Property Maintenance &amp; Marketplace Access</p>
              </div>
            </div>
            <button type="button" onclick="window.closeUserAuthModal()" style="background:rgba(255,255,255,0.15); border:none; color:#FFFFFF; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:20px; display:flex; align-items:center; justify-content:center; line-height:1;" aria-label="Close modal">&times;</button>
          </div>

          <!-- Auth Tabs -->
          <div style="display:flex; border-bottom:1px solid #E2E8F0; background:#F8FAFC;">
            <button type="button" id="tabBtnSignIn" onclick="window.switchUserAuthTab('signin')" style="flex:1; padding:13px; font-weight:800; font-size:0.9rem; border:none; background:#FFFFFF; border-bottom:3px solid var(--tk-primary, #0B5ED7); color:var(--tk-primary, #0B5ED7); cursor:pointer;">
              Sign In
            </button>
            <button type="button" id="tabBtnRegister" onclick="window.switchUserAuthTab('register')" style="flex:1; padding:13px; font-weight:700; font-size:0.9rem; border:none; background:#F8FAFC; border-bottom:3px solid transparent; color:#64748B; cursor:pointer;">
              Create Account
            </button>
          </div>

          <!-- Alert Container -->
          <div id="userAuthAlertBox" style="display:none; margin:14px 20px 0 20px; padding:10px 14px; border-radius:8px; font-size:0.84rem; line-height:1.4;"></div>

          <div style="padding:22px 24px; max-height:calc(85vh - 140px); overflow-y:auto;">
            
            <!-- ================= SIGN IN FORM ================= -->
            <form id="userLoginForm" onsubmit="window.submitUserLoginForm(event); return false;" style="display:block;">
              <div style="margin-bottom:16px;">
                <label style="display:block; font-size:0.84rem; font-weight:700; color:var(--tk-navy); margin-bottom:6px;">Registered Email or Phone Number *</label>
                <input type="text" id="loginIdentifier" required placeholder="e.g. emeka@gmail.com or 08031234567" style="width:100%; box-sizing:border-box; padding:11px 14px; border:1.5px solid #CBD5E1; border-radius:10px; font-size:0.92rem; outline:none;" autocapitalize="none" autocorrect="off">
              </div>

              <div style="margin-bottom:20px;">
                <label style="display:block; font-size:0.84rem; font-weight:700; color:var(--tk-navy); margin-bottom:6px;">Password *</label>
                <div style="position:relative; display:flex; align-items:center;">
                  <input type="password" id="loginPassword" required placeholder="Enter your password" style="width:100%; box-sizing:border-box; padding:11px 44px 11px 14px; border:1.5px solid #CBD5E1; border-radius:10px; font-size:0.92rem; outline:none;" autocapitalize="none">
                  <button type="button" onclick="window.toggleAuthPwVisibility('loginPassword', this)" style="position:absolute; right:8px; background:none; border:none; color:#64748B; cursor:pointer; padding:6px; display:flex; align-items:center;" aria-label="Toggle password">
                    <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                </div>
              </div>

              <button type="submit" id="userLoginSubmitBtn" class="tk-btn tk-btn--primary" style="width:100%; justify-content:center; padding:12px; font-size:0.95rem; font-weight:800; cursor:pointer;">
                Sign In to Account &rarr;
              </button>

              <div style="margin-top:18px; text-align:center; font-size:0.84rem; color:#64748B;">
                Don't have an account yet? <a href="javascript:void(0);" onclick="window.switchUserAuthTab('register')" style="color:var(--tk-primary, #0B5ED7); font-weight:800; text-decoration:none;">Create Account here</a>
              </div>
            </form>

            <!-- ================= REGISTER FORM ================= -->
            <form id="userRegisterForm" onsubmit="window.submitUserRegisterForm(event); return false;" style="display:none;">
              
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">First Name *</label>
                  <input type="text" id="regFirstName" required placeholder="e.g. Chukwuma" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none;">
                </div>
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Last Name *</label>
                  <input type="text" id="regLastName" required placeholder="e.g. Adeleke" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none;">
                </div>
              </div>

              <div style="margin-bottom:14px;">
                <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Email Address *</label>
                <input type="email" id="regEmail" required placeholder="e.g. chukwuma@gmail.com" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none;" autocapitalize="none" autocorrect="off">
              </div>

              <div style="margin-bottom:14px;">
                <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Phone Number *</label>
                <input type="tel" id="regPhone" required placeholder="e.g. 08031234567" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none;" autocapitalize="none">
              </div>

              <!-- State & LGA Selection (No default state selected) -->
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">State *</label>
                  <select id="regState" required onchange="window.handleRegisterStateChange(this.value)" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none; background:#FFFFFF; cursor:pointer;">
                    <option value="" disabled selected>-- Select State --</option>
                  </select>
                </div>
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">L.G.A. *</label>
                  <select id="regLga" required disabled style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none; background:#FFFFFF; cursor:pointer;">
                    <option value="" disabled selected>-- Select State first --</option>
                  </select>
                </div>
              </div>

              <div style="margin-bottom:14px;">
                <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Full Residential / Delivery Address *</label>
                <input type="text" id="regStreet" required placeholder="e.g. House 14, Admiralty Way, Lekki Phase 1" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none;">
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px;">
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Password (Min 6 chars) *</label>
                  <div style="position:relative; display:flex; align-items:center;">
                    <input type="password" id="regPassword" required minlength="6" placeholder="At least 6 chars" style="width:100%; box-sizing:border-box; padding:10px 38px 10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none;">
                    <button type="button" onclick="window.toggleAuthPwVisibility('regPassword', this)" style="position:absolute; right:6px; background:none; border:none; color:#64748B; cursor:pointer; padding:4px;" aria-label="Toggle password">
                      <svg class="eye-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg class="eye-closed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Retype Password *</label>
                  <div style="position:relative; display:flex; align-items:center;">
                    <input type="password" id="regConfirmPassword" required minlength="6" placeholder="Repeat password" style="width:100%; box-sizing:border-box; padding:10px 38px 10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none;">
                    <button type="button" onclick="window.toggleAuthPwVisibility('regConfirmPassword', this)" style="position:absolute; right:6px; background:none; border:none; color:#64748B; cursor:pointer; padding:4px;" aria-label="Toggle password">
                      <svg class="eye-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg class="eye-closed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" id="userRegisterSubmitBtn" class="tk-btn tk-btn--primary" style="width:100%; justify-content:center; padding:12px; font-size:0.95rem; font-weight:800; cursor:pointer;">
                Create Verified Account &rarr;
              </button>

              <div style="margin-top:16px; text-align:center; font-size:0.84rem; color:#64748B;">
                Already registered? <a href="javascript:void(0);" onclick="window.switchUserAuthTab('signin')" style="color:var(--tk-primary, #0B5ED7); font-weight:800; text-decoration:none;">Sign In to your account</a>
              </div>
            </form>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize Nigerian States dropdown
    const regStateSelect = document.getElementById('regState');
    if (regStateSelect && window.populateStateSelect) {
      window.populateStateSelect(regStateSelect, null, 'Select State');
    }
  }

  function handleRegisterStateChange(stateName) {
    const lgaSelect = document.getElementById('regLga');
    if (lgaSelect && window.populateLgaSelect) {
      window.populateLgaSelect(lgaSelect, stateName, null, 'Select L.G.A.');
    }
  }

  function openUserAuthModal(tab) {
    ensureAuthModalInDOM();
    const backdrop = document.getElementById('userAuthModalBackdrop');
    if (backdrop) {
      backdrop.classList.add('open');
      backdrop.style.setProperty('display', 'flex', 'important');
      backdrop.style.setProperty('opacity', '1', 'important');
      backdrop.style.setProperty('visibility', 'visible', 'important');
      backdrop.style.setProperty('pointer-events', 'auto', 'important');
    }
    // Also close mobile drawer if open
    const drawer = document.querySelector('.tk-header__drawer, .tk-drawer');
    if (drawer) {
      drawer.classList.remove('is-open', 'open');
    }
    const drawerOverlay = document.querySelector('.tk-header__drawer-overlay, .tk-drawer__overlay');
    if (drawerOverlay) {
      drawerOverlay.classList.remove('is-open', 'open');
      drawerOverlay.style.display = 'none';
    }
    document.body.style.overflow = 'hidden';
    switchUserAuthTab(tab || 'signin');
  }

  function closeUserAuthModal() {
    const backdrop = document.getElementById('userAuthModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
      backdrop.style.setProperty('display', 'none', 'important');
      backdrop.style.setProperty('opacity', '0', 'important');
      backdrop.style.setProperty('visibility', 'hidden', 'important');
      backdrop.style.setProperty('pointer-events', 'none', 'important');
    }
    document.body.style.overflow = '';
    const alertBox = document.getElementById('userAuthAlertBox');
    if (alertBox) alertBox.style.display = 'none';
  }

  function switchUserAuthTab(tab) {
    const title = document.getElementById('userAuthModalTitle');
    const tabBtnIn = document.getElementById('tabBtnSignIn');
    const tabBtnReg = document.getElementById('tabBtnRegister');
    const loginForm = document.getElementById('userLoginForm');
    const regForm = document.getElementById('userRegisterForm');
    const alertBox = document.getElementById('userAuthAlertBox');
    if (alertBox) alertBox.style.display = 'none';

    if (tab === 'register') {
      if (title) title.textContent = 'Create Customer Account';
      if (tabBtnReg) {
        tabBtnReg.style.background = '#FFFFFF';
        tabBtnReg.style.color = 'var(--tk-primary, #0B5ED7)';
        tabBtnReg.style.borderBottom = '3px solid var(--tk-primary, #0B5ED7)';
      }
      if (tabBtnIn) {
        tabBtnIn.style.background = '#F8FAFC';
        tabBtnIn.style.color = '#64748B';
        tabBtnIn.style.borderBottom = '3px solid transparent';
      }
      if (loginForm) loginForm.style.display = 'none';
      if (regForm) regForm.style.display = 'block';

      // Ensure state dropdown is populated
      const stateSelect = document.getElementById('regState');
      if (stateSelect && (!stateSelect.children || stateSelect.children.length <= 1) && window.populateStateSelect) {
        window.populateStateSelect(stateSelect, null, 'Select State');
      }
    } else {
      if (title) title.textContent = 'Customer Sign In';
      if (tabBtnIn) {
        tabBtnIn.style.background = '#FFFFFF';
        tabBtnIn.style.color = 'var(--tk-primary, #0B5ED7)';
        tabBtnIn.style.borderBottom = '3px solid var(--tk-primary, #0B5ED7)';
      }
      if (tabBtnReg) {
        tabBtnReg.style.background = '#F8FAFC';
        tabBtnReg.style.color = '#64748B';
        tabBtnReg.style.borderBottom = '3px solid transparent';
      }
      if (loginForm) loginForm.style.display = 'block';
      if (regForm) regForm.style.display = 'none';
    }
  }

  function showAuthAlert(message, type) {
    const box = document.getElementById('userAuthAlertBox');
    if (!box) return;
    box.style.display = 'block';
    if (type === 'success') {
      box.style.background = '#ECFDF5';
      box.style.color = '#065F46';
      box.style.border = '1px solid #A7F3D0';
    } else {
      box.style.background = '#FEF2F2';
      box.style.color = '#991B1B';
      box.style.border = '1px solid #FECACA';
    }
    box.textContent = message;
  }

  function toggleAuthPwVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPw = input.type === 'password';
    input.type = isPw ? 'text' : 'password';
    const openEye = btn.querySelector('.eye-open');
    const closedEye = btn.querySelector('.eye-closed');
    if (openEye && closedEye) {
      openEye.style.display = isPw ? 'none' : 'block';
      closedEye.style.display = isPw ? 'block' : 'none';
    }
  }

  async function submitUserLoginForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const identifier = document.getElementById('loginIdentifier')?.value || '';
    const password = document.getElementById('loginPassword')?.value || '';
    const btn = document.getElementById('userLoginSubmitBtn');

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Verifying Account...';
    }

    try {
      await handleUserLogin(identifier, password);
    } catch (err) {
      showAuthAlert(err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Sign In to Account \u2192';
      }
    }
  }

  async function submitUserRegisterForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const btn = document.getElementById('userRegisterSubmitBtn');

    const formData = {
      firstName: document.getElementById('regFirstName')?.value || '',
      lastName: document.getElementById('regLastName')?.value || '',
      email: document.getElementById('regEmail')?.value || '',
      phone: document.getElementById('regPhone')?.value || '',
      state: document.getElementById('regState')?.value || '',
      lga: document.getElementById('regLga')?.value || '',
      street: document.getElementById('regStreet')?.value || '',
      password: document.getElementById('regPassword')?.value || '',
      confirmPassword: document.getElementById('regConfirmPassword')?.value || ''
    };

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Creating Account...';
    }

    try {
      await handleUserRegister(formData);
    } catch (err) {
      showAuthAlert(err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Create Verified Account \u2192';
      }
    }
  }

  // Exports
  window.getCurrentUser = getCurrentUser;
  window.saveUserSession = saveUserSession;
  window.logoutUser = logoutUser;
  window.handleUserRegister = handleUserRegister;
  window.handleUserLogin = handleUserLogin;
  window.handleUpdateUserProfile = handleUpdateUserProfile;
  window.handleChangePassword = handleChangePassword;
  window.updateHeaderAuthUI = updateHeaderAuthUI;
  window.openUserAuthModal = openUserAuthModal;
  window.closeUserAuthModal = closeUserAuthModal;
  window.switchUserAuthTab = switchUserAuthTab;
  window.handleRegisterStateChange = handleRegisterStateChange;
  window.toggleAuthPwVisibility = toggleAuthPwVisibility;
  window.toggleUserMenuDropdown = toggleUserMenuDropdown;
  window.submitUserLoginForm = submitUserLoginForm;
  window.submitUserRegisterForm = submitUserRegisterForm;

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateHeaderAuthUI();
    });
  } else {
    updateHeaderAuthUI();
  }

})();
