import React, { useState } from "react";
import { Lock, Send, Search, Zap, Cpu, Sparkles } from "lucide-react";
import { BB84Lab } from "./BB84Lab";
import { TeleportationLab } from "./TeleportationLab";
import { GroverLab } from "./GroverLab";
import { BellLab } from "./BellLab";
import { NISQLab } from "./NISQLab";

interface LabsOverviewProps {
  initialLab?: "bb84" | "teleportation" | "grover" | "bell" | "nisq";
}

export const LabsOverview: React.FC<LabsOverviewProps> = ({ initialLab = "bell" }) => {
  const [activeLab, setActiveLab] = useState<"bb84" | "teleportation" | "grover" | "bell" | "nisq">(initialLab);

  const labItems = [
    {
      id: "bell",
      name: "Bell State & CHSH",
      category: "Entanglement",
      desc: "EPR pairs and violation of local realism (|S| = 2.83 > 2.0)",
      icon: Zap,
      color: "text-purple-700",
      bg: "bg-purple-100 border-purple-200",
    },
    {
      id: "grover",
      name: "Grover's Search",
      category: "Algorithms",
      desc: "2-Qubit database search with amplitude amplification",
      icon: Search,
      color: "text-indigo-700",
      bg: "bg-indigo-100 border-indigo-200",
    },
    {
      id: "teleportation",
      name: "Quantum Teleportation",
      category: "Protocols",
      desc: "3-Qubit state reconstruction with No-Cloning compliance",
      icon: Send,
      color: "text-blue-700",
      bg: "bg-blue-100 border-blue-200",
    },
    {
      id: "bb84",
      name: "BB84 Cryptography",
      category: "Security",
      desc: "Quantum Key Distribution with Eve eavesdropping detection",
      icon: Lock,
      color: "text-emerald-700",
      bg: "bg-emerald-100 border-emerald-200",
    },
    {
      id: "nisq",
      name: "NISQ Benchmarks",
      category: "Hardware",
      desc: "Depolarizing noise modeling and fidelity degradation",
      icon: Cpu,
      color: "text-amber-700",
      bg: "bg-amber-100 border-amber-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Lab Switcher Horizontal Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {labItems.map((lab) => {
          const Icon = lab.icon;
          const isActive = activeLab === lab.id;

          return (
            <button
              key={lab.id}
              onClick={() => setActiveLab(lab.id as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? "bg-purple-50/80 border-purple-500 shadow-md scale-[1.02]"
                  : "bg-white/95 border-slate-200 hover:border-purple-200 shadow-xs"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`p-1.5 rounded-lg border ${lab.bg} ${lab.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                  {lab.category}
                </span>
              </div>
              <h3 className={`font-bold text-xs sm:text-sm truncate ${isActive ? "text-purple-950 font-bold" : "text-slate-800"}`}>
                {lab.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {lab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Lab Component Container */}
      <div className="transition-all">
        {activeLab === "bell" && <BellLab />}
        {activeLab === "grover" && <GroverLab />}
        {activeLab === "teleportation" && <TeleportationLab />}
        {activeLab === "bb84" && <BB84Lab />}
        {activeLab === "nisq" && <NISQLab />}
      </div>
    </div>
  );
};

export default LabsOverview;
