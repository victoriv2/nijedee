/**
 * NIJEDEE Admin Console - Errand Boy & Delivery Services Desk
 * Handles errand bookings tracking, runner assignment, status progression,
 * and dispatch communication with customers and delivery personnel.
 *
 * STRICT RULE: ZERO Unicode Emojis. Clean SVG icons and accessible markup only.
 */

(function () {
  'use strict';

  let currentAssigningErrand = null;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getErrandsList(allReqs) {
    const list = Array.isArray(allReqs) ? allReqs : (window.allRequests || []);
    return list.filter(r => r.type === 'errand_request');
  }

  /**
   * Update Errand KPI Badges across sidebar and desk
   */
  function updateErrandsKPIs(allReqs) {
    const errands = getErrandsList(allReqs);
    const total = errands.length;
    const newCount = errands.filter(e => e.status === 'new').length;
    const inTransitCount = errands.filter(e => e.status === 'in_progress').length;
    const completedCount = errands.filter(e => e.status === 'completed').length;

    // Sidebar Badges
    const sideBadge = document.getElementById('sidebarErrandsCount');
    const mobBadge = document.getElementById('mobileSidebarErrandsCount');
    if (sideBadge) {
      sideBadge.textContent = total;
      sideBadge.style.display = total > 0 ? 'inline-block' : 'none';
    }
    if (mobBadge) {
      mobBadge.textContent = total;
      mobBadge.style.display = total > 0 ? 'inline-block' : 'none';
    }

    // Desk KPIs
    const kpiTot = document.getElementById('kpiErrandsTotal');
    const kpiNew = document.getElementById('kpiErrandsNew');
    const kpiProg = document.getElementById('kpiErrandsInTransit');
    const kpiComp = document.getElementById('kpiErrandsCompleted');

    if (kpiTot) kpiTot.textContent = total;
    if (kpiNew) kpiNew.textContent = newCount;
    if (kpiProg) kpiProg.textContent = inTransitCount;
    if (kpiComp) kpiComp.textContent = completedCount;
  }

  /**
   * Render Errand Services Table
   */
  function renderErrandsDesk(allReqs) {
    const tbody = document.getElementById('adminErrandsTableBody');
    if (!tbody) return;

    const errands = getErrandsList(allReqs);
    updateErrandsKPIs(allReqs);

    const search = (document.getElementById('errandSearchInput')?.value || '').trim().toLowerCase();
    const catFilter = (document.getElementById('errandCategoryFilter')?.value || '').trim().toLowerCase();
    const corridorFilter = (document.getElementById('errandCorridorFilter')?.value || '').trim().toLowerCase();

    const filtered = errands.filter(e => {
      const d = e.details || {};
      const ref = (e.ref_code || '').toLowerCase();
      const name = (e.client_name || '').toLowerCase();
      const phone = (e.client_phone || '').toLowerCase();
      const cat = (d.category || '').toLowerCase();
      const corridor = (e.location || d.corridor || '').toLowerCase();
      const pickup = (d.pickup_address || '').toLowerCase();
      const delivery = (d.delivery_address || '').toLowerCase();
      const runner = (d.assigned_errand_boy || '').toLowerCase();

      const matchesSearch = !search ||
        ref.includes(search) ||
        name.includes(search) ||
        phone.includes(search) ||
        pickup.includes(search) ||
        delivery.includes(search) ||
        runner.includes(search);

      const matchesCat = !catFilter || cat.includes(catFilter);
      const matchesCorridor = !corridorFilter || corridor.includes(corridorFilter);

      return matchesSearch && matchesCat && matchesCorridor;
    });

    if (errands.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:50px 20px; color:var(--adm-muted);">
            <div style="font-weight:800; color:var(--adm-navy); font-size:1.02rem; margin-bottom:6px;">No Errand Boy Requests Yet</div>
            <p style="font-size:0.86rem; color:#64748B; margin:0; max-width:540px; margin:0 auto;">
              When clients click "Request an Errand Boy" on the website or flyers (for pickup, delivery, groceries, laundry, or fuel), their dispatch orders will appear here instantly.
            </p>
          </td>
        </tr>
      `;
      return;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:40px 20px; color:var(--adm-muted);">
            No errand requests match your current search or filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(item => {
      const d = item.details || {};
      const cleanPhone = (item.client_phone || '').replace(/\D/g, '');
      const isNew = item.status === 'new';
      const isAssigned = item.status === 'in_progress' || !!d.assigned_errand_boy;
      const isCompleted = item.status === 'completed';

      let statusBadge = '<span class="adm-badge adm-badge--new">New Order</span>';
      if (isCompleted) {
        statusBadge = '<span class="adm-badge adm-badge--completed">Delivered</span>';
      } else if (isAssigned) {
        statusBadge = '<span class="adm-badge adm-badge--in_progress">Runner Assigned</span>';
      }

      const urgencyTag = (d.urgency || '').toLowerCase().includes('urgent') || (d.urgency || '').toLowerCase().includes('immediate')
        ? '<span style="background:#FEE2E2; color:#B91C1C; font-size:10px; font-weight:800; padding:1px 6px; border-radius:4px; margin-left:6px; border:1px solid #FECDD3;">Express</span>'
        : '';

      const runnerDisplay = d.assigned_errand_boy ? `
        <div style="font-weight:700; color:#0B5ED7; font-size:0.84rem;">${escapeHtml(d.assigned_errand_boy)}</div>
        <div style="font-size:0.75rem; color:#64748B;">${escapeHtml(d.errand_boy_phone || 'Assigned Runner')}</div>
      ` : `
        <span style="color:#D97706; font-size:0.78rem; font-weight:700;">Unassigned</span>
      `;

      return `
        <tr class="${isNew ? 'is-unread' : ''}">
          <td>
            <div style="font-weight:800; color:var(--adm-navy); font-size:0.88rem;">${escapeHtml(item.ref_code || 'ERD-00000')}</div>
            <div style="font-size:0.72rem; color:#64748B;">${item.created_at ? new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}</div>
          </td>
          <td>
            <div style="font-weight:800; color:#0F172A; font-size:0.86rem; display:flex; align-items:center;">
              <span>${escapeHtml(d.category || 'General Errand')}</span>
              ${urgencyTag}
            </div>
            <div style="font-size:0.75rem; color:#64748B;">Corridor: ${escapeHtml(item.location || d.corridor || 'Badore Axis')}</div>
          </td>
          <td>
            <div style="font-weight:700; color:var(--adm-navy); font-size:0.86rem;">${escapeHtml(item.client_name || 'Customer')}</div>
            <div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
              <a href="tel:${escapeHtml(item.client_phone)}" style="font-size:0.78rem; color:#0B5ED7; text-decoration:none; font-weight:700;">${escapeHtml(item.client_phone)}</a>
              ${cleanPhone ? `
                <a href="https://wa.me/234${cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent('Hello ' + (item.client_name || '') + ', contacting you from NIJEDEE regarding your Errand Request (' + (item.ref_code || '') + ').')}" target="_blank" style="font-size:0.74rem; color:#166534; font-weight:700; text-decoration:none;">
                  WhatsApp &rarr;
                </a>
              ` : ''}
            </div>
          </td>
          <td>
            <div style="font-size:0.82rem; color:#334155; max-width:180px; line-height:1.35;" title="${escapeHtml(d.pickup_address || '')}">
              <strong>From:</strong> ${escapeHtml(d.pickup_address || 'Not specified')}
            </div>
          </td>
          <td>
            <div style="font-size:0.82rem; color:#334155; max-width:180px; line-height:1.35;" title="${escapeHtml(d.delivery_address || '')}">
              <strong>To:</strong> ${escapeHtml(d.delivery_address || 'Not specified')}
            </div>
          </td>
          <td>
            ${runnerDisplay}
          </td>
          <td>
            ${statusBadge}
          </td>
          <td style="white-space:nowrap;">
            <div style="display:flex; gap:6px; align-items:center;">
              <button type="button" class="adm-btn adm-btn--primary adm-btn--sm" onclick="window.openAssignErrandModal('${escapeHtml(item.id)}')" style="font-weight:700;">
                <span>${d.assigned_errand_boy ? 'Reassign' : 'Assign Runner'}</span>
              </button>
              <button type="button" class="adm-btn adm-btn--outline adm-btn--sm" onclick="window.openDetailModal('${escapeHtml(item.id)}')">
                <span>View</span>
              </button>
              ${!isCompleted ? `
                <button type="button" class="adm-btn adm-btn--sm" onclick="window.markErrandDelivered('${escapeHtml(item.id)}')" style="background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; font-weight:700;" title="Mark order as completed and delivered">
                  Delivered
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Open Assign Errand Runner Modal
   */
  function openAssignErrandModal(id) {
    const item = (window.allRequests || []).find(r => r.id === id);
    if (!item) return;
    currentAssigningErrand = item;

    const modal = document.getElementById('assignErrandBoyModal');
    if (!modal) return;

    const d = item.details || {};
    document.getElementById('assignErrandRefCode').textContent = item.ref_code || 'ERD';
    document.getElementById('assignErrandCustomer').textContent = `${item.client_name || 'Customer'} (${item.client_phone || ''})`;
    document.getElementById('assignErrandRoute').textContent = `From: ${d.pickup_address || 'Pickup'} \u2192 To: ${d.delivery_address || 'Delivery'}`;
    document.getElementById('assignErrandCategory').textContent = `${d.category || 'Errand'} \u2022 ${item.location || d.corridor || 'Badore Axis'}`;

    const runnerNameInput = document.getElementById('errandRunnerName');
    const runnerPhoneInput = document.getElementById('errandRunnerPhone');
    const notesInput = document.getElementById('errandDispatchNotes');

    if (runnerNameInput) runnerNameInput.value = d.assigned_errand_boy || '';
    if (runnerPhoneInput) runnerPhoneInput.value = d.errand_boy_phone || '';
    if (notesInput) notesInput.value = d.dispatch_notes || '';

    modal.classList.add('open');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
    document.body.style.overflow = 'hidden';
  }

  function closeAssignErrandModal() {
    const modal = document.getElementById('assignErrandBoyModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.setProperty('display', 'none', 'important');
      modal.style.setProperty('opacity', '0', 'important');
      modal.style.setProperty('visibility', 'hidden', 'important');
      modal.style.setProperty('pointer-events', 'none', 'important');
    }
    document.body.style.overflow = '';
    currentAssigningErrand = null;
  }

  /**
   * Submit Assign Runner Form
   */
  async function submitAssignErrandForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!currentAssigningErrand) return;

    const runnerName = (document.getElementById('errandRunnerName')?.value || '').trim();
    const runnerPhone = (document.getElementById('errandRunnerPhone')?.value || '').trim();
    const vehicle = document.getElementById('errandRunnerVehicle')?.value || 'Motorcycle';
    const notes = (document.getElementById('errandDispatchNotes')?.value || '').trim();

    if (!runnerName || !runnerPhone) {
      if (window.showCustomAlert) {
        window.showCustomAlert({ title: 'Input Required', message: 'Please provide the runner name and phone number.', type: 'info' });
      }
      return;
    }

    const btn = document.getElementById('confirmAssignErrandBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving Assignment...';
    }

    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    const d = currentAssigningErrand.details || {};
    d.assigned_errand_boy = runnerName;
    d.errand_boy_phone = runnerPhone;
    d.errand_boy_vehicle = vehicle;
    d.dispatch_notes = notes;
    d.assigned_at = new Date().toISOString();

    const updatePayload = {
      status: 'in_progress',
      details: d,
      notes: `Errand Boy assigned: ${runnerName} (${runnerPhone}) on ${new Date().toLocaleDateString()}`
    };

    if (sb) {
      try {
        await sb.from('requests').update(updatePayload).eq('id', currentAssigningErrand.id);
      } catch (err) {
        console.warn('Errand assignment update error:', err);
      }
    }

    // Update in-memory array
    const idx = (window.allRequests || []).findIndex(r => r.id === currentAssigningErrand.id);
    if (idx !== -1) {
      window.allRequests[idx].status = 'in_progress';
      window.allRequests[idx].details = d;
    }

    renderErrandsDesk(window.allRequests);
    closeAssignErrandModal();

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Confirm & Dispatch Runner';
    }

    // Prompt admin with WhatsApp dispatch action to notify customer
    const clientPhone = (currentAssigningErrand.client_phone || '').replace(/\D/g, '');
    const clientMsg = encodeURIComponent(
      `Hello ${currentAssigningErrand.client_name || 'Customer'},\nYour NIJEDEE Errand Runner has been assigned!\n\n` +
      `Order Ref: ${currentAssigningErrand.ref_code || ''}\n` +
      `Errand: ${d.category || 'Errand'}\n` +
      `Assigned Runner: ${runnerName} (${runnerPhone})\n` +
      `Transport: ${vehicle}\n` +
      `Pickup: ${d.pickup_address || ''}\n` +
      `Delivery: ${d.delivery_address || ''}\n\n` +
      `Our runner will contact you shortly to coordinate handover.`
    );
    const clientWaUrl = `https://wa.me/234${clientPhone.replace(/^0/, '')}?text=${clientMsg}`;

    if (window.showCustomConfirm) {
      const wantNotify = await window.showCustomConfirm({
        title: 'Runner Assigned Successfully',
        message: `Errand runner "${runnerName}" has been dispatched for ${currentAssigningErrand.ref_code}.\n\nWould you like to send an instant WhatsApp notification to the customer?`,
        confirmText: 'Send Customer WhatsApp',
        cancelText: 'Done',
        type: 'success'
      });
      if (wantNotify) {
        window.open(clientWaUrl, '_blank');
      }
    }
  }

  /**
   * Mark Errand as Completed / Delivered
   */
  async function markErrandDelivered(id) {
    const item = (window.allRequests || []).find(r => r.id === id);
    if (!item) return;

    let confirmed = true;
    if (window.showCustomConfirm) {
      confirmed = await window.showCustomConfirm({
        title: 'Mark as Delivered?',
        message: `Confirm that errand package (${item.ref_code || ''}) has been safely delivered to ${item.client_name}?`,
        confirmText: 'Mark Delivered',
        type: 'success'
      });
    }

    if (!confirmed) return;

    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    const d = item.details || {};
    d.delivered_at = new Date().toISOString();

    if (sb) {
      try {
        await sb.from('requests').update({
          status: 'completed',
          details: d
        }).eq('id', id);
      } catch (err) {
        console.warn('Error marking delivered:', err);
      }
    }

    item.status = 'completed';
    item.details = d;
    renderErrandsDesk(window.allRequests);

    if (window.showToast) {
      window.showToast(`Errand ${item.ref_code} marked as delivered!`, id);
    }
  }

  // Exports
  window.renderErrandsDesk = renderErrandsDesk;
  window.updateErrandsKPIs = updateErrandsKPIs;
  window.openAssignErrandModal = openAssignErrandModal;
  window.closeAssignErrandModal = closeAssignErrandModal;
  window.submitAssignErrandForm = submitAssignErrandForm;
  window.markErrandDelivered = markErrandDelivered;

})();
