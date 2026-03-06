import React, { useEffect, useState } from "react";
import api from "../../lib/app.js";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext.jsx";
import { Link } from "react-router-dom";
import { Calendar, Clock, CheckCircle, XCircle, MessageSquare, FileText, Package, Bell, ArrowRight, AlertTriangle, Info } from "lucide-react";

function Stat({ label, value, icon: Icon, accent = false }) {
    return (
        <div className={`bg-neutral-900 border ${accent ? "border-yellow-300/20" : "border-neutral-800"} p-5 relative overflow-hidden group hover:border-neutral-700 transition-all duration-200`}>
            <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">{label}</span>
                <div className={`w-7 h-7 flex items-center justify-center ${accent ? "bg-yellow-300/10 text-yellow-300" : "bg-neutral-800 text-neutral-500"}`}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
            </div>
            <div className={`text-4xl font-black tracking-tight ${accent ? "text-yellow-300" : "text-neutral-100"}`} style={{ fontFamily: "Georgia, serif" }}>
                {value}
            </div>
            <div className={`absolute bottom-0 left-0 h-0.5 w-0 ${accent ? "bg-yellow-300" : "bg-neutral-700"} group-hover:w-full transition-all duration-300`} />
        </div>
    );
}

function DashCard({ title, linkTo, linkLabel, children }) {
    return (
        <div className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all duration-200 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-semibold">{title}</span>
                {linkTo && (
                    <Link
                        to={linkTo}
                        className="flex items-center gap-1 text-xs font-mono text-yellow-300/70 hover:text-yellow-300 transition-colors"
                    >
                        {linkLabel}
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                )}
            </div>
            <div className="p-5 flex-1">{children}</div>
        </div>
    );
}

function Row({ label, value, highlight }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-neutral-800/60 last:border-0">
            <span className="text-sm text-neutral-500 font-mono">{label}</span>
            <span className={`text-sm font-mono font-bold ${highlight ? "text-yellow-300" : "text-neutral-200"}`}>{value}</span>
        </div>
    );
}

const severityConfig = {
    CRITICAL: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", icon: XCircle },
    WARNING: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", icon: AlertTriangle },
    INFO: { color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20", icon: Info },
};

export default function Dashboard() {
    const { workspaceId } = useApp();
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const res = await api.get("/api/dashboard");
                setData(res.data);
            } catch (e) {
                const msg = e.response?.data?.error || e.message || "Failed to load dashboard";
                setErr(msg);
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        })();
    }, [workspaceId]);

    return (
        <div className="space-y-6 max-w-6xl">

            {/* Page header */}
            <div className="border-b border-neutral-800 pb-5">
                <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Overview</div>
                <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                    Dashboard
                </h1>
                <p className="text-neutral-500 text-sm mt-1">What's happening right now — and what needs attention.</p>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-5 w-5 animate-spin border-2 border-neutral-700 border-t-yellow-300 rounded-full" />
                        <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Loading...</p>
                    </div>
                </div>
            )}

            {/* Error */}
            {err && (
                <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm font-mono">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {err}
                </div>
            )}

            {data && (
                <>
                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Stat label="Today's Bookings" value={data.bookingOverview?.todaysBookings ?? 0} icon={Calendar} accent />
                        <Stat label="Upcoming" value={data.bookingOverview?.upcomingBookings ?? 0} icon={Clock} />
                        <Stat label="Completed" value={data.bookingOverview?.completedCount ?? 0} icon={CheckCircle} />
                        <Stat label="No-show" value={data.bookingOverview?.noShowCount ?? 0} icon={XCircle} />
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Leads */}
                        <DashCard title="Leads & Conversations" linkTo="/app/inbox" linkLabel="Open inbox">
                            <Row label="Conversations" value={data.leadsAndConversations?.conversations ?? 0} />
                            <Row label="Unanswered" value={data.leadsAndConversations?.unanswered ?? 0} highlight={data.leadsAndConversations?.unanswered > 0} />
                        </DashCard>

                        {/* Forms */}
                        <DashCard title="Forms" linkTo="/app/forms" linkLabel="View forms">
                            <Row label="Pending" value={data.formsStatus?.pendingForms ?? 0} highlight={data.formsStatus?.pendingForms > 0} />
                            <Row label="Overdue" value={data.formsStatus?.overdueForms ?? 0} highlight={data.formsStatus?.overdueForms > 0} />
                            <Row label="Completed" value={data.formsStatus?.completedForms ?? 0} />
                        </DashCard>

                        {/* Inventory alerts */}
                        <DashCard title="Inventory Alerts" linkTo="/app/inventory" linkLabel="View inventory">
                            {data.inventoryAlerts?.length ? (
                                <div className="space-y-2">
                                    {data.inventoryAlerts.map((i) => (
                                        <div key={i.id} className="flex items-center justify-between py-2 border-b border-neutral-800/60 last:border-0">
                                            <span className="text-sm text-neutral-400 font-mono truncate">{i.name}</span>
                                            <span className={`text-xs font-mono px-2 py-0.5 border ${i.onHand === 0
                                                ? "bg-red-400/10 border-red-400/20 text-red-400"
                                                : "bg-amber-400/10 border-amber-400/20 text-amber-400"
                                                }`}>
                                                {i.onHand} / {i.lowStockAt}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm font-mono text-neutral-600">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                    All stock levels healthy
                                </div>
                            )}
                        </DashCard>

                        {/* Key alerts */}
                        <DashCard title="Key Alerts">
                            {data.alerts?.length ? (
                                <div className="space-y-2">
                                    {data.alerts.map((a) => {
                                        const cfg = severityConfig[a.severity] || severityConfig.INFO;
                                        const SevIcon = cfg.icon;
                                        return (
                                            <Link
                                                key={a.id}
                                                to={`/app${a.linkPath || "/dashboard"}`}
                                                className={`flex items-start gap-3 p-3 border ${cfg.bg} hover:opacity-80 transition-opacity group`}
                                            >
                                                <SevIcon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-mono font-semibold ${cfg.color}`}>{a.title}</div>
                                                    {a.body && <div className="text-xs font-mono text-neutral-500 mt-0.5 truncate">{a.body}</div>}
                                                </div>
                                                <ArrowRight className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${cfg.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm font-mono text-neutral-600">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                    No active alerts
                                </div>
                            )}
                        </DashCard>
                    </div>
                </>
            )}
        </div>
    );
}
