import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext.jsx";
import { Building2, Plus, CheckCircle, Clock, ChevronRight, XCircle } from "lucide-react";

const TIMEZONES = ["UTC", "Asia/Kolkata", "America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney"];

function InputField({ label, value, onChange, placeholder, type = "text" }) {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2.5 focus:outline-none transition-colors placeholder:text-neutral-600 ${focused ? "border-yellow-300/50 bg-neutral-700/50" : "border-neutral-700 hover:border-neutral-600"
                    }`}
            />
        </div>
    );
}

export default function Workspaces() {
    const nav = useNavigate();
    const { workspaces, workspaceId, selectWorkspace, createWorkspace, workspace, role } = useApp();

    const [name, setName] = useState("My Service Business");
    const [address, setAddress] = useState("123 Main St");
    const [timeZone, setTimeZone] = useState("UTC");
    const [contactEmail, setContactEmail] = useState("owner@company.com");
    const [creating, setCreating] = useState(false);
    const [err, setErr] = useState(null);

    const selected = useMemo(() => (workspaces || []).find((w) => w.id === workspaceId) || null, [workspaces, workspaceId]);

    return (
        <div className="space-y-6 max-w-5xl">

            {/* Page header */}
            <div className="border-b border-neutral-800 pb-5 flex items-start justify-between">
                <div>
                    <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Account</div>
                    <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                        Workspaces
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">Pick a workspace or create a new one.</p>
                </div>
                {selected && (
                    <button
                        onClick={() => nav(selected.active ? "/app/dashboard" : "/app/onboarding")}
                        className="flex items-center gap-2 bg-yellow-300 hover:bg-yellow-200 text-neutral-950 text-xs font-mono font-bold uppercase tracking-widest px-5 py-2.5 transition-all hover:-translate-y-0.5"
                    >
                        Continue <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Workspace list */}
                <div className="bg-neutral-900 border border-neutral-800 flex flex-col">
                    <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-semibold">Your Workspaces</span>
                        <span className="text-xs font-mono text-neutral-600">{(workspaces || []).length}</span>
                    </div>
                    <div className="p-3 space-y-1.5 flex-1">
                        {!(workspaces || []).length && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Building2 className="h-7 w-7 text-neutral-700 mb-3" />
                                <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">No workspaces yet</p>
                            </div>
                        )}
                        {(workspaces || []).map((w) => {
                            const isActive = w.id === workspaceId;
                            return (
                                <button
                                    key={w.id}
                                    onClick={() => selectWorkspace(w.id)}
                                    className={`w-full text-left px-4 py-3.5 border-l-2 transition-all duration-150 ${isActive
                                        ? "bg-yellow-300/10 border-l-yellow-300"
                                        : "border-l-transparent hover:bg-neutral-800/60 hover:border-l-neutral-600"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className={`text-sm font-semibold truncate ${isActive ? "text-neutral-100" : "text-neutral-300"}`}>
                                                {w.name}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs font-mono text-neutral-600">
                                                <span>{w.slug}</span>
                                                <span className="text-neutral-700">·</span>
                                                <span>{w.role}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {w.active
                                                ? <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 border bg-emerald-400/10 border-emerald-400/20 text-emerald-400">
                                                    <CheckCircle className="h-3 w-3" /> ACTIVE
                                                </span>
                                                : <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 border bg-amber-400/10 border-amber-400/20 text-amber-400">
                                                    <Clock className="h-3 w-3" /> {w.onboardingStep}/8
                                                </span>
                                            }
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Current selection strip */}
                    {workspace && (
                        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-800/40">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-mono text-neutral-500">
                                    Selected: <span className="text-neutral-300 font-semibold">{workspace.name}</span>
                                    <span className="text-neutral-600 ml-2">({workspace.slug})</span>
                                </div>
                                <span className={`text-xs font-mono px-2 py-0.5 border ${role === "OWNER"
                                    ? "bg-yellow-300/10 border-yellow-300/20 text-yellow-300"
                                    : "bg-neutral-800 border-neutral-700 text-neutral-400"
                                    }`}>
                                    {role}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create workspace form */}
                <div className="bg-neutral-900 border border-neutral-800">
                    <div className="px-5 py-4 border-b border-neutral-800">
                        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-semibold">Create New Workspace</span>
                        <p className="text-neutral-600 text-xs font-mono mt-1">Step 1 of onboarding: workspace details.</p>
                    </div>

                    <div className="p-5 space-y-4">
                        <InputField label="Business Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Service Business" />
                        <InputField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />

                        <div>
                            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">Time Zone</label>
                            <select
                                value={timeZone}
                                onChange={(e) => setTimeZone(e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-neutral-100 text-sm font-mono px-3 py-2.5 focus:outline-none focus:border-yellow-300/50 transition-colors"
                            >
                                {TIMEZONES.map((tz) => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>

                        <InputField label="Contact Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="owner@company.com" type="email" />

                        {err && (
                            <div className="flex items-center gap-2 bg-red-400/10 border border-red-400/20 px-3 py-2.5 text-red-400 text-xs font-mono">
                                <XCircle className="h-3.5 w-3.5 shrink-0" /> {err}
                            </div>
                        )}

                        <button
                            disabled={creating}
                            onClick={async () => {
                                setCreating(true);
                                setErr(null);
                                try {
                                    await createWorkspace({ name, address, timeZone, contactEmail });
                                    nav("/app/onboarding");
                                } catch (e) {
                                    setErr(e.message || "Failed to create workspace");
                                } finally { setCreating(false); }
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-6 py-3 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed"
                        >
                            {creating
                                ? <><span className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" /> Creating...</>
                                : <><Plus className="h-3.5 w-3.5" /> Create Workspace</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

