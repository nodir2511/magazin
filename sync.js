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
        ignoreLowStock: Boolean(p && p.ignoreLowStock),
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

function setSyncStatus(text, state = '') {
    const badge = document.getElementById('syncStatus');
    if (!badge) return;
    badge.textContent = text;
    badge.className = `syncStatus ${state}`.trim();
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
