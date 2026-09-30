import React, { useRef, useEffect, useState } from "react";
import { BlochCoordinate } from "../quantum/engine";
import { Info, RotateCcw, Compass } from "lucide-react";

interface BlochSphereProps {
  coordinates: BlochCoordinate[];
  activeQubit: number;
  onSelectQubit: (qubit: number) => void;
}

export const BlochSphere: React.FC<BlochSphereProps> = ({
  coordinates,
  activeQubit,
  onSelectQubit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotX, setRotX] = useState<number>(0.35); // Initial pitch
  const [rotY, setRotY] = useState<number>(0.65); // Initial yaw
  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const coord = coordinates[activeQubit] || {
    qubit: 0,
    x: 0,
    y: 0,
    z: 1,
    radius: 1,
    theta: 0,
    phi: 0,
    thetaDegrees: 0,
    phiDegrees: 0,
    purity: 1,
    isPure: true,
  };

  // Mouse drag handling for 3D rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setRotY((prev) => prev + dx * 0.012);
    setRotX((prev) => Math.max(-1.5, Math.min(1.5, prev + dy * 0.012)));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const resetView = () => {
    setRotX(0.35);
    setRotY(0.65);
  };

  // 3D Rendering on HTML5 Canvas - Luxurious Light Mode
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(width, height) * 0.38;

    ctx.clearRect(0, 0, width, height);

    // 3D projection matrix: rotate around X then around Y
    const project = (x3: number, y3: number, z3: number) => {
      // Map: X_3d = x3, Y_3d = z3 (Z is up in Bloch convention), Z_3d = -y3
      const x_mapped = x3;
      const y_mapped = z3;
      const z_mapped = -y3;

      // Rotate around Y-axis (rotY)
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x_mapped * cosY + z_mapped * sinY;
      const z1 = -x_mapped * sinY + z_mapped * cosY;

      // Rotate around X-axis (rotX)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y_mapped * cosX - z1 * sinX;
      const z2 = y_mapped * sinX + z1 * cosX;

      return {
        px: cx + x1 * R,
        py: cy - y2 * R,
        depth: z2,
      };
    };

    // Draw background sphere pearl shimmer
    const grad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.05);
    grad.addColorStop(0, "rgba(245, 243, 255, 0.9)");
    grad.addColorStop(0.7, "rgba(238, 242, 255, 0.6)");
    grad.addColorStop(1, "rgba(224, 231, 255, 0.3)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Draw Sphere Outer Ring
    ctx.strokeStyle = "rgba(124, 58, 237, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Equator & Latitudes (dashed)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
    ctx.setLineDash([3, 4]);

    // Equator (z=0)
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
      const p = project(Math.cos(a), Math.sin(a), 0);
      if (a === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();

    // Meridian (x=0)
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
      const p = project(0, Math.sin(a), Math.cos(a));
      if (a === 0) ctx.moveTo(p.px, p.py);
      else ctx.lineTo(p.px, p.py);
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw Axes (X=Orange/Red, Y=Neon Purple, Z=Emerald Green)
    const drawAxis = (x: number, y: number, z: number, color: string, label: string, negLabel: string) => {
      const pPos = project(x * 1.25, y * 1.25, z * 1.25);
      const pNeg = project(-x * 1.15, -y * 1.15, -z * 1.15);
      const center = project(0, 0, 0);

      // Negative axis
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(center.px, center.py);
      ctx.lineTo(pNeg.px, pNeg.py);
      ctx.stroke();

      // Positive axis
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(center.px, center.py);
      ctx.lineTo(pPos.px, pPos.py);
      ctx.stroke();

      // Positive Axis label
      ctx.fillStyle = color;
      ctx.font = "bold 11px system-ui";
      ctx.fillText(label, pPos.px + 4, pPos.py - 4);

      // Negative Axis label
      ctx.fillStyle = "rgba(100, 116, 139, 0.85)";
      ctx.font = "10px system-ui";
      ctx.fillText(negLabel, pNeg.px + 3, pNeg.py + 10);
    };

    drawAxis(1, 0, 0, "#ea580c", "+X |+⟩", "-X |-⟩");
    drawAxis(0, 1, 0, "#7c3aed", "+Y |+i⟩", "-Y |-i⟩");
    drawAxis(0, 0, 1, "#059669", "+Z |0⟩", "-Z |1⟩");

    // Center Origin dot
    const center = project(0, 0, 0);
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.arc(center.px, center.py, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw State Vector Arrow
    const tip = project(coord.x, coord.y, coord.z);

    // Vector line shadow for 3D depth
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(center.px, center.py + 2);
    ctx.lineTo(tip.px, tip.py + 2);
    ctx.stroke();

    // Main glowing statevector line: Purple if pure, Luxury Gold if mixed (entangled)
    const vecColor = coord.isPure ? "#7c3aed" : "#d97706";
    ctx.strokeStyle = vecColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(center.px, center.py);
    ctx.lineTo(tip.px, tip.py);
    ctx.stroke();

    // Tip point glow
    ctx.fillStyle = vecColor;
    ctx.shadowColor = vecColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(tip.px, tip.py, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Tip label with |ψ⟩
    ctx.fillStyle = "#1e1b4b";
    ctx.font = "bold 13px system-ui";
    ctx.fillText("|ψ⟩", tip.px + 8, tip.py - 6);
  }, [rotX, rotY, coord]);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-purple-100 flex flex-col justify-between h-full bg-white/95 shadow-sm">
      {/* Header & Qubit Selector */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
              Bloch Sphere 3D Orbit
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Single-qubit quantum state vector on the unit sphere
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Multi-qubit tabs */}
          {coordinates.length > 1 && (
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {coordinates.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectQubit(idx)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all ${
                    activeQubit === idx
                      ? "bg-purple-600 text-white font-bold shadow-sm shadow-purple-500/25"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  q[{idx}]
                </button>
              ))}
            </div>
          )}

          <button
            onClick={resetView}
            title="Reset 3D camera angle"
            className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div
        className="relative my-3 flex items-center justify-center cursor-grab active:cursor-grabbing bg-slate-50/70 rounded-xl overflow-hidden border border-slate-200/80 shadow-inner"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={320}
          height={260}
          className="max-w-full block"
        />

        <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono select-none flex items-center gap-1">
          <Compass className="w-3 h-3 text-purple-500" />
          Drag to rotate in 3D space
        </div>

        <div className="absolute top-2 right-3 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/90 shadow-sm border border-slate-200">
          <span className={coord.isPure ? "text-purple-700 font-semibold" : "text-amber-600 font-semibold"}>
            {coord.isPure ? "● Pure State (|r| = 1)" : "▲ Mixed State (Entangled, |r| < 1)"}
          </span>
        </div>
      </div>

      {/* Numerical Coordinate Readouts */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-mono font-medium">X (|+⟩ / |-⟩)</span>
          <span className="font-mono font-semibold text-orange-600">{coord.x.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-mono font-medium">Y (|+i⟩ / |-i⟩)</span>
          <span className="font-mono font-semibold text-purple-600">{coord.y.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-mono font-medium">Z (|0⟩ / |1⟩)</span>
          <span className="font-mono font-semibold text-emerald-600">{coord.z.toFixed(3)}</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-mono font-medium">Polar θ</span>
          <span className="font-mono font-medium text-slate-800">{coord.thetaDegrees}°</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-mono font-medium">Azimuth φ</span>
          <span className="font-mono font-medium text-slate-800">{coord.phiDegrees}°</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-mono font-medium">Radius |r|</span>
          <span className="font-mono font-medium text-slate-800">{coord.radius.toFixed(3)}</span>
        </div>
      </div>

      {/* Reduced Density Matrix Notice */}
      {coordinates.length > 1 && (
        <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-600 bg-purple-50/70 p-2.5 rounded-lg border border-purple-100">
          <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <span>
            <strong className="text-purple-900">Multi-Qubit Subsystem:</strong> Shows partial trace reduced density matrix ρ<sub>{activeQubit}</sub> = Tr<sub>\{activeQubit}</sub>(|ψ⟩⟨ψ|). If entangled with other qubits, radius |r| &lt; 1 inside the sphere.
          </span>
        </div>
      )}
    </div>
  );
};
export default BlochSphere;
