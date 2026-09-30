"""
Quantaneer Quantum Engine
Mathematically rigorous statevector simulator for n qubits (1 to 4+ qubits).
Computes exact complex amplitudes, probability distributions, Bloch coordinates,
reduced single-qubit density matrices, step-by-step state tracking, and OpenQASM export.
"""

import numpy as np
import cmath
import math
from typing import List, Dict, Any, Optional, Tuple

# Fundamental single-qubit unitary matrices
H_GATE = (1.0 / np.sqrt(2.0)) * np.array([[1.0, 1.0], [1.0, -1.0]], dtype=complex)
X_GATE = np.array([[0.0, 1.0], [1.0, 0.0]], dtype=complex)
Y_GATE = np.array([[0.0, -1.0j], [1.0j, 0.0]], dtype=complex)
Z_GATE = np.array([[1.0, 0.0], [0.0, -1.0]], dtype=complex)
S_GATE = np.array([[1.0, 0.0], [0.0, 1.0j]], dtype=complex)
T_GATE = np.array([[1.0, 0.0], [0.0, cmath.exp(1.0j * np.pi / 4.0)]], dtype=complex)
I_GATE = np.eye(2, dtype=complex)

GATE_METADATA = {
    "H": {
        "name": "Hadamard",
        "symbol": "H",
        "qubits": 1,
        "description": "Creates an equal superposition state: H|0> = (|0> + |1>)/√2, H|1> = (|0> - |1>)/√2.",
        "matrix": [[{"r": 0.7071, "i": 0}, {"r": 0.7071, "i": 0}], [{"r": 0.7071, "i": 0}, {"r": -0.7071, "i": 0}]]
    },
    "X": {
        "name": "Pauli-X (NOT)",
        "symbol": "X",
        "qubits": 1,
        "description": "Bit-flip gate: maps |0> to |1> and |1> to |0> (quantum NOT).",
        "matrix": [[{"r": 0, "i": 0}, {"r": 1, "i": 0}], [{"r": 1, "i": 0}, {"r": 0, "i": 0}]]
    },
    "Y": {
        "name": "Pauli-Y",
        "symbol": "Y",
        "qubits": 1,
        "description": "Bit and phase flip gate: maps |0> to i|1> and |1> to -i|0>.",
        "matrix": [[{"r": 0, "i": 0}, {"r": 0, "i": -1}], [{"r": 0, "i": 1}, {"r": 0, "i": 0}]]
    },
    "Z": {
        "name": "Pauli-Z",
        "symbol": "Z",
        "qubits": 1,
        "description": "Phase-flip gate: leaves |0> unchanged, shifts phase of |1> by π (|1> -> -|1>).",
        "matrix": [[{"r": 1, "i": 0}, {"r": 0, "i": 0}], [{"r": 0, "i": 0}, {"r": -1, "i": 0}]]
    },
    "S": {
        "name": "Phase Gate (S)",
        "symbol": "S",
        "qubits": 1,
        "description": "Applies a π/2 phase shift to |1> (|1> -> i|1>). Note S = √Z.",
        "matrix": [[{"r": 1, "i": 0}, {"r": 0, "i": 0}], [{"r": 0, "i": 0}, {"r": 0, "i": 1}]]
    },
    "T": {
        "name": "π/8 Gate (T)",
        "symbol": "T",
        "qubits": 1,
        "description": "Applies a π/4 phase shift to |1> (|1> -> e^(iπ/4)|1>). Note T = √S.",
        "matrix": [[{"r": 1, "i": 0}, {"r": 0, "i": 0}], [{"r": 0, "i": 0}, {"r": 0.7071, "i": 0.7071}]]
    },
    "CNOT": {
        "name": "Controlled-NOT (CX)",
        "symbol": "CX",
        "qubits": 2,
        "description": "Flips the target qubit if and only if the control qubit is in state |1>.",
        "matrix": "4x4 Controlled Matrix"
    },
    "CZ": {
        "name": "Controlled-Z",
        "symbol": "CZ",
        "qubits": 2,
        "description": "Applies a Z gate (phase flip) to the target qubit if the control qubit is |1>.",
        "matrix": "4x4 Controlled Matrix"
    },
    "SWAP": {
        "name": "SWAP",
        "symbol": "SWAP",
        "qubits": 2,
        "description": "Exchanges quantum states between two qubits.",
        "matrix": "4x4 SWAP Matrix"
    },
    "M": {
        "name": "Measurement",
        "symbol": "M",
        "qubits": 1,
        "description": "Measures qubit in the standard computational basis (|0>, |1>).",
        "matrix": "Projection Operator"
    }
}

