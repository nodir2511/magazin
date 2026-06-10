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
