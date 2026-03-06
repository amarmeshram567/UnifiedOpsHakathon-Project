import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/app.js";
import toast from "react-hot-toast";
import { useApp } from "../../context/AppContext.jsx";
import { ProgressBar } from "../onboarding/ProgressBar.jsx";
import { StepIndicators } from "../onboarding/StepIndicators.jsx";
import { ErrorAlert } from "../onboarding/ErrorAlert.jsx";
import { SuccessModal } from "../onboarding/SuccessModal.jsx";
import { ActivationConfirmDialog } from "../onboarding/ActivationConfirmDialog.jsx";
import { UnsavedChangesWarning } from "../onboarding/UnsavedChangesWarning.jsx";
import { BookingTypesManager } from "../onboarding/BookingTypesManager.jsx";
import { InventoryManager } from "../onboarding/InventoryManager.jsx";
import { FormsManager } from "../onboarding/FormsManager.jsx";
import { CreateStaff } from "../onboarding/CreateStaff.jsx";
import { AvailabilityManager } from "../onboarding/AvailabilityManager.jsx";
import { ChevronLeft, ChevronRight, CheckCircle, Mail, MessageSquare, AlertTriangle, Zap, Info } from "lucide-react";

const ValidationRules = {
    email: (value) => {
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email format is invalid";
        return null;
    },
    phone: (value) => {
        if (!value) return "Phone number is required";
        if (!/^\+?[\d\s\-\(\)]{10,}$/.test(value)) return "Phone format is invalid";
        return null;
    },
};

function SectionTitle({ eyebrow, title, description }) {
    return (
        <div className="mb-6">
            {eyebrow && <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">{eyebrow}</div>}
            <h2 className="text-xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>{title}</h2>
            {description && <p className="text-neutral-500 text-sm mt-1.5 leading-relaxed">{description}</p>}
        </div>
    );
}

function DarkInput({ label, description, value, onChange, placeholder, type = "text", error, disabled }) {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            {label && <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-1.5">{label}</label>}
            {description && <p className="text-xs font-mono text-neutral-700 mb-1.5">{description}</p>}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2.5 focus:outline-none transition-colors placeholder:text-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed ${error ? "border-red-500/50" : focused ? "border-yellow-300/50" : "border-neutral-700 hover:border-neutral-600"
                    }`}
            />
            {error && <p className="text-xs font-mono text-red-400 mt-1.5 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{error}</p>}
        </div>
    );
}

function DarkTextarea({ label, description, value, onChange, placeholder, rows = 3, disabled }) {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            {label && <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-1.5">{label}</label>}
            {description && <p className="text-xs font-mono text-neutral-700 mb-1.5">{description}</p>}
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                disabled={disabled}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2.5 focus:outline-none transition-colors placeholder:text-neutral-600 resize-none disabled:opacity-40 disabled:cursor-not-allowed ${focused ? "border-yellow-300/50" : "border-neutral-700 hover:border-neutral-600"
                    }`}
            />
        </div>
    );
}

