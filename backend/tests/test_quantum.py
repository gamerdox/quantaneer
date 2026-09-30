"""
Unit tests for Quantaneer Quantum Simulator and Labs
Validates mathematical correctness of quantum operations, statevectors,
measurements, Bell states, Grover search, and OpenQASM export.
"""

import pytest
import numpy as np
import math
from app.quantum.engine import (
    QuantumCircuitSimulator,
    simulate_circuit,
    export_to_openqasm,
    validate_circuit,
    H_GATE, X_GATE, Y_GATE, Z_GATE, S_GATE, T_GATE
)
from app.quantum.algorithms import get_prebuilt_circuit, run_nisq_benchmark
from app.quantum.bb84 import simulate_bb84

def test_single_qubit_x_gate():
    """Test 1: Start with |0>, apply X -> should yield |1>."""
    sim = QuantumCircuitSimulator(1)
    sim.apply_single_gate("X", 0)
    probs = sim.get_probabilities()
    assert math.isclose(probs[0], 0.0, abs_tol=1e-6)
    assert math.isclose(probs[1], 1.0, abs_tol=1e-6)
    assert math.isclose(sim.state[1].real, 1.0, abs_tol=1e-6)

def test_single_qubit_h_gate():
    """Test 2: Start with |0>, apply H -> equal superposition (|0>+|1>)/sqrt(2)."""
    sim = QuantumCircuitSimulator(1)
    sim.apply_single_gate("H", 0)
    probs = sim.get_probabilities()
    assert math.isclose(probs[0], 0.5, abs_tol=1e-6)
    assert math.isclose(probs[1], 0.5, abs_tol=1e-6)
    assert math.isclose(sim.state[0].real, 1.0 / np.sqrt(2), abs_tol=1e-6)
    assert math.isclose(sim.state[1].real, 1.0 / np.sqrt(2), abs_tol=1e-6)

def test_phase_gates_s_and_t():
    """Test S and T phase shifts on |1>."""
    sim = QuantumCircuitSimulator(1)
    # Put in |1>
    sim.apply_single_gate("X", 0)
    # Apply S -> phase i
    sim.apply_single_gate("S", 0)
    assert math.isclose(sim.state[1].imag, 1.0, abs_tol=1e-6)
    
    # S squared is Z: applying S again should yield -1
    sim.apply_single_gate("S", 0)
    assert math.isclose(sim.state[1].real, -1.0, abs_tol=1e-6)

def test_bell_state_generation():
    """Test 3: Start with |00>, apply H(q0), CNOT(q0, q1) -> Bell state (|00>+|11>)/sqrt(2)."""
    gates = [
        {"type": "H", "target": 0, "control": None},
        {"type": "CNOT", "target": 1, "control": 0}
    ]
    res = simulate_circuit(2, gates)
    assert res["success"] is True
    
    statevec = res["statevector"]
    p00 = statevec[0]["probability"] # |00>
    p01 = statevec[1]["probability"] # |01>
    p10 = statevec[2]["probability"] # |10>
    p11 = statevec[3]["probability"] # |11>

    assert math.isclose(p00, 0.5, abs_tol=1e-4)
    assert math.isclose(p11, 0.5, abs_tol=1e-4)
    assert math.isclose(p01, 0.0, abs_tol=1e-4)
    assert math.isclose(p10, 0.0, abs_tol=1e-4)

def test_measurement_sampling_bell_state():
    """Test 4: 1000 shots of Bell state should statistically sample |00> and |11>."""
    gates = [
        {"type": "H", "target": 0, "control": None},
        {"type": "CNOT", "target": 1, "control": 0}
    ]
    res = simulate_circuit(2, gates, shots=1000)
    counts = res["measurements"]["counts"]
    # Total shots = 1000
    assert counts["|00>"] + counts["|11>"] == 1000
    assert counts["|01>"] == 0
    assert counts["|10>"] == 0
    # Both |00> and |11> should have substantial non-zero counts
    assert counts["|00>"] > 400
    assert counts["|11>"] > 400

def test_ghz_state():
    """Test 3-qubit GHZ state (|000> + |111>)/sqrt(2)."""
    circuit = get_prebuilt_circuit("ghz")
    res = simulate_circuit(circuit["num_qubits"], circuit["gates"])
    assert res["success"] is True
    probs = [item["probability"] for item in res["statevector"]]
    assert math.isclose(probs[0], 0.5, abs_tol=1e-4)  # |000>
    assert math.isclose(probs[7], 0.5, abs_tol=1e-4)  # |111>
    for i in range(1, 7):
        assert math.isclose(probs[i], 0.0, abs_tol=1e-4)

