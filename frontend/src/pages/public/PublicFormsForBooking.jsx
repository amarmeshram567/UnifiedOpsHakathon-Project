// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { apiFetch } from "../../lib/app.js";
// import { Card, PageTitle } from "../../components/ui.jsx";

// export default function PublicFormsForBooking() {
//     const { slug, bookingId } = useParams();
//     const [forms, setForms] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [err, setErr] = useState(null);

//     useEffect(() => {
//         (async () => {
//             setLoading(true);
//             setErr(null);
//             try {
//                 const data = await apiFetch(`/api/public/w/${slug}/forms/${bookingId}`);
//                 setForms(data.forms || []);
//             } catch (e) {
//                 setErr(e.message || "Failed to load forms");
//             } finally {
//                 setLoading(false);
//             }
//         })();
//     }, [slug, bookingId]);

//     return (
//         <div className="min-h-screen bg-neutral-50">
//             <div className="mx-auto max-w-lg px-4 py-10">
//                 <PageTitle title="Your forms" subtitle="Complete these before your booking." />
//                 {loading ? <Card className="mt-4">Loading…</Card> : null}
//                 {err ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

//                 <div className="mt-4 space-y-3">
//                     {forms.map((f) => (
//                         <Card key={f.id}>
//                             <div className="text-sm font-semibold">{f.title}</div>
//                             {f.description ? <div className="mt-1 text-sm text-neutral-600">{f.description}</div> : null}
//                             <div className="mt-3">
//                                 <a className="text-sm text-blue-600 hover:underline" href={`/form/${f.token}`}>
//                                     Open form
//                                 </a>
//                             </div>
//                         </Card>
//                     ))}
//                     {forms.length === 0 && !loading ? <Card>No forms found.</Card> : null}
//                 </div>
//             </div>
//         </div>
//     );
// }


import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../lib/app.js";
import { FileText, XCircle, ArrowRight, ClipboardList } from "lucide-react";

export default function PublicFormsForBooking() {
    const { slug, bookingId } = useParams();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const data = await apiFetch(`/api/public/w/${slug}/forms/${bookingId}`);
                setForms(data.forms || []);
            } catch (e) {
                setErr(e.message || "Failed to load forms");
            } finally {
                setLoading(false);
            }
        })();
    }, [slug, bookingId]);

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col">

            {/* Header */}
            <header className="border-b border-neutral-800 px-6 py-4">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
                        <span className="font-mono font-semibold text-sm tracking-wide text-neutral-100">
                            Booking Forms
                        </span>
                    </div>
                    <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Intake</span>
                </div>
            </header>

            <div className="flex-1 flex items-start justify-center px-4 py-10">
                <div className="w-full max-w-lg">

                    {/* Page title */}
                    <div className="mb-6">
                        <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Next Steps</div>
                        <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                            Your Forms
                        </h1>
                        <p className="text-neutral-500 text-sm mt-1 font-mono">Please complete these before your appointment.</p>
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
                    {err && (
                        <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm font-mono">
                            <XCircle className="h-4 w-4 shrink-0" /> {err}
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !err && forms.length === 0 && (
                        <div className="bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center py-16 text-center">
                            <ClipboardList className="h-8 w-8 text-neutral-700 mb-3" />
                            <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">No forms to complete</p>
                        </div>
                    )}

                    {/* Forms list */}
                    {!loading && forms.length > 0 && (
                        <div className="space-y-3">
                            {forms.map((f, i) => (
                                <div
                                    key={f.id}
                                    className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all duration-200 group"
                                >
                                    <div className="px-5 py-4 flex items-start gap-4">
                                        {/* Icon */}
                                        <div className="w-9 h-9 bg-yellow-300/10 border border-yellow-300/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <FileText className="h-4 w-4 text-yellow-300" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono text-neutral-700 uppercase tracking-widest">Form {i + 1}</span>
                                            </div>
                                            <div className="text-sm font-semibold text-neutral-100">{f.title}</div>
                                            {f.description && (
                                                <p className="text-xs font-mono text-neutral-500 mt-1 leading-relaxed">{f.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="px-5 pb-4 flex justify-end">
                                        <a
                                            href={`/form/${f.token}`}
                                            className="inline-flex items-center gap-2 bg-yellow-300 hover:bg-yellow-200 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-4 py-2 transition-all hover:-translate-y-0.5"
                                        >
                                            Open Form <ArrowRight className="h-3.5 w-3.5" />
                                        </a>
                                    </div>
                                </div>
                            ))}
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
