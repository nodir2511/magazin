// Поле «дата операции» для форм создания (по умолчанию сегодня, нельзя выбрать будущее).
function opDateField(name = 'opDate') {
  return `<label class="fieldLabel">${tr('op_date')}
    <input name="${name}" type="date" value="${todayKey()}" max="${todayKey()}">
  </label>`;
}

// Выбранная дата операции: если пусто или в будущем — берём сегодня.
function chosenDateKey(value) {
  return value && value <= todayKey() ? value : todayKey();
}

const TABLE_PAGE = 20;
let tableLimits = {};

function tableLimit(collection) {
  return tableLimits[collection] || TABLE_PAGE;
}

function showMore(collection) {
  tableLimits[collection] = tableLimit(collection) + TABLE_PAGE;
  render();
}

// Новые сверху по ДАТЕ операции (записи задним числом встают на своё место), затем по id.
function sortedRecords(list) {
  return [...list].sort((a, b) => {
    const da = recordDate(a);
    const dbb = recordDate(b);
    if (da !== dbb) return da < dbb ? 1 : -1;
    return (b.id || 0) - (a.id || 0);
  });
}

// Отсортированный и обрезанный до лимита список + сколько ещё скрыто.
function pagedRecords(collection) {
  const sorted = sortedRecords(db[collection]);
  const visible = sorted.slice(0, tableLimit(collection));
  return { visible, moreCount: sorted.length - visible.length };
}

function showMoreRow(collection, moreCount, colspan) {
  if (moreCount <= 0) return '';
  return `<tr><td colspan="${colspan}" class="showMoreCell">
    <button class="showMoreBtn" onclick="showMore('${collection}')">${tr('show_more')} (${moreCount})</button>
  </td></tr>`;
}

function collectionTitle(collection) {
  return {
    arrivals: 'приход',
    sales: 'продажу',
    returns: 'возврат',
    expenses: 'расход',
    writeoffs: 'списание'
  }[collection] || collection;
}

function numberPrompt(label, value) {
  const result = prompt(label, value);
  if (result === null) return null;
  const number = Number(result);
  if (!Number.isFinite(number) || number < 0) {
    showNotice('Введите корректное число');
    return null;
  }
  return number;
}

function deleteRecord(collection, id) {
  const item = db[collection].find(x => x.id === id);
  if (!item) return;

  if (collection === 'arrivals' && stockOf(item.sku) - item.qty < 0) {
    showNotice('Нельзя удалить приход: остаток уйдёт в минус');
    return;
  }

  if (collection === 'sales' && soldQtyOf(item.sku) - item.qty < returnedQtyOf(item.sku)) {
    showNotice('Нельзя удалить продажу: по этому товару уже есть возврат');
    return;
  }

  if (!confirm('Удалить запись?')) return;
  db[collection] = db[collection].filter(x => x.id !== id);
  tombstone(collection, id);
  save('Удаление записи', `${collectionTitle(collection)}: ${item.sku ? productName(item.sku) : item.category || id}`);
}

// Редактирование операций — единая модалка вместо prompt(). В ней же поле даты.
let editModal = null; // { collection, id }

function editArrival(id) { openEditModal('arrivals', id); }
function editSale(id) { openEditModal('sales', id); }
function editReturn(id) { openEditModal('returns', id); }
function editExpense(id) { openEditModal('expenses', id); }
function editWriteoff(id) { openEditModal('writeoffs', id); }

function openEditModal(collection, id) {
  editModal = { collection, id };
  renderEditModal();
}

function closeEditModal() {
  editModal = null;
  renderEditModal();
}

function editModalTitleKey(collection) {
  return {
    arrivals: 'edit_arrival_title',
    sales: 'edit_sale_title',
    returns: 'edit_return_title',
    expenses: 'edit_expense_title',
    writeoffs: 'edit_writeoff_title'
  }[collection] || 'edit_btn';
}

function paymentOptions(current) {
  return ['Наличные', 'Карта', 'Перевод', 'Долг']
    .map(o => `<option ${o === current ? 'selected' : ''}>${o}</option>`).join('');
}

