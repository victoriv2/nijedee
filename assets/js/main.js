/* ============================================================
   NIJEDEE — main.js
   Supports Taskie.ng Components, Drawers, FAQ Accordions,
   Tabs, Filter Chips, Booking Stepper, Cart Drawer & Modals.
   STRICT: ZERO EMOJIS, ZERO HOVER-UP (no translateY)
   ============================================================ */

'use strict';

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── Sticky Navbar / Header Blur ────────────────────────────── */
(function initHeader() {
  const header = qs('.tk-header') || qs('.navbar');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 15);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── Active Navigation Links ────────────────────────────────── */
(function initActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  qsa('.tk-header__nav a, .navbar-nav a, .tk-drawer__nav a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      a.classList.add('is-current', 'active');
    } else {
      a.classList.remove('is-current', 'active');
    }
  });
})();

/* ── Mobile Drawer (Taskie Header) ──────────────────────────── */
(function initMobileDrawer() {
  const burgers   = qsa('.tk-header__burger, .hamburger');
  const drawers   = qsa('.tk-header__drawer, .mobile-nav');
  const overlays  = qsa('.tk-drawer-overlay, .mobile-nav-overlay');
  const closeBtns = qsa('.tk-drawer__close, .mobile-nav-close');

  if (!burgers.length || !drawers.length) return;

  // Move drawers and overlays directly to <body> so sticky/backdrop-filter headers don't trap them
  drawers.forEach(d => {
    if (d.parentElement && d.parentElement.tagName.toLowerCase() === 'header') {
      document.body.appendChild(d);
    }
  });
  overlays.forEach(o => {
    if (o.parentElement && o.parentElement.tagName.toLowerCase() === 'header') {
      document.body.appendChild(o);
    }
  });

  let scrollPos = 0;

  const openDrawer = (e) => {
    if (e) e.stopPropagation();
    scrollPos = window.scrollY || document.documentElement.scrollTop;
    drawers.forEach(d => d.classList.add('open'));
    overlays.forEach(o => o.classList.add('open'));
    burgers.forEach(b => b.setAttribute('aria-expanded', 'true'));
    document.documentElement.classList.add('drawer-open');
    document.body.classList.add('drawer-open');
    document.body.style.top = `-${scrollPos}px`;
  };

  const closeDrawer = () => {
    drawers.forEach(d => d.classList.remove('open'));
    overlays.forEach(o => o.classList.remove('open'));
    burgers.forEach(b => b.setAttribute('aria-expanded', 'false'));
    document.documentElement.classList.remove('drawer-open');
    document.body.classList.remove('drawer-open');
    const prevTop = document.body.style.top;
    document.body.style.top = '';
    if (prevTop) {
      window.scrollTo(0, parseInt(prevTop, 10) * -1);
    }
  };

  burgers.forEach(b => b.addEventListener('click', openDrawer));
  closeBtns.forEach(c => c.addEventListener('click', closeDrawer));

  // Close when clicking or touching the overlay (click outside)
  overlays.forEach(o => {
    o.addEventListener('click', closeDrawer);
    o.addEventListener('touchstart', (e) => {
      e.preventDefault();
      closeDrawer();
    }, { passive: false });
    // Prevent scrolling/swiping through the overlay to background content
    o.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  });

  // Close when any link inside drawer is clicked
  drawers.forEach(d => {
    qsa('a', d).forEach(a => a.addEventListener('click', closeDrawer));
  });

  // Global document click-outside fallback
  document.addEventListener('click', (e) => {
    const isAnyOpen = drawers.some(d => d.classList.contains('open'));
    if (!isAnyOpen) return;
    if (e.target.closest('.tk-header__drawer, .mobile-nav, .tk-header__burger, .hamburger')) {
      return;
    }
    closeDrawer();
  });

  // Guard: Automatically close and reset mobile drawer on desktop screen resize or desktop load
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      closeDrawer();
    }
  });
  if (window.innerWidth > 1024) {
    closeDrawer();
  }
})();

