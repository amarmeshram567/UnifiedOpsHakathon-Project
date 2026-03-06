import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import {
    Layers,
    Menu,
    LayoutDashboard,
    Mail,
    Calendar,
    FileText,
    Package,
    Settings,
    Building,
    LogOut,
    ChevronLeft,
    ChevronRight,
    CircleUserRoundIcon,
    ExternalLink,
    Users,
} from "lucide-react";

function NavItem({ to, icon: Icon, children, collapsed, onClick }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2 text-sm font-mono tracking-wide transition-all duration-150 relative
                ${isActive
                    ? "bg-yellow-300/10 text-yellow-300 border-l-2 border-yellow-300"
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/60 border-l-2 border-transparent"
                }`
            }
            title={collapsed ? String(children) : undefined}
        >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
                <span className="text-xs uppercase tracking-widest">{children}</span>
            )}
        </NavLink>
    );
}

export default function AppShell({ children }) {
    const nav = useNavigate();
    const {
        workspace,
        role,
        workspaces,
        workspaceId,
        selectWorkspace,
        logout,
        onboardingStep,
        isActive,
        user,
    } = useApp();

    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [collapsed, setCollapsed] = React.useState(false);
    const [userMenu, setUserMenu] = React.useState(false);
    const userMenuRef = React.useRef(null);

    const closeMobile = () => setMobileOpen(false);

    // Close user menu on outside click
    React.useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">

            {/* HEADER */}
            <header className="sticky top-0 z-30 bg-neutral-900 border-b border-neutral-800 px-4 py-3">
                <div className="flex items-center justify-between max-w-full">

                    {/* LEFT */}
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden text-neutral-400 hover:text-neutral-100 transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <Link to="/app/dashboard" className="flex items-center gap-2.5">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
                                <span className="font-mono font-semibold text-sm tracking-wide text-neutral-100">
                                    Unified<span className="text-yellow-300">Ops</span>
                                </span>
                            </div>
                        </Link>

                        {workspace && (
                            <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-neutral-800">
                                <span className="text-neutral-600 text-xs font-mono uppercase tracking-widest">Workspace</span>
                                <select
                                    className="bg-neutral-800 border border-neutral-700 text-neutral-100 font-mono text-xs px-2.5 py-1.5 focus:outline-none focus:border-yellow-300/50 transition-colors"
                                    value={workspaceId || ""}
                                    onChange={(e) => selectWorkspace(Number(e.target.value))}
                                >
                                    {(workspaces || []).map((w) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                                <span className={`text-xs font-mono px-2 py-0.5 border ${role === "OWNER"
                                    ? "border-yellow-300/30 bg-yellow-300/10 text-yellow-300"
                                    : "border-neutral-700 bg-neutral-800 text-neutral-400"
                                    }`}>
                                    {role}
                                </span>
                                <span className={`text-xs font-mono px-2 py-0.5 border ${isActive
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                    }`}>
                                    {isActive ? "ACTIVE" : `ONBOARD ${onboardingStep}/8`}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* RIGHT — user menu */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenu(!userMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 hover:border-neutral-600 transition-all duration-150"
                        >
                            <div className="w-5 h-5 bg-yellow-300/10 border border-yellow-300/30 flex items-center justify-center">
                                <span className="text-yellow-300 text-xs font-mono font-bold">
                                    {user?.name?.[0]?.toUpperCase() || "?"}
                                </span>
                            </div>
                            <span className="hidden sm:block text-xs font-mono text-neutral-400 max-w-[120px] truncate capitalize">
                                {user?.name || "Account"}
                            </span>
                            <ChevronRight className={`h-3 w-3 text-neutral-600 transition-transform duration-150 ${userMenu ? "rotate-90" : ""}`} />
                        </button>

                        {userMenu && (
                            <div className="absolute right-0 mt-1 w-52 bg-neutral-900 border border-neutral-800 shadow-2xl z-50">
                                <div className="px-4 py-3 border-b border-neutral-800">
                                    <p className="font-mono font-semibold text-sm text-neutral-100 truncate capitalize">
                                        {user?.name || "Unknown"}
                                    </p>
                                    <p className="font-mono text-xs text-neutral-500 truncate mt-0.5">
                                        {user?.email || "Unknown"}
                                    </p>
                                </div>
                                <button
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-mono text-neutral-400 hover:text-red-400 hover:bg-red-400/5 transition-all"
                                    onClick={() => { logout(); nav("/"); }}
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span className="uppercase tracking-widest">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
                    onClick={closeMobile}
                />
            )}

            {/* BODY */}
            <div className="flex flex-1 overflow-hidden">

                {/* SIDEBAR */}
                <aside className={`
                    fixed md:static z-20 top-0 left-0 h-screen md:h-auto flex flex-col
                    ${collapsed ? "w-[56px]" : "w-[220px]"}
                    bg-neutral-900 border-r border-neutral-800 transition-all duration-200
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0
                `}>

                    {/* Collapse toggle */}
                    <div className={`flex ${collapsed ? "justify-center" : "justify-end"} p-3 border-b border-neutral-800`}>
                        <button
                            className="hidden md:flex items-center justify-center w-6 h-6 text-neutral-600 hover:text-neutral-300 transition-colors"
                            onClick={() => setCollapsed(!collapsed)}
                        >
                            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4 space-y-6">

                        {/* OPERATE */}
                        <div>
                            {!collapsed && (
                                <div className="px-4 mb-2 text-xs font-mono font-semibold uppercase tracking-widest text-neutral-600">
                                    Operate
                                </div>
                            )}
                            <nav className="flex flex-col gap-0.5 px-2">
                                <NavItem to="/app/dashboard" icon={LayoutDashboard} collapsed={collapsed} onClick={closeMobile}>Dashboard</NavItem>
                                <NavItem to="/app/inbox" icon={Mail} collapsed={collapsed} onClick={closeMobile}>Inbox</NavItem>
                                <NavItem to="/app/bookings" icon={Calendar} collapsed={collapsed} onClick={closeMobile}>Bookings</NavItem>
                                <NavItem to="/app/forms" icon={FileText} collapsed={collapsed} onClick={closeMobile}>Forms</NavItem>
                                <NavItem to="/app/inventory" icon={Package} collapsed={collapsed} onClick={closeMobile}>Inventory</NavItem>
                                <NavItem to="/app/staff" icon={Users} collapsed={collapsed} onClick={closeMobile}>Staff</NavItem>
                            </nav>
                        </div>

                        {/* SETUP */}
                        <div>
                            {!collapsed && (
                                <div className="px-4 mb-2 text-xs font-mono font-semibold uppercase tracking-widest text-neutral-600">
                                    Setup
                                </div>
                            )}
                            <nav className="flex flex-col gap-0.5 px-2">
                                <NavItem to="/app/onboarding" icon={Settings} collapsed={collapsed}>Onboarding</NavItem>
                                <NavItem to="/app/workspaces" icon={Building} collapsed={collapsed}>Workspaces</NavItem>
                            </nav>
                        </div>

                    </div>

                    {/* PUBLIC LINKS */}
                    {!collapsed && workspace && (
                        <div className="p-3 border-t border-neutral-800">
                            <div className="text-xs font-mono font-semibold uppercase tracking-widest text-neutral-600 mb-2">
                                Public Links
                            </div>
                            <div className="space-y-1.5">
                                {[
                                    ["Contact", `/w/${workspace.slug}/contact`],
                                    ["Booking", `/w/${workspace.slug}/book`],
                                ].map(([label, href]) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between gap-2 px-2 py-1.5 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/50 hover:border-yellow-300/30 group transition-all"
                                    >
                                        <span className="text-xs font-mono text-neutral-400 group-hover:text-yellow-300 transition-colors truncate">
                                            {label}
                                        </span>
                                        <ExternalLink className="h-3 w-3 text-neutral-600 group-hover:text-yellow-300 shrink-0 transition-colors" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 overflow-auto bg-neutral-950 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}


