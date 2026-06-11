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

function editArrival(id) {
  const item = db.arrivals.find(x => x.id === id);
  if (!item) return;

  const qty = numberPrompt('Количество', item.qty);
  if (qty === null) return;
  const buyPrice = numberPrompt('Цена закупки', item.buyPrice);
  if (buyPrice === null) return;

  if (qty <= 0) {
    showNotice('Количество должно быть больше нуля');
    return;
  }

  const currentStockWithoutArrival = stockOf(item.sku) - item.qty;
  if (currentStockWithoutArrival + qty < 0) {
    showNotice('Нельзя уменьшить приход: остаток уйдёт в минус');
    return;
  }

  item.qty = qty;
  item.buyPrice = buyPrice;
  item.updatedAt = nowMs();
  save('Изменение прихода', `${productName(item.sku)}: ${qty} шт., ${money(buyPrice)}`);
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
    showNotice('Количество должно быть больше нуля');
    return;
  }

  const available = stockOf(item.sku) + item.qty;
  if (qty > available) {
    showNotice(`На складе доступно только ${available}`);
    return;
  }

  if (soldQtyOf(item.sku) - item.qty + qty < returnedQtyOf(item.sku)) {
    showNotice('Нельзя уменьшить продажу: по этому товару уже есть возврат');
    return;
  }

  item.qty = qty;
  item.sellPrice = sellPrice;
  item.payment = payment;
  item.costPrice = Number(item.costPrice) || avgCost(item.sku);
  item.updatedAt = nowMs();
  save('Изменение продажи', `${productName(item.sku)}: ${qty} шт., ${money(sellPrice)}, ${payment}`);
}

function editReturn(id) {
  const item = db.returns.find(x => x.id === id);
  if (!item) return;

  const qty = numberPrompt('Количество', item.qty);
  if (qty === null) return;
  const refundAmount = numberPrompt('Сумма возврата', item.refundAmount);
  if (refundAmount === null) return;

  if (qty <= 0) {
    showNotice('Количество должно быть больше нуля');
    return;
  }

  const available = canReturnQty(item.sku) + item.qty;
  if (qty > available) {
    showNotice(`Можно вернуть не больше ${available}`);
    return;
  }

  item.qty = qty;
  item.refundAmount = refundAmount;
  item.costPrice = Number(item.costPrice) || avgSoldCost(item.sku);
  item.updatedAt = nowMs();
  save('Изменение возврата', `${productName(item.sku)}: ${qty} шт., ${money(refundAmount)}`);
}

function editExpense(id) {
  const item = db.expenses.find(x => x.id === id);
  if (!item) return;

  const category = prompt('Категория', item.category);
  if (category === null) return;
  const amount = numberPrompt('Сумма', item.amount);
  if (amount === null) return;
  const comment = prompt('Комментарий', item.comment || '');
  if (comment === null) return;

  item.category = category;
  item.amount = amount;
  item.comment = comment.trim();
  item.updatedAt = nowMs();
  save('Изменение расхода', `${category}: ${money(amount)}${item.comment ? `, ${item.comment}` : ''}`);
}

function editWriteoff(id) {
  const item = db.writeoffs.find(x => x.id === id);
  if (!item) return;

  const qty = numberPrompt('Количество', item.qty);
  if (qty === null) return;
  const reason = prompt(tr('writeoff_reason_label'), item.reason || '');
  if (reason === null) return;

  if (qty <= 0) {
    showNotice('Количество должно быть больше нуля');
    return;
  }

  const available = stockOf(item.sku) + item.qty;
  if (qty > available) {
    showNotice(`На складе доступно только ${available}`);
    return;
  }

  item.qty = qty;
  item.reason = reason.trim();
  item.updatedAt = nowMs();
  save('Изменение списания', `${productName(item.sku)}: ${qty} шт., ${item.reason}`);
}

