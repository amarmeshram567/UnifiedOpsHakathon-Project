// import toast from "react-hot-toast";
// import api from "../../lib/app";
// import { useCallback, useState } from "react";
// import { useApp } from "../../context/AppContext";
// import { UserPlus, XCircle, AlertCircle } from "lucide-react";

// const ValidationRules = {
//     email: (value) => {
//         if (!value) return "Email is required";
//         if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
//         return null;
//     },
// };

// function Field({ label, description, error, children }) {
//     return (
//         <div>
//             <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-1">{label}</label>
//             {description && <p className="text-xs font-mono text-neutral-700 mb-1.5">{description}</p>}
//             {children}
//             {error && (
//                 <div className="flex items-center gap-1.5 mt-1.5 text-xs font-mono text-red-400">
//                     <AlertCircle className="h-3 w-3 shrink-0" /> {error}
//                 </div>
//             )}
//         </div>
//     );
// }

// function StyledInput({ value, onChange, placeholder, type = "text", disabled, hasError }) {
//     const [focused, setFocused] = useState(false);
//     return (
//         <input
//             type={type}
//             value={value}
//             onChange={onChange}
//             placeholder={placeholder}
//             disabled={disabled}
//             onFocus={() => setFocused(true)}
//             onBlur={() => setFocused(false)}
//             className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2.5 focus:outline-none transition-colors placeholder:text-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed ${hasError
//                 ? "border-red-500/50 bg-red-500/5"
//                 : focused
//                     ? "border-yellow-300/50 bg-neutral-700/50"
//                     : "border-neutral-700 hover:border-neutral-600"
//                 }`}
//         />
//     );
// }

// export function CreateStaff({ onStaffCreated, isOwner: propIsOwner }) {
//     const { workspaceId, refreshSetup, isOwner: contextIsOwner } = useApp();
//     const isOwner = propIsOwner !== undefined ? propIsOwner : contextIsOwner;

//     const [name, setName] = useState("");
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [saving, setSaving] = useState(false);
//     const [err, setErr] = useState(null);
//     const [nameError, setNameError] = useState(null);
//     const [emailError, setEmailError] = useState(null);
//     const [passwordError, setPasswordError] = useState(null);

//     const validateForm = useCallback(() => {
//         let valid = true;
//         setNameError(null); setEmailError(null); setPasswordError(null);
//         if (!name.trim()) { setNameError("Name is required"); valid = false; }
//         const emailErr = ValidationRules.email(email);
//         if (emailErr) { setEmailError(emailErr); valid = false; }
//         if (!password || password.length < 8) { setPasswordError("Minimum 8 characters"); valid = false; }
//         return valid;
//     }, [name, email, password]);

//     const handleCreate = async () => {
//         if (!validateForm()) return;
//         setSaving(true);
//         setErr(null);
//         try {
//             await api.post(`/api/workspaces/${workspaceId}/staff/create`, { name, email, password });
//             toast.success(`Staff user "${name}" created!`);
//             await refreshSetup();
//             onStaffCreated?.();
//             setName(""); setEmail(""); setPassword("");
//         } catch (e) {
//             setErr(e.response?.data?.error || e.message || "Failed to create staff");
//         } finally {
//             setSaving(false);
//         }
//     };

//     return (
//         <div className="space-y-5">

//             {/* Error banner */}
//             {err && (
//                 <div className="flex items-start gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3">
//                     <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
//                     <span className="text-red-400 text-sm font-mono flex-1">{err}</span>
//                     <button onClick={() => setErr(null)} className="text-red-400/60 hover:text-red-400 transition-colors">
//                         <XCircle className="h-3.5 w-3.5" />
//                     </button>
//                 </div>
//             )}

//             {/* Fields */}
//             <div className="space-y-4">
//                 <Field label="Full Name" description="The staff member's display name" error={nameError}>
//                     <StyledInput
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                         placeholder="Jane Smith"
//                         disabled={!isOwner || saving}
//                         hasError={!!nameError}
//                     />
//                 </Field>

//                 <Field label="Email Address" description="Used for login — must be unique" error={emailError}>
//                     <StyledInput
//                         type="email"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         placeholder="jane@company.com"
//                         disabled={!isOwner || saving}
//                         hasError={!!emailError}
//                     />
//                 </Field>

//                 <Field label="Password" description="Min. 8 characters — staff can change after first login" error={passwordError}>
//                     <StyledInput
//                         type="password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         placeholder="••••••••"
//                         disabled={!isOwner || saving}
//                         hasError={!!passwordError}
//                     />
//                 </Field>
//             </div>