class QuantumCircuitSimulator:
    def __init__(self, num_qubits: int = 2):
        if num_qubits < 1 or num_qubits > 6:
            raise ValueError("Supported qubit range: 1 to 6.")
        self.num_qubits = num_qubits
        self.dim = 2 ** num_qubits
        self.reset()

    def reset(self):
        """Reset statevector to |00...0>."""
        self.state = np.zeros(self.dim, dtype=complex)
        self.state[0] = 1.0 + 0.0j

    def set_state(self, new_state: np.ndarray):
        """Set statevector explicitly, normalized."""
        norm = np.linalg.norm(new_state)
        if norm < 1e-12:
            raise ValueError("Cannot set state with zero norm.")
        self.state = (new_state / norm).astype(complex)

    def _get_single_qubit_full_matrix(self, gate_matrix: np.ndarray, target: int) -> np.ndarray:
        """
        Builds 2^n x 2^n operator for a single qubit gate on target.
        Convention: qubit 0 is most significant or least significant?
        Standard standard: q0 is MSB or LSB. Let's use standard binary order:
        Basis index: b = sum(q_k * 2^(n-1-k)) for k from 0 to n-1.
        So q0 is MSB, q_{n-1} is LSB.
        Tensor product: I ⊗ ... ⊗ Gate ⊗ ... ⊗ I
        """
        op = 1.0
        for i in range(self.num_qubits):
            if i == target:
                op = np.kron(op, gate_matrix)
            else:
                op = np.kron(op, I_GATE)
        return op

    def apply_single_gate(self, gate_type: str, target: int):
        if target < 0 or target >= self.num_qubits:
            raise ValueError(f"Target qubit {target} out of range [0, {self.num_qubits - 1}]")
        
        gate_map = {
            "H": H_GATE,
            "X": X_GATE,
            "Y": Y_GATE,
            "Z": Z_GATE,
            "S": S_GATE,
            "T": T_GATE
        }
        if gate_type not in gate_map:
            raise ValueError(f"Unknown single-qubit gate '{gate_type}'")
        
        u = gate_map[gate_type]
        op = self._get_single_qubit_full_matrix(u, target)
        self.state = np.dot(op, self.state)
        self._renormalize()

    def apply_cnot(self, control: int, target: int):
        if control == target:
            raise ValueError("Control and target qubits cannot be the same.")
        if control < 0 or control >= self.num_qubits or target < 0 or target >= self.num_qubits:
            raise ValueError(f"Qubit index out of range [0, {self.num_qubits - 1}]")

        # |0><0|_ctrl ⊗ I_rest + |1><1|_ctrl ⊗ X_target
        p0 = np.array([[1.0, 0.0], [0.0, 0.0]], dtype=complex)
        p1 = np.array([[0.0, 0.0], [0.0, 1.0]], dtype=complex)

        term0 = 1.0
        term1 = 1.0
        for i in range(self.num_qubits):
            if i == control:
                term0 = np.kron(term0, p0)
                term1 = np.kron(term1, p1)
            elif i == target:
                term0 = np.kron(term0, I_GATE)
                term1 = np.kron(term1, X_GATE)
            else:
                term0 = np.kron(term0, I_GATE)
                term1 = np.kron(term1, I_GATE)

        cnot_op = term0 + term1
        self.state = np.dot(cnot_op, self.state)
        self._renormalize()

    def apply_cz(self, control: int, target: int):
        if control == target:
            raise ValueError("Control and target qubits cannot be the same.")
        if control < 0 or control >= self.num_qubits or target < 0 or target >= self.num_qubits:
            raise ValueError(f"Qubit index out of range [0, {self.num_qubits - 1}]")

        p0 = np.array([[1.0, 0.0], [0.0, 0.0]], dtype=complex)
        p1 = np.array([[0.0, 0.0], [0.0, 1.0]], dtype=complex)

        term0 = 1.0
        term1 = 1.0
        for i in range(self.num_qubits):
            if i == control:
                term0 = np.kron(term0, p0)
                term1 = np.kron(term1, p1)
            elif i == target:
                term0 = np.kron(term0, I_GATE)
                term1 = np.kron(term1, Z_GATE)
            else:
                term0 = np.kron(term0, I_GATE)
                term1 = np.kron(term1, I_GATE)

        cz_op = term0 + term1
        self.state = np.dot(cz_op, self.state)
        self._renormalize()

    def apply_swap(self, q1: int, q2: int):
        if q1 == q2:
            return  # No-op
        # SWAP is composed of 3 CNOTs: CNOT(q1, q2), CNOT(q2, q1), CNOT(q1, q2)
        self.apply_cnot(q1, q2)
        self.apply_cnot(q2, q1)
        self.apply_cnot(q1, q2)

    def _renormalize(self):
        norm = np.linalg.norm(self.state)
        if norm > 1e-12:
            self.state = self.state / norm

    def get_probabilities(self) -> List[float]:
        return [float(abs(amp) ** 2) for amp in self.state]

    def get_statevector_info(self) -> List[Dict[str, Any]]:
        probs = self.get_probabilities()
        results = []
        for idx in range(self.dim):
            amp = self.state[idx]
            mag = float(abs(amp))
            phase = float(cmath.phase(amp))
            # Format bitstring
            bitstring = format(idx, f"0{self.num_qubits}b")
            results.append({
                "index": idx,
                "basis": f"|{bitstring}>",
                "real": float(amp.real),
                "imag": float(amp.imag),
                "magnitude": round(mag, 6),
                "probability": round(probs[idx], 6),
                "phase": round(phase, 4),
                "phase_degrees": round(math.degrees(phase), 2)
            })
        return results

    def get_bloch_coordinates(self, target_qubit: int = 0) -> Dict[str, Any]:
        """
        Calculates Bloch sphere coordinates (x, y, z, theta, phi)
        for any qubit via partial trace of the density matrix rho.
        """
        if target_qubit < 0 or target_qubit >= self.num_qubits:
            target_qubit = 0

        # Construct full density matrix rho = |psi><psi|
        rho = np.outer(self.state, np.conj(self.state))

        # Partial trace over all other qubits
        # Reshape to (2, 2, ..., 2) for bra and ket
        shape = [2] * (2 * self.num_qubits)
        rho_tensor = rho.reshape(shape)

        # We want to trace over all axes except target_qubit and target_qubit + num_qubits
        axes_to_trace = []
        for q in range(self.num_qubits):
            if q != target_qubit:
                axes_to_trace.append(q)

        # For partial trace, trace indices iteratively
        reduced_rho = rho_tensor
        offset = 0
        for q in sorted(axes_to_trace, reverse=True):
            reduced_rho = np.trace(reduced_rho, axis1=q, axis2=q + self.num_qubits - offset)
            offset += 1

        # reduced_rho is now a 2x2 matrix
        r00 = complex(reduced_rho[0, 0])
        r01 = complex(reduced_rho[0, 1])
        r10 = complex(reduced_rho[1, 0])
        r11 = complex(reduced_rho[1, 1])

        # Pauli expectation values
        x = float(2.0 * r01.real)
        y = float(-2.0 * r01.imag)
        z = float((r00 - r11).real)

        # Spherical coordinates
        r = math.sqrt(x*x + y*y + z*z)
        if r > 1.0:
            # Numerical precision clamp
            scale = 1.0 / r
            x *= scale
            y *= scale
            z *= scale
            r = 1.0

        theta = math.acos(max(-1.0, min(1.0, z / (r if r > 1e-9 else 1.0))))
        phi = math.atan2(y, x)

        purity = float((r00*r00 + r11*r11 + 2*(abs(r01)**2)).real)

        return {
            "qubit": target_qubit,
            "x": round(x, 4),
            "y": round(y, 4),
            "z": round(z, 4),
            "radius": round(r, 4),
            "theta": round(theta, 4),
            "phi": round(phi, 4),
            "theta_degrees": round(math.degrees(theta), 2),
            "phi_degrees": round(math.degrees(phi), 2),
            "purity": round(purity, 4),
            "is_pure": purity > 0.999
        }

    def sample_measurements(self, shots: int = 1024) -> Dict[str, Any]:
        """
        Samples real measurements from the probability distribution.
        """
        if shots < 1:
            shots = 1024
        shots = min(shots, 50000)

        probs = np.array(self.get_probabilities(), dtype=float)
        # Normalize in case of tiny floating precision drift
        probs /= probs.sum()

        indices = np.random.choice(self.dim, size=shots, p=probs)
        counts = {}
        for idx in range(self.dim):
            bitstr = format(idx, f"0{self.num_qubits}b")
            counts[f"|{bitstr}>"] = 0

        for idx in indices:
            bitstr = format(idx, f"0{self.num_qubits}b")
            counts[f"|{bitstr}>"] += 1

        histogram = []
        for basis, count in counts.items():
            freq = count / shots
            histogram.append({
                "state": basis,
                "count": count,
                "frequency": round(freq, 4),
                "theoretical_prob": round(float(probs[int(basis[1:-1], 2)]), 4)
            })

        return {
            "shots": shots,
            "counts": counts,
            "histogram": histogram
        }

