const DB_KEY = 'store_business_final_v1';
let db = JSON.parse(localStorage.getItem(DB_KEY) || '{"products":[],"arrivals":[],"sales":[],"returns":[],"expenses":[]}');
let selectedPeriod = 'today';
let productModalOpen = false;
let actionModal = null;
let productSearch = { arrive: '', sale: '', return: '' };

const tabs = [
    ['dashboard', 'Главная (Асосӣ)'],
    ['arrived', 'Товар пришёл (Бор омад)'],
    ['sales', 'Продал (Фурухт)'],
    ['returns', 'Возврат (Бозгашт)'],
    ['expenses', 'Расход (Харочот)'],
    ['stock', 'Склад (Анбор)'],
    ['report', 'Отчёт (Ҳисобот)']
];

function save() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    render();
}

function money(n) {
    return (Number(n) || 0).toLocaleString('ru-RU') + ' c';
}

function todayDisplay() {
    return new Date().toLocaleDateString('ru-RU');
}

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function makeSku(name) {
    return (name || 'MOL').slice(0, 3).toUpperCase() + '-' + String(db.products.length + 1).padStart(3, '0');
}

function recordDate(x) {
    return x.dateKey || todayKey();
}

function stockOf(sku) {
    const arrived = db.arrivals.filter(x => x.sku === sku).reduce((s, x) => s + x.qty, 0);
    const sold = db.sales.filter(x => x.sku === sku).reduce((s, x) => s + x.qty, 0);
    const returned = db.returns.filter(x => x.sku === sku).reduce((s, x) => s + x.qty, 0);
    return arrived + returned - sold;
}

function soldQtyOf(sku) {
    return db.sales.filter(x => x.sku === sku).reduce((s, x) => s + x.qty, 0);
}

function returnedQtyOf(sku) {
    return db.returns.filter(x => x.sku === sku).reduce((s, x) => s + x.qty, 0);
}

function canReturnQty(sku) {
    return soldQtyOf(sku) - returnedQtyOf(sku);
}

function avgCost(sku) {
    const arrivals = db.arrivals.filter(x => x.sku === sku);
    const qty = arrivals.reduce((s, x) => s + x.qty, 0);
    const sum = arrivals.reduce((s, x) => s + x.qty * x.buyPrice, 0);
    return qty ? sum / qty : 0;
}

function saleCost(x) {
    return x.qty * (Number(x.costPrice) || avgCost(x.sku));
}

function avgSoldCost(sku) {
    const sales = db.sales.filter(x => x.sku === sku);
    const qty = sales.reduce((s, x) => s + x.qty, 0);
    const sum = sales.reduce((s, x) => s + saleCost(x), 0);
    return qty ? sum / qty : avgCost(sku);
}

function returnCost(x) {
    return x.qty * (Number(x.costPrice) || avgSoldCost(x.sku));
}

function navRender() {
    nav.innerHTML = tabs.map(([id, name], i) => `<button class="${i === 0 ? 'active' : ''}" data-id="${id}">${name}</button>`).join('');

    [...nav.querySelectorAll('button')].forEach(btn => {
        btn.onclick = () => {
            [...nav.querySelectorAll('button')].forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(btn.dataset.id).classList.add('active');
            render();
        };
    });
}

function range(period) {
    const now = new Date();
    const end = todayKey();

    if (period === 'all') return ['1900-01-01', '2999-12-31'];
    if (period === 'today') return [end, end];
    if (period === 'week') {
        const d = new Date(now);
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        return [d.toISOString().slice(0, 10), end];
    }
    if (period === 'month') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        return [d.toISOString().slice(0, 10), end];
    }
    if (period === 'quarter') {
        const q = Math.floor(now.getMonth() / 3) * 3;
        const d = new Date(now.getFullYear(), q, 1);
        return [d.toISOString().slice(0, 10), end];
    }
    if (period === 'year') {
        const d = new Date(now.getFullYear(), 0, 1);
        return [d.toISOString().slice(0, 10), end];
    }

    const from = document.getElementById('dateFrom') ? .value || '1900-01-01';
    const to = document.getElementById('dateTo') ? .value || end;
    return [from, to];
}

function inPeriod(x, p) {
    const [from, to] = range(p);
    const date = recordDate(x);
    return date >= from && date <= to;
}