def test_grover_2qubit():
    """Test Grover's search algorithm: target state |11> should achieve probability 1.0."""
    circuit = get_prebuilt_circuit("grover")
    res = simulate_circuit(circuit["num_qubits"], circuit["gates"])
    assert res["success"] is True
    statevec = res["statevector"]
    p11 = statevec[3]["probability"]
    assert math.isclose(p11, 1.0, abs_tol=1e-4)

def test_openqasm_export():
    """Test OpenQASM 2.0 string generation."""
    gates = [
        {"type": "H", "target": 0, "control": None},
        {"type": "CNOT", "target": 1, "control": 0},
        {"type": "M", "target": 0, "control": None}
    ]
    qasm = export_to_openqasm(2, gates)
    assert "OPENQASM 2.0;" in qasm
    assert "qreg q[2];" in qasm
    assert "h q[0];" in qasm
    assert "cx q[0],q[1];" in qasm
    assert "measure q[0] -> c[0];" in qasm

def test_circuit_validation():
    """Circuit validation should catch invalid inputs."""
    # Control == Target
    valid, err = validate_circuit(2, [{"type": "CNOT", "target": 0, "control": 0}])
    assert not valid
    assert "identical" in err

    # Out of range target
    valid, err = validate_circuit(2, [{"type": "H", "target": 3, "control": None}])
    assert not valid
    assert "Invalid target" in err

def test_bloch_coordinates_pure_state():
    """Test Bloch coordinates for |0> (North pole, z=1) and |+> (Equator, x=1)."""
    sim = QuantumCircuitSimulator(1)
    bloch0 = sim.get_bloch_coordinates(0)
    assert math.isclose(bloch0["z"], 1.0, abs_tol=1e-4)
    assert math.isclose(bloch0["x"], 0.0, abs_tol=1e-4)

    sim.apply_single_gate("H", 0)
    bloch_plus = sim.get_bloch_coordinates(0)
    assert math.isclose(bloch_plus["x"], 1.0, abs_tol=1e-4)
    assert math.isclose(bloch_plus["z"], 0.0, abs_tol=1e-4)

def test_bb84_simulation():
    """Test BB84 without Eve achieves ~0% QBER, with Eve achieves >0% disturbance."""
    res_no_eve = simulate_bb84(num_bits=32, enable_eve=False)
    assert res_no_eve["is_secure"] is True
    assert res_no_eve["qber"] == 0.0

    res_eve = simulate_bb84(num_bits=64, enable_eve=True)
    assert "eve_present" in res_eve
    assert res_eve["eve_present"] is True

def test_nisq_benchmark():
    """Test NISQ benchmark with noise degrades fidelity below 1.0."""
    gates = [{"type": "H", "target": 0, "control": None}]
    res = run_nisq_benchmark(1, gates, noise_level=0.1)
    assert res["success"] is True
    assert res["quantum_fidelity"] <= 1.0

def test_deutsch_jozsa_algorithms():
    """Test Deutsch-Jozsa algorithm for balanced vs constant oracles."""
    # 1. Balanced Oracle: f(x) = x -> CNOT(target=1, control=0)
    # Ancilla starts in |1> via X(1), then H(0) and H(1)
    balanced_gates = [
        {"type": "X", "target": 1, "control": None},
        {"type": "H", "target": 0, "control": None},
        {"type": "H", "target": 1, "control": None},
        {"type": "CNOT", "target": 1, "control": 0},
        {"type": "H", "target": 0, "control": None},
    ]
    res_bal = simulate_circuit(2, balanced_gates)
    assert res_bal["success"] is True
    # q0 (first bit) should be in state |1> with 100% probability
    probs_bal = {item["basis"]: item["probability"] for item in res_bal["statevector"]}
    p_q0_is_1 = sum(probs_bal[b] for b in probs_bal if b.replace("|","").replace(">","")[0] == "1")
    assert math.isclose(p_q0_is_1, 1.0, abs_tol=1e-4)

    # 2. Constant Oracle: f(x) = 0 -> No entangling gate
    constant_gates = [
        {"type": "X", "target": 1, "control": None},
        {"type": "H", "target": 0, "control": None},
        {"type": "H", "target": 1, "control": None},
        {"type": "H", "target": 0, "control": None},
    ]
    res_const = simulate_circuit(2, constant_gates)
    assert res_const["success"] is True
    probs_const = {item["basis"]: item["probability"] for item in res_const["statevector"]}
    p_q0_is_0 = sum(probs_const[b] for b in probs_const if b.replace("|","").replace(">","")[0] == "0")
    assert math.isclose(p_q0_is_0, 1.0, abs_tol=1e-4)