def validate_circuit(num_qubits: int, gates: List[Dict[str, Any]]) -> Tuple[bool, Optional[str]]:
    """
    Validates circuit before simulation.
    Checks target, control, bounds, control==target.
    """
    if num_qubits < 1 or num_qubits > 6:
        return False, f"Number of qubits ({num_qubits}) must be between 1 and 6."

    for idx, gate in enumerate(gates):
        gtype = gate.get("type")
        if not gtype or gtype not in GATE_METADATA:
            return False, f"Step {idx + 1}: Unknown gate type '{gtype}'."

        target = gate.get("target")
        if target is None or target < 0 or target >= num_qubits:
            return False, f"Step {idx + 1}: Invalid target qubit {target} for {num_qubits}-qubit circuit."

        if gtype in ["CNOT", "CZ", "SWAP"]:
            control = gate.get("control")
            if control is None or control < 0 or control >= num_qubits:
                return False, f"Step {idx + 1}: Gate '{gtype}' requires valid control qubit (got {control})."
            if control == target:
                return False, f"Step {idx + 1}: Control and target qubits cannot be identical (q{control})."

    return True, None

def simulate_circuit(num_qubits: int, gates: List[Dict[str, Any]], shots: int = 1024, initial_state: Optional[List[complex]] = None) -> Dict[str, Any]:
    """
    Executes a circuit sequentially from initial |00...0> (or custom state),
    recording step-by-step evolution and returning full quantum state information.
    """
    valid, err = validate_circuit(num_qubits, gates)
    if not valid:
        return {"success": False, "error": err}

    sim = QuantumCircuitSimulator(num_qubits)
    if initial_state and len(initial_state) == 2 ** num_qubits:
        sim.set_state(np.array(initial_state, dtype=complex))

    steps_history = []
    # Record initial step 0
    steps_history.append({
        "step": 0,
        "gate": None,
        "statevector": sim.get_statevector_info(),
        "bloch": [sim.get_bloch_coordinates(q) for q in range(num_qubits)]
    })

    for idx, gate in enumerate(gates):
        gtype = gate["type"]
        target = gate["target"]
        control = gate.get("control")

        if gtype in ["H", "X", "Y", "Z", "S", "T"]:
            sim.apply_single_gate(gtype, target)
        elif gtype == "CNOT":
            sim.apply_cnot(control, target)
        elif gtype == "CZ":
            sim.apply_cz(control, target)
        elif gtype == "SWAP":
            sim.apply_swap(control, target)
        elif gtype == "M":
            # Measurement in circuit marker
            pass

        steps_history.append({
            "step": idx + 1,
            "gate": gate,
            "statevector": sim.get_statevector_info(),
            "bloch": [sim.get_bloch_coordinates(q) for q in range(num_qubits)]
        })

    measurements = sim.sample_measurements(shots)
    openqasm = export_to_openqasm(num_qubits, gates)

    return {
        "success": True,
        "num_qubits": num_qubits,
        "gate_count": len(gates),
        "statevector": sim.get_statevector_info(),
        "bloch_spheres": [sim.get_bloch_coordinates(q) for q in range(num_qubits)],
        "measurements": measurements,
        "steps_history": steps_history,
        "openqasm": openqasm
    }

