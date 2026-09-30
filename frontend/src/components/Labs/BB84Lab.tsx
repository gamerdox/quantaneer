import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Play, RefreshCw, Eye, EyeOff, Lock, Unlock, AlertTriangle } from "lucide-react";
import { MathRenderer } from "../Common/MathRenderer";

export const BB84Lab: React.FC = () => {
  const [numBits, setNumBits] = useState<number>(16);
  const [enableEve, setEnableEve] = useState<boolean>(false);
  const [labResult, setLabResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/labs/bb84", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num_bits: numBits,
          enable_eve: enableEve,
          sample_fraction: 0.35,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLabResult(data);
      }
    } catch {
      runLocalBB84();
    } finally {
      setLoading(false);
    }
  };

  const runLocalBB84 = () => {
    const bases = ["+", "x"];
    const timeline: any[] = [];
    let siftedMatch = 0;
    let errors = 0;

    for (let i = 0; i < numBits; i++) {
      const aBit = Math.round(Math.random());
      const aBase = bases[Math.floor(Math.random() * 2)];
      const bBase = bases[Math.floor(Math.random() * 2)];

      let eveBase: string | null = null;
      let eveBit: number | null = null;
      let photonBit = aBit;
      let photonBase = aBase;

      if (enableEve) {
        eveBase = bases[Math.floor(Math.random() * 2)];
        eveBit = eveBase === aBase ? aBit : Math.round(Math.random());
        photonBit = eveBit;
        photonBase = eveBase;
      }

      const bBit = bBase === photonBase ? photonBit : Math.round(Math.random());
      const baseMatch = aBase === bBase;

      if (baseMatch) {
        siftedMatch++;
        if (aBit !== bBit) errors++;
      }

      timeline.push({
        index: i,
        alice_bit: aBit,
        alice_basis: aBase,
        eve_present: enableEve,
        eve_basis: eveBase,
        eve_measured: eveBit,
        bob_basis: bBase,
        bob_measured: bBit,
        basis_matched: baseMatch,
        sifted_key_bit: baseMatch ? aBit : null,
      });
    }

    const qber = siftedMatch > 0 ? (errors / siftedMatch) * 100 : 0;
    setLabResult({
      total_qubits_sent: numBits,
      eve_intercepted: enableEve,
      sifted_key_length: siftedMatch,
      qber_percentage: Number(qber.toFixed(1)),
      is_secure: qber <= 11.0,
      security_verdict:
        qber <= 11.0
          ? "Quantum channel is secure. Key successfully negotiated."
          : "Eve detected! Elevated QBER exceeded the 11% threshold. Transmission aborted.",
      timeline,
    });
  };

  useEffect(() => {
    runSimulation();
  }, [enableEve]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shadow-sm">
            <Lock className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              BB84 Quantum Key Distribution Laboratory
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Simulate photon polarization key exchange between Alice and Bob protected by the No-Cloning Theorem.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEnableEve((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              enableEve
                ? "bg-rose-50 border-rose-300 text-rose-700 shadow-sm"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
            }`}
          >
            {enableEve ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {enableEve ? "Eve Active (Intercepting)" : "Enable Eve (Eavesdropper)"}
          </button>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Transmit Photons
          </button>
        </div>
      </div>

      {/* Security Verdict Banner */}
      {labResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            labResult.is_secure
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-rose-50 border-rose-300 text-rose-950"
          }`}
        >
          <div className="flex items-center gap-3">
            {labResult.is_secure ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 animate-pulse" />
            )}
            <div>
              <h4 className="font-bold text-sm">
                {labResult.is_secure ? "Quantum Channel Verification Passed" : "Quantum Security Compromise Detected!"}
              </h4>
              <p className="text-xs text-slate-700 mt-0.5">{labResult.security_verdict}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-mono block text-slate-500 font-semibold">Measured QBER</span>
            <span
              className={`text-lg font-mono font-bold ${
                labResult.is_secure ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {labResult.qber_percentage}%
            </span>
            <span className="text-[10px] text-slate-500 block">(Threshold: 11%)</span>
          </div>
        </div>
      )}

      {/* Protocol Visual Table */}
      {labResult && (
        <div className="glass-panel p-5 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Photon-by-Photon Transmission Stream
            </h3>
            <span className="text-xs text-slate-600 font-mono font-medium">
              Sifted Key Length: <strong className="text-purple-700">{labResult.sifted_key_length}</strong> bits
            </span>
          </div>

          {/* Grid of Photons */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[700px] space-y-2 text-xs font-mono">
              {/* Alice Bits */}
              <div className="flex items-center gap-2">
                <span className="w-32 text-slate-600 font-bold shrink-0">Alice Raw Bits:</span>
                <div className="flex gap-1.5">
                  {labResult.timeline.map((item: any) => (
                    <div
                      key={item.index}
                      className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-900"
                    >
                      {item.alice_bit}
                    </div>
                  ))}
                </div>
              </div>

              {/* Alice Bases */}
              <div className="flex items-center gap-2">
                <span className="w-32 text-purple-700 font-bold shrink-0">Alice Bases:</span>
                <div className="flex gap-1.5">
                  {labResult.timeline.map((item: any) => (
                    <div
                      key={item.index}
                      className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-purple-800"
                    >
                      {item.alice_basis}
                    </div>
                  ))}
                </div>
              </div>

              {/* Eve Bases (if enabled) */}
              {enableEve && (
                <div className="flex items-center gap-2">
                  <span className="w-32 text-rose-700 font-bold shrink-0">Eve Bases:</span>
                  <div className="flex gap-1.5">
                    {labResult.timeline.map((item: any) => (
                      <div
                        key={item.index}
                        className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center font-bold text-rose-800"
                      >
                        {item.eve_basis || "-"}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bob Bases */}
              <div className="flex items-center gap-2">
                <span className="w-32 text-indigo-700 font-bold shrink-0">Bob Bases:</span>
                <div className="flex gap-1.5">
                  {labResult.timeline.map((item: any) => (
                    <div
                      key={item.index}
                      className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-indigo-800"
                    >
                      {item.bob_basis}
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched Sifted Key */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <span className="w-32 text-emerald-700 font-bold shrink-0">Shared Key:</span>
                <div className="flex gap-1.5">
                  {labResult.timeline.map((item: any) => (
                    <div
                      key={item.index}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        item.basis_matched
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-slate-100 text-slate-300"
                      }`}
                    >
                      {item.basis_matched ? item.sifted_key_bit : "-"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BB84Lab;