function totals(period = 'all') {
    const sales = db.sales.filter(x => inPeriod(x, period));
    const returns = db.returns.filter(x => inPeriod(x, period));
    const expenses = db.expenses.filter(x => inPeriod(x, period));
    const revenueRaw = sales.reduce((s, x) => s + x.qty * x.sellPrice, 0);
    const refund = returns.reduce((s, x) => s + x.refundAmount, 0);
    const revenue = revenueRaw - refund;
    const cost = sales.reduce((s, x) => s + saleCost(x), 0) - returns.reduce((s, x) => s + returnCost(x), 0);
    const exp = expenses.reduce((s, x) => s + x.amount, 0);
    const qty = sales.reduce((s, x) => s + x.qty, 0);
    const pay = { cash: 0, card: 0, transfer: 0, debt: 0 };

    sales.forEach(x => {
        const val = x.qty * x.sellPrice;
        const payment = (x.payment || '').toLowerCase();

        if (payment.includes('нал')) pay.cash += val;
        else if (payment.includes('карт')) pay.card += val;
        else if (payment.includes('пер')) pay.transfer += val;
        else pay.debt += val;
    });

    return {
        revenue,
        cost,
        gross: revenue - cost,
        expenses: exp,
        returns: refund,
        net: revenue - cost - exp,
        qty,
        avg: qty ? revenueRaw / qty : 0,
        pay
    };
}

function exportData() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'store_backup.json';
    a.click();
}

