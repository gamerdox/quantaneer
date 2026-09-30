import React, { useState, useEffect, useRef } from "react";
import {
  Gate,
  SimulationResult,
  runClientSimulation,
} from "../../quantum/engine";
import { BlochSphere } from "../BlochSphere";
import { MathRenderer } from "../Common/MathRenderer";
import {
  Play,
  RotateCcw,
  StepForward,
  Download,
  Copy,
  Check,
  Sparkles,
  Info,
  Layers,
  BarChart3,
  FileCode,
  AlertTriangle,
  Undo2,
  Redo2,
  BookmarkPlus,
  FolderOpen,
  Sliders,
  Move
} from "lucide-react";

interface CircuitSimulatorProps {
  initialQubits?: number;
  initialGates?: Gate[];
  onCircuitChange?: (gates: Gate[]) => void;
}

export const CircuitSimulator: React.FC<CircuitSimulatorProps> = ({
  initialQubits = 2,
  initialGates = [
    { type: "H", target: 0, control: null },
    { type: "CNOT", target: 1, control: 0 },
  ],
  onCircuitChange,
}) => {
  const [numQubits, setNumQubits] = useState<number>(initialQubits);
  const [numCols, setNumCols] = useState<number>(8);
  const [gates, setGates] = useState<Gate[]>(initialGates);
  const [shots, setShots] = useState<number>(1024);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [selectedGateType, setSelectedGateType] = useState<string>("H");
  const [activeBlochQubit, setActiveBlochQubit] = useState<number>(0);
  const [selectedControlQubit, setSelectedControlQubit] = useState<number>(0);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<Gate[][]>([]);
  const [future, setFuture] = useState<Gate[][]>([]);

  // Step mode state
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  // OpenQASM & Save Modals
  const [showQasmModal, setShowQasmModal] = useState<boolean>(false);
  const [copiedQasm, setCopiedQasm] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showLoadModal, setShowLoadModal] = useState<boolean>(false);
  const [circuitName, setCircuitName] = useState<string>("Custom Circuit");
  const [savedCircuits, setSavedCircuits] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // AI explanation drawer
  const [showAiExplanation, setShowAiExplanation] = useState<boolean>(false);
  const [aiExplanationLevel, setAiExplanationLevel] = useState<"simple" | "intermediate" | "technical">("intermediate");
  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Dragging state
  const [draggedGateType, setDraggedGateType] = useState<string | null>(null);
  const [draggedGateIndex, setDraggedGateIndex] = useState<number | null>(null);

  // Error state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update simulation
  useEffect(() => {
    const gatesToRun = stepIndex === null ? gates : gates.slice(0, stepIndex);
    try {
      const result = runClientSimulation(numQubits, gatesToRun, shots);
      setSimulation(result);
      setValidationError(null);
      if (onCircuitChange) onCircuitChange(gates);
    } catch (err: any) {
      setValidationError(err.message || "Circuit execution failed.");
    }
  }, [numQubits, gates, stepIndex, shots]);

  // Keyboard shortcut listener for Ctrl+Z (Undo) and Ctrl+Y (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, future, gates]);

  // Push to undo stack
  const applyCircuitChange = (newGates: Gate[]) => {
    setHistory((prev) => [...prev, gates]);
    setFuture([]);
    setGates(newGates);
    setStepIndex(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [gates, ...prev]);
    setGates(previous);
    setStepIndex(null);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, gates]);
    setGates(next);
    setStepIndex(null);
  };

  // Drag and Drop handlers
  const handleDragStartFromPalette = (e: React.DragEvent, gateKey: string) => {
    setDraggedGateType(gateKey);
    setDraggedGateIndex(null);
    e.dataTransfer.setData("text/plain", gateKey);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragStartFromWire = (e: React.DragEvent, gateIdx: number) => {
    setDraggedGateIndex(gateIdx);
    setDraggedGateType(gates[gateIdx].type);
    e.dataTransfer.setData("text/plain", gates[gateIdx].type);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnSlot = (wireIdx: number, colIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    setValidationError(null);

    const gateType = draggedGateType || e.dataTransfer.getData("text/plain") || selectedGateType;
    if (!gateType) return;

    let newGate: Gate;
    if (["CNOT", "CZ", "SWAP"].includes(gateType)) {
      const ctrl = selectedControlQubit === wireIdx ? (wireIdx === 0 ? 1 : 0) : selectedControlQubit;
      newGate = {
        type: gateType as any,
        target: wireIdx,
        control: ctrl,
      };
    } else {
      newGate = {
        type: gateType as any,
        target: wireIdx,
        control: null,
      };
    }

    if (draggedGateIndex !== null) {
      // Move existing gate
      const updated = [...gates];
      updated.splice(draggedGateIndex, 1);
      // Insert at approximate position
      updated.push(newGate);
      applyCircuitChange(updated);
    } else {
      // Place new gate
      applyCircuitChange([...gates, newGate]);
    }

    setDraggedGateType(null);
    setDraggedGateIndex(null);
  };

  // Direct Click to Place Gate
  const handlePlaceGateClick = (wireIdx: number) => {
    setValidationError(null);
    let newGate: Gate;

    if (["CNOT", "CZ", "SWAP"].includes(selectedGateType)) {
      if (selectedControlQubit === wireIdx) {
        setValidationError(`Control qubit and target qubit cannot be the same wire (q[${wireIdx}]).`);
        return;
      }
      newGate = {
        type: selectedGateType as any,
        target: wireIdx,
        control: selectedControlQubit,
      };
    } else {
      newGate = {
        type: selectedGateType as any,
        target: wireIdx,
        control: null,
      };
    }

    applyCircuitChange([...gates, newGate]);
  };

  const handleRemoveGate = (gateIdx: number) => {
    applyCircuitChange(gates.filter((_, idx) => idx !== gateIdx));
  };

  const handleResetCircuit = () => {
    applyCircuitChange([]);
    setValidationError(null);
  };

  const handleStepForward = () => {
    if (gates.length === 0) return;
    if (stepIndex === null) {
      setStepIndex(1);
    } else if (stepIndex < gates.length) {
      setStepIndex((prev) => (prev !== null ? prev + 1 : 1));
    } else {
      setStepIndex(0);
    }
  };

  // Prebuilt circuits loader
  const loadPrebuiltCircuit = (type: string) => {
    setValidationError(null);
    switch (type) {
      case "superposition":
        setNumQubits(1);
        setActiveBlochQubit(0);
        applyCircuitChange([{ type: "H", target: 0, control: null }]);
        break;
      case "bit_flip":
        setNumQubits(1);
        setActiveBlochQubit(0);
        applyCircuitChange([{ type: "X", target: 0, control: null }]);
        break;
      case "bell_state":
        setNumQubits(2);
        setActiveBlochQubit(0);
        applyCircuitChange([
          { type: "H", target: 0, control: null },
          { type: "CNOT", target: 1, control: 0 },
        ]);
        break;
      case "ghz":
        setNumQubits(3);
        setActiveBlochQubit(0);
        applyCircuitChange([
          { type: "H", target: 0, control: null },
          { type: "CNOT", target: 1, control: 0 },
          { type: "CNOT", target: 2, control: 0 },
        ]);
        break;
      case "grover":
        setNumQubits(2);
        setActiveBlochQubit(0);
        applyCircuitChange([
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
        ]);
        break;
      case "teleportation":
        setNumQubits(3);
        setActiveBlochQubit(0);
        applyCircuitChange([
          { type: "H", target: 0, control: null },
          { type: "H", target: 1, control: null },
          { type: "CNOT", target: 2, control: 1 },
          { type: "CNOT", target: 1, control: 0 },
          { type: "H", target: 0, control: null },
          { type: "CNOT", target: 2, control: 1 },
          { type: "CZ", target: 2, control: 0 },
        ]);
        break;
      case "deutsch_jozsa_balanced":
        setNumQubits(2);
        setActiveBlochQubit(0);
        applyCircuitChange([
          { type: "X", target: 1, control: null },
          { type: "H", target: 0, control: null },
          { type: "H", target: 1, control: null },
          { type: "CNOT", target: 1, control: 0 },
          { type: "H", target: 0, control: null },
        ]);
        break;
      case "deutsch_jozsa_constant":
        setNumQubits(2);
        setActiveBlochQubit(0);
        applyCircuitChange([
          { type: "X", target: 1, control: null },
          { type: "H", target: 0, control: null },
          { type: "H", target: 1, control: null },
          { type: "H", target: 0, control: null },
        ]);
        break;
    }
  };

  // Save / Load Circuit
  const handleSaveCircuit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/practice/circuit/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user_default",
          name: circuitName || "Custom Circuit",
          num_qubits: numQubits,
          gates: gates,
        }),
      });
      if (res.ok) {
        setShowSaveModal(false);
      }
    } catch {
      // save failed
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenLoadModal = async () => {
    setShowLoadModal(true);
    try {
      const res = await fetch("/api/practice/circuit/list?user_id=user_default");
      if (res.ok) {
        const data = await res.json();
        setSavedCircuits(data.circuits || []);
      }
    } catch {
      // list failed
    }
  };

  const handleLoadSavedCircuit = async (circId: string) => {
    try {
      const res = await fetch(`/api/practice/circuit/${circId}`);
      if (res.ok) {
        const data = await res.json();
        const c = data.circuit;
        setNumQubits(c.num_qubits);
        applyCircuitChange(c.gates);
        setShowLoadModal(false);
      }
    } catch {
      // load failed
    }
  };

  // Fetch AI explanation
  const fetchAiExplanation = async () => {
    setShowAiExplanation(true);
    setLoadingAi(true);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num_qubits: numQubits,
          gates: stepIndex === null ? gates : gates.slice(0, stepIndex),
          level: aiExplanationLevel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiExplanation(data);
      } else {
        setAiExplanation({
          title: "Circuit State Analysis",
          summary: `Active circuit contains ${gates.length} gates on ${numQubits} qubits.`,
          details: "Quantum state evolved through unitary matrix operations preserving L2 probability norm.",
          physical_intuition: "Superposition and entanglement dictate final measurement outcomes."
        });
      }
    } catch {
      setAiExplanation({
        title: "Simulation Analysis",
        summary: `The circuit statevector was calculated across ${1 << numQubits} computational basis dimensions.`,
        details: "Probabilities reflect the absolute square of each complex amplitude.",
        physical_intuition: "Constructive and destructive phase interference determine probability density."
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCopyQasm = () => {
    if (!simulation) return;
    navigator.clipboard.writeText(simulation.openqasm);
    setCopiedQasm(true);
    setTimeout(() => setCopiedQasm(false), 2000);
  };

  const handleDownloadQasm = () => {
    if (!simulation) return;
    const blob = new Blob([simulation.openqasm], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quantaneer_circuit.qasm";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Gate definitions with KaTeX formulas
  const GATE_INFO: Record<string, { name: string; color: string; desc: string; math: string; border: string; bg: string }> = {
    H: {
      name: "Hadamard",
      color: "text-purple-700",
      border: "border-purple-300",
      bg: "bg-purple-50",
      desc: "Creates equal superposition",
      math: "$$H|0\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) = |+\\rangle$$"
    },
    X: {
      name: "Pauli-X",
      color: "text-orange-700",
      border: "border-orange-300",
      bg: "bg-orange-50",
      desc: "Bit flip (Quantum NOT)",
      math: "$$X|0\\rangle = |1\\rangle, \\quad X|1\\rangle = |0\\rangle$$"
    },
    Y: {
      name: "Pauli-Y",
      color: "text-amber-700",
      border: "border-amber-300",
      bg: "bg-amber-50",
      desc: "Bit and phase flip",
      math: "$$Y|0\\rangle = i|1\\rangle, \\quad Y|1\\rangle = -i|0\\rangle$$"
    },
    Z: {
      name: "Pauli-Z",
      color: "text-emerald-700",
      border: "border-emerald-300",
      bg: "bg-emerald-50",
      desc: "Phase flip (|1⟩ → -|1⟩)",
      math: "$$Z|0\\rangle = |0\\rangle, \\quad Z|1\\rangle = -|1\\rangle$$"
    },
    S: {
      name: "Phase (S)",
      color: "text-indigo-700",
      border: "border-indigo-300",
      bg: "bg-indigo-50",
      desc: "π/2 Phase Gate (√Z)",
      math: "$$S|1\\rangle = e^{i\\pi/2}|1\\rangle = i|1\\rangle$$"
    },
    T: {
      name: "π/8 Gate (T)",
      color: "text-pink-700",
      border: "border-pink-300",
      bg: "bg-pink-50",
      desc: "π/4 Phase Gate (√S)",
      math: "$$T|1\\rangle = e^{i\\pi/4}|1\\rangle$$"
    },
    CNOT: {
      name: "CNOT (CX)",
      color: "text-blue-700",
      border: "border-blue-300",
      bg: "bg-blue-50",
      desc: "Controlled-NOT Entangler",
      math: "$$\\text{CNOT}|c, t\\rangle = |c, c \\oplus t\\rangle$$"
    },
    CZ: {
      name: "CZ",
      color: "text-teal-700",
      border: "border-teal-300",
      bg: "bg-teal-50",
      desc: "Controlled-Phase Gate",
      math: "$$\\text{CZ}|11\\rangle = -|11\\rangle$$"
    },
    SWAP: {
      name: "SWAP",
      color: "text-amber-700",
      border: "border-amber-300",
      bg: "bg-amber-50",
      desc: "Exchange two qubit states",
      math: "$$\\text{SWAP}|x, y\\rangle = |y, x\\rangle$$"
    },
  };

  return (
    <div className="space-y-6">
      {/* Simulator Control Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-purple-100 bg-white/95 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700 shadow-sm">
                <Layers className="w-5 h-5" />
              </span>
              Quantum Circuit Designer & Lab
            </h1>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
              Statevector Rigor v2.0
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Drag and drop quantum gates onto the wire grid, verify unitary statevector evolution, and step through operations.
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Circuits Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-inner">
            <span className="text-slate-500 font-medium">Presets:</span>
            <select
              onChange={(e) => loadPrebuiltCircuit(e.target.value)}
              className="bg-transparent text-purple-700 font-bold focus:outline-none cursor-pointer"
              defaultValue="bell_state"
            >
              <option value="superposition">1. Superposition (|0⟩ → H)</option>
              <option value="bit_flip">2. Bit Flip (|0⟩ → X)</option>
              <option value="bell_state">3. Bell State |Φ+⟩ (Entanglement)</option>
              <option value="ghz">4. GHZ 3-Qubit State</option>
              <option value="grover">5. Grover 2-Qubit Search</option>
              <option value="teleportation">6. Quantum Teleportation</option>
              <option value="deutsch_jozsa_balanced">7. Deutsch-Jozsa (Balanced Oracle)</option>
              <option value="deutsch_jozsa_constant">8. Deutsch-Jozsa (Constant Oracle)</option>
            </select>
          </div>

          {/* Undo / Redo Buttons */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo (Ctrl+Z)"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-purple-700 hover:border-purple-300 disabled:opacity-40 disabled:pointer-events-none shadow-sm transition-all cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={future.length === 0}
            title="Redo (Ctrl+Y)"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-purple-700 hover:border-purple-300 disabled:opacity-40 disabled:pointer-events-none shadow-sm transition-all cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Save / Load Custom Layout */}
          <button
            onClick={() => setShowSaveModal(true)}
            title="Save custom circuit layout"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-purple-700 hover:border-purple-300 shadow-sm transition-all cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenLoadModal}
            title="Load saved circuit layout"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-purple-700 hover:border-purple-300 shadow-sm transition-all cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          {/* Run button */}
          <button
            onClick={() => setStepIndex(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Simulate
          </button>

          {/* Step through */}
          <button
            onClick={handleStepForward}
            title="Step through circuit gate-by-gate"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs border border-slate-200 transition-all cursor-pointer"
          >
            <StepForward className="w-3.5 h-3.5 text-purple-600" />
            Step {stepIndex !== null ? `(${stepIndex}/${gates.length})` : ""}
          </button>

          {/* Reset */}
          <button
            onClick={handleResetCircuit}
            title="Reset circuit to ground state"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-medium rounded-xl text-xs border border-slate-200 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          {/* Export OpenQASM */}
          <button
            onClick={() => setShowQasmModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-all cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-purple-600" />
            OpenQASM
          </button>

          {/* AI Explain */}
          <button
            onClick={fetchAiExplanation}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Explain
          </button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Designer Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Gate Palette & Circuit Window */}
        <div className="xl:col-span-8 space-y-6">
          {/* Gate Palette Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-purple-600" />
                  Gate Palette
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  (Drag gate icon into wire grid or click to select)
                </span>
              </div>

              {/* Layout Customizer Controls */}
              <div className="flex items-center gap-4 text-xs">
                {/* Number of Qubits */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Qubits:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setNumQubits(n);
                          applyCircuitChange(gates.filter((g) => g.target < n && (g.control === null || g.control === undefined || g.control < n)));
                        }}
                        className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded transition-colors ${
                          numQubits === n
                            ? "bg-purple-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Depth Columns */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Depth:</span>
                  <select
                    value={numCols}
                    onChange={(e) => setNumCols(Number(e.target.value))}
                    className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-xs font-mono text-slate-800 font-semibold focus:outline-none"
                  >
                    {[6, 8, 10, 12].map((c) => (
                      <option key={c} value={c}>{c} steps</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Draggable Gate Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {Object.entries(GATE_INFO).map(([key, info]) => (
                <div
                  key={key}
                  draggable
                  onDragStart={(e) => handleDragStartFromPalette(e, key)}
                  onClick={() => setSelectedGateType(key)}
                  className={`relative group px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-grab active:cursor-grabbing border ${
                    selectedGateType === key
                      ? `${info.bg} ${info.color} ${info.border} ring-2 ring-purple-400 shadow-md scale-105`
                      : `bg-slate-50 hover:bg-slate-100 ${info.color} border-slate-200`
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{key}</span>
                  </div>

                  {/* Math Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 w-52 p-2.5 rounded-xl bg-white border border-slate-200 shadow-xl pointer-events-none text-slate-800">
                    <p className="font-bold text-slate-900 text-xs">{info.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{info.desc}</p>
                    <div className="mt-1 pt-1 border-t border-slate-100">
                      <MathRenderer content={info.math} className="text-xs" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Control Wire Selector for 2-Qubit Gates */}
              {["CNOT", "CZ", "SWAP"].includes(selectedGateType) && (
                <div className="flex items-center gap-2 ml-auto text-xs bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 text-purple-900">
                  <span className="font-semibold">Control Wire:</span>
                  <select
                    value={selectedControlQubit}
                    onChange={(e) => setSelectedControlQubit(Number(e.target.value))}
                    className="bg-white text-purple-700 border border-purple-200 rounded px-2 py-0.5 text-xs font-mono font-bold focus:outline-none"
                  >
                    {Array.from({ length: numQubits }).map((_, i) => (
                      <option key={i} value={i}>
                        q[{i}]
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Rectangular Circuit Window (Wire Grid) */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm overflow-x-auto min-h-[340px] flex flex-col justify-center">
            {/* Timeline column header */}
            <div className="min-w-[640px] mb-4 flex items-center pl-20 pr-4">
              <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${numCols}, minmax(48px, 1fr))` }}>
                {Array.from({ length: numCols }).map((_, col) => (
                  <div key={col} className="text-center text-[10px] font-mono font-semibold text-slate-400">
                    T{col}
                  </div>
                ))}
              </div>
            </div>

            {/* Qubit Wires */}
            <div className="min-w-[640px] space-y-6">
              {Array.from({ length: numQubits }).map((_, qIdx) => {
                return (
                  <div key={qIdx} className="relative flex items-center gap-3">
                    {/* Qubit Wire Label */}
                    <div className="flex items-center gap-2 w-16 shrink-0">
                      <span className="font-mono text-sm font-bold text-purple-700">
                        q[{qIdx}]
                      </span>
                      <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                        |0⟩
                      </span>
                    </div>

                    {/* Rectangular Wire Track Container */}
                    <div className="relative flex-1 h-14 bg-slate-50/80 rounded-xl px-2 border border-slate-200 hover:border-purple-300 transition-colors flex items-center shadow-inner">
                      {/* Central Wire Line */}
                      <div className="absolute inset-x-0 h-0.5 bg-slate-300 pointer-events-none" />

                      {/* Drop Slots Column Grid */}
                      <div
                        className="relative z-10 w-full grid gap-2 items-center"
                        style={{ gridTemplateColumns: `repeat(${numCols}, minmax(48px, 1fr))` }}
                      >
                        {Array.from({ length: numCols }).map((_, colIdx) => {
                          // Check if any gate is mapped to this column
                          // For intuitive layout, gate at index `colIdx` occupies this column
                          const gateAtCol = gates[colIdx];
                          const hasGate = gateAtCol !== undefined;
                          const isTarget = hasGate && gateAtCol.target === qIdx;
                          const isControl = hasGate && gateAtCol.control === qIdx;
                          const isCurrentStep = stepIndex !== null && colIdx === stepIndex - 1;

                          return (
                            <div
                              key={colIdx}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "copy";
                              }}
                              onDrop={(e) => handleDropOnSlot(qIdx, colIdx, e)}
                              onClick={() => {
                                if (!hasGate) handlePlaceGateClick(qIdx);
                              }}
                              className={`h-11 rounded-lg flex items-center justify-center transition-all ${
                                !hasGate
                                  ? "hover:bg-purple-100/50 hover:border hover:border-dashed hover:border-purple-400 cursor-pointer"
                                  : ""
                              }`}
                            >
                              {isControl && (
                                <div className="relative w-8 h-8 flex items-center justify-center">
                                  <div className="w-3.5 h-3.5 rounded-full bg-purple-700 shadow-sm" />
                                  <div className="absolute -bottom-2 text-[8px] font-mono text-purple-700 font-bold">
                                    ctrl
                                  </div>
                                </div>
                              )}

                              {isTarget && (
                                <div
                                  draggable
                                  onDragStart={(e) => handleDragStartFromWire(e, colIdx)}
                                  className={`relative group w-10 h-10 rounded-xl flex items-center justify-center text-xs font-mono font-bold shadow-md cursor-grab active:cursor-grabbing transition-all ${
                                    isCurrentStep
                                      ? "ring-2 ring-purple-600 scale-110 shadow-purple-500/30"
                                      : "hover:scale-105"
                                  } ${
                                    GATE_INFO[gateAtCol.type]
                                      ? `${GATE_INFO[gateAtCol.type].bg} ${GATE_INFO[gateAtCol.type].color} ${GATE_INFO[gateAtCol.type].border} border`
                                      : "bg-purple-600 text-white"
                                  }`}
                                >
                                  {gateAtCol.type}

                                  {/* Remove Gate Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveGate(colIdx);
                                    }}
                                    title="Delete Gate"
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step Mode Footer */}
            {stepIndex !== null && (
              <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-purple-700 font-mono font-bold">
                  Step Mode: Executed {stepIndex} of {gates.length} gates
                </span>
                <button
                  onClick={() => setStepIndex(null)}
                  className="text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                >
                  Exit Step Mode
                </button>
              </div>
            )}
          </div>

          {/* Probabilities & Measurement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theoretical Statevector Probabilities */}
            <div className="glass-panel p-5 rounded-2xl border border-purple-100 bg-white/95 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Statevector Probabilities (|ψ|²)
                </h3>
                <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-semibold">
                  Exact Mathematical Values
                </span>
              </div>

              {simulation && (
                <div className="space-y-3">
                  {simulation.statevector.map((item) => (
                    <div key={item.index} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-slate-800">{item.basis}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-500">
                            Amp: {item.real.toFixed(2)} + {item.imag.toFixed(2)}i
                          </span>
                          <span className="text-purple-700 font-bold">
                            {(item.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(item.probability * 100, 1.5)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Measurement Statistics (Shots) */}
            <div className="glass-panel p-5 rounded-2xl border border-purple-100 bg-white/95 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Measurement Statistics
                  </h3>
                  <span className="text-[10px] font-mono text-purple-700 font-bold">
                    ({shots} Shots)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  {[512, 1024, 4096].map((s) => (
                    <button
                      key={s}
                      onClick={() => setShots(s)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors ${
                        shots === s
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {simulation && (
                <div className="space-y-3">
                  {simulation.measurements.histogram.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-slate-800">{item.state}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-500">
                            {item.count} counts
                          </span>
                          <span className="text-amber-600 font-bold">
                            {(item.frequency * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(item.frequency * 100, 1.5)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 3D Bloch Sphere & Gate Reference */}
        <div className="xl:col-span-4 space-y-6">
          {simulation && (
            <BlochSphere
              coordinates={simulation.blochSpheres}
              activeQubit={activeBlochQubit}
              onSelectQubit={setActiveBlochQubit}
            />
          )}

          {/* Educational Formula Reference Card */}
          <div className="glass-panel p-5 rounded-2xl border border-purple-100 bg-white/95 shadow-sm text-xs space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-600" />
              Selected Gate Mathematics
            </h4>
            {GATE_INFO[selectedGateType] && (
              <div className="space-y-2">
                <p className="font-semibold text-purple-900">
                  {GATE_INFO[selectedGateType].name} ({selectedGateType})
                </p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <MathRenderer content={GATE_INFO[selectedGateType].math} />
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {GATE_INFO[selectedGateType].desc}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Explanation Modal */}
      {showAiExplanation && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-purple-200 p-6 space-y-5 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  AI Quantum Mentor: What Just Happened?
                </h3>
              </div>
              <button
                onClick={() => setShowAiExplanation(false)}
                className="text-slate-400 hover:text-slate-800 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Depth Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Explanation Depth:</span>
              {(["simple", "intermediate", "technical"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setAiExplanationLevel(lvl);
                    fetchAiExplanation();
                  }}
                  className={`px-3 py-1 rounded-lg capitalize font-bold transition-colors ${
                    aiExplanationLevel === lvl
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {loadingAi ? (
              <div className="py-12 text-center text-slate-500 animate-pulse text-sm">
                Analyzing quantum state evolution and unitary operations...
              </div>
            ) : aiExplanation ? (
              <div className="space-y-4 text-sm leading-relaxed">
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <h4 className="font-bold text-purple-900">{aiExplanation.title}</h4>
                  <MathRenderer content={aiExplanation.summary} className="text-slate-700 mt-1" />
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Unitary & Statevector Mechanics:
                  </h5>
                  <MathRenderer content={aiExplanation.details} className="text-slate-700" />
                </div>

                {aiExplanation.physical_intuition && (
                  <div className="space-y-2 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                    <h5 className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                      Physical Intuition:
                    </h5>
                    <MathRenderer content={aiExplanation.physical_intuition} className="text-amber-800 text-xs" />
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowAiExplanation(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OpenQASM Export Modal */}
      {showQasmModal && simulation && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl border border-purple-200 p-6 space-y-4 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">
                  OpenQASM 2.0 Code Export
                </h3>
              </div>
              <button
                onClick={() => setShowQasmModal(false)}
                className="text-slate-400 hover:text-slate-800 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-purple-300 font-mono text-xs overflow-x-auto border border-slate-800 max-h-64 shadow-inner">
              {simulation.openqasm}
            </pre>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={handleCopyQasm}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {copiedQasm ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedQasm ? "Copied!" : "Copy Code"}
              </button>

              <button
                onClick={handleDownloadQasm}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download .qasm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Custom Circuit Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-purple-200 p-6 space-y-4 bg-white shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookmarkPlus className="w-5 h-5 text-purple-600" />
              Save Custom Layout
            </h3>
            <p className="text-xs text-slate-500">
              Save your circuit configuration to your profile database.
            </p>
            <input
              type="text"
              value={circuitName}
              onChange={(e) => setCircuitName(e.target.value)}
              placeholder="e.g. My Entanglement Circuit"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCircuit}
                disabled={isSaving}
                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs"
              >
                {isSaving ? "Saving..." : "Save to Database"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Custom Circuit Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-purple-200 p-6 space-y-4 bg-white shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-600" />
              Load Saved Circuit
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedCircuits.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No saved circuits found in your database.</p>
              ) : (
                savedCircuits.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleLoadSavedCircuit(c.id)}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50 flex items-center justify-between text-left transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                      <p className="text-[11px] text-slate-500">{c.num_qubits} Qubits • Updated {c.updated_at?.split(" ")[0]}</p>
                    </div>
                    <span className="text-xs text-purple-600 font-bold">Load →</span>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CircuitSimulator;
