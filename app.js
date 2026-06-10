const DB_KEY = 'store_business_final_v1';
const SESSION_KEY = 'store_supabase_session_v1';
const CHANGES_KEY = 'store_changes_history_v1';
const ACTIVE_TAB_KEY = 'store_active_tab_v1';
const LANG_KEY = 'store_lang_v1';

let currentLang = localStorage.getItem(LANG_KEY) || 'ru';

const T = {
  ru: {
    tab_dashboard: 'Главная', tab_arrived: 'Товар пришёл', tab_sales: 'Продал',
    tab_returns: 'Возврат', tab_expenses: 'Расход', tab_stock: 'Склад',
    tab_report: 'Отчёт', tab_history: 'История',
    header_sub: 'Товар пришёл • Продал • Возврат • Расход',
    revenue_today: 'Выручка сегодня', profit_today: 'Прибыль сегодня',
    expenses_today: 'Расходы сегодня', sold_today: 'Продано сегодня',
    revenue_total: 'Общая выручка', profit_total: 'Общая прибыль',
    btn_sale: 'ПРОДАЛ', btn_arrived: 'ТОВАР ПРИШЁЛ', btn_return: 'ВОЗВРАТ',
    btn_expense: 'РАСХОД', btn_stock: 'СКЛАД',
    stock_left: 'Остаток', last_buy: 'Цена прихода',
    search_placeholder: 'Поиск товара',
    add_product: 'Добавить товар', new_product_title: 'Добавить товар',
    new_product_summary: 'Новый товар',
    photo_field: 'Фото товара (можно добавить позже)',
    name_placeholder: 'Название', category_placeholder: 'Категория',
    buy_price_placeholder: 'Цена закупки', qty_placeholder: 'Количество',
    create_btn: 'Создать',
    new_buy_price_placeholder: 'Новая цена закупки',
    add_btn: 'Добавить', sell_price_placeholder: 'Цена продажи',
    sold_btn: 'Продал', refund_placeholder: 'Сумма возврата', return_btn: 'Возврат',
    expense_cat_rent: 'Аренда', expense_cat_salary: 'Зарплата',
    expense_cat_food: 'Еда', expense_cat_transport: 'Транспорт',
    expense_cat_other: 'Прочее', amount_placeholder: 'Сумма', save_btn: 'Сохранить',
    col_photo: 'Фото', col_product: 'Товар', col_category: 'Категория',
    col_stock: 'Остаток', col_avg_cost: 'Средняя закупка',
    edit_btn: 'Редактировать', edit_product_title: 'Редактировать товар',
    product_name_label: 'Название товара', product_photo_label: 'Фото товара',
    save_product_btn: 'Сохранить товар',
    period_today: 'Сегодня', period_week: 'Неделя', period_month: 'Месяц',
    period_quarter: 'Квартал', period_year: 'Год', period_all: 'Всё',
    period_custom: 'От даты',
    rep_revenue: 'Выручка', rep_cost: 'Себестоимость', rep_gross: 'Валовая прибыль',
    rep_expenses: 'Расходы', rep_returns: 'Возвраты', rep_net: 'Чистая прибыль',
    rep_sold: 'Продано', rep_avg: 'Средний чек', rep_in_stock: 'Товаров на складе',
    rep_stock_value: 'Сумма склада по закупке',
    rep_cash: 'Наличные', rep_card: 'Карта', rep_transfer: 'Перевод', rep_debt: 'Долг',
    hist_title: 'История изменений', hist_date: 'Дата', hist_user: 'Пользователь',
    hist_action: 'Действие', hist_details: 'Детали', hist_empty: 'Пока изменений нет',
    tbl_arrivals: 'История прихода', tbl_sales: 'История продаж',
    tbl_returns: 'История возвратов', tbl_expenses: 'История расходов',
    col_date: 'Дата', col_item: 'Товар', col_qty: 'Кол-во', col_price: 'Цена',
    col_total: 'Сумма', col_payment: 'Оплата', col_comment: 'Комментарий',
    title_arrive: 'Зафиксировать приход', title_sale: 'Зафиксировать продажу',
    title_return: 'Оформить возврат', download_data: 'Скачать данные',
    edit_short: 'Изм.', delete_btn: 'Удалить',
  },
  tj: {
    tab_dashboard: 'Асосӣ', tab_arrived: 'Бор омад', tab_sales: 'Фурухт',
    tab_returns: 'Бозгашт', tab_expenses: 'Харочот', tab_stock: 'Анбор',
    tab_report: 'Ҳисобот', tab_history: 'Таърих',
    header_sub: 'Бор омад • Фурӯхт • Бозгашт • Хароҷот',
    revenue_today: 'Даромади имрӯз', profit_today: 'Фоидаи имрӯз',
    expenses_today: 'Хароҷоти имрӯз', sold_today: 'Фурӯхта имрӯз',
    revenue_total: 'Даромади умумӣ', profit_total: 'Фоидаи умумӣ',
    btn_sale: 'ФУРУХТ', btn_arrived: 'БОР ОМАД', btn_return: 'БОЗГАШТ',
    btn_expense: 'ХАРОЧОТ', btn_stock: 'АНБОР',
    stock_left: 'Боқимонда', last_buy: 'Нархи харид',
    search_placeholder: 'Ҷустуҷӯи мол',
    add_product: 'Мол илова кардан', new_product_title: 'Мол илова кардан',
    new_product_summary: 'Моли нав',
    photo_field: 'Акс (баъд ҳам шуда мешавад)',
    name_placeholder: 'Ном', category_placeholder: 'Категория',
    buy_price_placeholder: 'Нархи харид', qty_placeholder: 'Миқдор',
    create_btn: 'Сохтан',
    new_buy_price_placeholder: 'Нархи харид',
    add_btn: 'Илова кардан', sell_price_placeholder: 'Нархи фурӯш',
    sold_btn: 'Фурухт', refund_placeholder: 'Маблағи бозгашт', return_btn: 'Бозгашт',
    expense_cat_rent: 'Иҷора', expense_cat_salary: 'Маош',
    expense_cat_food: 'Хӯрок', expense_cat_transport: 'Нақлиёт',
    expense_cat_other: 'Дигар', amount_placeholder: 'Маблағ', save_btn: 'Нигоҳ доштан',
    col_photo: 'Акс', col_product: 'Мол', col_category: 'Категория',
    col_stock: 'Боқимонда', col_avg_cost: 'Миёнаи харид',
    edit_btn: 'Таҳрир', edit_product_title: 'Таҳрири мол',
    product_name_label: 'Номи мол', product_photo_label: 'Акси мол',
    save_product_btn: 'Мол нигоҳ доштан',
    period_today: 'Имрӯз', period_week: 'Ҳафта', period_month: 'Моҳ',
    period_quarter: 'Чоряк', period_year: 'Сол', period_all: 'Ҳама',
    period_custom: 'Аз сана',
    rep_revenue: 'Даромад', rep_cost: 'Арзиши аслӣ', rep_gross: 'Фоидаи умумӣ',
    rep_expenses: 'Харочот', rep_returns: 'Бозгаштҳо', rep_net: 'Фоидаи соф',
    rep_sold: 'Фурӯхта', rep_avg: 'Чеки миёна', rep_in_stock: 'Мол дар анбор',
    rep_stock_value: 'Арзиши анбор',
    rep_cash: 'Нақд', rep_card: 'Карта', rep_transfer: 'Интиқол', rep_debt: 'Қарз',
    hist_title: 'Таърихи тағйирот', hist_date: 'Сана', hist_user: 'Корбар',
    hist_action: 'Амал', hist_details: 'Тафсилот', hist_empty: 'Ҳоло тағйирот нест',
    tbl_arrivals: 'Таърихи бор', tbl_sales: 'Таърихи фурӯш',
    tbl_returns: 'Таърихи бозгашт', tbl_expenses: 'Таърихи харочот',
    col_date: 'Сана', col_item: 'Мол', col_qty: 'Миқдор', col_price: 'Нарх',
    col_total: 'Маблағ', col_payment: 'Пардохт', col_comment: 'Шарҳ',
    title_arrive: 'Бор омад', title_sale: 'Фурӯхт',
    title_return: 'Бозгашт', download_data: 'Маълумот зеркашӣ',
    edit_short: 'Иваз', delete_btn: 'Нест кардан',
  }
};

