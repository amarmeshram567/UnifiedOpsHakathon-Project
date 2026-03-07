import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../lib/app.js";
import { Calendar, Clock, User, Mail, Phone, CheckCircle, XCircle, ArrowRight, ExternalLink } from "lucide-react";

function nextSlots() {
    const now = new Date();
    const slots = [];
    for (let i = 1; i <= 10; i++) {
        const d = new Date(now.getTime() + i * 60 * 60 * 1000);
        d.setMinutes(0, 0, 0);
        slots.push(d.toISOString());
    }
    return slots;
}

function fmtSlot(iso) {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

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

function DarkSelect({ value, onChange, children }) {
    const [focused, setFocused] = useState(false);
    return (
        <select
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2.5 focus:outline-none transition-colors ${focused ? "border-yellow-300/50" : "border-neutral-700 hover:border-neutral-600"
                }`}
        >
            {children}
        </select>
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

export default function PublicBooking() {
    const { slug } = useParams();
    const [workspace, setWorkspace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [ok, setOk] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [bookingTypeId, setBookingTypeId] = useState("");
    const [startAt, setStartAt] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const slots = useMemo(() => nextSlots(), []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const data = await apiFetch(`/api/public/workspace/${slug}`);
                setWorkspace(data.workspace);
                if (data.workspace?.bookingTypes?.[0]?.id) setBookingTypeId(String(data.workspace.bookingTypes[0].id));
                if (slots[0]) setStartAt(slots[0]);
            } catch (e) {
                setErr(e.message || "Workspace not found");
            } finally {
                setLoading(false);
            }
        })();
    }, [slug, slots]);

    const selectedType = workspace?.bookingTypes?.find((bt) => String(bt.id) === String(bookingTypeId));

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
                    <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Book Appointment</span>
                </div>
            </header>

            <div className="flex-1 flex items-start justify-center px-4 py-10">
                <div className="w-full max-w-lg">

                    {/* Page title */}
                    <div className="mb-6">
                        <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Scheduling</div>
                        <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                            {workspace ? `Book with ${workspace.name}` : "Book an Appointment"}
                        </h1>
                        <p className="text-neutral-500 text-sm mt-1 font-mono">No account required.</p>
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

                    {/* Error */}
                    {err && !ok && (
                        <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm font-mono mb-4">
                            <XCircle className="h-4 w-4 shrink-0" /> {err}
                        </div>
                    )}

                    {/* Success state */}
                    {ok && (
                        <div className="bg-neutral-900 border border-emerald-400/20 p-8 text-center space-y-5">
                            <div className="flex justify-center">
                                <div className="w-14 h-14 bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                                </div>
                            </div>
                            <div>
                                <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Confirmed</div>
                                <h2 className="text-xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                                    Booking Confirmed!
                                </h2>
                                <p className="text-neutral-500 text-sm font-mono mt-2">
                                    You'll receive a confirmation shortly. Please complete the intake form below.
                                </p>
                            </div>
                            <a
                                href={ok.next?.forms}
                                className="inline-flex items-center gap-2 bg-yellow-300 hover:bg-yellow-200 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-6 py-3 transition-all hover:-translate-y-0.5"
                            >
                                Complete Intake Form <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    )}

                    {/* Booking form */}
                    {workspace && !ok && !loading && (
                        <div className="bg-neutral-900 border border-neutral-800 divide-y divide-neutral-800">

                            {/* Service + time */}
                            <div className="p-5 space-y-4">
                                <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-semibold mb-1">Appointment Details</div>

                                <Field label="Service" icon={Calendar}>
                                    <DarkSelect value={bookingTypeId} onChange={(e) => setBookingTypeId(e.target.value)}>
                                        {(workspace.bookingTypes || []).map((bt) => (
                                            <option key={bt.id} value={bt.id}>
                                                {bt.name} — {bt.durationMin} min{bt.location ? ` · ${bt.location}` : ""}
                                            </option>
                                        ))}
                                    </DarkSelect>
                                </Field>

                                {selectedType && (
                                    <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 bg-neutral-800/50 px-3 py-2 border border-neutral-700/50">
                                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{selectedType.durationMin} min</span>
                                        {selectedType.location && <span>· {selectedType.location}</span>}
                                    </div>
                                )}

                                <Field label="Time Slot" icon={Clock}>
                                    <DarkSelect value={startAt} onChange={(e) => setStartAt(e.target.value)}>
                                        {slots.map((s) => (
                                            <option key={s} value={s}>{fmtSlot(s)}</option>
                                        ))}
                                    </DarkSelect>
                                </Field>
                            </div>

                            {/* Contact info */}
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
                            </div>

                            {/* Error in form */}
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
                                            const data = await apiFetch(`/api/public/w/${slug}/book`, {
                                                method: "POST",
                                                body: { bookingTypeId: Number(bookingTypeId), startAt, name, email, phone },
                                            });
                                            setOk(data);
                                        } catch (e) {
                                            setErr(e.message || "Booking failed");
                                        } finally {
                                            setSubmitting(false);
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-sm font-mono uppercase tracking-widest px-6 py-3.5 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <><span className="w-4 h-4 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" /> Booking...</>
                                    ) : (
                                        <>Confirm Booking <ArrowRight className="h-4 w-4" /></>
                                    )}
                                </button>
                                <p className="text-center text-xs font-mono text-neutral-700 mt-3">
                                    By booking you agree to our terms. You'll receive a confirmation by email.
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

