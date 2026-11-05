/* ============================================================
   NIJEDEE — main.js
   Supports Taskie.ng Components, Drawers, FAQ Accordions,
   Tabs, Filter Chips, Booking Stepper, Cart Drawer & Modals.
   STRICT: ZERO EMOJIS, ZERO HOVER-UP (no translateY)
   ============================================================ */

'use strict';

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── Smart Fixed Header (Hide on Scroll Down, Reveal on Scroll Up Anywhere) ── */
(function initHeader() {
  const header = qs('.tk-header') || qs('.navbar');
  if (!header) return;

  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
  let scrollUpAccum = 0;
  let scrollDownAccum = 0;
  let ticking = false;

  const updateHeader = () => {
    const currentScrollY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop);
    const isDrawerOpen = document.body.classList.contains('drawer-open') || 
                         document.documentElement.classList.contains('drawer-open');

    // Never hide header when mobile drawer or search is active
    if (isDrawerOpen) {
      header.classList.remove('header-hidden');
      header.classList.add('header-visible');
      ticking = false;
      return;
    }

    // At the very top (first 20px): always fully visible, remove scrolled shadow
    if (currentScrollY <= 20) {
      header.classList.remove('header-hidden');
      header.classList.add('header-visible');
      header.classList.remove('scrolled');
      scrollUpAccum = 0;
      scrollDownAccum = 0;
      lastScrollY = currentScrollY;
      ticking = false;
      return;
    }

    header.classList.add('scrolled');

    const delta = currentScrollY - lastScrollY;

    if (delta < 0) {
      // SCROLLING UP: reveal immediately from ANY scroll position (including bottom of page)
      scrollUpAccum += Math.abs(delta);
      scrollDownAccum = 0;
      if (scrollUpAccum >= 4 || currentScrollY <= 120) {
        header.classList.remove('header-hidden');
        header.classList.add('header-visible');
      }
    } else if (delta > 0) {
      // SCROLLING DOWN: hide when moving downward past top threshold
      scrollDownAccum += delta;
      scrollUpAccum = 0;
      if (currentScrollY > 80 && scrollDownAccum >= 10) {
        header.classList.add('header-hidden');
        header.classList.remove('header-visible');
      }
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  updateHeader();
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

/* ── Hero Crossfade Carousel & Full-View Lightbox Gallery ── */
(function initHeroShowcase() {
  const heroTrigger = document.querySelector('#heroPhotoSlider');
  const lightbox = document.querySelector('#tkImageLightbox');
  if (!heroTrigger) return;

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

  function getImageUrl(filename) {
    return encodeURI(basePath + filename);
  }

  function preloadImage(url) {
    const img = new Image();
    img.src = url;
  }

  // Preload initial set of images
  for (let i = 0; i < Math.min(8, images.length); i++) {
    preloadImage(getImageUrl(images[i]));
  }

  /* ── 1. Hero Auto 3-Second Crossfade Slider ── */
  const slides = heroTrigger.querySelectorAll('.tk-hero__slide');
  let currentHeroIdx = 0;
  let activeSlideIdx = 0;
  let isLightboxOpen = false;
  let heroTimer = null;

  function advanceHeroSlide() {
    if (isLightboxOpen || slides.length < 2) return;
    const nextIdx = (currentHeroIdx + 1) % images.length;
    currentHeroIdx = nextIdx;
    const nextUrl = getImageUrl(images[currentHeroIdx]);

    const incomingIdx = activeSlideIdx === 0 ? 1 : 0;
    const incomingSlide = slides[incomingIdx];
    const outgoingSlide = slides[activeSlideIdx];

    incomingSlide.src = nextUrl;
    incomingSlide.classList.add('active');
    outgoingSlide.classList.remove('active');
    activeSlideIdx = incomingIdx;

    // Preload next image ahead
    const aheadIdx = (currentHeroIdx + 1) % images.length;
    preloadImage(getImageUrl(images[aheadIdx]));
  }

  function startHeroTimer() {
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(advanceHeroSlide, 2000); // exactly every 2 seconds
  }

  function pauseHeroTimer() {
    if (heroTimer) {
      clearInterval(heroTimer);
      heroTimer = null;
    }
  }

  startHeroTimer();

  heroTrigger.addEventListener('mouseenter', pauseHeroTimer);
  heroTrigger.addEventListener('mouseleave', () => {
    if (!isLightboxOpen) startHeroTimer();
  });

  /* ── 2. Full-View Lightbox Gallery (Using ONLY WhatsApp Images) ── */
  if (!lightbox) return;

  const mainImg = document.querySelector('#lightboxMainImg');
  const imgWrap = document.querySelector('#lightboxImgWrap');
  const titleEl = document.querySelector('#lightboxTitle');
  const counterEl = document.querySelector('#lightboxCounter');
  const closeBtn = document.querySelector('#lightboxCloseBtn');
  const backdrop = document.querySelector('#lightboxBackdrop');
  const thumbsContainer = document.querySelector('#lightboxThumbs');

  let currentGalleryIdx = 0;
  const thumbElements = [];

  // Populate Thumbnails under the "X"
  if (thumbsContainer) {
    thumbsContainer.innerHTML = '';
    images.forEach((filename, idx) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'tk-lightbox__thumb-item' + (idx === 0 ? ' is-active' : '');
      thumb.setAttribute('aria-label', `Showcase photo ${idx + 1}`);
      thumb.innerHTML = `<img src="${getImageUrl(filename)}" alt="NIJEDEE Project ${idx + 1}" loading="lazy">`;
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        goToGallerySlide(idx);
      });
      thumbsContainer.appendChild(thumb);
      thumbElements.push(thumb);
    });
  }

  function goToGallerySlide(idx) {
    if (idx < 0) idx = images.length - 1;
    if (idx >= images.length) idx = 0;
    currentGalleryIdx = idx;

    const targetUrl = getImageUrl(images[currentGalleryIdx]);

    if (mainImg) {
      mainImg.style.opacity = '0';
      mainImg.style.transform = 'scale(0.97)';
      setTimeout(() => {
        mainImg.src = targetUrl;
        mainImg.alt = `NIJEDEE Verified Project Showcase ${currentGalleryIdx + 1}`;
        if (titleEl) titleEl.textContent = `NIJEDEE Verified Project Showcase #${currentGalleryIdx + 1}`;
        if (counterEl) counterEl.textContent = `${currentGalleryIdx + 1} / ${images.length}`;
        mainImg.style.opacity = '1';
        mainImg.style.transform = 'scale(1)';
      }, 120);
    }

    // Update active thumbnail
    thumbElements.forEach((th, i) => {
      if (i === currentGalleryIdx) {
        th.classList.add('is-active');
        th.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        th.classList.remove('is-active');
      }
    });

    // Also sync the hero slide behind the modal
    if (slides.length >= 2) {
      currentHeroIdx = currentGalleryIdx;
      slides[activeSlideIdx].src = targetUrl;
    }
  }

  function openLightbox(startIdx = 0) {
    isLightboxOpen = true;
    pauseHeroTimer();
    goToGallerySlide(startIdx);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    isLightboxOpen = false;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    startHeroTimer();
  }

  // Open on clicking hero showcase
  heroTrigger.addEventListener('click', () => openLightbox(currentHeroIdx));
  heroTrigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(currentHeroIdx);
    }
  });

  // Close on clicking "X" button directly under image
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeLightbox();
    });
  }

  // Close on backdrop click
  if (backdrop) {
    backdrop.addEventListener('click', closeLightbox);
  }

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeLightbox();
    }
  });

  /* ── Swipe & Drag Gesture Support on Full Image (NO ARROWS) ── */
  if (imgWrap) {
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    const dragThreshold = 40; // minimum px movement to register swipe

    // Touch gestures for mobile
    imgWrap.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    imgWrap.addEventListener('touchend', (e) => {
      if (e.changedTouches.length !== 1) return;
      const diffX = e.changedTouches[0].clientX - startX;
      const diffY = e.changedTouches[0].clientY - startY;

      // Only handle horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > dragThreshold) {
        if (diffX < 0) {
          // Swiped left -> next image
          goToGallerySlide(currentGalleryIdx + 1);
        } else {
          // Swiped right -> prev image
          goToGallerySlide(currentGalleryIdx - 1);
        }
      }
    }, { passive: true });

    // Mouse drag gestures for desktop
    imgWrap.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // only left click
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
    });

    window.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > dragThreshold) {
        if (diffX < 0) {
          goToGallerySlide(currentGalleryIdx + 1);
        } else {
          goToGallerySlide(currentGalleryIdx - 1);
        }
      }
    });
  }
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
    floatBtn.innerHTML = '<svg fill="#ffffff" viewBox="0 0 32 32" width="28" height="28" style="display:block;"><path d="M26.576 5.363c-2.69-2.69-6.406-4.354-10.511-4.354-8.209 0-14.865 6.655-14.865 14.865 0 2.732 0.737 5.291 2.022 7.491l-0.038-0.070-2.109 7.702 7.879-2.067c2.051 1.139 4.498 1.809 7.102 1.809h0.006c8.209-0.003 14.862-6.659 14.862-14.868 0-4.103-1.662-7.817-4.349-10.507l0 0zM16.062 28.228h-0.005c-0 0-0.001 0-0.001 0-2.319 0-4.489-0.64-6.342-1.753l0.056 0.031-0.451-0.267-4.675 1.227 1.247-4.559-0.294-0.467c-1.185-1.862-1.889-4.131-1.889-6.565 0-6.822 5.531-12.353 12.353-12.353s12.353 5.531 12.353 12.353c0 6.822-5.53 12.353-12.353 12.353h-0zM22.838 18.977c-0.371-0.186-2.197-1.083-2.537-1.208-0.341-0.124-0.589-0.185-0.837 0.187-0.246 0.371-0.958 1.207-1.175 1.455-0.216 0.249-0.434 0.279-0.805 0.094-1.15-0.466-2.138-1.087-2.997-1.852l0.010 0.009c-0.799-0.74-1.484-1.587-2.037-2.521l-0.028-0.052c-0.216-0.371-0.023-0.572 0.162-0.757 0.167-0.166 0.372-0.434 0.557-0.65 0.146-0.179 0.271-0.384 0.366-0.604l0.006-0.017c0.043-0.087 0.068-0.188 0.068-0.296 0-0.131-0.037-0.253-0.101-0.357l0.002 0.003c-0.094-0.186-0.836-2.014-1.145-2.758-0.302-0.724-0.609-0.625-0.836-0.637-0.216-0.010-0.464-0.012-0.712-0.012-0.395 0.010-0.746 0.188-0.988 0.463l-0.001 0.002c-0.802 0.761-1.3 1.834-1.3 3.023 0 0.026 0 0.053 0.001 0.079l-0-0.004c0.131 1.467 0.681 2.784 1.527 3.857l-0.012-0.015c1.604 2.379 3.742 4.282 6.251 5.564l0.094 0.043c0.548 0.248 1.25 0.513 1.968 0.74l0.149 0.041c0.442 0.14 0.951 0.221 1.479 0.221 0.303 0 0.601-0.027 0.889-0.078l-0.031 0.004c1.069-0.223 1.956-0.868 2.497-1.749l0.009-0.017c0.165-0.366 0.261-0.793 0.261-1.242 0-0.185-0.016-0.366-0.047-0.542l0.003 0.019c-0.092-0.155-0.34-0.247-0.712-0.434z"/></svg>';
    document.body.appendChild(floatBtn);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

