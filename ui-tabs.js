function getTabs() {
  return [
    ['dashboard', tr('tab_dashboard')],
    ['arrived',   tr('tab_arrived')],
    ['sales',     tr('tab_sales')],
    ['returns',   tr('tab_returns')],
    ['expenses',  tr('tab_expenses')],
    ['stock',     tr('tab_stock')],
    ['report',    tr('tab_report')],
  ];
}

function navRender() {
    const allTabs = [...getTabs(), ['history', tr('tab_history')]];
    const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
    const activeTab = allTabs.some(([id]) => id === savedTab) ? savedTab : allTabs[0][0];

    const headerSub = document.getElementById('headerSub');
    if (headerSub) headerSub.textContent = tr('header_sub');
    const btnRu = document.getElementById('langRu');
    const btnTj = document.getElementById('langTj');
    if (btnRu) btnRu.classList.toggle('active', currentLang === 'ru');
    if (btnTj) btnTj.classList.toggle('active', currentLang === 'tj');

    nav.innerHTML = allTabs.map(([id, name]) => `<button class="${id === activeTab ? 'active' : ''}" data-id="${id}">${name}</button>`).join('');
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === activeTab));

    [...nav.querySelectorAll('button')].forEach(btn => {
        btn.onclick = () => {
            [...nav.querySelectorAll('button')].forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(btn.dataset.id).classList.add('active');
            localStorage.setItem(ACTIVE_TAB_KEY, btn.dataset.id);
            render();
        };
    });
}

function openActionModal(mode, sku) {
  actionModal = { mode, sku };
  render();
  const qtyInput = document.querySelector('#actionModal input[name="qty"]');
  if (qtyInput) qtyInput.focus();
}

function closeActionModal() {
  actionModal = null;
  render();
}

function actionModalTitle(mode) {
  if (mode === 'arrive') return tr('title_arrive');
  if (mode === 'sale') return tr('title_sale');
  if (mode === 'return') return tr('title_return');
  return tr('title_arrive');
}

function actionModalMarkup(mode) {
  if (!actionModal || actionModal.mode !== mode) return '';

  const product = db.products.find(p => p.sku === actionModal.sku);
  if (!product) return '';

  let fields = '';
  let formId = '';

  if (mode === 'arrive') {
    formId = 'actionArriveForm';
    fields = `
      <input name="sku" readonly value="${escapeHtml(product.sku)}" placeholder="SKU">
      <input name="qty" type="number" placeholder="${tr('qty_placeholder')}" required>
      <input name="buyPrice" type="number" value="${escapeHtml(lastBuyPrice(product.sku) || '')}" placeholder="${tr('new_buy_price_placeholder')}" required>
      <button class="actionSubmit arriveAction">${tr('add_btn')}</button>
    `;
  }

  if (mode === 'sale') {
    formId = 'actionSaleForm';
    fields = `
      <input name="sku" readonly value="${escapeHtml(product.sku)}" placeholder="SKU">
      <input name="qty" type="number" placeholder="${tr('qty_placeholder')}" required>
      <input name="sellPrice" type="number" placeholder="${tr('sell_price_placeholder')}" required>
      <select name="payment">
        <option>Наличные</option>
        <option>Карта</option>
        <option>Перевод</option>
        <option>Долг</option>
      </select>
      <button class="actionSubmit saleAction">${tr('sold_btn')}</button>
    `;
  }

  if (mode === 'return') {
    formId = 'actionReturnForm';
    fields = `
      <input name="sku" readonly value="${escapeHtml(product.sku)}" placeholder="SKU">
      <input name="qty" type="number" placeholder="${tr('qty_placeholder')}" required>
      <input name="refundAmount" type="number" placeholder="${tr('refund_placeholder')}" required>
      <button class="actionSubmit returnAction">${tr('return_btn')}</button>
    `;
  }

  return `
    <div id="actionModal" class="modal show" onclick="if (event.target === this) closeActionModal()">
      <div class="modalPanel" role="dialog" aria-modal="true" aria-labelledby="actionModalTitle">
        <div class="modalHeader">
          <h3 id="actionModalTitle">${actionModalTitle(mode)}</h3>
          <button class="closeBtn" type="button" onclick="closeActionModal()" aria-label="Close">x</button>
        </div>
        <div class="modalProduct">
          <div class="photo">${photoMarkup(product.photo)}</div>
          <div>
            <h4>${escapeHtml(product.name)}</h4>
            <div class="muted">${escapeHtml(product.category || '')}</div>
            <div class="muted">${tr('stock_left')}: ${stockOf(product.sku)}</div>
          </div>
        </div>
        <form class="form modalForm" id="${formId}">
          ${fields}
        </form>
      </div>
    </div>
  `;
}

function openTab(id) {
  const tab = document.querySelector(`[data-id="${id}"]`);
  if (tab) tab.click();
}