function editModalFields(collection, item) {
  const dateField = `<label class="fieldLabel">${tr('op_date')}
    <input name="opDate" type="date" value="${recordDate(item)}" max="${todayKey()}">
  </label>`;

  if (collection === 'arrivals') {
    return `
      <input name="qty" type="number" value="${escapeHtml(item.qty)}" placeholder="${tr('qty_placeholder')}" required>
      <input name="buyPrice" type="number" value="${escapeHtml(item.buyPrice)}" placeholder="${tr('buy_price_placeholder')}" required>
      <input name="supplier" value="${escapeHtml(item.supplier || '')}" placeholder="${tr('supplier_placeholder')}">
      <label class="checkboxField"><input name="paid" type="checkbox" ${item.paid !== false ? 'checked' : ''}>${tr('arrival_paid_checkbox')}</label>
      ${dateField}`;
  }
  if (collection === 'sales') {
    return `
      <input name="qty" type="number" value="${escapeHtml(item.qty)}" placeholder="${tr('qty_placeholder')}" required>
      <input name="sellPrice" type="number" value="${escapeHtml(item.sellPrice)}" placeholder="${tr('sell_price_placeholder')}" required>
      <select name="payment">${paymentOptions(item.payment)}</select>
      ${dateField}`;
  }
  if (collection === 'returns') {
    return `
      <input name="qty" type="number" value="${escapeHtml(item.qty)}" placeholder="${tr('qty_placeholder')}" required>
      <input name="refundAmount" type="number" value="${escapeHtml(item.refundAmount)}" placeholder="${tr('refund_placeholder')}" required>
      ${dateField}`;
  }
  if (collection === 'expenses') {
    return `
      <input name="category" value="${escapeHtml(item.category || '')}" placeholder="${tr('col_category')}" required>
      <input name="amount" type="number" value="${escapeHtml(item.amount)}" placeholder="${tr('amount_placeholder')}" required>
      <input name="comment" value="${escapeHtml(item.comment || '')}" placeholder="${tr('col_comment')}">
      ${dateField}`;
  }
  if (collection === 'writeoffs') {
    return `
      <input name="qty" type="number" value="${escapeHtml(item.qty)}" placeholder="${tr('qty_placeholder')}" required>
      <input name="reason" value="${escapeHtml(item.reason || '')}" placeholder="${tr('writeoff_reason_label')}">
      ${dateField}`;
  }
  return '';
}

function renderEditModal() {
  const mount = document.getElementById('editModalMount');
  if (!mount) return;

  if (!editModal) { mount.innerHTML = ''; updateBodyOverflow(); return; }

  const item = db[editModal.collection].find(x => x.id === editModal.id);
  if (!item) { editModal = null; mount.innerHTML = ''; return; }

  mount.innerHTML = `
    <div class="modal show" onclick="if (event.target === this) closeEditModal()">
      <div class="modalPanel" role="dialog" aria-modal="true" aria-labelledby="editModalTitle">
        <div class="modalHeader">
          <h3 id="editModalTitle">${tr(editModalTitleKey(editModal.collection))}</h3>
          <button class="closeBtn" type="button" onclick="closeEditModal()" aria-label="Close">x</button>
        </div>
        <form class="form modalForm" id="editModalForm">
          ${editModalFields(editModal.collection, item)}
          <button class="actionSubmit">${tr('save_btn')}</button>
        </form>
      </div>
    </div>`;

  const form = document.getElementById('editModalForm');
  if (form) form.onsubmit = submitEditModal;
  const first = mount.querySelector('input[name="qty"], input[name="category"]');
  if (first) first.focus();
  updateBodyOverflow();
}

function applyOpDate(item, dateKey) {
  item.dateKey = dateKey;
  item.date = displayDateFromKey(dateKey);
}

function finishEdit(action, details) {
  editModal = null;
  renderEditModal();
  save(action, details);
}

