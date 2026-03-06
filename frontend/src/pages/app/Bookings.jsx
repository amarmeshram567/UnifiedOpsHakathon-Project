import React, { useEffect, useState } from "react";
import api from "../../lib/app.js";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext.jsx";
import { Calendar, Clock, User, XCircle, CheckCircle, AlertTriangle, Ban } from "lucide-react";

const STATUSES = ["SCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"];

function statusSelectClass(status) {
    if (status === "COMPLETED") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    if (status === "NO_SHOW") return "text-red-400 bg-red-400/10 border-red-400/30";
    if (status === "CANCELLED") return "text-neutral-500 bg-neutral-800 border-neutral-700";
    return "text-sky-400 bg-sky-400/10 border-sky-400/30"; // SCHEDULED default
}

const statusConfig = {
    SCHEDULED: { color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20", icon: Clock },
    COMPLETED: { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle },
    NO_SHOW: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", icon: XCircle },
    CANCELLED: { color: "text-neutral-500", bg: "bg-neutral-800 border-neutral-700", icon: Ban },
};

function StatusBadge({ status }) {
    const cfg = statusConfig[status] || statusConfig.SCHEDULED;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 border ${cfg.bg} ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {status}
        </span>
    );
}

function fmt(dateStr) {
    return new Date(dateStr).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function Bookings() {
    const { workspaceId } = useApp();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [err, setErr] = useState(null);
    const [filter, setFilter] = useState("ALL");

    async function load() {
        const res = await api.get("/api/bookings");
        setBookings(res.data.bookings || []);
    }

    useEffect(() => {
        if (!workspaceId) return;
        (async () => {
            setLoading(true);
            setErr(null);
            try { await load(); }
            catch (e) { setErr(e.response?.data?.error || e.message || "Failed to load bookings"); }
            finally { setLoading(false); }
        })();
    }, [workspaceId]);

    async function updateStatus(bookingId, status) {
        try {
            setUpdatingId(bookingId);
            await api.patch(`/api/bookings/${bookingId}/status`, { status });
            setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status } : b));
            toast.success("Status updated");
        } catch (e) {
            toast.error(e.response?.data?.error || e.message || "Failed to update");
        } finally {
            setUpdatingId(null);
        }
    }

    const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

    return (
        <div className="space-y-5 max-w-5xl">

            {/* Page header */}
            <div className="border-b border-neutral-800 pb-5">
                <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Schedule</div>
                <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                    Bookings
                </h1>
                <p className="text-neutral-500 text-sm mt-1">Manage appointments and update their status.</p>
            </div>

            {/* Error */}
            {err && (
                <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm font-mono">
                    <XCircle className="h-4 w-4 shrink-0" /> {err}
                </div>
            )}

            {/* Filter tabs */}
            {!loading && (
                <div className="flex gap-1 border-b border-neutral-800 pb-0">
                    {["ALL", ...STATUSES].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all border-b-2 -mb-px ${filter === s
                                ? "border-yellow-300 text-yellow-300"
                                : "border-transparent text-neutral-500 hover:text-neutral-300"
                                }`}
                        >
                            {s}
                            <span className="ml-1.5 text-neutral-700">
                                {s === "ALL" ? bookings.length : bookings.filter((b) => b.status === s).length}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-5 w-5 animate-spin border-2 border-neutral-700 border-t-yellow-300 rounded-full" />
                        <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Loading...</p>
                    </div>
                </div>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Calendar className="h-8 w-8 text-neutral-700 mb-3" />
                    <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">No bookings found</p>
                </div>
            )}

            {/* Table */}
            {!loading && filtered.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 overflow-hidden">
                    {/* Table head */}
                    <div className="grid grid-cols-[1fr_160px_160px_140px] gap-4 px-5 py-3 border-b border-neutral-800 bg-neutral-900/80">
                        {["Booking", "Start", "End", "Status"].map((h) => (
                            <div key={h} className="text-xs font-mono uppercase tracking-widest text-neutral-600">{h}</div>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-neutral-800">
                        {filtered.map((b) => {
                            const isUpdating = updatingId === b.id;
                            return (
                                <div
                                    key={b.id}
                                    className={`grid grid-cols-[1fr_160px_160px_140px] gap-4 px-5 py-4 items-center transition-colors hover:bg-neutral-800/40 ${isUpdating ? "opacity-50" : ""}`}
                                >
                                    {/* Info */}
                                    <div>
                                        <div className="text-sm font-semibold text-neutral-100">{b.booking_type_name}</div>
                                        <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-neutral-500">
                                            <User className="h-3 w-3" />
                                            {b.contact_name}
                                        </div>
                                    </div>

                                    {/* Start */}
                                    <div className="text-xs font-mono text-neutral-400">{fmt(b.start_at)}</div>

                                    {/* End */}
                                    <div className="text-xs font-mono text-neutral-400">{fmt(b.end_at)}</div>

                                    {/* Status select */}
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={b.status}
                                            disabled={isUpdating}
                                            onChange={(e) => updateStatus(b.id, e.target.value)}
                                            className={`border font-mono text-xs px-2.5 py-1.5 focus:outline-none transition-colors disabled:opacity-40 cursor-pointer ${statusSelectClass(b.status)}`}
                                        >
                                            {/* Always include current status so it's never blank */}
                                            {[...new Set([b.status, ...STATUSES])].map((s) => (
                                                <option key={s} value={s}>{s.replace("_", " ")}</option>
                                            ))}
                                        </select>
                                        {isUpdating && (
                                            <span className="w-3.5 h-3.5 border-2 border-neutral-600 border-t-yellow-300 rounded-full animate-spin shrink-0" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}