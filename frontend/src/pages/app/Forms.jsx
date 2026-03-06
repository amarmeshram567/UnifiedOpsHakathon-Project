import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/app.js";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext.jsx";
import { FileText, XCircle, CheckCircle, Clock, AlertTriangle, Bell, ExternalLink } from "lucide-react";

const statusConfig = {
    COMPLETED: { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle },
    OVERDUE: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", icon: AlertTriangle },
    PENDING: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", icon: Clock },
};

function StatusBadge({ status }) {
    const cfg = statusConfig[status] || statusConfig.PENDING;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 border ${cfg.bg} ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {status}
        </span>
    );
}

const FILTERS = ["ALL", "PENDING", "OVERDUE", "COMPLETED"];

export default function Forms() {
    const { workspaceId } = useApp();
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [remindingId, setRemindingId] = useState(null);
    const [filter, setFilter] = useState("ALL");

    async function load() {
        const res = await api.get("/api/forms");
        setResponses(res.data.responses || []);
    }


    useEffect(() => {
        load()
    }, [])



    console.log("Form responses: ", responses)

    async function remind(responseId) {
        try {
            setRemindingId(responseId);
            await api.post(`/api/forms/${responseId}/remind`, {});
            await load();
            toast.success("Reminder sent");
        } catch (e) {
            toast.error(e.response?.data?.error || e.message || "Failed to send reminder");
        } finally {
            setRemindingId(null);
        }
    }

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try { await load(); }
            catch (e) {
                const msg = e.response?.data?.error || e.message || "Failed to load forms";
                setErr(msg);
                toast.error(msg);
            } finally { setLoading(false); }
        })();
    }, [workspaceId]);

    const filtered = useMemo(() =>
        filter === "ALL" ? responses : responses.filter((r) => r.status === filter),
        [responses, filter]
    );

    return (
        <div className="space-y-5 max-w-5xl">

            {/* Page header */}
            <div className="border-b border-neutral-800 pb-5">
                <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Documents</div>
                <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                    Forms
                </h1>
                <p className="text-neutral-500 text-sm mt-1">Track pending, overdue, and completed forms sent after booking.</p>
            </div>

            {/* Error */}
            {err && (
                <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm font-mono">
                    <XCircle className="h-4 w-4 shrink-0" /> {err}
                </div>
            )}

            {/* Filter tabs */}
            {!loading && (
                <div className="flex gap-1 border-b border-neutral-800">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all border-b-2 -mb-px ${filter === f
                                ? "border-yellow-300 text-yellow-300"
                                : "border-transparent text-neutral-500 hover:text-neutral-300"
                                }`}
                        >
                            {f}
                            <span className="ml-1.5 text-neutral-700">
                                {f === "ALL" ? responses.length : responses.filter((r) => r.status === f).length}
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
                    <FileText className="h-8 w-8 text-neutral-700 mb-3" />
                    <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">No form responses found</p>
                </div>
            )}

            {/* List */}
            {!loading && filtered.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 divide-y divide-neutral-800">
                    {filtered.map((r) => {
                        const isReminding = remindingId === r.id;
                        return (
                            <div
                                key={r.id}
                                className={`grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 px-5 py-4 items-center transition-colors hover:bg-neutral-800/30 ${isReminding ? "opacity-50" : ""}`}
                            >
                                {/* Info */}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-sm font-semibold text-neutral-100 truncate">
                                            {r.template?.title}
                                        </span>
                                        <StatusBadge status={r.status} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-neutral-500">
                                        <span>{r.booking?.bookingType?.name}</span>
                                        <span className="text-neutral-700">·</span>
                                        <span>{r.booking?.contact?.name}</span>
                                        <span className="text-neutral-700">·</span>
                                        <span>{new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <a
                                        href={`/form/${r.token}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-yellow-300 border border-neutral-700 hover:border-yellow-300/40 px-3 py-1.5 transition-all"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Form link
                                    </a>

                                    {r.status !== "COMPLETED" && (
                                        <button
                                            disabled={isReminding}
                                            onClick={() => remind(r.id)}
                                            className="flex items-center gap-1.5 text-xs font-mono bg-neutral-800 hover:bg-yellow-300/10 border border-neutral-700 hover:border-yellow-300/40 text-neutral-300 hover:text-yellow-300 px-3 py-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {isReminding
                                                ? <span className="w-3.5 h-3.5 border-2 border-neutral-600 border-t-yellow-300 rounded-full animate-spin" />
                                                : <Bell className="h-3 w-3" />
                                            }
                                            Remind
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

