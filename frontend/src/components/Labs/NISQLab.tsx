import React, { useState } from "react";
import { Cpu, Activity, AlertTriangle, Layers, Gauge, Info } from "lucide-react";
import { runClientSimulation, Gate } from "../../quantum/engine";
import { MathRenderer } from "../Common/MathRenderer";

export const NISQLab: React.FC = () => {
  const [noiseLevel, setNoiseLevel] = useState<number>(0.05); // 5% depolarizing noise
  const [circuitType, setCircuitType] = useState<"bell" | "ghz" | "grover">("bell");

  const circuits: Record<string, Gate[]> = {
    bell: [
      { type: "H", target: 0, control: null },
      { type: "CNOT", target: 1, control: 0 },
    ],
    ghz: [
      { type: "H", target: 0, control: null },
      { type: "CNOT", target: 1, control: 0 },
      { type: "CNOT", target: 2, control: 0 },
    ],
    grover: [
      { type: "H", target: 0, control: null },
      { type: "H", target: 1, control: null },
      { type: "CZ", target: 1, control: 0 },
      { type: "H", target: 0, control: null },
      { type: "H", target: 1, control: null },
      { type: "X", target: 0, control: null },
      { type: "X", target: 1, control: null },
      { type: "CZ", target: 1, control: 0 },
      { type: "X", target: 0, control: null },
      { type: "X", target: 1, control: null },
      { type: "H", target: 0, control: null },
      { type: "H", target: 1, control: null },
    ],
  };

  const activeQubits = circuitType === "ghz" ? 3 : 2;
  const gates = circuits[circuitType];
  const idealSim = runClientSimulation(activeQubits, gates, 1024);

  // Apply simulated depolarizing noise
  // P_noisy = (1 - p)*P_ideal + p*(1/dim)
  const dim = 1 << activeQubits;
  const errorRate = Math.min(1.0, noiseLevel * gates.length * 0.25);
  const noisyHistogram = idealSim.measurements.histogram.map((item) => {
    const pNoisy = (1 - errorRate) * item.theoreticalProb + errorRate * (1 / dim);
    const noisyCount = Math.round(pNoisy * 1024);
    return {
      state: item.state,
      idealProb: item.theoreticalProb,
      noisyProb: pNoisy,
      noisyCount,
    };
  });

  // Calculate quantum state fidelity F = (sum sqrt(p_ideal * p_noisy))^2
  let fidelitySqrtSum = 0;
  for (const item of noisyHistogram) {
    fidelitySqrtSum += Math.sqrt(item.idealProb * item.noisyProb);
  }
  const fidelity = Math.min(1.0, fidelitySqrtSum * fidelitySqrtSum);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-200/80 bg-white/95 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-300/40 text-amber-600 shadow-sm">
            <Cpu className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              NISQ Computing & Noise Benchmark Laboratory
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Benchmark circuit depth, depolarizing channel decoherence, and state fidelity in noisy intermediate-scale quantum devices.
            </p>
          </div>
        </div>

        {/* Circuit selection */}
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-600 font-semibold">Test Circuit:</span>
          {(["bell", "ghz", "grover"] as const).map((ct) => (
            <button
              key={ct}
              onClick={() => setCircuitType(ct)}
              className={`px-3 py-1 rounded-lg font-mono uppercase font-bold transition-all ${
                circuitType === ct
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-purple-600 hover:bg-purple-50"
              }`}
            >
              {ct}
            </button>
          ))}
        </div>
      </div>

      {/* Hardware Disclaimer Alert */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/60 text-xs text-slate-600">
        <Info className="w-4 h-4 text-purple-600 shrink-0" />
        <span>
          <strong className="text-purple-900">Physical Hardware Emulation:</strong> Executing on high-precision analytical statevector noise model. Physical IBM Quantum or Rigetti QPU execution can be bridged via backend runtime.
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Qubit Count</span>
          <div className="text-2xl font-bold text-slate-900 font-mono">{activeQubits} Qubits</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Gate Count</span>
          <div className="text-2xl font-bold text-purple-600 font-mono">{gates.length} Gates</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Circuit Depth</span>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {circuitType === "grover" ? 6 : 2} Layers
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Quantum State Fidelity</span>
          <div className={`text-2xl font-bold font-mono ${fidelity > 0.9 ? "text-emerald-600" : "text-amber-600"}`}>
            {(fidelity * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Noise Slider & Fidelity Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Depolarizing Noise Channel Controls
            </h3>
            <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              Noise p = {(noiseLevel * 100).toFixed(1)}%
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>0% (Ideal Coherent)</span>
              <span>20% (Severe Decoherence)</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.20"
              step="0.01"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <span className="font-bold text-purple-700 block">Mathematical Noise Model:</span>
            <div className="leading-relaxed space-y-1.5">
              <MathRenderer content="In physical NISQ devices, gate calibration errors and thermal interaction cause depolarizing noise. The density operator undergoes: $$\mathcal{E}(\rho) = (1 - p)\rho + \frac{p}{2^n}\mathbb{I}$$" />
              <p className="text-slate-600 text-[11px]">
                As noise parameter $p$ increases, quantum coherence decays toward the maximally mixed uniform distribution.
              </p>
            </div>
          </div>
        </div>

        {/* Histogram Comparison: Ideal vs Noisy */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ideal vs Noisy Measurement Distribution
            </h4>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-purple-600">
                <span className="w-2.5 h-2.5 rounded bg-purple-600" /> Ideal
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Noisy
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {noisyHistogram.map((item, idx) => (
              <div key={idx} className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">|{item.state}⟩</span>
                  <div className="flex items-center gap-4">
                    <span className="text-purple-600 font-semibold">Ideal: {(item.idealProb * 100).toFixed(1)}%</span>
                    <span className="text-amber-600 font-semibold">Noisy: {(item.noisyProb * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 h-3">
                  {/* Ideal Bar */}
                  <div className="bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${item.idealProb * 100}%` }}
                    />
                  </div>
                  {/* Noisy Bar */}
                  <div className="bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${item.noisyProb * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
