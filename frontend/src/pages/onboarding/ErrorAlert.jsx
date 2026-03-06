import { XCircle, X } from "lucide-react";

export function ErrorAlert({ message, onDismiss }) {
    if (!message) return null;
    return (
        <div className="flex items-start gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3">
            <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-mono text-red-400 leading-relaxed">{message}</p>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="text-red-400/50 hover:text-red-400 transition-colors shrink-0"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}