/* ── Taskie FAQ Accordion ────────────────────────────────────── */
(function initFaq() {
  qsa('.tk-faq__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.tk-faq__item');
      if (!item) return;
      const wasActive = item.classList.contains('active');
      qsa('.tk-faq__item').forEach(el => el.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });
})();

/* ── Scroll Reveal ───────────────────────────────────────────── */
(function initReveal() {
  const items = qsa('.reveal, [data-reveal]');
  if (!items.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible', 'revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach(el => io.observe(el));
})();

/* ── Tab System ──────────────────────────────────────────────── */
(function initTabs() {
  qsa('.tab-nav').forEach(nav => {
    const btns  = qsa('.tab-btn', nav);
    const panes = qsa('.tab-pane', nav.closest('section') || document);
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = qs('#' + btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  });
})();

/* ── Filter Tags / Chips ─────────────────────────────────────── */
(function initFilterTags() {
  qsa('.filter-row').forEach(row => {
    const tags = qsa('.filter-tag', row);
    tags.forEach(tag => {
      tag.addEventListener('click', () => {
        tags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        const filter = tag.dataset.filter;
        const targetSel = row.dataset.target || '.filter-target, .product-grid, .property-grid, .artisan-grid';
        const grids = qsa(targetSel);
        grids.forEach(grid => {
          qsa('[data-category]', grid).forEach(card => {
            const show = (filter === 'all' || card.dataset.category === filter);
            card.style.display = show ? '' : 'none';
          });
        });
      });
    });
  });
})();

/* ── Multi-Step Wizard Engine (book.html & become-artisan.html) ─ */
(function initMultiStepWizards() {
  qsa('.wizard-card').forEach(wizard => {
    const steps = qsa('.step-pane', wizard);
    const indicators = qsa('.wizard-step', wizard);
    if (!steps.length) return;

    let currentStep = 0;

    const showStep = (idx) => {
      steps.forEach((s, i) => s.classList.toggle('active', i === idx));
      indicators.forEach((ind, i) => {
        ind.classList.toggle('active', i === idx);
        ind.classList.toggle('completed', i < idx);
      });
      wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    wizard.addEventListener('click', e => {
      if (e.target.matches('[data-wizard-next]')) {
        if (currentStep < steps.length - 1) {
          currentStep++;
          showStep(currentStep);
        }
      } else if (e.target.matches('[data-wizard-prev]')) {
        if (currentStep > 0) {
          currentStep--;
          showStep(currentStep);
        }
      }
    });
  });
})();

/* ── Cart Drawer & Checkout Engine (shop.html) ───────────────── */
(function initCartEngine() {
  const drawer   = qs('.cart-drawer');
  const overlay  = qs('.cart-overlay');
  const openBtns = qsa('[data-open-cart]');
  const closeBtn = qs('.cart-drawer__close');

  if (!drawer) return;

  const openCart = () => {
    drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeCart = () => {
    drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  openBtns.forEach(btn => btn.addEventListener('click', openCart));
  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  if (overlay)  overlay.addEventListener('click', closeCart);
})();

/* ── Modals (Properties, Academy, Artisans) ──────────────────── */
(function initModals() {
  qsa('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.modalOpen;
      const modal = qs('#' + modalId);
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  qsa('.modal-close, [data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  qsa('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });
})();

/* ── Hero Crossfade Photo Carousel (WhatsApp Media Showcase) ── */
(function initHeroCarousel() {
  const container = document.querySelector('#heroPhotoSlider');
  if (!container) return;

  const slides = container.querySelectorAll('.tk-hero__slide');
  if (slides.length < 2) return;

  const basePath = 'media/WhatsApp Unknown 2026-10-29 at 12.22.43 PM/';
  const images = [
    "WhatsApp Image 2026-10-28 at 8.11.27 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.27 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.28 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.28 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.28 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.29 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.29 PM (3).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.29 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.34 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.35 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.35 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.35 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.36 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.36 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.37 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.37 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.37 PM (3).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.37 PM (4).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.37 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.38 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.38 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.38 PM (3).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.38 PM (4).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.38 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.39 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.39 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.39 PM (3).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.39 PM (4).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.39 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.40 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.40 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.41 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.41 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.41 PM (3).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.41 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.42 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.42 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.42 PM (3).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.42 PM (4).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.42 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.43 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.43 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.43 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.44 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.44 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.44 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.45 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.45 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.45 PM (3).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.45 PM (4).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.45 PM.jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.46 PM (1).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.46 PM (2).jpeg",
    "WhatsApp Image 2026-10-28 at 8.11.46 PM.jpeg"
  ];

  let currentIndex = 0;
  let activeIndex = 0;

  function getImageUrl(name) {
    return encodeURI(basePath + name);
  }

  function preloadImage(url) {
    const img = new Image();
    img.src = url;
  }

  for (let i = 0; i < Math.min(5, images.length); i++) {
    preloadImage(getImageUrl(images[i]));
  }

  function advanceSlide() {
    const nextImageIndex = (currentIndex + 1) % images.length;
    currentIndex = nextImageIndex;
    const nextUrl = getImageUrl(images[nextImageIndex]);

    const incomingSlideIndex = activeIndex === 0 ? 1 : 0;
    const incomingSlide = slides[incomingSlideIndex];
    const outgoingSlide = slides[activeIndex];

    incomingSlide.src = nextUrl;
    incomingSlide.classList.add('active');
    outgoingSlide.classList.remove('active');
    activeIndex = incomingSlideIndex;

    const aheadIndex = (currentIndex + 1) % images.length;
    preloadImage(getImageUrl(images[aheadIndex]));
  }

  setInterval(advanceSlide, 3000);
})();

/* ============================================================
   Custom Modular Picker System
   Desktop: Custom Modal Dialog / Popover Picker
   Mobile: Bottom Sheet Modal / Action Sheet
   ============================================================ */
(function initCustomModularPickers() {
  let pickerBackdrop = null;
  let pickerSheet = null;
  let pickerTitle = null;
  let pickerPill = null;
  let pickerClose = null;
  let pickerSearchWrap = null;
  let pickerSearchInput = null;
  let pickerOptionsContainer = null;
  let activeSelect = null;
  let activeTrigger = null;

  function ensurePickerDOM() {
    if (pickerBackdrop) return;
    
    pickerBackdrop = document.createElement('div');
    pickerBackdrop.className = 'tk-picker-backdrop';
    pickerBackdrop.id = 'tkModularPickerBackdrop';
    pickerBackdrop.setAttribute('aria-hidden', 'true');

    pickerBackdrop.innerHTML = `
      <div class="tk-picker-sheet" id="tkModularPickerSheet" role="dialog" aria-modal="true" aria-labelledby="tkPickerTitle">
        <div class="tk-picker-handle-bar">
          <div class="tk-picker-handle"></div>
        </div>
        <div class="tk-picker-header">
          <div class="tk-picker-title-wrap">
            <span class="tk-picker-pill" id="tkPickerPill">Select Option</span>
            <h3 class="tk-picker-title" id="tkPickerTitle">Choose</h3>
          </div>
          <button type="button" class="tk-picker-close" id="tkPickerClose" aria-label="Close picker">&times;</button>
        </div>
        <div class="tk-picker-search-wrap" id="tkPickerSearchWrap" style="display:none;">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="9" r="6"></circle>
            <line x1="13.5" y1="13.5" x2="18" y2="18"></line>
          </svg>
          <input type="text" class="tk-picker-search-input" id="tkPickerSearchInput" placeholder="Search options..." autocomplete="off">
        </div>
        <div class="tk-picker-options" id="tkPickerOptions" role="listbox"></div>
      </div>
    `;

    document.body.appendChild(pickerBackdrop);

    pickerSheet = pickerBackdrop.querySelector('#tkModularPickerSheet');
    pickerTitle = pickerBackdrop.querySelector('#tkPickerTitle');
    pickerPill = pickerBackdrop.querySelector('#tkPickerPill');
    pickerClose = pickerBackdrop.querySelector('#tkPickerClose');
    pickerSearchWrap = pickerBackdrop.querySelector('#tkPickerSearchWrap');
    pickerSearchInput = pickerBackdrop.querySelector('#tkPickerSearchInput');
    pickerOptionsContainer = pickerBackdrop.querySelector('#tkPickerOptions');

    pickerClose.addEventListener('click', closePicker);
    pickerBackdrop.addEventListener('click', e => {
      if (e.target === pickerBackdrop) closePicker();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && pickerBackdrop.classList.contains('is-open')) {
        closePicker();
      }
    });

    // Touch swipe-down to dismiss bottom sheet on mobile
    let touchStartY = 0;
    let touchCurrentY = 0;
    const handleBar = pickerSheet.querySelector('.tk-picker-handle-bar');
    const header = pickerSheet.querySelector('.tk-picker-header');
    
    [handleBar, header].forEach(el => {
      if (!el) return;
      el.addEventListener('touchstart', e => {
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      el.addEventListener('touchmove', e => {
        touchCurrentY = e.touches[0].clientY;
        const diff = touchCurrentY - touchStartY;
        if (diff > 0 && window.innerWidth <= 640) {
          pickerSheet.style.transform = `translateY(${diff}px)`;
        }
      }, { passive: true });

      el.addEventListener('touchend', () => {
        const diff = touchCurrentY - touchStartY;
        if (diff > 70 && window.innerWidth <= 640) {
          closePicker();
        }
        pickerSheet.style.transform = '';
        touchStartY = 0;
        touchCurrentY = 0;
      }, { passive: true });
    });

    pickerSearchInput.addEventListener('input', () => {
      const query = pickerSearchInput.value.trim().toLowerCase();
      const optionButtons = pickerOptionsContainer.querySelectorAll('.tk-picker-option');
      let visibleCount = 0;
      optionButtons.forEach(btn => {
        const text = (btn.dataset.text || '').toLowerCase();
        if (!query || text.includes(query)) {
          btn.style.display = 'flex';
          visibleCount++;
        } else {
          btn.style.display = 'none';
        }
      });

      let noRes = pickerOptionsContainer.querySelector('.tk-picker-no-results');
      if (visibleCount === 0) {
        if (!noRes) {
          noRes = document.createElement('div');
          noRes.className = 'tk-picker-no-results';
          noRes.textContent = 'No matching options found';
          pickerOptionsContainer.appendChild(noRes);
        }
      } else if (noRes) {
        noRes.remove();
      }
    });
  }

  function getSelectTitle(select) {
    if (select.id) {
      const label = document.querySelector(`label[for="${select.id}"]`);
      if (label) return label.textContent.replace('*', '').trim();
    }
    const parentGroup = select.closest('.form-group');
    if (parentGroup) {
      const label = parentGroup.querySelector('label');
      if (label) return label.textContent.replace('*', '').trim();
    }
    if (select.name) {
      return select.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'Select Option';
  }

  function updateTriggerDisplay(select, trigger) {
    const textSpan = trigger.querySelector('.tk-custom-select-text');
    if (!textSpan) return;

    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption && selectedOption.value !== '') {
      textSpan.textContent = selectedOption.text;
      trigger.classList.remove('is-placeholder');
    } else if (selectedOption && selectedOption.text) {
      textSpan.textContent = selectedOption.text;
      trigger.classList.add('is-placeholder');
    } else {
      textSpan.textContent = 'Select an option...';
      trigger.classList.add('is-placeholder');
    }
  }

  function openPicker(select, trigger) {
    ensurePickerDOM();
    activeSelect = select;
    activeTrigger = trigger;

    const title = getSelectTitle(select);
    pickerTitle.textContent = title;
    pickerPill.textContent = 'Choose ' + title;

    pickerSearchInput.value = '';
    const validOptions = [...select.options].filter(opt => !opt.disabled || opt.value !== '');
    if (validOptions.length > 6) {
      pickerSearchWrap.style.display = 'flex';
    } else {
      pickerSearchWrap.style.display = 'none';
    }

    pickerOptionsContainer.innerHTML = '';
    Array.from(select.options).forEach((opt, idx) => {
      if (opt.disabled && opt.value === '') return;

      const isSelected = opt.selected || (select.value === opt.value);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tk-picker-option' + (isSelected ? ' is-selected' : '');
      btn.dataset.value = opt.value;
      btn.dataset.text = opt.text;
      btn.dataset.index = idx;

      btn.innerHTML = `
        <span class="tk-picker-option-text">${opt.text}</span>
        <span class="tk-picker-check">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 8 7 12 13 4"></polyline>
          </svg>
        </span>
      `;

      btn.addEventListener('click', () => {
        select.selectedIndex = idx;
        select.value = opt.value;
        updateTriggerDisplay(select, trigger);

        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));

        closePicker();
      });

      pickerOptionsContainer.appendChild(btn);
    });

    pickerBackdrop.classList.add('is-open');
    trigger.classList.add('is-active');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    const selectedBtn = pickerOptionsContainer.querySelector('.is-selected');
    if (selectedBtn) {
      selectedBtn.scrollIntoView({ block: 'nearest' });
    }
    if (window.innerWidth > 640 && validOptions.length > 6) {
      setTimeout(() => pickerSearchInput.focus(), 100);
    }
  }

  function closePicker() {
    if (!pickerBackdrop || !pickerBackdrop.classList.contains('is-open')) return;
    pickerBackdrop.classList.remove('is-open');
    if (activeTrigger) {
      activeTrigger.classList.remove('is-active');
      activeTrigger.setAttribute('aria-expanded', 'false');
      activeTrigger.focus();
    }
    document.body.style.overflow = '';
    activeSelect = null;
    activeTrigger = null;
  }

  function enhanceSelect(select) {
    if (!select || select.dataset.customPickerReady === 'true') return;
    select.dataset.customPickerReady = 'true';

    select.classList.add('tk-custom-select-native');

    const wrapper = document.createElement('div');
    wrapper.className = 'tk-custom-select-wrapper';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tk-custom-select-trigger';
    if (select.classList.contains('form-control')) {
      trigger.classList.add('form-control');
    }
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');

    trigger.innerHTML = `
      <span class="tk-custom-select-text"></span>
      <span class="tk-custom-select-arrow">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 8 10 12 14 8"></polyline>
        </svg>
      </span>
    `;

    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    wrapper.appendChild(trigger);

    updateTriggerDisplay(select, trigger);

    trigger.addEventListener('click', e => {
      e.preventDefault();
      openPicker(select, trigger);
    });

    select.addEventListener('change', () => {
      updateTriggerDisplay(select, trigger);
    });

    select.addEventListener('focus', () => {
      trigger.focus();
    });

    const observer = new MutationObserver(() => {
      updateTriggerDisplay(select, trigger);
      if (activeSelect === select && pickerBackdrop && pickerBackdrop.classList.contains('is-open')) {
        openPicker(select, trigger);
      }
    });
    observer.observe(select, { childList: true, subtree: true });
  }

  function initAll() {
    document.querySelectorAll('select').forEach(enhanceSelect);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.initCustomModularPickers = initAll;
})();

/* ── Persistent WhatsApp Floating Pill (Official Wikimedia SVG) ─ */
(function initFloatingWhatsApp() {
  const mount = () => {
    if (document.querySelector('.tk-wa-float')) return;
    const floatBtn = document.createElement('a');
    floatBtn.className = 'tk-wa-float';
    floatBtn.href = 'https://wa.me/2347085329909?text=Hello%20NIJEDEE,%20I%20would%20like%20to%20make%20an%20enquiry';
    floatBtn.target = '_blank';
    floatBtn.rel = 'noopener';
    floatBtn.setAttribute('aria-label', 'Chat with NIJEDEE on WhatsApp');
    floatBtn.innerHTML = '<img src="assets/images/whatsapp.svg" alt="WhatsApp" width="32" height="32" loading="lazy">';
    document.body.appendChild(floatBtn);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