function submitEditModal(e) {
  e.preventDefault();
  if (!editModal) return;

  const { collection, id } = editModal;
  const item = db[collection].find(x => x.id === id);
  if (!item) { closeEditModal(); return; }

  const fd = new FormData(e.target);
  const dateKey = chosenDateKey(fd.get('opDate'));

  if (collection === 'arrivals') {
    const qty = +fd.get('qty');
    const buyPrice = +fd.get('buyPrice');
    if (!(qty > 0)) { showNotice('Количество должно быть больше нуля'); return; }
    if (buyPrice < 0) { showNotice('Введите корректную цену'); return; }
    if (stockOf(item.sku) - item.qty + qty < 0) { showNotice('Нельзя уменьшить приход: остаток уйдёт в минус'); return; }

    item.qty = qty;
    item.buyPrice = buyPrice;
    item.supplier = String(fd.get('supplier') || '').trim();
    item.paid = fd.get('paid') !== null;
    applyOpDate(item, dateKey);
    item.updatedAt = nowMs();
    finishEdit('Изменение прихода', `${productName(item.sku)}: ${qty} шт., ${money(buyPrice)}${item.supplier ? `, ${item.supplier}` : ''}${item.paid ? '' : ` (${tr('arrival_debt_label')})`}`);
    return;
  }

  if (collection === 'sales') {
    const qty = +fd.get('qty');
    const sellPrice = +fd.get('sellPrice');
    const payment = fd.get('payment');
    if (!(qty > 0)) { showNotice('Количество должно быть больше нуля'); return; }
    if (sellPrice < 0) { showNotice('Введите корректную цену'); return; }
    if (qty > stockOf(item.sku) + item.qty) { showNotice(`На складе доступно только ${stockOf(item.sku) + item.qty}`); return; }
    if (soldQtyOf(item.sku) - item.qty + qty < returnedQtyOf(item.sku)) { showNotice('Нельзя уменьшить продажу: по этому товару уже есть возврат'); return; }

    item.qty = qty;
    item.sellPrice = sellPrice;
    item.payment = payment;
    item.costPrice = Number(item.costPrice) || avgCost(item.sku);
    applyOpDate(item, dateKey);
    item.updatedAt = nowMs();
    finishEdit('Изменение продажи', `${productName(item.sku)}: ${qty} шт., ${money(sellPrice)}, ${payment}`);
    return;
  }

  if (collection === 'returns') {
    const qty = +fd.get('qty');
    const refundAmount = +fd.get('refundAmount');
    if (!(qty > 0)) { showNotice('Количество должно быть больше нуля'); return; }
    if (refundAmount < 0) { showNotice('Введите корректную сумму'); return; }
    if (qty > canReturnQty(item.sku) + item.qty) { showNotice(`Можно вернуть не больше ${canReturnQty(item.sku) + item.qty}`); return; }

    item.qty = qty;
    item.refundAmount = refundAmount;
    item.costPrice = Number(item.costPrice) || avgSoldCost(item.sku);
    applyOpDate(item, dateKey);
    item.updatedAt = nowMs();
    finishEdit('Изменение возврата', `${productName(item.sku)}: ${qty} шт., ${money(refundAmount)}`);
    return;
  }

  if (collection === 'expenses') {
    const category = String(fd.get('category') || '').trim();
    const amount = +fd.get('amount');
    if (!category) { showNotice('Введите категорию'); return; }
    if (amount < 0) { showNotice('Введите корректную сумму'); return; }

    item.category = category;
    item.amount = amount;
    item.comment = String(fd.get('comment') || '').trim();
    applyOpDate(item, dateKey);
    item.updatedAt = nowMs();
    finishEdit('Изменение расхода', `${category}: ${money(amount)}${item.comment ? `, ${item.comment}` : ''}`);
    return;
  }

  if (collection === 'writeoffs') {
    const qty = +fd.get('qty');
    if (!(qty > 0)) { showNotice('Количество должно быть больше нуля'); return; }
    if (qty > stockOf(item.sku) + item.qty) { showNotice(`На складе доступно только ${stockOf(item.sku) + item.qty}`); return; }

    item.qty = qty;
    item.reason = String(fd.get('reason') || '').trim();
    applyOpDate(item, dateKey);
    item.updatedAt = nowMs();
    finishEdit('Изменение списания', `${productName(item.sku)}: ${qty} шт.${item.reason ? `, ${item.reason}` : ''}`);
    return;
  }
}