//             {/* Submit */}
//             <button
//                 onClick={handleCreate}
//                 disabled={!isOwner || saving}
//                 className="w-full flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-6 py-3 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed"
//             >
//                 {saving ? (
//                     <><span className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" /> Creating...</>
//                 ) : (
//                     <><UserPlus className="h-3.5 w-3.5" /> Create Staff User</>
//                 )}
//             </button>

//             {/* Owner guard note */}
//             {!isOwner && (
//                 <p className="text-center text-xs font-mono text-neutral-600">
//                     Only workspace owners can create staff accounts.
//                 </p>
//             )}
//         </div>
//     );
// }





import toast from "react-hot-toast";
import api from "../../lib/app";
import { useCallback, useState } from "react";
import { useApp } from "../../context/AppContext";
import { UserPlus, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

const ValidationRules = {
    email: (value) => {
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
        return null;
    },
};

function Field({ label, description, error, children }) {
    return (
        <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-500 mb-1">{label}</label>
            {description && <p className="text-xs font-mono text-neutral-700 mb-1.5">{description}</p>}
            {children}
            {error && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-mono text-red-400">
                    <AlertCircle className="h-3 w-3 shrink-0" /> {error}
                </div>
            )}
        </div>
    );
}

function StyledInput({ value, onChange, placeholder, type = "text", disabled, hasError }) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full bg-neutral-800 border text-neutral-100 text-sm font-mono px-3 py-2.5 focus:outline-none transition-colors placeholder:text-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed ${hasError
                    ? "border-red-500/50 bg-red-500/5"
                    : focused
                        ? "border-yellow-300/50 bg-neutral-700/50"
                        : "border-neutral-700 hover:border-neutral-600"
                }`}
        />
    );
}

export function CreateStaff({ onStaffCreated, isOwner: propIsOwner }) {
    const { workspaceId, refreshSetup, isOwner: contextIsOwner } = useApp();
    const isOwner = propIsOwner !== undefined ? propIsOwner : contextIsOwner;

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [nameError, setNameError] = useState(null);
    const [emailError, setEmailError] = useState(null);
    const [passwordError, setPasswordError] = useState(null);

    const validateForm = useCallback(() => {
        let valid = true;
        setNameError(null); setEmailError(null); setPasswordError(null);
        if (!name.trim()) { setNameError("Name is required"); valid = false; }
        const emailErr = ValidationRules.email(email);
        if (emailErr) { setEmailError(emailErr); valid = false; }
        if (!password || password.length < 8) { setPasswordError("Minimum 8 characters"); valid = false; }
        return valid;
    }, [name, email, password]);

    const handleCreate = async () => {
        if (!validateForm()) return;
        setSaving(true);
        setErr(null);
        try {
            await api.post(`/api/workspaces/${workspaceId}/staff/create`, { name, email, password });
            toast.success(`Staff user "${name}" created!`);
            await refreshSetup();
            onStaffCreated?.();
            setName(""); setEmail(""); setPassword("");
        } catch (e) {
            setErr(e.response?.data?.error || e.message || "Failed to create staff");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">

            {/* Error banner */}
            {err && (
                <div className="flex items-start gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3">
                    <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-red-400 text-sm font-mono flex-1">{err}</span>
                    <button onClick={() => setErr(null)} className="text-red-400/60 hover:text-red-400 transition-colors">
                        <XCircle className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Fields */}
            <div className="space-y-4">
                <Field label="Full Name" description="The staff member's display name" error={nameError}>
                    <StyledInput
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Smith"
                        disabled={!isOwner || saving}
                        hasError={!!nameError}
                    />
                </Field>

                <Field label="Email Address" description="Used for login — must be unique" error={emailError}>
                    <StyledInput
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@company.com"
                        disabled={!isOwner || saving}
                        hasError={!!emailError}
                    />
                </Field>

                <Field label="Password" description="Min. 8 characters — staff can change after first login" error={passwordError}>
                    <div className="relative">
                        <StyledInput
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={!isOwner || saving}
                            hasError={!!passwordError}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </Field>
            </div>

            {/* Submit */}
            <button
                onClick={handleCreate}
                disabled={!isOwner || saving}
                className="w-full flex items-center justify-center gap-2 bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-xs font-mono uppercase tracking-widest px-6 py-3 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed"
            >
                {saving ? (
                    <><span className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" /> Creating...</>
                ) : (
                    <><UserPlus className="h-3.5 w-3.5" /> Create Staff User</>
                )}
            </button>

            {/* Owner guard note */}
            {!isOwner && (
                <p className="text-center text-xs font-mono text-neutral-600">
                    Only workspace owners can create staff accounts.
                </p>
            )}
        </div>
    );
}