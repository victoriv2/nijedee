/**
 * NIJEDEE OPS - Catalog & Real Estate Admin Management
 * Handles CRUD operations, visibility toggling (Active/Hidden), multi-image uploads,
 * variant builders, and fee calculations for Products and Properties via Supabase.
 */

// Staging State
let allProducts = [];
let allProperties = [];
let currentEditingProductId = null;
let currentEditingPropertyId = null;

let stagingProductImages = [];
let stagingPropertyImages = [];
let stagingPropertyFeatures = [];

// ==========================================
// 1. PRODUCTS OPERATIONS
// ==========================================

async function fetchProducts(notify = false) {
  const sb = getNijedeeSupabase();
  if (!sb) return;

  const tbody = document.getElementById('productsTableBody');
  if (tbody && allProducts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--adm-muted);">Loading products from Supabase...</td></tr>';
  }

  const { data, error } = await sb
    .from('products')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch products error:', error);
    if (notify) alert('Failed to fetch products: ' + error.message);
    return;
  }

  allProducts = data || [];
  renderProducts();
  updateProductKPIs();
  if (notify) showToast('Products catalogue refreshed');
}

function updateProductKPIs() {
  const total = allProducts.length;
  const active = allProducts.filter(p => p.is_active).length;
  const hidden = allProducts.filter(p => !p.is_active).length;
  const inStock = allProducts.filter(p => p.in_stock).length;

  const kTotal = document.getElementById('kpiProductsTotal');
  const kActive = document.getElementById('kpiProductsActive');
  const kHidden = document.getElementById('kpiProductsHidden');
  const kStock = document.getElementById('kpiProductsInStock');

  if (kTotal) kTotal.textContent = total;
  if (kActive) kActive.textContent = active;
  if (kHidden) kHidden.textContent = hidden;
  if (kStock) kStock.textContent = inStock;

  const sbCount = document.getElementById('sidebarProductsCount');
  const mbCount = document.getElementById('mobileSidebarProductsCount');
  if (sbCount) sbCount.textContent = total;
  if (mbCount) mbCount.textContent = total;
}

