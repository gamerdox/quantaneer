import React, { useState, useEffect } from "react";
import {
  Sparkles,
  MessageSquare,
  Wrench,
  Lightbulb,
  BookOpen,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Key,
  Flame
} from "lucide-react";
import { Gate } from "../../quantum/engine";
import { MathRenderer } from "../Common/MathRenderer";

interface AITutorViewProps {
  currentCircuit?: {
    numQubits: number;
    gates: Gate[];
  };
  onApplyFix?: (fixedGates: Gate[]) => void;
}

export const AITutorView: React.FC<AITutorViewProps> = ({
  currentCircuit = {
    numQubits: 2,
    gates: [
      { type: "CNOT", target: 1, control: 0 },
      { type: "H", target: 0, control: null },
    ],
  },
  onApplyFix,
}) => {
  const [activeMode, setActiveMode] = useState<"ASK" | "DEBUG" | "HINT" | "EXPLAIN">("ASK");
  const [query, setQuery] = useState<string>("Why is my Bell state circuit giving unexpected probabilities?");
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string; mode?: string; debug?: any }[]
  >([
    {
      sender: "ai",
      text: "Hello! I am your AI Quantum Mentor. I have full real-time access to your circuit state, lesson progress, and quiz history. You can ask me conceptual questions, request hints, or ask me to debug your quantum circuit!\n\nTry asking about: **Hadamard gate**, **Bell state entanglement**, **Quantum Teleportation**, or **Grover's algorithm**!",
      mode: "WELCOME",
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    const key = localStorage.getItem("gemini_api_key");
    setHasApiKey(Boolean(key && key.trim().length > 5));
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || query;
    if (!prompt.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: prompt }]);
    if (!textToSend) setQuery("");
    setLoading(true);

    const geminiKey = localStorage.getItem("gemini_api_key") || "";

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-API-Key": geminiKey,
        },
        body: JSON.stringify({
          query: prompt,
          circuit_context: currentCircuit,
          gemini_api_key: geminiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.answer,
            mode: data.mode,
            debug: data.debug_details,
          },
        ]);
        if (data.debug_details) {
          setDebugResult(data.debug_details);
        }
      } else {
        throw new Error();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `In quantum computing, operations must be unitary and preserve normalization. In your current circuit of ${currentCircuit.gates.length} gates, ensuring Hadamard precedes CNOT is crucial for generating non-local superposition and entanglement: $$H|0\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) = |+\\rangle$$.`,
          mode: "FALLBACK",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDebugger = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num_qubits: currentCircuit.numQubits,
          gates: currentCircuit.gates,
          target_intent: "bell_state",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDebugResult(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleRequestHint = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "bell_state", hint_level: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { sender: "user", text: "Can you give me a hint for constructing a Bell state?" },
          { sender: "ai", text: `### 💡 Pedagogical Hint:\n\n${data.hint}`, mode: "HINT" },
        ]);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                AI Quantum Mentor & Circuit Debugger
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                hasApiKey
                  ? "bg-purple-50 text-purple-700 border-purple-300"
                  : "bg-emerald-50 text-emerald-700 border-emerald-300"
              }`}>
                {hasApiKey ? "● Gemini 2.0 Flash Connected" : "● Offline Deterministic Quantum Reasoning"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Context-aware quantum tutor equipped to inspect circuits, diagnose anomalies, and explain physical concepts using KaTeX LaTeX.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveMode("ASK")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeMode === "ASK" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ask Tutor
          </button>
          <button
            onClick={() => {
              setActiveMode("DEBUG");
              handleRunDebugger();
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeMode === "DEBUG" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Circuit Debugger
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat / Tutor Conversation Area */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm flex flex-col h-[620px] justify-between">
          {/* Messages Stream */}
          <div className="space-y-4 overflow-y-auto pr-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs sm:text-sm ${
                  m.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.sender === "ai" && (
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl p-4 rounded-2xl leading-relaxed ${
                    m.sender === "user"
                      ? "bg-purple-600 text-white rounded-tr-none font-medium shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-xs"
                  }`}
                >
                  <MathRenderer
                    content={m.text}
                    className={m.sender === "user" ? "text-white" : "text-slate-800 text-xs sm:text-sm"}
                  />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 text-xs text-slate-500 items-center animate-pulse pl-2">
                <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                <span>AI Quantum Mentor is analyzing statevector amplitudes and calculating unitary matrices...</span>
              </div>
            )}
          </div>

          {/* Prompt Input Form */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-bold">Suggested:</span>
              {[
                "Why are my Bell state probabilities wrong?",
                "Explain the Hadamard gate in Dirac notation",
                "How does Phase Kickback work?",
                "Explain Quantum Teleportation protocol"
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask your AI quantum mentor anything..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-purple-500 shadow-inner"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !query.trim()}
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold transition-colors cursor-pointer shadow-md shadow-purple-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Context & Circuit Diagnosis */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Circuit Inspector Card */}
          <div className="glass-panel p-5 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-600" />
                Contextual Circuit
              </span>
              <span className="font-mono text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {currentCircuit.numQubits} Qubits • {currentCircuit.gates.length} Gates
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] text-slate-600 max-h-36 overflow-y-auto">
              {currentCircuit.gates.map((g, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800">Gate {idx + 1}: {g.type}</span>
                  <span className="text-slate-500">
                    {g.control !== null && g.control !== undefined ? `c:q[${g.control}] → t:q[${g.target}]` : `t:q[${g.target}]`}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleRunDebugger}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-purple-600" />
              Diagnose Current Circuit
            </button>
          </div>

          {/* Debugger Diagnosis Output */}
          {debugResult && (
            <div className="glass-panel p-5 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  {debugResult.has_issues ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  Circuit Diagnosis
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  debugResult.has_issues ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}>
                  {debugResult.status}
                </span>
              </div>

              {debugResult.has_issues ? (
                <div className="space-y-2.5">
                  {debugResult.issues.map((issue: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
                      <p className="font-bold">{issue.message}</p>
                      <p className="text-[11px] text-amber-800">{issue.explanation}</p>
                    </div>
                  ))}

                  {debugResult.repairs && debugResult.repairs.length > 0 && onApplyFix && (
                    <button
                      onClick={() => onApplyFix(debugResult.repairs[0].after)}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Apply AI Recommended Circuit Fix
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <p className="font-bold">No structural anomalies detected!</p>
                  <p className="text-[11px] text-emerald-800 mt-1">Circuit unitary evolution is valid and satisfies probability conservation.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITutorView;