function arrivalsTable() {
  return `
    <h3>${tr('tbl_arrivals')}</h3>
    <table class="compactTable">
      <tr><th>${tr('col_date')}</th><th>${tr('col_item')}</th><th>${tr('col_qty')}</th><th>${tr('col_price')}</th><th>${tr('col_total')}</th><th></th></tr>
      ${db.arrivals.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${escapeHtml(productName(x.sku))}</td>
          <td>${escapeHtml(x.qty)}</td>
          <td>${money(x.buyPrice)}</td>
          <td>${money(x.qty * x.buyPrice)}</td>
          <td class="rowActions">
            <button data-id="${escapeHtml(x.id)}" onclick="editArrival(Number(this.dataset.id))">${tr('edit_short')}</button>
            <button data-id="${escapeHtml(x.id)}" onclick="deleteRecord('arrivals', Number(this.dataset.id))">${tr('delete_btn')}</button>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

function salesTable() {
  return `
    <h3>${tr('tbl_sales')}</h3>
    <table class="compactTable">
      <tr><th>${tr('col_date')}</th><th>${tr('col_item')}</th><th>${tr('col_qty')}</th><th>${tr('col_price')}</th><th>${tr('col_payment')}</th><th></th></tr>
      ${db.sales.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${escapeHtml(productName(x.sku))}</td>
          <td>${escapeHtml(x.qty)}</td>
          <td>${money(x.sellPrice)}</td>
          <td>${escapeHtml(x.payment || '')}</td>
          <td class="rowActions">
            <button data-id="${escapeHtml(x.id)}" onclick="editSale(Number(this.dataset.id))">${tr('edit_short')}</button>
            <button data-id="${escapeHtml(x.id)}" onclick="deleteRecord('sales', Number(this.dataset.id))">${tr('delete_btn')}</button>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

function returnsTable() {
  return `
    <h3>${tr('tbl_returns')}</h3>
    <table class="compactTable">
      <tr><th>${tr('col_date')}</th><th>${tr('col_item')}</th><th>${tr('col_qty')}</th><th>${tr('col_total')}</th><th></th></tr>
      ${db.returns.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${escapeHtml(productName(x.sku))}</td>
          <td>${escapeHtml(x.qty)}</td>
          <td>${money(x.refundAmount)}</td>
          <td class="rowActions">
            <button data-id="${escapeHtml(x.id)}" onclick="editReturn(Number(this.dataset.id))">${tr('edit_short')}</button>
            <button data-id="${escapeHtml(x.id)}" onclick="deleteRecord('returns', Number(this.dataset.id))">${tr('delete_btn')}</button>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

function writeoffsTable() {
  return `
    <h3>${tr('tbl_writeoffs')}</h3>
    <table class="compactTable">
      <tr><th>${tr('col_date')}</th><th>${tr('col_item')}</th><th>${tr('col_qty')}</th><th>${tr('col_reason')}</th><th>${tr('col_total')}</th><th></th></tr>
      ${db.writeoffs.map(x => `
        <tr>
          <td>${escapeHtml(x.date)}</td>
          <td>${escapeHtml(productName(x.sku))}</td>
          <td>${escapeHtml(x.qty)}</td>
          <td class="wrapCell">${escapeHtml(x.reason || '')}</td>
          <td>${money(writeoffCost(x))}</td>
          <td class="rowActions">
            <button data-id="${escapeHtml(x.id)}" onclick="editWriteoff(Number(this.dataset.id))">${tr('edit_short')}</button>
            <button data-id="${escapeHtml(x.id)}" onclick="deleteRecord('writeoffs', Number(this.dataset.id))">${tr('delete_btn')}</button>
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

function expensesTable() {
  return `
    <h3>${tr('tbl_expenses')}</h3>
    <table class="compactTable">
      <tr><th>${tr('col_date')}</th><th>${tr('col_category')}</th><th>${tr('col_comment')}</th><th>${tr('col_total')}</th><th></th></tr>
      ${db.expenses.map(x => `
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
    </table>
  `;
}
