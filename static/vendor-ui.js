// static/vendor-ui.js — انتخاب محصول + درصد تخفیف (حداقل 3%)

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, Object.assign({ headers: { "Accept": "application/json", "Content-Type": "application/json" } }, opts));
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

function spinner() {
  const e = document.createElement('div');
  e.className = 'spinner';
  e.innerHTML = '<div></div><div></div><div></div><div></div>';
  return e;
}

async function openVendorSelector(campaignId) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);

  const dlg = document.createElement('div');
  dlg.className = 'card modal';
  dlg.innerHTML = `
    <div class="modal-head">
      <h3 class="h3">انتخاب محصولات من</h3>
      <div style="display:flex;gap:8px;align-items:center">
        <input id="search" class="input" placeholder="جستجوی عنوان محصول...">
        <button class="btn ghost" id="selectAll">انتخاب همه</button>
        <button class="btn ghost" id="clearAll">لغو همه</button>
        <button class="btn danger" id="x">×</button>
      </div>
    </div>
    <div id="body" style="min-height:280px;position:relative"></div>
    <div class="modal-foot">
      <span id="status" class="muted"></span>
      <button class="btn primary" id="save">ذخیره</button>
      <button class="btn" id="cancel">بستن</button>
    </div>
  `;
  overlay.appendChild(dlg);

  const body = dlg.querySelector('#body');
  body.appendChild(spinner());

  let products = [];
  // product_id -> discount (number)
  let chosen = new Map(); 

  try {
    const [prods, current] = await Promise.all([
      fetchJSON('/api/my-products'),
      fetchJSON(`/api/campaigns/${campaignId}/my-selections`)
    ]);
    products = prods.data || [];

    // current: [{product_id, discount}] یا قدیمی: ["id", ...]
    if (Array.isArray(current) && current.length && typeof current[0] === 'object') {
      current.forEach(x => chosen.set(x.product_id, Number(x.discount || 3)));
    } else {
      (current || []).forEach(id => chosen.set(id, 3));
    }

    renderList(products, chosen, body);
  } catch (e) {
    body.innerHTML = `<div class="error">خطا در دریافت اطلاعات: ${e.message}</div>`;
  }

  // handlers
  dlg.querySelector('#x').onclick = () => overlay.remove();
  dlg.querySelector('#cancel').onclick = () => overlay.remove();
  dlg.querySelector('#selectAll').onclick = () => {
    products.forEach(p=> chosen.set(p.id, chosen.get(p.id) || 3));
    renderList(products, chosen, body, dlg.querySelector('#search').value);
  };
  dlg.querySelector('#clearAll').onclick = () => {
    chosen.clear();
    renderList(products, chosen, body, dlg.querySelector('#search').value);
  };
  dlg.querySelector('#search').addEventListener('input', (e)=>{
    renderList(products, chosen, body, e.target.value);
  });

  dlg.querySelector('#save').onclick = async () => {
    const items = Array.from(chosen.entries()).map(([id, disc]) => ({
      product_id: id,
      discount: Number(disc)
    }));

    // اعتبارسنجی کلاینت: همه >= 3
    const bad = items.filter(x => !(Number.isFinite(x.discount)) || x.discount < 3 || x.discount > 100);
    if (bad.length){
      dlg.querySelector('#status').textContent = "خطا: همهٔ تخفیف‌ها باید بین ۳ تا ۱۰۰ درصد باشند.";
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/select-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (!res.ok) {
        const txt = await res.text();
        dlg.querySelector('#status').textContent = "خطا در ذخیره: " + txt;
        return;
      }
      const data = await res.json();
      // مودال باز بماند؛ وضعیت موفقیت را نشان بده
      dlg.querySelector('#status').textContent = `ذخیره شد (${data.count} مورد)`;
      if (window.hydrateMySelections) hydrateMySelections(campaignId);
    } catch (e) {
      dlg.querySelector('#status').textContent = "خطا: " + e.message;
    }
  };
}

function renderList(products, chosenMap, mount, term="") {
  const t = term.trim().toLowerCase();
  mount.innerHTML = `
    <div class="grid">
      <div class="head">کد</div>
      <div class="head">عنوان</div>
      <div class="head">قیمت</div>
      <div class="head">تخفیف (%)</div>
      <div class="head">انتخاب</div>
    </div>
  `;
  const grid = mount.querySelector('.grid');

  products
    .filter(p => (p.title || p.name || '').toLowerCase().includes(t))
    .forEach(p => {
      const checked = chosenMap.has(p.id);
      const discVal = checked ? (chosenMap.get(p.id) || 3) : 3;
      grid.insertAdjacentHTML('beforeend', `
        <div class="row">
          <div>${p.id}</div>
          <div>${p.title || p.name || ''}</div>
          <div>${(p.price || p.primary_price || 0).toLocaleString()} تومان</div>
          <div>
            <input type="number" class="input" style="max-width:90px" min="3" max="100" step="0.1"
                   value="${discVal}" data-disc="${p.id}" ${checked?'':'disabled'} title="حداقل ۳٪">
          </div>
          <div><input type="checkbox" data-id="${p.id}" ${checked ? 'checked' : ''}></div>
        </div>
      `);
    });

  // bind checkboxes & discount inputs
  grid.querySelectorAll('input[type="checkbox"]').forEach(inp=>{
    inp.addEventListener('change', ()=>{
      const id = inp.dataset.id;
      const discInput = grid.querySelector(`input[data-disc="${id}"]`);
      if (inp.checked) {
        // وقتی فعال می‌شود، حداقل ۳٪ قرار بده
        let current = Number(discInput?.value || 3);
        if (!Number.isFinite(current) || current < 3) current = 3;
        chosenMap.set(id, current);
        if (discInput) { discInput.disabled = false; discInput.value = current; }
      } else {
        chosenMap.delete(id);
        if (discInput) discInput.disabled = true;
      }
    });
  });

  grid.querySelectorAll('input[type="number"][data-disc]').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      const id = inp.dataset.disc;
      let v = Number(inp.value);
      if (!Number.isFinite(v)) v = 3;
      v = Math.max(3, Math.min(100, v));   // حداقل ۳
      inp.value = v;
      if (chosenMap.has(id)) chosenMap.set(id, v);
    });
  });
}
