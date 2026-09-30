/**
 * Quantaneer Client-side Quantum Mathematical Engine
 * Provides instant zero-latency (<5ms) statevector simulation,
 * complex arithmetic, Kronecker tensor products, unitary transformations,
 * Bloch coordinates calculation, measurement sampling, and OpenQASM export.
 */

export interface Complex {
  r: number; // Real
  i: number; // Imaginary
}

export function complex(r: number, i: number = 0): Complex {
  return { r, i };
}

export function cAdd(a: Complex, b: Complex): Complex {
  return { r: a.r + b.r, i: a.i + b.i };
}

export function cSub(a: Complex, b: Complex): Complex {
  return { r: a.r - b.r, i: a.i - b.i };
}

export function cMul(a: Complex, b: Complex): Complex {
  return {
    r: a.r * b.r - a.i * b.i,
    i: a.r * b.i + a.i * b.r,
  };
}

export function cAbs(a: Complex): number {
  return Math.sqrt(a.r * a.r + a.i * a.i);
}

export function cAbsSq(a: Complex): number {
  return a.r * a.r + a.i * a.i;
}

export function cConj(a: Complex): Complex {
  return { r: a.r, i: -a.i };
}

export function cPhase(a: Complex): number {
  return Math.atan2(a.i, a.r);
}

// 2x2 Unitary Gate Matrices
const INV_SQRT2 = 1.0 / Math.SQRT2;

export const H_MAT: Complex[][] = [
  [complex(INV_SQRT2, 0), complex(INV_SQRT2, 0)],
  [complex(INV_SQRT2, 0), complex(-INV_SQRT2, 0)],
];

export const X_MAT: Complex[][] = [
  [complex(0, 0), complex(1, 0)],
  [complex(1, 0), complex(0, 0)],
];

export const Y_MAT: Complex[][] = [
  [complex(0, 0), complex(0, -1)],
  [complex(0, 1), complex(0, 0)],
];

export const Z_MAT: Complex[][] = [
  [complex(1, 0), complex(0, 0)],
  [complex(0, 0), complex(-1, 0)],
];

export const S_MAT: Complex[][] = [
  [complex(1, 0), complex(0, 0)],
  [complex(0, 0), complex(0, 1)],
];

export const T_MAT: Complex[][] = [
  [complex(1, 0), complex(0, 0)],
  [complex(0, 0), complex(INV_SQRT2, INV_SQRT2)],
];

export const I_MAT: Complex[][] = [
  [complex(1, 0), complex(0, 0)],
  [complex(0, 0), complex(1, 0)],
];

export interface Gate {
  type: "H" | "X" | "Y" | "Z" | "S" | "T" | "CNOT" | "CZ" | "SWAP" | "M";
  target: number;
  control?: number | null;
}

export interface StateAmplitude {
  index: number;
  basis: string;
  real: number;
  imag: number;
  magnitude: number;
  probability: number;
  phase: number;
  phaseDegrees: number;
}

export interface BlochCoordinate {
  qubit: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  theta: number;
  phi: number;
  thetaDegrees: number;
  phiDegrees: number;
  purity: number;
  isPure: boolean;
}

export interface MeasurementHistogram {
  state: string;
  count: number;
  frequency: number;
  theoreticalProb: number;
}

export interface SimulationResult {
  success: boolean;
  numQubits: number;
  gateCount: number;
  statevector: StateAmplitude[];
  blochSpheres: BlochCoordinate[];
  measurements: {
    shots: number;
    counts: Record<string, number>;
    histogram: MeasurementHistogram[];
  };
  openqasm: string;
  error?: string;
}

/**
 * Pure client-side statevector simulator
 */
export class ClientQuantumSimulator {
  numQubits: number;
  dim: number;
  state: Complex[];

  constructor(numQubits: number = 2) {
    this.numQubits = Math.max(1, Math.min(4, numQubits));
    this.dim = 1 << this.numQubits;
    this.state = new Array(this.dim).fill(null).map(() => complex(0, 0));
    this.reset();
  }

  reset() {
    for (let i = 0; i < this.dim; i++) {
      this.state[i] = complex(0, 0);
    }
    this.state[0] = complex(1, 0); // |00...0>
  }

