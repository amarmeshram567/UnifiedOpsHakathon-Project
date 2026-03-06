import { Check } from "lucide-react";

export function StepIndicators({ current, total, stepLabels, completedSteps }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {stepLabels.map((label, i) => {
                const stepNum = i + 1;
                const isCompleted = completedSteps.includes(stepNum);
                const isCurrent = stepNum === current;

                return (
                    <div
                        key={label}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono transition-all border ${isCurrent
                            ? "bg-yellow-300/10 border-yellow-300/40 text-yellow-300"
                            : isCompleted
                                ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                                : "bg-neutral-900 border-neutral-800 text-neutral-600"
                            }`}
                    >
                        <span className={`flex h-4 w-4 items-center justify-center text-xs font-bold shrink-0 ${isCurrent ? "text-yellow-300" :
                            isCompleted ? "text-emerald-400" :
                                "text-neutral-700"
                            }`}>
                            {isCompleted
                                ? <Check className="h-3 w-3" />
                                : <span className="font-mono">{stepNum}</span>
                            }
                        </span>
                        <span className="hidden sm:inline uppercase tracking-widest text-xs">{label}</span>
                    </div>
                );
            })}
        </div>
    );
}