/**
 * NIJEDEE Admin Console - Registered Users & Live Customer Support Chat Desk
 * Handles customer oversight, user address/location tracking, profile reviews,
 * and live bidirectional chat communication between Admin and Customers.
 *
 * STRICT RULE: ZERO Unicode Emojis. Clean SVG icons and accessible markup only.
 */

(function () {
  'use strict';

  let allUsers = [];
  let activeChatUser = null;
  let adminChatPollTimer = null;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * Fetch All Registered Users from Supabase profiles
   */
  async function fetchAdminUsers(notify = false) {
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    let users = [];

    // 1. Fetch from Supabase profiles
    if (sb) {
      try {
        const { data, error } = await sb
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          users = data;
        }
      } catch (err) {
        console.warn('Fetch admin profiles note:', err);
      }
    }

    // 2. Merge with locally cached registered profiles
    try {
      const localRaw = localStorage.getItem('nijedee_registered_profiles');
      if (localRaw) {
        const localList = JSON.parse(localRaw);
        if (Array.isArray(localList)) {
          localList.forEach(lp => {
            const exists = users.some(u => u.id === lp.id || (u.email && u.email === lp.email) || (u.phone && u.phone === lp.phone));
            if (!exists) {
              users.push(lp);
            }
          });
        }
      }
    } catch (e) {}

    // Check if active session user exists and is in list
    try {
      const activeUser = window.getCurrentUser ? window.getCurrentUser() : null;
      if (activeUser && !users.some(u => u.id === activeUser.id)) {
        users.push(activeUser);
      }
    } catch (e) {}

    allUsers = users;
    updateUsersKPIs();
    renderUsersTable();

    if (notify && window.showToast) {
      window.showToast('Registered users refreshed from live database.');
    }
  }

  /**
   * Update KPI Cards & Sidebar Badge
   */
  function updateUsersKPIs() {
    const total = allUsers.length;
    const states = new Set(allUsers.map(u => (u.state || '').trim().toLowerCase()).filter(Boolean)).size;

    // Count open customer support chats from window.allRequests
    const supportChats = (window.allRequests || []).filter(r => r.type === 'customer_support');
    const activeChatsCount = supportChats.length;

    const sideBadge = document.getElementById('sidebarUsersCount');
    const mobBadge = document.getElementById('mobileSidebarUsersCount');
    const kpiTotal = document.getElementById('kpiTotalUsers');
    const kpiStates = document.getElementById('kpiUsersStates');
    const kpiChats = document.getElementById('kpiActiveUserChats');

    if (sideBadge) sideBadge.textContent = total;
    if (mobBadge) mobBadge.textContent = total;
    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiStates) kpiStates.textContent = states || (total > 0 ? 1 : 0);
    if (kpiChats) kpiChats.textContent = activeChatsCount;
  }

  /**
   * Render Users Table with Search & State Filter
   */
  function renderUsersTable() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('userSearchInput')?.value || '').trim().toLowerCase();
    const stateFilter = (document.getElementById('userFilterState')?.value || '').trim().toLowerCase();

    const filtered = allUsers.filter(u => {
      const name = (u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      const state = (u.state || '').toLowerCase();
      const lga = (u.lga || '').toLowerCase();
      const street = (u.street || u.addresses?.full_address || '').toLowerCase();

      const matchesSearch = !searchTerm || name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm) || lga.includes(searchTerm) || street.includes(searchTerm);
      const matchesState = !stateFilter || state === stateFilter;

      return matchesSearch && matchesState;
    });

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:40px 20px; color:var(--adm-muted);">
            No registered users match your search criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const initials = (u.full_name || 'Customer').split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) || 'CU';
      const createdDate = u.created_at ? new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
      const cartCount = Array.isArray(u.cart) ? u.cart.reduce((s, i) => s + (Number(i.qty) || 1), 0) : 0;
      const cleanPhone = (u.phone || '').replace(/\D/g, '');

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:38px; height:38px; border-radius:50%; background:#EFF6FF; color:#1D4ED8; font-weight:800; font-size:12px; display:flex; align-items:center; justify-content:center; border:1px solid #BFDBFE; flex-shrink:0;">
                ${escapeHtml(initials)}
              </div>
              <div>
                <div style="font-weight:800; color:var(--adm-navy);">${escapeHtml(u.full_name || 'Customer')}</div>
                <div style="font-size:0.75rem; color:#64748B;">ID: ${escapeHtml((u.id || '').slice(0, 8))}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:700; color:var(--adm-navy); font-size:0.86rem;">
              <a href="tel:${escapeHtml(u.phone)}" style="color:#0B5ED7; text-decoration:none;">${escapeHtml(u.phone || 'None')}</a>
            </div>
            ${cleanPhone ? `
              <a href="https://wa.me/234${cleanPhone.replace(/^0/, '')}" target="_blank" style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; color:#166534; font-weight:700; text-decoration:none; margin-top:2px;">
                WhatsApp &rarr;
              </a>
            ` : ''}
          </td>
          <td>
            <div style="font-size:0.84rem; color:#334155;">
              <a href="mailto:${escapeHtml(u.email)}" style="color:#0B5ED7; text-decoration:none;">${escapeHtml(u.email || 'None')}</a>
            </div>
          </td>
          <td>
            <span style="display:inline-block; background:#EFF6FF; color:#1E40AF; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:800; text-transform:uppercase;">
              ${escapeHtml(u.state || 'Lagos')}
            </span>
            <div style="font-size:0.75rem; color:var(--adm-muted); margin-top:2px;">${escapeHtml(u.lga || 'Eti-Osa')}</div>
          </td>
          <td>
            <div style="font-size:0.82rem; color:#334155; max-width:220px; line-height:1.4;" title="${escapeHtml(u.street || u.addresses?.full_address || '')}">
              ${escapeHtml(u.street || u.addresses?.full_address || 'Not specified')}
            </div>
          </td>
          <td>
            <div style="font-size:0.82rem; font-weight:700; color:var(--adm-navy);">${escapeHtml(createdDate)}</div>
            ${cartCount > 0 ? `<div style="font-size:0.75rem; color:#059669; font-weight:700;">${cartCount} items in cart</div>` : '<div style="font-size:0.75rem; color:var(--adm-muted);">Cart empty</div>'}
          </td>
          <td style="white-space:nowrap;">
            <div style="display:flex; gap:6px; align-items:center;">
              <button type="button" class="adm-btn adm-btn--primary adm-btn--sm" onclick="window.openAdminUserChat('${escapeHtml(u.id)}')">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>Chat</span>
              </button>
              <button type="button" class="adm-btn adm-btn--outline adm-btn--sm" onclick="window.viewAdminUserDetails('${escapeHtml(u.id)}')">
                <span>Details</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * View Full User Details Modal
   */
  function viewAdminUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    if (window.showCustomAlert) {
      window.showCustomAlert({
        title: `Customer Profile: ${user.full_name || 'Customer'}`,
        message: `Customer ID: ${user.id}\nEmail: ${user.email || 'N/A'}\nPhone: ${user.phone || 'N/A'}\nState: ${user.state || 'N/A'}\nLGA: ${user.lga || 'N/A'}\nDelivery Address: ${user.street || user.addresses?.full_address || 'N/A'}\nRegistered: ${user.created_at || 'Recent'}`,
        type: 'info'
      });
    }
  }

  /**
   * Open Admin Live Chat with Customer
   */
  async function openAdminUserChat(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    activeChatUser = user;

    const modal = document.getElementById('adminUserChatModal');
    if (!modal) return;

    document.getElementById('chatModalUserName').textContent = user.full_name || 'Customer';
    document.getElementById('chatModalUserMeta').textContent = `${user.phone || ''} \u2022 ${user.state || 'Nigeria'} \u2022 ${user.email || ''}`;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    fetchAdminUserChatFeed(true);

    clearInterval(adminChatPollTimer);
    adminChatPollTimer = setInterval(() => {
      if (document.getElementById('adminUserChatModal')?.style.display === 'flex') {
        fetchAdminUserChatFeed(false);
      }
    }, 3000);
  }

  function closeAdminUserChat() {
    const modal = document.getElementById('adminUserChatModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
    clearInterval(adminChatPollTimer);
    activeChatUser = null;
  }

  /**
   * Fetch Live Chat Messages for Active User
   */
  async function fetchAdminUserChatFeed(showSpinner = false) {
    if (!activeChatUser) return;
    const stream = document.getElementById('adminUserChatStream');
    if (showSpinner && stream && !stream.children.length) {
      stream.innerHTML = '<div style="text-align:center; padding:30px; color:var(--adm-muted);">Loading conversation history...</div>';
    }

    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (!sb) return;

    const ref = 'SUP-USR-' + activeChatUser.id.slice(0, 8);

    try {
      const { data, error } = await sb
        .from('requests')
        .select('*')
        .eq('ref_code', ref)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Fetch chat feed note:', error);
        return;
      }

      let messages = [];
      if (data && data.details && Array.isArray(data.details.messages)) {
        messages = data.details.messages;
      }

      renderAdminUserChatStream(messages);
    } catch (err) {
      console.warn('Admin chat feed error:', err);
    }
  }

  /**
   * Render Admin Chat Stream
   */
  function renderAdminUserChatStream(messages) {
    const stream = document.getElementById('adminUserChatStream');
    if (!stream) return;

    if (!messages.length) {
      stream.innerHTML = `
        <div style="text-align:center; padding:40px; color:var(--adm-muted);">
          <div style="font-weight:700; color:var(--adm-navy); margin-bottom:4px;">No messages yet</div>
          <p style="font-size:0.84rem; margin:0;">Send a welcoming support message or order update to start the thread.</p>
        </div>
      `;
      return;
    }

    stream.innerHTML = messages.map(m => {
      const isAdmin = m.sender === 'admin' || m.sender === 'system';
      return `
        <div style="display:flex; flex-direction:column; align-items:${isAdmin ? 'flex-end' : 'flex-start'}; margin-bottom:12px;">
          <div style="font-size:0.75rem; font-weight:800; color:${isAdmin ? '#0B5ED7' : '#1E293B'}; margin-bottom:3px;">
            ${escapeHtml(isAdmin ? 'NIJEDEE Admin' : (m.sender_name || activeChatUser?.full_name || 'Customer'))}
          </div>
          <div style="max-width:80%; padding:10px 14px; border-radius:12px; font-size:0.88rem; line-height:1.5; word-break:break-word; ${isAdmin ? 'background:var(--adm-navy, #07224F); color:#FFFFFF; border-bottom-right-radius:2px;' : 'background:#F1F5F9; color:#0F172A; border:1px solid #E2E8F0; border-bottom-left-radius:2px;'}">
            ${escapeHtml(m.text)}
          </div>
          <div style="display:flex; align-items:center; gap:8px; margin-top:3px;">
            <span style="font-size:0.72rem; color:var(--adm-muted);">${escapeHtml(m.timestamp || '')}</span>
            <button type="button" onclick="window.handleAdminDeleteUserMsg('${escapeHtml(m.id)}')" style="border:none; background:none; color:#EF4444; font-size:11px; cursor:pointer; padding:0 2px;">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    stream.scrollTop = stream.scrollHeight;
  }

  /**
   * Send Admin Reply to Customer
   */
  async function handleSendAdminUserReply(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!activeChatUser) return;

    const input = document.getElementById('adminChatInput');
    const text = (input?.value || '').trim();
    if (!text) return;

    const btn = document.getElementById('adminChatSendBtn');
    if (btn) btn.disabled = true;

    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (!sb) {
      if (btn) btn.disabled = false;
      return;
    }

    const ref = 'SUP-USR-' + activeChatUser.id.slice(0, 8);
    const newMsg = {
      id: 'msg_adm_' + Date.now(),
      sender: 'admin',
      sender_name: 'NIJEDEE Operations Officer',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const { data: existing } = await sb.from('requests').select('*').eq('ref_code', ref).maybeSingle();

      if (existing) {
        const details = existing.details || {};
        if (!Array.isArray(details.messages)) details.messages = [];
        details.messages.push(newMsg);
        details.last_sender = 'admin';
        details.last_message_at = new Date().toISOString();

        await sb.from('requests').update({
          details: details,
          is_read: true
        }).eq('id', existing.id);
      } else {
        await sb.from('requests').insert([{
          ref_code: ref,
          type: 'customer_support',
          title: `Customer Support Chat - ${activeChatUser.full_name}`,
          client_name: activeChatUser.full_name,
          client_phone: activeChatUser.phone,
          client_email: activeChatUser.email,
          location: `${activeChatUser.lga || ''}, ${activeChatUser.state || ''}`.trim() || 'Nigeria',
          address: activeChatUser.street || '',
          status: 'in_progress',
          is_read: true,
          details: {
            user_id: activeChatUser.id,
            messages: [newMsg],
            last_sender: 'admin',
            last_message_at: new Date().toISOString()
          }
        }]);
      }

      if (input) input.value = '';
      fetchAdminUserChatFeed(false);
    } catch (err) {
      console.warn('Send admin reply error:', err);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function insertAdminQuickReply(text) {
    const input = document.getElementById('adminChatInput');
    if (input) {
      input.value = text;
      input.focus();
    }
  }

  async function handleAdminDeleteUserMsg(msgId) {
    if (!activeChatUser) return;
    let ok = true;
    if (window.showCustomConfirm) {
      ok = await window.showCustomConfirm({
        title: 'Delete Message?',
        message: 'This message will be removed from this customer conversation.',
        confirmText: 'Delete',
        type: 'danger'
      });
    }

    if (!ok) return;

    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (!sb) return;

    const ref = 'SUP-USR-' + activeChatUser.id.slice(0, 8);
    try {
      const { data } = await sb.from('requests').select('*').eq('ref_code', ref).maybeSingle();
      if (data && data.details && Array.isArray(data.details.messages)) {
        data.details.messages = data.details.messages.filter(m => m.id !== msgId);
        await sb.from('requests').update({ details: data.details }).eq('id', data.id);
        fetchAdminUserChatFeed(false);
      }
    } catch (err) {
      console.warn('Delete chat message error:', err);
    }
  }

  // Exports
  window.fetchAdminUsers = fetchAdminUsers;
  window.renderUsersTable = renderUsersTable;
  window.viewAdminUserDetails = viewAdminUserDetails;
  window.openAdminUserChat = openAdminUserChat;
  window.closeAdminUserChat = closeAdminUserChat;
  window.handleSendAdminUserReply = handleSendAdminUserReply;
  window.insertAdminQuickReply = insertAdminQuickReply;
  window.handleAdminDeleteUserMsg = handleAdminDeleteUserMsg;

  // Initialize on admin load
  document.addEventListener('DOMContentLoaded', () => {
    // Populate state filter if helper available
    const stateFilterEl = document.getElementById('userFilterState');
    if (stateFilterEl && window.populateStateSelect) {
      window.populateStateSelect(stateFilterEl, null, 'All States');
    }
  });

})();
