import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Calendar, Clock, MapPin } from "lucide-react";

function Field({ label, icon: Icon, children }) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-neutral-500 mb-1.5">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </label>
            {children}
        </div>
    );
}

function TextInput({ value, onChange, placeholder, disabled }) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2 focus:outline-none transition-colors placeholder:text-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed ${focused ? "border-yellow-300/50" : "border-neutral-700 hover:border-neutral-600"
                }`}
        />
    );
}

function NumberInput({ value, onChange, placeholder, disabled }) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            type="number"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2 focus:outline-none transition-colors placeholder:text-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed ${focused ? "border-yellow-300/50" : "border-neutral-700 hover:border-neutral-600"
                }`}
        />
    );
}

function DurationLabel({ minutes }) {
    if (!minutes || minutes <= 0) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return (
        <span className="text-xs font-mono text-yellow-300/70">
            {h > 0 ? `${h}h ` : ""}{m > 0 ? `${m}m` : ""}
        </span>
    );
}

export function BookingTypesManager({ bookingTypesJson, setBookingTypesJson, setIsDirty, disabled }) {
    const [bookingTypes, setBookingTypes] = useState([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(bookingTypesJson);
            setBookingTypes(Array.isArray(parsed) ? parsed : []);
        } catch {
            setBookingTypes([]);
        }
    }, [bookingTypesJson]);

    const updateJson = useCallback((newTypes) => {
        setBookingTypesJson(JSON.stringify(newTypes, null, 2));
        setIsDirty(true);
    }, [setBookingTypesJson, setIsDirty]);

    const addType = () => {
        const newTypes = [...bookingTypes, { name: "", durationMin: 30, location: "" }];
        setBookingTypes(newTypes);
        updateJson(newTypes);
    };

    const updateType = (index, field, value) => {
        const newTypes = bookingTypes.map((t, i) => i === index ? { ...t, [field]: value } : t);
        setBookingTypes(newTypes);
        updateJson(newTypes);
    };

    const removeType = (index) => {
        const newTypes = bookingTypes.filter((_, i) => i !== index);
        setBookingTypes(newTypes);
        updateJson(newTypes);
    };

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-0.5">Services</div>
                    <div className="text-sm font-semibold text-neutral-200">Booking Types</div>
                    <p className="text-xs font-mono text-neutral-600 mt-0.5">
                        Define the types of appointments you offer to customers.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addType}
                    disabled={disabled}
                    className="flex items-center gap-1.5 bg-neutral-800 hover:bg-yellow-300/10 border border-neutral-700 hover:border-yellow-300/40 text-neutral-300 hover:text-yellow-300 text-xs font-mono uppercase tracking-widest px-3 py-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="h-3.5 w-3.5" /> Add Type
                </button>
            </div>

            {/* Empty state */}
            {bookingTypes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 bg-neutral-900 border border-dashed border-neutral-800 text-center">
                    <Calendar className="h-7 w-7 text-neutral-700 mb-3" />
                    <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-4">
                        No booking types defined yet
                    </p>
                    <button
                        type="button"
                        onClick={addType}
                        disabled={disabled}
                        className="flex items-center gap-1.5 bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-4 py-2 transition-all disabled:cursor-not-allowed"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add First Booking Type
                    </button>
                </div>
            )}

            {/* List */}
            {bookingTypes.length > 0 && (
                <div className="space-y-2">
                    {bookingTypes.map((type, index) => (
                        <div
                            key={index}
                            className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors px-4 py-4"
                        >
                            {/* Row number + remove */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-mono text-neutral-700 uppercase tracking-widest">
                                    Type #{index + 1}
                                    {type.name && (
                                        <span className="text-neutral-500 ml-2 normal-case">— {type.name}</span>
                                    )}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeType(index)}
                                    disabled={disabled}
                                    className="flex items-center justify-center w-7 h-7 border border-neutral-700 hover:border-red-500/40 hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Remove"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Field label="Service Name" icon={Calendar}>
                                    <TextInput
                                        value={type.name}
                                        onChange={(e) => updateType(index, "name", e.target.value)}
                                        placeholder="e.g., Consultation"
                                        disabled={disabled}
                                    />
                                </Field>

                                <Field label="Duration (min)" icon={Clock}>
                                    <div className="relative">
                                        <NumberInput
                                            value={type.durationMin}
                                            onChange={(e) => updateType(index, "durationMin", parseInt(e.target.value) || 0)}
                                            placeholder="30"
                                            disabled={disabled}
                                        />
                                        {type.durationMin > 0 && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <DurationLabel minutes={type.durationMin} />
                                            </div>
                                        )}
                                    </div>
                                </Field>

                                <Field label="Location" icon={MapPin}>
                                    <TextInput
                                        value={type.location}
                                        onChange={(e) => updateType(index, "location", e.target.value)}
                                        placeholder="In-person, Virtual, Phone"
                                        disabled={disabled}
                                    />
                                </Field>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}