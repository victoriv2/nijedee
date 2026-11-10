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
    alt_phone: '',
    whatsapp: '07085329909',
    password: 'Oluwasegun123',
    trade: 'Master Plumber & Pipefitter',
    base: 'Badore Axis - Ajah',
    corridor: 'Badore, Addo, Langbasa, Ajah Central',
    avatar: 'assets/images/artisans/oluwasegun-balodin.jpg',
    skills: 'Concealed leak detection, burst pipes, PPR/PEX heat fusion, borehole plumbing, booster pumps.',
    is_on_duty: true
  };

  function syncProfilesFromRequests(profiles) {
    if (!Array.isArray(window.allRequests)) return profiles;
    const accreditedApps = window.allRequests.filter(function(r) {
      return r.type === 'artisan_application' && (r.status === 'accredited' || r.status === 'completed' || (r.details && r.details.status === 'accredited'));
    });
    var changed = false;
    accreditedApps.forEach(function(app) {
      var d = app.details || {};
      var phone = app.client_phone || app.client_whatsapp || '';
      var cleanPhone = phone.replace(/\D/g, '');
      var artId = d.artisan_id || ('NJD-ART-' + (app.id ? app.id.slice(0, 4) : 'app'));
      var existing = profiles.find(function(p) {
        var pClean = (p.phone || '').replace(/\D/g, '');
        return (cleanPhone && pClean && pClean.endsWith(cleanPhone.slice(-8))) || p.id === artId || p.id === app.id;
      });

      if (!existing) {
        profiles.push({
          id: artId,
          name: app.client_name,
          phone: phone,
          whatsapp: app.client_whatsapp || phone,
          password: d.assignedPassword || d.password || '123456',
          trade: d.trade ? (d.trade.charAt(0).toUpperCase() + d.trade.slice(1)) : 'Certified Artisan',
          base: app.location || 'Badore Axis - Ajah',
          corridor: d.areasList || app.location || 'Badore, Ajah, Sangotedo',
          avatar: d.avatar || (app.images && app.images[0]) || 'assets/images/artisans/oluwasegun-balodin.jpg',
          skills: d.experience ? (d.experience + ' years practical experience. Equipped: ' + (d.toolStatus || 'Yes')) : 'Accredited trade specialist.',
          bank: d.bank || '',
          accountNum: d.account || '',
          accountName: d.accountName || app.client_name,
          is_on_duty: true,
          is_hidden: d.is_hidden === true
        });
        changed = true;
      }
    });

    if (changed) {
      saveProfiles(profiles);
    }
    return profiles;
  }

  function getProfiles() {
    var profiles = [DEFAULT_MASTER];
    try {
      var raw = localStorage.getItem(ARTISAN_PROFILE_STORE);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) profiles = parsed;
      }
    } catch (e) {}

    // Synchronize with live Supabase requests so mobile, tablet and desktop never diverge
    profiles = syncProfilesFromRequests(profiles);

    return profiles.map(function(p) {
      delete p.rating;
      delete p.completed_jobs;
      delete p.active_jobs;
      return p;
    });
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
      const isHidden = art.is_hidden === true;

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
            <img src="${art.avatar || 'assets/images/artisans/oluwasegun-balodin.jpg'}" alt="${escapeHtml(art.name)}" style="width:48px; height:52px; border-radius:8px; object-fit:cover; border:1px solid #CBD5E1; cursor:zoom-in;" title="Click to view full photo" onclick="window.openGlobalLightbox ? window.openGlobalLightbox('${escapeHtml(art.avatar || 'assets/images/artisans/oluwasegun-balodin.jpg')}', 0, '${escapeHtml(art.name)}') : null">
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
            <div style="font-size:0.75rem; color:#059669; font-weight:700;">Password Configured</div>
          </td>
          <td>
            <div style="font-weight:700; color:var(--adm-navy); font-size:0.86rem;">${completedCount} completed</div>
            <div style="font-size:0.75rem; color:#059669; font-weight:600;">${activeCount} active</div>
          </td>
          <td>
            <span style="padding:4px 9px; border-radius:4px; font-size:0.75rem; font-weight:800; display:inline-flex; align-items:center; gap:5px; ${isHidden ? 'background:#FEE2E2; color:#B91C1C;' : 'background:#ECFDF5; color:#059669;'}">
              ${isHidden ? '&bull; Hidden from Public' : '&bull; Visible on Directory'}
            </span>
          </td>
          <td style="white-space:nowrap;">
            <div style="display:flex; gap:6px; align-items:center;">
              <button type="button" class="adm-btn adm-btn--sm" style="${isHidden ? 'background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; font-weight:700;' : 'background:#FFF1F2; color:#E11D48; border:1px solid #FECDD3; font-weight:700;'}" onclick="toggleArtisanDirectoryVisibility('${art.id}', ${!isHidden})" title="${isHidden ? 'Show this artisan on public directory' : 'Hide this artisan from public directory'}">
                ${isHidden ? 'Show on Directory' : 'Hide from Directory'}
              </button>
              <a href="artisan-portal.html" target="_blank" class="adm-btn adm-btn--outline adm-btn--sm" title="Log into dashboard as this artisan">
                Open Portal &rarr;
              </a>
            </div>
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

  // Gallery viewer for candidate documents / pictures
  window.openCandidateDocsGallery = function(appId, startIdx = 0) {
    const app = (window.allRequests || []).find(r => String(r.id) === String(appId));
    if (!app) return;
    let images = Array.isArray(app.images) ? [...app.images] : [];
    if (!images.length && app.details && app.details.avatar) {
      images.push(app.details.avatar);
    }
    if (!images.length) return;
    const items = images.map((img, i) => ({
      src: img,
      caption: `${app.client_name || 'Artisan Application'} \u2022 Document ${i + 1} of ${images.length}`
    }));
    if (window.openGlobalLightbox) {
      window.openGlobalLightbox(items, startIdx, app.client_name || 'Artisan Application Documents');
    } else if (window.openLightbox) {
      window.openLightbox(items, startIdx, app.client_name || 'Artisan Application Documents');
    }
  };

  // Render Pending Applications
  let _showAllCandidateApps = false;
  window.toggleCandidateAppsView = function() {
    _showAllCandidateApps = !_showAllCandidateApps;
    renderArtisanApplications(window.allRequests || []);
  };

  function renderArtisanApplications(requests) {
    const tbody = document.getElementById('pendingArtisansTableBody');
    if (!tbody) return;

    const allApps = (requests || []).filter(r => r.type === 'artisan_application');
    const pendingApps = allApps.filter(a => a.status !== 'completed' && a.status !== 'accredited');
    const kpiPending = document.getElementById('kpiPendingArtisansCount');
    if (kpiPending) kpiPending.textContent = pendingApps.length;

    // Determine which applications to show
    const displayApps = _showAllCandidateApps ? allApps : pendingApps;

    // Header action button toggle text
    const toggleBtn = document.getElementById('toggleCandidateViewBtn');
    if (toggleBtn) {
      toggleBtn.textContent = _showAllCandidateApps ? `Show Pending Only (${pendingApps.length})` : `View All History (${allApps.length})`;
    }

    if (displayApps.length === 0) {
      if (allApps.length > 0 && !_showAllCandidateApps) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; padding:32px 20px; color:var(--adm-muted);">
              <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#059669" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <div style="font-weight:800; color:var(--adm-navy); font-size:0.95rem;">No Pending Candidate Applications</div>
                <div style="font-size:0.82rem; color:#64748B; max-width:480px; line-height:1.4;">
                  All ${allApps.length} candidate applications have been reviewed and accredited into the active directory. (0 pending review).
                </div>
                <button type="button" class="adm-btn adm-btn--outline adm-btn--sm" onclick="window.toggleCandidateAppsView()" style="margin-top:6px;">
                  View All Submissions History (${allApps.length})
                </button>
              </div>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--adm-muted);">No candidate applications found.</td></tr>';
      }
      return;
    }

    const profiles = getProfiles();

    tbody.innerHTML = displayApps.map(app => {
      const d = app.details || {};
      const isApproved = app.status === 'completed' || app.status === 'accredited';
      const images = Array.isArray(app.images) ? app.images : [];
      const matchedProfile = profiles.find(p => p.phone === app.client_phone || p.id === app.id || (p.details && p.details.artisan_id === app.id));
      const isHidden = matchedProfile ? (matchedProfile.is_hidden === true) : (d.is_hidden === true);

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
              <div style="display:flex; gap:6px; align-items:center; cursor:pointer;" onclick="openCandidateDocsGallery('${app.id}', 0)" title="Click to view full photo gallery">
                ${images.slice(0, 2).map((img, i) => `
                  <img src="${escapeHtml(img)}" alt="Doc ${i + 1}" style="width:38px; height:38px; object-fit:cover; border-radius:6px; border:1px solid #CBD5E1; cursor:zoom-in; transition:transform 0.15s ease;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" onclick="event.stopPropagation(); openCandidateDocsGallery('${app.id}', ${i});">
                `).join('')}
                ${images.length > 2 ? `<span style="font-size:11px; font-weight:700; color:#0B5ED7; background:#EFF6FF; padding:3px 6px; border-radius:4px; border:1px solid #BFDBFE;">+${images.length - 2}</span>` : ''}
              </div>
            ` : '<span style="color:var(--adm-muted); font-size:0.75rem;">None</span>'}
          </td>
          <td>
            <span style="padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:800; ${isApproved ? (isHidden ? 'background:#FEE2E2; color:#B91C1C;' : 'background:#ECFDF5; color:#059669;') : 'background:#FEF3C7; color:#D97706;'}">
              ${isApproved ? (isHidden ? 'Accredited (Hidden)' : 'Accredited (Active)') : 'Pending Review'}
            </span>
          </td>
          <td style="white-space:nowrap;">
            <div style="display:flex; gap:6px; align-items:center;">
              ${!isApproved ? `
                <button type="button" class="adm-btn adm-btn--primary adm-btn--sm" style="background:#15803D; border-color:#15803D; font-weight:700;" onclick="approveArtisanApplication('${app.id}')">
                  &check; Approve &amp; Activate &rarr;
                </button>
              ` : `
                <button type="button" class="adm-btn adm-btn--sm" style="${isHidden ? 'background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; font-weight:700;' : 'background:#FFF1F2; color:#E11D48; border:1px solid #FECDD3; font-weight:700;'}" onclick="toggleArtisanDirectoryVisibility('${matchedProfile ? matchedProfile.id : app.id}', ${!isHidden})" title="${isHidden ? 'Show on public directory' : 'Hide from public directory'}">
                  ${isHidden ? 'Show on Directory' : 'Hide from Directory'}
                </button>
                <button type="button" class="adm-btn adm-btn--outline adm-btn--sm" onclick="approveArtisanApplication('${app.id}')" title="Re-sync or re-accredit account profile">
                  Re-Approve
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Toggle hiding / unhiding artisan from public directory
  window.toggleArtisanDirectoryVisibility = async function(artId, hide) {
    const profiles = getProfiles();
    let art = profiles.find(p => p.id === artId || p.phone === artId);
    if (!art) {
      const app = (window.allRequests || []).find(r => String(r.id) === String(artId));
      if (app) {
        art = profiles.find(p => p.phone === app.client_phone);
      }
    }
    if (art) {
      art.is_hidden = hide;
      saveProfiles(profiles);
    }

    // Sync to Supabase
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (sb) {
      try {
        const { data } = await sb.from('requests').select('*').eq('type', 'artisan_application');
        if (data) {
          const match = data.find(r => String(r.id) === String(artId) || (art && r.client_phone === art.phone));
          if (match) {
            const d = match.details || {};
            d.is_hidden = hide;
            await sb.from('requests').update({ details: d }).eq('id', match.id);
          }
        }
      } catch (e) {
        console.warn('Sync hide to Supabase err:', e);
      }
    }

    renderAccreditedArtisans();
    renderArtisanApplications(window.allRequests || []);

    if (window.showCustomAlert) {
      window.showCustomAlert({
        title: hide ? 'Artisan Hidden' : 'Artisan Visible',
        message: `${art ? art.name : 'Artisan'} is now ${hide ? 'HIDDEN from' : 'VISIBLE on'} the public directory (artisans.html).`,
        type: hide ? 'warning' : 'success'
      });
    }
  };

  // Approve artisan application and generate account profile
  async function approveArtisanApplication(appId) {
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (!sb) return;

    const { data: req, error } = await sb.from('requests').select('*').eq('id', appId).single();
    if (error || !req) {
      if (window.showCustomAlert) {
        window.showCustomAlert({ title: 'Application Record Not Found', message: 'Could not find application record.', type: 'danger' });
      }
      return;
    }

    const d = req.details || {};
    const name = req.client_name;
    const phone = req.client_phone || req.client_whatsapp || '';
    const trade = d.trade ? (d.trade.charAt(0).toUpperCase() + d.trade.slice(1)) : 'Certified Artisan';
    const newId = d.artisan_id || ('NJD-' + (d.trade ? d.trade.slice(0, 3).toUpperCase() : 'ART') + '-' + Math.floor(1000 + Math.random() * 9000));
    
    // Pick the artisan's chosen password or clean generated PIN
    const assignedPassword = d.password || d.assignedPassword || ('NJD' + Math.floor(100000 + Math.random() * 900000));

    // Pick chosen avatar
    const chosenAvatar = d.avatar || (req.images && req.images[0]) || 'assets/images/artisans/oluwasegun-balodin.jpg';

    // 1. Update request status to accredited in Supabase
    d.artisan_id = newId;
    d.status = 'accredited';
    d.assignedPassword = assignedPassword;
    d.is_hidden = false;

    await sb.from('requests').update({
      status: 'accredited',
      details: d,
      notes: `Approved & accredited by Admin on ${new Date().toLocaleDateString()}. ID: ${newId}. Chosen password configured.`
    }).eq('id', appId);

    // 2. Add or update profile in local storage
    const profiles = getProfiles();
    const existingIdx = profiles.findIndex(p => p.phone === phone || p.id === newId);
    const newProfile = {
      id: newId,
      name: name,
      phone: phone,
      whatsapp: req.client_whatsapp || phone,
      password: assignedPassword,
      trade: trade,
      base: req.location || 'Badore Axis • Ajah',
      corridor: d.areasList || req.location || 'Badore, Ajah, Sangotedo',
      avatar: chosenAvatar,
      skills: d.experience ? `${d.experience} years practical experience. Equipped: ${d.toolStatus || 'Yes'}` : 'Accredited trade specialist.',
      bank: d.bank || '',
      accountNum: d.account || '',
      accountName: d.accountName || name,
      is_on_duty: true,
      is_hidden: false
    };

    if (existingIdx !== -1) {
      profiles[existingIdx] = Object.assign(profiles[existingIdx], newProfile);
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
        message: `Artisan "${name}" is now approved and active on NIJEDEE!\n\n• Login Phone: ${phone}\n• Login Password: ${assignedPassword}\n• Artisan ID: ${newId}\n• Directory Status: Visible on artisans.html\n\nThe artisan can now log in to the Artisan Portal (artisan-portal.html) with their phone number and chosen password.`,
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