function tr(key) { return (T[currentLang] || T.ru)[key] || key; }

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  const headerSub = document.getElementById('headerSub');
  if (headerSub) headerSub.textContent = tr('header_sub');
  const btnRu = document.getElementById('langRu');
  const btnTj = document.getElementById('langTj');
  if (btnRu) btnRu.classList.toggle('active', lang === 'ru');
  if (btnTj) btnTj.classList.toggle('active', lang === 'tj');
  navRender();
  render();
}

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
const COLLECTIONS = ['products', 'arrivals', 'sales', 'returns', 'expenses'];
const TOMBSTONE_LIMIT = 1000;
function emptyDeleted() {
    return { products: [], arrivals: [], sales: [], returns: [], expenses: [] };
}
const DEFAULT_DB = { products: [], arrivals: [], sales: [], returns: [], expenses: [], deleted: emptyDeleted() };
function nowMs() { return Date.now(); }
function collectionKey(collection) { return collection === 'products' ? 'sku' : 'id'; }
const SUPABASE_TABLE = 'store_state';
const SUPABASE_CHANGES_TABLE = 'store_changes';
const SHARED_STORE_ID = 'main';
const PHOTO_BUCKET = 'product-photos';
const SUPABASE_CONFIG = window.STORE_SUPABASE || {};

let db = readLocalDb();
let authSession = readAuthSession();
let currentUser = authSession ? authSession.user : null;
let currentRole = null;
let changeHistory = readLocalChanges();
let selectedPeriod = 'today';
let productModalOpen = false;
let productEditSku = '';
let actionModal = null;
let userModalOpen = false;
let productSearch = { arrive: '', sale: '', return: '' };
let syncChain = Promise.resolve();
const photoUrlCache = new Map();
let recoveryAccessToken = '';


function readLocalDb() {
    try {
        return normalizeDb(JSON.parse(localStorage.getItem(DB_KEY) || '{}'));
    } catch (e) {
        return normalizeDb({});
    }
}

function normalizeDb(value) {
    const data = value && typeof value === 'object' ? value : {};
    const products = Array.isArray(data.products) ? data.products.map(p => ({
        sku: cleanValue(p && p.sku, 80),
        name: cleanValue(p && p.name, 160),
        category: cleanValue(p && p.category, 120),
        photo: isPhotoPath(p && p.photo) ? p.photo : '',
        updatedAt: cleanNumber(p && p.updatedAt)
    })) : [];

    return {
        products,
        arrivals: Array.isArray(data.arrivals) ? data.arrivals.map(x => ({
            id: cleanNumber(x && x.id),
            date: cleanValue(x && x.date, 40),
            dateKey: cleanValue(x && x.dateKey, 10),
            sku: cleanValue(x && x.sku, 80),
            qty: cleanNumber(x && x.qty),
            buyPrice: cleanNumber(x && x.buyPrice),
            updatedAt: cleanNumber(x && x.updatedAt)
        })) : [],
        sales: Array.isArray(data.sales) ? data.sales.map(x => ({
            id: cleanNumber(x && x.id),
            date: cleanValue(x && x.date, 40),
            dateKey: cleanValue(x && x.dateKey, 10),
            sku: cleanValue(x && x.sku, 80),
            qty: cleanNumber(x && x.qty),
            sellPrice: cleanNumber(x && x.sellPrice),
            payment: cleanValue(x && x.payment, 40),
            costPrice: cleanNumber(x && x.costPrice),
            updatedAt: cleanNumber(x && x.updatedAt)
        })) : [],
        returns: Array.isArray(data.returns) ? data.returns.map(x => ({
            id: cleanNumber(x && x.id),
            date: cleanValue(x && x.date, 40),
            dateKey: cleanValue(x && x.dateKey, 10),
            sku: cleanValue(x && x.sku, 80),
            qty: cleanNumber(x && x.qty),
            refundAmount: cleanNumber(x && x.refundAmount),
            costPrice: cleanNumber(x && x.costPrice),
            updatedAt: cleanNumber(x && x.updatedAt)
        })) : [],
        expenses: Array.isArray(data.expenses) ? data.expenses.map(x => ({
            id: cleanNumber(x && x.id),
            date: cleanValue(x && x.date, 40),
            dateKey: cleanValue(x && x.dateKey, 10),
            category: cleanValue(x && x.category, 120),
            amount: cleanNumber(x && x.amount),
            comment: cleanValue(x && x.comment, 300),
            updatedAt: cleanNumber(x && x.updatedAt)
        })) : [],
        deleted: normalizeDeleted(data.deleted)
    };
}

