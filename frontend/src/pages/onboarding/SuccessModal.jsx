import { CheckCircle, X } from "lucide-react";

export function SuccessModal({ isOpen, onClose, title, message, actionLabel }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 shadow-2xl">

                {/* Dismiss */}
                <div className="flex justify-end px-5 pt-4">
                    <button
                        onClick={onClose}
                        className="text-neutral-600 hover:text-neutral-300 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 pb-8 pt-2 text-center space-y-4">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-14 h-14 bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                            <CheckCircle className="h-7 w-7 text-emerald-400" />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="space-y-1.5">
                        <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase">Success</div>
                        <h3 className="text-lg font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                            {title}
                        </h3>
                        <p className="text-sm font-mono text-neutral-500 leading-relaxed">{message}</p>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={onClose}
                        className="w-full bg-yellow-300 hover:bg-yellow-200 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-6 py-3 transition-all hover:-translate-y-0.5 mt-2"
                    >
                        {actionLabel || "Continue →"}
                    </button>
                </div>
            </div>
        </div>
    );
}