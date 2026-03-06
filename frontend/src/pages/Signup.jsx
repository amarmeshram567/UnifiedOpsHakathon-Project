import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { EyeOff, EyeClosed, EyeIcon } from "lucide-react"

export default function Signup() {
    const nav = useNavigate();
    const { signup, loading } = useApp();
    const [name, setName] = useState("New Owner");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("password123");
    const [focused, setFocused] = useState(null);

    const [show, setShow] = useState(false)

    const navigate = useNavigate()

    const inputClass = (field) =>
        `w-full bg-neutral-900 border text-neutral-100 text-sm px-4 py-3 outline-none transition-all duration-200 font-mono placeholder:text-neutral-700 ${focused === field
            ? "border-yellow-300/60 bg-neutral-800"
            : "border-neutral-800 hover:border-neutral-700"
        }`;

    return (
        <div className="min-h-screen bg-neutral-950 flex">

            {/* Left panel — branding */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-neutral-900 border-r border-neutral-800 p-12 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                    }}
                />
                <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300/5 rounded-full blur-3xl pointer-events-none" />

                {/* Logo */}
                <div className="relative">
                    <div onClick={() => navigate("/")} className="flex cursor-pointer items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                        <span className="font-mono font-semibold text-sm tracking-wide text-neutral-100">
                            Unified<span className="text-yellow-300">Ops</span>
                        </span>
                    </div>
                </div>

                {/* Middle content */}
                <div className="relative">
                    <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-4">Get Started Free</div>
                    <h2 className="text-4xl font-black text-neutral-100 leading-tight mb-6" style={{ fontFamily: "Georgia, serif" }}>
                        Your ops dashboard,<br />
                        <span className="text-yellow-300 italic">up in minutes.</span>
                    </h2>
                    <p className="text-neutral-500 text-sm leading-relaxed max-w-sm mb-10">
                        Create your owner account and activate your first workspace. Invite staff, set up bookings, and track inventory — all from one place.
                    </p>

                    {/* Feature checklist */}
                    <div className="space-y-3">
                        {[
                            "Unified dashboard for your whole team",
                            "Inventory, bookings & forms included",
                            "Free to start — no credit card needed",
                        ].map((item) => (
                            <div key={item} className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-yellow-300/10 border border-yellow-300/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-yellow-300 text-xs">✓</span>
                                </div>
                                <span className="text-neutral-400 text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative text-neutral-700 text-xs font-mono">
                    © {new Date().getFullYear()} UnifiedOps
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">
                {/* Mobile logo */}
                <div className="lg:hidden absolute top-8 left-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                    <span className="font-mono font-semibold text-sm tracking-wide text-neutral-100">
                        Unified<span className="text-yellow-300">Ops</span>
                    </span>
                </div>

                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="inline-block bg-yellow-300/10 border border-yellow-300/20 text-yellow-300 text-xs font-mono tracking-widest uppercase px-3 py-1 mb-4">
                            Owner account
                        </div>
                        <h1 className="text-3xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                            Create your account
                        </h1>
                        <p className="text-neutral-500 text-sm mt-2">
                            Owners can create and activate workspaces.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono tracking-widest uppercase text-neutral-500 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onFocus={() => setFocused("name")}
                                onBlur={() => setFocused(null)}
                                placeholder="Your name"
                                className={inputClass("name")}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono tracking-widest uppercase text-neutral-500 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocused("email")}
                                onBlur={() => setFocused(null)}
                                placeholder="you@company.com"
                                className={inputClass("email")}
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-xs font-mono tracking-widest uppercase text-neutral-500 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={show ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocused("password")}
                                    onBlur={() => setFocused(null)}
                                    placeholder="••••••••"
                                    className={inputClass("password")}
                                />
                                {/* Toggle button */}
                                <button
                                    type="button"
                                    onClick={() => setShow(!show)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 text-sm"
                                >
                                    {show ? (
                                        <EyeIcon className="h-4 w-4" />
                                    ) : (
                                        <EyeOff className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-neutral-700 text-xs font-mono mt-1.5">Minimum 8 characters</p>
                        </div>

                        <button
                            disabled={loading}
                            onClick={async () => {
                                const ok = await signup(name, email, password);
                                if (ok) nav("/app/workspaces");
                            }}
                            className="w-full bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-sm font-mono tracking-widest uppercase px-6 py-3.5 transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" />
                                    Creating account...
                                </span>
                            ) : (
                                "Create Account →"
                            )}
                        </button>

                        <p className="text-center text-xs text-neutral-600 font-mono leading-relaxed">
                            By signing up you agree to our{" "}
                            <a href="#" className="text-neutral-400 hover:text-yellow-300 transition-colors">Terms</a>
                            {" & "}
                            <a href="#" className="text-neutral-400 hover:text-yellow-300 transition-colors">Privacy Policy</a>
                        </p>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-neutral-800" />
                            <span className="text-neutral-700 text-xs font-mono">or</span>
                            <div className="flex-1 h-px bg-neutral-800" />
                        </div>

                        <p className="text-center text-sm text-neutral-500">
                            Already have an account?{" "}
                            <Link to="/login" className="text-yellow-300 hover:text-yellow-200 font-mono font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}