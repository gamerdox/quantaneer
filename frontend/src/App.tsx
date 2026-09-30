import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navigation/Navbar";
import { HomeView } from "./components/Home/HomeView";
import { LearnCurriculum } from "./components/Learn/LearnCurriculum";
import { CircuitSimulator } from "./components/Simulator/CircuitSimulator";
import { LabsOverview } from "./components/Labs/LabsOverview";
import { PracticeHub } from "./components/Practice/PracticeHub";
import { AITutorView } from "./components/AITutor/AITutorView";
import { ProgressDashboard } from "./components/Progress/ProgressDashboard";
import { InstructorView } from "./components/Instructor/InstructorView";
import { GuidedDemoModal } from "./components/Demo/GuidedDemoModal";
import { Gate } from "./quantum/engine";
import { Sparkles, Terminal, ShieldCheck, Heart } from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

  // Authenticated User State
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem("quantaneer_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      id: "user_aarav",
      name: "Aarav Sharma",
      email: "aarav.sharma@quantaneer.edu",
      role: "student",
      xp: 450,
      level: 3,
      streak_days: 5,
    };
  });

  // Verify auth session on mount
  useEffect(() => {
    const token = localStorage.getItem("quantaneer_token");
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.user) {
            setCurrentUser(data.user);
            localStorage.setItem("quantaneer_user", JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleUserUpdate = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem("quantaneer_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    localStorage.removeItem("quantaneer_token");
    localStorage.removeItem("quantaneer_user");
    setCurrentUser(null);
  };

  // Cross-component state: circuit transferred into simulator from Learn or Home
  const [simulatorConfig, setSimulatorConfig] = useState<{
    numQubits: number;
    gates: Gate[];
  }>({
    numQubits: 2,
    gates: [
      { type: "H", target: 0, control: null },
      { type: "CNOT", target: 1, control: 0 },
    ],
  });

  const handleOpenInSimulator = (qubits: number, gates: Gate[]) => {
    setSimulatorConfig({ numQubits: qubits, gates });
    setActiveTab("simulator");
  };

  const handleApplyFixFromAI = (fixedGates: Gate[]) => {
    setSimulatorConfig((prev) => ({ ...prev, gates: fixedGates }));
    setActiveTab("simulator");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 quantum-grid flex flex-col justify-between selection:bg-purple-500/20 selection:text-purple-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onUserUpdate={handleUserUpdate}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "home" && (
          <HomeView
            onNavigate={setActiveTab}
            onLaunchDemoCircuit={handleOpenInSimulator}
            onOpenGuidedDemo={() => setIsDemoModalOpen(true)}
          />
        )}

        {activeTab === "learn" && (
          <LearnCurriculum onOpenInSimulator={handleOpenInSimulator} />
        )}

        {activeTab === "simulator" && (
          <CircuitSimulator
            key={JSON.stringify(simulatorConfig)}
            initialQubits={simulatorConfig.numQubits}
            initialGates={simulatorConfig.gates}
            onCircuitChange={(updatedGates) =>
              setSimulatorConfig((prev) => ({ ...prev, gates: updatedGates }))
            }
          />
        )}

        {activeTab === "labs" && <LabsOverview />}

        {activeTab === "practice" && <PracticeHub />}

        {activeTab === "ai-tutor" && (
          <AITutorView
            currentCircuit={simulatorConfig}
            onApplyFix={handleApplyFixFromAI}
          />
        )}

        {activeTab === "progress" && <ProgressDashboard />}

        {activeTab === "instructor" && <InstructorView />}
      </main>

      {/* Interactive Guided Demo Floating Modal */}
      <GuidedDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onJumpToSection={setActiveTab}
      />

      {/* Quick Launch Demo Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsDemoModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs shadow-xl shadow-purple-500/30 hover:scale-105 transition-all cursor-pointer border border-purple-300/40"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          Guided Demo Tour
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white/90 backdrop-blur-md py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-slate-800">
              QUANTANEER (QuantumLearn AI)
            </span>
            <span>•</span>
            <span className="font-mono text-purple-700 font-semibold">
              SIH 2026 Problem Statement 26140
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Theme: Smart Education</span>
            <span>•</span>
            <span>Organization: Egreen Quanta</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Statevector Rigor: Verified
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