  applySingleGate(gateType: "H" | "X" | "Y" | "Z" | "S" | "T", target: number) {
    let u: Complex[][];
    switch (gateType) {
      case "H": u = H_MAT; break;
      case "X": u = X_MAT; break;
      case "Y": u = Y_MAT; break;
      case "Z": u = Z_MAT; break;
      case "S": u = S_MAT; break;
      case "T": u = T_MAT; break;
    }

    const bit = this.numQubits - 1 - target;
    const bitMask = 1 << bit;
    const newState = [...this.state];

    for (let i = 0; i < this.dim; i++) {
      if ((i & bitMask) === 0) {
        const i0 = i;
        const i1 = i | bitMask;
        const a0 = this.state[i0];
        const a1 = this.state[i1];

        // u[0][0]*a0 + u[0][1]*a1
        newState[i0] = cAdd(cMul(u[0][0], a0), cMul(u[0][1], a1));
        // u[1][0]*a0 + u[1][1]*a1
        newState[i1] = cAdd(cMul(u[1][0], a0), cMul(u[1][1], a1));
      }
    }
    this.state = newState;
    this.renormalize();
  }

  applyCNOT(control: number, target: number) {
    if (control === target) return;
    const ctrlBit = this.numQubits - 1 - control;
    const tgtBit = this.numQubits - 1 - target;
    const ctrlMask = 1 << ctrlBit;
    const tgtMask = 1 << tgtBit;

    const newState = [...this.state];
    for (let i = 0; i < this.dim; i++) {
      // If control bit is 1, and target bit is 0, swap amplitude with target bit = 1
      if ((i & ctrlMask) !== 0 && (i & tgtMask) === 0) {
        const i0 = i;
        const i1 = i | tgtMask;
        const temp = this.state[i0];
        newState[i0] = this.state[i1];
        newState[i1] = temp;
      }
    }
    this.state = newState;
    this.renormalize();
  }

  applyCZ(control: number, target: number) {
    if (control === target) return;
    const ctrlBit = this.numQubits - 1 - control;
    const tgtBit = this.numQubits - 1 - target;
    const mask = (1 << ctrlBit) | (1 << tgtBit);

    for (let i = 0; i < this.dim; i++) {
      if ((i & mask) === mask) {
        // Both control and target are 1 -> flip sign
        this.state[i] = complex(-this.state[i].r, -this.state[i].i);
      }
    }
    this.renormalize();
  }

  applySWAP(q1: number, q2: number) {
    if (q1 === q2) return;
    this.applyCNOT(q1, q2);
    this.applyCNOT(q2, q1);
    this.applyCNOT(q1, q2);
  }

  renormalize() {
    let normSq = 0;
    for (let i = 0; i < this.dim; i++) {
      normSq += cAbsSq(this.state[i]);
    }
    if (normSq > 1e-12) {
      const norm = Math.sqrt(normSq);
      for (let i = 0; i < this.dim; i++) {
        this.state[i] = complex(this.state[i].r / norm, this.state[i].i / norm);
      }
    }
  }

  getStateAmplitudes(): StateAmplitude[] {
    const list: StateAmplitude[] = [];
    for (let i = 0; i < this.dim; i++) {
      const amp = this.state[i];
      const mag = cAbs(amp);
      const prob = cAbsSq(amp);
      const phase = cPhase(amp);
      const bitstring = i.toString(2).padStart(this.numQubits, "0");

      list.push({
        index: i,
        basis: `|${bitstring}⟩`,
        real: Math.round(amp.r * 10000) / 10000,
        imag: Math.round(amp.i * 10000) / 10000,
        magnitude: Math.round(mag * 10000) / 10000,
        probability: Math.round(prob * 10000) / 10000,
        phase: Math.round(phase * 1000) / 1000,
        phaseDegrees: Math.round((phase * 180) / Math.PI),
      });
    }
    return list;
  }

  getBlochCoordinate(targetQubit: number): BlochCoordinate {
    const qBit = this.numQubits - 1 - targetQubit;
    const mask = 1 << qBit;

    // Compute reduced density matrix for single qubit
    let r00 = 0;
    let r11 = 0;
    let r01 = complex(0, 0);

    for (let i = 0; i < this.dim; i++) {
      if ((i & mask) === 0) {
        const i0 = i;
        const i1 = i | mask;
        const a0 = this.state[i0];
        const a1 = this.state[i1];

        r00 += cAbsSq(a0);
        r11 += cAbsSq(a1);
        r01 = cAdd(r01, cMul(a0, cConj(a1)));
      }
    }

    const x = 2 * r01.r;
    const y = -2 * r01.i;
    const z = r00 - r11;
    let r = Math.sqrt(x * x + y * y + z * z);
    r = Math.min(1.0, r);

    const theta = Math.acos(Math.max(-1, Math.min(1, z / (r > 1e-8 ? r : 1))));
    const phi = Math.atan2(y, x);
    const purity = r00 * r00 + r11 * r11 + 2 * cAbsSq(r01);

    return {
      qubit: targetQubit,
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      z: Math.round(z * 1000) / 1000,
      radius: Math.round(r * 1000) / 1000,
      theta: Math.round(theta * 1000) / 1000,
      phi: Math.round(phi * 1000) / 1000,
      thetaDegrees: Math.round((theta * 180) / Math.PI),
      phiDegrees: Math.round((phi * 180) / Math.PI),
      purity: Math.round(purity * 1000) / 1000,
      isPure: purity > 0.99,
    };
  }

