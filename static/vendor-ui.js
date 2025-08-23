// Enhanced Vendor UI with modern UX
let products = [];
let chosen = new Map();

async function openVendorSelector(campaignId) {
  const dlg = document.createElement('div');
  dlg.className = 'overlay';
  dlg.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3 class="h3">
          <span role="img" aria-label="products">📦</span>
          انتخاب محصولات برای کمپین
        </h3>
        <button class="btn ghost" onclick="this.closest('.overlay').remove()">
          <span role="img" aria-label="close">✖️</span>
        </button>
      </div>
      <div class="modal-body">

      
      <div style="padding: var(--space-lg);">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg);">
          <div style="position: relative; flex: 1;">
            <input id="searchProducts" class="input" placeholder="جستجوی محصولات..." style="padding-left: 2.5rem;">
            <span role="img" aria-label="search" style="position: absolute; left: var(--space-sm); top: 50%; transform: translateY(-50%); color: var(--muted);">🔍</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <span class="muted" style="font-size: 0.875rem;">
              <span role="img" aria-label="selected">✅</span>
              <span id="selectedCount">0</span> محصول انتخاب شده
            </span>
          </div>
        </div>
        
        <div id="productList" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-md);">
          <div style="text-align: center; padding: var(--space-xl); color: var(--text-secondary);">
            <div class="spinner">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <p style="margin-top: var(--space-md);">در حال بارگذاری محصولات...</p>
          </div>
        </div>
        
        <div id="status" style="margin-top: var(--space-md); padding: var(--space-sm); border-radius: var(--radius-md); display: none;"></div>
      </div>
      
            </div>
      <div class="modal-foot">
        <button class="btn ghost" onclick="this.closest('.overlay').remove()">
          <span role="img" aria-label="cancel">❌</span>
          انصراف
        </button>
        <button id="save" class="btn">
          <span role="img" aria-label="save">💾</span>
          ذخیره انتخاب‌ها
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dlg);
  
  // Load data
  try {
    const [prods, current] = await Promise.all([
      fetch('/api/my-products?per_page=1000').then(async r => {
        if (!r.ok) {
          console.error('Products API error:', r.status, r.statusText);
          return { data: [] };
        }
        return r.json();
      }),
      fetch(`/api/campaigns/${campaignId}/my-selections`).then(async r => {
        if (!r.ok) {
          console.error('Selections API error:', r.status, r.statusText);
          return [];
        }
        return r.json();
      })
    ]);
    
    products = prods.data || [];

    // current: [{product_id, discount}] یا قدیمی: ["id", ...]
    if (Array.isArray(current) && current.length && typeof current[0] === 'object') {
      current.forEach(x => chosen.set(x.product_id, Number(x.discount || 3)));
    } else {
      (current || []).forEach(id => chosen.set(id, 3));
    }

    renderList(products, chosen, dlg.querySelector('#productList'));
    updateSelectedCount();
    
    // Setup search
    const searchInput = dlg.querySelector('#searchProducts');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const term = e.target.value.trim().toLowerCase();
        renderList(products, chosen, dlg.querySelector('#productList'), term);
      }, 300);
    });
    
  } catch (e) {
    console.error('Error loading data:', e);
    dlg.querySelector('#productList').innerHTML = `
      <div style="text-align: center; padding: var(--space-xl); color: var(--danger);">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">❌</div>
        <h4 style="margin-bottom: var(--space-sm);">خطا در بارگذاری</h4>
        <p class="muted">خطا در دریافت اطلاعات: ${e.message}</p>
        <button class="btn" onclick="location.reload()" style="margin-top: var(--space-md);">
          <span role="img" aria-label="retry">🔄</span>
          تلاش مجدد
        </button>
      </div>
    `;
  }

  // Save functionality
  dlg.querySelector('#save').onclick = async () => {
    const saveBtn = dlg.querySelector('#save');
    const statusDiv = dlg.querySelector('#status');
    
    // Show loading state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span role="img" aria-label="loading">⏳</span> در حال ذخیره...';
    statusDiv.style.display = 'block';
    statusDiv.className = '';
    statusDiv.innerHTML = '<span role="img" aria-label="loading">⏳</span> در حال ذخیره انتخاب‌ها...';
    
    const items = Array.from(chosen.entries()).map(([id, discount]) => ({ product_id: id, discount }));
    
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/select-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      
      if (!res.ok) {
        const txt = await res.text();
        console.error('Save error:', txt);
        statusDiv.className = 'flash error';
        statusDiv.innerHTML = `
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <span role="img" aria-label="error">❌</span>
            خطا در ذخیره: ${txt}
          </div>
        `;
        return;
      }
      
      const data = await res.json();
      
      // Show success state
      statusDiv.className = 'flash success';
      statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-sm);">
          <span role="img" aria-label="success">✅</span>
          ذخیره شد (${data.count} مورد)
        </div>
      `;
      
      // Refresh the display immediately
      if (window.hydrateMySelections) {
        await hydrateMySelections(campaignId);
      }
      
      // Also refresh admin view if available
      if (window.hydrateAdminSelections) {
        await hydrateAdminSelections(campaignId);
      }
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        dlg.remove();
      }, 2000);
      
    } catch (e) {
      console.error('Save exception:', e);
      statusDiv.className = 'flash error';
      statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: var(--space-sm);">
          <span role="img" aria-label="error">❌</span>
          خطا: ${e.message}
        </div>
      `;
    } finally {
      // Reset button state
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span role="img" aria-label="save">💾</span> ذخیره انتخاب‌ها';
    }
  };
}

