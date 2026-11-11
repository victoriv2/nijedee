/**
 * NIJEDEE - Errand Boy & Delivery Services Engine
 * Handles "Request an Errand Boy" modal, online errand booking with Supabase dual-sync,
 * pre-filled WhatsApp dispatch, category selection, and flyer viewer.
 *
 * STRICT RULE: ZERO Unicode Emojis. Clean SVG icons and accessible markup only.
 */

(function () {
  'use strict';

  const ERRAND_CATEGORIES = [
    { id: 'pickup_delivery', name: 'Pickup & Delivery', desc: 'Parcels, documents, packages and courier drop-offs' },
    { id: 'grocery_shopping', name: 'Grocery Shopping', desc: 'Foodstuff, household items and supermarket shopping' },
    { id: 'food_delivery', name: 'Food Delivery', desc: 'Restaurant meals and takeaway orders' },
    { id: 'laundry_services', name: 'Laundry Services', desc: 'Laundry pickup and doorstep delivery' },
    { id: 'school_runs', name: 'School Runs', desc: 'School pickup and drop-off arrangements' },
    { id: 'fuel_gas', name: 'Fuel & Cooking Gas', desc: 'Fuel purchase and gas refill delivery arrangements' },
    { id: 'shopping_assistance', name: 'Shopping Assistance', desc: 'Buying and delivering custom items on your behalf' },
    { id: 'building_materials', name: 'Building Materials', desc: 'Shopping and express delivery of building materials' },
    { id: 'cooking_cleaning', name: 'Home Cooking & Cleaning', desc: 'Professional cooking and domestic cleaning tasks' },
    { id: 'home_office', name: 'Home & Office Errands', desc: 'Personal errands, office tasks and administrative runs' },
    { id: 'special_errands', name: 'Special Errands', desc: 'Personal requests, surprises, gifts and general logistics' }
  ];

  /**
   * Ensure Universal Errand Request Modal exists in DOM
   */
  function ensureErrandModalInDOM() {
    if (document.getElementById('errandRequestModalBackdrop')) return;

    const categoriesOptions = ERRAND_CATEGORIES.map(cat => 
      `<option value="${cat.name}">${cat.name} &mdash; (${cat.desc})</option>`
    ).join('');

    const modalHTML = `
      <div id="errandRequestModalBackdrop" class="modal-backdrop errand-modal-backdrop" onclick="if(event.target === this) window.closeErrandModal()" style="display:none; position:fixed; inset:0; background:rgba(7,34,79,0.72); backdrop-filter:blur(5px); z-index:99999; align-items:center; justify-content:center; padding:16px; overflow-y:auto;">
        <div class="errand-modal-card" onclick="event.stopPropagation()" style="background:#FFFFFF; border-radius:18px; width:100%; max-width:680px; box-shadow:0 24px 50px rgba(7,34,79,0.3); border:1px solid #E2E8F0; overflow:hidden; position:relative; margin:auto;">
          
          <!-- Modal Header -->
          <div style="background:linear-gradient(135deg, var(--tk-navy, #07224F) 0%, #0F3775 100%); padding:20px 24px; color:#FFFFFF; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:40px; height:40px; border-radius:10px; background:#FFB703; display:flex; align-items:center; justify-content:center; color:#07224F; flex-shrink:0;">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <div>
                <h3 style="font-size:1.15rem; font-weight:800; color:#FFFFFF; margin:0; line-height:1.2;">NIJEDEE Errand Boy &amp; Delivery</h3>
                <p style="font-size:0.75rem; color:#BAE6FD; margin:3px 0 0 0; font-weight:600;">Your Trusted Errand &amp; Delivery Partner &bull; CAC RC 1403323</p>
              </div>
            </div>
            <button type="button" onclick="window.closeErrandModal()" style="background:rgba(255,255,255,0.15); border:none; color:#FFFFFF; width:34px; height:34px; border-radius:50%; cursor:pointer; font-size:22px; display:flex; align-items:center; justify-content:center; line-height:1;" aria-label="Close modal">&times;</button>
          </div>

          <!-- Highlight Banner -->
          <div style="background:linear-gradient(90deg, #FEF3C7 0%, #FDE68A 100%); padding:12px 24px; border-bottom:1px solid #FCD34D; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <div style="font-size:0.86rem; font-weight:800; color:#92400E; display:flex; align-items:center; gap:6px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#D97706;"></span>
              Too busy? Let Nijedee handle it!
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <span style="font-size:0.75rem; font-weight:700; color:#B45309; background:rgba(255,255,255,0.8); padding:3px 8px; border-radius:6px; border:1px solid #F59E0B;">
                Badore &bull; Ajah &bull; Sangotedo &bull; Lekki
              </span>
              <button type="button" onclick="window.viewErrandFlyer(1)" style="background:#FFFFFF; border:1px solid #D97706; color:#92400E; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:6px; cursor:pointer;" title="View official service flyer">
                View Flyer
              </button>
            </div>
          </div>

          <!-- Modal Scroll Body -->
          <div style="padding:22px 24px; max-height:calc(85vh - 140px); overflow-y:auto;">

            <!-- Quick WhatsApp / Call Direct Bar -->
            <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:12px; padding:14px 16px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
              <div>
                <div style="font-weight:800; font-size:0.9rem; color:var(--tk-navy, #07224F);">Need Instant WhatsApp Dispatch?</div>
                <div style="font-size:0.78rem; color:#64748B;">Chat directly with our dispatch desk on 07085329909</div>
              </div>
              <div style="display:flex; gap:8px; align-items:center;">
                <a href="https://wa.me/2347085329909?text=Hello%20NIJEDEE%2C%20I%20need%20to%20request%20an%20Errand%20Boy%20for%20an%20urgent%20task." target="_blank" rel="noopener" class="tk-btn" style="background:#25D366; color:#FFFFFF; font-weight:700; font-size:0.84rem; padding:8px 14px; border-radius:8px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                  <img src="assets/images/whatsapp.svg" alt="WhatsApp" width="16" height="16" style="display:block;">
                  <span>WhatsApp Dispatch</span>
                </a>
                <a href="tel:07085329909" class="tk-btn tk-btn--outline tk-btn--sm" style="font-weight:700; font-size:0.84rem; padding:8px 12px; border-radius:8px; text-decoration:none;">
                  Call Now
                </a>
              </div>
            </div>

            <!-- Booking Form -->
            <form id="errandBookingForm" onsubmit="window.submitErrandRequestForm(event); return false;">
              
              <!-- Contact Details -->
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Your Name *</label>
                  <input type="text" id="errandClientName" required placeholder="e.g. Juliet Johnson" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none;">
                </div>
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Phone / WhatsApp *</label>
                  <input type="tel" id="errandClientPhone" required placeholder="e.g. 08031234567" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none;">
                </div>
              </div>

              <!-- Errand Category -->
              <div style="margin-bottom:14px;">
                <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Errand Category *</label>
                <select id="errandCategory" required onchange="window.handleErrandCategoryChange(this.value)" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none; background:#FFFFFF; cursor:pointer;">
                  <option value="" disabled selected>-- Select Errand Service Type --</option>
                  ${categoriesOptions}
                </select>
              </div>

              <!-- Corridor / Coverage Area -->
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Coverage Corridor *</label>
                  <select id="errandCorridor" required style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none; background:#FFFFFF; cursor:pointer;">
                    <option value="" disabled selected>-- Select Corridor --</option>
                    <option value="Badore Axis">Badore Axis</option>
                    <option value="Ajah Central">Ajah Central</option>
                    <option value="Sangotedo">Sangotedo (Monastery / Shoprite)</option>
                    <option value="Lekki Phase 1 / Phase 2">Lekki (Phase 1, Phase 2, Chevron)</option>
                    <option value="Other Lagos Axis">Other Lagos Axis</option>
                  </select>
                </div>
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Urgency / Timeline *</label>
                  <select id="errandUrgency" required style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none; background:#FFFFFF; cursor:pointer;">
                    <option value="Immediate Dispatch (30-45 mins)">Immediate Dispatch (30-45 mins)</option>
                    <option value="Within 2 Hours">Within 2 Hours</option>
                    <option value="Later Today">Later Today</option>
                    <option value="Scheduled for Tomorrow">Scheduled for Tomorrow</option>
                  </select>
                </div>
              </div>

              <!-- Pickup & Delivery Addresses -->
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Pickup / Origin Address *</label>
                  <input type="text" id="errandPickupAddress" required placeholder="e.g. Supermarket, Home, Store or Office" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none;">
                </div>
                <div>
                  <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Delivery / Destination Address *</label>
                  <input type="text" id="errandDeliveryAddress" required placeholder="e.g. House 12, Badore Road, Ajah" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none;">
                </div>
              </div>

              <!-- Specific Instructions -->
              <div style="margin-bottom:18px;">
                <label style="display:block; font-size:0.82rem; font-weight:700; color:var(--tk-navy); margin-bottom:5px;">Detailed Instructions / Items List *</label>
                <textarea id="errandInstructions" required rows="3" placeholder="Describe the errand in detail: items to buy, pickup notes, recipient name, or special instructions..." style="width:100%; box-sizing:border-box; padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:0.9rem; outline:none; resize:vertical;"></textarea>
              </div>

              <!-- Trust Highlights Checklist -->
              <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:10px; padding:12px 14px; margin-bottom:18px; font-size:0.8rem; color:#166534; display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                <div>&bull; Fast &amp; Reliable Doorstep Service</div>
                <div>&bull; Trusted &amp; NIN-Vetted Personnel</div>
                <div>&bull; Transparent &amp; Affordable Charges</div>
                <div>&bull; Live Coordination &amp; Guarantee</div>
              </div>

              <!-- Submit Buttons -->
              <div style="display:flex; gap:10px; align-items:center;">
                <button type="submit" id="errandSubmitBtn" class="tk-btn" style="flex:1; justify-content:center; padding:13px; font-size:0.95rem; font-weight:800; background:linear-gradient(135deg, #FFB703 0%, #FB8500 100%); color:#07224F; border:none; border-radius:10px; cursor:pointer;">
                  Request Errand Boy Now &rarr;
                </button>
                <button type="button" onclick="window.closeErrandModal()" class="tk-btn tk-btn--outline" style="padding:13px 18px; font-size:0.9rem; cursor:pointer; border-radius:10px;">
                  Cancel
                </button>
              </div>

            </form>

            <!-- Bottom Tagline -->
            <div style="text-align:center; margin-top:20px; font-size:0.85rem; font-weight:800; color:var(--tk-navy); letter-spacing:0.02em;">
              Your Errands, Our Responsibility!
            </div>

          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Open Errand Request Modal
   */
  function openErrandModal(preferredCategory) {
    ensureErrandModalInDOM();
    const backdrop = document.getElementById('errandRequestModalBackdrop');
    if (backdrop) {
      backdrop.classList.add('open');
      backdrop.style.setProperty('display', 'flex', 'important');
      backdrop.style.setProperty('opacity', '1', 'important');
      backdrop.style.setProperty('visibility', 'visible', 'important');
      backdrop.style.setProperty('pointer-events', 'auto', 'important');
    }

    // Auto-fill customer info if logged in
    try {
      const user = window.getCurrentUser ? window.getCurrentUser() : null;
      if (user) {
        const nameInput = document.getElementById('errandClientName');
        const phoneInput = document.getElementById('errandClientPhone');
        const addrInput = document.getElementById('errandDeliveryAddress');
        if (nameInput && !nameInput.value) nameInput.value = user.full_name || user.addresses?.first_name || '';
        if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
        if (addrInput && !addrInput.value) addrInput.value = user.street || user.addresses?.full_address || '';
      }
    } catch (e) {}

    // Select preferred category if provided
    if (preferredCategory) {
      const catSelect = document.getElementById('errandCategory');
      if (catSelect) {
        catSelect.value = preferredCategory;
      }
    }

    document.body.style.overflow = 'hidden';
  }

  /**
   * Close Errand Request Modal
   */
  function closeErrandModal() {
    const backdrop = document.getElementById('errandRequestModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
      backdrop.style.setProperty('display', 'none', 'important');
      backdrop.style.setProperty('opacity', '0', 'important');
      backdrop.style.setProperty('visibility', 'hidden', 'important');
      backdrop.style.setProperty('pointer-events', 'none', 'important');
    }
    document.body.style.overflow = '';
  }

  /**
   * View Official Errand Flyer in Lightbox
   */
  function viewErrandFlyer(flyerNum) {
    const flyer1 = 'assets/images/errand-boy-flyer-1.jpg';
    const flyer2 = 'assets/images/errand-boy-flyer-2.jpg';
    const items = [
      { src: flyer1, caption: 'NIJEDEE Errand Boy & Delivery Services - Official Service Flyer 1' },
      { src: flyer2, caption: 'NIJEDEE Errand & Delivery Services - Comprehensive Service Breakdown Flyer 2' }
    ];
    const startIdx = flyerNum === 2 ? 1 : 0;
    if (window.openGlobalLightbox) {
      window.openGlobalLightbox(items, startIdx, 'NIJEDEE Errand Services');
    } else if (window.openLightbox) {
      window.openLightbox(items, startIdx, 'NIJEDEE Errand Services');
    } else {
      window.open(startIdx === 1 ? flyer2 : flyer1, '_blank');
    }
  }

  /**
   * Submit Errand Request Form
   */
  async function submitErrandRequestForm(e) {
    if (e && e.preventDefault) e.preventDefault();

    const name = (document.getElementById('errandClientName')?.value || '').trim();
    const phone = (document.getElementById('errandClientPhone')?.value || '').trim();
    const category = (document.getElementById('errandCategory')?.value || '').trim();
    const corridor = (document.getElementById('errandCorridor')?.value || '').trim();
    const urgency = (document.getElementById('errandUrgency')?.value || '').trim();
    const pickup = (document.getElementById('errandPickupAddress')?.value || '').trim();
    const delivery = (document.getElementById('errandDeliveryAddress')?.value || '').trim();
    const instructions = (document.getElementById('errandInstructions')?.value || '').trim();
    const submitBtn = document.getElementById('errandSubmitBtn');

    if (!name || !phone || !category || !corridor || !pickup || !delivery || !instructions) {
      if (window.showCustomAlert) {
        window.showCustomAlert({
          title: 'Missing Required Fields',
          message: 'Please fill in all errand fields so our dispatch team can schedule your errand boy accurately.',
          type: 'warning'
        });
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Dispatching Errand Request...';
    }

    const refCode = 'ERD-' + Math.floor(10000 + Math.random() * 90000);
    const errandData = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('errand_' + Date.now()),
      ref_code: refCode,
      type: 'errand_request',
      status: 'new',
      client_name: name,
      client_phone: phone,
      location: corridor,
      title: `[Errand] ${category} - ${corridor}`,
      details: {
        category: category,
        corridor: corridor,
        urgency: urgency,
        pickup_address: pickup,
        delivery_address: delivery,
        instructions: instructions,
        submitted_at: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    };

    // 1. Sync to Supabase requests table
    const sb = window.getNijedeeSupabase ? window.getNijedeeSupabase() : null;
    if (sb) {
      try {
        const { error } = await sb.from('requests').insert([errandData]);
        if (error) {
          console.warn('Supabase errand insert notice:', error);
        }
      } catch (err) {
        console.warn('Supabase errand error:', err);
      }
    }

    // 2. Also cache in localStorage for instant tracking
    try {
      const stored = localStorage.getItem('nijedee_customer_requests');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(errandData);
      localStorage.setItem('nijedee_customer_requests', JSON.stringify(list));
    } catch (e) {}

    closeErrandModal();

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Request Errand Boy Now \u2192';
    }

    // Compose WhatsApp quick confirmation link
    const waText = encodeURIComponent(
      `Hello NIJEDEE, I just submitted an Errand Request!\nRef: ${refCode}\nService: ${category}\nCorridor: ${corridor}\nPickup: ${pickup}\nDelivery: ${delivery}\nInstructions: ${instructions}`
    );
    const waUrl = `https://wa.me/2347085329909?text=${waText}`;

    if (window.showCustomAlert) {
      await window.showCustomAlert({
        title: 'Errand Boy Requested Successfully',
        message: `Your errand request has been logged under Ref: ${refCode}. Our dispatch desk will contact you at ${phone} within a few minutes to confirm pickup and assign your vetted errand boy.\n\nYou can also click below to open WhatsApp for real-time dispatch updates.`,
        type: 'success',
        confirmText: 'Open WhatsApp Dispatch',
        cancelText: 'Done',
        onConfirm: () => {
          window.open(waUrl, '_blank');
        }
      });
    } else {
      window.open(waUrl, '_blank');
    }
  }

  // Export functions to window
  window.openErrandModal = openErrandModal;
  window.closeErrandModal = closeErrandModal;
  window.viewErrandFlyer = viewErrandFlyer;
  window.submitErrandRequestForm = submitErrandRequestForm;
  window.ERRAND_CATEGORIES = ERRAND_CATEGORIES;

})();
