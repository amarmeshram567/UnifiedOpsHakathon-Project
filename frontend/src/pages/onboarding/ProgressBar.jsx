

export function ProgressBar({ current, total, label }) {
    const percentage = Math.round(((current - 1) / (total - 1)) * 100);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-yellow-300">{percentage}%</span>
                    <span className="text-xs font-mono text-neutral-700">
                        {current}/{total}
                    </span>
                </div>
            </div>
            <div className="h-0.5 w-full bg-neutral-800 overflow-hidden">
                <div
                    className="h-full bg-yellow-300 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}