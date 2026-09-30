import React, { useState } from "react";
import { Sparkles, ArrowRight, Play, CheckCircle2, RotateCcw, HelpCircle, Layers, X } from "lucide-react";
import { runClientSimulation, Gate } from "../../quantum/engine";
import { MathRenderer } from "../Common/MathRenderer";

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToSection: (section: string) => void;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onJumpToSection,
}) => {
  const [step, setStep] = useState<number>(1);

  if (!isOpen) return null;

  // Demo step states
  const demoSteps = [
    {
      step: 1,
      title: "1. Welcome to Quantaneer Interactive Demo",
      desc: "Experience how Quantaneer transforms abstract quantum linear algebra into interactive visual simulations and hands-on circuits.",
      gates: [] as Gate[],
      highlight: "Ground state initialized: $|00\\rangle = \\begin{bmatrix}1 & 0 & 0 & 0\\end{bmatrix}^T$.",
    },
    {
      step: 2,
      title: "2. Adding Hadamard Gate (H)",
      desc: "We place a Hadamard gate on qubit 0. This maps the computational basis into an equal superposition: $$H|0\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) = |+\\rangle$$",
      gates: [{ type: "H", target: 0, control: null }] as Gate[],
      highlight: "Qubit 0 enters superposition. Notice equal 50% / 50% probabilities on $|00\\rangle$ and $|01\\rangle$.",
    },
    {
      step: 3,
      title: "3. Adding Controlled-NOT (CNOT) Entanglement",
      desc: "Now we place a CNOT gate with control $q_0$ and target $q_1$. This generates maximal quantum entanglement: $$|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)$$",
      gates: [
        { type: "H", target: 0, control: null },
        { type: "CNOT", target: 1, control: 0 },
      ] as Gate[],
      highlight: "Bell State created! Amplitudes for $|01\\rangle$ and $|10\\rangle$ become zero. Only $|00\\rangle$ and $|11\\rangle$ exist.",
    },
    {
      step: 4,
      title: "4. Executing Simulation & Sampling Measurements",
      desc: "We sample 1024 shots from the quantum wavefunction to statistically verify the Born rule: $P(x) = |\\langle x|\\psi\\rangle|^2$.",
      gates: [
        { type: "H", target: 0, control: null },
        { type: "CNOT", target: 1, control: 0 },
      ] as Gate[],
      highlight: "Outcomes are perfectly correlated: measuring $q_0 = 0$ guarantees $q_1 = 0$; measuring $q_0 = 1$ guarantees $q_1 = 1$.",
    },
    {
      step: 5,
      title: "5. Context-Aware AI Quantum Mentor",
      desc: "Ask the built-in AI Quantum Mentor or AI Instructor about non-locality, Einstein-Podolsky-Rosen (EPR) paradox, or gate matrices.",
      gates: [
        { type: "H", target: 0, control: null },
        { type: "CNOT", target: 1, control: 0 },
      ] as Gate[],
      highlight: "AI explains: 'Entanglement implies non-separable statevectors where the subsystem states are undefined until measurement.'",
    },
    {
      step: 6,
      title: "6. Guided Journey Completed!",
      desc: "You are ready to explore the curriculum roadmap, design custom circuits with drag-and-drop, and practice adaptive quizzes.",
      gates: [
        { type: "H", target: 0, control: null },
        { type: "CNOT", target: 1, control: 0 },
      ] as Gate[],
      highlight: "Recommended next: Jump to the Curriculum Roadmap or open the Drag-and-Drop Circuit Simulator.",
    },
  ];

  const currentStepData = demoSteps[step - 1];
  const sim = runClientSimulation(2, currentStepData.gates, 1024);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-purple-200/80 p-6 sm:p-8 space-y-6 bg-white shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="flex items-center justify-between border-b border-slate-100 pb-3 relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Interactive Platform Walkthrough</h3>
              <p className="text-xs text-purple-600 font-mono font-semibold">Step {step} of {demoSteps.length}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step details */}
        <div className="space-y-3 relative z-10">
          <h4 className="text-lg font-bold text-slate-900">{currentStepData.title}</h4>
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <MathRenderer content={currentStepData.desc} />
          </div>
          <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200/80 text-xs text-purple-900 leading-relaxed">
            <strong className="text-purple-700">Observation: </strong>
            <MathRenderer content={currentStepData.highlight} inline={true} />
          </div>
        </div>

        {/* Live Mini Statevector output for current demo step */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 relative z-10">
          <span className="text-[10px] uppercase font-mono text-slate-500 font-bold block">
            Calculated Probability Distribution for this Step:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {sim.statevector.map((s) => (
              <div key={s.index} className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
                <span className="text-slate-800 font-bold">|{s.basis}⟩</span>
                <span className={s.probability > 0.01 ? "text-purple-600 font-bold text-sm mt-1" : "text-slate-400 mt-1"}>
                  {(s.probability * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 relative z-10">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1.5">
            {demoSteps.map((d) => (
              <button
                key={d.step}
                onClick={() => setStep(d.step)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  d.step === step ? "bg-purple-600 w-5" : "bg-slate-300 hover:bg-slate-400"
                }`}
                title={`Jump to step ${d.step}`}
              />
            ))}
          </div>

          {step < demoSteps.length ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onJumpToSection("learn");
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Explore Curriculum Roadmap</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