function fileToData(file) {
    return new Promise(res => {
        if (!file) {
            res('');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(file);
    });
}

function escapeHtml(value) {
    return String(value ? ? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeJsString(value) {
    return String(value ? ? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function productCards(mode, query = '') {
    query = query.toLowerCase();

    return db.products
        .filter(p => (p.name + p.category + p.sku).toLowerCase().includes(query))
        .map(p => `
      <div class="product" onclick="openActionModal('${mode}','${escapeJsString(p.sku)}')">
        <div class="photo">${p.photo ? `<img src="${p.photo}">` : 'Фото'}</div>
        <h4>${escapeHtml(p.name)}</h4>
        <div class="muted">${escapeHtml(p.category || '')}</div>
        <div class="muted">Остаток (Боқимонда): ${stockOf(p.sku)}</div>
      </div>
    `).join('');
}

function setSearch(mode, value) {
  productSearch[mode] = value;
  const grid = document.getElementById(mode + 'Products');
  if (grid) grid.innerHTML = productCards(mode, value);
}

function selectProduct(mode, sku) {
  openActionModal(mode, sku);
}

function openProductModal() {
  productModalOpen = true;
  renderArrived();
  document.querySelector('#newProductModal input[name="name"]')?.focus();
}

function closeProductModal() {
  productModalOpen = false;
  renderArrived();
}

function openActionModal(mode, sku) {
  actionModal = { mode, sku };
  render();
  document.querySelector('#actionModal input[name="qty"]')?.focus();
}

function closeActionModal() {
  actionModal = null;
  render();
}

function actionModalTitle(mode) {
  if (mode === 'arrive') return 'Добавить приход товара';
  if (mode === 'sale') return 'Продать товар';
  if (mode === 'return') return 'Оформить возврат';
  return 'Действие с товаром';
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
      <input name="qty" type="number" placeholder="Количество (Миқдор)" required>
      <input name="buyPrice" type="number" value="${product.buyPrice || ''}" placeholder="Цена закупки (Нархи харид)" required>
      <button class="actionSubmit arriveAction">Добавить (Илова кардан)</button>
    `;
  }

  if (mode === 'sale') {
    formId = 'actionSaleForm';
    fields = `
      <input name="sku" readonly value="${escapeHtml(product.sku)}" placeholder="SKU">
      <input name="qty" type="number" placeholder="Количество (Миқдор)" required>
      <input name="sellPrice" type="number" placeholder="Цена продажи (Нархи фурӯш)" required>
      <select name="payment">
        <option>Наличные</option>
        <option>Карта</option>
        <option>Перевод</option>
        <option>Долг</option>
      </select>
      <button class="actionSubmit saleAction">Продал (Фурухт)</button>
    `;
  }

  if (mode === 'return') {
    formId = 'actionReturnForm';
    fields = `
      <input name="sku" readonly value="${escapeHtml(product.sku)}" placeholder="SKU">
      <input name="qty" type="number" placeholder="Количество (Миқдор)" required>
      <input name="refundAmount" type="number" placeholder="Сумма возврата (Маблағи бозгашт)" required>
      <button class="actionSubmit returnAction">Возврат (Бозгашт)</button>
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
          <div class="photo">${product.photo ? `<img src="${product.photo}">` : 'Фото'}</div>
          <div>
            <h4>${escapeHtml(product.name)}</h4>
            <div class="muted">${escapeHtml(product.category || '')}</div>
            <div class="muted">Остаток (Боқимонда): ${stockOf(product.sku)}</div>
          </div>
        </div>
        <form class="form modalForm" id="${formId}">
          ${fields}
        </form>
      </div>
    </div>
  `;
}

function productName(sku) {
  return db.products.find(p => p.sku === sku)?.name || sku;
}

function numberPrompt(label, value) {
  const result = prompt(label, value);
  if (result === null) return null;
  const number = Number(result);
  if (!Number.isFinite(number) || number < 0) {
    alert('Введите корректное число');
    return null;
  }
  return number;
}

function deleteRecord(collection, id) {
  const item = db[collection].find(x => x.id === id);
  if (!item) return;

  if (collection === 'arrivals' && stockOf(item.sku) - item.qty < 0) {
    alert('Нельзя удалить приход: остаток уйдёт в минус');
    return;
  }

  if (collection === 'sales' && soldQtyOf(item.sku) - item.qty < returnedQtyOf(item.sku)) {
    alert('Нельзя удалить продажу: по этому товару уже есть возврат');
    return;
  }

  if (!confirm('Удалить запись?')) return;
  db[collection] = db[collection].filter(x => x.id !== id);
  save();
}

function editArrival(id) {
  const item = db.arrivals.find(x => x.id === id);
  if (!item) return;

  const qty = numberPrompt('Количество', item.qty);
  if (qty === null) return;
  const buyPrice = numberPrompt('Цена закупки', item.buyPrice);
  if (buyPrice === null) return;

  if (qty <= 0) {
    alert('Количество должно быть больше нуля');
    return;
  }

  const currentStockWithoutArrival = stockOf(item.sku) - item.qty;
  if (currentStockWithoutArrival + qty < 0) {
    alert('Нельзя уменьшить приход: остаток уйдёт в минус');
    return;
  }

  item.qty = qty;
  item.buyPrice = buyPrice;
  save();
}

function editSale(id) {
  const item = db.sales.find(x => x.id === id);
  if (!item) return;

  const qty = numberPrompt('Количество', item.qty);
  if (qty === null) return;
  const sellPrice = numberPrompt('Цена продажи', item.sellPrice);
  if (sellPrice === null) return;
  const payment = prompt('Оплата', item.payment || 'Наличные');
  if (payment === null) return;

  if (qty <= 0) {
    alert('Количество должно быть больше нуля');
    return;
  }

  const available = stockOf(item.sku) + item.qty;
  if (qty > available) {
    alert(`На складе доступно только ${available}`);
    return;
  }

  if (soldQtyOf(item.sku) - item.qty + qty < returnedQtyOf(item.sku)) {
    alert('Нельзя уменьшить продажу: по этому товару уже есть возврат');
    return;
  }

  item.qty = qty;
  item.sellPrice = sellPrice;
  item.payment = payment;
  item.costPrice = Number(item.costPrice) || avgCost(item.sku);
  save();
}

function editReturn(id) {
  const item = db.returns.find(x => x.id === id);
  if (!item) return;

  const qty = numberPrompt('Количество', item.qty);
  if (qty === null) return;
  const refundAmount = numberPrompt('Сумма возврата', item.refundAmount);
  if (refundAmount === null) return;

  if (qty <= 0) {
    alert('Количество должно быть больше нуля');
    return;
  }

  const available = canReturnQty(item.sku) + item.qty;
  if (qty > available) {
    alert(`Можно вернуть не больше ${available}`);
    return;
  }

  item.qty = qty;
  item.refundAmount = refundAmount;
  item.costPrice = Number(item.costPrice) || avgSoldCost(item.sku);
  save();
}

function editExpense(id) {
  const item = db.expenses.find(x => x.id === id);
  if (!item) return;

  const category = prompt('Категория', item.category);
  if (category === null) return;
  const amount = numberPrompt('Сумма', item.amount);
  if (amount === null) return;

  item.category = category;
  item.amount = amount;
  save();
}

function arrivalsTable() {
  return `
    <h3>История прихода</h3>
    <table>
      <tr><th>Дата</th><th>Товар</th><th>Кол-во</th><th>Цена</th><th></th></tr>
      ${db.arrivals.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${escapeHtml(productName(x.sku))}</td>
          <td>${x.qty}</td>
          <td>${money(x.buyPrice)}</td>
          <td class="rowActions">
            <button onclick="editArrival(${x.id})">Изм.</button>
            <button onclick="deleteRecord('arrivals', ${x.id})">Удалить</button>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

function salesTable() {
  return `
    <h3>История продаж</h3>
    <table>
      <tr><th>Дата</th><th>Товар</th><th>Кол-во</th><th>Цена</th><th>Оплата</th><th></th></tr>
      ${db.sales.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${escapeHtml(productName(x.sku))}</td>
          <td>${x.qty}</td>
          <td>${money(x.sellPrice)}</td>
          <td>${escapeHtml(x.payment || '')}</td>
          <td class="rowActions">
            <button onclick="editSale(${x.id})">Изм.</button>
            <button onclick="deleteRecord('sales', ${x.id})">Удалить</button>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

function returnsTable() {
  return `
    <h3>История возвратов</h3>
    <table>
      <tr><th>Дата</th><th>Товар</th><th>Кол-во</th><th>Сумма</th><th></th></tr>
      ${db.returns.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${escapeHtml(productName(x.sku))}</td>
          <td>${x.qty}</td>
          <td>${money(x.refundAmount)}</td>
          <td class="rowActions">
            <button onclick="editReturn(${x.id})">Изм.</button>
            <button onclick="deleteRecord('returns', ${x.id})">Удалить</button>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

function expensesTable() {
  return `
    <h3>История расходов</h3>
    <table>
      <tr><th>Дата</th><th>Категория</th><th>Сумма</th><th></th></tr>
      ${db.expenses.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${escapeHtml(x.category)}</td>
          <td>${money(x.amount)}</td>
          <td class="rowActions">
            <button onclick="editExpense(${x.id})">Изм.</button>
            <button onclick="deleteRecord('expenses', ${x.id})">Удалить</button>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

function renderDashboard() {
  const td = totals('today');
  const all = totals('all');

  dashboard.innerHTML = `
    <div class="grid stats">
      <div class="card"><span>Выручка сегодня (Даромади имрӯз)</span><b>${money(td.revenue)}</b></div>
      <div class="card"><span>Прибыль сегодня (Фоидаи имрӯз)</span><b>${money(td.net)}</b></div>
      <div class="card"><span>Расходы сегодня (Хароҷоти имрӯз)</span><b>${money(td.expenses)}</b></div>
      <div class="card"><span>Продано сегодня (Фурӯхта имрӯз)</span><b>${td.qty}</b></div>
    </div>
    <div class="grid quick">
      <button class="big sale" onclick="openTab('sales')">ПРОДАЛ (ФУРУХТ)</button>
      <button class="big split arrive" onclick="openTab('arrived')">ТОВАР ПРИШЁЛ (БОР ОМАД)</button>
      <button class="big split return" onclick="openTab('returns')">ВОЗВРАТ (БОЗГАШТ)</button>
      <button class="smallbtn" onclick="openTab('expenses')">РАСХОД (ХАРОЧОТ)</button>
      <button class="smallbtn" onclick="openTab('stock')">СКЛАД (АНБОР)</button>
    </div>
    <div class="grid stats">
      <div class="card"><span>Общая выручка (Даромади умумӣ)</span><b>${money(all.revenue)}</b></div>
      <div class="card"><span>Общая прибыль (Фоидаи умумӣ)</span><b>${money(all.net)}</b></div>
    </div>
  `;
}

function renderArrived() {
  arrived.innerHTML = `
    <h2>Товар пришёл (Бор омад)</h2>
    <button class="addProductBtn" onclick="openProductModal()">Добавить товар</button>
    <div id="newProductModal" class="modal ${productModalOpen ? 'show' : ''}" onclick="if (event.target === this) closeProductModal()">
      <div class="modalPanel" role="dialog" aria-modal="true" aria-labelledby="newProductTitle">
        <div class="modalHeader">
          <h3 id="newProductTitle">Добавить товар</h3>
          <button class="closeBtn" type="button" onclick="closeProductModal()" aria-label="Close">x</button>
        </div>
      <summary>Новый товар (Моли нав)</summary>
      <form class="form modalForm" id="newProductForm">
        <input name="photo" type="file" accept="image/*">
        <input name="name" placeholder="Название (Ном)" required>
        <input name="category" placeholder="Категория (Категория)">
        <input name="buyPrice" type="number" placeholder="Цена закупки (Нархи харид)" required>
        <input name="qty" type="number" placeholder="Количество (Миқдор)" required>
        <button class="actionSubmit createAction">Создать (Сохтан)</button>
      </form>
      </div>
    </div>
    <input id="arriveSearch" class="search" value="${escapeHtml(productSearch.arrive)}" oninput="setSearch('arrive', this.value)" placeholder="Поиск товара (Ҷустуҷӯи мол)">
    <div id="arriveProducts" class="productGrid">${productCards('arrive', productSearch.arrive)}</div>
    ${actionModalMarkup('arrive')}
    ${arrivalsTable()}
  `;

  newProductForm.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const f = Object.fromEntries(fd);
    const sku = makeSku(f.name);
    const photo = await fileToData(fd.get('photo'));

    if (+f.qty <= 0 || +f.buyPrice < 0) {
      alert('Введите корректное количество и цену');
      return;
    }

    db.products.push({ sku, name: f.name, category: f.category, buyPrice: +f.buyPrice, photo });
    db.arrivals.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku, qty: +f.qty, buyPrice: +f.buyPrice });
    productModalOpen = false;
    save();
  };

  const actionArriveForm = document.getElementById('actionArriveForm');
  if (actionArriveForm) actionArriveForm.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const f = Object.fromEntries(fd);

    if (+f.qty <= 0 || +f.buyPrice < 0) {
      alert('Введите корректное количество и цену');
      return;
    }

    db.arrivals.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku: f.sku, qty: +f.qty, buyPrice: +f.buyPrice });
    actionModal = null;
    save();
  };
}

function renderSales() {
  sales.innerHTML = `
    <h2>Продал (Фурухт)</h2>
    <input id="saleSearch" class="search" value="${escapeHtml(productSearch.sale)}" oninput="setSearch('sale', this.value)" placeholder="Поиск товара (Ҷустуҷӯи мол)">
    <div id="saleProducts" class="productGrid">${productCards('sale', productSearch.sale)}</div>
    ${actionModalMarkup('sale')}
    ${salesTable()}
  `;

  const actionSaleForm = document.getElementById('actionSaleForm');
  if (actionSaleForm) actionSaleForm.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const f = Object.fromEntries(fd);

    if (+f.qty <= 0 || +f.sellPrice < 0) {
      alert('Введите корректное количество и цену');
      return;
    }

    if (+f.qty > stockOf(f.sku)) {
      alert(`На складе доступно только ${stockOf(f.sku)}`);
      return;
    }

    db.sales.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku: f.sku, qty: +f.qty, sellPrice: +f.sellPrice, payment: f.payment, costPrice: avgCost(f.sku) });
    actionModal = null;
    save();
  };
}

function renderReturns() {
  returns.innerHTML = `
    <h2>Возврат (Бозгашт)</h2>
    <input id="returnSearch" class="search" value="${escapeHtml(productSearch.return)}" oninput="setSearch('return', this.value)" placeholder="Поиск товара (Ҷустуҷӯи мол)">
    <div id="returnProducts" class="productGrid">${productCards('return', productSearch.return)}</div>
    ${actionModalMarkup('return')}
    ${returnsTable()}
  `;

  const actionReturnForm = document.getElementById('actionReturnForm');
  if (actionReturnForm) actionReturnForm.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const f = Object.fromEntries(fd);

    if (+f.qty <= 0 || +f.refundAmount < 0) {
      alert('Введите корректное количество и сумму');
      return;
    }

    if (+f.qty > canReturnQty(f.sku)) {
      alert(`Можно вернуть не больше ${canReturnQty(f.sku)}`);
      return;
    }

    db.returns.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku: f.sku, qty: +f.qty, refundAmount: +f.refundAmount, costPrice: avgSoldCost(f.sku) });
    actionModal = null;
    save();
  };
}

function renderExpenses() {
  expenses.innerHTML = `
    <h2>Расход (Харочот)</h2>
    <form class="form" id="expenseForm">
      <select name="category">
        <option>Аренда (Иҷора)</option>
        <option>Зарплата (Маош)</option>
        <option>Еда (Хӯрок)</option>
        <option>Транспорт (Нақлиёт)</option>
        <option>Прочее (Дигар)</option>
      </select>
      <input name="amount" type="number" placeholder="Сумма (Маблағ)" required>
      <button>Сохранить (Нигоҳ доштан)</button>
    </form>
    ${expensesTable()}
  `;

  expenseForm.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const f = Object.fromEntries(fd);

    if (+f.amount < 0) {
      alert('Введите корректную сумму');
      return;
    }

    db.expenses.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), category: f.category, amount: +f.amount });
    save();
  };
}

function renderStock() {
  stock.innerHTML = `
    <h2>Склад (Анбор)</h2>
    <table>
      <tr>
        <th>Товар (Мол)</th>
        <th>Категория (Категория)</th>
        <th>Остаток (Боқимонда)</th>
        <th>Средняя закупка (Миёнаи харид)</th>
      </tr>
      ${db.products.map(p => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category || '')}</td>
          <td>${stockOf(p.sku)}</td>
          <td>${money(avgCost(p.sku))}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

function renderReport() {
  const t = totals(selectedPeriod);

  report.innerHTML = `
    <h2>Отчёт (Ҳисобот)</h2>
    <button class="topbtn reportExport" onclick="exportData()">Скачать данные</button>
    <div class="periods">
      <button onclick="setPeriod('today')" class="${selectedPeriod === 'today' ? 'active' : ''}">Сегодня (Имрӯз)</button>
      <button onclick="setPeriod('week')" class="${selectedPeriod === 'week' ? 'active' : ''}">Неделя (Ҳафта)</button>
      <button onclick="setPeriod('month')" class="${selectedPeriod === 'month' ? 'active' : ''}">Месяц (Моҳ)</button>
      <button onclick="setPeriod('quarter')" class="${selectedPeriod === 'quarter' ? 'active' : ''}">Квартал (Чоряк)</button>
      <button onclick="setPeriod('year')" class="${selectedPeriod === 'year' ? 'active' : ''}">Год (Сол)</button>
      <button onclick="setPeriod('all')" class="${selectedPeriod === 'all' ? 'active' : ''}">Всё (Ҳама)</button>
      <button onclick="setPeriod('custom')" class="${selectedPeriod === 'custom' ? 'active' : ''}">От даты (Аз сана)</button>
    </div>
    <div class="${selectedPeriod === 'custom' ? 'form' : 'hidden'}">
      <input type="date" id="dateFrom" onchange="renderReport()">
      <input type="date" id="dateTo" onchange="renderReport()">
    </div>
    <div class="grid stats">
      <div class="card"><span>Выручка (Даромад)</span><b>${money(t.revenue)}</b></div>
      <div class="card"><span>Себестоимость (Арзиши аслӣ)</span><b>${money(t.cost)}</b></div>
      <div class="card"><span>Валовая прибыль (Фоидаи умумӣ)</span><b>${money(t.gross)}</b></div>
      <div class="card"><span>Расходы (Харочот)</span><b>${money(t.expenses)}</b></div>
      <div class="card"><span>Возвраты (Бозгаштҳо)</span><b>${money(t.returns)}</b></div>
      <div class="card"><span>Чистая прибыль (Фоидаи соф)</span><b>${money(t.net)}</b></div>
      <div class="card"><span>Продано (Фурӯхта)</span><b>${t.qty}</b></div>
      <div class="card"><span>Средний чек (Чеки миёна)</span><b>${money(t.avg)}</b></div>
    </div>
    <div class="grid stats">
      <div class="card"><span>Наличные</span><b>${money(t.pay.cash)}</b></div>
      <div class="card"><span>Карта</span><b>${money(t.pay.card)}</b></div>
      <div class="card"><span>Перевод</span><b>${money(t.pay.transfer)}</b></div>
      <div class="card"><span>Долг</span><b>${money(t.pay.debt)}</b></div>
    </div>
  `;
}

function setPeriod(p) {
  selectedPeriod = p;
  renderReport();
}

function openTab(id) {
  document.querySelector(`[data-id="${id}"]`)?.click();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && productModalOpen) closeProductModal();
  if (e.key === 'Escape' && actionModal) closeActionModal();
});

function render() {
  renderDashboard();
  renderArrived();
  renderSales();
  renderReturns();
  renderExpenses();
  renderStock();
  renderReport();
}

navRender();
render();