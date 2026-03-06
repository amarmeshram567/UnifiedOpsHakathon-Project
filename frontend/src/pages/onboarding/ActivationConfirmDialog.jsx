import { Zap, X, CheckCircle } from "lucide-react";

export function ActivationConfirmDialog({ isOpen, onConfirm, onCancel, isLoading }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 shadow-2xl">

                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-300/10 border border-yellow-300/20 flex items-center justify-center shrink-0">
                            <Zap className="h-4 w-4 text-yellow-300" />
                        </div>
                        <div>
                            <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-0.5">Confirmation</div>
                            <h3 className="text-base font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                                Activate Workspace?
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="text-neutral-600 hover:text-neutral-300 transition-colors disabled:opacity-40 mt-0.5"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-neutral-400 leading-relaxed">
                        Once activated, your public links — booking, forms, and contact — will go live and be accessible to customers. You can still edit settings afterward.
                    </p>

                    {/* Checklist */}
                    <div className="bg-neutral-800/60 border border-neutral-700/50 p-4 space-y-2.5">
                        <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-semibold mb-3">
                            Before you proceed, ensure:
                        </p>
                        {[
                            "At least one communication channel (Email or SMS)",
                            "At least one booking type defined",
                            "Your availability is set correctly",
                        ].map((item) => (
                            <div key={item} className="flex items-start gap-2.5">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                <span className="text-xs font-mono text-neutral-400">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-6 pb-6">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-200 text-xs font-mono uppercase tracking-widest px-4 py-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-4 py-3 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading
                            ? <><span className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" /> Activating...</>
                            : <><Zap className="h-3.5 w-3.5" /> Yes, Activate</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}