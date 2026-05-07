const DB_KEY = 'store_business_final_v1';
const SESSION_KEY = 'store_supabase_session_v1';
const CHANGES_KEY = 'store_changes_history_v1';
const DEFAULT_DB = { products: [], arrivals: [], sales: [], returns: [], expenses: [] };
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
let actionModal = null;
let userModalOpen = false;
let productSearch = { arrive: '', sale: '', return: '' };
let syncChain = Promise.resolve();
const photoUrlCache = new Map();
let recoveryAccessToken = '';

const tabs = [
    ['dashboard', 'Главная (Асосӣ)'],
    ['arrived', 'Товар пришёл (Бор омад)'],
    ['sales', 'Продал (Фурухт)'],
    ['returns', 'Возврат (Бозгашт)'],
    ['expenses', 'Расход (Харочот)'],
    ['stock', 'Склад (Анбор)'],
    ['report', 'Отчёт (Ҳисобот)']
];

function readLocalDb() {
    try {
        return normalizeDb(JSON.parse(localStorage.getItem(DB_KEY) || '{}'));
    } catch (e) {
        return { ...DEFAULT_DB };
    }
}

function normalizeDb(value) {
    const data = value && typeof value === 'object' ? value : {};
    const products = Array.isArray(data.products) ? data.products.map(p => ({
        ...p,
        photo: isPhotoPath(p && p.photo) ? p.photo : ''
    })) : [];

    return {
        products,
        arrivals: Array.isArray(data.arrivals) ? data.arrivals : [],
        sales: Array.isArray(data.sales) ? data.sales : [],
        returns: Array.isArray(data.returns) ? data.returns : [],
        expenses: Array.isArray(data.expenses) ? data.expenses : []
    };
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

function save(action = 'Изменение', details = '') {
    localStorage.setItem(userDbKey(), JSON.stringify(db));
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
    nav.innerHTML = [...tabs, ['history', 'История']].map(([id, name], i) => `<button class="${i === 0 ? 'active' : ''}" data-id="${id}">${name}</button>`).join('');

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
        showNotice('Не удалось создать пользователя. Проверьте, что Edge Function create-user опубликована.');
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

    authSession = null;
    currentUser = null;
    currentRole = null;
    db = { ...DEFAULT_DB };
    sessionStorage.removeItem(SESSION_KEY);
    setAuthView(false);
}

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
            supabaseEndpoint(`?id=eq.${encodeURIComponent(SHARED_STORE_ID)}&select=data`),
            { headers: supabaseHeaders({ Accept: 'application/json' }) }
        );

        if (!response.ok) throw new Error(`Supabase load failed: ${response.status}`);

        const rows = await response.json();

        if (rows.length && rows[0].data) {
            db = normalizeDb(rows[0].data);
            localStorage.setItem(userDbKey(), JSON.stringify(db));
            render();
            setSyncStatus('Supabase', 'online');
            return;
        }

        await syncToSupabase('', '', true);
        setSyncStatus('Supabase', 'online');
    } catch (e) {
        setSyncStatus('Оффлайн', 'offline');
        showNotice('Не удалось загрузить данные из Supabase. Приложение пока работает с локальными данными.');
    }
}

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

            if (!response.ok) throw new Error(`Supabase save failed: ${response.status}`);
            if (action) rememberChange({
                created_at: new Date().toISOString(),
                user_email: currentUser ? currentUser.email : '',
                action,
                details
            });
            loadChangeHistory();
            setSyncStatus(force ? 'Supabase' : 'Сохранено', 'online');
        })
        .catch(() => {
            setSyncStatus('Оффлайн', 'offline');
            showNotice('Данные сохранены локально, но не отправились в Supabase. Проверьте интернет и настройки Supabase.');
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
        .filter(p => (p.name + p.category + p.sku).toLowerCase().includes(query))
        .map(p => `
      <div class="product" onclick="openActionModal('${mode}','${escapeJsString(p.sku)}')">
        <div class="photo">${photoMarkup(p.photo)}</div>
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
  const nameInput = document.querySelector('#newProductModal input[name="name"]');
  if (nameInput) nameInput.focus();
}

function closeProductModal() {
  productModalOpen = false;
  renderArrived();
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
          <div class="photo">${photoMarkup(product.photo)}</div>
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
  save('Изменение возврата', `${productName(item.sku)}: ${qty} шт., ${money(refundAmount)}`);
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
  save('Изменение расхода', `${category}: ${money(amount)}`);
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
      showNotice('Введите корректное количество и цену');
      return;
    }

    db.products.push({ sku, name: f.name, category: f.category, buyPrice: +f.buyPrice, photo });
    db.arrivals.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku, qty: +f.qty, buyPrice: +f.buyPrice });
    productModalOpen = false;
    save('Создание товара', `${f.name}: приход ${+f.qty} шт., закуп ${money(+f.buyPrice)}`);
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

    db.arrivals.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku: f.sku, qty: +f.qty, buyPrice: +f.buyPrice });
    actionModal = null;
    save('Приход товара', `${productName(f.sku)}: ${+f.qty} шт., ${money(+f.buyPrice)}`);
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
      showNotice('Введите корректное количество и цену');
      return;
    }

    if (+f.qty > stockOf(f.sku)) {
      showNotice(`На складе доступно только ${stockOf(f.sku)}`);
      return;
    }

    db.sales.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku: f.sku, qty: +f.qty, sellPrice: +f.sellPrice, payment: f.payment, costPrice: avgCost(f.sku) });
    actionModal = null;
    save('Продажа', `${productName(f.sku)}: ${+f.qty} шт., ${money(+f.sellPrice)}, ${f.payment}`);
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
      showNotice('Введите корректное количество и сумму');
      return;
    }

    if (+f.qty > canReturnQty(f.sku)) {
      showNotice(`Можно вернуть не больше ${canReturnQty(f.sku)}`);
      return;
    }

    db.returns.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), sku: f.sku, qty: +f.qty, refundAmount: +f.refundAmount, costPrice: avgSoldCost(f.sku) });
    actionModal = null;
    save('Возврат', `${productName(f.sku)}: ${+f.qty} шт., ${money(+f.refundAmount)}`);
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
      showNotice('Введите корректную сумму');
      return;
    }

    db.expenses.push({ id: Date.now(), date: todayDisplay(), dateKey: todayKey(), category: f.category, amount: +f.amount });
    save('Расход', `${f.category}: ${money(+f.amount)}`);
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

function renderHistory() {
  const historyPage = document.getElementById('history');
  if (!historyPage) return;

  historyPage.innerHTML = `
    <h2>История изменений</h2>
    <table>
      <tr><th>Дата</th><th>Пользователь</th><th>Действие</th><th>Детали</th></tr>
      ${changeHistory.map(x => `
        <tr>
          <td>${escapeHtml(new Date(x.created_at).toLocaleString('ru-RU'))}</td>
          <td>${escapeHtml(x.user_email || '')}</td>
          <td>${escapeHtml(x.action || '')}</td>
          <td>${escapeHtml(x.details || '')}</td>
        </tr>
      `).join('') || '<tr><td colspan="4">Пока изменений нет</td></tr>'}
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
