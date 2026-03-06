import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/app.js";
import { clearAuth, loadToken, loadUser, loadWorkspaceId, saveAuth, saveWorkspaceId } from "../lib/storage.js";
import toast from "react-hot-toast";

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [token, setToken] = useState(loadToken());
    const [user, setUser] = useState(loadUser());
    const [workspaces, setWorkspaces] = useState([]);
    const [workspaceId, setWorkspaceId] = useState(loadWorkspaceId());
    const [workspace, setWorkspace] = useState(null);
    const [role, setRole] = useState(null);
    const [setup, setSetup] = useState(null);
    const [setupLoading, setSetupLoading] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isAuthed = !!token;
    const isOwner = role === "OWNER";
    const onboardingStep = workspace?.onboardingStep || 1;
    const isActive = !!workspace?.active;

    async function refreshWorkspaces(nextToken = token) {
        if (!nextToken) return;
        const data = await api.get("/api/workspaces");
        setWorkspaces(data.data.workspaces || []);
        return data.data.workspaces || [];
    }


    async function selectWorkspace(id) {
        setWorkspaceId(id);
        saveWorkspaceId(id);

        if (!token || !id) return;

        try {
            setSetupLoading(true);

            const data = await api.get(
                `/api/workspaces/${id}/setup`,
                { headers: { "x-workspace-id": id } }
            );

            setWorkspace(data.data.workspace);
            setRole(data.data.role);
            setSetup(data.data.setup);

        } finally {
            setSetupLoading(false);
        }
    }

    console.log("Workspace after setup:", workspace);

    async function refreshSetup() {
        if (!token || !workspaceId) return;

        try {
            setSetupLoading(true);

            const data = await api.get(
                `/api/workspaces/${workspaceId}/setup`,
                { headers: { "x-workspace-id": workspaceId } }
            );

            console.log("SETUP RESPONSE WORKSPACE:", data.data.workspace);

            setWorkspace(data.data.workspace);
            setRole(data.data.role);
            setSetup(data.data.setup);

        } finally {
            setSetupLoading(false);
        }
    }

    async function login(email, password) {
        setLoading(true);
        try {
            const data = await api.post("/api/auth/login", { email, password });
            setToken(data.data.token);
            setUser(data.data.user);
            saveAuth({ token: data.data.token, user: data.data.user });
            const ws = await refreshWorkspaces(data.data.token);
            if (ws?.length && !workspaceId) {
                const first = ws[0].id;
                await selectWorkspace(first);
            }
            toast.success("Login successful");
            return true;
        } catch (e) {
            toast.error(e.message || "Login failed");
            return false;
        } finally {
            setLoading(false);
        }
    }

    async function signup(name, email, password) {
        setLoading(true);
        try {
            const data = await api.post("/api/auth/register", { name, email, password });
            console.log(data)
            setToken(data.data.token);
            setUser(data.data.user);
            saveAuth({ token: data.data.token, user: data.data.user });
            await refreshWorkspaces(data.data.token);
            toast.success("Account created successfully");
            return true;
        } catch (e) {
            toast.error(e.message || "Signup failed");
            return false;
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        setToken(null);
        setUser(null);
        setWorkspaces([]);
        setWorkspaceId(null);
        setWorkspace(null);
        setRole(null);
        setSetup(null);
        clearAuth();
        saveWorkspaceId(null);
        toast.success("You’ve successfully logged out!")
    }

    async function createWorkspace(payload) {
        if (!token) throw new Error("Not logged in");
        const data = await api.post("/api/workspaces", payload);
        await refreshWorkspaces(token);
        if (data.data?.workspace?.id) await selectWorkspace(data.data.workspace.id);
        return data.data.workspace;
    }

    useEffect(() => {
        (async () => {
            if (!token) {
                setSetupLoading(false);
                return;
            }

            try {
                setSetupLoading(true);

                const ws = await refreshWorkspaces(token);
                const id = workspaceId || ws?.[0]?.id || null;

                if (id) {
                    await selectWorkspace(id);
                }
            } catch (e) {
                logout();
            } finally {
                setSetupLoading(false);
            }
        })();
    }, []);

    const value = useMemo(
        () => ({
            token,
            user,
            workspaces,
            workspaceId,
            workspace,
            role,
            setup,
            isAuthed,
            isOwner,
            onboardingStep,
            isActive,
            loading,
            setLoading,
            error,
            setError,
            login,
            signup,
            setUser,
            logout,
            createWorkspace,
            selectWorkspace,
            refreshWorkspaces,
            setupLoading,
            refreshSetup,
            saveAuth,
            setRole,
            setToken,

        }),
        [token, user, workspaces, workspaceId, workspace, role, setup, isAuthed, isOwner, onboardingStep, isActive, loading, error],
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used within AppProvider");
    return ctx;
}

