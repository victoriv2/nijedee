/**
 * NIJEDEE Custom Modal Dialog System
 * Replaces native browser alert() and confirm() with modern, responsive, on-brand dialog modals.
 * Zero external dependencies. Works across mobile and desktop.
 */

(function () {
  'use strict';

  // Inject modal markup and styling on load
  function initCustomDialog() {
    if (document.getElementById('njdCustomDialogOverlay')) return;

    const style = document.createElement('style');
    style.id = 'njdCustomDialogStyles';
    style.textContent = `
      .njd-dialog-overlay {
        position: fixed;
        inset: 0;
        background: rgba(7, 34, 79, 0.75);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 9999999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .njd-dialog-overlay.open {
        display: flex !important;
        opacity: 1 !important;
      }
      .njd-dialog-card {
        background: #FFFFFF;
        width: 100%;
        max-width: 440px;
        border-radius: 16px;
        box-shadow: 0 20px 50px rgba(7, 34, 79, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8);
        overflow: hidden;
        transform: scale(0.94);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .njd-dialog-overlay.open .njd-dialog-card {
        transform: scale(1) !important;
      }
      .njd-dialog-header {
        padding: 22px 24px 16px;
        display: flex;
        align-items: flex-start;
        gap: 14px;
      }
      .njd-dialog-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .njd-dialog-icon--info {
        background: #EBF3FE;
        color: #0B5ED7;
      }
      .njd-dialog-icon--success {
        background: #ECFDF5;
        color: #10B981;
      }
      .njd-dialog-icon--warning {
        background: #FEF3C7;
        color: #D97706;
      }
      .njd-dialog-icon--danger {
        background: #FEE2E2;
        color: #EF4444;
      }
      .njd-dialog-header-text {
        flex: 1;
        min-width: 0;
      }
      .njd-dialog-title {
        margin: 0 0 6px;
        font-size: 1.15rem;
        font-weight: 800;
        color: #07224F;
        line-height: 1.3;
      }
      .njd-dialog-message {
        margin: 0;
        font-size: 0.92rem;
        color: #475569;
        line-height: 1.55;
        white-space: pre-line;
        word-break: break-word;
      }
      .njd-dialog-actions {
        padding: 16px 24px 20px;
        background: #F8FAFC;
        border-top: 1px solid #E2E8F0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .njd-dialog-btn {
        padding: 10px 18px;
        border-radius: 8px;
        font-size: 0.88rem;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: background-color 0.15s ease, transform 0.1s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        box-sizing: border-box;
      }
      .njd-dialog-btn:active {
        transform: scale(0.98);
      }
      .njd-dialog-btn--cancel {
        background: #FFFFFF;
        color: #475569;
        border: 1.5px solid #CBD5E1;
      }
      .njd-dialog-btn--cancel:hover {
        background: #F1F5F9;
        color: #0F172A;
      }
      .njd-dialog-btn--primary {
        background: #0B5ED7;
        color: #FFFFFF;
      }
      .njd-dialog-btn--primary:hover {
        background: #094CB0;
      }
      .njd-dialog-btn--success {
        background: #10B981;
        color: #FFFFFF;
      }
      .njd-dialog-btn--success:hover {
        background: #059669;
      }
      .njd-dialog-btn--danger {
        background: #EF4444;
        color: #FFFFFF;
      }
      .njd-dialog-btn--danger:hover {
        background: #DC2626;
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'njdCustomDialogOverlay';
    overlay.className = 'njd-dialog-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="njd-dialog-card" id="njdCustomDialogCard">
        <div class="njd-dialog-header">
          <div class="njd-dialog-icon njd-dialog-icon--info" id="njdDialogIcon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div class="njd-dialog-header-text">
            <h4 class="njd-dialog-title" id="njdDialogTitle">NIJEDEE Notification</h4>
            <p class="njd-dialog-message" id="njdDialogMessage"></p>
          </div>
        </div>
        <div class="njd-dialog-actions" id="njdDialogActions">
          <button type="button" class="njd-dialog-btn njd-dialog-btn--cancel" id="njdDialogCancelBtn" style="display:none;">Cancel</button>
          <button type="button" class="njd-dialog-btn njd-dialog-btn--primary" id="njdDialogConfirmBtn">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // Icons map
  const ICONS = {
    info: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `,
    success: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `,
    warning: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `,
    danger: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `
  };

  /**
   * Shows a custom modal alert.
   * Returns a Promise that resolves when the user clicks OK or closes.
   */
  function showCustomAlert(optionsOrMessage, title = 'Notification', type = 'info') {
    return new Promise((resolve) => {
      initCustomDialog();

      let msg = '';
      let ttl = title;
      let typ = type;
      let btnText = 'OK';

      if (typeof optionsOrMessage === 'object' && optionsOrMessage !== null) {
        msg = optionsOrMessage.message || '';
        ttl = optionsOrMessage.title || title;
        typ = optionsOrMessage.type || type;
        btnText = optionsOrMessage.confirmText || 'OK';
      } else {
        msg = String(optionsOrMessage || '');
      }

      // Auto-detect type from message
      const lower = (msg + ' ' + ttl).toLowerCase();
      if (!typ || typ === 'info') {
        if (lower.includes('success') || lower.includes('saved') || lower.includes('completed') || lower.includes('cleared')) {
          typ = 'success';
        } else if (lower.includes('error') || lower.includes('fail') || lower.includes('cannot')) {
          typ = 'danger';
        } else if (lower.includes('warning') || lower.includes('delete') || lower.includes('remove')) {
          typ = 'warning';
        }
      }

      const overlay = document.getElementById('njdCustomDialogOverlay');
      const iconEl = document.getElementById('njdDialogIcon');
      const titleEl = document.getElementById('njdDialogTitle');
      const msgEl = document.getElementById('njdDialogMessage');
      const cancelBtn = document.getElementById('njdDialogCancelBtn');
      const confirmBtn = document.getElementById('njdDialogConfirmBtn');

      iconEl.className = `njd-dialog-icon njd-dialog-icon--${typ}`;
      iconEl.innerHTML = ICONS[typ] || ICONS.info;
      titleEl.textContent = ttl;
      msgEl.textContent = msg;

      cancelBtn.style.display = 'none';
      confirmBtn.className = `njd-dialog-btn njd-dialog-btn--${typ === 'danger' ? 'danger' : 'primary'}`;
      confirmBtn.textContent = btnText;

      const cleanup = () => {
        overlay.classList.remove('open');
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        document.removeEventListener('keydown', onKey);
      };

      const onKey = (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          cleanup();
          resolve(true);
        }
      };

      confirmBtn.onclick = () => {
        cleanup();
        resolve(true);
      };

      document.addEventListener('keydown', onKey);
      overlay.classList.add('open');
      confirmBtn.focus();
    });
  }

  /**
   * Shows a custom confirmation modal with Cancel and Confirm buttons.
   * Returns a Promise that resolves to true (confirmed) or false (cancelled).
   */
  function showCustomConfirm(optionsOrMessage, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning') {
    return new Promise((resolve) => {
      initCustomDialog();

      let msg = '';
      let ttl = title;
      let typ = type;
      let okText = confirmText;
      let noText = cancelText;

      if (typeof optionsOrMessage === 'object' && optionsOrMessage !== null) {
        msg = optionsOrMessage.message || '';
        ttl = optionsOrMessage.title || title;
        typ = optionsOrMessage.type || type;
        okText = optionsOrMessage.confirmText || confirmText;
        noText = optionsOrMessage.cancelText || cancelText;
      } else {
        msg = String(optionsOrMessage || '');
      }

      const lower = (msg + ' ' + ttl).toLowerCase();
      if (lower.includes('delete') || lower.includes('permanent') || lower.includes('remove') || lower.includes('clear')) {
        typ = 'danger';
      }

      const overlay = document.getElementById('njdCustomDialogOverlay');
      const iconEl = document.getElementById('njdDialogIcon');
      const titleEl = document.getElementById('njdDialogTitle');
      const msgEl = document.getElementById('njdDialogMessage');
      const cancelBtn = document.getElementById('njdDialogCancelBtn');
      const confirmBtn = document.getElementById('njdDialogConfirmBtn');

      iconEl.className = `njd-dialog-icon njd-dialog-icon--${typ}`;
      iconEl.innerHTML = ICONS[typ] || ICONS.warning;
      titleEl.textContent = ttl;
      msgEl.textContent = msg;

      cancelBtn.style.display = 'inline-flex';
      cancelBtn.textContent = noText;
      confirmBtn.className = `njd-dialog-btn njd-dialog-btn--${typ === 'danger' ? 'danger' : 'primary'}`;
      confirmBtn.textContent = okText;

      const cleanup = () => {
        overlay.classList.remove('open');
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        document.removeEventListener('keydown', onKey);
      };

      const onKey = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(false);
        } else if (e.key === 'Enter') {
          cleanup();
          resolve(true);
        }
      };

      confirmBtn.onclick = () => {
        cleanup();
        resolve(true);
      };

      cancelBtn.onclick = () => {
        cleanup();
        resolve(false);
      };

      document.addEventListener('keydown', onKey);
      overlay.classList.add('open');
      confirmBtn.focus();
    });
  }

  // Sitewide overrides and global registration
  window.showCustomAlert = showCustomAlert;
  window.showCustomConfirm = showCustomConfirm;
  window.njdAlert = showCustomAlert;
  window.njdConfirm = showCustomConfirm;

  // Intercept window.alert so ANY caller automatically displays the on-brand custom dialog
  window.alert = function (message) {
    showCustomAlert(message, 'NIJEDEE Notification');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomDialog);
  } else {
    initCustomDialog();
  }
})();
