import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_SHORT = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function TimeInput({ label, value, onChange, disabled }) {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-1.5">{label}</label>
            <input
                type="time"
                value={value}
                onChange={onChange}
                disabled={disabled}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2 focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${focused ? "border-yellow-300/50" : "border-neutral-700 hover:border-neutral-600"
                    }`}
            />
        </div>
    );
}

export function AvailabilityManager({ availabilityJson, setAvailabilityJson, setIsDirty, disabled }) {
    const [availability, setAvailability] = useState([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(availabilityJson);
            setAvailability(Array.isArray(parsed) ? parsed : []);
        } catch {
            setAvailability([]);
        }
    }, [availabilityJson]);

    const updateJson = useCallback((newAvailability) => {
        setAvailabilityJson(JSON.stringify(newAvailability, null, 2));
        setIsDirty(true);
    }, [setAvailabilityJson, setIsDirty]);

    const addSlot = () => {
        const newSlots = [...availability, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }];
        setAvailability(newSlots);
        updateJson(newSlots);
    };

    const updateSlot = (index, field, value) => {
        const newSlots = availability.map((slot, i) => i === index ? { ...slot, [field]: value } : slot);
        setAvailability(newSlots);
        updateJson(newSlots);
    };

    const removeSlot = (index) => {
        const newSlots = availability.filter((_, i) => i !== index);
        setAvailability(newSlots);
        updateJson(newSlots);
    };

    // Group slots by day for a visual summary
    const usedDays = new Set(availability.map((s) => s.dayOfWeek));

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-0.5">Schedule</div>
                    <div className="text-sm font-semibold text-neutral-200">Availability</div>
                    <p className="text-xs font-mono text-neutral-600 mt-0.5">Set your working hours for each day of the week.</p>
                </div>
                <button
                    type="button"
                    onClick={addSlot}
                    disabled={disabled}
                    className="flex items-center gap-1.5 bg-neutral-800 hover:bg-yellow-300/10 border border-neutral-700 hover:border-yellow-300/40 text-neutral-300 hover:text-yellow-300 text-xs font-mono uppercase tracking-widest px-3 py-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="h-3.5 w-3.5" /> Add Slot
                </button>
            </div>

            {/* Day pills summary */}
            {availability.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                    {DAY_SHORT.slice(1).map((day, i) => {
                        const dow = i + 1;
                        const active = usedDays.has(dow);
                        return (
                            <span key={dow} className={`text-xs font-mono px-2.5 py-1 border transition-all ${active
                                ? "bg-yellow-300/10 border-yellow-300/30 text-yellow-300"
                                : "bg-neutral-900 border-neutral-800 text-neutral-700"
                                }`}>
                                {day}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Empty state */}
            {availability.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 bg-neutral-900 border border-neutral-800 border-dashed text-center">
                    <Clock className="h-7 w-7 text-neutral-700 mb-3" />
                    <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-4">No availability set yet</p>
                    <button
                        type="button"
                        onClick={addSlot}
                        disabled={disabled}
                        className="flex items-center gap-1.5 bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-4 py-2 transition-all disabled:cursor-not-allowed"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add First Time Slot
                    </button>
                </div>
            )}

            {/* Slots */}
            {availability.length > 0 && (
                <div className="space-y-2">
                    {availability.map((slot, index) => (
                        <div
                            key={index}
                            className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors px-4 py-4"
                        >
                            <div className="grid grid-cols-[140px_1fr_1fr_auto] gap-3 items-end">

                                {/* Day */}
                                <div>
                                    <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-1.5">Day</label>
                                    <select
                                        value={slot.dayOfWeek}
                                        onChange={(e) => updateSlot(index, "dayOfWeek", parseInt(e.target.value))}
                                        disabled={disabled}
                                        className="w-full bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-neutral-100 text-sm font-mono px-3 py-2 focus:outline-none focus:border-yellow-300/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {DAY_NAMES.map((day, i) =>
                                            i > 0 && <option key={i} value={i}>{day}</option>
                                        )}
                                    </select>
                                </div>

                                {/* Start time */}
                                <TimeInput
                                    label="Start Time"
                                    value={slot.startTime}
                                    onChange={(e) => updateSlot(index, "startTime", e.target.value)}
                                    disabled={disabled}
                                />

                                {/* End time */}
                                <TimeInput
                                    label="End Time"
                                    value={slot.endTime}
                                    onChange={(e) => updateSlot(index, "endTime", e.target.value)}
                                    disabled={disabled}
                                />

                                {/* Remove */}
                                <button
                                    type="button"
                                    onClick={() => removeSlot(index)}
                                    disabled={disabled}
                                    className="flex items-center justify-center w-8 h-8 border border-neutral-700 hover:border-red-500/40 hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
                                    title="Remove slot"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {/* Duration hint */}
                            {slot.startTime && slot.endTime && (
                                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-mono text-neutral-600">
                                    <Clock className="h-3 w-3" />
                                    {(() => {
                                        const [sh, sm] = slot.startTime.split(":").map(Number);
                                        const [eh, em] = slot.endTime.split(":").map(Number);
                                        const mins = (eh * 60 + em) - (sh * 60 + sm);
                                        if (mins <= 0) return <span className="text-red-400">Invalid range</span>;
                                        const h = Math.floor(mins / 60);
                                        const m = mins % 60;
                                        return <span>{h > 0 ? `${h}h ` : ""}{m > 0 ? `${m}m` : ""} window</span>;
                                    })()}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}