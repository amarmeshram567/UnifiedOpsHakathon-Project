import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../lib/app.js";
import { CheckCircle, XCircle, ArrowRight, FileText } from "lucide-react";

function DarkInput({ value, onChange, placeholder }) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            type="text"
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

function FormField({ field, value, onChange }) {
    const common = {
        value: value ?? "",
        onChange: (e) => onChange(e.target.value),
        placeholder: field.label,
    };
    if (field.type === "textarea") return <DarkTextarea {...common} rows={4} />;
    return <DarkInput {...common} />;
}

export default function PublicFormFill() {
    const { token } = useParams();
    const [form, setForm] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [ok, setOk] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const data = await apiFetch(`/api/public/form/${token}`);
                setForm(data.form);
                setAnswers({});
            } catch (e) {
                setErr(e.message || "Form not found");
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const fields = form?.fieldsJson?.fields || [];
    const requiredFilled = fields.filter((f) => f.required).every((f) => answers[f.key]?.toString().trim());
    const isCompleted = ok || form?.status === "COMPLETED";

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col">

            {/* Header */}
            <header className="border-b border-neutral-800 px-6 py-4">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
                        <span className="font-mono font-semibold text-sm tracking-wide text-neutral-100">
                            {form?.title || "Form"}
                        </span>
                    </div>
                    <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Intake Form</span>
                </div>
            </header>

            <div className="flex-1 flex items-start justify-center px-4 py-10">
                <div className="w-full max-w-lg">

                    {/* Page title */}
                    <div className="mb-6">
                        <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Intake</div>
                        <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                            {form?.title || "Form"}
                        </h1>
                        <p className="text-neutral-500 text-sm mt-1 font-mono">No account required. Please fill out all required fields.</p>
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
                    {err && !form && (
                        <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm font-mono">
                            <XCircle className="h-4 w-4 shrink-0" /> {err}
                        </div>
                    )}

                    {/* Completed */}
                    {form && isCompleted && (
                        <div className="bg-neutral-900 border border-emerald-400/20 p-8 text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="w-14 h-14 bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                                </div>
                            </div>
                            <div>
                                <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Submitted</div>
                                <h2 className="text-xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                                    Thank You!
                                </h2>
                                <p className="text-neutral-500 text-sm font-mono mt-2">
                                    Your responses have been recorded successfully.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    {form && !isCompleted && !loading && (
                        <div className="bg-neutral-900 border border-neutral-800 divide-y divide-neutral-800">

                            {/* Description */}
                            {form.description && (
                                <div className="px-5 py-4 flex items-start gap-3">
                                    <FileText className="h-4 w-4 text-neutral-600 mt-0.5 shrink-0" />
                                    <p className="text-sm font-mono text-neutral-500 leading-relaxed">{form.description}</p>
                                </div>
                            )}

                            {/* Fields */}
                            <div className="p-5 space-y-5">
                                {fields.length === 0 && (
                                    <p className="text-xs font-mono text-neutral-600 text-center py-4">No fields in this form.</p>
                                )}
                                {fields.map((f, i) => (
                                    <div key={f.key}>
                                        <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">
                                            {f.label}
                                            {f.required && <span className="text-yellow-300 ml-1">*</span>}
                                        </label>
                                        <FormField
                                            field={f}
                                            value={answers[f.key]}
                                            onChange={(v) => setAnswers((a) => ({ ...a, [f.key]: v }))}
                                        />
                                    </div>
                                ))}
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
                                    disabled={submitting || !requiredFilled}
                                    onClick={async () => {
                                        setErr(null);
                                        setSubmitting(true);
                                        try {
                                            await apiFetch(`/api/public/form/${token}/submit`, { method: "POST", body: answers });
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
                                        <><span className="w-4 h-4 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" /> Submitting...</>
                                    ) : (
                                        <>Submit Form <ArrowRight className="h-4 w-4" /></>
                                    )}
                                </button>
                                {fields.some((f) => f.required) && (
                                    <p className="text-center text-xs font-mono text-neutral-700 mt-3">
                                        Fields marked <span className="text-yellow-300">*</span> are required.
                                    </p>
                                )}
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

