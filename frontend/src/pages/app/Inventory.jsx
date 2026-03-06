import React, { useEffect, useState } from "react";
import api from "../../lib/app.js";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext.jsx";
import { Package, XCircle, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

function StockBadge({ onHand, lowStockAt }) {
    const isOut = onHand === 0;
    const isLow = onHand <= lowStockAt;
    if (isOut) return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 border bg-red-400/10 border-red-400/20 text-red-400">
            <XCircle className="h-3 w-3" /> OUT OF STOCK
        </span>
    );
    if (isLow) return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 border bg-amber-400/10 border-amber-400/20 text-amber-400">
            <AlertTriangle className="h-3 w-3" /> LOW STOCK
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 border bg-emerald-400/10 border-emerald-400/20 text-emerald-400">
            <CheckCircle className="h-3 w-3" /> IN STOCK
        </span>
    );
}

function StockBar({ onHand, lowStockAt }) {
    const max = Math.max(onHand, lowStockAt * 2, 1);
    const pct = Math.min((onHand / max) * 100, 100);
    const isLow = onHand <= lowStockAt;
    const isOut = onHand === 0;
    return (
        <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden mt-2">
            <div
                className={`h-full rounded-full transition-all duration-500 ${isOut ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

export default function Inventory() {
    const { workspaceId } = useApp();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [delta, setDelta] = useState({});
    const [reason, setReason] = useState({});
    const [adjustingId, setAdjustingId] = useState(null);
    const [filter, setFilter] = useState("ALL");

    async function load() {
        const res = await api.get("/api/inventory");
        setItems(res.data.items || []);
    }

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try { await load(); }
            catch (e) {
                const msg = e.response?.data?.error || e.message || "Failed to load inventory";
                setErr(msg);
                toast.error(msg);
            } finally { setLoading(false); }
        })();
    }, [workspaceId]);

    async function adjust(item) {
        const d = Number(delta[item.id] || 0);
        const rsn = reason[item.id] || "Manual adjustment";
        if (d === 0) { toast.error("Enter a non-zero delta"); return; }
        try {
            setAdjustingId(item.id);
            await api.post(`/api/inventory/${item.id}/adjust`, { delta: d, reason: rsn });
            setDelta((x) => ({ ...x, [item.id]: "" }));
            setReason((x) => ({ ...x, [item.id]: "" }));
            await load();
            toast.success("Inventory updated");
        } catch (e) {
            toast.error(e.response?.data?.error || e.message || "Adjustment failed");
        } finally { setAdjustingId(null); }
    }

    const filtered = filter === "ALL" ? items
        : filter === "LOW" ? items.filter((i) => i.onHand <= i.lowStockAt && i.onHand > 0)
            : filter === "OUT" ? items.filter((i) => i.onHand === 0)
                : items.filter((i) => i.onHand > i.lowStockAt);

    const counts = {
        ALL: items.length,
        LOW: items.filter((i) => i.onHand <= i.lowStockAt && i.onHand > 0).length,
        OUT: items.filter((i) => i.onHand === 0).length,
        OK: items.filter((i) => i.onHand > i.lowStockAt).length,
    };

    return (
        <div className="space-y-5 max-w-5xl">

            {/* Page header */}
            <div className="border-b border-neutral-800 pb-5">
                <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Stock</div>
                <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                    Inventory
                </h1>
                <p className="text-neutral-500 text-sm mt-1">Track stock levels and adjust inventory quickly.</p>
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
                    {[
                        { key: "ALL", label: "All" },
                        { key: "OK", label: "In Stock" },
                        { key: "LOW", label: "Low Stock" },
                        { key: "OUT", label: "Out of Stock" },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all border-b-2 -mb-px ${filter === key
                                ? "border-yellow-300 text-yellow-300"
                                : "border-transparent text-neutral-500 hover:text-neutral-300"
                                }`}
                        >
                            {label}
                            <span className="ml-1.5 text-neutral-700">{counts[key]}</span>
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
                    <Package className="h-8 w-8 text-neutral-700 mb-3" />
                    <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">No items found</p>
                </div>
            )}

            {/* List */}
            {!loading && filtered.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 divide-y divide-neutral-800">
                    {filtered.map((i) => {
                        const isAdjusting = adjustingId === i.id;
                        const dVal = delta[i.id] ?? "";
                        const dNum = Number(dVal);
                        return (
                            <div
                                key={i.id}
                                className={`grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 px-5 py-4 items-center transition-colors hover:bg-neutral-800/30 ${isAdjusting ? "opacity-50" : ""}`}
                            >
                                {/* Item info */}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <span className="text-sm font-semibold text-neutral-100 truncate">{i.name}</span>
                                        <StockBadge onHand={i.onHand} lowStockAt={i.lowStockAt} />
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
                                        <span>
                                            On-hand: <span className="text-neutral-200 font-bold">{i.onHand}</span>
                                        </span>
                                        <span className="text-neutral-700">·</span>
                                        <span>
                                            Threshold: <span className="text-neutral-400">{i.lowStockAt}</span>
                                        </span>
                                    </div>
                                    <StockBar onHand={i.onHand} lowStockAt={i.lowStockAt} />
                                </div>

                                {/* Adjust controls */}
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={dVal}
                                            onChange={(e) => setDelta((d) => ({ ...d, [i.id]: e.target.value }))}
                                            placeholder="+/−"
                                            className={`w-20 bg-neutral-800 border text-sm font-mono px-3 py-2 focus:outline-none transition-colors text-center ${dNum > 0 ? "border-emerald-500/40 text-emerald-400" :
                                                dNum < 0 ? "border-red-500/40 text-red-400" :
                                                    "border-neutral-700 text-neutral-300"
                                                } placeholder:text-neutral-600`}
                                        />
                                        {dNum !== 0 && (
                                            <div className="absolute -top-1.5 -right-1.5">
                                                {dNum > 0
                                                    ? <TrendingUp className="h-3 w-3 text-emerald-400" />
                                                    : <TrendingDown className="h-3 w-3 text-red-400" />
                                                }
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        type="text"
                                        value={reason[i.id] ?? ""}
                                        onChange={(e) => setReason((r) => ({ ...r, [i.id]: e.target.value }))}
                                        placeholder="Reason (optional)"
                                        className="flex-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-mono px-3 py-2 focus:outline-none focus:border-yellow-300/40 transition-colors placeholder:text-neutral-600"
                                    />

                                    <button
                                        disabled={isAdjusting || dVal === "" || dNum === 0}
                                        onClick={() => adjust(i)}
                                        className="bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 transition-all disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
                                    >
                                        {isAdjusting
                                            ? <span className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" />
                                            : "Apply"
                                        }
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

