/**
 * NIJEDEE - Universal Custom Modular Picker & Bottom Sheet Modal
 * Seamlessly upgrades standard HTML <select> elements into:
 *  - Polished Custom Modal Dialog (on Desktop >= 768px)
 *  - Sleek Bottom Sheet Modal / Action Sheet (on Mobile < 768px)
 * Strictly zero emojis, zero hover lifts, and 100% two-way sync with native form validation.
 */

(function () {
  let activeSelectEl = null;
  let activeTriggerEl = null;
  let backdropEl = null;
  let dialogEl = null;
  let titleEl = null;
  let searchInputEl = null;
  let searchWrapEl = null;
  let listEl = null;
  let currentOptions = [];

  function createPickerElements() {
    if (dialogEl) return;

    // Backdrop
    backdropEl = document.createElement('div');
    backdropEl.className = 'custom-picker-backdrop';
    backdropEl.setAttribute('aria-hidden', 'true');
    backdropEl.addEventListener('click', closePicker);

    // Dialog (Modal on Desktop / Bottom Sheet on Mobile)
    dialogEl = document.createElement('div');
    dialogEl.className = 'custom-picker-dialog';
    dialogEl.setAttribute('role', 'dialog');
    dialogEl.setAttribute('aria-modal', 'true');

    dialogEl.innerHTML = `
      <div class="custom-picker-handle">
        <div class="custom-picker-handle__pill"></div>
      </div>
      <div class="custom-picker-header">
        <h3 class="custom-picker-header__title" id="customPickerTitle">Select Option</h3>
        <button type="button" class="custom-picker-header__close" aria-label="Close picker">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="custom-picker-search" id="customPickerSearchWrap">
        <span class="custom-picker-search__icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input type="text" id="customPickerSearchInput" placeholder="Search options..." autocomplete="off">
      </div>
      <ul class="custom-picker-list" id="customPickerList" role="listbox"></ul>
    `;

    document.body.appendChild(backdropEl);
    document.body.appendChild(dialogEl);

    titleEl = dialogEl.querySelector('#customPickerTitle');
    searchWrapEl = dialogEl.querySelector('#customPickerSearchWrap');
    searchInputEl = dialogEl.querySelector('#customPickerSearchInput');
    listEl = dialogEl.querySelector('#customPickerList');

    const closeBtn = dialogEl.querySelector('.custom-picker-header__close');
    closeBtn.addEventListener('click', closePicker);

    searchInputEl.addEventListener('input', function (e) {
      filterOptions(e.target.value);
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dialogEl.classList.contains('active')) {
        closePicker();
      }
    });

    // Mobile swipe down to close handle
    let touchStartY = 0;
    let touchDiffY = 0;
    const handleEl = dialogEl.querySelector('.custom-picker-handle');
    if (handleEl) {
      handleEl.addEventListener('touchstart', function (e) {
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      handleEl.addEventListener('touchmove', function (e) {
        touchDiffY = e.touches[0].clientY - touchStartY;
      }, { passive: true });

      handleEl.addEventListener('touchend', function () {
        if (touchDiffY > 50) {
          closePicker();
        }
        touchStartY = 0;
        touchDiffY = 0;
      });
    }
  }

  function getSelectTitle(select) {
    if (select.getAttribute('data-picker-title')) {
      return select.getAttribute('data-picker-title');
    }
    // Check parent label or associated label
    if (select.id) {
      const label = document.querySelector(`label[for="${select.id}"]`);
      if (label) {
        const text = label.textContent.replace(/\*/g, '').trim();
        if (text) return text;
      }
    }
    const parentLabel = select.closest('label');
    if (parentLabel) {
      const text = parentLabel.firstChild ? parentLabel.firstChild.textContent.trim() : '';
      if (text) return text;
    }
    if (select.getAttribute('aria-label')) return select.getAttribute('aria-label');
    if (select.title) return select.title;
    if (select.name) return select.name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return 'Select Option';
  }

  function openPicker(select, trigger) {
    createPickerElements();
    activeSelectEl = select;
    activeTriggerEl = trigger;

    // Update Title
    titleEl.textContent = getSelectTitle(select);

    // Extract options
    currentOptions = [];
    const optEls = select.querySelectorAll('option');
    optEls.forEach((opt, idx) => {
      currentOptions.push({
        text: opt.textContent.trim(),
        value: opt.value,
        selected: opt.selected || select.value === opt.value,
        disabled: opt.disabled,
        index: idx
      });
    });

    // Toggle search bar (only for > 5 options)
    if (currentOptions.length > 5) {
      searchWrapEl.style.display = 'block';
      searchInputEl.value = '';
    } else {
      searchWrapEl.style.display = 'none';
      searchInputEl.value = '';
    }

    renderOptions(currentOptions);

    // Open active state
    trigger.classList.add('active');
    backdropEl.classList.add('active');
    dialogEl.classList.add('active');
    document.body.classList.add('custom-picker-open');

    // Scroll to currently selected item
    setTimeout(() => {
      const selectedItem = listEl.querySelector('.custom-picker-item.selected');
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
      if (window.innerWidth >= 768 && currentOptions.length > 5) {
        searchInputEl.focus();
      }
    }, 50);
  }

  function closePicker() {
    if (!dialogEl) return;
    dialogEl.classList.remove('active');
    backdropEl.classList.remove('active');
    document.body.classList.remove('custom-picker-open');
    if (activeTriggerEl) {
      activeTriggerEl.classList.remove('active');
      activeTriggerEl.focus();
    }
    activeSelectEl = null;
    activeTriggerEl = null;
  }

  function renderOptions(opts) {
    listEl.innerHTML = '';
    if (opts.length === 0) {
      listEl.innerHTML = '<li class="custom-picker-empty">No matching options found</li>';
      return;
    }

    opts.forEach(opt => {
      const li = document.createElement('li');
      li.className = 'custom-picker-item';
      if (opt.selected) li.classList.add('selected');
      if (opt.disabled) li.classList.add('disabled');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', opt.selected ? 'true' : 'false');

      li.innerHTML = `
        <span class="custom-picker-item__label">${opt.text}</span>
        <span class="custom-picker-item__check">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      `;

      if (!opt.disabled) {
        li.addEventListener('click', function () {
          selectOption(opt);
        });
      }

      listEl.appendChild(li);
    });
  }

  function filterOptions(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      renderOptions(currentOptions);
      return;
    }
    const filtered = currentOptions.filter(o => o.text.toLowerCase().includes(q));
    renderOptions(filtered);
  }

  function selectOption(opt) {
    if (!activeSelectEl) return;

    activeSelectEl.value = opt.value;
    activeSelectEl.selectedIndex = opt.index;

    // Update trigger text
    if (activeTriggerEl) {
      const textSpan = activeTriggerEl.querySelector('.custom-select-trigger__text');
      if (textSpan) {
        textSpan.textContent = opt.text;
      }
      if (!opt.value) {
        activeTriggerEl.classList.add('has-placeholder');
      } else {
        activeTriggerEl.classList.remove('has-placeholder');
      }
    }

    // Trigger standard native events
    activeSelectEl.dispatchEvent(new Event('input', { bubbles: true }));
    activeSelectEl.dispatchEvent(new Event('change', { bubbles: true }));

    closePicker();
  }

  function updateTriggerDisplay(select, trigger) {
    const textSpan = trigger.querySelector('.custom-select-trigger__text');
    if (!textSpan) return;

    const selectedOpt = select.options[select.selectedIndex] || select.options[0];
    if (selectedOpt) {
      textSpan.textContent = selectedOpt.textContent.trim();
      if (!selectedOpt.value) {
        trigger.classList.add('has-placeholder');
      } else {
        trigger.classList.remove('has-placeholder');
      }
    } else {
      textSpan.textContent = 'Select Option';
      trigger.classList.add('has-placeholder');
    }
  }

  function enhanceSelect(select) {
    if (!select) return;
    if (select.dataset.customPickerEnhanced === 'true') return;
    if (select.hasAttribute('data-no-custom')) return;
    if (select.closest('.custom-select-wrapper')) return;

    select.dataset.customPickerEnhanced = 'true';
    select.classList.add('custom-select-native-hidden');
    select.tabIndex = -1;

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';

    // Insert wrapper before select and move select inside
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    if (select.classList.contains('form-control')) trigger.classList.add('form-control');
    if (select.classList.contains('adm-filter-select')) trigger.classList.add('adm-filter-select');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');

    trigger.innerHTML = `
      <span class="custom-select-trigger__text"></span>
      <span class="custom-select-trigger__icon">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    `;

    wrapper.insertBefore(trigger, select);
    updateTriggerDisplay(select, trigger);

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openPicker(select, trigger);
    });

    // Keyboard trigger
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openPicker(select, trigger);
      }
    });

    // Listen to native change event if updated programmatically
    select.addEventListener('change', function () {
      updateTriggerDisplay(select, trigger);
    });

    // Observe changes to child <option> elements
    const observer = new MutationObserver(function () {
      updateTriggerDisplay(select, trigger);
    });
    observer.observe(select, { childList: true, subtree: true, attributes: true });
  }

  function initAll() {
    const selects = document.querySelectorAll('select:not([data-no-custom]):not([data-custom-picker-enhanced="true"])');
    selects.forEach(enhanceSelect);
  }

  // Global exports
  window.initCustomPickers = initAll;
  window.initCustomModularPickers = initAll;
  window.refreshCustomPicker = function (select) {
    if (select) {
      const wrapper = select.closest('.custom-select-wrapper');
      if (wrapper) {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        if (trigger) updateTriggerDisplay(select, trigger);
      } else {
        enhanceSelect(select);
      }
    }
  };

  // Run on ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Auto-observe newly inserted <select> elements in dynamically loaded DOM
  const bodyObserver = new MutationObserver(function (mutations) {
    let hasNewSelect = false;
    for (const m of mutations) {
      if (m.addedNodes.length) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            if (node.tagName === 'SELECT' || node.querySelector?.('select')) {
              hasNewSelect = true;
              break;
            }
          }
        }
      }
      if (hasNewSelect) break;
    }
    if (hasNewSelect) {
      initAll();
    }
  });

  if (document.body) {
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
