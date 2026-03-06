const TOKEN_KEY = "token";
const USER_KEY = "uop_user";
const WORKSPACE_ID_KEY = "uop_workspace_id";

export function saveAuth({ token, user }) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function loadToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function loadUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function saveWorkspaceId(id) {
    if (!id) localStorage.removeItem(WORKSPACE_ID_KEY);
    else localStorage.setItem(WORKSPACE_ID_KEY, String(id));
}

export function loadWorkspaceId() {
    const raw = localStorage.getItem(WORKSPACE_ID_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
}

