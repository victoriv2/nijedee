/**
 * NIJEDEE - Multi-Image Uploader Component
 * Allows users to add multiple images (up to 5 max), preview thumbnails,
 * view auto-compression indicators, and individually remove images.
 * Keeps input.files in sync via DataTransfer.
 * STRICTLY NO UNICODE EMOJIS.
 */

(function () {
  'use strict';

  const MAX_IMAGES_DEFAULT = 5;

  // Inject CSS styles once
  function injectStyles() {
    if (document.getElementById('nijedee-multi-img-styles')) return;
    const style = document.createElement('style');
    style.id = 'nijedee-multi-img-styles';
    style.textContent = `
      .multi-img-wrapper {
        width: 100%;
        max-width: 100% !important;
        box-sizing: border-box !important;
        margin-top: 6px;
        font-family: inherit;
      }
      .multi-img-dropzone {
        border: 1.5px dashed #CBD5E1;
        background: #F8FAFC;
        border-radius: 10px;
        padding: 16px 14px;
        text-align: center;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        max-width: 100% !important;
        box-sizing: border-box !important;
        user-select: none;
      }
      .multi-img-dropzone:hover, .multi-img-dropzone.dragover {
        border-color: #2563EB;
        background: #EFF6FF;
      }
      .multi-img-dropzone.is-full {
        display: none !important;
      }
      .multi-img-icon-wrap {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #E0E7FF;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #2563EB;
        margin-bottom: 2px;
      }
      .multi-img-title {
        font-size: 0.88rem;
        font-weight: 700;
        color: #0F172A;
      }
      .multi-img-hint {
        font-size: 0.76rem;
        color: #64748B;
        line-height: 1.4;
      }
      .multi-img-status-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 8px;
        padding: 4px 2px;
        font-size: 0.78rem;
        color: #64748B;
      }
      .multi-img-badge {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 999px;
        background: #E2E8F0;
        color: #334155;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .multi-img-badge.active {
        background: #DBEAFE;
        color: #1D4ED8;
      }
      .multi-img-badge.full {
        background: #FEF3C7;
        color: #B45309;
      }
      .multi-img-previews {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
        gap: 10px;
        margin-top: 10px;
        width: 100%;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      .multi-img-card {
        position: relative;
        border-radius: 8px;
        border: 1.5px solid #E2E8F0;
        background: #ffffff;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box !important;
      }
      .multi-img-thumb-wrap {
        width: 100%;
        height: 75px;
        position: relative;
        background: #F1F5F9;
      }
      .multi-img-thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .multi-img-remove-btn {
        position: absolute;
        top: 3px;
        right: 3px;
        width: 22px;
        height: 22px;
        background: rgba(15, 23, 42, 0.8);
        color: #ffffff;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        line-height: 1;
        padding: 0;
        transition: background 0.15s, transform 0.15s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
      .multi-img-remove-btn:hover {
        background: #DC2626;
      }
      .multi-img-info {
        padding: 4px 6px;
        width: 100%;
        box-sizing: border-box !important;
        background: #ffffff;
        text-align: center;
        border-top: 1px solid #F1F5F9;
      }
      .multi-img-size {
        font-size: 0.68rem;
        color: #64748B;
        font-weight: 600;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .multi-img-add-tile {
        border: 1.5px dashed #93C5FD;
        background: #EFF6FF;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-height: 100px;
        cursor: pointer;
        color: #2563EB;
        font-size: 0.75rem;
        font-weight: 700;
        transition: background 0.2s, border-color 0.2s;
        box-sizing: border-box !important;
        padding: 6px;
        text-align: center;
        user-select: none;
      }
      .multi-img-add-tile:hover {
        background: #DBEAFE;
        border-color: #1D4ED8;
      }
    `;
    document.head.appendChild(style);
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Initializes multi-image uploader on a specific file input element.
   * @param {HTMLInputElement} inputEl
   * @param {Object} options
   */
  function setupMultiImageUploader(inputEl, options = {}) {
    if (!inputEl || inputEl.dataset.multiImgInit === 'true') return;
    inputEl.dataset.multiImgInit = 'true';

    const maxFiles = parseInt(inputEl.dataset.maxFiles || options.maxFiles || MAX_IMAGES_DEFAULT, 10);
    const allowMultiple = maxFiles > 1;

    // Track selected files
    let selectedFiles = [];
    const objectUrlMap = new Map();

    // Hide original input but keep it accessible for form submissions
    inputEl.style.position = 'absolute';
    inputEl.style.opacity = '0';
    inputEl.style.pointerEvents = 'none';
    inputEl.style.width = '0';
    inputEl.style.height = '0';
    inputEl.tabIndex = -1;

    // Create container
    const wrapper = document.createElement('div');
    wrapper.className = 'multi-img-wrapper';

    // Dropzone markup
    const dropzone = document.createElement('div');
    dropzone.className = 'multi-img-dropzone';
    dropzone.innerHTML = `
      <div class="multi-img-icon-wrap">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
      </div>
      <div class="multi-img-title">Click to choose photos or drag &amp; drop</div>
      <div class="multi-img-hint">Add up to ${maxFiles} images &bull; Auto-compressed to &lt; 100KB for upload</div>
    `;

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.className = 'multi-img-status-bar';
    statusBar.style.display = 'none';

    const statusText = document.createElement('span');
    statusText.textContent = `0 of ${maxFiles} photos added`;

    const badge = document.createElement('span');
    badge.className = 'multi-img-badge';
    badge.textContent = `0 / ${maxFiles}`;

    statusBar.appendChild(statusText);
    statusBar.appendChild(badge);

    // Previews container
    const previewGrid = document.createElement('div');
    previewGrid.className = 'multi-img-previews';
    previewGrid.style.display = 'none';

    wrapper.appendChild(dropzone);
    wrapper.appendChild(statusBar);
    wrapper.appendChild(previewGrid);

    // Insert wrapper right after the original input
    inputEl.parentNode.insertBefore(wrapper, inputEl.nextSibling);

    // Synchronize files to native input using DataTransfer
    function syncNativeInput() {
      try {
        const dt = new DataTransfer();
        selectedFiles.forEach((file) => dt.items.add(file));
        inputEl.files = dt.files;
      } catch (err) {
        console.warn('DataTransfer not supported in this browser, relying on custom array', err);
      }
      inputEl._selectedFiles = selectedFiles;
      
      // Dispatch change event
      const event = new Event('change', { bubbles: true });
      inputEl.dispatchEvent(event);
    }

    // Refresh UI
    function render() {
      const count = selectedFiles.length;

      // Update status
      if (count === 0) {
        statusBar.style.display = 'none';
        previewGrid.style.display = 'none';
        dropzone.classList.remove('is-full');
      } else {
        statusBar.style.display = 'flex';
        previewGrid.style.display = 'grid';

        if (count >= maxFiles) {
          dropzone.classList.add('is-full');
          statusText.innerHTML = `<strong>Maximum ${maxFiles} photos attached</strong>`;
          badge.className = 'multi-img-badge full';
          badge.textContent = `${count} / ${maxFiles} (Max)`;
        } else {
          dropzone.classList.remove('is-full');
          statusText.textContent = `${count} of ${maxFiles} photos added (Click to add more)`;
          badge.className = 'multi-img-badge active';
          badge.textContent = `${count} / ${maxFiles}`;
        }
      }

      // Render cards
      previewGrid.innerHTML = '';

      selectedFiles.forEach((file, index) => {
        let objectUrl = objectUrlMap.get(file);
        if (!objectUrl) {
          objectUrl = URL.createObjectURL(file);
          objectUrlMap.set(file, objectUrl);
        }

        const card = document.createElement('div');
        card.className = 'multi-img-card';

        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'multi-img-thumb-wrap';

        const img = document.createElement('img');
        img.className = 'multi-img-thumb';
        img.src = objectUrl;
        img.alt = file.name || `Photo ${index + 1}`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'multi-img-remove-btn';
        removeBtn.title = 'Remove this image';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeFileAtIndex(index);
        });

        thumbWrap.appendChild(img);
        thumbWrap.appendChild(removeBtn);

        const info = document.createElement('div');
        info.className = 'multi-img-info';

        const sizeLabel = document.createElement('span');
        sizeLabel.className = 'multi-img-size';
        sizeLabel.textContent = formatBytes(file.size);
        info.appendChild(sizeLabel);

        card.appendChild(thumbWrap);
        card.appendChild(info);

        previewGrid.appendChild(card);
      });

      // Add "Add more" tile if not full
      if (count > 0 && count < maxFiles) {
        const addTile = document.createElement('div');
        addTile.className = 'multi-img-add-tile';
        addTile.innerHTML = `
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add More</span>
        `;
        addTile.addEventListener('click', () => {
          promptFilePicker();
        });
        previewGrid.appendChild(addTile);
      }
    }

    function removeFileAtIndex(index) {
      if (index < 0 || index >= selectedFiles.length) return;
      const file = selectedFiles[index];
      if (objectUrlMap.has(file)) {
        try {
          URL.revokeObjectURL(objectUrlMap.get(file));
        } catch (e) {}
        objectUrlMap.delete(file);
      }
      selectedFiles.splice(index, 1);
      syncNativeInput();
      render();
    }

    function handleIncomingFiles(fileList) {
      if (!fileList || !fileList.length) return;

      const incoming = Array.from(fileList).filter((f) => {
        // Basic check for image types
        return f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic)$/i.test(f.name);
      });

      if (!incoming.length) {
        alert('Please select valid image files (JPG, PNG, WEBP, etc.).');
        return;
      }

      const availableSlots = maxFiles - selectedFiles.length;
      if (availableSlots <= 0) {
        alert(`You have already attached the maximum of ${maxFiles} images.`);
        return;
      }

      if (incoming.length > availableSlots) {
        alert(`You can only add ${availableSlots} more image${availableSlots > 1 ? 's' : ''}. Only the first ${availableSlots} will be added.`);
      }

      const toAdd = incoming.slice(0, availableSlots);
      selectedFiles = selectedFiles.concat(toAdd);

      syncNativeInput();
      render();
    }

    // Secondary file picker to trigger browser file dialog without resetting input
    function promptFilePicker() {
      const picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = inputEl.accept || 'image/*';
      picker.multiple = true;
      picker.style.display = 'none';

      picker.addEventListener('change', () => {
        if (picker.files && picker.files.length) {
          handleIncomingFiles(picker.files);
        }
        picker.remove();
      });

      document.body.appendChild(picker);
      picker.click();
    }

    // Dropzone click
    dropzone.addEventListener('click', () => {
      promptFilePicker();
    });

    // Drag and Drop
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files) {
        handleIncomingFiles(e.dataTransfer.files);
      }
    });

    // Reset support if parent form resets
    if (inputEl.form) {
      inputEl.form.addEventListener('reset', () => {
        selectedFiles.forEach((f) => {
          if (objectUrlMap.has(f)) {
            try {
              URL.revokeObjectURL(objectUrlMap.get(f));
            } catch (e) {}
          }
        });
        objectUrlMap.clear();
        selectedFiles = [];
        syncNativeInput();
        render();
      });
    }

    // Attach method for external scripts
    inputEl.getSelectedFiles = function () {
      return selectedFiles;
    };

    // Initial render
    render();
  }

  // Handle single-file upload areas (e.g. on become-artisan.html)
  function setupSingleFileUploadArea(area) {
    if (!area || area.dataset.singleUploadInit === 'true') return;
    area.dataset.singleUploadInit = 'true';

    const input = area.querySelector('input[type="file"]');
    if (!input) return;

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      let chip = area.querySelector('.single-file-chip');

      if (!file) {
        if (chip) chip.remove();
        return;
      }

      if (!chip) {
        chip = document.createElement('div');
        chip.className = 'single-file-chip';
        chip.style.cssText = 'display:inline-flex; align-items:center; gap:8px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px; padding:6px 12px; margin-top:10px; font-size:0.82rem; color:#1E40AF; position:relative; z-index:10;';
        area.appendChild(chip);
      }

      chip.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <strong style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${file.name}</strong>
        <span style="font-size:0.75rem; color:#64748B;">(${formatBytes(file.size)})</span>
        <button type="button" style="background:#DC2626; color:#ffffff; border:none; border-radius:50%; width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; line-height:1; padding:0; margin-left:4px;" title="Remove file">&times;</button>
      `;

      const removeBtn = chip.querySelector('button');
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        input.value = '';
        chip.remove();
        const ev = new Event('change', { bubbles: true });
        input.dispatchEvent(ev);
      });
    });
  }

  // Scan and auto-init all target inputs
  function initMultiImageUploaders() {
    injectStyles();

    const targetSelectors = [
      'input[type="file"][multiple]',
      'input[type="file"][data-multi-image]',
      '#artisanFaultPhotos',
      '#directFaultPhotos',
      '#bookPhotos',
      '#contactPhotos',
      '#propOwnerPhotos'
    ];

    const elements = document.querySelectorAll(targetSelectors.join(', '));
    elements.forEach((el) => {
      setupMultiImageUploader(el);
    });

    // Also enhance single-upload areas with file chips and remove buttons
    const singleAreas = document.querySelectorAll('.file-upload-area');
    singleAreas.forEach((area) => {
      setupSingleFileUploadArea(area);
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMultiImageUploaders);
  } else {
    initMultiImageUploaders();
  }

  // Expose global initializer
  window.initMultiImageUploaders = initMultiImageUploaders;
  window.setupMultiImageUploader = setupMultiImageUploader;
})();
