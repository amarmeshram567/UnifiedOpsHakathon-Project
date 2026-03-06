import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";

const FIELD_TYPES = ["text", "textarea", "email", "phone", "number"];

function DarkInput({ value, onChange, placeholder, disabled }) {
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

function DarkSelect({ value, onChange, disabled, children }) {
    return (
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-neutral-100 text-xs font-mono px-2.5 py-2 focus:outline-none focus:border-yellow-300/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
            {children}
        </select>
    );
}

function FieldLabel({ children }) {
    return <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-1.5">{children}</label>;
}

export function FormsManager({ templatesJson, setTemplatesJson, setIsDirty, disabled }) {
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(templatesJson);
            if (Array.isArray(parsed)) {
                const normalized = parsed.map(t => ({
                    ...t,
                    fieldsJson: t.fieldsJson && typeof t.fieldsJson === "object"
                        ? t.fieldsJson
                        : { fields: t.fields || [] }
                }));
                setTemplates(normalized);
            } else { setTemplates([]); }
        } catch { setTemplates([]); }
    }, [templatesJson]);

    const updateJson = useCallback((newTemplates) => {
        setTemplatesJson(JSON.stringify(newTemplates, null, 2));
        setIsDirty(true);
    }, [setTemplatesJson, setIsDirty]);

    const addTemplate = () => {
        const t = [...templates, { title: "", description: "", bookingTypeId: null, fieldsJson: { fields: [] } }];
        setTemplates(t); updateJson(t);
    };
    const updateTemplate = (i, field, value) => {
        const t = templates.map((tmpl, idx) => idx === i ? { ...tmpl, [field]: value } : tmpl);
        setTemplates(t); updateJson(t);
    };
    const removeTemplate = (i) => {
        const t = templates.filter((_, idx) => idx !== i);
        setTemplates(t); updateJson(t);
    };
    const addField = (ti) => {
        const t = templates.map((tmpl, i) => i === ti
            ? { ...tmpl, fieldsJson: { fields: [...tmpl.fieldsJson.fields, { key: "", label: "", type: "text", required: false }] } }
            : tmpl);
        setTemplates(t); updateJson(t);
    };
    const updateField = (ti, fi, field, value) => {
        const t = templates.map((tmpl, i) => i === ti
            ? { ...tmpl, fieldsJson: { fields: tmpl.fieldsJson.fields.map((f, j) => j === fi ? { ...f, [field]: value } : f) } }
            : tmpl);
        setTemplates(t); updateJson(t);
    };
    const removeField = (ti, fi) => {
        const t = templates.map((tmpl, i) => i === ti
            ? { ...tmpl, fieldsJson: { fields: tmpl.fieldsJson.fields.filter((_, j) => j !== fi) } }
            : tmpl);
        setTemplates(t); updateJson(t);
    };

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-0.5">Intake</div>
                    <div className="text-sm font-semibold text-neutral-200">Form Templates</div>
                    <p className="text-xs font-mono text-neutral-600 mt-0.5">
                        Intake forms sent after booking to collect additional info.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addTemplate}
                    disabled={disabled}
                    className="flex items-center gap-1.5 bg-neutral-800 hover:bg-yellow-300/10 border border-neutral-700 hover:border-yellow-300/40 text-neutral-300 hover:text-yellow-300 text-xs font-mono uppercase tracking-widest px-3 py-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus className="h-3.5 w-3.5" /> Add Form
                </button>
            </div>

            {/* Empty state */}
            {templates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 bg-neutral-900 border border-dashed border-neutral-800 text-center">
                    <FileText className="h-7 w-7 text-neutral-700 mb-3" />
                    <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-4">No form templates yet</p>
                    <button
                        type="button"
                        onClick={addTemplate}
                        disabled={disabled}
                        className="flex items-center gap-1.5 bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-4 py-2 transition-all disabled:cursor-not-allowed"
                    >
                        <Plus className="h-3.5 w-3.5" /> Create First Form
                    </button>
                </div>
            )}

            {/* Templates */}
            <div className="space-y-4">
                {templates.map((template, ti) => (
                    <div key={ti} className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">

                        {/* Template header bar */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800">
                            <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-yellow-300/50" />
                                <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                                    Form #{ti + 1}
                                    {template.title && (
                                        <span className="text-neutral-400 ml-2 normal-case font-normal">— {template.title}</span>
                                    )}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeTemplate(ti)}
                                disabled={disabled}
                                className="flex items-center gap-1.5 text-xs font-mono text-neutral-600 hover:text-red-400 border border-neutral-700 hover:border-red-500/40 hover:bg-red-500/10 px-2.5 py-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="h-3 w-3" /> Remove
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Title + description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <FieldLabel>Form Title</FieldLabel>
                                    <DarkInput
                                        value={template.title}
                                        onChange={(e) => updateTemplate(ti, "title", e.target.value)}
                                        placeholder="e.g., Client Intake Form"
                                        disabled={disabled}
                                    />
                                </div>
                                <div>
                                    <FieldLabel>Description</FieldLabel>
                                    <DarkInput
                                        value={template.description}
                                        onChange={(e) => updateTemplate(ti, "description", e.target.value)}
                                        placeholder="What this form collects..."
                                        disabled={disabled}
                                    />
                                </div>
                            </div>

                            {/* Fields subsection */}
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
                                    <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-semibold">
                                        Fields
                                        <span className="ml-2 text-neutral-700">{template.fieldsJson?.fields?.length ?? 0}</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => addField(ti)}
                                        disabled={disabled}
                                        className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-yellow-300 border border-neutral-700 hover:border-yellow-300/40 px-2.5 py-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="h-3 w-3" /> Add Field
                                    </button>
                                </div>

                                {/* Fields empty */}
                                {template.fieldsJson?.fields?.length === 0 && (
                                    <div className="flex items-center justify-center py-6 border border-dashed border-neutral-800">
                                        <button
                                            type="button"
                                            onClick={() => addField(ti)}
                                            disabled={disabled}
                                            className="text-xs font-mono text-yellow-300/50 hover:text-yellow-300 transition-colors disabled:opacity-40"
                                        >
                                            + Add first field
                                        </button>
                                    </div>
                                )}

                                {/* Fields list */}
                                <div className="space-y-2">
                                    {(template.fieldsJson?.fields || []).map((field, fi) => (
                                        <div
                                            key={fi}
                                            className="grid grid-cols-[1fr_1fr_100px_60px_32px] gap-2 items-end bg-neutral-800/50 border border-neutral-700/50 px-3 py-3"
                                        >
                                            <div>
                                                <FieldLabel>Key</FieldLabel>
                                                <DarkInput
                                                    value={field.key}
                                                    onChange={(e) => updateField(ti, fi, "key", e.target.value)}
                                                    placeholder="unique_key"
                                                    disabled={disabled}
                                                />
                                            </div>
                                            <div>
                                                <FieldLabel>Question</FieldLabel>
                                                <DarkInput
                                                    value={field.label}
                                                    onChange={(e) => updateField(ti, fi, "label", e.target.value)}
                                                    placeholder="What is your question?"
                                                    disabled={disabled}
                                                />
                                            </div>
                                            <div>
                                                <FieldLabel>Type</FieldLabel>
                                                <DarkSelect
                                                    value={field.type}
                                                    onChange={(e) => updateField(ti, fi, "type", e.target.value)}
                                                    disabled={disabled}
                                                >
                                                    {FIELD_TYPES.map((t) => (
                                                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                                    ))}
                                                </DarkSelect>
                                            </div>

                                            {/* Required toggle */}
                                            <div className="text-center">
                                                <FieldLabel>Req.</FieldLabel>
                                                <div className="flex items-center justify-center h-8">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateField(ti, fi, "required", !field.required)}
                                                        disabled={disabled}
                                                        className={`w-8 h-4 rounded-full transition-all relative disabled:opacity-40 ${field.required ? "bg-yellow-300" : "bg-neutral-700"
                                                            }`}
                                                    >
                                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200 ${field.required ? "left-4" : "left-0.5"
                                                            }`} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Remove field */}
                                            <div>
                                                <div className="h-[26px]" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeField(ti, fi)}
                                                    disabled={disabled}
                                                    className="flex items-center justify-center w-8 h-8 border border-neutral-700 hover:border-red-500/40 hover:bg-red-500/10 text-neutral-600 hover:text-red-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}