function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`w-10 h-5 rounded-full transition-all relative disabled:opacity-40 disabled:cursor-not-allowed ${checked ? "bg-yellow-300" : "bg-neutral-700"}`}
        >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${checked ? "left-5" : "left-0.5"}`} />
        </button>
    );
}

function InfoBox({ children, variant = "info" }) {
    const styles = {
        info: "bg-sky-400/10 border-sky-400/20 text-sky-400",
        success: "bg-emerald-400/10 border-emerald-400/20 text-emerald-400",
        warning: "bg-amber-400/10 border-amber-400/20 text-amber-400",
        danger: "bg-red-400/10 border-red-400/20 text-red-400",
    };
    const icons = {
        info: <Info className="h-4 w-4 shrink-0 mt-0.5" />,
        success: <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />,
        warning: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />,
        danger: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />,
    };
    return (
        <div className={`flex items-start gap-3 border px-4 py-3 text-sm font-mono ${styles[variant]}`}>
            {icons[variant]}
            <div>{children}</div>
        </div>
    );
}

function ChecklistItem({ done, children }) {
    return (
        <div className={`flex items-center gap-2.5 text-sm font-mono ${done ? "text-emerald-400" : "text-neutral-600"}`}>
            {done
                ? <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                : <div className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0" />
            }
            {children}
        </div>
    );
}

export default function Onboarding() {
    const navigate = useNavigate();
    const { workspaceId, workspace, setup, isOwner, isActive, refreshSetup } = useApp();

    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showActivationConfirm, setShowActivationConfirm] = useState(false);

    const step = Math.min(8, Math.max(1, currentStep || 1));
    const totalSteps = 8;
    const stepLabels = ["Workspace", "Email & SMS", "Contact Form", "Booking Setup", "Forms", "Inventory", "Staff", "Activate"];

    const channelEmail = useMemo(() => (setup?.channels || []).find((c) => c.type === "EMAIL") || null, [setup]);
    const channelSms = useMemo(() => (setup?.channels || []).find((c) => c.type === "SMS") || null, [setup]);

    const [emailEnabled, setEmailEnabled] = useState(channelEmail?.enabled ?? true);
    const [fromEmail, setFromEmail] = useState(channelEmail?.fromEmail ?? "demo@service.com");
    const [emailError, setEmailError] = useState(null);
    const [smsEnabled, setSmsEnabled] = useState(channelSms?.enabled ?? false);
    const [fromPhone, setFromPhone] = useState(channelSms?.fromPhone ?? "+10000000000");
    const [phoneError, setPhoneError] = useState(null);
    const [contactFormEnabled, setContactFormEnabled] = useState(setup?.contactForm?.enabled ?? true);
    const [welcomeText, setWelcomeText] = useState(setup?.contactForm?.welcomeText ?? "Thanks! We'll reply soon.");

    const [bookingTypesJson, setBookingTypesJson] = useState(
        JSON.stringify((setup?.bookingTypes || [{ name: "Consultation", durationMin: 30, location: "In-person" }])
            .map((b) => ({ name: b.name, durationMin: b.durationMin, location: b.location || "" })), null, 2)
    );
    const [availabilityJson, setAvailabilityJson] = useState(
        JSON.stringify(setup?.availability?.length ? setup.availability : [
            { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
        ], null, 2)
    );
    const [templatesJson, setTemplatesJson] = useState(
        JSON.stringify(setup?.templates?.length ? setup.templates : [{
            title: "Intake Form", description: "Basic intake details", bookingTypeId: null,
            fieldsJson: {
                fields: [
                    { key: "goal", label: "What are you looking for?", type: "text", required: true },
                    { key: "notes", label: "Any additional notes?", type: "textarea", required: false },
                ]
            },
        }], null, 2)
    );
    const [inventoryJson, setInventoryJson] = useState(
        JSON.stringify(setup?.inventory?.length
            ? setup.inventory.map((i) => ({ name: i.name, unit: i.unit || "", onHand: i.onHand, lowStockAt: i.lowStockAt }))
            : [{ name: "Intake Kit", unit: "kit", onHand: 10, lowStockAt: 3 }, { name: "Consent Form Print", unit: "sheet", onHand: 100, lowStockAt: 20 }],
            null, 2)
    );

    useEffect(() => {
        setIsDirty(false);
        setEmailError(null); setPhoneError(null); setErr(null);
    }, [currentStep]);

    const isChannelsValid = useCallback(() => {
        if (!emailEnabled && !smsEnabled) { setErr("At least one channel must be enabled"); return false; }
        let valid = true;
        if (emailEnabled) { const e = ValidationRules.email(fromEmail); if (e) { setEmailError(e); valid = false; } }
        if (smsEnabled) { const p = ValidationRules.phone(fromPhone); if (p) { setPhoneError(p); valid = false; } }
        return valid;
    }, [emailEnabled, smsEnabled, fromEmail, fromPhone]);

    const isBookingSetupValid = useCallback(() => {
        try {
            const bt = JSON.parse(bookingTypesJson);
            if (!Array.isArray(bt) || bt.length === 0) { setErr("At least one booking type is required"); return false; }
            const av = JSON.parse(availabilityJson);
            if (!Array.isArray(av) || av.length === 0) { setErr("At least one availability slot is required"); return false; }
            return true;
        } catch { setErr("Invalid JSON format"); return false; }
    }, [bookingTypesJson, availabilityJson]);

    async function activate() {
        try {
            setShowActivationConfirm(false);
            setSaving(true);
            setErr(null);
            await api.post(`/api/workspaces/${workspaceId}/activate`);
            await refreshSetup();
            toast.success("Workspace activated!");
            navigate("/app/dashboard", { replace: true });
        } catch (e) {
            setErr(e.response?.data?.error || e.message || "Failed to activate");
        } finally { setSaving(false); }
    }

    async function handleStepAction(step) {
        setSaving(true); setErr(null);
        try {
            switch (step) {
                case 2:
                    if (!isChannelsValid()) throw new Error("Fix validation errors");
                    await api.post(`/api/workspaces/${workspaceId}/onboarding/channels`, { email: { enabled: emailEnabled, fromEmail }, sms: { enabled: smsEnabled, fromPhone } });
                    toast.success("Channels saved");
                    break;
                case 3:
                    await api.post(`/api/workspaces/${workspaceId}/onboarding/contact-form`, { enabled: contactFormEnabled, welcomeText });
                    toast.success("Contact form saved");
                    break;
                case 4:
                    if (!isBookingSetupValid()) throw new Error("Fix validation errors");
                    await api.post(`/api/workspaces/${workspaceId}/onboarding/booking-setup`, { bookingTypes: JSON.parse(bookingTypesJson), availability: JSON.parse(availabilityJson) });
                    toast.success("Booking setup saved");
                    break;
                case 5:
                    await api.post(`/api/workspaces/${workspaceId}/onboarding/forms`, { templates: JSON.parse(templatesJson) });
                    toast.success("Forms saved");
                    break;
                case 6:
                    await api.post(`/api/workspaces/${workspaceId}/onboarding/inventory`, { items: JSON.parse(inventoryJson) });
                    toast.success("Inventory saved");
                    break;
                case 8:
                    setShowActivationConfirm(true);
                    setSaving(false);
                    return;
                default: break;
            }
            await refreshSetup();
            setIsDirty(false);
            if (step < totalSteps) setCurrentStep(step + 1);
        } catch (e) {
            const msg = e.response?.data?.error || e.message || "Failed to save";
            setErr(typeof msg === "object" ? JSON.stringify(msg) : msg);
        } finally { setSaving(false); }
    }

    const completedSteps = useMemo(() => {
        const c = [];
        if (workspace) c.push(1);
        if ((setup?.channels || []).some((ch) => ch.enabled)) c.push(2);
        if (setup?.contactForm?.enabled !== undefined) c.push(3);
        if ((setup?.bookingTypes || []).length > 0) c.push(4);
        if ((setup?.templates || []).length > 0) c.push(5);
        try { const li = inventoryJson ? JSON.parse(inventoryJson) : []; if ((setup?.inventory || []).length > 0 || (Array.isArray(li) && li.length > 0)) c.push(6); } catch { }
        if ((setup?.staff || []).length > 0) c.push(7);
        if (isActive) c.push(8);
        return c;
    }, [workspace, setup, isActive, inventoryJson]);

    if (!workspace) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Please select a workspace first.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-5">
            <UnsavedChangesWarning isDirty={isDirty} />

            {/* Page header */}
            <div className="border-b border-neutral-800 pb-5 flex items-start justify-between">
                <div>
                    <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Configuration</div>
                    <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                        Setup Wizard
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        {isActive ? "Your workspace is active. You can edit settings anytime." : "Set up your workspace in a few simple steps."}
                    </p>
                </div>
                {isActive && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 border bg-emerald-400/10 border-emerald-400/20 text-emerald-400">
                        <CheckCircle className="h-3 w-3" /> ACTIVE
                    </span>
                )}
            </div>

            {/* Progress */}
            <div className="bg-neutral-900 border border-neutral-800 px-5 py-4 space-y-4">
                <ProgressBar current={step} total={totalSteps} label={`Step ${step} of ${totalSteps}`} />
                <StepIndicators current={step} total={totalSteps} stepLabels={stepLabels} completedSteps={completedSteps} />
            </div>

            {/* Owner notice */}
            {!isOwner && (
                <InfoBox variant="warning">
                    <p className="font-semibold mb-0.5">Owner-Only Access</p>
                    <p className="text-xs opacity-80">Only workspace owners can complete setup. Staff can use bookings, forms, inbox, and inventory.</p>
                </InfoBox>
            )}

            {/* Error */}
            {err && <ErrorAlert message={err} onDismiss={() => setErr(null)} />}

            {/* Step content */}
            <div className="bg-neutral-900 border border-neutral-800 p-6">

                {/* Step 1 */}
                {step === 1 && (
                    <div className="space-y-5">
                        <SectionTitle eyebrow="Step 1" title="Welcome to Your Workspace!" description="This wizard will guide you through setting up your workspace. Each step builds on the previous one." />

                        <div className="bg-neutral-800/60 border border-neutral-700/50 p-4 space-y-2">
                            <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-3">Workspace Details</div>
                            <div className="flex justify-between text-sm font-mono">
                                <span className="text-neutral-500">Name</span>
                                <span className="text-neutral-200 font-semibold">{workspace?.name || "—"}</span>
                            </div>
                            <div className="flex justify-between text-sm font-mono">
                                <span className="text-neutral-500">Status</span>
                                <span className={isActive ? "text-emerald-400" : "text-amber-400"}>{isActive ? "Active" : "Setup in Progress"}</span>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-3">What you'll set up</div>
                            <div className="space-y-2">
                                {[
                                    ["Email & SMS", "How customers receive notifications"],
                                    ["Contact Form", "Let customers reach you publicly"],
                                    ["Bookings", "Appointment types and your availability"],
                                    ["Forms", "Intake forms after booking"],
                                    ["Inventory", "Track resources and supplies"],
                                    ["Staff", "Add team members"],
                                    ["Activation", "Go live with public links"],
                                ].map(([title, desc]) => (
                                    <div key={title} className="flex items-start gap-2.5">
                                        <CheckCircle className="h-3.5 w-3.5 text-yellow-300/50 mt-0.5 shrink-0" />
                                        <span className="text-sm font-mono text-neutral-400">
                                            <span className="text-neutral-200">{title}</span> — {desc}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <InfoBox variant="info">
                            You can edit any step later. Start with the basics and refine as you go.
                        </InfoBox>
                    </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div className="space-y-5">
                        <SectionTitle eyebrow="Step 2" title="Communication Channels" description="Choose how customers receive notifications. At least one channel must be enabled." />

                        {/* Email */}
                        <div className={`border p-4 space-y-4 transition-colors ${emailEnabled ? "border-neutral-700 bg-neutral-800/40" : "border-neutral-800"}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-neutral-400" />
                                    <div>
                                        <div className="text-sm font-semibold text-neutral-200">Email Notifications</div>
                                        <div className="text-xs font-mono text-neutral-600">Send booking confirmations via email</div>
                                    </div>
                                </div>
                                <Toggle checked={emailEnabled} onChange={(v) => { setEmailEnabled(v); setIsDirty(true); }} disabled={!isOwner} />
                            </div>
                            {emailEnabled && (
                                <DarkInput
                                    label="Sender Email"
                                    description="Customers will see notifications from this address"
                                    value={fromEmail}
                                    onChange={(e) => { setFromEmail(e.target.value); setIsDirty(true); }}
                                    placeholder="your@email.com"
                                    error={emailError}
                                    disabled={!isOwner}
                                />
                            )}
                        </div>

                        {/* SMS */}
                        <div className={`border p-4 space-y-4 transition-colors ${smsEnabled ? "border-neutral-700 bg-neutral-800/40" : "border-neutral-800"}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-4 w-4 text-neutral-400" />
                                    <div>
                                        <div className="text-sm font-semibold text-neutral-200">SMS Notifications</div>
                                        <div className="text-xs font-mono text-neutral-600">Send texts for time-sensitive updates</div>
                                    </div>
                                </div>
                                <Toggle checked={smsEnabled} onChange={(v) => { setSmsEnabled(v); setIsDirty(true); }} disabled={!isOwner} />
                            </div>
                            {smsEnabled && (
                                <DarkInput
                                    label="Sender Phone"
                                    description="E.164 format — e.g. +1234567890"
                                    value={fromPhone}
                                    onChange={(e) => { setFromPhone(e.target.value); setIsDirty(true); }}
                                    placeholder="+1234567890"
                                    error={phoneError}
                                    disabled={!isOwner}
                                />
                            )}
                        </div>

                        {!emailEnabled && !smsEnabled && (
                            <InfoBox variant="danger">At least one communication channel must be enabled to proceed.</InfoBox>
                        )}
                    </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <div className="space-y-5">
                        <SectionTitle eyebrow="Step 3" title="Contact Form Setup" description="Enable a public contact form so customers can reach you. Submissions create conversations in your Inbox." />

                        <div className={`border p-4 space-y-4 transition-colors ${contactFormEnabled ? "border-neutral-700 bg-neutral-800/40" : "border-neutral-800"}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-neutral-200">Enable Public Contact Form</div>
                                    <div className="text-xs font-mono text-neutral-600 mt-0.5">Creates a conversation in Inbox on submission</div>
                                </div>
                                <Toggle checked={contactFormEnabled} onChange={(v) => { setContactFormEnabled(v); setIsDirty(true); }} disabled={!isOwner} />
                            </div>
                            {contactFormEnabled && (
                                <DarkTextarea
                                    label="Welcome Message"
                                    description="Shown to the customer after form submission"
                                    value={welcomeText}
                                    onChange={(e) => { setWelcomeText(e.target.value); setIsDirty(true); }}
                                    placeholder="Thanks for reaching out! We'll get back to you soon."
                                    rows={3}
                                    disabled={!isOwner}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                    <div className="space-y-6">
                        <SectionTitle eyebrow="Step 4" title="Booking Setup" description="Define what types of bookings you offer and your availability. This powers your public booking page." />
                        <BookingTypesManager bookingTypesJson={bookingTypesJson} setBookingTypesJson={setBookingTypesJson} setIsDirty={setIsDirty} disabled={!isOwner} />
                        <div className="border-t border-neutral-800 pt-6">
                            <AvailabilityManager availabilityJson={availabilityJson} setAvailabilityJson={setAvailabilityJson} setIsDirty={setIsDirty} disabled={!isOwner} />
                        </div>
                    </div>
                )}

                {/* Step 5 */}
                {step === 5 && (
                    <div className="space-y-5">
                        <SectionTitle eyebrow="Step 5" title="Post-Booking Forms" description="Intake forms automatically sent after someone books. Collect additional info from clients." />
                        <FormsManager templatesJson={templatesJson} setTemplatesJson={setTemplatesJson} setIsDirty={setIsDirty} disabled={!isOwner} />
                    </div>
                )}

                {/* Step 6 */}
                {step === 6 && (
                    <div className="space-y-5">
                        <SectionTitle eyebrow="Step 6" title="Inventory Management" description="Track supplies and resources. Low-stock alerts help you reorder before running out." />
                        <InventoryManager inventoryJson={inventoryJson} setInventoryJson={setInventoryJson} setIsDirty={setIsDirty} disabled={!isOwner} />
                    </div>
                )}

                {/* Step 7 */}
                {step === 7 && (
                    <div className="space-y-5">
                        <SectionTitle eyebrow="Step 7" title="Add Staff Members" description="Create accounts for team members. They can manage bookings, forms, inbox, and inventory." />
                        <CreateStaff onStaffCreated={() => setIsDirty(true)} isOwner={isOwner} />
                    </div>
                )}

                {/* Step 8 */}
                {step === 8 && (
                    <div className="space-y-5">
                        <SectionTitle eyebrow="Step 8" title="Activate Your Workspace" description="Once activated, your public links go live and customers can interact with your workspace." />

                        <div className="bg-neutral-800/60 border border-neutral-700/50 p-4 space-y-3">
                            <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">Prerequisites</div>
                            <ChecklistItem done={emailEnabled || smsEnabled}>At least one communication channel enabled</ChecklistItem>
                            <ChecklistItem done={(() => { try { return JSON.parse(bookingTypesJson).length > 0; } catch { return false; } })()}>
                                At least one booking type defined
                            </ChecklistItem>
                            <ChecklistItem done={(() => { try { return JSON.parse(availabilityJson).length > 0; } catch { return false; } })()}>
                                Availability is set
                            </ChecklistItem>
                        </div>

                        <InfoBox variant="success">
                            <p className="font-semibold mb-1">After activation you can:</p>
                            <ul className="space-y-0.5 text-xs opacity-80">
                                <li>Share public booking links with customers</li>
                                <li>Accept and manage bookings</li>
                                <li>Receive contact form submissions</li>
                                <li>Still edit any settings</li>
                            </ul>
                        </InfoBox>

                        <InfoBox variant="warning">
                            This action cannot be undone. Your workspace will go live immediately.
                        </InfoBox>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={() => setCurrentStep(Math.max(1, step - 1))}
                    disabled={step === 1 || saving || !isOwner}
                    className="flex items-center gap-2 border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-200 text-xs font-mono uppercase tracking-widest px-5 py-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                </button>

                <div className="flex items-center gap-2 text-xs font-mono text-neutral-700">
                    {Array.from({ length: totalSteps }, (_, i) => (
                        <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i + 1 === step ? "bg-yellow-300 scale-125" : completedSteps.includes(i + 1) ? "bg-emerald-500" : "bg-neutral-700"}`}
                        />
                    ))}
                </div>

                <button
                    onClick={() => handleStepAction(step)}
                    disabled={!isOwner || saving || (step === 8 && isActive)}
                    className="flex items-center gap-2 bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-5 py-2.5 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <><span className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" /> Saving...</>
                    ) : step === 8 ? (
                        isActive ? "Workspace Active" : <><Zap className="h-3.5 w-3.5" /> Activate</>
                    ) : (
                        <>Save & Continue <ChevronRight className="h-3.5 w-3.5" /></>
                    )}
                </button>
            </div>

            {/* Modals */}
            <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Setup Complete!" message="Your workspace is ready to be activated." actionLabel="Next" />
            <ActivationConfirmDialog isOpen={showActivationConfirm} onConfirm={activate} onCancel={() => setShowActivationConfirm(false)} isLoading={saving} />
        </div>
    );
}