function arrivalsTable() {
  const { visible, moreCount } = pagedRecords('arrivals');
  return `
    <h3>${tr('tbl_arrivals')}</h3>
    <table class="compactTable">
      <tr><th>${tr('col_date')}</th><th>${tr('col_item')}</th><th>${tr('col_supplier')}</th><th>${tr('col_qty')}</th><th>${tr('col_price')}</th><th>${tr('col_total')}</th><th></th></tr>
      ${visible.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${itemCell(x.sku)}</td>
          <td class="wrapCell">${escapeHtml(x.supplier || '')}${x.paid === false ? ` <span class="debtTag">${tr('arrival_debt_label')}</span>` : ''}</td>
          <td>${escapeHtml(x.qty)}</td>
          <td>${money(x.buyPrice)}</td>
          <td>${money(x.qty * x.buyPrice)}</td>
          <td class="rowActions">
            <button data-id="${escapeHtml(x.id)}" onclick="editArrival(Number(this.dataset.id))">${tr('edit_short')}</button>
            <button data-id="${escapeHtml(x.id)}" onclick="deleteRecord('arrivals', Number(this.dataset.id))">${tr('delete_btn')}</button>
          </td>
        </tr>
      `).join('')}
      ${showMoreRow('arrivals', moreCount, 7)}
    </table>
  `;
}

function salesTable() {
  const { visible, moreCount } = pagedRecords('sales');
  return `
    <h3>${tr('tbl_sales')}</h3>
    <table class="compactTable">
      <tr><th>${tr('col_date')}</th><th>${tr('col_item')}</th><th>${tr('col_qty')}</th><th>${tr('col_price')}</th><th>${tr('col_payment')}</th><th></th></tr>
      ${visible.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${itemCell(x.sku)}</td>
          <td>${escapeHtml(x.qty)}</td>
          <td>${money(x.sellPrice)}</td>
          <td>${escapeHtml(x.payment || '')}</td>
          <td class="rowActions">
            <button data-id="${escapeHtml(x.id)}" onclick="editSale(Number(this.dataset.id))">${tr('edit_short')}</button>
            <button data-id="${escapeHtml(x.id)}" onclick="deleteRecord('sales', Number(this.dataset.id))">${tr('delete_btn')}</button>
          </td>
        </tr>
      `).join('')}
      ${showMoreRow('sales', moreCount, 6)}
    </table>
  `;
}

function returnsTable() {
  const { visible, moreCount } = pagedRecords('returns');
  return `
    <h3>${tr('tbl_returns')}</h3>
    <table class="compactTable">
      <tr><th>${tr('col_date')}</th><th>${tr('col_item')}</th><th>${tr('col_qty')}</th><th>${tr('col_total')}</th><th></th></tr>
      ${visible.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${itemCell(x.sku)}</td>
          <td>${escapeHtml(x.qty)}</td>
          <td>${money(x.refundAmount)}</td>
          <td class="rowActions">
            <button data-id="${escapeHtml(x.id)}" onclick="editReturn(Number(this.dataset.id))">${tr('edit_short')}</button>
            <button data-id="${escapeHtml(x.id)}" onclick="deleteRecord('returns', Number(this.dataset.id))">${tr('delete_btn')}</button>
          </td>
        </tr>
      `).join('')}
      ${showMoreRow('returns', moreCount, 5)}
    </table>
  `;
}

function writeoffsTable() {
  const { visible, moreCount } = pagedRecords('writeoffs');
  return `
    <h3>${tr('tbl_writeoffs')}</h3>
    <table class="compactTable">
      <tr><th>${tr('col_date')}</th><th>${tr('col_item')}</th><th>${tr('col_qty')}</th><th>${tr('col_reason')}</th><th>${tr('col_total')}</th><th></th></tr>
      ${visible.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${itemCell(x.sku)}</td>
          <td>${escapeHtml(x.qty)}</td>
          <td class="wrapCell">${escapeHtml(x.reason || '')}</td>
          <td>${money(writeoffCost(x))}</td>
          <td class="rowActions">
            <button data-id="${escapeHtml(x.id)}" onclick="editWriteoff(Number(this.dataset.id))">${tr('edit_short')}</button>
            <button data-id="${escapeHtml(x.id)}" onclick="deleteRecord('writeoffs', Number(this.dataset.id))">${tr('delete_btn')}</button>
          </td>
        </tr>
      `).join('')}
      ${showMoreRow('writeoffs', moreCount, 6)}
    </table>
  `;
}

function expensesTable() {
  const { visible, moreCount } = pagedRecords('expenses');
  return `
    <h3>${tr('tbl_expenses')}</h3>
    <table class="compactTable">
      <tr><th>${tr('col_date')}</th><th>${tr('col_category')}</th><th>${tr('col_comment')}</th><th>${tr('col_total')}</th><th></th></tr>
      ${visible.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${escapeHtml(x.category)}</td>
          <td class="wrapCell">${escapeHtml(x.comment || '')}</td>
          <td>${money(x.amount)}</td>
          <td class="rowActions">
            <button data-id="${escapeHtml(x.id)}" onclick="editExpense(Number(this.dataset.id))">${tr('edit_short')}</button>
            <button data-id="${escapeHtml(x.id)}" onclick="deleteRecord('expenses', Number(this.dataset.id))">${tr('delete_btn')}</button>
          </td>
        </tr>
      `).join('')}
      ${showMoreRow('expenses', moreCount, 5)}
    </table>
  `;
}
