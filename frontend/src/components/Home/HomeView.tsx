import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Play,
  Cpu,
  ShieldCheck,
  BookOpen,
  Layers,
  Terminal,
  Award,
  Network,
  ChevronRight,
  Flame,
  CheckCircle2,
  Check
} from "lucide-react";
import { runClientSimulation, Gate } from "../../quantum/engine";
import { MathRenderer } from "../Common/MathRenderer";

interface HomeViewProps {
  onNavigate: (section: string) => void;
  onLaunchDemoCircuit: (qubits: number, gates: Gate[]) => void;
  onOpenGuidedDemo?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  onNavigate, 
  onLaunchDemoCircuit,
  onOpenGuidedDemo 
}) => {
  // Interactive mini live circuit demo directly on the home page
  const [demoGates, setDemoGates] = useState<Gate[]>([
    { type: "H", target: 0, control: null },
    { type: "CNOT", target: 1, control: 0 },
  ]);

  const simResult = runClientSimulation(2, demoGates, 1024);

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative text-center max-w-4xl mx-auto space-y-6 pt-4">
        {/* SIH 26140 Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
          Smart India Hackathon • SIH26140 • Smart Education (Egreen Quanta)
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Learn Quantum Computing{" "}
          <span className="bg-gradient-to-r from-purple-700 via-indigo-600 to-amber-600 bg-clip-text text-transparent">
            Interactively with AI
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The next-generation AI-powered educational platform designed to help students learn quantum computing through interactive concepts, visual simulations, quantum circuits, and intelligent guidance.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate("learn")}
            className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-sm shadow-xl shadow-purple-500/25 transition-all hover:scale-105 cursor-pointer"
          >
            Start Learning
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenGuidedDemo ? onOpenGuidedDemo() : onNavigate("simulator")}
            className="flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-purple-50/50 text-slate-800 hover:text-purple-700 font-bold rounded-2xl text-sm border border-slate-200 shadow-sm transition-all hover:border-purple-300 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            Try Interactive Demo
          </button>
        </div>
      </div>

      {/* Active Learning Loop Banner */}
      <div className="max-w-5xl mx-auto p-5 rounded-2xl bg-purple-50/70 border border-purple-200/80 shadow-xs space-y-3">
        <span className="text-[10px] font-mono uppercase font-bold text-purple-700 tracking-wider block text-center">
          Active Learning Architecture • Learn → See → Build → Simulate → Understand → Practice → Master
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-bold font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-slate-800 shadow-xs">Learn</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-700 shadow-xs">See</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-indigo-700 shadow-xs">Build</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-blue-700 shadow-xs">Simulate</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-amber-700 shadow-xs">Understand</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-orange-700 shadow-xs">Practice</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-bold">Master</span>
        </div>
      </div>

      {/* Live Interactive Hero Circuit Showcase */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-purple-100 max-w-5xl mx-auto shadow-md bg-white/95 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <Cpu className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 text-base">
                Interactive Quantum State Execution (Mathematically Rigorous)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add gates below to immediately alter the quantum statevector and inspect live amplitude evolution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setDemoGates([
                  { type: "H", target: 0, control: null },
                  { type: "CNOT", target: 1, control: 0 },
                ])
              }
              className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
            >
              Reset to Bell State
            </button>
            <button
              onClick={() => onLaunchDemoCircuit(2, demoGates)}
              className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors shadow-sm cursor-pointer"
            >
              Launch in Simulator →
            </button>
          </div>
        </div>

        {/* Live Wires & Statevector Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Circuit Wire Window */}
          <div className="lg:col-span-7 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-600 uppercase">
                Active Circuit (2 Qubits)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setDemoGates((prev) => [...prev, { type: "H", target: 0, control: null }])}
                  className="px-2 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 font-mono text-xs font-bold hover:bg-purple-100 cursor-pointer"
                >
                  + H(0)
                </button>
                <button
                  onClick={() => setDemoGates((prev) => [...prev, { type: "X", target: 1, control: null }])}
                  className="px-2 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 font-mono text-xs font-bold hover:bg-orange-100 cursor-pointer"
                >
                  + X(1)
                </button>
                <button
                  onClick={() => setDemoGates((prev) => [...prev, { type: "Z", target: 0, control: null }])}
                  className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                >
                  + Z(0)
                </button>
                <button
                  onClick={() => setDemoGates([])}
                  className="px-2 py-1 text-slate-500 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Wires */}
            {[0, 1].map((qIdx) => (
              <div key={qIdx} className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-purple-700 w-10">q[{qIdx}]</span>
                <div className="relative flex-1 h-12 bg-white rounded-xl border border-slate-200 flex items-center px-3 shadow-xs">
                  <div className="absolute inset-x-0 h-0.5 bg-slate-300" />
                  <div className="relative z-10 flex items-center gap-2">
                    {demoGates
                      .filter((g) => g.target === qIdx || g.control === qIdx)
                      .map((g, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shadow-xs ${
                            g.control === qIdx
                              ? "bg-purple-700 text-white"
                              : g.type === "H"
                              ? "bg-purple-100 text-purple-800 border border-purple-300"
                              : g.type === "X"
                              ? "bg-orange-100 text-orange-800 border border-orange-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}
                        >
                          {g.control === qIdx ? "●" : g.type}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Probabilities Output */}
          <div className="lg:col-span-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-mono font-bold text-slate-600 uppercase block">
              Simulated State Probabilities (|ψ|²)
            </span>
            <div className="space-y-2">
              {simResult.statevector.map((s) => (
                <div key={s.index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
                    <span>{s.basis}</span>
                    <span className="text-purple-700">{(s.probability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${s.probability * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Real Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-xs text-center space-y-1">
          <span className="text-3xl font-extrabold text-purple-700 font-mono">13</span>
          <p className="text-xs font-bold text-slate-700">Curriculum Modules</p>
          <span className="text-[10px] text-slate-400 font-mono">Basics → Capstone</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-xs text-center space-y-1">
          <span className="text-3xl font-extrabold text-indigo-600 font-mono">10</span>
          <p className="text-xs font-bold text-slate-700">Unitary Gates</p>
          <span className="text-[10px] text-slate-400 font-mono">Single & Multi-Qubit</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-xs text-center space-y-1">
          <span className="text-3xl font-extrabold text-amber-600 font-mono">5</span>
          <p className="text-xs font-bold text-slate-700">Interactive Labs</p>
          <span className="text-[10px] text-slate-400 font-mono">BB84, Grover, CHSH, NISQ</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-xs text-center space-y-1">
          <span className="text-3xl font-extrabold text-emerald-600 font-mono">29/29</span>
          <p className="text-xs font-bold text-slate-700">Tests Verified</p>
          <span className="text-[10px] text-slate-400 font-mono">100% PyTest Passing</span>
        </div>
      </div>

      {/* Feature Pillar Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Guided Curriculum & Roadmap</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            13 structured modules covering Dirac notation, phase kickback, quantum teleportation, and Grover's search with persistent checkbox tracking.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Drag & Drop Wire Studio</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Construct custom quantum circuits in a rectangular time grid with HTML5 drag-and-drop, full Undo/Redo stacks, and 3D Bloch sphere projections.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Adaptive AI Testing Arena</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Randomized quantum physics quizzes with dynamic difficulty scaling, Qiskit code sandbox execution, and Google Gemini 2.0 Flash mentor copilot.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
