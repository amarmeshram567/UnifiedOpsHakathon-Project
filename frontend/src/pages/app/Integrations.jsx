import React, { useEffect, useState } from "react";
import api from "../../lib/app.js";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext.jsx";
import {
    Mail,
    Phone,
    CheckCircle,
    XCircle,
    Save,
    Loader2,
    Zap,
} from "lucide-react";

// ─── small reusable primitives ───────────────────────────────────────────────

function SectionLabel({ children }) {
    return (
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-semibold">
            {children}
        </span>
    );
}

function StatusPill({ enabled }) {
    return enabled ? (
        <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            Connected
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-500">
            <XCircle className="h-3 w-3" />
            Disabled
        </span>
    );
}

function Field({ label, hint, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">
                {label}
            </label>
            {children}
            {hint && <p className="text-xs font-mono text-neutral-600">{hint}</p>}
        </div>
    );
}

function Input({ ...props }) {
    return (
        <input
            {...props}
            className="w-full bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm font-mono px-3 py-2 focus:outline-none focus:border-yellow-300/50 placeholder:text-neutral-600 transition-colors"
        />
    );
}

function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-yellow-300" : "bg-neutral-700"
                } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-neutral-900 transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
            />
        </button>
    );
}

// ─── channel card ─────────────────────────────────────────────────────────────