function normalizeDeleted(value) {
    const data = value && typeof value === 'object' ? value : {};
    const result = emptyDeleted();
    COLLECTIONS.forEach(name => {
        const list = Array.isArray(data[name]) ? data[name] : [];
        // products tombstoned by sku (string), остальные по id (number)
        const cleaned = list
            .map(v => name === 'products' ? cleanValue(v, 80) : cleanNumber(v))
            .filter(v => name === 'products' ? v : Number.isFinite(v) && v > 0);
        result[name] = Array.from(new Set(cleaned)).slice(-TOMBSTONE_LIMIT);
    });
    return result;
}

// Слияние двух баз: побеждает запись с большим updatedAt, удалённые (tombstone) исключаются.
function mergeDb(base, incoming) {
    const a = normalizeDb(base);
    const b = normalizeDb(incoming);
    const result = { deleted: emptyDeleted() };

    COLLECTIONS.forEach(name => {
        const key = collectionKey(name);
        const deletedSet = new Set([...a.deleted[name], ...b.deleted[name]]);
        const map = new Map();
        [...a[name], ...b[name]].forEach(item => {
            const id = item[key];
            const prev = map.get(id);
            if (!prev || (item.updatedAt || 0) >= (prev.updatedAt || 0)) map.set(id, item);
        });
        result[name] = [...map.values()].filter(item => !deletedSet.has(item[key]));
        result.deleted[name] = Array.from(deletedSet).slice(-TOMBSTONE_LIMIT);
    });

    return result;
}

function tombstone(collection, id) {
    if (!db.deleted) db.deleted = emptyDeleted();
    if (!Array.isArray(db.deleted[collection])) db.deleted[collection] = [];
    if (!db.deleted[collection].includes(id)) {
        db.deleted[collection].push(id);
        db.deleted[collection] = db.deleted[collection].slice(-TOMBSTONE_LIMIT);
    }
}

function cleanValue(value, limit = 200) {
    return String(value == null ? '' : value).slice(0, limit);
}

function cleanNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
}

function hasDbData(value) {
    const data = normalizeDb(value);
    return data.products.length || data.arrivals.length || data.sales.length || data.returns.length || data.expenses.length;
}

function readLocalChanges() {
    try {
        const items = JSON.parse(localStorage.getItem(CHANGES_KEY) || '[]');
        return Array.isArray(items) ? items : [];
    } catch (e) {
        return [];
    }
}

function userDbKey() {
    return DB_KEY;
}

function readAuthSession() {
    try {
        const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
        if (!session || !session.access_token || !session.user) return null;
        return session;
    } catch (e) {
        return null;
    }
}

function persistLocalDb() {
    try {
        localStorage.setItem(userDbKey(), JSON.stringify(db));
    } catch (e) {
        // переполнение хранилища не должно прерывать работу и синхронизацию
        showNotice('Локальная память переполнена. Данные отправляются на сервер, но не сохранены на устройстве.');
    }
}

