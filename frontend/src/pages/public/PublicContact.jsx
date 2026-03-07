import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../lib/app.js";
import { User, Mail, Phone, MessageSquare, CheckCircle, XCircle, ArrowRight, Ban } from "lucide-react";

function Field({ label, icon: Icon, children }) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </label>
            {children}
        </div>
    );
}

function DarkInput({ value, onChange, placeholder, type = "text" }) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2.5 focus:outline-none transition-colors placeholder:text-neutral-600 ${focused ? "border-yellow-300/50" : "border-neutral-700 hover:border-neutral-600"
                }`}
        />
    );
}

function DarkTextarea({ value, onChange, placeholder, rows = 4 }) {
    const [focused, setFocused] = useState(false);
    return (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2.5 focus:outline-none transition-colors placeholder:text-neutral-600 resize-none ${focused ? "border-yellow-300/50" : "border-neutral-700 hover:border-neutral-600"
                }`}
        />
    );
}

export default function PublicContact() {
    const { slug } = useParams();
    const [workspace, setWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [ok, setOk] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const data = await apiFetch(`/api/public/workspace/${slug}`);
                setWorkspace(data.workspace);
            } catch (e) {
                setErr(e.message || "Workspace not found");
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col">

            {/* Header */}
            <header className="border-b border-neutral-800 px-6 py-4">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
                        <span className="font-mono font-semibold text-sm tracking-wide text-neutral-100">
                            {workspace?.name || "Loading..."}
                        </span>
                    </div>
                    <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Contact</span>
                </div>
            </header>

            <div className="flex-1 flex items-start justify-center px-4 py-10">
                <div className="w-full max-w-lg">

                    {/* Page title */}
                    <div className="mb-6">
                        <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Get in Touch</div>
                        <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                            {workspace ? `Contact ${workspace.name}` : "Contact Us"}
                        </h1>
                        <p className="text-neutral-500 text-sm mt-1 font-mono">No account required. We'll get back to you shortly.</p>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="bg-neutral-900 border border-neutral-800 flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-5 w-5 animate-spin border-2 border-neutral-700 border-t-yellow-300 rounded-full" />
                                <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Loading...</p>
                            </div>
                        </div>
                    )}

                    {/* Top-level error */}
                    {err && !workspace && (
                        <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm font-mono">
                            <XCircle className="h-4 w-4 shrink-0" /> {err}
                        </div>
                    )}

                    {/* Contact form disabled */}
                    {workspace && !workspace.contactFormEnabled && (
                        <div className="bg-neutral-900 border border-neutral-800 p-8 text-center space-y-3">
                            <div className="flex justify-center">
                                <div className="w-12 h-12 bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                    <Ban className="h-6 w-6 text-neutral-600" />
                                </div>
                            </div>
                            <p className="text-sm font-mono text-neutral-500">This business is not accepting contact form submissions at this time.</p>
                        </div>
                    )}

                    {/* Success */}
                    {workspace && workspace.contactFormEnabled && ok && (
                        <div className="bg-neutral-900 border border-emerald-400/20 p-8 text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="w-14 h-14 bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                                </div>
                            </div>
                            <div>
                                <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Sent</div>
                                <h2 className="text-xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                                    Message Received!
                                </h2>
                                <p className="text-neutral-500 text-sm font-mono mt-2 leading-relaxed">
                                    {workspace.contactForm?.welcomeText || "Thanks! We'll get back to you shortly."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    {workspace && workspace.contactFormEnabled && !ok && !loading && (
                        <div className="bg-neutral-900 border border-neutral-800 divide-y divide-neutral-800">

                            <div className="p-5 space-y-4">
                                <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-semibold mb-1">Your Details</div>

                                <Field label="Full Name" icon={User}>
                                    <DarkInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
                                </Field>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field label="Email" icon={Mail}>
                                        <DarkInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
                                    </Field>
                                    <Field label="Phone" icon={Phone}>
                                        <DarkInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" />
                                    </Field>
                                </div>

                                <Field label="Message (optional)" icon={MessageSquare}>
                                    <DarkTextarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="How can we help you?"
                                        rows={4}
                                    />
                                </Field>
                            </div>

                            {/* Inline error */}
                            {err && (
                                <div className="px-5 py-3">
                                    <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm font-mono">
                                        <XCircle className="h-4 w-4 shrink-0" /> {err}
                                    </div>
                                </div>
                            )}

                            {/* Submit */}
                            <div className="p-5">
                                <button
                                    disabled={submitting || !name.trim() || !email.trim()}
                                    onClick={async () => {
                                        setErr(null);
                                        setSubmitting(true);
                                        try {
                                            await apiFetch(`/api/public/w/${slug}/contact`, {
                                                method: "POST",
                                                body: { name, email, phone, message },
                                            });
                                            setOk(true);
                                        } catch (e) {
                                            setErr(e.message || "Submit failed");
                                        } finally {
                                            setSubmitting(false);
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-sm font-mono uppercase tracking-widest px-6 py-3.5 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <><span className="w-4 h-4 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" /> Sending...</>
                                    ) : (
                                        <>Send Message <ArrowRight className="h-4 w-4" /></>
                                    )}
                                </button>
                                <p className="text-center text-xs font-mono text-neutral-700 mt-3">
                                    Your message goes directly to the team's inbox.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-neutral-800 py-5 px-6 text-center">
                <span className="text-xs font-mono text-neutral-700">
                    Powered by <span className="text-yellow-300/60">UnifiedOps</span>
                </span>
            </footer>
        </div>
    );
}