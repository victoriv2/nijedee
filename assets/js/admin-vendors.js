/**
 * NIJEDEE Admin Console - Shop Vendor & Merchant Management
 * Handles store vendor accreditation, profile credentials, candidate reviews,
 * and live catalog synchronization for merchant-posted products.
 */

(function () {
  'use strict';

  const VENDOR_STORAGE_KEY = 'nijedee_active_vendor';
  const VENDOR_PROFILE_STORE = 'nijedee_vendor_profiles';

  function getVendorProfiles() {
    var profiles = [];
    try {
      var raw = localStorage.getItem(VENDOR_PROFILE_STORE);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) profiles = parsed;
      }
    } catch (e) {}

    // Purge any legacy test/dummy vendors from memory and localStorage
    profiles = profiles.filter(function(p) {
      if (!p) return false;
      if (p.id === 'NJD-VND-1001' || p.ref_code === 'VND-2026-1001') return false;
      if ((p.name || '').includes('Ade & Sons') || (p.store_name || '').includes('Ade & Sons')) return false;
      if (p.phone === '08012345678') return false;
      return true;
    });

    try {
      localStorage.setItem(VENDOR_PROFILE_STORE, JSON.stringify(profiles));
    } catch (e) {}

    // Synchronize with allRequests from Supabase if available
    if (Array.isArray(window.allRequests)) {
      var vendorApps = window.allRequests.filter(function(r) {
        return r.type === 'vendor_application' && (r.status === 'accredited' || r.status === 'completed' || (r.details && r.details.status === 'accredited'));
      });

      var changed = false;
      vendorApps.forEach(function(app) {
        var d = app.details || {};
        var phone = app.client_phone || app.client_whatsapp || '';
        var cleanPhone = phone.replace(/\D/g, '');
        var vId = d.id || d.vendor_id || ('NJD-VND-' + (app.id ? app.id.slice(0, 4) : 'app'));

        var existing = profiles.find(function(p) {
          var pClean = (p.phone || '').replace(/\D/g, '');
          return (cleanPhone && pClean && pClean.endsWith(cleanPhone.slice(-8))) || p.id === vId || p.ref_code === app.ref_code;
        });

        if (!existing) {
          profiles.push({
            id: vId,
            ref_code: app.ref_code || ('VND-2026-' + Math.floor(1000 + Math.random() * 9000)),
            name: d.store_name || app.client_name || 'Merchant Partner',
            store_name: d.store_name || app.client_name || 'Merchant Partner',
            owner_name: d.owner_name || 'Manager',
            phone: phone,
            whatsapp: app.client_whatsapp || phone,
            password: d.password || d.assignedPassword || '123456',
            corridor: app.location || d.corridor || 'Badore Axis',
            address: app.address || d.address || 'Badore, Ajah',
            categories: d.categories || ['materials'],
            status: 'accredited',
            is_accredited: true,
            is_active: d.is_active !== false,
            created_at: app.created_at
          });
          changed = true;
        }
      });

      if (changed) {
        saveVendorProfiles(profiles);
      }
    }

    return profiles;
  }

  function saveVendorProfiles(profiles) {
    try {
      localStorage.setItem(VENDOR_PROFILE_STORE, JSON.stringify(profiles));
    } catch (e) {}
  }

  // Renders accredited merchants table
  function renderAccreditedVendors() {
    var tbody = document.getElementById('accreditedVendorsTableBody');
    if (!tbody) return;

    var profiles = getVendorProfiles();
    var allProds = window.allProducts || [];

    // Filter to accredited merchants
    var accredited = profiles.filter(function(p) {
      return p.status === 'accredited' || p.is_accredited === true;
    });

    // Update KPI count
    var kpiAccredited = document.getElementById('kpiAccreditedVendorsCount');
    if (kpiAccredited) kpiAccredited.textContent = accredited.length;

    if (accredited.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:45px 20px; color:var(--adm-muted);"><div style="font-weight:700; color:var(--adm-navy); margin-bottom:4px; font-size:0.95rem;">No accredited shop vendors found yet</div><p style="font-size:0.84rem; margin:0; color:#64748B;">Registered store applications submitted through become-vendor.html will appear under \'Candidate Applications\' below for admin accreditation.</p></td></tr>';
      return;
    }

    tbody.innerHTML = accredited.map(function(v) {
      var cleanPhone = (v.phone || '').replace(/\D/g, '');
      var storeName = v.store_name || v.name || 'Merchant Store';
      var vId = v.id || 'NJD-VND-00';

      // Count products belonging to this vendor
      var prodCount = allProds.filter(function(p) {
        if (p.vendor_id && p.vendor_id === vId) return true;
        if (p.vendor_phone && cleanPhone && p.vendor_phone.replace(/\D/g, '').endsWith(cleanPhone.slice(-8))) return true;
        var kw = (p.keywords || '').toLowerCase();
        if (cleanPhone && kw.includes(cleanPhone.slice(-8))) return true;
        if (p.brand && p.brand.toLowerCase().trim() === storeName.toLowerCase().trim()) return true;
        return false;
      }).length;

      var isActive = v.is_active !== false;

      return `
        <tr>
          <td>
            <div style="width:42px; height:42px; border-radius:8px; background:#EFF6FF; color:#1E5EFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; border:1px solid #DBEAFE;">
              ${escapeHtml(storeName.charAt(0).toUpperCase())}
            </div>
          </td>
          <td>
            <div style="font-weight:700; color:var(--adm-navy);">${escapeHtml(storeName)}</div>
            <div style="font-size:0.75rem; color:var(--adm-muted);">${escapeHtml(vId)} &bull; ${escapeHtml(v.ref_code || '')}</div>
          </td>
          <td>
            <div style="font-weight:600; color:#334155; font-size:0.85rem;">${escapeHtml(v.owner_name || 'Store Owner')}</div>
            <div style="font-size:0.75rem; color:var(--adm-muted);">${escapeHtml(v.corridor || 'Badore Axis')}</div>
          </td>
          <td>
            <a href="tel:${escapeHtml(v.phone)}" style="color:#0B5ED7; text-decoration:none; font-weight:700; font-size:0.86rem;">${escapeHtml(v.phone)}</a>
            <div style="font-size:0.75rem; color:var(--adm-muted);">Password Configured</div>
          </td>
          <td>
            <span style="font-weight:800; font-size:0.95rem; color:#1E5EFF;">${prodCount}</span>
            <span style="font-size:0.75rem; color:var(--adm-muted);"> listed</span>
          </td>
          <td>
            <span style="display:inline-flex; align-items:center; gap:5px; font-size:0.78rem; font-weight:700; color:${isActive ? '#15803D' : '#94A3B8'};">
              <span style="width:8px; height:8px; border-radius:50%; background:${isActive ? '#10B981' : '#CBD5E1'};"></span>
              <span>${isActive ? 'Active Store' : 'Suspended'}</span>
            </span>
          </td>
          <td style="white-space:nowrap; text-align:right;">
            <button type="button" class="adm-btn adm-btn--outline adm-btn--sm" onclick="window.toggleVendorActive('${vId}', ${!isActive})" style="margin-right:6px;">
              ${isActive ? 'Suspend' : 'Activate'}
            </button>
            <a href="vendor-portal.html" target="_blank" class="adm-btn adm-btn--primary adm-btn--sm" title="Log in as merchant">
              <span>Open Portal</span>
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Renders candidate vendor applications
  function renderVendorApplications(requests) {
    var tbody = document.getElementById('candidateVendorsTableBody');
    if (!tbody) return;

    var reqList = Array.isArray(requests) ? requests : (window.allRequests || []);
    var vendorApps = reqList.filter(function(r) {
      return r.type === 'vendor_application';
    });

    // Update pending KPI
    var pendingCount = vendorApps.filter(function(a) {
      return a.status !== 'accredited' && a.status !== 'completed' && (!a.details || a.details.status !== 'accredited');
    }).length;

    var kpiPending = document.getElementById('kpiPendingVendorsCount');
    if (kpiPending) kpiPending.textContent = pendingCount;

    // Update nav sidebar badge
    var sbBadge = document.getElementById('sidebarVendorsCount');
    var mbBadge = document.getElementById('mobileSidebarVendorsCount');
    if (sbBadge) {
      sbBadge.textContent = pendingCount;
      sbBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
    if (mbBadge) {
      mbBadge.textContent = pendingCount;
      mbBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }

    if (vendorApps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--adm-muted);">No candidate store applications recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = vendorApps.map(function(app) {
      var d = app.details || {};
      var isApproved = app.status === 'accredited' || app.status === 'completed' || d.status === 'accredited';
      var storeName = d.store_name || app.client_name || 'Candidate Store';
      var owner = d.owner_name || 'Store Owner';
      var phone = app.client_phone || app.client_whatsapp || '';
      var corridor = app.location || d.corridor || 'Badore / Ajah';
      var cats = Array.isArray(d.categories) ? d.categories.join(', ') : (d.categories || 'Materials');
      var images = Array.isArray(app.images) ? app.images : [];

      return `
        <tr>
          <td>
            <div style="font-weight:700; color:var(--adm-navy);">${escapeHtml(storeName)}</div>
            <div style="font-size:0.75rem; color:var(--adm-muted);">${escapeHtml(owner)} &bull; ${escapeHtml(app.ref_code || '')}</div>
          </td>
          <td>
            <span style="display:inline-block; background:#EFF6FF; color:#1E5EFF; font-size:0.75rem; font-weight:700; padding:2px 7px; border-radius:4px;">
              ${escapeHtml(cats)}
            </span>
            <div style="font-size:0.75rem; color:var(--adm-muted); margin-top:2px;">${escapeHtml(corridor)}</div>
          </td>
          <td>
            <a href="tel:${escapeHtml(phone)}" style="color:#0B5ED7; text-decoration:none; font-weight:700; font-size:0.86rem;">${escapeHtml(phone)}</a>
            <div style="font-size:0.75rem; color:var(--adm-muted);">${escapeHtml(app.address || 'Address provided')}</div>
          </td>
          <td>
            <div style="font-size:0.82rem; font-weight:600; color:#334155;">CAC: ${escapeHtml(d.cac_number || 'Unregistered / Enterprise')}</div>
            <div style="font-size:0.75rem; color:var(--adm-muted);">${escapeHtml(d.years_active || '3+ years')} in business</div>
          </td>
          <td>
            ${images.length > 0 ? `
              <div style="display:flex; gap:6px; align-items:center;">
                ${images.slice(0, 2).map(function(img, i) {
                  return `<img src="${escapeHtml(img)}" alt="Store Photo" style="width:38px; height:38px; object-fit:cover; border-radius:6px; border:1px solid #CBD5E1; cursor:pointer;" onclick="window.open('${escapeHtml(img)}', '_blank')">`;
                }).join('')}
              </div>
            ` : '<span style="color:var(--adm-muted); font-size:0.75rem;">None</span>'}
          </td>
          <td>
            <span class="adm-badge adm-badge--${isApproved ? 'active' : 'pending'}">
              ${isApproved ? 'Accredited' : 'Pending Review'}
            </span>
          </td>
          <td style="white-space:nowrap; text-align:right;">
            ${!isApproved ? `
              <button type="button" class="adm-btn adm-btn--primary adm-btn--sm" onclick="window.approveVendorApplication('${app.id}')">
                Approve &amp; Activate
              </button>
            ` : `
              <span style="font-size:0.78rem; font-weight:700; color:#15803D;">Accredited Merchant</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Approve vendor application and activate account
  async function approveVendorApplication(appId) {
    var sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (!sb) return;

    var { data: req, error } = await sb.from('requests').select('*').eq('id', appId).single();
    if (error || !req) {
      if (window.showCustomAlert) {
        window.showCustomAlert({ title: 'Application Record Not Found', message: 'Could not find store application record.', type: 'danger' });
      }
      return;
    }

    var d = req.details || {};
    var storeName = d.store_name || req.client_name || 'Store Merchant';
    var phone = req.client_phone || req.client_whatsapp || '';
    var newVendorId = d.id || d.vendor_id || ('NJD-VND-' + Math.floor(1000 + Math.random() * 9000));
    var password = d.password || d.assignedPassword || '123456';

    // 1. Update Supabase request status
    d.id = newVendorId;
    d.vendor_id = newVendorId;
    d.status = 'accredited';
    d.is_accredited = true;
    d.is_active = true;

    await sb.from('requests').update({
      status: 'accredited',
      details: d,
      notes: `Store approved & accredited by Admin on ${new Date().toLocaleDateString()}. Portal login enabled.`
    }).eq('id', appId);

    // 2. Sync to local profiles
    var profiles = getVendorProfiles();
    var cleanPhone = phone.replace(/\D/g, '');
    var existing = profiles.find(function(p) {
      var pClean = (p.phone || '').replace(/\D/g, '');
      return (cleanPhone && pClean && pClean.endsWith(cleanPhone.slice(-8))) || p.id === newVendorId;
    });

    if (existing) {
      existing.status = 'accredited';
      existing.is_accredited = true;
      existing.is_active = true;
    } else {
      profiles.push({
        id: newVendorId,
        ref_code: req.ref_code,
        name: storeName,
        store_name: storeName,
        owner_name: d.owner_name || 'Manager',
        phone: phone,
        whatsapp: req.client_whatsapp || phone,
        password: password,
        corridor: req.location || d.corridor || 'Badore Axis',
        address: req.address || d.address || 'Badore, Ajah',
        categories: d.categories || ['materials'],
        status: 'accredited',
        is_accredited: true,
        is_active: true
      });
    }
    saveVendorProfiles(profiles);

    // 3. Update memory in allRequests
    if (Array.isArray(window.allRequests)) {
      var r = window.allRequests.find(function(item) { return item.id === appId; });
      if (r) {
        r.status = 'accredited';
        r.details = d;
      }
    }

    renderAccreditedVendors();
    renderVendorApplications(window.allRequests);

    if (window.showCustomToast) {
      window.showCustomToast(`Merchant store "${storeName}" accredited & activated!`);
    }
  }

  // Toggle active/suspend status
  function toggleVendorActive(vendorId, newActive) {
    var profiles = getVendorProfiles();
    var v = profiles.find(function(p) { return p.id === vendorId; });
    if (v) {
      v.is_active = newActive;
      saveVendorProfiles(profiles);
      renderAccreditedVendors();
      if (window.showCustomToast) {
        window.showCustomToast(newActive ? `Store "${v.store_name || v.name}" activated` : `Store "${v.store_name || v.name}" suspended`);
      }
    }
  }

  // Attach to window
  window.renderAccreditedVendors = renderAccreditedVendors;
  window.renderVendorApplications = renderVendorApplications;
  window.approveVendorApplication = approveVendorApplication;
  window.toggleVendorActive = toggleVendorActive;

  document.addEventListener('DOMContentLoaded', function () {
    renderAccreditedVendors();
  });
})();