function renderProducts() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  const q = (document.getElementById('prodSearchInput')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('prodFilterCat')?.value || 'all';
  const status = document.getElementById('prodFilterStatus')?.value || 'all';

  let filtered = allProducts.filter(p => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (status === 'active' && !p.is_active) return false;
    if (status === 'hidden' && p.is_active) return false;
    if (status === 'out_of_stock' && p.in_stock) return false;
    if (q) {
      const hay = [
        p.name,
        p.brand,
        p.badge,
        p.category,
        p.description,
        p.price_display,
        p.keywords
      ].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const countEl = document.getElementById('productsRecordCount');
  if (countEl) countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:40px; color:var(--adm-muted);">
          No products matched your search or filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []);
    const thumb = images[0] || 'assets/images/logo.png';
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const isChecked = p.is_active ? 'checked' : '';

    return `
      <tr>
        <td style="width:60px;">
          <div style="position:relative; width:50px; height:50px; border-radius:6px; overflow:hidden; border:1px solid var(--adm-border); background:#fff;">
            <img src="${escapeHtml(thumb)}" alt="${escapeHtml(p.name)}" style="width:100%; height:100%; object-fit:contain; cursor:zoom-in;" title="Click to view full photo" onclick="openLightbox('${escapeHtml(thumb)}')">
            ${images.length > 1 ? `<span style="position:absolute; bottom:2px; right:2px; background:rgba(7,34,79,0.85); color:#fff; font-size:9px; font-weight:800; padding:1px 4px; border-radius:3px;">${images.length}</span>` : ''}
          </div>
        </td>
        <td>
          <div style="font-weight:700; color:var(--adm-navy);">${escapeHtml(p.name)}</div>
          <div style="font-size:0.75rem; color:var(--adm-muted);">${escapeHtml(p.brand || '')}</div>
          ${p.badge ? `<span style="display:inline-block; margin-top:3px; background:#F1F5F9; color:var(--adm-navy); font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">${escapeHtml(p.badge)}</span>` : ''}
        </td>
        <td>
          <span style="display:inline-block; background:#EFF6FF; color:#1E5EFF; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:4px; text-transform:uppercase;">
            ${escapeHtml(p.category)}
          </span>
        </td>
        <td style="font-weight:800; color:var(--adm-navy); white-space:nowrap;">
          ${escapeHtml(p.price_display || ('₦' + (p.price || 0).toLocaleString()))}
        </td>
        <td>
          ${variants.length > 0 ? `
            <span style="background:#F0FDF4; color:#166534; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:4px;" title="${variants.map(v => v.label).join(', ')}">
              ${variants.length} Variants
            </span>
          ` : '<span style="color:var(--adm-muted); font-size:0.75rem;">Standard</span>'}
        </td>
        <td>
          ${p.in_stock ? `
            <span class="adm-badge adm-badge--completed">In Stock</span>
          ` : `
            <span class="adm-badge adm-badge--cancelled">Out of Stock</span>
          `}
        </td>
        <td>
          <label class="adm-switch" title="Toggle visibility on website shop">
            <input type="checkbox" ${isChecked} onchange="toggleProductActive('${p.id}', this.checked)">
            <span class="adm-switch-slider"></span>
            <span style="font-size:0.75rem; color:${p.is_active ? 'var(--adm-success)' : 'var(--adm-muted)'};">
              ${p.is_active ? 'Active' : 'Hidden'}
            </span>
          </label>
        </td>
        <td style="white-space:nowrap;">
          <div style="display:flex; gap:6px;">
            <button type="button" class="adm-btn adm-btn--outline adm-btn--sm" onclick="openProductModal('${p.id}')" title="Edit Product">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Edit</span>
            </button>
            <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" onclick="deleteProduct('${p.id}')" title="Delete Product" style="display:inline-flex; align-items:center; gap:5px;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function toggleProductActive(id, newActive) {
  const sb = getNijedeeSupabase();
  if (!sb) return;

  const { error } = await sb
    .from('products')
    .update({ is_active: newActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    alert('Failed to update product visibility: ' + error.message);
    fetchProducts();
    return;
  }

  const p = allProducts.find(item => item.id === id);
  if (p) p.is_active = newActive;
  renderProducts();
  updateProductKPIs();
  showToast(newActive ? 'Product is now visible on live shop' : 'Product is now hidden from shop');
}

async function deleteProduct(id) {
  const p = allProducts.find(item => item.id === id);
  const name = p ? p.name : 'this product';
  if (!confirm(`Are you sure you want to permanently delete "${name}"? This cannot be undone.`)) return;

  const sb = getNijedeeSupabase();
  if (!sb) return;

  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) {
    alert('Failed to delete product: ' + error.message);
    return;
  }

  allProducts = allProducts.filter(item => item.id !== id);
  renderProducts();
  updateProductKPIs();
  showToast('Product successfully deleted');
}

function openProductModal(id = null) {
  currentEditingProductId = id;
  const modal = document.getElementById('productCrudModal');
  const title = document.getElementById('productModalTitle');
  const form = document.getElementById('productCrudForm');
  form.reset();

  stagingProductImages = [];
  const variantsContainer = document.getElementById('prodVariantsContainer');
  if (variantsContainer) variantsContainer.innerHTML = '';

  if (id) {
    const p = allProducts.find(item => item.id === id);
    if (!p) return;
    title.textContent = 'Edit Product: ' + p.name;
    document.getElementById('prodFormId').value = p.id;
    document.getElementById('prodFormName').value = p.name || '';
    document.getElementById('prodFormCategory').value = p.category || 'paints';
    document.getElementById('prodFormBrand').value = p.brand || '';
    document.getElementById('prodFormBadge').value = p.badge || '';
    document.getElementById('prodFormPrice').value = p.price || '';
    document.getElementById('prodFormPriceMax').value = p.price_max || '';
    document.getElementById('prodFormPriceDisplay').value = p.price_display || '';
    document.getElementById('prodFormDescription').value = p.description || '';
    document.getElementById('prodFormKeywords').value = p.keywords || '';
    document.getElementById('prodFormInStock').checked = p.in_stock !== false;
    document.getElementById('prodFormIsActive').checked = p.is_active !== false;

    // Load images
    if (Array.isArray(p.images) && p.images.length > 0) {
      stagingProductImages = [...p.images];
    } else if (p.image_url) {
      stagingProductImages = [p.image_url];
    }

    // Load variants
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      p.variants.forEach(v => addVariantRow(v));
    }
  } else {
    title.textContent = 'Create New Shop Product';
    document.getElementById('prodFormId').value = '';
    document.getElementById('prodFormInStock').checked = true;
    document.getElementById('prodFormIsActive').checked = true;
  }

  renderProductStagingImages();
  if (modal) modal.classList.add('open');
}

function closeProductModal() {
  const modal = document.getElementById('productCrudModal');
  if (modal) modal.classList.remove('open');
  currentEditingProductId = null;
  stagingProductImages = [];
}

function addVariantRow(v = null) {
  const container = document.getElementById('prodVariantsContainer');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'adm-variant-row';
  row.innerHTML = `
    <input type="text" class="adm-form-input variant-label" placeholder="e.g. 6W Glass POP LED" value="${escapeHtml(v?.label || '')}" required oninput="syncVariantDisplay(this)">
    <input type="number" class="adm-form-input variant-price" placeholder="Price (₦)" value="${escapeHtml(v?.price || '')}" required oninput="syncVariantDisplay(this)">
    <input type="text" class="adm-form-input variant-display" placeholder="Display e.g. 6W POP LED — ₦6,180" value="${escapeHtml(v?.display || '')}" onblur="ensureNairaPrefix(this)">
    <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" onclick="this.closest('.adm-variant-row').remove()" title="Remove variant" style="padding:6px 10px;">&times;</button>
  `;
  container.appendChild(row);
}

function syncVariantDisplay(inputEl) {
  const row = inputEl.closest('.adm-variant-row');
  if (!row) return;
  const label = row.querySelector('.variant-label')?.value.trim() || 'Option';
  const priceInput = row.querySelector('.variant-price');
  const display = row.querySelector('.variant-display');
  const price = parseInt(priceInput?.value, 10);
  if (!isNaN(price) && display) {
    display.value = `${label} — ₦${price.toLocaleString()}`;
  }
}

// Auto Naira Formatting Helpers
function formatNairaDisplayString(raw) {
  if (!raw) return '';
  raw = String(raw).trim();
  if (raw.startsWith('₦') || raw.startsWith('&#8358;') || raw.toUpperCase().startsWith('NGN')) {
    return raw;
  }
  const clean = raw.replace(/,/g, '');
  if (/^-?\d+(\.\d+)?$/.test(clean)) {
    return '₦' + parseFloat(clean).toLocaleString();
  }
  if (/^\d+\s*[-–—]\s*\d+$/.test(raw)) {
    const parts = raw.split(/[-–—]/);
    const n1 = parseFloat(parts[0].replace(/,/g, '').trim());
    const n2 = parseFloat(parts[1].replace(/,/g, '').trim());
    if (!isNaN(n1) && !isNaN(n2)) {
      return `₦${n1.toLocaleString()} – ₦${n2.toLocaleString()}`;
    }
  }
  return '₦' + raw;
}

function autoSyncProductPriceDisplay() {
  const priceInput = document.getElementById('prodFormPrice');
  const priceMaxInput = document.getElementById('prodFormPriceMax');
  const displayInput = document.getElementById('prodFormPriceDisplay');
  if (!displayInput) return;

  const price = parseFloat(priceInput?.value);
  const maxPrice = parseFloat(priceMaxInput?.value);

  if (!isNaN(price)) {
    if (!isNaN(maxPrice) && maxPrice > price) {
      displayInput.value = `₦${price.toLocaleString()} – ₦${maxPrice.toLocaleString()}`;
    } else {
      displayInput.value = `₦${price.toLocaleString()}`;
    }
  }
}

function ensureNairaPrefix(input) {
  if (!input) return;
  const val = input.value.trim();
  if (val) {
    input.value = formatNairaDisplayString(val);
  }
}

function autoSyncPropertyPriceDisplay() {
  const priceInput = document.getElementById('propFormPrice');
  const periodInput = document.getElementById('propFormPeriod');
  const displayInput = document.getElementById('propFormPriceDisplay');
  if (!displayInput) return;

  const price = parseFloat(priceInput?.value);
  const period = periodInput?.value || 'year';

  if (!isNaN(price)) {
    if (period === 'year') {
      displayInput.value = `₦${price.toLocaleString()} / year`;
    } else if (period === 'night') {
      displayInput.value = `₦${price.toLocaleString()} / night`;
    } else if (period === 'month') {
      displayInput.value = `₦${price.toLocaleString()} / month`;
    } else {
      displayInput.value = `₦${price.toLocaleString()}`;
    }
  }
}

async function handleProductImageUpload(input) {
  if (!input.files || input.files.length === 0) return;
  const files = Array.from(input.files);

  const remainingSlots = 5 - stagingProductImages.length;
  if (remainingSlots <= 0) {
    alert('Maximum 5 images allowed per product.');
    input.value = '';
    return;
  }

  const toUpload = files.slice(0, remainingSlots);
  const statusEl = document.getElementById('prodImageUploadStatus');
  if (statusEl) statusEl.textContent = 'Compressing & uploading image(s)...';

  try {
    const urls = await uploadRequestFiles(toUpload, 'products');
    stagingProductImages.push(...urls);
    renderProductStagingImages();
    if (statusEl) statusEl.textContent = '';
  } catch (err) {
    console.error('Image upload failed:', err);
    alert('Failed to upload image: ' + err.message);
    if (statusEl) statusEl.textContent = '';
  }
  input.value = '';
}

function addProductImageUrl() {
  const input = document.getElementById('prodDirectImageUrl');
  const val = (input?.value || '').trim();
  if (!val) return;

  if (stagingProductImages.length >= 5) {
    alert('Maximum 5 images allowed per product.');
    return;
  }

  stagingProductImages.push(val);
  input.value = '';
  renderProductStagingImages();
}

function removeProductStagingImage(index) {
  stagingProductImages.splice(index, 1);
  renderProductStagingImages();
}

function renderProductStagingImages() {
  const strip = document.getElementById('prodImagesStrip');
  const count = document.getElementById('prodImagesCount');
  if (count) count.textContent = `${stagingProductImages.length} / 5 photos`;
  if (!strip) return;

  if (stagingProductImages.length === 0) {
    strip.innerHTML = '<div style="font-size:0.8rem; color:var(--adm-muted);">No images attached. Upload photos or enter an image path above.</div>';
    return;
  }

  strip.innerHTML = stagingProductImages.map((img, i) => `
    <div class="adm-img-strip-item">
      <img src="${escapeHtml(img)}" alt="Product Photo ${i + 1}" style="cursor:zoom-in;" title="Click to zoom in" onclick="openLightbox('${escapeHtml(img)}')">
      <button type="button" class="adm-img-strip-del" onclick="removeProductStagingImage(${i})" title="Remove image">&times;</button>
    </div>
  `).join('');
}

async function saveProduct(e) {
  e.preventDefault();
  const sb = getNijedeeSupabase();
  if (!sb) return;

  const btn = document.getElementById('prodSaveBtn');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Saving Product...';

  try {
    const id = document.getElementById('prodFormId').value;
    const name = document.getElementById('prodFormName').value.trim();
    const category = document.getElementById('prodFormCategory').value;
    const brand = document.getElementById('prodFormBrand').value.trim();
    const badge = document.getElementById('prodFormBadge').value.trim();
    const price = parseFloat(document.getElementById('prodFormPrice').value);
    const priceMaxVal = document.getElementById('prodFormPriceMax').value;
    const price_max = priceMaxVal ? parseFloat(priceMaxVal) : null;
    let price_display = document.getElementById('prodFormPriceDisplay').value.trim();
    if (price_display) {
      price_display = formatNairaDisplayString(price_display);
    } else {
      if (price_max) {
        price_display = `₦${price.toLocaleString()} – ₦${price_max.toLocaleString()}`;
      } else {
        price_display = `₦${price.toLocaleString()}`;
      }
    }

    const description = document.getElementById('prodFormDescription').value.trim();
    const keywords = document.getElementById('prodFormKeywords').value.trim();
    const in_stock = document.getElementById('prodFormInStock').checked;
    const is_active = document.getElementById('prodFormIsActive').checked;

    // Collect variants
    const variantRows = document.querySelectorAll('#prodVariantsContainer .adm-variant-row');
    const variants = [];
    variantRows.forEach(row => {
      const vLabel = row.querySelector('.variant-label')?.value.trim();
      const vPrice = parseFloat(row.querySelector('.variant-price')?.value);
      let vDisp = row.querySelector('.variant-display')?.value.trim();
      if (vLabel && !isNaN(vPrice)) {
        if (!vDisp) vDisp = `${vLabel} — ₦${vPrice.toLocaleString()}`;
        variants.push({
          label: vLabel,
          price: vPrice,
          display: vDisp
        });
      }
    });

    const payload = {
      name,
      category,
      brand,
      badge,
      price,
      price_max,
      price_display,
      description,
      keywords,
      variants,
      images: stagingProductImages,
      image_url: stagingProductImages[0] || null,
      in_stock,
      is_active,
      updated_at: new Date().toISOString()
    };

    let resError = null;
    if (id) {
      const { error } = await sb.from('products').update(payload).eq('id', id);
      resError = error;
    } else {
      payload.created_at = new Date().toISOString();
      payload.display_order = (allProducts.length + 1);
      const { error } = await sb.from('products').insert([payload]);
      resError = error;
    }

    if (resError) {
      throw resError;
    }

    closeProductModal();
    await fetchProducts();
    showToast(id ? 'Product updated successfully' : 'New product created successfully');
  } catch (err) {
    console.error('Save product error:', err);
    alert('Error saving product: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ==========================================
// 2. PROPERTIES OPERATIONS
// ==========================================

async function fetchProperties(notify = false) {
  const sb = getNijedeeSupabase();
  if (!sb) return;

  const tbody = document.getElementById('propertiesTableBody');
  if (tbody && allProperties.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--adm-muted);">Loading real estate listings from Supabase...</td></tr>';
  }

  const { data, error } = await sb
    .from('properties')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch properties error:', error);
    if (notify) alert('Failed to fetch properties: ' + error.message);
    return;
  }

  allProperties = data || [];
  renderProperties();
  updatePropertyKPIs();
  if (notify) showToast('Properties directory refreshed');
}

function updatePropertyKPIs() {
  const total = allProperties.length;
  const rent = allProperties.filter(p => p.category === 'rent').length;
  const shortlet = allProperties.filter(p => p.category === 'shortlet').length;
  const active = allProperties.filter(p => p.is_active).length;

  const kTotal = document.getElementById('kpiPropTotal');
  const kRent = document.getElementById('kpiPropRent');
  const kShortlet = document.getElementById('kpiPropShortlet');
  const kActive = document.getElementById('kpiPropActive');

  if (kTotal) kTotal.textContent = total;
  if (kRent) kRent.textContent = rent;
  if (kShortlet) kShortlet.textContent = shortlet;
  if (kActive) kActive.textContent = active;

  const sbCount = document.getElementById('sidebarPropertiesCount');
  const mbCount = document.getElementById('mobileSidebarPropertiesCount');
  if (sbCount) sbCount.textContent = total;
  if (mbCount) mbCount.textContent = total;
}

function renderProperties() {
  const tbody = document.getElementById('propertiesTableBody');
  if (!tbody) return;

  const q = (document.getElementById('propSearchInput')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('propFilterCat')?.value || 'all';
  const status = document.getElementById('propFilterStatus')?.value || 'all';

  let filtered = allProperties.filter(p => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (status === 'active' && !p.is_active) return false;
    if (status === 'hidden' && p.is_active) return false;
    if (q) {
      const hay = [
        p.title,
        p.location,
        p.address,
        p.ref_code,
        p.badge,
        p.status_tag,
        p.description,
        p.price_display
      ].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const countEl = document.getElementById('propertiesRecordCount');
  if (countEl) countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:40px; color:var(--adm-muted);">
          No properties matched your search or filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []);
    const thumb = images[0] || 'assets/images/logo.png';
    const breakdown = p.fee_breakdown || {};
    const isChecked = p.is_active ? 'checked' : '';

    return `
      <tr>
        <td style="width:64px;">
          <div style="position:relative; width:56px; height:50px; border-radius:6px; overflow:hidden; border:1px solid var(--adm-border); background:#f1f5f9;">
            <img src="${escapeHtml(thumb)}" alt="${escapeHtml(p.title)}" style="width:100%; height:100%; object-fit:cover; cursor:zoom-in;" title="Click to view full photo" onclick="openLightbox('${escapeHtml(thumb)}')">
            ${images.length > 1 ? `<span style="position:absolute; bottom:2px; right:2px; background:rgba(7,34,79,0.85); color:#fff; font-size:9px; font-weight:800; padding:1px 4px; border-radius:3px;">${images.length}</span>` : ''}
          </div>
        </td>
        <td>
          <div style="font-weight:700; color:var(--adm-navy);">${escapeHtml(p.title)}</div>
          <div style="font-size:0.75rem; color:var(--adm-muted);">${escapeHtml(p.address || p.location)}</div>
          ${p.ref_code ? `<span style="display:inline-block; margin-top:2px; font-size:10px; font-weight:700; color:#1E5EFF;">Ref: ${escapeHtml(p.ref_code)}</span>` : ''}
        </td>
        <td>
          <span style="display:inline-block; background:#F0FDFA; color:#0F766E; font-size:0.75rem; font-weight:700; padding:3px 8px; border-radius:4px; text-transform:uppercase;">
            ${escapeHtml(p.category)}
          </span>
          ${p.badge ? `<div style="font-size:10px; color:var(--adm-muted); margin-top:2px;">${escapeHtml(p.badge)}</div>` : ''}
        </td>
        <td>
          <div style="font-weight:800; color:var(--adm-navy); white-space:nowrap;">
            ${escapeHtml(p.price_display || ('₦' + (p.price || 0).toLocaleString()))}
          </div>
          ${breakdown.total_package && breakdown.total_package !== p.price ? `
            <div style="font-size:11px; color:#16A34A; font-weight:700;">Package: ₦${parseInt(breakdown.total_package, 10).toLocaleString()}</div>
          ` : ''}
        </td>
        <td>
          ${p.status_tag ? `
            <span style="display:inline-block; background:#ECFDF5; color:#10B981; font-size:0.75rem; font-weight:700; padding:3px 7px; border-radius:4px;">
              ${escapeHtml(p.status_tag)}
            </span>
          ` : '<span style="color:var(--adm-muted); font-size:0.75rem;">Direct</span>'}
        </td>
        <td>
          ${p.is_available ? `
            <span class="adm-badge adm-badge--completed">Available</span>
          ` : `
            <span class="adm-badge adm-badge--cancelled">Taken</span>
          `}
        </td>
        <td>
          <label class="adm-switch" title="Toggle visibility on website properties page">
            <input type="checkbox" ${isChecked} onchange="togglePropertyActive('${p.id}', this.checked)">
            <span class="adm-switch-slider"></span>
            <span style="font-size:0.75rem; color:${p.is_active ? 'var(--adm-success)' : 'var(--adm-muted)'};">
              ${p.is_active ? 'Active' : 'Hidden'}
            </span>
          </label>
        </td>
        <td style="white-space:nowrap;">
          <div style="display:flex; gap:6px;">
            <button type="button" class="adm-btn adm-btn--outline adm-btn--sm" onclick="openPropertyModal('${p.id}')" title="Edit Property">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Edit</span>
            </button>
            <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" onclick="deleteProperty('${p.id}')" title="Delete Property" style="display:inline-flex; align-items:center; gap:5px;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function togglePropertyActive(id, newActive) {
  const sb = getNijedeeSupabase();
  if (!sb) return;

  const { error } = await sb
    .from('properties')
    .update({ is_active: newActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    alert('Failed to update property visibility: ' + error.message);
    fetchProperties();
    return;
  }

  const p = allProperties.find(item => item.id === id);
  if (p) p.is_active = newActive;
  renderProperties();
  updatePropertyKPIs();
  showToast(newActive ? 'Property listing is now active on website' : 'Property listing is now hidden');
}

async function deleteProperty(id) {
  const p = allProperties.find(item => item.id === id);
  const title = p ? p.title : 'this property';
  if (!confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) return;

  const sb = getNijedeeSupabase();
  if (!sb) return;

  const { error } = await sb.from('properties').delete().eq('id', id);
  if (error) {
    alert('Failed to delete property: ' + error.message);
    return;
  }

  allProperties = allProperties.filter(item => item.id !== id);
  renderProperties();
  updatePropertyKPIs();
  showToast('Property successfully deleted');
}

function openPropertyModal(id = null) {
  currentEditingPropertyId = id;
  const modal = document.getElementById('propertyCrudModal');
  const title = document.getElementById('propertyModalTitle');
  const form = document.getElementById('propertyCrudForm');
  form.reset();

  stagingPropertyImages = [];
  stagingPropertyFeatures = [];

  if (id) {
    const p = allProperties.find(item => item.id === id);
    if (!p) return;
    title.textContent = 'Edit Property: ' + p.title;
    document.getElementById('propFormId').value = p.id;
    document.getElementById('propFormTitle').value = p.title || '';
    document.getElementById('propFormCategory').value = p.category || 'rent';
    document.getElementById('propFormBadge').value = p.badge || '';
    document.getElementById('propFormLocation').value = p.location || 'Badore, Ajah';
    document.getElementById('propFormAddress').value = p.address || '';
    document.getElementById('propFormRefCode').value = p.ref_code || '';
    document.getElementById('propFormPrice').value = p.price || '';
    document.getElementById('propFormPeriod').value = p.price_period || 'year';
    document.getElementById('propFormPriceDisplay').value = p.price_display || '';
    document.getElementById('propFormStatusTag').value = p.status_tag || '';
    document.getElementById('propFormDescription').value = p.description || '';
    document.getElementById('propFormWhatsApp').value = p.whatsapp_msg || '';
    document.getElementById('propFormIsAvailable').checked = p.is_available !== false;
    document.getElementById('propFormIsActive').checked = p.is_active !== false;

    // Load fee breakdown
    const bk = p.fee_breakdown || {};
    document.getElementById('propFeeRent').value = bk.rent || p.price || '';
    document.getElementById('propFeeLegal').value = bk.legal || '';
    document.getElementById('propFeeAgency').value = bk.agency || '';
    document.getElementById('propFeeCaution').value = bk.caution || '';
    document.getElementById('propFeeService').value = bk.service_charge || '';
    document.getElementById('propFeeTotal').value = bk.total_package || '';

    // Load features
    if (Array.isArray(p.features)) {
      stagingPropertyFeatures = [...p.features];
    }

    // Load images
    if (Array.isArray(p.images) && p.images.length > 0) {
      stagingPropertyImages = [...p.images];
    } else if (p.image_url) {
      stagingPropertyImages = [p.image_url];
    }
  } else {
    title.textContent = 'Register New Property Listing';
    document.getElementById('propFormId').value = '';
    document.getElementById('propFormIsAvailable').checked = true;
    document.getElementById('propFormIsActive').checked = true;
    document.getElementById('propFormPeriod').value = 'year';
  }

  renderPropertyStagingImages();
  renderPropertyFeatureChips();
  if (modal) modal.classList.add('open');
}

function closePropertyModal() {
  const modal = document.getElementById('propertyCrudModal');
  if (modal) modal.classList.remove('open');
  currentEditingPropertyId = null;
  stagingPropertyImages = [];
  stagingPropertyFeatures = [];
}

function calculatePropertyFeeTotal() {
  const rent = parseFloat(document.getElementById('propFeeRent')?.value) || 0;
  const legal = parseFloat(document.getElementById('propFeeLegal')?.value) || 0;
  const agency = parseFloat(document.getElementById('propFeeAgency')?.value) || 0;
  const caution = parseFloat(document.getElementById('propFeeCaution')?.value) || 0;
  const service = parseFloat(document.getElementById('propFeeService')?.value) || 0;
  const total = rent + legal + agency + caution + service;

  const totalInput = document.getElementById('propFeeTotal');
  if (totalInput) totalInput.value = total;

  // Also sync base price and display if empty
  const basePrice = document.getElementById('propFormPrice');
  if (basePrice && !basePrice.value && rent > 0) {
    basePrice.value = rent;
  }
}

function togglePropertyFeature(tag, btn) {
  const idx = stagingPropertyFeatures.indexOf(tag);
  if (idx > -1) {
    stagingPropertyFeatures.splice(idx, 1);
    btn.classList.remove('active');
  } else {
    stagingPropertyFeatures.push(tag);
    btn.classList.add('active');
  }
}

function addCustomPropertyFeature() {
  const input = document.getElementById('propCustomFeatureInput');
  const val = (input?.value || '').trim();
  if (!val) return;

  if (!stagingPropertyFeatures.includes(val)) {
    stagingPropertyFeatures.push(val);
  }
  input.value = '';
  renderPropertyFeatureChips();
}

function renderPropertyFeatureChips() {
  const container = document.getElementById('propFeaturesChipContainer');
  if (!container) return;

  const defaultPresets = [
    'POP Ceiling',
    'Vitrified Tiles',
    'En-Suite Bath',
    'Gated Compound',
    'Gated Estate',
    'General Lounge',
    'Bathtub & Water Heater',
    'Fitted Wardrobe',
    'Fitted Kitchen',
    'Personal Prepaid Meter',
    'Gate-Side Location',
    'Zero Service Charge',
    'Bed & Wardrobe',
    'Television & Fan',
    'Private Entry',
    '24/7 Security'
  ];

  // Merge presets with any custom features already in staging
  const allTags = Array.from(new Set([...defaultPresets, ...stagingPropertyFeatures]));

  container.innerHTML = allTags.map(tag => {
    const isSelected = stagingPropertyFeatures.includes(tag);
    return `
      <button type="button" class="adm-chip-btn ${isSelected ? 'active' : ''}" onclick="togglePropertyFeature('${escapeHtml(tag)}', this)">
        ${isSelected ? '&check; ' : '+ '}${escapeHtml(tag)}
      </button>
    `;
  }).join('');
}

async function handlePropertyImageUpload(input) {
  if (!input.files || input.files.length === 0) return;
  const files = Array.from(input.files);

  const statusEl = document.getElementById('propImageUploadStatus');
  if (statusEl) statusEl.textContent = 'Compressing & uploading image(s)...';

  try {
    const urls = await uploadRequestFiles(files, 'properties');
    stagingPropertyImages.push(...urls);
    renderPropertyStagingImages();
    if (statusEl) statusEl.textContent = '';
  } catch (err) {
    console.error('Property image upload failed:', err);
    alert('Failed to upload images: ' + err.message);
    if (statusEl) statusEl.textContent = '';
  }
  input.value = '';
}

function addPropertyImageUrl() {
  const input = document.getElementById('propDirectImageUrl');
  const val = (input?.value || '').trim();
  if (!val) return;

  stagingPropertyImages.push(val);
  input.value = '';
  renderPropertyStagingImages();
}

function removePropertyStagingImage(index) {
  stagingPropertyImages.splice(index, 1);
  renderPropertyStagingImages();
}

function renderPropertyStagingImages() {
  const strip = document.getElementById('propImagesStrip');
  const count = document.getElementById('propImagesCount');
  if (count) count.textContent = `${stagingPropertyImages.length} photos`;
  if (!strip) return;

  if (stagingPropertyImages.length === 0) {
    strip.innerHTML = '<div style="font-size:0.8rem; color:var(--adm-muted);">No photos attached. Select photos above to upload.</div>';
    return;
  }

  strip.innerHTML = stagingPropertyImages.map((img, i) => `
    <div class="adm-img-strip-item">
      <img src="${escapeHtml(img)}" alt="Property Photo ${i + 1}" style="cursor:zoom-in;" title="Click to zoom in" onclick="openLightbox('${escapeHtml(img)}')">
      <button type="button" class="adm-img-strip-del" onclick="removePropertyStagingImage(${i})" title="Remove photo">&times;</button>
    </div>
  `).join('');
}

async function saveProperty(e) {
  e.preventDefault();
  const sb = getNijedeeSupabase();
  if (!sb) return;

  const btn = document.getElementById('propSaveBtn');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = 'Saving Property...';

  try {
    const id = document.getElementById('propFormId').value;
    const title = document.getElementById('propFormTitle').value.trim();
    const category = document.getElementById('propFormCategory').value;
    const badge = document.getElementById('propFormBadge').value.trim();
    const location = document.getElementById('propFormLocation').value.trim();
    const address = document.getElementById('propFormAddress').value.trim();
    const ref_code = document.getElementById('propFormRefCode').value.trim();
    const price = parseFloat(document.getElementById('propFormPrice').value);
    const price_period = document.getElementById('propFormPeriod').value;
    let price_display = document.getElementById('propFormPriceDisplay').value.trim();
    if (price_display) {
      price_display = formatNairaDisplayString(price_display);
    } else {
      if (price_period === 'year') {
        price_display = `₦${price.toLocaleString()} / year`;
      } else if (price_period === 'night') {
        price_display = `₦${price.toLocaleString()} / night`;
      } else if (price_period === 'month') {
        price_display = `₦${price.toLocaleString()} / month`;
      } else {
        price_display = `₦${price.toLocaleString()}`;
      }
    }

    const status_tag = document.getElementById('propFormStatusTag').value.trim();
    const description = document.getElementById('propFormDescription').value.trim();
    let whatsapp_msg = document.getElementById('propFormWhatsApp').value.trim();
    if (!whatsapp_msg) {
      whatsapp_msg = `Hello NIJEDEE Properties, I want to inspect ${title} in ${location} (${price_display})`;
    }

    const is_available = document.getElementById('propFormIsAvailable').checked;
    const is_active = document.getElementById('propFormIsActive').checked;

    // Build fee breakdown
    const rent = parseFloat(document.getElementById('propFeeRent')?.value) || price;
    const legal = parseFloat(document.getElementById('propFeeLegal')?.value) || 0;
    const agency = parseFloat(document.getElementById('propFeeAgency')?.value) || 0;
    const caution = parseFloat(document.getElementById('propFeeCaution')?.value) || 0;
    const service_charge = parseFloat(document.getElementById('propFeeService')?.value) || 0;
    const total_package = parseFloat(document.getElementById('propFeeTotal')?.value) || (rent + legal + agency + caution + service_charge);

    const fee_breakdown = {
      rent,
      legal,
      agency,
      caution,
      service_charge,
      total_package
    };

    const payload = {
      title,
      category,
      badge,
      location,
      address,
      ref_code,
      price,
      price_period,
      price_display,
      status_tag,
      description,
      fee_breakdown,
      features: stagingPropertyFeatures,
      images: stagingPropertyImages,
      image_url: stagingPropertyImages[0] || null,
      whatsapp_msg,
      is_available,
      is_active,
      updated_at: new Date().toISOString()
    };

    let resError = null;
    if (id) {
      const { error } = await sb.from('properties').update(payload).eq('id', id);
      resError = error;
    } else {
      payload.created_at = new Date().toISOString();
      payload.display_order = (allProperties.length + 1);
      const { error } = await sb.from('properties').insert([payload]);
      resError = error;
    }

    if (resError) {
      throw resError;
    }

    closePropertyModal();
    await fetchProperties();
    showToast(id ? 'Property updated successfully' : 'Property listing published successfully');
  } catch (err) {
    console.error('Save property error:', err);
    alert('Error saving property: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}
