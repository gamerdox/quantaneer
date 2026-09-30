"""
FastAPI Routes for Quantum Simulator Operations
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.quantum.engine import simulate_circuit, validate_circuit, export_to_openqasm, GATE_METADATA
from app.quantum.algorithms import get_prebuilt_circuit, run_nisq_benchmark
from app.core.db import get_db_connection
import json

router = APIRouter(prefix="/api/quantum", tags=["quantum"])

class GateItem(BaseModel):
    type: str
    target: int
    control: Optional[int] = None

class SimulationRequest(BaseModel):
    num_qubits: int = Field(default=2, ge=1, le=6)
    gates: List[GateItem] = []
    shots: int = Field(default=1024, ge=1, le=50000)

class NISQRequest(BaseModel):
    num_qubits: int = Field(default=2, ge=1, le=6)
    gates: List[GateItem] = []
    noise_level: float = Field(default=0.05, ge=0.0, le=0.5)
    shots: int = Field(default=1024, ge=1, le=50000)

@router.get("/gates")
def list_supported_gates():
    return {
        "success": True,
        "gates": GATE_METADATA
    }

@router.post("/simulate")
def run_simulation(req: SimulationRequest):
    gates_dict = [g.model_dump() for g in req.gates]
    result = simulate_circuit(req.num_qubits, gates_dict, req.shots)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    # Record simulation run in DB for analytics
    try:
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO simulation_runs (user_id, num_qubits, gate_count, result_json) VALUES (?, ?, ?, ?)",
            ("user_default", req.num_qubits, len(req.gates), json.dumps({"shots": req.shots, "gate_count": len(req.gates)}))
        )
        conn.commit()
        conn.close()
    except Exception:
        pass

    return result

@router.post("/validate")
def validate(req: SimulationRequest):
    gates_dict = [g.model_dump() for g in req.gates]
    valid, err = validate_circuit(req.num_qubits, gates_dict)
    return {
        "valid": valid,
        "error": err
    }

@router.post("/export-qasm")
def export_qasm(req: SimulationRequest):
    gates_dict = [g.model_dump() for g in req.gates]
    valid, err = validate_circuit(req.num_qubits, gates_dict)
    if not valid:
        raise HTTPException(status_code=400, detail=err)
    qasm_str = export_to_openqasm(req.num_qubits, gates_dict)
    return {
        "success": True,
        "openqasm": qasm_str,
        "filename": "quantaneer_circuit.qasm"
    }

@router.get("/prebuilt/{name}")
def get_prebuilt(name: str):
    try:
        circuit = get_prebuilt_circuit(name)
        # Also run simulation for instant data
        sim_res = simulate_circuit(circuit["num_qubits"], circuit["gates"])
        circuit["simulation"] = sim_res
        return {
            "success": True,
            "circuit": circuit
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/nisq-benchmark")
def nisq_benchmark(req: NISQRequest):
    gates_dict = [g.dict() for g in req.gates]
    res = run_nisq_benchmark(req.num_qubits, gates_dict, req.noise_level, req.shots)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res.get("error", "NISQ execution failed"))
    return res
