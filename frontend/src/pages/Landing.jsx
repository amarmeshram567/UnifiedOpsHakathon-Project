import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const useInView = (threshold = 0.15) => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return [ref, inView];
};

const FadeIn = ({ children, delay = 0, className = "" }) => {
    const [ref, inView] = useInView();
    return (
        <div ref={ref} className={className} style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(28px)",
            transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
        }}>
            {children}
        </div>
    );
};

const features = [
    { icon: "📊", title: "Smart Dashboard", desc: "Real-time insights across every part of your business — bookings, revenue, and team activity in one clean view." },
    { icon: "📦", title: "Inventory Control", desc: "Track stock levels, set low-stock alerts, and sync inventory across locations without the spreadsheet chaos." },
    { icon: "📅", title: "Booking Manager", desc: "Manage appointments, reschedule on the fly, and reduce no-shows with automated reminders." },
    { icon: "📝", title: "Smart Forms", desc: "Build custom intake forms, collect data, and route submissions directly into your workflow." },
    { icon: "📈", title: "Revenue Reports", desc: "Understand what's driving growth with automated reports, trend graphs, and exportable data." },
    { icon: "⚡", title: "Automations", desc: "Set triggers, reminders, and workflows so your ops run themselves while you focus on what matters." },
];

const stats = [
    { value: "50K+", label: "Active Users" },
    { value: "120M+", label: "Revenue Managed" },
    { value: "10K+", label: "Bookings Processed" },
    { value: "99%", label: "Satisfaction Rate" },
];

const testimonials = [
    { quote: "Unified Ops transformed how we manage our daily operations. Everything is faster, cleaner, and our team actually uses it.", name: "Alex P.", role: "CEO, Meridian Co." },
    { quote: "The dashboard is the best I've used. Clean, fast, no clutter. I can see everything I need in under 10 seconds.", name: "Maria L.", role: "Operations Manager" },
    { quote: "Inventory tracking used to take hours. Now it's automated. I honestly don't know how we managed before.", name: "John D.", role: "Admin, RetailBase" },
];