function updateSelectedCount() {
  const countElement = document.getElementById('selectedCount');
  if (countElement) {
    countElement.textContent = chosen.size;
  }
}

function renderList(products, chosenMap, mount, term="") {
  const t = term.trim().toLowerCase();
  const filteredProducts = products.filter(p => 
    (p.title || p.name || '').toLowerCase().includes(t) ||
    p.id.toString().includes(t)
  );
  
  if (filteredProducts.length === 0) {
    mount.innerHTML = `
      <div style="text-align: center; padding: var(--space-xl); color: var(--text-secondary);">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">🔍</div>
        <h4 style="margin-bottom: var(--space-sm);">محصولی یافت نشد</h4>
        <p class="muted">${term ? `هیچ محصولی با "${term}" یافت نشد.` : 'هیچ محصولی در دسترس نیست.'}</p>
      </div>
    `;
    return;
  }
  
  mount.innerHTML = `
    <div class="grid">
      <div class="head">کد</div>
      <div class="head">عنوان</div>
      <div class="head">قیمت</div>
      <div class="head">تخفیف (%)</div>
    </div>
  `;
  
  const grid = mount.querySelector('.grid');

  filteredProducts.forEach(p => {
    const checked = chosenMap.has(p.id);
    const discVal = checked ? (chosenMap.get(p.id) || 3) : 3;
    
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div>${p.id}</div>
      <div>${p.title || p.name || ''}</div>
      <div>${(p.price || p.primary_price || 0).toLocaleString()} تومان</div>
      <div>
        <input type="number" class="input" style="max-width:90px" min="3" max="100" step="0.1"
               value="${discVal}" data-disc="${p.id}" ${checked?'':'disabled'} title="حداقل ۳٪">
        <input type="checkbox" data-id="${p.id}" ${checked ? 'checked' : ''} style="margin-left:8px">
      </div>
    `;
    
    grid.appendChild(row);
  });

  // bind checkboxes & discount inputs
  grid.querySelectorAll('input[type="checkbox"]').forEach(inp => {
    inp.addEventListener('change', () => {
      const id = inp.dataset.id;
      const discInput = grid.querySelector(`input[data-disc="${id}"]`);
      
      if (inp.checked) {
        // وقتی فعال می‌شود، حداقل ۳٪ قرار بده
        let current = Number(discInput?.value || 3);
        if (!Number.isFinite(current) || current < 3) current = 3;
        chosenMap.set(id, current);
        if (discInput) { 
          discInput.disabled = false; 
          discInput.value = current; 
        }
      } else {
        chosenMap.delete(id);
        if (discInput) discInput.disabled = true;
      }
      
      updateSelectedCount();
    });
  });

  grid.querySelectorAll('input[type="number"][data-disc]').forEach(inp => {
    inp.addEventListener('input', () => {
      const id = inp.dataset.disc;
      let v = Number(inp.value);
      if (!Number.isFinite(v)) v = 3;
      v = Math.max(3, Math.min(100, v));   // حداقل ۳
      inp.value = v;
      if (chosenMap.has(id)) chosenMap.set(id, v);
    });
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K to open search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('searchCamp') || document.getElementById('searchProducts');
    if (searchInput) {
      searchInput.focus();
    }
  }
  
  // Escape to close modals
  if (e.key === 'Escape') {
    const overlay = document.querySelector('.overlay');
    if (overlay) {
      overlay.remove();
    }
  }
});

// Auto-focus search inputs
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchCamp');
  if (searchInput) {
    searchInput.focus();
  }
});