function save(action = 'Изменение', details = '') {
    persistLocalDb();
    render();
    syncToSupabase(action, details);
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

function lastBuyPrice(sku) {
    const arrivals = db.arrivals.filter(x => x.sku === sku && Number.isFinite(Number(x.buyPrice)));
    const lastArrival = arrivals[arrivals.length - 1];
    return lastArrival ? Number(lastArrival.buyPrice) : 0;
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

function inventoryTotals() {
    return db.products.reduce((total, product) => {
        const qty = stockOf(product.sku);
        if (qty <= 0) return total;

        total.qty += qty;
        total.value += qty * avgCost(product.sku);
        return total;
    }, { qty: 0, value: 0 });
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

    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const from = dateFrom ? dateFrom.value || '1900-01-01' : '1900-01-01';
    const to = dateTo ? dateTo.value || end : end;
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

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeJsString(value) {
    return String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function isPhotoPath(value) {
    return /^[a-zA-Z0-9/_-]+\.webp$/.test(String(value || ''));
}

function photoMarkup(path) {
    if (!isPhotoPath(path)) return 'Фото';
    return `<img alt="" data-photo-path="${escapeHtml(path)}">`;
}

async function signedPhotoUrl(path) {
    if (!isPhotoPath(path)) return '';
    if (photoUrlCache.has(path)) return photoUrlCache.get(path);

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
    photoUrlCache.set(path, url);
    return url;
}

function hydrateProductPhotos() {
    document.querySelectorAll('img[data-photo-path]').forEach(async img => {
        const path = img.getAttribute('data-photo-path');
        if (!path || img.getAttribute('src')) return;
        const url = await signedPhotoUrl(path);
        if (url) img.setAttribute('src', url);
    });
}

function isSupabaseConfigured() {
    return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
}

function supabaseEndpoint(query = '') {
    return supabaseRestEndpoint(SUPABASE_TABLE, query);
}

function supabaseChangesEndpoint(query = '') {
    return supabaseRestEndpoint(SUPABASE_CHANGES_TABLE, query);
}

function supabaseRestEndpoint(table, query = '') {
    return `${SUPABASE_CONFIG.url.replace(/\/$/, '')}/rest/v1/${table}${query}`;
}

function supabaseAuthEndpoint(path) {
    return `${SUPABASE_CONFIG.url.replace(/\/$/, '')}/auth/v1/${path}`;
}

function supabaseFunctionEndpoint(name) {
    return `${SUPABASE_CONFIG.url.replace(/\/$/, '')}/functions/v1/${name}`;
}

function supabaseStorageObjectEndpoint(path) {
    return `${SUPABASE_CONFIG.url.replace(/\/$/, '')}/storage/v1/object/${PHOTO_BUCKET}/${path}`;
}

function supabaseStorageSignEndpoint(path) {
    return `${SUPABASE_CONFIG.url.replace(/\/$/, '')}/storage/v1/object/sign/${PHOTO_BUCKET}/${path}`;
}

function supabaseHeaders(extra = {}) {
    const token = authSession ? authSession.access_token : SUPABASE_CONFIG.anonKey;
    return {
        apikey: SUPABASE_CONFIG.anonKey,
        Authorization: `Bearer ${token}`,
        ...extra
    };
}

function showAuthCard(id) {
    ['authForm', 'recoveryForm', 'passwordResetForm'].forEach(formId => {
        const form = document.getElementById(formId);
        if (form) form.classList.toggle('hidden', formId !== id);
    });
}

function showLoginForm() {
    recoveryAccessToken = '';
    showAuthCard('authForm');
}

function showRecoveryForm() {
    showAuthCard('recoveryForm');
}

function readRecoveryParams() {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);
    const type = hashParams.get('type') || queryParams.get('type');
    const accessToken = hashParams.get('access_token');
    const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

    return { type, accessToken, errorDescription };
}

function preparePasswordResetFromUrl() {
    const params = readRecoveryParams();

    if (params.errorDescription) {
        showNotice(params.errorDescription);
        showLoginForm();
        return false;
    }

    if (params.type === 'recovery' && params.accessToken) {
        recoveryAccessToken = params.accessToken;
        showAuthCard('passwordResetForm');
        history.replaceState(null, '', window.location.pathname);
        return true;
    }

    return false;
}

async function requestPasswordRecovery(email) {
    if (!isSupabaseConfigured()) {
        showNotice('Supabase не настроен.');
        return;
    }

    const redirectTo = window.location.origin + window.location.pathname;
    const response = await fetch(`${supabaseAuthEndpoint('recover')}?redirect_to=${encodeURIComponent(redirectTo)}`, {
        method: 'POST',
        headers: {
            apikey: SUPABASE_CONFIG.anonKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    });

    if (!response.ok) throw new Error('Recovery failed');
}

async function updateRecoveryPassword(password) {
    if (!recoveryAccessToken) throw new Error('Recovery token is missing');

    const response = await fetch(supabaseAuthEndpoint('user'), {
        method: 'PUT',
        headers: {
            apikey: SUPABASE_CONFIG.anonKey,
            Authorization: `Bearer ${recoveryAccessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.msg || data.error_description || data.message || 'Password update failed');
    return data;
}

async function submitRecoveryEmail() {
    const form = document.getElementById('recoveryForm');
    if (!form || !form.reportValidity()) return;

    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();

    try {
        await requestPasswordRecovery(email);
        form.reset();
        showLoginForm();
        showNotice('Ссылка для смены пароля отправлена на email.');
    } catch (e) {
        showNotice('Не удалось отправить ссылку восстановления. Проверьте email и настройки Supabase.');
    }
}

async function submitPasswordReset() {
    const form = document.getElementById('passwordResetForm');
    if (!form || !form.reportValidity()) return;

    const fd = new FormData(form);
    const password = String(fd.get('password') || '');
    const passwordConfirm = String(fd.get('passwordConfirm') || '');

    if (password !== passwordConfirm) {
        showNotice('Пароли не совпадают.');
        return;
    }

    try {
        await updateRecoveryPassword(password);
        form.reset();
        showLoginForm();
        showNotice('Пароль обновлен. Теперь войдите с новым паролем.');
    } catch (e) {
        showNotice('Не удалось обновить пароль. Запросите новую ссылку восстановления.');
    }
}

function setSyncStatus(text, state = '') {
    const badge = document.getElementById('syncStatus');
    if (!badge) return;
    badge.textContent = text;
    badge.className = `syncStatus ${state}`.trim();
}

function setAuthView(isLoggedIn) {
    const authPage = document.getElementById('authPage');
    const appShell = document.getElementById('appShell');
    const userEmail = document.getElementById('userEmail');
    const createUserButton = document.getElementById('createUserButton');

    if (authPage) authPage.classList.toggle('hidden', isLoggedIn);
    if (appShell) appShell.classList.toggle('hidden', !isLoggedIn);
    if (userEmail) userEmail.textContent = currentUser ? `${currentUser.email}${currentRole ? ' · ' + currentRole : ''}` : '';
    if (createUserButton) createUserButton.classList.toggle('hidden', currentRole !== 'admin');
}

async function authRequest(path, body) {
    if (!isSupabaseConfigured()) throw new Error('Supabase is not configured');

    const response = await fetch(supabaseAuthEndpoint(path), {
        method: 'POST',
        headers: {
            apikey: SUPABASE_CONFIG.anonKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.msg || data.error_description || data.message || 'Auth failed');
    return data;
}

function applyAuthSession(session) {
    authSession = session;
    currentUser = session.user;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    db = readLocalDb();

    setAuthView(true);
    navRender();
    render();
    loadCurrentRole().then(() => {
        setAuthView(true);
        loadFromSupabase();
        loadChangeHistory();
    });
}

function isSessionExpired(session) {
    return Boolean(session && session.expires_at && session.expires_at * 1000 <= Date.now() + 30000);
}

async function refreshAuthSession() {
    if (!authSession || !authSession.refresh_token) return false;

    try {
        const session = await authRequest('token?grant_type=refresh_token', {
            refresh_token: authSession.refresh_token
        });
        applyAuthSession(session);
        return true;
    } catch (e) {
        sessionStorage.removeItem(SESSION_KEY);
        authSession = null;
        currentUser = null;
        return false;
    }
}

async function loadCurrentRole() {
    currentRole = null;
    if (!isSupabaseConfigured() || !currentUser) return null;

    try {
        const response = await fetch(
            supabaseRestEndpoint('user_roles', `?user_id=eq.${encodeURIComponent(currentUser.id)}&select=role`),
            { headers: supabaseHeaders({ Accept: 'application/json' }) }
        );
        if (!response.ok) throw new Error('Role load failed');
        const rows = await response.json();
        currentRole = rows[0] ? rows[0].role : null;
        return currentRole;
    } catch (e) {
        currentRole = null;
        return null;
    }
}

async function loginUser(email, password) {
    try {
        const session = await authRequest('token?grant_type=password', { email, password });
        applyAuthSession(session);
    } catch (e) {
        showNotice('Не удалось войти. Проверьте email и пароль.');
    }
}

async function signUpUser() {
    if (currentRole !== 'admin') {
        showNotice('Создавать пользователей может только админ.');
        return;
    }

    const form = document.getElementById('createUserForm');
    if (!form || !form.reportValidity()) return;

    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');

    try {
        await createUserRequest(email, password);
        closeUserModal();
        showNotice('Пользователь создан. Теперь он может войти по email и паролю.');
    } catch (e) {
        const message = e?.message || 'Проверьте, что Edge Function create-user опубликована.';
        showNotice(`Не удалось создать пользователя. ${message}`);
    }
}

async function createUserRequest(email, password) {
    if (!currentUser || !authSession) throw new Error('Only logged-in users can create users');

    const response = await fetch(supabaseFunctionEndpoint('create-user'), {
        method: 'POST',
        headers: supabaseHeaders({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ email, password })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Create user failed');
    return data;
}

function openUserModal() {
    if (currentRole !== 'admin') {
        showNotice('Создавать пользователей может только админ.');
        return;
    }

    const modal = document.getElementById('userModal');
    if (!modal) return;

    userModalOpen = true;
    modal.classList.add('show');
    const emailInput = modal.querySelector('input[name="email"]');
    if (emailInput) emailInput.focus();
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (!modal) return;

    userModalOpen = false;
    modal.classList.remove('show');

    const form = document.getElementById('createUserForm');
    if (form) form.reset();
}

async function logoutUser() {
    if (authSession && isSupabaseConfigured()) {
        fetch(supabaseAuthEndpoint('logout'), {
            method: 'POST',
            headers: supabaseHeaders()
        }).catch(() => {});
    }

    stopPolling();
    lastRemoteStamp = '';
    authSession = null;
    currentUser = null;
    currentRole = null;
    db = { ...DEFAULT_DB, deleted: emptyDeleted() };
    sessionStorage.removeItem(SESSION_KEY);
    setAuthView(false);
}

let lastRemoteStamp = '';
let pollTimer = null;

async function loadFromSupabase() {
    if (!isSupabaseConfigured()) {
        setSyncStatus('Локально', 'local');
        return;
    }

    if (!currentUser) {
        setSyncStatus('Войдите', 'offline');
        return;
    }

    setSyncStatus('Синхронизация...', 'syncing');

    try {
        const response = await fetch(
            supabaseEndpoint(`?id=eq.${encodeURIComponent(SHARED_STORE_ID)}&select=data,updated_at`),
            { headers: supabaseHeaders({ Accept: 'application/json' }) }
        );

        if (!response.ok) throw new Error(`Supabase load failed: ${response.status}`);

        const rows = await response.json();

        if (rows.length && rows[0].data) {
            // СЛИЯНИЕ, а не перезапись: локальные несинхронизированные правки сохраняются
            db = mergeDb(rows[0].data, db);
            lastRemoteStamp = rows[0].updated_at || '';
            persistLocalDb();
            render();
            setSyncStatus('Supabase', 'online');
            startPolling();
            return;
        }

        await syncToSupabase('', '', true);
        setSyncStatus('Supabase', 'online');
        startPolling();
    } catch (e) {
        setSyncStatus('Оффлайн', 'offline');
        showNotice('Не удалось загрузить данные из Supabase. Приложение пока работает с локальными данными.');
    }
}

// Ручное обновление по кнопке + опрос: подтягивает чужие изменения и сливает с локальными.
async function refreshFromSupabase(showStatus = true) {
    if (!isSupabaseConfigured() || !currentUser) return;

    try {
        const response = await fetch(
            supabaseEndpoint(`?id=eq.${encodeURIComponent(SHARED_STORE_ID)}&select=data,updated_at`),
            { headers: supabaseHeaders({ Accept: 'application/json' }) }
        );
        if (!response.ok) throw new Error(`Supabase refresh failed: ${response.status}`);

        const rows = await response.json();
        if (!rows.length || !rows[0].data) return;

        const remoteStamp = rows[0].updated_at || '';
        if (remoteStamp && remoteStamp === lastRemoteStamp) {
            if (showStatus) setSyncStatus('Supabase', 'online');
            return; // ничего нового
        }

        db = mergeDb(rows[0].data, db);
        lastRemoteStamp = remoteStamp;
        persistLocalDb();
        render();
        loadChangeHistory();
        if (showStatus) setSyncStatus('Обновлено', 'online');
    } catch (e) {
        if (showStatus) setSyncStatus('Оффлайн', 'offline');
    }
}

function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(() => {
        if (document.hidden) return; // не опрашиваем в фоне
        refreshFromSupabase(false);
    }, 12000);
}

function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshFromSupabase(false);
});

function syncToSupabase(action = 'Изменение', details = '', force = false) {
    if (!isSupabaseConfigured()) {
        setSyncStatus('Локально', 'local');
        return Promise.resolve();
    }

    if (!currentUser) {
        setSyncStatus('Войдите', 'offline');
        return Promise.resolve();
    }

    const payload = normalizeDb(JSON.parse(JSON.stringify(db)));

    syncChain = syncChain
        .then(async () => {
            setSyncStatus('Сохранение...', 'syncing');

            const response = await fetch(supabaseFunctionEndpoint('save-store'), {
                method: 'POST',
                headers: supabaseHeaders({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    data: payload,
                    action,
                    details
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || errorData.message || `Supabase save failed: ${response.status}`;
                throw new Error(errorMessage);
            }
            // Сервер возвращает слитое состояние — принимаем его как источник истины
            const result = await response.json().catch(() => ({}));
            if (result && result.data) {
                db = mergeDb(result.data, db);
                lastRemoteStamp = result.updated_at || lastRemoteStamp;
                persistLocalDb();
                render();
            }
            if (action) rememberChange({
                created_at: new Date().toISOString(),
                user_email: currentUser ? currentUser.email : '',
                action,
                details
            });
            loadChangeHistory();
            setSyncStatus(force ? 'Supabase' : 'Сохранено', 'online');
        })
        .catch((error) => {
            setSyncStatus('Оффлайн', 'offline');
            showNotice(`Данные сохранены локально, но не отправились в Supabase. Причина: ${error.message || 'неизвестная ошибка'}`);
        });

    return syncChain;
}

function rememberChange(entry) {
    changeHistory = [entry, ...changeHistory].slice(0, 100);
    localStorage.setItem(CHANGES_KEY, JSON.stringify(changeHistory));
    renderHistory();
}

async function saveChange(action, details = '') {
    const entry = {
        created_at: new Date().toISOString(),
        user_id: currentUser ? currentUser.id : null,
        user_email: currentUser ? currentUser.email : 'Локально',
        action,
        details
    };

    rememberChange(entry);
}

async function loadChangeHistory() {
    if (!isSupabaseConfigured() || !currentUser) {
        renderHistory();
        return;
    }

    try {
        const response = await fetch(
            supabaseChangesEndpoint('?select=created_at,user_email,action,details&order=created_at.desc&limit=100'),
            { headers: supabaseHeaders({ Accept: 'application/json' }) }
        );

        if (!response.ok) throw new Error(`Supabase history load failed: ${response.status}`);

        changeHistory = await response.json();
        localStorage.setItem(CHANGES_KEY, JSON.stringify(changeHistory));
        renderHistory();
    } catch (e) {
        renderHistory();
    }
}

function showNotice(message, title = 'Уведомление') {
    const oldNotice = document.getElementById('noticeModal');
    if (oldNotice) oldNotice.remove();

    const notice = document.createElement('div');
    notice.id = 'noticeModal';
    notice.className = 'noticeModal show';
    notice.innerHTML = `
      <div class="noticePanel" role="alertdialog" aria-modal="true" aria-labelledby="noticeTitle">
        <div class="noticeIcon">!</div>
        <div class="noticeContent">
          <h3 id="noticeTitle">${escapeHtml(title)}</h3>
          <p>${escapeHtml(message)}</p>
        </div>
        <button class="noticeClose" type="button" onclick="closeNotice()">Закрыть</button>
      </div>
    `;

    notice.onclick = e => {
        if (e.target === notice) closeNotice();
    };

    document.body.appendChild(notice);
    notice.querySelector('.noticeClose').focus();
}

function closeNotice() {
    const notice = document.getElementById('noticeModal');
    if (notice) notice.remove();
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

function productName(sku) {
  const product = db.products.find(p => p.sku === sku);
  return product ? product.name || sku : sku;
}

function collectionTitle(collection) {
  return {
    arrivals: 'приход',
    sales: 'продажу',
    returns: 'возврат',
    expenses: 'расход'
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

function renderDashboard() {
  const td = totals('today');
  const all = totals('all');

  dashboard.innerHTML = `
    <div class="grid stats">
      <div class="card"><span>${tr('revenue_today')}</span><b>${money(td.revenue)}</b></div>
      <div class="card"><span>${tr('profit_today')}</span><b>${money(td.net)}</b></div>
      <div class="card"><span>${tr('expenses_today')}</span><b>${money(td.expenses)}</b></div>
      <div class="card"><span>${tr('sold_today')}</span><b>${td.qty}</b></div>
    </div>
    <div class="grid quick">
      <button class="big sale" onclick="openTab('sales')">${tr('btn_sale')}</button>
      <button class="big split arrive" onclick="openTab('arrived')">${tr('btn_arrived')}</button>
      <button class="big split return" onclick="openTab('returns')">${tr('btn_return')}</button>
      <button class="smallbtn" onclick="openTab('expenses')">${tr('btn_expense')}</button>
      <button class="smallbtn" onclick="openTab('stock')">${tr('btn_stock')}</button>
    </div>
    <div class="grid stats">
      <div class="card"><span>${tr('revenue_total')}</span><b>${money(all.revenue)}</b></div>
      <div class="card"><span>${tr('profit_total')}</span><b>${money(all.net)}</b></div>
    </div>
  `;
}

function renderArrived() {
  arrived.innerHTML = `
    <h2>${tr('tab_arrived')}</h2>
    <button class="addProductBtn" onclick="openProductModal()">${tr('add_product')}</button>
    <div id="newProductModal" class="modal ${productModalOpen ? 'show' : ''}" onclick="if (event.target === this) closeProductModal()">
      <div class="modalPanel" role="dialog" aria-modal="true" aria-labelledby="newProductTitle">
        <div class="modalHeader">
          <h3 id="newProductTitle">${tr('new_product_title')}</h3>
          <button class="closeBtn" type="button" onclick="closeProductModal()" aria-label="Close">x</button>
        </div>
      <summary>${tr('new_product_summary')}</summary>
      <form class="form modalForm" id="newProductForm">
        <label class="fileField">${tr('photo_field')}
          <input name="photo" type="file" accept="image/*">
        </label>
        <input name="name" placeholder="${tr('name_placeholder')}" required>
        <input name="category" placeholder="${tr('category_placeholder')}">
        <input name="buyPrice" type="number" placeholder="${tr('buy_price_placeholder')}" required>
        <input name="qty" type="number" placeholder="${tr('qty_placeholder')}" required>
        <button class="actionSubmit createAction">${tr('create_btn')}</button>
      </form>
      </div>
    </div>
    <input id="arriveSearch" class="search" value="${escapeHtml(productSearch.arrive)}" oninput="setSearch('arrive', this.value)" placeholder="${tr('search_placeholder')}">
    <div id="arriveProducts" class="productGrid">${productCards('arrive', productSearch.arrive)}</div>
    ${actionModalMarkup('arrive')}
    ${arrivalsTable()}
  `;

  newProductForm.onsubmit = async e => {
    e.preventDefault();
    if (newProductForm.dataset.submitting === 'true') return;
    newProductForm.dataset.submitting = 'true';
    const submitBtn = e.target.querySelector('.actionSubmit');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const fd = new FormData(e.target);
      const f = Object.fromEntries(fd);
      const sku = makeSku(f.name);

      if (+f.qty <= 0 || +f.buyPrice < 0) {
        showNotice('Введите корректное количество и цену');
        return;
      }

      const photo = await fileToData(fd.get('photo'));

      db.products.push({ sku, name: f.name, category: f.category, photo, updatedAt: nowMs() });
      db.arrivals.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku, qty: +f.qty, buyPrice: +f.buyPrice, updatedAt: nowMs() });
      productModalOpen = false;
      save('Создание товара', `${f.name}: приход ${+f.qty} шт., закуп ${money(+f.buyPrice)}`);
    } finally {
      newProductForm.dataset.submitting = 'false';
      if (submitBtn) submitBtn.disabled = false;
    }
  };

  const actionArriveForm = document.getElementById('actionArriveForm');
  if (actionArriveForm) actionArriveForm.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const f = Object.fromEntries(fd);

    if (+f.qty <= 0 || +f.buyPrice < 0) {
      showNotice('Введите корректное количество и цену');
      return;
    }

    db.arrivals.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku: f.sku, qty: +f.qty, buyPrice: +f.buyPrice, updatedAt: nowMs() });
    actionModal = null;
    save('Приход товара', `${productName(f.sku)}: ${+f.qty} шт., ${money(+f.buyPrice)}`);
  };
}

function renderSales() {
  sales.innerHTML = `
    <h2>${tr('tab_sales')}</h2>
    <input id="saleSearch" class="search" value="${escapeHtml(productSearch.sale)}" oninput="setSearch('sale', this.value)" placeholder="${tr('search_placeholder')}">
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
      showNotice('Введите корректное количество и цену');
      return;
    }

    if (+f.qty > stockOf(f.sku)) {
      showNotice(`На складе доступно только ${stockOf(f.sku)}`);
      return;
    }

    db.sales.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku: f.sku, qty: +f.qty, sellPrice: +f.sellPrice, payment: f.payment, costPrice: avgCost(f.sku), updatedAt: nowMs() });
    actionModal = null;
    save('Продажа', `${productName(f.sku)}: ${+f.qty} шт., ${money(+f.sellPrice)}, ${f.payment}`);
  };
}

function renderReturns() {
  returns.innerHTML = `
    <h2>${tr('tab_returns')}</h2>
    <input id="returnSearch" class="search" value="${escapeHtml(productSearch.return)}" oninput="setSearch('return', this.value)" placeholder="${tr('search_placeholder')}">
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
      showNotice('Введите корректное количество и сумму');
      return;
    }

    if (+f.qty > canReturnQty(f.sku)) {
      showNotice(`Можно вернуть не больше ${canReturnQty(f.sku)}`);
      return;
    }

    db.returns.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku: f.sku, qty: +f.qty, refundAmount: +f.refundAmount, costPrice: avgSoldCost(f.sku), updatedAt: nowMs() });
    actionModal = null;
    save('Возврат', `${productName(f.sku)}: ${+f.qty} шт., ${money(+f.refundAmount)}`);
  };
}

function renderExpenses() {
  expenses.innerHTML = `
    <h2>${tr('tab_expenses')}</h2>
    <form class="form" id="expenseForm">
      <select name="category">
        <option>${tr('expense_cat_rent')}</option>
        <option>${tr('expense_cat_salary')}</option>
        <option>${tr('expense_cat_food')}</option>
        <option>${tr('expense_cat_transport')}</option>
        <option>${tr('expense_cat_other')}</option>
      </select>
      <input name="amount" type="number" placeholder="${tr('amount_placeholder')}" required>
      <input name="comment" placeholder="${tr('col_comment')}">
      <button>${tr('save_btn')}</button>
    </form>
    ${expensesTable()}
  `;

  expenseForm.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const f = Object.fromEntries(fd);

    if (+f.amount < 0) {
      showNotice('Введите корректную сумму');
      return;
    }

    const comment = String(f.comment || '').trim();
    db.expenses.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), category: f.category, amount: +f.amount, comment, updatedAt: nowMs() });
    save('Расход', `${f.category}: ${money(+f.amount)}${comment ? `, ${comment}` : ''}`);
  };
}

function renderStock() {
  const editProduct = db.products.find(p => p.sku === productEditSku);

  stock.innerHTML = `
    <h2>${tr('tab_stock')}</h2>
    <table class="stockTable compactTable">
      <tr>
        <th>${tr('col_photo')}</th>
        <th>${tr('col_product')}</th>
        <th>${tr('col_category')}</th>
        <th>${tr('col_stock')}</th>
        <th>${tr('col_avg_cost')}</th>
        <th></th>
      </tr>
      ${db.products.map(p => `
        <tr>
          <td><div class="stockPhoto photo">${photoMarkup(p.photo)}</div></td>
          <td>
            <div class="stockProduct">
              <b>${escapeHtml(p.name)}</b>
              <span>${escapeHtml(p.sku)}</span>
            </div>
          </td>
          <td>${escapeHtml(p.category || '')}</td>
          <td>${stockOf(p.sku)}</td>
          <td>${money(avgCost(p.sku))}</td>
          <td class="rowActions">
            <button class="editProductBtn" data-sku="${escapeHtml(p.sku)}" onclick="openProductEditFromButton(this)">${tr('edit_btn')}</button>
          </td>
        </tr>
      `).join('')}
    </table>
    ${editProduct ? `
      <div id="productEditModal" class="modal show" onclick="if (event.target === this) closeProductEditModal()">
        <div class="modalPanel userModalPanel" role="dialog" aria-modal="true" aria-labelledby="productEditTitle">
          <div class="modalHeader">
            <h3 id="productEditTitle">${tr('edit_product_title')}</h3>
            <button class="closeBtn" type="button" onclick="closeProductEditModal()" aria-label="Close">x</button>
          </div>
          <div class="modalProduct">
            <div class="photo">${photoMarkup(editProduct.photo)}</div>
            <div>
              <h4>${escapeHtml(editProduct.name)}</h4>
              <div class="muted">${escapeHtml(editProduct.sku)}</div>
              <div class="muted">${tr('stock_left')}: ${stockOf(editProduct.sku)}</div>
            </div>
          </div>
          <form class="form modalForm productEditForm" id="productEditForm">
            <label class="fieldLabel">${tr('product_name_label')}
              <input name="name" value="${escapeHtml(editProduct.name)}" placeholder="Например: Футболка" required>
            </label>
            <label class="fieldLabel">Категория
              <input name="category" value="${escapeHtml(editProduct.category || '')}" placeholder="Например: Одежда">
            </label>
            <label class="fieldLabel fileField">${tr('product_photo_label')}
              <span>Можно добавить сейчас или заменить старое фото</span>
              <input name="photo" type="file" accept="image/*">
            </label>
            <button class="actionSubmit createAction" type="submit">${tr('save_product_btn')}</button>
          </form>
        </div>
      </div>
    ` : ''}
  `;

  const productEditForm = document.getElementById('productEditForm');
  if (productEditForm) productEditForm.onsubmit = async e => {
    e.preventDefault();
    if (productEditForm.dataset.submitting === 'true') return;
    productEditForm.dataset.submitting = 'true';
    const submitBtn = e.target.querySelector('.actionSubmit');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const product = db.products.find(p => p.sku === productEditSku);
      if (!product) return;

      const fd = new FormData(e.target);
      const name = String(fd.get('name') || '').trim();
      const category = String(fd.get('category') || '').trim();

      if (!name) {
        showNotice('Введите название товара');
        return;
      }

      const photoFile = fd.get('photo');
      const newPhoto = photoFile && photoFile.size ? await fileToData(photoFile) : '';
      if (photoFile && photoFile.size && !newPhoto) return;

      product.name = name;
      product.category = category;
      if (newPhoto) product.photo = newPhoto;
      product.updatedAt = nowMs();

      productEditSku = '';
      save('Изменение товара', `${name}: карточка товара обновлена${newPhoto ? ', фото обновлено' : ''}`);
    } finally {
      productEditForm.dataset.submitting = 'false';
      if (submitBtn) submitBtn.disabled = false;
    }
  };
}

function renderReport() {
  const t = totals(selectedPeriod);
  const inventory = inventoryTotals();

  report.innerHTML = `
    <h2>${tr('tab_report')}</h2>
    <button class="topbtn reportExport" onclick="exportData()">${tr('download_data')}</button>
    <div class="periods">
      <button onclick="setPeriod('today')" class="${selectedPeriod === 'today' ? 'active' : ''}">${tr('period_today')}</button>
      <button onclick="setPeriod('week')" class="${selectedPeriod === 'week' ? 'active' : ''}">${tr('period_week')}</button>
      <button onclick="setPeriod('month')" class="${selectedPeriod === 'month' ? 'active' : ''}">${tr('period_month')}</button>
      <button onclick="setPeriod('quarter')" class="${selectedPeriod === 'quarter' ? 'active' : ''}">${tr('period_quarter')}</button>
      <button onclick="setPeriod('year')" class="${selectedPeriod === 'year' ? 'active' : ''}">${tr('period_year')}</button>
      <button onclick="setPeriod('all')" class="${selectedPeriod === 'all' ? 'active' : ''}">${tr('period_all')}</button>
      <button onclick="setPeriod('custom')" class="${selectedPeriod === 'custom' ? 'active' : ''}">${tr('period_custom')}</button>
    </div>
    <div class="${selectedPeriod === 'custom' ? 'form' : 'hidden'}">
      <input type="date" id="dateFrom" onchange="renderReport()">
      <input type="date" id="dateTo" onchange="renderReport()">
    </div>
    <div class="grid stats">
      <div class="card"><span>${tr('rep_revenue')}</span><b>${money(t.revenue)}</b></div>
      <div class="card"><span>${tr('rep_cost')}</span><b>${money(t.cost)}</b></div>
      <div class="card"><span>${tr('rep_gross')}</span><b>${money(t.gross)}</b></div>
      <div class="card"><span>${tr('rep_expenses')}</span><b>${money(t.expenses)}</b></div>
      <div class="card"><span>${tr('rep_returns')}</span><b>${money(t.returns)}</b></div>
      <div class="card"><span>${tr('rep_net')}</span><b>${money(t.net)}</b></div>
      <div class="card"><span>${tr('rep_sold')}</span><b>${t.qty}</b></div>
      <div class="card"><span>${tr('rep_avg')}</span><b>${money(t.avg)}</b></div>
      <div class="card"><span>${tr('rep_in_stock')}</span><b>${inventory.qty}</b></div>
      <div class="card"><span>${tr('rep_stock_value')}</span><b>${money(inventory.value)}</b></div>
    </div>
    <div class="grid stats">
      <div class="card"><span>${tr('rep_cash')}</span><b>${money(t.pay.cash)}</b></div>
      <div class="card"><span>${tr('rep_card')}</span><b>${money(t.pay.card)}</b></div>
      <div class="card"><span>${tr('rep_transfer')}</span><b>${money(t.pay.transfer)}</b></div>
      <div class="card"><span>${tr('rep_debt')}</span><b>${money(t.pay.debt)}</b></div>
    </div>
  `;
}

function renderHistory() {
  const historyPage = document.getElementById('history');
  if (!historyPage) return;

  historyPage.innerHTML = `
    <h2>${tr('hist_title')}</h2>
    <table class="changeHistoryTable">
      <tr><th>${tr('hist_date')}</th><th>${tr('hist_user')}</th><th>${tr('hist_action')}</th><th>${tr('hist_details')}</th></tr>
      ${changeHistory.map(x => `
        <tr>
          <td>${escapeHtml(new Date(x.created_at).toLocaleString('ru-RU'))}</td>
          <td>${escapeHtml(x.user_email || '')}</td>
          <td>${escapeHtml(x.action || '')}</td>
          <td>${escapeHtml(x.details || '')}</td>
        </tr>
      `).join('') || `<tr><td colspan="4">${tr('hist_empty')}</td></tr>`}
    </table>
  `;
}

function setPeriod(p) {
  selectedPeriod = p;
  renderReport();
}

function openTab(id) {
  const tab = document.querySelector(`[data-id="${id}"]`);
  if (tab) tab.click();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeNotice();
  if (e.key === 'Escape' && userModalOpen) closeUserModal();
  if (e.key === 'Escape' && productModalOpen) closeProductModal();
  if (e.key === 'Escape' && productEditSku) closeProductEditModal();
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
  renderHistory();
  hydrateProductPhotos();
}

async function initApp() {
  localStorage.removeItem(SESSION_KEY);
  const authForm = document.getElementById('authForm');
  const recoveryForm = document.getElementById('recoveryForm');
  const passwordResetForm = document.getElementById('passwordResetForm');

  if (authForm) authForm.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    loginUser(String(fd.get('email') || '').trim(), String(fd.get('password') || ''));
  };

  if (recoveryForm) recoveryForm.onsubmit = e => {
    e.preventDefault();
    submitRecoveryEmail();
  };

  if (passwordResetForm) passwordResetForm.onsubmit = e => {
    e.preventDefault();
    submitPasswordReset();
  };

  const createUserForm = document.getElementById('createUserForm');
  if (createUserForm) createUserForm.onsubmit = e => {
    e.preventDefault();
    signUpUser();
  };

  if (preparePasswordResetFromUrl()) {
    setAuthView(false);
    return;
  }

  if (isSessionExpired(authSession)) {
    await refreshAuthSession();
  }

  if (currentUser) {
    setAuthView(true);
    db = normalizeDb(JSON.parse(localStorage.getItem(userDbKey()) || '{}'));
    navRender();
    render();
    await loadCurrentRole();
    setAuthView(true);
    loadFromSupabase();
    loadChangeHistory();
  } else {
    setAuthView(false);
  }
}

initApp();
