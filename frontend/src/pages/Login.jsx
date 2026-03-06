import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { EyeIcon, EyeOff } from "lucide-react";

export default function Login() {
    const nav = useNavigate();
    const { login, loading } = useApp();
    const [email, setEmail] = useState("amar@example.com");
    const [password, setPassword] = useState("password123");
    const [focused, setFocused] = useState(null);

    const [show, setShow] = useState(false)

    return (
        <div className="min-h-screen bg-neutral-950 flex">

            {/* Left panel — branding */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-neutral-900 border-r border-neutral-800 p-12 relative overflow-hidden">
                {/* Grid texture */}
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                    }}
                />
                {/* Glow */}
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-300/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative">
                    <div onClick={() => nav("/")} className="flex items-center cursor-pointer gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                        <span className="font-mono font-semibold text-sm tracking-wide text-neutral-100">
                            Unified<span className="text-yellow-300">Ops</span>
                        </span>
                    </div>
                </div>

                <div className="relative">
                    <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-4">Operations Platform</div>
                    <h2 className="text-4xl font-black text-neutral-100 leading-tight mb-6" style={{ fontFamily: "Georgia, serif" }}>
                        Everything you need.<br />
                        <span className="text-yellow-300 italic">All in one place.</span>
                    </h2>
                    <p className="text-neutral-500 text-sm leading-relaxed max-w-sm">
                        Manage bookings, inventory, forms, and your team from a single unified dashboard.
                    </p>

                    {/* Stats strip */}
                    <div className="mt-10 flex gap-8 border-t border-neutral-800 pt-8">
                        {[["50K+", "Users"], ["99%", "Uptime"], ["120M+", "Revenue"]].map(([v, l]) => (
                            <div key={l}>
                                <div className="text-xl font-black text-yellow-300" style={{ fontFamily: "Georgia, serif" }}>{v}</div>
                                <div className="text-neutral-600 text-xs font-mono tracking-widest uppercase mt-0.5">{l}</div>
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
                            Welcome back
                        </div>
                        <h1 className="text-3xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                            Sign in to your workspace
                        </h1>
                        <p className="text-neutral-500 text-sm mt-2">
                            Access your dashboard as owner or staff.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        {/* Email */}
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
                                className={`w-full bg-neutral-900 border text-neutral-100 text-sm px-4 py-3 outline-none transition-all duration-200 font-mono placeholder:text-neutral-700 ${focused === "email"
                                    ? "border-yellow-300/60 bg-neutral-800"
                                    : "border-neutral-800 hover:border-neutral-700"
                                    }`}
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-mono tracking-widest uppercase text-neutral-500">
                                    Password
                                </label>
                                <a href="#" className="text-xs text-yellow-300/70 hover:text-yellow-300 font-mono transition-colors">
                                    Forgot?
                                </a>
                            </div>
                            <input
                                type={show ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocused("password")}
                                onBlur={() => setFocused(null)}
                                placeholder="••••••••"
                                className={`w-full bg-neutral-900 border text-neutral-100 text-sm px-4 py-3 outline-none transition-all duration-200 font-mono placeholder:text-neutral-700 ${focused === "password"
                                    ? "border-yellow-300/60 bg-neutral-800"
                                    : "border-neutral-800 hover:border-neutral-700"
                                    }`}
                            />

                            <button
                                type="button"
                                onClick={() => setShow(!show)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 text-sm"
                            >
                                {show ? (
                                    <EyeIcon className="h-4 w-4 mt-5" />
                                ) : (
                                    <EyeOff className="h-4 w-4 mt-5" />
                                )}
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            disabled={loading}
                            onClick={async () => {
                                const ok = await login(email, password);
                                if (ok) nav("/app/workspaces");
                            }}
                            className="w-full bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 font-bold text-sm font-mono tracking-widest uppercase px-6 py-3.5 transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In →"
                            )}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 h-px bg-neutral-800" />
                            <span className="text-neutral-700 text-xs font-mono">or</span>
                            <div className="flex-1 h-px bg-neutral-800" />
                        </div>

                        {/* Sign up link */}
                        <p className="text-center text-sm text-neutral-500">
                            Don't have an account?{" "}
                            <Link to="/signup" className="text-yellow-300 hover:text-yellow-200 font-mono font-medium transition-colors">
                                Sign up free
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}