function ChannelCard({ icon: Icon, title, description, channelKey, state, onChange, onSave, saving }) {
    const { enabled, value } = state;
    const fieldLabel = channelKey === "email" ? "From email address" : "From phone number";
    const fieldKey = channelKey === "email" ? "fromEmail" : "fromPhone";
    const placeholder = channelKey === "email" ? "hello@yourbusiness.com" : "+1 555 000 0000";
    const hint = channelKey === "email"
        ? "Outbound emails will be sent from this address."
        : "Outbound SMS will be sent from this number.";

    return (
        <div
            className={`bg-neutral-900 border transition-all duration-200 flex flex-col ${enabled ? "border-yellow-300/20" : "border-neutral-800"
                } hover:border-neutral-700`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-8 h-8 flex items-center justify-center ${enabled ? "bg-yellow-300/10 text-yellow-300" : "bg-neutral-800 text-neutral-500"
                            }`}
                    >
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-sm font-mono font-semibold text-neutral-100">{title}</div>
                        <div className="text-xs font-mono text-neutral-600">{description}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <StatusPill enabled={enabled} />
                    <Toggle
                        checked={enabled}
                        onChange={(val) => onChange({ enabled: val, value })}
                    />
                </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 space-y-4">
                <Field label={fieldLabel} hint={enabled ? hint : "Enable this channel to configure it."}>
                    <Input
                        type={channelKey === "email" ? "email" : "tel"}
                        placeholder={placeholder}
                        value={value}
                        disabled={!enabled}
                        onChange={(e) => onChange({ enabled, value: e.target.value })}
                    />
                </Field>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
                <button
                    onClick={onSave}
                    disabled={saving || !enabled}
                    className={`flex items-center gap-2 text-xs font-mono px-4 py-2 border transition-all duration-150 ${enabled && !saving
                        ? "bg-yellow-300/10 border-yellow-300/30 text-yellow-300 hover:bg-yellow-300/20"
                        : "bg-neutral-800 border-neutral-700 text-neutral-600 cursor-not-allowed"
                        }`}
                >
                    {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Save className="h-3.5 w-3.5" />
                    )}
                    Save {title}
                </button>
            </div>

            {/* Bottom accent line */}
            <div
                className={`h-0.5 w-full transition-colors duration-300 ${enabled ? "bg-yellow-300/30" : "bg-transparent"
                    }`}
            />
        </div>
    );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function Integrations() {
    const { workspaceId } = useApp();

    const [email, setEmail] = useState({ enabled: false, value: "" });
    const [sms, setSms] = useState({ enabled: false, value: "" });
    const [loading, setLoading] = useState(true);
    const [savingEmail, setSavingEmail] = useState(false);
    const [savingSms, setSavingSms] = useState(false);

    // Load current channel config from workspace setup
    useEffect(() => {
        if (!workspaceId) return;
        (async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/workspaces/${workspaceId}/setup`);
                const channels = res.data?.setup?.channels ?? [];

                const emailCh = channels.find((c) => c.type === "EMAIL");
                const smsCh = channels.find((c) => c.type === "SMS");

                if (emailCh) setEmail({ enabled: emailCh.enabled, value: emailCh.from_email ?? "" });
                if (smsCh) setSms({ enabled: smsCh.enabled, value: smsCh.from_phone ?? "" });
            } catch (e) {
                toast.error("Failed to load integration settings");
            } finally {
                setLoading(false);
            }
        })();
    }, [workspaceId]);

    async function saveChannel(type) {
        const isEmail = type === "email";
        const state = isEmail ? email : sms;
        const setSaving = isEmail ? setSavingEmail : setSavingSms;

        setSaving(true);
        try {
            const body = isEmail
                ? { email: { enabled: state.enabled, fromEmail: state.value } }
                : { sms: { enabled: state.enabled, fromPhone: state.value } };

            await api.post(`/api/workspaces/${workspaceId}/onboarding/channels`, body);
            toast.success(`${isEmail ? "Email" : "SMS"} settings saved`);
        } catch (e) {
            const msg = e.response?.data?.error || e.message || "Save failed";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    }

    const anyConnected = email.enabled || sms.enabled;

    return (
        <div className="space-y-6 max-w-3xl">

            {/* Page header */}
            <div className="border-b border-neutral-800 pb-5">
                <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Settings</div>
                <h1
                    className="text-2xl font-black text-neutral-100 tracking-tight"
                    style={{ fontFamily: "Georgia, serif" }}
                >
                    Integrations
                </h1>
                <p className="text-neutral-500 text-sm mt-1">
                    Connect communication channels so your workspace can send automated messages.
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-5 w-5 animate-spin border-2 border-neutral-700 border-t-yellow-300 rounded-full" />
                        <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Loading...</p>
                    </div>
                </div>
            )}

            {!loading && (
                <>
                    {/* Status banner */}
                    <div
                        className={`flex items-center gap-3 px-4 py-3 border text-sm font-mono ${anyConnected
                            ? "bg-emerald-400/5 border-emerald-400/20 text-emerald-400"
                            : "bg-amber-400/5 border-amber-400/20 text-amber-400"
                            }`}
                    >
                        <Zap className="h-4 w-4 shrink-0" />
                        {anyConnected
                            ? "At least one channel is active — automated messages will be delivered."
                            : "No channels connected yet. Enable Email or SMS to send automated messages."}
                    </div>

                    {/* Channel section label */}
                    <div className="flex items-center gap-3">
                        <SectionLabel>Communication channels</SectionLabel>
                        <div className="flex-1 h-px bg-neutral-800" />
                    </div>

                    {/* Channel cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ChannelCard
                            icon={Mail}
                            title="Email"
                            description="Send booking confirmations & follow-ups"
                            channelKey="email"
                            state={email}
                            onChange={setEmail}
                            onSave={() => saveChannel("email")}
                            saving={savingEmail}
                        />
                        <ChannelCard
                            icon={Phone}
                            title="SMS"
                            description="Send text messages to customers"
                            channelKey="sms"
                            state={sms}
                            onChange={setSms}
                            onSave={() => saveChannel("sms")}
                            saving={savingSms}
                        />
                    </div>

                    {/* Info footer */}
                    <div className="border border-neutral-800 bg-neutral-900 px-5 py-4 space-y-2">
                        <SectionLabel>How channels are used</SectionLabel>
                        <ul className="mt-3 space-y-2">
                            {[
                                "Welcome message when a new contact fills in the contact form",
                                "Booking confirmation immediately after a booking is created",
                                "Automated alerts when forms go overdue or messages go unanswered",
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-2 text-sm font-mono text-neutral-500">
                                    <span className="mt-1.5 h-1 w-1 shrink-0 bg-yellow-300/50" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}