def export_to_openqasm(num_qubits: int, gates: List[Dict[str, Any]]) -> str:
    """
    Generates genuine OpenQASM 2.0 code corresponding to the actual circuit.
    """
    lines = [
        "OPENQASM 2.0;",
        'include "qelib1.inc";',
        "",
        f"qreg q[{num_qubits}];",
        f"creg c[{num_qubits}];",
        ""
    ]

    for gate in gates:
        gtype = gate["type"]
        t = gate["target"]
        c = gate.get("control")

        if gtype == "H":
            lines.append(f"h q[{t}];")
        elif gtype == "X":
            lines.append(f"x q[{t}];")
        elif gtype == "Y":
            lines.append(f"y q[{t}];")
        elif gtype == "Z":
            lines.append(f"z q[{t}];")
        elif gtype == "S":
            lines.append(f"s q[{t}];")
        elif gtype == "T":
            lines.append(f"t q[{t}];")
        elif gtype == "CNOT":
            lines.append(f"cx q[{c}],q[{t}];")
        elif gtype == "CZ":
            lines.append(f"cz q[{c}],q[{t}];")
        elif gtype == "SWAP":
            lines.append(f"swap q[{c}],q[{t}];")
        elif gtype == "M":
            lines.append(f"measure q[{t}] -> c[{t}];")

    return "\n".join(lines)
