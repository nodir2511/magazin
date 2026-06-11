function makeSku(name) {
    return (name || 'MOL').slice(0, 3).toUpperCase() + '-' + String(db.products.length + 1).padStart(3, '0');
}

function recordDate(x) {
    return x.dateKey || todayKey();
}

// Цвет остатка: <=1 красный, 2-4 оранжевый, >=5 зелёный
function stockClass(qty) {
    if (qty <= 1) return 'stockLow';
    if (qty < 5) return 'stockMid';
    return 'stockOk';
}

function deleteProduct(sku) {
    if (currentRole !== 'admin') {
        showNotice('Удалять товары может только админ.');
        return;
    }

    const product = db.products.find(p => p.sku === sku);
    if (!product) return;

    const remaining = stockOf(sku);
    const warning = remaining > 0 ? `На складе ещё ${remaining} шт. ` : '';
    if (!confirm(`${warning}Удалить товар «${product.name || sku}»? История прихода и продаж по нему сохранится.`)) return;

    db.products = db.products.filter(p => p.sku !== sku);
    tombstone('products', sku);
    if (productEditSku === sku) productEditSku = '';
    save('Удаление товара', product.name || sku);
}

function stockOf(sku) {
    const arrived = db.arrivals.filter(x => x.sku === sku).reduce((s, x) => s + x.qty, 0);
    const sold = db.sales.filter(x => x.sku === sku).reduce((s, x) => s + x.qty, 0);
    const returned = db.returns.filter(x => x.sku === sku).reduce((s, x) => s + x.qty, 0);
    const writtenOff = db.writeoffs.filter(x => x.sku === sku).reduce((s, x) => s + x.qty, 0);
    return arrived + returned - sold - writtenOff;
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

// Скользящая средняя себестоимость: проигрываем приходы/продажи/возвраты по времени (id),
// при каждом приходе средняя пересчитывается заново — старые закупочные цены не "тянут" текущую себестоимость.
function inventoryState(sku) {
    const events = [
        ...db.arrivals.filter(x => x.sku === sku).map(x => ({ type: 'arrival', id: x.id, qty: x.qty, price: Number(x.buyPrice) || 0 })),
        ...db.sales.filter(x => x.sku === sku).map(x => ({ type: 'sale', id: x.id, qty: x.qty, costPrice: Number(x.costPrice) || 0 })),
        ...db.returns.filter(x => x.sku === sku).map(x => ({ type: 'return', id: x.id, qty: x.qty, costPrice: Number(x.costPrice) || 0 })),
        ...db.writeoffs.filter(x => x.sku === sku).map(x => ({ type: 'writeoff', id: x.id, qty: x.qty, costPrice: Number(x.costPrice) || 0 }))
    ].sort((a, b) => a.id - b.id);

    let qty = 0;
    let value = 0;

    events.forEach(e => {
        if (e.type === 'arrival') {
            qty += e.qty;
            value += e.qty * e.price;
            return;
        }

        const avg = qty > 0 ? value / qty : 0;
        const cost = e.costPrice > 0 ? e.costPrice : avg;

        if (e.type === 'sale' || e.type === 'writeoff') {
            qty -= e.qty;
            value -= cost * e.qty;
        } else {
            qty += e.qty;
            value += cost * e.qty;
        }
    });

    return { qty, value };
}

function avgCost(sku) {
    const state = inventoryState(sku);
    return state.qty > 0 ? state.value / state.qty : lastBuyPrice(sku);
}

function lastBuyPrice(sku) {
    const arrivals = db.arrivals.filter(x => x.sku === sku && Number.isFinite(Number(x.buyPrice)));
    const lastArrival = arrivals[arrivals.length - 1];
    return lastArrival ? Number(lastArrival.buyPrice) : 0;
}

function lastSupplier(sku) {
    const arrivals = db.arrivals.filter(x => x.sku === sku && x.supplier);
    const lastArrival = arrivals[arrivals.length - 1];
    return lastArrival ? lastArrival.supplier : '';
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

function writeoffCost(x) {
    return x.qty * (Number(x.costPrice) || avgCost(x.sku));
}

function inventoryTotals() {
    return db.products.reduce((total, product) => {
        const state = inventoryState(product.sku);
        if (state.qty <= 0) return total;

        total.qty += state.qty;
        total.value += state.value;
        return total;
    }, { qty: 0, value: 0 });
}

async function fileToData(file) {
    if (!file || !file.size) return '';
    return uploadProductPhoto(file);
}

async function uploadProductPhoto(file) {
    if (!currentUser || !authSession) {
        showNotice('Сначала войдите в аккаунт.');
        return '';
    }

    const blob = await resizeImageToLimit(file, 100 * 1024);
    const path = `${currentUser.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.webp`;
    const response = await fetch(supabaseStorageObjectEndpoint(path), {
        method: 'POST',
        headers: supabaseHeaders({
            'Content-Type': blob.type || 'image/webp',
            'x-upsert': 'true'
        }),
        body: blob
    });

    if (!response.ok) {
        showNotice('Не удалось загрузить фото в Supabase.');
        return '';
    }

    return path;
}

async function resizeImageToLimit(file, maxBytes) {
    const image = await loadImage(file);
    let width = image.width;
    let height = image.height;
    let quality = 0.82;

    if (Math.max(width, height) > 900) {
        const ratio = 900 / Math.max(width, height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    for (let i = 0; i < 8; i++) {
        const blob = await canvasToBlob(image, width, height, quality);
        if (blob.size <= maxBytes || (width <= 320 && quality <= 0.45)) return blob;
        quality = Math.max(0.45, quality - 0.08);
        width = Math.max(320, Math.round(width * 0.86));
        height = Math.max(320, Math.round(height * 0.86));
    }

    return canvasToBlob(image, width, height, 0.42);
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = reject;
        img.src = url;
    });
}

function canvasToBlob(image, width, height, quality) {
    return new Promise(resolve => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        canvas.toBlob(blob => resolve(blob), 'image/webp', quality);
    });
}

function isPhotoPath(value) {
    return /^[a-zA-Z0-9/_-]+\.webp$/.test(String(value || ''));
}

function photoMarkup(path) {
    if (!isPhotoPath(path)) return 'Фото';
    return `<img alt="" data-photo-path="${escapeHtml(path)}">`;
}

const PHOTO_URL_TTL_MS = 3600 * 1000; // совпадает с expiresIn подписанной ссылки

async function signedPhotoUrl(path) {
    if (!isPhotoPath(path)) return '';

    // Кэш с временем жизни: старую (просроченную) ссылку не отдаём, а переподписываем.
    const cached = photoUrlCache.get(path);
    if (cached && Date.now() < cached.expiresAt) return cached.url;

    const response = await fetch(supabaseStorageSignEndpoint(path), {
        method: 'POST',
        headers: supabaseHeaders({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ expiresIn: 3600 })
    });

    if (!response.ok) return '';
    const data = await response.json();
    const signedUrl = data.signedURL || data.signedUrl;
    if (!signedUrl) return '';

    const url = `${SUPABASE_CONFIG.url.replace(/\/$/, '')}/storage/v1${signedUrl}`;
    // запас 5 минут, чтобы не отдать ссылку на грани истечения
    photoUrlCache.set(path, { url, expiresAt: Date.now() + PHOTO_URL_TTL_MS - 5 * 60 * 1000 });
    return url;
}

function hydrateProductPhotos() {
    document.querySelectorAll('img[data-photo-path]').forEach(async img => {
        const path = img.getAttribute('data-photo-path');
        if (!path) return;
        const cached = photoUrlCache.get(path);
        const fresh = cached && Date.now() < cached.expiresAt;
        // уже показано и подписанная ссылка ещё жива — ничего не делаем
        if (img.getAttribute('src') && fresh) return;
        const url = await signedPhotoUrl(path);
        if (url) img.setAttribute('src', url);
    });
}

function productCards(mode, query = '') {
    query = query.toLowerCase();

    return db.products
        .filter(p => {
            const buyPrice = lastBuyPrice(p.sku);
            return [
                p.name,
                p.category,
                p.sku,
                buyPrice,
                money(buyPrice)
            ].join(' ').toLowerCase().includes(query);
        })
        .map(p => `
      <div class="product" data-mode="${escapeHtml(mode)}" data-sku="${escapeHtml(p.sku)}" onclick="selectProductFromCard(this)">
        <div class="photo">${photoMarkup(p.photo)}</div>
        <h4>${escapeHtml(p.name)}</h4>
        ${mode === 'sale' && p.salePrice ? `<div class="salePriceBig">${money(p.salePrice)}</div>` : ''}
        <div class="muted">${escapeHtml(p.category || '')}</div>
        <div class="muted">${tr('stock_left')}: ${stockOf(p.sku)}</div>
        <div class="muted">${tr('last_buy')}: ${money(lastBuyPrice(p.sku))}</div>
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

function selectProductFromCard(card) {
  openActionModal(card.dataset.mode || '', card.dataset.sku || '');
}

function openProductModal() {
  productModalOpen = true;
  renderArrived();
  const nameInput = document.querySelector('#newProductModal input[name="name"]');
  if (nameInput) nameInput.focus();
}

function closeProductModal() {
  productModalOpen = false;
  renderArrived();
}

function openProductEditModal(sku) {
  const product = db.products.find(p => p.sku === sku);
  if (!product) return;

  productEditSku = sku;
  renderStock();
  hydrateProductPhotos();

  const nameInput = document.querySelector('#productEditModal input[name="name"]');
  if (nameInput) nameInput.focus();
}

function closeProductEditModal() {
  productEditSku = '';
  renderStock();
  hydrateProductPhotos();
}

function openProductEditFromButton(button) {
  openProductEditModal(button.dataset.sku || '');
}

function productName(sku) {
  const product = db.products.find(p => p.sku === sku);
  return product ? product.name || sku : sku;
}