const BarChart = () => {
    const bars = [40, 65, 45, 80, 55, 90, 70];
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    return (
        <div className="flex items-end gap-1 h-14">
            {bars.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-sm ${i === 5 ? "bg-yellow-300" : "bg-neutral-700"}`} style={{ height: `${h}%` }} />
                    <span className="text-neutral-600 text-xs">{days[i]}</span>
                </div>
            ))}
        </div>
    );
};

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    return (
        <div className="bg-neutral-950 text-neutral-100 min-h-screen overflow-x-hidden font-sans">

            {/* HEADER */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-5 py-4 ${scrolled ? "bg-neutral-950/90 backdrop-blur border-b border-neutral-800" : "bg-transparent"}`}>
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div onClick={() => navigate("/")} className="flex items-center cursor-pointer gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                        <span className="font-mono font-semibold text-sm tracking-wide">
                            Unified<span className="text-yellow-300">Ops</span>
                        </span>
                    </div>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        {["Features", "Stats", "Testimonials"].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-neutral-400 hover:text-white text-xs font-mono tracking-widest uppercase transition-colors">
                                {item}
                            </a>
                        ))}
                        <a href="/login" className="border border-neutral-700 hover:border-neutral-400 text-neutral-300 hover:text-white text-xs font-mono tracking-wider uppercase px-4 py-2 transition-all">Login</a>
                        <a href="/signup" className="bg-yellow-300 hover:bg-yellow-200 text-neutral-950 text-xs font-mono font-bold tracking-wider uppercase px-4 py-2 transition-all">Get Started →</a>
                    </nav>

                    {/* Mobile hamburger */}
                    <button className="md:hidden text-neutral-400 hover:text-white transition-colors p-1" onClick={() => setMobileOpen((v) => !v)}>
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile dropdown */}
                {mobileOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-neutral-950 border-b border-neutral-800 px-5 py-6 flex flex-col gap-4">
                        {["Features", "Stats", "Testimonials"].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileOpen(false)}
                                className="text-neutral-400 hover:text-white text-xs font-mono tracking-widest uppercase transition-colors py-1 border-b border-neutral-800 pb-3">
                                {item}
                            </a>
                        ))}
                        <div className="flex flex-col gap-2 pt-1">
                            <a href="/login" onClick={() => setMobileOpen(false)}
                                className="border border-neutral-700 text-neutral-300 text-xs font-mono tracking-wider uppercase px-4 py-3 text-center transition-all">
                                Login
                            </a>
                            <a href="/signup" onClick={() => setMobileOpen(false)}
                                className="bg-yellow-300 text-neutral-950 text-xs font-mono font-bold tracking-wider uppercase px-4 py-3 text-center transition-all">
                                Get Started →
                            </a>
                        </div>
                    </div>
                )}
            </header>

            <main>
                {/* HERO */}
                <section className="min-h-screen flex items-center pt-28 pb-16 px-5 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)",
                        backgroundSize: "56px 56px",
                    }} />
                    <div className="absolute top-1/4 right-0 w-96 h-96 bg-yellow-300/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="max-w-6xl mx-auto w-full relative grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                        {/* Left */}
                        <div>
                            <div className="inline-block bg-yellow-300/10 border border-yellow-300/20 text-yellow-300 text-xs font-mono tracking-widest uppercase px-3 py-1.5 mb-6">
                                Operations Platform — 2026
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-none tracking-tight mb-6" style={{ fontFamily: "Georgia, serif" }}>
                                One Place.<br />
                                <span className="text-yellow-300 italic">Every</span><br />
                                Operation.
                            </h1>
                            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-md mb-8">
                                A unified dashboard to manage bookings, inventory, and forms — built for teams that move fast and need everything in sync.
                            </p>
                            <div className="flex gap-3 flex-wrap">
                                <a href="/signup" className="bg-yellow-300 hover:bg-yellow-200 text-neutral-950 font-bold text-sm font-mono tracking-wider uppercase px-6 py-3 transition-all hover:-translate-y-0.5">
                                    Start Free Today →
                                </a>
                                <a href="/login" className="border border-neutral-700 hover:border-yellow-300 text-neutral-300 hover:text-yellow-300 text-sm font-mono tracking-wider uppercase px-6 py-3 transition-all hover:-translate-y-0.5">
                                    Login
                                </a>
                            </div>

                            <div className="mt-10 flex gap-6 sm:gap-8 border-t border-neutral-800 pt-8 flex-wrap">
                                {[["50K+", "Users"], ["99%", "Satisfaction"], ["120M+", "Revenue"]].map(([v, l]) => (
                                    <div key={l}>
                                        <div className="text-xl sm:text-2xl font-black text-yellow-300" style={{ fontFamily: "Georgia, serif" }}>{v}</div>
                                        <div className="text-neutral-500 text-xs font-mono tracking-widest uppercase mt-0.5">{l}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — mock dashboard, hidden on mobile */}
                        <div className="relative hidden sm:block">
                            <div className="bg-neutral-900 border border-neutral-800 rounded p-5">
                                <div className="flex gap-1.5 mb-4">
                                    {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                                        <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {[
                                        ["Revenue", "$12,450", "+18% this week"],
                                        ["Inventory", "1,204 items", "Well stocked"],
                                        ["Bookings", "34 today", "+5 new"],
                                        ["Tasks", "87% done", "On track"],
                                    ].map(([title, val, sub]) => (
                                        <div key={title} className="bg-neutral-800/60 border border-neutral-700/50 p-3 rounded-sm">
                                            <div className="text-neutral-500 text-xs font-mono uppercase tracking-wider mb-1">{title}</div>
                                            <div className="font-bold text-base text-neutral-100 mb-0.5">{val}</div>
                                            <div className="text-yellow-300 text-xs font-mono">{sub}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-neutral-800/60 border border-neutral-700/50 p-3 rounded-sm">
                                    <div className="text-neutral-500 text-xs font-mono uppercase tracking-wider mb-3">Weekly Activity</div>
                                    <BarChart />
                                </div>
                            </div>
                            <div className="absolute -top-3 -right-3 bg-yellow-300 text-neutral-950 text-xs font-mono font-bold tracking-widest px-3 py-1.5 uppercase">
                                ● Live Sync
                            </div>
                        </div>
                    </div>
                </section>

                {/* TICKER */}
                <div className="border-t border-b border-neutral-800 bg-neutral-900/50 py-3 overflow-hidden">
                    <div className="flex gap-16 whitespace-nowrap" style={{ animation: "ticker 20s linear infinite", width: "max-content" }}>
                        {[...Array(2)].flatMap((_, ri) =>
                            ["Bookings", "Inventory", "Analytics", "Forms", "Reporting", "Scheduling", "Revenue", "Team Ops"].map((item, i) => (
                                <span key={`${ri}-${item}-${i}`} className="text-neutral-500 text-xs font-mono tracking-widest uppercase">
                                    {item} <span className="text-yellow-300 mx-4">✦</span>
                                </span>
                            ))
                        )}
                    </div>
                </div>

                {/* FEATURES */}
                <section id="features" className="py-20 md:py-28 px-5">
                    <div className="max-w-6xl mx-auto">
                        <FadeIn>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 md:mb-16 border-b border-neutral-800 pb-8 gap-4">
                                <div>
                                    <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-3">What's Inside</div>
                                    <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                                        Built for real operations
                                    </h2>
                                </div>
                                <p className="text-neutral-500 text-sm md:max-w-xs md:text-right leading-relaxed">
                                    Every tool you need to run your business without switching tabs.
                                </p>
                            </div>
                        </FadeIn>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-neutral-800">
                            {features.map((f, i) => (
                                <FadeIn key={f.title} delay={i * 0.08}>
                                    <div className="bg-neutral-950 p-6 md:p-8 group hover:bg-neutral-900 transition-all duration-300 relative overflow-hidden h-full">
                                        <div className="absolute left-0 top-0 w-0.5 h-0 bg-yellow-300 group-hover:h-full transition-all duration-300" />
                                        <div className="text-3xl mb-4">{f.icon}</div>
                                        <h3 className="font-bold text-base mb-2 text-neutral-100">{f.title}</h3>
                                        <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* STATS */}
                <section id="stats" className="py-20 md:py-28 px-5 bg-neutral-900/40 border-y border-neutral-800">
                    <div className="max-w-6xl mx-auto">
                        <FadeIn className="text-center mb-12 md:mb-16">
                            <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-3">By the Numbers</div>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                                Trusted by thousands of businesses
                            </h2>
                        </FadeIn>
                        <div className="grid grid-cols-2 md:grid-cols-4 border border-neutral-800 divide-neutral-800" style={{ borderCollapse: "collapse" }}>
                            {stats.map((s, i) => (
                                <FadeIn key={s.label} delay={i * 0.1}
                                    className={`px-6 py-8 text-center border-neutral-800 ${i % 2 !== 0 ? "border-l" : ""} ${i >= 2 ? "border-t" : ""} md:border-t-0 ${i > 0 ? "md:border-l" : ""}`}>
                                    <div className="text-4xl md:text-5xl font-black text-yellow-300 mb-2" style={{ fontFamily: "Georgia, serif" }}>{s.value}</div>
                                    <div className="text-neutral-500 text-xs font-mono tracking-widest uppercase">{s.label}</div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* TESTIMONIALS */}
                <section id="testimonials" className="py-20 md:py-28 px-5">
                    <div className="max-w-6xl mx-auto">
                        <FadeIn className="mb-12 md:mb-16">
                            <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-3">Social Proof</div>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                                What our customers say
                            </h2>
                        </FadeIn>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            {testimonials.map((t, i) => (
                                <FadeIn key={t.name} delay={i * 0.1}>
                                    <div className="bg-neutral-900 border border-neutral-800 hover:border-neutral-600 p-6 md:p-8 transition-all duration-300 h-full flex flex-col justify-between">
                                        <div>
                                            <div className="text-yellow-300 text-3xl mb-4" style={{ fontFamily: "Georgia, serif" }}>"</div>
                                            <p className="text-neutral-300 text-sm leading-relaxed mb-6">{t.quote}</p>
                                        </div>
                                        <div className="border-t border-neutral-800 pt-4">
                                            <div className="font-semibold text-sm text-neutral-100">{t.name}</div>
                                            <div className="text-neutral-500 text-xs font-mono mt-0.5">{t.role}</div>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 md:py-28 px-5 bg-yellow-300 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }} />
                    <div className="max-w-6xl mx-auto relative text-center">
                        <div className="text-neutral-950/60 text-xs font-mono tracking-widest uppercase mb-4">Ready to simplify?</div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-950 tracking-tight mb-4" style={{ fontFamily: "Georgia, serif" }}>
                            Start managing everything<br className="hidden sm:block" /> from one dashboard
                        </h2>
                        <p className="text-neutral-950/70 text-sm sm:text-base mb-10 max-w-lg mx-auto">
                            Sign up today and get your operations under control — for free.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                            <a href="/signup" className="bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-sm font-mono tracking-wider uppercase px-8 py-4 transition-all hover:-translate-y-0.5">
                                Sign Up Free →
                            </a>
                            <a href="/login" className="border-2 border-neutral-950/30 hover:border-neutral-950 text-neutral-950 font-mono text-sm tracking-wider uppercase px-8 py-4 transition-all hover:-translate-y-0.5">
                                Login
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="bg-neutral-950 border-t border-neutral-800 py-8 md:py-10 px-5">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <span className="w-2 h-2 rounded-full bg-yellow-300" />
                        <span className="font-mono font-semibold text-sm tracking-wide">
                            Unified<span className="text-yellow-300">Ops</span>
                        </span>
                    </div>
                    <div className="text-neutral-600 text-xs font-mono order-last sm:order-none">
                        © {new Date().getFullYear()} UnifiedOps. All rights reserved.
                    </div>
                    <div className="flex gap-6 justify-center">
                        {["Privacy", "Terms", "Contact"].map(item => (
                            <a key={item} href="#" className="text-neutral-600 hover:text-neutral-300 text-xs font-mono tracking-wider transition-colors">{item}</a>
                        ))}
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            `}</style>
        </div>
    );
}