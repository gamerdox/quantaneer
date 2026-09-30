import React, { useState } from "react";
import { Send, ArrowRight, CheckCircle2, RotateCcw, Info, Sparkles } from "lucide-react";
import { runClientSimulation, Gate } from "../../quantum/engine";
import { MathRenderer } from "../Common/MathRenderer";

export const TeleportationLab: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  // 3-qubit teleportation steps
  const steps: {
    title: string;
    description: string;
    activeGates: Gate[];
    stateExplanation: string;
  }[] = [
    {
      title: "Step 1: Input State Preparation (q[0])",
      description: "Alice prepares the unknown state $$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$$ on qubit 0 (here we apply an H gate to create equal superposition $$|+\\rangle$$).",
      activeGates: [{ type: "H", target: 0, control: null }],
      stateExplanation: "q[0] is in state $$|+\\rangle$$. Qubits 1 and 2 remain in the ground state $$|0\\rangle$$.",
    },
    {
      title: "Step 2: Shared Bell Pair Creation (q[1], q[2])",
      description: "An entangled Bell pair $$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$ is created between Alice's ancilla q[1] and Bob's distant qubit q[2].",
      activeGates: [
        { type: "H", target: 0, control: null },
        { type: "H", target: 1, control: null },
        { type: "CNOT", target: 2, control: 1 },
      ],
      stateExplanation: "Qubits 1 and 2 are now maximally entangled across space.",
    },
    {
      title: "Step 3: Alice's Bell State Measurement (q[0], q[1])",
      description: "Alice entangles the input qubit q[0] with her Bell qubit q[1] using a CNOT and Hadamard gate, projecting her 2 qubits into a Bell basis.",
      activeGates: [
        { type: "H", target: 0, control: null },
        { type: "H", target: 1, control: null },
        { type: "CNOT", target: 2, control: 1 },
        { type: "CNOT", target: 1, control: 0 },
        { type: "H", target: 0, control: null },
      ],
      stateExplanation: "Alice measures q[0] and q[1], obtaining 2 classical bits ($00, 01, 10,$ or $11$). The original state on q[0] is destroyed.",
    },
    {
      title: "Step 4: Classical Communication & Unitary Correction (q[2])",
      description: "Bob applies conditional corrections (CNOT and CZ) based on Alice's classical bits. Bob's qubit q[2] transforms into the exact original state $$|\\psi\\rangle$$!",
      activeGates: [
        { type: "H", target: 0, control: null },
        { type: "H", target: 1, control: null },
        { type: "CNOT", target: 2, control: 1 },
        { type: "CNOT", target: 1, control: 0 },
        { type: "H", target: 0, control: null },
        { type: "CNOT", target: 2, control: 1 },
        { type: "CZ", target: 2, control: 0 },
      ],
      stateExplanation: "Quantum state teleportation complete! Bob now possesses the exact quantum state with 100% fidelity without violating the No-Cloning Theorem.",
    },
  ];

  const activeStepData = steps[currentStep];
  const sim = runClientSimulation(3, activeStepData.activeGates, 1024);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shadow-sm">
            <Send className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Quantum Teleportation Protocol
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Transmit quantum state information from Alice (q0) to Bob (q2) via shared entanglement and 2 classical bits.
            </p>
          </div>
        </div>

        {/* Step Controller */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStep(0)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            disabled={currentStep >= steps.length - 1}
            onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            Next Teleportation Step ({currentStep + 1}/4)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Step Indicator */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((st, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              currentStep === idx
                ? "bg-purple-50/80 border-purple-500 shadow-sm"
                : idx < currentStep
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                : "bg-white border-slate-200 text-slate-500"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
              <span className={currentStep === idx ? "text-purple-700" : "text-slate-500"}>
                Step {idx + 1}
              </span>
              {idx < currentStep && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </div>
            <h4 className="font-bold text-xs truncate text-slate-800">{st.title.split(":")[1]}</h4>
          </button>
        ))}
      </div>

      {/* Step Explanation & Circuit State */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-mono font-bold uppercase text-purple-700">
              Protocol Telemetry
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              {activeStepData.title}
            </h3>
            <div className="text-xs text-slate-600 mt-2 leading-relaxed">
              <MathRenderer content={activeStepData.description} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 space-y-1">
            <span className="font-bold block">Wavefunction Status:</span>
            <MathRenderer content={activeStepData.stateExplanation} className="text-xs text-purple-800" />
          </div>

          {/* Active Applied Gates */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Applied Circuit Gates:
            </span>
            <div className="flex flex-wrap gap-2">
              {activeStepData.activeGates.map((g, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 border border-purple-200 text-xs font-mono font-bold text-purple-700 shadow-xs"
                >
                  {g.type} on q[{g.target}]
                  {g.control !== null && g.control !== undefined && ` (c:q[${g.control}])`}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3-Qubit Composite Statevector (8 Dimensions) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3-Qubit Statevector (8 States)
            </h4>
            <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              q0:Alice | q1:EPR | q2:Bob
            </span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {sim.statevector.map((s) => (
              <div key={s.index} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
                  <span>{s.basis}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      Amp: {s.real.toFixed(2)}
                    </span>
                    <span className="text-purple-700">{(s.probability * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(s.probability * 100, 1)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeleportationLab;
