import React, { useEffect, useState } from "react";
import api from "../../lib/app.js";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext.jsx";
import { Users, UserPlus, Trash2, XCircle, Shield, User, Mail, Crown, ChevronDown, ChevronUp } from "lucide-react";
import { CreateStaff } from "../onboarding/CreateStaff.jsx";

const roleConfig = {
    OWNER: { color: "text-yellow-300", bg: "bg-yellow-300/10 border-yellow-300/20", icon: Crown },
    STAFF: { color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20", icon: Shield },
};

function RoleBadge({ role }) {
    const cfg = roleConfig[role] || roleConfig.STAFF;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 border ${cfg.bg} ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {role}
        </span>
    );
}

function Avatar({ name }) {
    const initials = (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div className="w-9 h-9 bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-mono font-bold text-neutral-300 shrink-0">
            {initials}
        </div>
    );
}

export default function Staff() {
    const { workspaceId, isOwner, refreshSetup } = useApp();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [removingId, setRemovingId] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    async function load() {
        const res = await api.get(`/api/workspaces/${workspaceId}/staff`);
        setStaff(res.data.staff || []);
    }

    useEffect(() => {
        if (!workspaceId) return;
        (async () => {
            setLoading(true);
            setErr(null);
            try { await load(); }
            catch (e) { setErr(e.response?.data?.error || e.message || "Failed to load staff"); }
            finally { setLoading(false); }
        })();
    }, [workspaceId]);

    async function removeStaff(membershipId, name) {
        if (!window.confirm(`Remove ${name} from this workspace?`)) return;
        try {
            setRemovingId(membershipId);
            await api.delete(`/api/workspaces/${workspaceId}/staff/${membershipId}`);
            setStaff((prev) => prev.filter((s) => s.membershipId !== membershipId));
            toast.success(`${name} removed`);
        } catch (e) {
            toast.error(e.response?.data?.error || e.message || "Failed to remove");
        } finally {
            setRemovingId(null);
        }
    }

    const owners = staff.filter((s) => s.role === "OWNER");
    const members = staff.filter((s) => s.role !== "OWNER");

    return (
        <div className="space-y-5 max-w-3xl">

            {/* Page header */}
            <div className="border-b border-neutral-800 pb-5 flex items-start justify-between">
                <div>
                    <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Team</div>
                    <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                        Staff
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">Manage team members and their workspace access.</p>
                </div>
                {isOwner && (
                    <button
                        onClick={() => setShowAddForm((v) => !v)}
                        className="flex items-center gap-2 bg-yellow-300 hover:bg-yellow-200 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-4 py-2.5 transition-all hover:-translate-y-0.5"
                    >
                        {showAddForm ? <ChevronUp className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                        {showAddForm ? "Cancel" : "Add Staff"}
                    </button>
                )}
            </div>

            {/* Error */}
            {err && (
                <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm font-mono">
                    <XCircle className="h-4 w-4 shrink-0" /> {err}
                </div>
            )}

            {/* Add staff form */}
            {showAddForm && isOwner && (
                <div className="bg-neutral-900 border border-neutral-800 p-5">
                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-4 pb-3 border-b border-neutral-800">
                        New Staff Member
                    </div>
                    <CreateStaff
                        isOwner={isOwner}
                        onStaffCreated={async () => {
                            await load();
                            setShowAddForm(false);
                            toast.success("Staff added");
                        }}
                    />
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-5 w-5 animate-spin border-2 border-neutral-700 border-t-yellow-300 rounded-full" />
                        <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Loading...</p>
                    </div>
                </div>
            )}

            {/* Empty */}
            {!loading && staff.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-neutral-900 border border-dashed border-neutral-800 text-center">
                    <Users className="h-8 w-8 text-neutral-700 mb-3" />
                    <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-4">No team members yet</p>
                    {isOwner && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 bg-yellow-300 hover:bg-yellow-200 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-4 py-2 transition-all"
                        >
                            <UserPlus className="h-3.5 w-3.5" /> Add First Staff Member
                        </button>
                    )}
                </div>
            )}

            {/* Staff list */}
            {!loading && staff.length > 0 && (
                <div className="space-y-4">

                    {/* Owners */}
                    {owners.length > 0 && (
                        <div className="bg-neutral-900 border border-neutral-800">
                            <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
                                <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-semibold">Owners</span>
                                <span className="text-xs font-mono text-neutral-700">{owners.length}</span>
                            </div>
                            <div className="divide-y divide-neutral-800">
                                {owners.map((s) => (
                                    <div key={s.membershipId} className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-800/30 transition-colors">
                                        <Avatar name={s.user.name} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-neutral-100 truncate">{s.user.name}</span>
                                                <RoleBadge role={s.role} />
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-500">
                                                <Mail className="h-3 w-3" />
                                                {s.user.email}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Staff members */}
                    {members.length > 0 && (
                        <div className="bg-neutral-900 border border-neutral-800">
                            <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
                                <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-semibold">Staff Members</span>
                                <span className="text-xs font-mono text-neutral-700">{members.length}</span>
                            </div>
                            <div className="divide-y divide-neutral-800">
                                {members.map((s) => {
                                    const isRemoving = removingId === s.membershipId;
                                    return (
                                        <div
                                            key={s.membershipId}
                                            className={`flex items-center gap-4 px-5 py-4 hover:bg-neutral-800/30 transition-colors ${isRemoving ? "opacity-50" : ""}`}
                                        >
                                            <Avatar name={s.user.name} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-semibold text-neutral-100 truncate">{s.user.name}</span>
                                                    <RoleBadge role={s.role} />
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-500">
                                                    <Mail className="h-3 w-3" />
                                                    {s.user.email}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {isOwner && (
                                                <button
                                                    onClick={() => removeStaff(s.membershipId, s.user.name)}
                                                    disabled={isRemoving}
                                                    className="flex items-center justify-center w-8 h-8 border border-neutral-700 hover:border-red-500/40 hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                                    title="Remove staff"
                                                >
                                                    {isRemoving
                                                        ? <span className="w-3.5 h-3.5 border-2 border-neutral-600 border-t-yellow-300 rounded-full animate-spin" />
                                                        : <Trash2 className="h-3.5 w-3.5" />
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="flex items-center gap-4 px-1 text-xs font-mono text-neutral-700">
                        <span>{staff.length} total member{staff.length !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span>{owners.length} owner{owners.length !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span>{members.length} staff</span>
                    </div>
                </div>
            )}
        </div>
    );
}