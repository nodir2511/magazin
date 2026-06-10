const DB_KEY = 'store_business_final_v1';
const SESSION_KEY = 'store_supabase_session_v1';
const CHANGES_KEY = 'store_changes_history_v1';
const ACTIVE_TAB_KEY = 'store_active_tab_v1';
const LANG_KEY = 'store_lang_v1';

let currentLang = localStorage.getItem(LANG_KEY) || 'tj';

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
    low_stock: 'Заканчивается товаров',
    export_csv: 'Excel (CSV)', print_btn: 'Печать',
    ignore_low_stock: 'Не следить за остатком (товар снят с продажи)',
    sale_date: 'Дата продажи',
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
    low_stock: 'Мол кам мондааст',
    export_csv: 'Excel (CSV)', print_btn: 'Чоп',
    ignore_low_stock: 'Боқимондаро назорат накардан (мол аз фурӯш бароварда шуд)',
    sale_date: 'Санаи фурӯш',
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



function cleanValue(value, limit = 200) {
    return String(value == null ? '' : value).slice(0, limit);
}

function cleanNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
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

// Превращает ключ ГГГГ-ММ-ДД в отображаемую дату; локальное время, без сдвига часового пояса
function displayDateFromKey(key) {
    if (!key) return todayDisplay();
    const [y, m, d] = String(key).split('-').map(Number);
    if (!y || !m || !d) return todayDisplay();
    return new Date(y, m - 1, d).toLocaleDateString('ru-RU');
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

// Ячейка CSV: экранируем кавычки/разделители, разделитель — ; (для Excel в ру-локали)
function csvCell(value) {
    const s = String(value == null ? '' : value);
    return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Выгрузка операций за выбранный период единой таблицей
function exportCSV() {
    const rows = [['Дата', 'Тип', 'Товар/Категория', 'Кол-во', 'Цена', 'Сумма', 'Оплата/Комментарий']];

    db.arrivals.filter(x => inPeriod(x, selectedPeriod)).forEach(x => {
        rows.push([x.date, 'Приход', productName(x.sku), x.qty, x.buyPrice, x.qty * x.buyPrice, '']);
    });
    db.sales.filter(x => inPeriod(x, selectedPeriod)).forEach(x => {
        rows.push([x.date, 'Продажа', productName(x.sku), x.qty, x.sellPrice, x.qty * x.sellPrice, x.payment || '']);
    });
    db.returns.filter(x => inPeriod(x, selectedPeriod)).forEach(x => {
        rows.push([x.date, 'Возврат', productName(x.sku), x.qty, x.refundAmount, x.refundAmount, '']);
    });
    db.expenses.filter(x => inPeriod(x, selectedPeriod)).forEach(x => {
        rows.push([x.date, 'Расход', x.category, '', x.amount, x.amount, x.comment || '']);
    });

    if (rows.length === 1) {
        showNotice('За выбранный период нет операций для экспорта.');
        return;
    }

    const csv = rows.map(r => r.map(csvCell).join(';')).join('\r\n');
    // BOM, чтобы Excel правильно открыл кириллицу в UTF-8
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `otchet_${selectedPeriod}_${todayKey()}.csv`;
    a.click();
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

function renderDashboard() {
  const td = totals('today');
  const all = totals('all');
  const lowStock = db.products.filter(p => !p.ignoreLowStock && stockOf(p.sku) <= 1).length;

  dashboard.innerHTML = `
    ${lowStock ? `<button class="lowStockAlert" onclick="openTab('stock')">⚠ ${tr('low_stock')}: ${lowStock}</button>` : ''}
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

    const saleKey = f.saleDate && f.saleDate <= todayKey() ? f.saleDate : todayKey();
    db.sales.push({ id: Date.now(), date: displayDateFromKey(saleKey), dateKey: saleKey, sku: f.sku, qty: +f.qty, sellPrice: +f.sellPrice, payment: f.payment, costPrice: avgCost(f.sku), updatedAt: nowMs() });
    actionModal = null;
    save('Продажа', `${productName(f.sku)}: ${+f.qty} шт., ${money(+f.sellPrice)}, ${f.payment}${saleKey !== todayKey() ? `, дата ${displayDateFromKey(saleKey)}` : ''}`);
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
          <td><span class="stockQty ${p.ignoreLowStock ? 'stockMuted' : stockClass(stockOf(p.sku))}">${stockOf(p.sku)}</span></td>
          <td>${money(avgCost(p.sku))}</td>
          <td class="rowActions">
            <button class="editProductBtn" data-sku="${escapeHtml(p.sku)}" onclick="openProductEditFromButton(this)">${tr('edit_btn')}</button>
            ${currentRole === 'admin' ? `<button class="deleteProductBtn" data-sku="${escapeHtml(p.sku)}" onclick="deleteProduct(this.dataset.sku)">${tr('delete_btn')}</button>` : ''}
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
            <label class="checkboxField">
              <input name="ignoreLowStock" type="checkbox" ${editProduct.ignoreLowStock ? 'checked' : ''}>
              ${tr('ignore_low_stock')}
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
      product.ignoreLowStock = fd.get('ignoreLowStock') !== null;
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
    <div class="reportActions">
      <button class="topbtn reportExport" onclick="exportCSV()">${tr('export_csv')}</button>
      <button class="topbtn reportExport" onclick="window.print()">${tr('print_btn')}</button>
      <button class="topbtn reportExport" onclick="exportData()">${tr('download_data')}</button>
    </div>
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
