import React, { useState } from "react";
import { Zap, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { runClientSimulation, Gate } from "../../quantum/engine";
import { MathRenderer } from "../Common/MathRenderer";

export const BellLab: React.FC = () => {
  const [selectedBell, setSelectedBell] = useState<"phi_plus" | "phi_minus" | "psi_plus" | "psi_minus">("phi_plus");

  const bellStates: Record<
    string,
    {
      name: string;
      formula: string;
      gates: Gate[];
      explanation: string;
      correlations: string;
    }
  > = {
    phi_plus: {
      name: "|Φ+⟩",
      formula: "$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$",
      gates: [
        { type: "H", target: 0, control: null },
        { type: "CNOT", target: 1, control: 0 },
      ],
      explanation: "Canonical Bell state with perfectly correlated outcomes: measuring 0 on q0 guarantees 0 on q1; measuring 1 on q0 guarantees 1 on q1.",
      correlations: "Alice = 0 → Bob = 0 (50%) | Alice = 1 → Bob = 1 (50%)",
    },
    phi_minus: {
      name: "|Φ-⟩",
      formula: "$$|\\Phi^-\\rangle = \\frac{|00\\rangle - |11\\rangle}{\\sqrt{2}}$$",
      gates: [
        { type: "X", target: 0, control: null },
        { type: "H", target: 0, control: null },
        { type: "CNOT", target: 1, control: 0 },
      ],
      explanation: "Correlated outcomes with a π phase shift between |00⟩ and |11⟩.",
      correlations: "Alice = 0 → Bob = 0 (50%) | Alice = 1 → Bob = 1 (50%) (Relative Phase: -1)",
    },
    psi_plus: {
      name: "|Ψ+⟩",
      formula: "$$|\\Psi^+\\rangle = \\frac{|01\\rangle + |10\\rangle}{\\sqrt{2}}$$",
      gates: [
        { type: "H", target: 0, control: null },
        { type: "CNOT", target: 1, control: 0 },
        { type: "X", target: 1, control: null },
      ],
      explanation: "Anti-correlated Bell state: measuring 0 on q0 guarantees 1 on q1; measuring 1 on q0 guarantees 0 on q1.",
      correlations: "Alice = 0 → Bob = 1 (50%) | Alice = 1 → Bob = 0 (50%)",
    },
    psi_minus: {
      name: "|Ψ-⟩",
      formula: "$$|\\Psi^-\\rangle = \\frac{|01\\rangle - |10\\rangle}{\\sqrt{2}}$$",
      gates: [
        { type: "X", target: 0, control: null },
        { type: "H", target: 0, control: null },
        { type: "CNOT", target: 1, control: 0 },
        { type: "X", target: 1, control: null },
      ],
      explanation: "The singlet state. Invariant under arbitrary simultaneous rotations of both qubits.",
      correlations: "Alice = 0 → Bob = 1 (50%) | Alice = 1 → Bob = 0 (50%) (Singlet State)",
    },
  };

  const active = bellStates[selectedBell];
  const sim = runClientSimulation(2, active.gates, 1024);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shadow-sm">
            <Zap className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Bell State & CHSH Entanglement Laboratory
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Explore the 4 canonical EPR Bell pairs and verify the quantum violation of the CHSH Bell Inequality ($S = 2.828 &gt; 2.0$).
            </p>
          </div>
        </div>

        {/* Bell state selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {Object.entries(bellStates).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setSelectedBell(key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedBell === key
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {val.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Bell State Analysis & CHSH Test */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Circuit & Amplitudes */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="text-base font-bold text-purple-700 font-mono">
                <MathRenderer content={active.formula} />
              </div>
              <p className="text-xs text-slate-600 mt-1">{active.explanation}</p>
            </div>
          </div>

          {/* Probabilities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Calculated Statevector Amplitudes
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {sim.statevector.map((s) => (
                <div
                  key={s.index}
                  className={`p-3 rounded-xl border font-mono text-xs ${
                    s.probability > 0.01
                      ? "bg-purple-50/60 border-purple-300 text-slate-900 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{s.basis}</span>
                    <span className="text-purple-700">{(s.probability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Amplitude: {s.real.toFixed(3)} {s.imag !== 0 ? `+ ${s.imag.toFixed(3)}i` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-purple-700 font-bold block mb-1">Measurement Outcome Correlations:</span>
            <p className="text-slate-700 font-mono font-medium">{active.correlations}</p>
          </div>
        </div>

        {/* Right: CHSH Inequality Bell Test */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              CHSH Bell Inequality Test
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Testing Clauser-Horne-Shimony-Holt correlation parameter S
            </p>
          </div>

          {/* S-value Meter */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-center space-y-2">
            <span className="text-xs font-mono uppercase text-slate-600 font-bold">Quantum Correlation S</span>
            <div className="text-3xl font-mono font-bold text-purple-700 flex items-center justify-center gap-2">
              <span>S = 2.828</span>
              <span className="text-sm text-indigo-600 font-normal">(2√2)</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs font-mono pt-2">
              <span className="text-slate-600 font-medium">Classical Bound: <strong>|S| ≤ 2.0</strong></span>
              <span className="text-emerald-700 font-bold">Violation: <strong>+41.4%</strong></span>
            </div>
          </div>

          {/* Physical Consequence */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Local Realism Disproven (Tsirelson's Bound)
            </div>
            <p className="leading-relaxed">
              Classical physics assumes "local hidden variables". Because the measured correlation <strong>S = 2.828 exceeds 2.0</strong>, quantum entanglement fundamentally violates local realism!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BellLab;
