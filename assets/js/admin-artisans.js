/**
 * NIJEDEE Admin Console - Artisan Management & Dispatch Monitoring
 * Handles artisan accreditation, profile credentials, candidate reviews,
 * and supervisor oversight of customer-artisan communication threads.
 *
 * STRICT RULE: ZERO Unicode Emojis. Clean SVG icons and accessible markup only.
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
    is_on_duty: true,
    is_hidden: false
  };

  let currentReviewingApp = null;
  let _showAllCandidateApps = false;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * Derive accredited artisan profiles strictly from authoritative Supabase requests
   * plus Master Artisan. Never diverges between PC, tablet, and mobile.
   */
  function getProfiles() {
    const profiles = [{ ...DEFAULT_MASTER }];
    const allReqs = Array.isArray(window.allRequests) ? window.allRequests : [];

    const accreditedApps = allReqs.filter(r => {
      const d = r.details || {};
      return r.type === 'artisan_application' && (r.status === 'accredited' || d.status === 'accredited');
    });

    accreditedApps.forEach(app => {
      const d = app.details || {};
      const phone = app.client_phone || app.client_whatsapp || '';
      const artId = d.artisan_id || ('NJD-ART-' + (app.id ? app.id.slice(0, 4) : 'tech'));

      // Deduplicate strictly by ID
      const exists = profiles.some(p => p.id === artId || p.app_id === app.id);
      if (!exists) {
        profiles.push({
          app_id: app.id,
          id: artId,
          name: app.client_name || 'Accredited Artisan',
          phone: phone,
          whatsapp: app.client_whatsapp || phone,
          password: d.assignedPassword || d.password || '123456',
          trade: d.trade ? (d.trade.charAt(0).toUpperCase() + d.trade.slice(1)) : 'Certified Artisan',
          base: app.location || 'Badore Axis - Ajah',
          corridor: (Array.isArray(d.areasList) ? d.areasList.join(', ') : d.areasList) || app.location || 'Badore, Ajah, Sangotedo',
          avatar: d.avatar || (app.images && app.images[0]) || 'assets/images/artisans/oluwasegun-balodin.jpg',
          skills: d.experience ? `${d.experience} practical experience. Equipped: ${d.toolStatus || 'Yes'}` : 'Accredited trade specialist.',
          bank: d.bank || '',
          accountNum: d.account || '',
          accountName: d.accountName || app.client_name,
          is_on_duty: true,
          is_hidden: d.is_hidden === true
        });
      }
    });

    return profiles;
  }

  /**
   * Render Accredited Field Artisans Table
   */
  function renderAccreditedArtisans() {
    const tbody = document.getElementById('accreditedArtisansTableBody');
    if (!tbody) return;

    const profiles = getProfiles();
    tbody.innerHTML = profiles.map(art => {
      const isSegun = art.id === 'NJD-PLM-4561';
      const isHidden = art.is_hidden === true;

      // Authentic dispatches from live requests
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
            <img src="${escapeHtml(art.avatar || 'assets/images/artisans/oluwasegun-balodin.jpg')}" alt="${escapeHtml(art.name)}" style="width:48px; height:52px; border-radius:8px; object-fit:cover; border:1px solid #CBD5E1; cursor:zoom-in;" title="Click to view full photo" onclick="window.openGlobalLightbox ? window.openGlobalLightbox('${escapeHtml(art.avatar || 'assets/images/artisans/oluwasegun-balodin.jpg')}', 0, '${escapeHtml(art.name)}') : null">
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
              <button type="button" class="adm-btn adm-btn--sm" style="${isHidden ? 'background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; font-weight:700;' : 'background:#FFF1F2; color:#E11D48; border:1px solid #FECDD3; font-weight:700;'}" onclick="window.toggleArtisanDirectoryVisibility('${escapeHtml(art.id)}', ${!isHidden})" title="${isHidden ? 'Show this artisan on public directory' : 'Hide this artisan from public directory'}">
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

  /**
   * Render Candidate Applications Table
   */
  function renderArtisanApplications(requests) {
    const tbody = document.getElementById('pendingArtisansTableBody');
    if (!tbody) return;

    const allApps = (requests || []).filter(r => r.type === 'artisan_application');
    const pendingApps = allApps.filter(a => {
      const d = a.details || {};
      return a.status !== 'accredited' && a.status !== 'declined' && d.status !== 'accredited' && d.status !== 'declined';
    });

    const kpiPending = document.getElementById('kpiPendingArtisansCount');
    if (kpiPending) kpiPending.textContent = pendingApps.length;

    const displayApps = _showAllCandidateApps ? allApps : pendingApps;

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
                  All ${allApps.length} candidate applications have been reviewed.
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

    tbody.innerHTML = displayApps.map(app => {
      const d = app.details || {};
      const isAccredited = app.status === 'accredited' || d.status === 'accredited';
      const isDeclined = app.status === 'declined' || d.status === 'declined';
      const images = Array.isArray(app.images) ? app.images : [];
      const isHidden = d.is_hidden === true;

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
              <div style="display:flex; gap:6px; align-items:center; cursor:pointer;" onclick="window.openCandidateDocsGallery('${app.id}', 0)" title="Click to view full photo gallery">
                ${images.slice(0, 2).map((img, i) => `
                  <img src="${escapeHtml(img)}" alt="Doc ${i + 1}" style="width:38px; height:38px; object-fit:cover; border-radius:6px; border:1px solid #CBD5E1; cursor:zoom-in; transition:transform 0.15s ease;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" onclick="event.stopPropagation(); window.openCandidateDocsGallery('${app.id}', ${i});">
                `).join('')}
                ${images.length > 2 ? `<span style="font-size:11px; font-weight:700; color:#0B5ED7; background:#EFF6FF; padding:3px 6px; border-radius:4px; border:1px solid #BFDBFE;">+${images.length - 2}</span>` : ''}
              </div>
            ` : '<span style="color:var(--adm-muted); font-size:0.75rem;">None</span>'}
          </td>
          <td>
            <span style="padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:800; ${isAccredited ? (isHidden ? 'background:#FEE2E2; color:#B91C1C;' : 'background:#ECFDF5; color:#059669;') : (isDeclined ? 'background:#FEE2E2; color:#991B1B;' : 'background:#FEF3C7; color:#D97706;')}">
              ${isAccredited ? (isHidden ? 'Accredited (Hidden)' : 'Accredited (Active)') : (isDeclined ? 'Declined' : 'Pending Review')}
            </span>
          </td>
          <td style="white-space:nowrap;">
            <div style="display:flex; gap:6px; align-items:center;">
              ${!isAccredited ? `
                <button type="button" class="adm-btn adm-btn--primary adm-btn--sm" style="background:#15803D; border-color:#15803D; font-weight:700;" onclick="window.openArtisanAccreditationModal('${app.id}')">
                  &check; Review &amp; Accredit &rarr;
                </button>
              ` : `
                <button type="button" class="adm-btn adm-btn--outline adm-btn--sm" onclick="window.openArtisanAccreditationModal('${app.id}')" title="Edit accreditation details or reset credentials">
                  Edit Credentials
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Open Review & Accreditation Modal
   */
  function openArtisanAccreditationModal(appId) {
    const app = (window.allRequests || []).find(r => String(r.id) === String(appId));
    if (!app) return;
    currentReviewingApp = app;

    const modal = document.getElementById('adminArtisanAccreditationModal');
    if (!modal) return;

    const d = app.details || {};
    const nameEl = document.getElementById('accreditModalName');
    const refEl = document.getElementById('accreditModalRef');
    const phoneEl = document.getElementById('accreditModalPhone');
    const waEl = document.getElementById('accreditModalWhatsapp');
    const avatarEl = document.getElementById('accreditModalAvatar');
    const tradeExpEl = document.getElementById('accreditModalTradeExp');
    const toolsEl = document.getElementById('accreditModalTools');
    const covEl = document.getElementById('accreditModalCoverage');
    const bankEl = document.getElementById('accreditModalBank');
    const docsList = document.getElementById('accreditModalDocsList');

    if (nameEl) nameEl.textContent = app.client_name || 'Candidate Artisan';
    if (refEl) refEl.textContent = app.ref_code || 'ART';
    if (phoneEl) phoneEl.textContent = app.client_phone || 'None';
    if (waEl) waEl.textContent = app.client_whatsapp || app.client_phone || 'None';

    const chosenAvatar = d.avatar || (app.images && app.images[0]) || 'assets/images/artisans/default-artisan.jpg';
    if (avatarEl) avatarEl.src = chosenAvatar;

    if (tradeExpEl) tradeExpEl.textContent = `${d.trade || 'Technician'} \u2022 ${d.experience || '3+ years'} exp`;
    if (toolsEl) toolsEl.textContent = d.toolStatus || 'Equipped';
    if (covEl) covEl.textContent = (Array.isArray(d.areasList) ? d.areasList.join(', ') : d.areasList) || app.location || 'Badore Axis';
    if (bankEl) bankEl.textContent = `${d.bank || 'Not provided'} - ${d.account || ''} (${d.accountName || app.client_name || ''})`;

    // Render docs thumbnails
    if (docsList) {
      const images = Array.isArray(app.images) ? app.images : [];
      if (images.length > 0) {
        docsList.innerHTML = images.map((img, i) => `
          <div style="text-align:center; cursor:pointer;" onclick="window.openCandidateDocsGallery('${app.id}', ${i})">
            <img src="${escapeHtml(img)}" alt="Doc ${i + 1}" style="width:68px; height:68px; object-fit:cover; border-radius:8px; border:1px solid #CBD5E1; transition:transform 0.15s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <div style="font-size:10px; color:#475569; font-weight:700; margin-top:3px;">Doc ${i + 1}</div>
          </div>
        `).join('');
      } else {
        docsList.innerHTML = '<span style="font-size:0.82rem; color:#64748B;">No attached documents submitted.</span>';
      }
    }

    // Input fields prefill
    const targetIdInput = document.getElementById('accreditTargetAppId');
    const idInput = document.getElementById('accreditArtisanIdInput');
    const tradeInput = document.getElementById('accreditArtisanTradeInput');
    const baseInput = document.getElementById('accreditArtisanBaseInput');
    const passInput = document.getElementById('accreditArtisanPasswordInput');

    if (targetIdInput) targetIdInput.value = app.id;

    // Generate trade-based ID e.g. NJD-PLM-xxxx or NJD-ART-xxxx
    let tradeCode = 'ART';
    if (d.trade) {
      const t = d.trade.toLowerCase();
      if (t.includes('plumb')) tradeCode = 'PLM';
      else if (t.includes('elect')) tradeCode = 'ELE';
      else if (t.includes('paint')) tradeCode = 'PNT';
      else if (t.includes('carp')) tradeCode = 'CAR';
      else if (t.includes('weld')) tradeCode = 'WLD';
      else if (t.includes('ac') || t.includes('hvac')) tradeCode = 'AC';
    }
    const defaultId = d.artisan_id || `NJD-${tradeCode}-${app.id ? app.id.slice(0, 4) : Math.floor(1000 + Math.random() * 9000)}`;

    if (idInput) idInput.value = defaultId;
    if (tradeInput) tradeInput.value = d.trade ? (d.trade.charAt(0).toUpperCase() + d.trade.slice(1)) : 'Certified Artisan';
    if (baseInput) baseInput.value = app.location || 'Badore Axis - Ajah';
    if (passInput) passInput.value = d.assignedPassword || d.password || ('NJD' + Math.floor(100000 + Math.random() * 900000));

    modal.classList.add('open');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
    document.body.style.overflow = 'hidden';
  }

  function closeArtisanAccreditationModal() {
    const modal = document.getElementById('adminArtisanAccreditationModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.setProperty('display', 'none', 'important');
      modal.style.setProperty('opacity', '0', 'important');
      modal.style.setProperty('visibility', 'hidden', 'important');
      modal.style.setProperty('pointer-events', 'none', 'important');
    }
    document.body.style.overflow = '';
    currentReviewingApp = null;
  }

  /**
   * Submit Artisan Accreditation Form
   */
  async function submitArtisanAccreditation(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentReviewingApp) return;

    const artisanId = (document.getElementById('accreditArtisanIdInput')?.value || '').trim();
    const trade = (document.getElementById('accreditArtisanTradeInput')?.value || '').trim();
    const base = (document.getElementById('accreditArtisanBaseInput')?.value || '').trim();
    const password = (document.getElementById('accreditArtisanPasswordInput')?.value || '').trim();

    if (!artisanId || !password) {
      if (window.showCustomAlert) {
        window.showCustomAlert({ title: 'Fields Required', message: 'Please provide both Artisan ID and Login Password.', type: 'info' });
      }
      return;
    }

    const btn = document.getElementById('confirmAccreditArtisanBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Accrediting Technician...';
    }

    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    const d = currentReviewingApp.details || {};
    d.status = 'accredited';
    d.artisan_id = artisanId;
    d.trade = trade;
    d.assignedPassword = password;
    d.is_hidden = false;
    d.accredited_at = new Date().toISOString();

    const updatePayload = {
      status: 'accredited',
      location: base,
      details: d,
      notes: `Approved & accredited by Admin on ${new Date().toLocaleDateString()}. Assigned ID: ${artisanId}.`
    };

    if (sb) {
      try {
        await sb.from('requests').update(updatePayload).eq('id', currentReviewingApp.id);
      } catch (err) {
        console.warn('Accreditation Supabase update err:', err);
      }
    }

    // Update in-memory allRequests
    const idx = (window.allRequests || []).findIndex(r => r.id === currentReviewingApp.id);
    if (idx !== -1) {
      window.allRequests[idx].status = 'accredited';
      window.allRequests[idx].location = base;
      window.allRequests[idx].details = d;
    }

    renderAccreditedArtisans();
    renderArtisanApplications(window.allRequests || []);

    const candidateName = currentReviewingApp.client_name || 'Artisan';
    const candidatePhone = currentReviewingApp.client_phone || '';
    const cleanPhone = candidatePhone.replace(/\D/g, '');

    closeArtisanAccreditationModal();

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Approve & Accredit Artisan';
    }

    // Prompt to send WhatsApp Notification to candidate
    const waMsg = encodeURIComponent(
      `Congratulations ${candidateName}!\n` +
      `Your NIJEDEE Artisan Network application has been reviewed, ACCREDITED, and ACTIVATED.\n\n` +
      `Your Assigned Technician ID: ${artisanId}\n` +
      `Designation: ${trade}\n` +
      `Operational Base: ${base}\n\n` +
      `Portal Access Credentials:\n` +
      `Login URL: https://nijedee.com/artisan-portal.html\n` +
      `Registered Phone: ${candidatePhone}\n` +
      `Portal Password: ${password}\n\n` +
      `You are now active on the NIJEDEE directory and eligible for customer dispatches across Lagos.\n` +
      `Welcome to the team!`
    );
    const waUrl = `https://wa.me/234${cleanPhone.replace(/^0/, '')}?text=${waMsg}`;

    if (window.showCustomConfirm) {
      const wantSend = await window.showCustomConfirm({
        title: 'Artisan Successfully Accredited',
        message: `Technician "${candidateName}" is now fully accredited (ID: ${artisanId}).\n\nWould you like to send their credentials and portal login link directly via WhatsApp?`,
        confirmText: 'Send WhatsApp Notification',
        cancelText: 'Done',
        type: 'success'
      });
      if (wantSend) {
        window.open(waUrl, '_blank');
      }
    }
  }

  /**
   * Decline Candidate Application
   */
  async function declineCandidateApplication() {
    if (!currentReviewingApp) return;

    let confirmed = false;
    if (window.showCustomConfirm) {
      confirmed = await window.showCustomConfirm({
        title: 'Decline Application?',
        message: `Are you sure you want to decline the artisan application for ${currentReviewingApp.client_name}?`,
        confirmText: 'Decline Application',
        type: 'danger'
      });
    }

    if (!confirmed) return;

    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    const d = currentReviewingApp.details || {};
    d.status = 'declined';

    if (sb) {
      try {
        await sb.from('requests').update({
          status: 'declined',
          details: d,
          notes: `Declined by Admin on ${new Date().toLocaleDateString()}`
        }).eq('id', currentReviewingApp.id);
      } catch (err) {
        console.warn('Decline error:', err);
      }
    }

    currentReviewingApp.status = 'declined';
    currentReviewingApp.details = d;

    renderAccreditedArtisans();
    renderArtisanApplications(window.allRequests || []);
    closeArtisanAccreditationModal();

    if (window.showToast) {
      window.showToast(`Application for ${currentReviewingApp.client_name} declined.`);
    }
  }

  /**
   * Toggle hiding / unhiding artisan from public directory
   */
  async function toggleArtisanDirectoryVisibility(artId, hide) {
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    let targetName = 'Artisan';

    // Find in allRequests
    const match = (window.allRequests || []).find(r => {
      const d = r.details || {};
      return d.artisan_id === artId || String(r.id) === String(artId);
    });

    if (match) {
      const d = match.details || {};
      d.is_hidden = hide;
      targetName = match.client_name || 'Artisan';
      if (sb) {
        try {
          await sb.from('requests').update({ details: d }).eq('id', match.id);
        } catch (e) {
          console.warn('Sync hide to Supabase err:', e);
        }
      }
    }

    renderAccreditedArtisans();
    renderArtisanApplications(window.allRequests || []);

    if (window.showCustomAlert) {
      window.showCustomAlert({
        title: hide ? 'Artisan Hidden' : 'Artisan Visible',
        message: `${targetName} is now ${hide ? 'HIDDEN from' : 'VISIBLE on'} the public directory (artisans.html).`,
        type: hide ? 'warning' : 'success'
      });
    }
  }

  // Gallery viewer for candidate documents / pictures
  function openCandidateDocsGallery(appId, startIdx = 0) {
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
  }

  function toggleCandidateAppsView() {
    _showAllCandidateApps = !_showAllCandidateApps;
    renderArtisanApplications(window.allRequests || []);
  }

  // Exports
  window.renderAccreditedArtisans = renderAccreditedArtisans;
  window.renderArtisanApplications = renderArtisanApplications;
  window.openArtisanAccreditationModal = openArtisanAccreditationModal;
  window.closeArtisanAccreditationModal = closeArtisanAccreditationModal;
  window.submitArtisanAccreditation = submitArtisanAccreditation;
  window.declineCandidateApplication = declineCandidateApplication;
  window.toggleArtisanDirectoryVisibility = toggleArtisanDirectoryVisibility;
  window.openCandidateDocsGallery = openCandidateDocsGallery;
  window.toggleCandidateAppsView = toggleCandidateAppsView;

  document.addEventListener('DOMContentLoaded', () => {
    renderAccreditedArtisans();
  });
})();