  sampleMeasurements(shots: number = 1024) {
    const probs = this.state.map((amp) => cAbsSq(amp));
    const counts: Record<string, number> = {};
    for (let i = 0; i < this.dim; i++) {
      const bitstring = i.toString(2).padStart(this.numQubits, "0");
      counts[`|${bitstring}⟩`] = 0;
    }

    for (let s = 0; s < shots; s++) {
      const rand = Math.random();
      let cumulative = 0;
      for (let i = 0; i < this.dim; i++) {
        cumulative += probs[i];
        if (rand <= cumulative || i === this.dim - 1) {
          const bitstring = i.toString(2).padStart(this.numQubits, "0");
          counts[`|${bitstring}⟩`]++;
          break;
        }
      }
    }

    const histogram: MeasurementHistogram[] = [];
    for (let i = 0; i < this.dim; i++) {
      const bitstring = i.toString(2).padStart(this.numQubits, "0");
      const key = `|${bitstring}⟩`;
      histogram.push({
        state: key,
        count: counts[key],
        frequency: Math.round((counts[key] / shots) * 10000) / 10000,
        theoreticalProb: Math.round(probs[i] * 10000) / 10000,
      });
    }

    return { shots, counts, histogram };
  }
}

export function runClientSimulation(
  numQubits: number,
  gates: Gate[],
  shots: number = 1024
): SimulationResult {
  const sim = new ClientQuantumSimulator(numQubits);

  for (const gate of gates) {
    if (["H", "X", "Y", "Z", "S", "T"].includes(gate.type)) {
      sim.applySingleGate(gate.type as any, gate.target);
    } else if (gate.type === "CNOT" && gate.control !== undefined && gate.control !== null) {
      sim.applyCNOT(gate.control, gate.target);
    } else if (gate.type === "CZ" && gate.control !== undefined && gate.control !== null) {
      sim.applyCZ(gate.control, gate.target);
    } else if (gate.type === "SWAP" && gate.control !== undefined && gate.control !== null) {
      sim.applySWAP(gate.control, gate.target);
    }
  }

  const statevector = sim.getStateAmplitudes();
  const blochSpheres: BlochCoordinate[] = [];
  for (let q = 0; q < numQubits; q++) {
    blochSpheres.push(sim.getBlochCoordinate(q));
  }
  const measurements = sim.sampleMeasurements(shots);
  const openqasm = generateOpenQASM(numQubits, gates);

  return {
    success: true,
    numQubits,
    gateCount: gates.length,
    statevector,
    blochSpheres,
    measurements,
    openqasm,
  };
}

export function generateOpenQASM(numQubits: number, gates: Gate[]): string {
  const lines = [
    "OPENQASM 2.0;",
    'include "qelib1.inc";',
    "",
    `qreg q[${numQubits}];`,
    `creg c[${numQubits}];`,
    "",
  ];

  for (const g of gates) {
    if (g.type === "H") lines.push(`h q[${g.target}];`);
    else if (g.type === "X") lines.push(`x q[${g.target}];`);
    else if (g.type === "Y") lines.push(`y q[${g.target}];`);
    else if (g.type === "Z") lines.push(`z q[${g.target}];`);
    else if (g.type === "S") lines.push(`s q[${g.target}];`);
    else if (g.type === "T") lines.push(`t q[${g.target}];`);
    else if (g.type === "CNOT") lines.push(`cx q[${g.control}],q[${g.target}];`);
    else if (g.type === "CZ") lines.push(`cz q[${g.control}],q[${g.target}];`);
    else if (g.type === "SWAP") lines.push(`swap q[${g.control}],q[${g.target}];`);
    else if (g.type === "M") lines.push(`measure q[${g.target}] -> c[${g.target}];`);
  }

  return lines.join("\n");
}
