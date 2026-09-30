import React, { useState } from "react";
import { Search, Sparkles, TrendingUp, Info } from "lucide-react";
import { runClientSimulation, Gate } from "../../quantum/engine";
import { MathRenderer } from "../Common/MathRenderer";

export const GroverLab: React.FC = () => {
  const [targetState, setTargetState] = useState<string>("11");
  const [activeStage, setActiveStage] = useState<"initial" | "oracle" | "diffusion">("diffusion");

  // Build gates depending on stage and target state
  const buildGroverGates = (stage: "initial" | "oracle" | "diffusion", target: string): Gate[] => {
    // Stage 1: Equal superposition
    const initGates: Gate[] = [
      { type: "H", target: 0, control: null },
      { type: "H", target: 1, control: null },
    ];
    if (stage === "initial") return initGates;

    // Stage 2: Oracle for target
    let oracleGates: Gate[] = [];
    if (target === "11") {
      oracleGates = [{ type: "CZ", target: 1, control: 0 }];
    } else if (target === "10") {
      oracleGates = [
        { type: "X", target: 1, control: null },
        { type: "CZ", target: 1, control: 0 },
        { type: "X", target: 1, control: null },
      ];
    } else if (target === "01") {
      oracleGates = [
        { type: "X", target: 0, control: null },
        { type: "CZ", target: 1, control: 0 },
        { type: "X", target: 0, control: null },
      ];
    } else if (target === "00") {
      oracleGates = [
        { type: "X", target: 0, control: null },
        { type: "X", target: 1, control: null },
        { type: "CZ", target: 1, control: 0 },
        { type: "X", target: 0, control: null },
        { type: "X", target: 1, control: null },
      ];
    }
    if (stage === "oracle") return [...initGates, ...oracleGates];

    // Stage 3: Diffusion Operator (H -> X -> CZ -> X -> H)
    const diffusionGates: Gate[] = [
      { type: "H", target: 0, control: null },
      { type: "H", target: 1, control: null },
      { type: "X", target: 0, control: null },
      { type: "X", target: 1, control: null },
      { type: "CZ", target: 1, control: 0 },
      { type: "X", target: 0, control: null },
      { type: "X", target: 1, control: null },
      { type: "H", target: 0, control: null },
      { type: "H", target: 1, control: null },
    ];

    return [...initGates, ...oracleGates, ...diffusionGates];
  };

  const gates = buildGroverGates(activeStage, targetState);
  const sim = runClientSimulation(2, gates, 1024);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shadow-sm">
            <Search className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Grover's Quantum Search Laboratory
            </h2>
            <div className="text-xs text-slate-600 mt-0.5">
              <MathRenderer content="Visualize amplitude amplification and quadratic speedup $O(\sqrt{N})$ across oracle marking and diffusion inversion." inline={true} />
            </div>
          </div>
        </div>

        {/* Target state picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Target Item:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {["00", "01", "10", "11"].map((st) => (
              <button
                key={st}
                onClick={() => setTargetState(st)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  targetState === st
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                |{st}⟩
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stage selector tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveStage("initial")}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeStage === "initial"
              ? "bg-purple-50/80 border-purple-500 shadow-sm"
              : "bg-white border-slate-200 text-slate-700 hover:border-purple-200"
          }`}
        >
          <span className="text-xs font-mono font-bold text-purple-700 block mb-1">Step 1</span>
          <h4 className="text-sm font-bold text-slate-900">1. Equal Superposition</h4>
          <p className="text-xs text-slate-500 mt-1">H gates on all qubits. Each basis state has equal 25% probability.</p>
        </button>

        <button
          onClick={() => setActiveStage("oracle")}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeStage === "oracle"
              ? "bg-purple-50/80 border-purple-500 shadow-sm"
              : "bg-white border-slate-200 text-slate-700 hover:border-purple-200"
          }`}
        >
          <span className="text-xs font-mono font-bold text-purple-700 block mb-1">Step 2</span>
          <h4 className="text-sm font-bold text-slate-900">2. Phase Oracle</h4>
          <p className="text-xs text-slate-500 mt-1">Inverts the phase of marked target |{targetState}⟩ (|{targetState}⟩ → -|{targetState}⟩).</p>
        </button>

        <button
          onClick={() => setActiveStage("diffusion")}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeStage === "diffusion"
              ? "bg-purple-50/80 border-purple-500 shadow-sm"
              : "bg-white border-slate-200 text-slate-700 hover:border-purple-200"
          }`}
        >
          <span className="text-xs font-mono font-bold text-purple-700 block mb-1">Step 3</span>
          <h4 className="text-sm font-bold text-slate-900">3. Diffusion Operator</h4>
          <p className="text-xs text-slate-500 mt-1">Inversion about the mean amplitude. Target reaches 100%!</p>
        </button>
      </div>

      {/* Probability Amplitude Amplification Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              State Probabilities & Phase Inversion
            </h3>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Query Complexity: O(√N)
            </span>
          </div>

          <div className="space-y-4">
            {sim.statevector.map((item) => {
              const isTarget = item.basis.includes(targetState);
              return (
                <div key={item.index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`font-bold flex items-center gap-2 ${isTarget ? "text-purple-700" : "text-slate-800"}`}>
                      {item.basis} {isTarget && <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 font-bold">Target</span>}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-semibold">
                        Phase: {item.real < -0.01 ? "Negative (-1)" : "Positive (+1)"}
                      </span>
                      <span className={`font-bold ${isTarget ? "text-purple-700" : "text-slate-500"}`}>
                        {(item.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTarget
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600"
                          : "bg-slate-300"
                      }`}
                      style={{ width: `${Math.max(item.probability * 100, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-slate-700 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <span>
              For an unsorted database of size $N=4$ ($n=2$ qubits), classical algorithms require an average of 2.25 queries to find an item. Grover's algorithm succeeds in <strong>exactly 1 iteration with 100% theoretical probability</strong>!
            </span>
          </div>
        </div>

        {/* 1024 Shot Histogram */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Simulated Measurements (1024 Shots)
          </h4>

          <div className="space-y-3">
            {sim.measurements.histogram.map((item, idx) => {
              const isTarget = item.state.includes(targetState);
              return (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={isTarget ? "text-purple-700 font-bold" : "text-slate-600 font-medium"}>
                      {item.state}
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.count} / 1024
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Frequency: {(item.frequency * 100).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroverLab;
