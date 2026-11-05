/**
 * NIJEDEE Admin Console - Artisan Management & Dispatch Monitoring
 * Handles artisan accreditation, profile credentials, application reviews,
 * and supervisor oversight of customer-artisan communication threads.
 */

(function () {
  'use strict';

  const ARTISAN_STORAGE_KEY = 'nijedee_active_artisan';
  const ARTISAN_PROFILE_STORE = 'nijedee_artisan_profiles';

  const DEFAULT_MASTER = {
    id: 'NJD-PLM-4561',
    name: 'Oluwasegun David Balodin',
    phone: '07085329909',
    alt_phone: '0805555569854',
    whatsapp: '07085329909',
    password: 'Oluwasegun123',
    trade: 'Master Plumber & Pipefitter',
    base: 'Badore Axis • Ajah',
    corridor: 'Badore, Addo, Langbasa, Ajah Central',
    avatar: 'assets/images/artisans/oluwasegun-balodin.jpg',
    skills: 'Concealed leak detection, burst pipes, PPR/PEX heat fusion, borehole plumbing, booster pumps.',
    is_on_duty: true
  };

  function getProfiles() {
    try {
      const raw = localStorage.getItem(ARTISAN_PROFILE_STORE);
      const profiles = raw ? JSON.parse(raw) : [DEFAULT_MASTER];
      return profiles.map(p => {
        delete p.rating;
        delete p.completed_jobs;
        delete p.active_jobs;
        return p;
      });
    } catch (e) {
      return [DEFAULT_MASTER];
    }
  }

  function saveProfiles(profiles) {
    localStorage.setItem(ARTISAN_PROFILE_STORE, JSON.stringify(profiles));
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Render Accredited Artisans Table
  function renderAccreditedArtisans() {
    const tbody = document.getElementById('accreditedArtisansTableBody');
    if (!tbody) return;

    const profiles = getProfiles();
    tbody.innerHTML = profiles.map(art => {
      const isSegun = art.id === 'NJD-PLM-4561';

      // Compute authentic dispatch metrics from live database requests
      const artisanReqs = (window.allRequests || []).filter(r => {
        const d = r.details || {};
        return d.artisan_id === art.id ||
               (d.assigned_artisan && d.assigned_artisan.includes(art.name)) ||
               (r.title && r.title.includes(art.name));
      });
      const completedCount = artisanReqs.filter(r => r.status === 'completed').length;
      const activeCount = artisanReqs.filter(r => r.status !== 'completed').length;

      return `
        <tr>
          <td style="width:60px;">
            <img src="${art.avatar || 'assets/images/artisans/oluwasegun-balodin.jpg'}" alt="${escapeHtml(art.name)}" style="width:48px; height:52px; border-radius:8px; object-fit:cover; border:1px solid #CBD5E1;">
          </td>
          <td>
            <div style="font-weight:800; color:var(--adm-navy);">${escapeHtml(art.name)}</div>
            <div style="font-size:0.75rem; color:#0B5ED7; font-weight:700;">ID: ${escapeHtml(art.id)}</div>
            ${isSegun ? '<span style="font-size:9px; background:#EFF6FF; color:#1D4ED8; font-weight:800; padding:1px 5px; border-radius:3px; text-transform:uppercase;">Master Artisan</span>' : ''}
          </td>
          <td>
            <div style="font-weight:700; color:#334155; font-size:0.86rem;">${escapeHtml(art.trade)}</div>
            <div style="font-size:0.75rem; color:var(--adm-muted);">${escapeHtml(art.base || 'Badore')}</div>
          </td>
          <td>
            <div style="font-size:0.86rem; font-weight:700; color:var(--adm-navy);">
              <a href="tel:${escapeHtml(art.phone)}" style="color:#0B5ED7; text-decoration:none;">${escapeHtml(art.phone)}</a>
            </div>
            <div style="font-size:0.75rem; color:#059669; font-weight:700;">Account Active</div>
          </td>
          <td>
            <div style="font-weight:700; color:var(--adm-navy); font-size:0.86rem;">${completedCount} completed</div>
            <div style="font-size:0.75rem; color:#059669; font-weight:600;">${activeCount} active</div>
          </td>
          <td>
            <span style="padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:800; ${art.is_on_duty !== false ? 'background:#ECFDF5; color:#059669;' : 'background:#F1F5F9; color:#64748B;'}">
              ${art.is_on_duty !== false ? 'On-Duty Dispatch' : 'Off-Duty'}
            </span>
          </td>
          <td style="white-space:nowrap;">
            <a href="artisan-portal.html" target="_blank" class="adm-btn adm-btn--outline adm-btn--sm" title="Log into dashboard as this artisan">
              Open Portal &rarr;
            </a>
          </td>
        </tr>
      `;
    }).join('');

    const countEl = document.getElementById('sidebarArtisansCount');
    const mobCountEl = document.getElementById('mobileSidebarArtisansCount');
    const kpiCountEl = document.getElementById('kpiAccreditedCount');
    if (countEl) countEl.textContent = profiles.length;
    if (mobCountEl) mobCountEl.textContent = profiles.length;
    if (kpiCountEl) kpiCountEl.textContent = profiles.length;
  }

  // Render Pending Applications
  function renderArtisanApplications(requests) {
    const tbody = document.getElementById('pendingArtisansTableBody');
    if (!tbody) return;

    const apps = (requests || []).filter(r => r.type === 'artisan_application');
    const kpiPending = document.getElementById('kpiPendingArtisansCount');
    if (kpiPending) kpiPending.textContent = apps.filter(a => a.status !== 'completed').length;

    if (apps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--adm-muted);">No artisan applications submitted yet.</td></tr>';
      return;
    }

    tbody.innerHTML = apps.map(app => {
      const d = app.details || {};
      const isApproved = app.status === 'completed';
      const images = Array.isArray(app.images) ? app.images : [];

      return `
        <tr>
          <td>
            <div style="font-weight:700; color:var(--adm-navy);">${escapeHtml(app.client_name)}</div>
            <div style="font-size:0.75rem; color:var(--adm-muted);">${escapeHtml(app.ref_code || '')}</div>
          </td>
          <td>
            <span style="display:inline-block; background:#EFF6FF; color:#1E5EFF; font-size:0.75rem; font-weight:700; padding:2px 7px; border-radius:4px; text-transform:uppercase;">
              ${escapeHtml(d.trade || 'Technician')}
            </span>
            <div style="font-size:0.75rem; color:var(--adm-muted); margin-top:2px;">Exp: ${escapeHtml(d.experience || '3+ years')}</div>
          </td>
          <td>
            <a href="tel:${escapeHtml(app.client_phone)}" style="color:#0B5ED7; text-decoration:none; font-weight:700; font-size:0.86rem;">${escapeHtml(app.client_phone)}</a>
            <div style="font-size:0.75rem; color:var(--adm-muted);">${escapeHtml(app.location || 'Badore / Ajah')}</div>
          </td>
          <td>
            <div style="font-size:0.82rem; font-weight:700; color:#334155;">Bank: ${escapeHtml(d.bank || 'Not provided')}</div>
            <div style="font-size:0.75rem; color:var(--adm-muted);">${escapeHtml(d.account || '')} &bull; ${escapeHtml(d.accountName || '')}</div>
          </td>
          <td>
            ${images.length > 0 ? `
              <div style="display:flex; gap:4px;">
                ${images.slice(0, 2).map(img => `
                  <img src="${escapeHtml(img)}" alt="Doc" style="width:36px; height:36px; object-fit:cover; border-radius:4px; border:1px solid #CBD5E1; cursor:zoom-in;" onclick="openLightbox('${escapeHtml(img)}')">
                `).join('')}
                ${images.length > 2 ? `<span style="font-size:10px; font-weight:700; color:var(--adm-muted); align-self:center;">+${images.length - 2}</span>` : ''}
              </div>
            ` : '<span style="color:var(--adm-muted); font-size:0.75rem;">None</span>'}
          </td>
          <td>
            <span style="padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:800; ${isApproved ? 'background:#ECFDF5; color:#059669;' : 'background:#FEF3C7; color:#D97706;'}">
              ${isApproved ? 'Accredited' : 'Pending Review'}
            </span>
          </td>
          <td style="white-space:nowrap;">
            ${!isApproved ? `
              <button type="button" class="adm-btn adm-btn--primary adm-btn--sm" onclick="approveArtisanApplication('${app.id}')">
                Approve &amp; Activate &rarr;
              </button>
            ` : `
              <span style="font-size:0.8rem; color:#059669; font-weight:700;">&check; Profile Active</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Approve artisan application and generate account profile
  async function approveArtisanApplication(appId) {
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (!sb) return;

    const { data: req, error } = await sb.from('requests').select('*').eq('id', appId).single();
    if (error || !req) {
      if (window.showCustomAlert) {
        window.showCustomAlert('Could not find application record.', 'Error', 'danger');
      }
      return;
    }

    const d = req.details || {};
    const name = req.client_name;
    const phone = req.client_phone || req.client_whatsapp || '08000000000';
    const trade = d.trade ? (d.trade.charAt(0).toUpperCase() + d.trade.slice(1)) : 'Certified Artisan';
    const newId = 'NJD-' + (d.trade ? d.trade.slice(0, 3).toUpperCase() : 'ART') + '-' + Math.floor(1000 + Math.random() * 9000);
    const assignedPassword = 'Oluwasegun123';

    // 1. Update request status to completed
    await sb.from('requests').update({
      status: 'completed',
      notes: `Approved & accredited by Admin on ${new Date().toLocaleDateString()}. ID: ${newId}. Initial password assigned.`
    }).eq('id', appId);

    // 2. Add profile to local profiles
    const profiles = getProfiles();
    const existingIdx = profiles.findIndex(p => p.phone === phone);
    const newProfile = {
      id: newId,
      name: name,
      phone: phone,
      whatsapp: req.client_whatsapp || phone,
      password: assignedPassword,
      trade: trade,
      base: req.location || 'Badore Axis • Ajah',
      corridor: d.areasList || req.location || 'Badore, Ajah, Sangotedo',
      avatar: (req.images && req.images[0]) || 'assets/images/artisans/oluwasegun-balodin.jpg',
      skills: d.experience ? `${d.experience} years practical experience. Equipped: ${d.toolStatus || 'Yes'}` : 'Accredited trade specialist.',
      bank: d.bank || '',
      accountNum: d.account || '',
      accountName: d.accountName || name,
      is_on_duty: true
    };

    if (existingIdx !== -1) {
      profiles[existingIdx] = newProfile;
    } else {
      profiles.push(newProfile);
    }
    saveProfiles(profiles);

    renderAccreditedArtisans();
    if (typeof window.fetchRequests === 'function') {
      window.fetchRequests();
    }

    if (window.showCustomAlert) {
      await window.showCustomAlert({
        title: 'Artisan Accredited & Activated',
        message: `Artisan "${name}" has been successfully approved and added to the NIJEDEE network!\n\n• Login Phone: ${phone}\n• Login Password: ${assignedPassword}\n• Artisan ID: ${newId}\n\nThe technician can now log in to the Artisan Portal (artisan-portal.html) and receive direct customer dispatches.`,
        type: 'success'
      });
    }
  }

  // Supervisor Dispatch Chat Handler in Admin Detail Modal
  async function handleAdminSendDispatchMessage(e) {
    e.preventDefault();
    const input = document.getElementById('adminDispatchChatInput');
    if (!input || !input.value.trim() || !window.currentActiveRequest) return;

    const text = input.value.trim();
    input.value = '';

    const req = window.currentActiveRequest;
    if (!req.details) req.details = {};
    if (!Array.isArray(req.details.messages)) req.details.messages = [];

    const newMsg = {
      sender: 'admin',
      sender_name: 'NIJEDEE Ops Supervisor',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    req.details.messages.push(newMsg);

    // Update DOM
    const list = document.getElementById('modalDispatchChatMessages');
    if (list) {
      const bubble = document.createElement('div');
      bubble.style.cssText = 'align-self:center; background:#FEF3C7; color:#92400E; border:1px solid #FDE68A; padding:8px 12px; border-radius:10px; font-size:0.82rem; max-width:88%; text-align:center;';
      bubble.innerHTML = `
        <div style="font-weight:800; font-size:0.72rem; text-transform:uppercase; margin-bottom:2px;">${escapeHtml(newMsg.sender_name)}</div>
        <div>${escapeHtml(newMsg.text)}</div>
        <div style="font-size:0.68rem; opacity:0.75; margin-top:3px;">${escapeHtml(newMsg.timestamp)}</div>
      `;
      list.appendChild(bubble);
      list.scrollTop = list.scrollHeight;
    }

    // Persist to Supabase
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (sb) {
      try {
        await sb.from('requests').update({ details: req.details }).eq('id', req.id);
      } catch (err) {
        console.warn('Sync admin supervisor message err:', err);
      }
    }
  }

  // Exports
  window.renderAccreditedArtisans = renderAccreditedArtisans;
  window.renderArtisanApplications = renderArtisanApplications;
  window.approveArtisanApplication = approveArtisanApplication;
  window.handleAdminSendDispatchMessage = handleAdminSendDispatchMessage;

  document.addEventListener('DOMContentLoaded', () => {
    renderAccreditedArtisans();
  });
})();