/* =============================================================
   Home Page Promotional Flyers Showcase & Viewer
   ============================================================= */
(function initHomeFlyers() {
  function setup() {
    const section = document.querySelector('.tk-flyers');
    if (!section) return;

    const filterBtns = section.querySelectorAll('.tk-flyers__filter-btn');
    const cards = section.querySelectorAll('.tk-flyer-card');
    const modal = document.getElementById('tkFlyerModal');
    const modalImg = document.getElementById('tkFlyerModalImg');
    const modalTitle = document.getElementById('tkFlyerModalTitle');
    const modalWa = document.getElementById('tkFlyerModalWa');
    const modalClose = document.getElementById('tkFlyerModalClose');

    // 1. Category Filtering
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter') || 'all';

        cards.forEach(card => {
          const cat = card.getAttribute('data-category') || '';
          if (filter === 'all' || cat === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    // 2. Open Modal for Full View
    function openModal(imgSrc, title, waHref) {
      if (!modal || !modalImg) return;
      modalImg.src = imgSrc;
      modalImg.alt = title || 'NIJEDEE Flyer';
      if (modalTitle) modalTitle.textContent = title || 'NIJEDEE Official Flyer';
      if (modalWa) modalWa.href = waHref || 'https://wa.me/2347085329909';
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // Attach click handlers to cards
    cards.forEach(card => {
      const imgBox = card.querySelector('.tk-flyer-card__img-box');
      const viewBtn = card.querySelector('.tk-flyer-card__btn-view');
      const img = card.querySelector('.tk-flyer-card__img');
      const titleEl = card.querySelector('.tk-flyer-card__title');
      const waBtn = card.querySelector('.tk-flyer-card__btn-wa');

      const triggerView = (e) => {
        e.preventDefault();
        const src = img ? (img.getAttribute('data-full-src') || img.src) : '';
        const title = titleEl ? titleEl.textContent.trim() : 'NIJEDEE Offer';
        const waHref = waBtn ? waBtn.href : 'https://wa.me/2347085329909';
        openModal(src, title, waHref);
      };

      if (imgBox) imgBox.addEventListener('click', triggerView);
      if (viewBtn) viewBtn.addEventListener('click', triggerView);
    });

    // Modal close listeners
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();

/* ── Universal Image Lightbox (Identical to Home Screen Showcase) ─ */
(function initGlobalImageLightbox() {
  let lightbox = null;
  let backdrop = null;
  let mainImg = null;
  let imgWrap = null;
  let titleEl = null;
  let counterEl = null;
  let hintEl = null;
  let closeBtn = null;
  let thumbsWrapper = null;
  let thumbsContainer = null;

  let currentGallery = [];
  let currentIdx = 0;
  let thumbElements = [];

  function ensureLightbox() {
    if (document.getElementById('tkUniversalLightbox')) {
      lightbox = document.getElementById('tkUniversalLightbox');
      backdrop = document.getElementById('univLightboxBackdrop');
      mainImg = document.getElementById('univLightboxMainImg');
      imgWrap = document.getElementById('univLightboxImgWrap');
      titleEl = document.getElementById('univLightboxTitle');
      counterEl = document.getElementById('univLightboxCounter');
      hintEl = document.getElementById('univLightboxHint');
      closeBtn = document.getElementById('univLightboxCloseBtn');
      thumbsWrapper = document.getElementById('univLightboxThumbsWrapper');
      thumbsContainer = document.getElementById('univLightboxThumbs');
      return;
    }

    lightbox = document.createElement('div');
    lightbox.id = 'tkUniversalLightbox';
    lightbox.className = 'tk-lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'NIJEDEE Verified Item Full View');

    // Exactly matching the home screen HTML structure
    lightbox.innerHTML = `
      <div class="tk-lightbox__backdrop" id="univLightboxBackdrop"></div>
      <div class="tk-lightbox__container" role="document">
        
        <!-- 1. FULL VIEW IMAGE (Swipable, NO arrows!) -->
        <div class="tk-lightbox__stage">
          <div class="tk-lightbox__img-wrap" id="univLightboxImgWrap" title="Swipe left or right to switch images">
            <img id="univLightboxMainImg" class="tk-lightbox__img" src="" alt="NIJEDEE Full View Preview" draggable="false">
          </div>
          <div class="tk-lightbox__caption">
            <span class="tk-lightbox__title" id="univLightboxTitle">NIJEDEE Verified Item</span>
            <span class="tk-lightbox__counter" id="univLightboxCounter">1 / 1</span>
          </div>
          <div class="tk-lightbox__hint" id="univLightboxHint">
            <span>Swipe left &middot; right or click images below</span>
          </div>
        </div>

        <!-- 2. "X" BUTTON UNDER THE IMAGE TO CLOSE -->
        <div class="tk-lightbox__close-bar">
          <button type="button" id="univLightboxCloseBtn" class="tk-lightbox__close-btn" aria-label="Close full view gallery">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>Close</span>
          </button>
        </div>

        <!-- 3. SLIDABLE THUMBNAILS OF ALL IMAGES UNDER THE "X" -->
        <div class="tk-lightbox__thumbs-wrapper" id="univLightboxThumbsWrapper">
          <div class="tk-lightbox__thumbs-scroll" id="univLightboxThumbs" tabindex="0" aria-label="Images list">
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(lightbox);

    backdrop = document.getElementById('univLightboxBackdrop');
    mainImg = document.getElementById('univLightboxMainImg');
    imgWrap = document.getElementById('univLightboxImgWrap');
    titleEl = document.getElementById('univLightboxTitle');
    counterEl = document.getElementById('univLightboxCounter');
    hintEl = document.getElementById('univLightboxHint');
    closeBtn = document.getElementById('univLightboxCloseBtn');
    thumbsWrapper = document.getElementById('univLightboxThumbsWrapper');
    thumbsContainer = document.getElementById('univLightboxThumbs');

    // Close on "X" button
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
      });
    }

    // Close on backdrop click
    if (backdrop) {
      backdrop.addEventListener('click', closeLightbox);
    }

    // Keyboard navigation (Escape to close, arrows to slide)
    window.addEventListener('keydown', (e) => {
      if (!lightbox || !lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        goToSlide(currentIdx - 1);
      } else if (e.key === 'ArrowRight') {
        goToSlide(currentIdx + 1);
      }
    });

    // Touch swipe left/right on main image (NO ARROWS)
    if (imgWrap) {
      let startX = 0;
      let startY = 0;
      const dragThreshold = 35;

      imgWrap.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });

      imgWrap.addEventListener('touchend', (e) => {
        if (e.changedTouches.length !== 1) return;
        const diffX = e.changedTouches[0].clientX - startX;
        const diffY = e.changedTouches[0].clientY - startY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > dragThreshold) {
          if (diffX < 0) {
            goToSlide(currentIdx + 1);
          } else {
            goToSlide(currentIdx - 1);
          }
        }
      }, { passive: true });
    }
  }

  function goToSlide(idx) {
    if (!currentGallery.length) return;
    if (idx < 0) idx = currentGallery.length - 1;
    if (idx >= currentGallery.length) idx = 0;
    currentIdx = idx;

    const item = currentGallery[currentIdx];
    if (mainImg) {
      mainImg.style.opacity = '0';
      mainImg.style.transform = 'scale(0.97)';
      setTimeout(() => {
        mainImg.src = item.src;
        mainImg.alt = item.caption || 'NIJEDEE Verified Item';
        if (titleEl) titleEl.textContent = item.caption || 'NIJEDEE Verified Item';
        if (counterEl) {
          if (currentGallery.length > 1) {
            counterEl.textContent = `${currentIdx + 1} / ${currentGallery.length}`;
            counterEl.style.display = 'inline-block';
          } else {
            counterEl.style.display = 'none';
          }
        }
        mainImg.style.opacity = '1';
        mainImg.style.transform = 'scale(1)';
      }, 100);
    }

    // Update active thumbnail
    thumbElements.forEach((th, i) => {
      if (i === currentIdx) {
        th.classList.add('is-active');
        th.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        th.classList.remove('is-active');
      }
    });
  }

  function openLightbox(items, startIndex = 0, defaultTitle = '') {
    ensureLightbox();
    if (!items) return;

    let normalized = [];
    if (typeof items === 'string') {
      normalized = [{ src: items, caption: defaultTitle || 'NIJEDEE Verified Item' }];
    } else if (Array.isArray(items)) {
      if (!items.length) return;
      normalized = items.map((it, idx) => {
        if (typeof it === 'string') {
          return { src: it, caption: defaultTitle || `Photo ${idx + 1}` };
        }
        return {
          src: it.src || '',
          caption: it.caption || defaultTitle || `Photo ${idx + 1}`
        };
      });
    } else if (typeof items === 'object' && items.src) {
      normalized = [items];
    } else {
      return;
    }

    currentGallery = normalized;
    currentIdx = Math.max(0, Math.min(startIndex, currentGallery.length - 1));
    thumbElements = [];

    // Populate thumbnail strip under the "X" if multiple images
    if (currentGallery.length > 1) {
      thumbsWrapper.style.display = 'block';
      hintEl.style.display = 'block';
      counterEl.style.display = 'inline-block';
      thumbsContainer.innerHTML = '';

      currentGallery.forEach((item, idx) => {
        const thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.className = 'tk-lightbox__thumb-item' + (idx === currentIdx ? ' is-active' : '');
        thumb.setAttribute('aria-label', `Photo ${idx + 1}`);
        thumb.innerHTML = `<img src="${item.src}" alt="${item.caption || 'Photo'} ${idx + 1}" loading="lazy">`;
        thumb.addEventListener('click', (e) => {
          e.stopPropagation();
          goToSlide(idx);
        });
        thumbsContainer.appendChild(thumb);
        thumbElements.push(thumb);
      });
    } else {
      // Single image: hide thumbnails strip and hint
      thumbsWrapper.style.display = 'none';
      hintEl.style.display = 'none';
      counterEl.style.display = 'none';
    }

    goToSlide(currentIdx);

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
    }
    const admLb = document.getElementById('admLightbox');
    if (admLb) admLb.classList.remove('open');
    document.body.style.overflow = '';
  }

  function isEligibleImage(img) {
    if (!img) return false;
    const src = (img.getAttribute('src') || '').toLowerCase();
    const alt = (img.getAttribute('alt') || '').toLowerCase();

    // Ignore SVGs, logos, whatsapp icon, and tiny icons
    if (src.endsWith('.svg') || src.includes('.svg?')) return false;
    if (src.includes('logo') || alt.includes('logo')) return false;
    if (src.includes('whatsapp') || alt.includes('whatsapp')) return false;
    if (src.includes('favicon')) return false;

    // Ignore header and footer branding
    if (img.closest('.tk-header__brand') || img.closest('.tk-footer__brand') || img.closest('.tk-footer__social')) {
      return false;
    }

    // Don't bind images inside the lightbox itself!
    if (img.closest('#tkImageLightbox') || img.closest('#tkUniversalLightbox')) {
      return false;
    }

    if (img.dataset.noLightbox === 'true') return false;

    return true;
  }

  function scanAndBind() {
    ensureLightbox();
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.dataset.hasLightbox) return;
      if (!isEligibleImage(img)) return;

      img.dataset.hasLightbox = 'true';
      img.style.cursor = 'zoom-in';

      img.addEventListener('click', function(e) {
        // Don't hijack functional action buttons
        const parentLink = this.closest('a');
        if (parentLink) {
          const href = parentLink.getAttribute('href') || '';
          if (href.startsWith('tel:') || href.startsWith('mailto:') || href.includes('wa.me') || parentLink.classList.contains('tk-btn')) {
            return;
          }
          e.preventDefault();
        }

        const clickedSrc = this.getAttribute('data-full-src') || this.currentSrc || this.src;
        const caption = this.getAttribute('alt') || this.getAttribute('title') || '';

        // Check if image belongs to a card container with multiple photos (like properties or products)
        let group = [];
        const cardContainer = this.closest('.product-card-item') ||
                              this.closest('.prop-cat-card') ||
                              this.closest('#available-listings > div > div') ||
                              this.closest('.tk-flyer-card') ||
                              this.closest('.project-card') ||
                              this.closest('.properties-gallery');

        if (cardContainer) {
          const siblings = cardContainer.querySelectorAll('img');
          siblings.forEach(sImg => {
            if (isEligibleImage(sImg)) {
              const sSrc = sImg.getAttribute('data-full-src') || sImg.currentSrc || sImg.src;
              const sCaption = sImg.getAttribute('alt') || sImg.getAttribute('title') || caption;
              if (sSrc && !group.some(item => item.src === sSrc)) {
                group.push({ src: sSrc, caption: sCaption });
              }
            }
          });
        }

        if (group.length > 1) {
          const startIdx = group.findIndex(item => item.src === clickedSrc);
          openLightbox(group, startIdx >= 0 ? startIdx : 0);
        } else {
          openLightbox([{ src: clickedSrc, caption: caption }], 0);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAndBind);
  } else {
    scanAndBind();
  }

  if (window.MutationObserver && document.body) {
    const observer = new MutationObserver(() => scanAndBind());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.openGlobalLightbox = (items, startIdx, title) => openLightbox(items, startIdx, title);
  window.openUniversalGallery = (items, startIdx, title) => openLightbox(items, startIdx, title);
  window.openLightbox = (items, startIdx, title) => openLightbox(items, startIdx, title);
  window.closeLightbox = closeLightbox;
  window.refreshGlobalLightbox = scanAndBind;
})();
