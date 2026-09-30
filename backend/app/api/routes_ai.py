"""
FastAPI Routes for AI Quantum Mentor & Debugger
"""

from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.quantum.ai_tutor import explain_simulation, debug_circuit, get_quantum_hint, ask_quantum_mentor

router = APIRouter(prefix="/api/ai", tags=["ai"])

class AskRequest(BaseModel):
    query: str
    circuit_context: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = "user_default"
    gemini_api_key: Optional[str] = None

class ExplainRequest(BaseModel):
    num_qubits: int = 2
    gates: List[Dict[str, Any]] = []
    level: str = "intermediate"

class DebugRequest(BaseModel):
    num_qubits: int = 2
    gates: List[Dict[str, Any]] = []
    target_intent: Optional[str] = None

class HintRequest(BaseModel):
    topic: str = "superposition"
    hint_level: int = 1

@router.post("/ask")
def ask_tutor(
    req: AskRequest,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key")
):
    effective_key = req.gemini_api_key or x_gemini_api_key
    return ask_quantum_mentor(req.query, req.circuit_context, gemini_api_key=effective_key)

@router.post("/explain")
def explain_action(req: ExplainRequest):
    return explain_simulation({"num_qubits": req.num_qubits, "gates": req.gates}, req.level)

@router.post("/debug")
def debug_action(req: DebugRequest):
    return debug_circuit(req.num_qubits, req.gates, req.target_intent)

@router.post("/hint")
def fetch_hint(req: HintRequest):
    return get_quantum_hint({"topic": req.topic, "hint_level": req.hint_level})
