import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "https://unifiedopshakathon-server.onrender.com";



export class ApiError extends Error {
    constructor(message, status, payload) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.payload = payload;
    }
}


async function parseJsonSafe(res) {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return { raw: text };
    }
}

export async function apiFetch(path, { method = "GET", token, workspaceId, body } = {}) {
    const headers = { "Content-Type": "application/json" };

    // Use passed token, or fall back to localStorage (same as axios interceptor)
    const resolvedToken = token || localStorage.getItem("token");
    const resolvedWorkspaceId = workspaceId || localStorage.getItem("uop_workspace_id");

    if (resolvedToken) headers.Authorization = `Bearer ${resolvedToken}`;
    if (resolvedWorkspaceId) headers["x-workspace-id"] = String(resolvedWorkspaceId);

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const payload = await parseJsonSafe(res);
    if (!res.ok) {
        const msg = payload?.error?.message || payload?.error || res.statusText || "Request failed";
        throw new ApiError(msg, res.status, payload);
    }
    return payload;
}

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        const workspaceId = localStorage.getItem("uop_workspace_id");

        if (token) config.headers.Authorization = `Bearer ${token}`;
        if (workspaceId) config.headers["x-workspace-id"] = workspaceId;

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
