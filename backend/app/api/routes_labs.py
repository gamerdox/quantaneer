"""
FastAPI Routes for Quantum Labs:
- BB84 Quantum Key Distribution
- Quantum Teleportation 3-Qubit Protocol
- Grover Search Amplitude Amplification
- Bell State CHSH Entanglement Lab
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.quantum.bb84 import simulate_bb84
from app.quantum.algorithms import get_prebuilt_circuit
from app.quantum.engine import simulate_circuit
import numpy as np

router = APIRouter(prefix="/api/labs", tags=["labs"])

class BB84Request(BaseModel):
    num_bits: int = Field(default=16, ge=8, le=64)
    enable_eve: bool = False
    sample_fraction: float = Field(default=0.3, ge=0.1, le=0.5)

@router.post("/bb84")
def run_bb84_lab(req: BB84Request):
    return simulate_bb84(req.num_bits, req.enable_eve, req.sample_fraction)

@router.get("/teleportation")
def get_teleportation_lab():
    circuit = get_prebuilt_circuit("teleportation")
    sim = simulate_circuit(circuit["num_qubits"], circuit["gates"])
    
    stages = [
        {
            "step": 1,
            "title": "State Preparation",
            "desc": "Prepare input state |ψ⟩ on qubit q0 (using H gate to create equal superposition).",
            "active_gates": circuit["gates"][:1]
        },
        {
            "step": 2,
            "title": "Entanglement Generation",
            "desc": "Generate shared EPR Bell pair between Alice's ancilla (q1) and Bob's receiver (q2).",
            "active_gates": circuit["gates"][:3]
        },
        {
            "step": 3,
            "title": "Bell Measurement (Alice)",
            "desc": "Alice entangles the input qubit q0 with her half of the Bell pair q1, then applies Hadamard.",
            "active_gates": circuit["gates"][:5]
        },
        {
            "step": 4,
            "title": "Classical Feed-Forward & Correction (Bob)",
            "desc": "Bob applies conditional CNOT and CZ based on Alice's classical measurement outcomes to reconstruct |ψ⟩ on q2.",
            "active_gates": circuit["gates"]
        }
    ]

    return {
        "success": True,
        "circuit": circuit,
        "simulation": sim,
        "stages": stages,
        "no_cloning_note": "Notice the original state at q0 is destroyed by measurement; quantum information is preserved without cloning."
    }

@router.get("/grover")
def get_grover_lab(target_state: str = "11"):
    """
    Returns 2-qubit Grover search circuit with amplitude amplification breakdown.
    Target state can be '00', '01', '10', '11'.
    """
    # Build custom oracle for chosen target state
    oracle_gates = []
    if target_state == "11":
        oracle_gates = [{"type": "CZ", "target": 1, "control": 0}]
    elif target_state == "10":
        oracle_gates = [
            {"type": "X", "target": 1, "control": None},
            {"type": "CZ", "target": 1, "control": 0},
            {"type": "X", "target": 1, "control": None}
        ]
    elif target_state == "01":
        oracle_gates = [
            {"type": "X", "target": 0, "control": None},
            {"type": "CZ", "target": 1, "control": 0},
            {"type": "X", "target": 0, "control": None}
        ]
    elif target_state == "00":
        oracle_gates = [
            {"type": "X", "target": 0, "control": None},
            {"type": "X", "target": 1, "control": None},
            {"type": "CZ", "target": 1, "control": 0},
            {"type": "X", "target": 0, "control": None},
            {"type": "X", "target": 1, "control": None}
        ]
    else:
        target_state = "11"
        oracle_gates = [{"type": "CZ", "target": 1, "control": 0}]

    full_gates = [
        {"type": "H", "target": 0, "control": None},
        {"type": "H", "target": 1, "control": None},
    ] + oracle_gates + [
        {"type": "H", "target": 0, "control": None},
        {"type": "H", "target": 1, "control": None},
        {"type": "X", "target": 0, "control": None},
        {"type": "X", "target": 1, "control": None},
        {"type": "CZ", "target": 1, "control": 0},
        {"type": "X", "target": 0, "control": None},
        {"type": "X", "target": 1, "control": None},
        {"type": "H", "target": 0, "control": None},
        {"type": "H", "target": 1, "control": None}
    ]

    sim = simulate_circuit(2, full_gates)
    return {
        "success": True,
        "target_state": target_state,
        "num_qubits": 2,
        "gates": full_gates,
        "simulation": sim,
        "iterations_needed": 1,
        "theoretical_speedup": "O(√N) queries vs classical O(N)"
    }

@router.get("/bell")
def get_bell_lab(bell_type: str = "phi_plus"):
    """
    Returns one of the 4 Bell states and CHSH inequality correlation value.
    Types: phi_plus, phi_minus, psi_plus, psi_minus.
    """
    bell_configs = {
        "phi_plus": {
            "name": "|Φ+⟩",
            "latex": "\\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}",
            "gates": [
                {"type": "H", "target": 0, "control": None},
                {"type": "CNOT", "target": 1, "control": 0}
            ],
            "chsh_s": 2.8284 # 2√2 maximal Tsirelson's bound
        },
        "phi_minus": {
            "name": "|Φ-⟩",
            "latex": "\\frac{|00\\rangle - |11\\rangle}{\\sqrt{2}}",
            "gates": [
                {"type": "X", "target": 0, "control": None},
                {"type": "H", "target": 0, "control": None},
                {"type": "CNOT", "target": 1, "control": 0}
            ],
            "chsh_s": 2.8284
        },
        "psi_plus": {
            "name": "|Ψ+⟩",
            "latex": "\\frac{|01\\rangle + |10\\rangle}{\\sqrt{2}}",
            "gates": [
                {"type": "H", "target": 0, "control": None},
                {"type": "CNOT", "target": 1, "control": 0},
                {"type": "X", "target": 1, "control": None}
            ],
            "chsh_s": 2.8284
        },
        "psi_minus": {
            "name": "|Ψ-⟩",
            "latex": "\\frac{|01\\rangle - |10\\rangle}{\\sqrt{2}}",
            "gates": [
                {"type": "X", "target": 0, "control": None},
                {"type": "H", "target": 0, "control": None},
                {"type": "CNOT", "target": 1, "control": 0},
                {"type": "X", "target": 1, "control": None}
            ],
            "chsh_s": 2.8284
        }
    }

    config = bell_configs.get(bell_type, bell_configs["phi_plus"])
    sim = simulate_circuit(2, config["gates"])
    
    return {
        "success": True,
        "bell_type": bell_type,
        "name": config["name"],
        "latex": config["latex"],
        "gates": config["gates"],
        "simulation": sim,
        "chsh_violation": {
            "s_value": config["chsh_s"],
            "classical_limit": 2.0,
            "tsirelson_bound": 2.8284,
            "violates_classical_physics": True,
            "explanation": "Because |S| = 2.83 > 2.0, this quantum state defies local realism (hidden variables)."
        }
    }
