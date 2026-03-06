import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

export function RequireAuth() {
    const { isAuthed } = useApp();
    const loc = useLocation();
    if (!isAuthed) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
    return <Outlet />;
}

export function RequireWorkspace() {
    const { workspaceId } = useApp();
    if (!workspaceId) return <Navigate to="/app/workspaces" replace />;
    return <Outlet />;
}


export function RequireActiveOrOnboarding() {
    const { workspace, isActive, setupLoading } = useApp();

    console.log("GUARD:", {
        setupLoading,
        workspaceActive: workspace?.active,
        isActive
    });

    if (setupLoading) return null;

    if (!workspace) return <Navigate to="/app/workspaces" replace />;

    if (!isActive) return <Navigate to="/app/onboarding" replace />;

    return <Outlet />;
}
