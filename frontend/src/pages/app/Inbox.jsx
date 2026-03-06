import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../lib/app.js";
import { useApp } from "../../context/AppContext.jsx";
import { useSearchParams } from "react-router-dom";
import { Send, Mail, MessageSquare, XCircle, Zap, ZapOff, ChevronRight } from "lucide-react";

export default function Inbox() {
    const { token, workspaceId } = useApp();
    const [params] = useSearchParams();
    const preselectId = params.get("conversationId") ? Number(params.get("conversationId")) : null;

    const [convos, setConvos] = useState([]);
    const [activeId, setActiveId] = useState(preselectId);
    const [active, setActive] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    async function loadList() {
        const data = await apiFetch("/api/inbox/conversations", { token, workspaceId });
        setConvos(data.conversations || []);
        if (!activeId && data.conversations?.[0]?.id) setActiveId(data.conversations[0].id);
    }

    async function loadConversation(id) {
        if (!id) return;
        const data = await apiFetch(`/api/inbox/conversations/${id}`, { token, workspaceId });
        setActive(data.conversation);
    }

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr(null);
            try { await loadList(); }
            catch (e) { setErr(e.message || "Failed to load inbox"); }
            finally { setLoading(false); }
        })();
    }, [token, workspaceId]);

    useEffect(() => {
        (async () => {
            try { await loadConversation(activeId); }
            catch { }
        })();
    }, [activeId]);

    return (
        <div className="space-y-5 max-w-7xl">

            {/* Page header */}
            <div className="border-b border-neutral-800 pb-5">
                <div className="text-yellow-300 text-xs font-mono tracking-widest uppercase mb-1">Communications</div>
                <h1 className="text-2xl font-black text-neutral-100 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                    Inbox
                </h1>
                <p className="text-neutral-500 text-sm mt-1">Email + SMS in one place. Staff replies pause automation.</p>
            </div>

            {/* Error */}
            {err && (
                <div className="flex items-center gap-3 bg-red-400/10 border border-red-400/20 px-4 py-3 text-red-400 text-sm font-mono">
                    <XCircle className="h-4 w-4 shrink-0" /> {err}
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-5 w-5 animate-spin border-2 border-neutral-700 border-t-yellow-300 rounded-full" />
                        <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Loading...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4" style={{ height: "calc(100vh - 220px)" }}>

                    {/* Conversation list */}
                    <div className="bg-neutral-900 border border-neutral-800 flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                            <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-semibold">Conversations</span>
                            <span className="text-xs font-mono text-neutral-600">{convos.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {convos.length === 0 && (
                                <div className="p-4 text-xs font-mono text-neutral-600 text-center">No conversations yet.</div>
                            )}
                            {convos.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveId(c.id)}
                                    className={`w-full text-left px-3 py-3 transition-all duration-150 border-l-2 ${c.id === activeId
                                        ? "bg-yellow-300/10 border-l-yellow-300 text-neutral-100"
                                        : "border-l-transparent hover:bg-neutral-800/60 hover:border-l-neutral-600 text-neutral-400"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-sm font-semibold truncate text-inherit">
                                            {c.contact?.name || "Unknown"}
                                        </span>
                                        <span className={`text-xs font-mono px-1.5 py-0.5 border shrink-0 ${c.automationPaused
                                            ? "bg-amber-400/10 border-amber-400/20 text-amber-400"
                                            : "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                                            }`}>
                                            {c.automationPaused ? "PAUSED" : "AUTO"}
                                        </span>
                                    </div>
                                    <div className="text-xs font-mono text-neutral-600 truncate">
                                        {c.contact?.email || c.contact?.phone || "—"} · #{c.id}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conversation view */}
                    <div className="bg-neutral-900 border border-neutral-800 flex flex-col overflow-hidden min-w-0">
                        {active
                            ? <ConversationView convo={active} onRefresh={() => loadConversation(activeId)} />
                            : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <MessageSquare className="h-8 w-8 text-neutral-700 mx-auto mb-3" />
                                        <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Select a conversation</p>
                                    </div>
                                </div>
                            )
                        }
                    </div>

                </div>
            )}
        </div>
    );
}


function ConversationView({ convo, onRefresh }) {
    const { token, workspaceId } = useApp();

    const [channelType, setChannelType] = useState("EMAIL");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [simBody, setSimBody] = useState("Hi, I have a question about your service.");
    const [simType, setSimType] = useState("EMAIL");
    const [showSim, setShowSim] = useState(false);

    const bottomRef = useRef(null);
    const messages = useMemo(() => convo.messages || [], [convo]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 shrink-0">
                <div>
                    <div className="font-semibold text-sm text-neutral-100">{convo.contact?.name || "Unknown"}</div>
                    <div className="text-xs font-mono text-neutral-500 mt-0.5">
                        {convo.contact?.email || convo.contact?.phone || "—"}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 border ${convo.automationPaused
                        ? "bg-amber-400/10 border-amber-400/20 text-amber-400"
                        : "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                        }`}>
                        {convo.automationPaused
                            ? <><ZapOff className="h-3 w-3" /> Automation paused</>
                            : <><Zap className="h-3 w-3" /> Automation active</>
                        }
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-950/50">
                {messages.length === 0 && (
                    <div className="text-center text-xs font-mono text-neutral-600 pt-10 uppercase tracking-widest">No messages yet</div>
                )}
                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 text-sm ${m.direction === "OUTBOUND"
                            ? "bg-yellow-300 text-neutral-950 font-medium"
                            : "bg-neutral-800 border border-neutral-700 text-neutral-100"
                            }`}>
                            <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
                            <div className={`text-xs mt-1.5 font-mono flex items-center gap-1 ${m.direction === "OUTBOUND" ? "text-neutral-950/50 justify-end" : "text-neutral-600"
                                }`}>
                                {m.channelType === "EMAIL" ? <Mail className="h-2.5 w-2.5" /> : <MessageSquare className="h-2.5 w-2.5" />}
                                {m.channelType}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Reply bar */}
            <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-900 shrink-0">
                <div className="flex gap-2">
                    <select
                        value={channelType}
                        onChange={(e) => setChannelType(e.target.value)}
                        className="bg-neutral-800 border border-neutral-700 text-neutral-100 font-mono text-xs px-2.5 py-2 focus:outline-none focus:border-yellow-300/50 transition-colors shrink-0"
                    >
                        <option value="EMAIL">EMAIL</option>
                        <option value="SMS">SMS</option>
                    </select>

                    <input
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && body.trim()) e.currentTarget.form?.requestSubmit(); }}
                        placeholder="Write a reply..."
                        className="flex-1 bg-neutral-800 border border-neutral-700 text-neutral-100 text-sm font-mono px-3 py-2 placeholder:text-neutral-600 focus:outline-none focus:border-yellow-300/50 transition-colors"
                    />

                    <button
                        disabled={sending || !body.trim()}
                        onClick={async () => {
                            setSending(true);
                            try {
                                await apiFetch(`/api/inbox/conversations/${convo.id}/reply`, {
                                    method: "POST", token, workspaceId,
                                    body: { channelType, body },
                                });
                                setBody("");
                                await onRefresh();
                            } finally { setSending(false); }
                        }}
                        className="bg-yellow-300 hover:bg-yellow-200 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-950 px-4 py-2 font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shrink-0"
                    >
                        {sending
                            ? <span className="w-3.5 h-3.5 border-2 border-neutral-500 border-t-neutral-300 rounded-full animate-spin" />
                            : <><Send className="h-3.5 w-3.5" /> Send</>
                        }
                    </button>
                </div>
            </div>

            {/* Demo inbound tool */}
            <div className="px-4 pb-3 shrink-0">
                <button
                    onClick={() => setShowSim(!showSim)}
                    className="flex items-center gap-1.5 text-xs font-mono text-neutral-600 hover:text-neutral-400 transition-colors mb-2"
                >
                    <ChevronRight className={`h-3 w-3 transition-transform duration-150 ${showSim ? "rotate-90" : ""}`} />
                    <span className="uppercase tracking-widest">Demo: Simulate Inbound</span>
                </button>

                {showSim && (
                    <div className="bg-neutral-800/60 border border-neutral-700/50 p-3 space-y-2">
                        <textarea
                            rows={2}
                            value={simBody}
                            onChange={(e) => setSimBody(e.target.value)}
                            placeholder="Write inbound message..."
                            className="w-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-mono px-3 py-2 resize-none focus:outline-none focus:border-yellow-300/30 transition-colors placeholder:text-neutral-600"
                        />
                        <div className="flex items-center justify-end gap-2">
                            <select
                                value={simType}
                                onChange={(e) => setSimType(e.target.value)}
                                className="bg-neutral-900 border border-neutral-700 text-neutral-400 font-mono text-xs px-2 py-1.5 focus:outline-none"
                            >
                                <option value="EMAIL">Email</option>
                                <option value="SMS">SMS</option>
                            </select>
                            <button
                                onClick={async () => {
                                    await apiFetch(`/api/inbox/conversations/${convo.id}/inbound`, {
                                        method: "POST", token, workspaceId,
                                        body: { channelType: simType, body: simBody },
                                    });
                                    await onRefresh();
                                }}
                                className="bg-neutral-700 hover:bg-neutral-600 text-neutral-200 text-xs font-mono uppercase tracking-widest px-3 py-1.5 transition-colors"
                            >
                                Simulate
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
