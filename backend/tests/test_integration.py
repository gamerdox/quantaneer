"""
Integration Verification Test Suite
Tests FastAPI endpoints directly via TestClient for fast, deterministic verification
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def post(path, data):
    resp = client.post(path, json=data)
    assert resp.status_code < 400, f"POST {path} failed with status {resp.status_code}: {resp.text}"
    return resp.json()

def get(path):
    resp = client.get(path)
    assert resp.status_code < 400, f"GET {path} failed with status {resp.status_code}: {resp.text}"
    return resp.json()

def test_health():
    res = get("/api/health")
    assert res["status"] == "online"
    assert res["sih_ps"] == "SIH26140"

def test_supported_gates():
    res = get("/api/quantum/gates")
    assert "H" in res["gates"]
    assert "CNOT" in res["gates"]

def test_simulate_bell():
    res = post("/api/quantum/simulate", {
        "num_qubits": 2,
        "gates": [{"type": "H", "target": 0}, {"type": "CNOT", "target": 1, "control": 0}],
        "shots": 1000
    })
    assert res["success"] is True
    probs = {s["basis"]: s["probability"] for s in res["statevector"]}
    assert abs(probs["|00>"] - 0.5) < 0.01
    assert abs(probs["|11>"] - 0.5) < 0.01

def test_export_qasm():
    res = post("/api/quantum/export-qasm", {
        "num_qubits": 2,
        "gates": [{"type": "H", "target": 0}, {"type": "CNOT", "target": 1, "control": 0}]
    })
    assert "OPENQASM 2.0;" in res["openqasm"]

def test_bb84():
    res = post("/api/labs/bb84", {"num_bits": 16, "enable_eve": False})
    assert res["is_secure"] is True
    assert res["qber"] == 0.0

def test_teleportation():
    res = get("/api/labs/teleportation")
    assert res["success"] is True
    assert len(res["stages"]) == 4

def test_grover():
    res = get("/api/labs/grover?target_state=11")
    assert res["success"] is True

def test_lessons():
    res = get("/api/learn/lessons")
    assert res["success"] is True
    assert len(res["lessons"]) == 13

def test_ai_ask():
    # 1. Topic-matched question
    res1 = post("/api/ai/ask", {"query": "What does the Hadamard gate do?"})
    assert "Hadamard" in res1["answer"]

    # 2. General quantum query (tests general mentor fallback f-string)
    res2 = post("/api/ai/ask", {"query": "Tell me about quantum computing applications in medicine"})
    assert res2["mode"] == "ASK"
    assert "Superposition" in res2["answer"]
    assert "Entanglement" in res2["answer"]

    # 3. Circuit contextual question
    res3 = post("/api/ai/ask", {
        "query": "Why are my bell-state probabilities wrong?",
        "circuit_context": {
            "num_qubits": 2,
            "gates": [{"type": "CNOT", "target": 1, "control": 0}]
        }
    })
    assert "answer" in res3

def test_practice_code_run():
    res = post("/api/practice/code-run", {
        "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)"
    })
    assert res["success"] is True
    assert "Qiskit Aer" in res["output"]

def test_progress_dashboard():
    res = get("/api/progress/dashboard")
    assert res["success"] is True
    assert "user" in res
    assert "stats" in res

def test_instructor_overview():
    res = get("/api/instructor/overview")
    assert res["success"] is True
    assert "class_metrics" in res

def test_auth_login_default_student():
    res = post("/api/auth/login", {
        "email": "aarav.sharma@quantaneer.edu",
        "password": "quantum123"
    })
    assert res["success"] is True
    assert "access_token" in res
    assert res["user"]["role"] == "student"

def test_adaptive_quiz_flow():
    # 1. Fetch adaptive question
    res = get("/api/practice/quiz/adaptive?topic=superposition&difficulty=beginner")
    assert res["success"] is True
    assert "question" in res
    q_id = res["question"]["id"]
    
    # 2. Submit answer
    sub_res = post("/api/practice/quiz/adaptive-submit", {
        "user_id": "test_user",
        "quiz_id": q_id,
        "selected_index": 2,
        "consecutive_correct": 0
    })
    assert sub_res["success"] is True
    assert "is_correct" in sub_res
    assert "xp_gained" in sub_res

def test_circuit_persistence():
    save_res = post("/api/practice/circuit/save", {
        "user_id": "test_user",
        "name": "Bell Pair Circuit",
        "description": "Hadamard and CNOT test",
        "num_qubits": 2,
        "gates": [{"type": "H", "target": 0}, {"type": "CNOT", "target": 1, "control": 0}]
    })
    assert save_res["success"] is True
    circ_id = save_res["circuit_id"]

    list_res = get("/api/practice/circuit/list?user_id=test_user")
    assert list_res["success"] is True
    assert any(c["id"] == circ_id for c in list_res["circuits"])

def test_roadmap_toggle():
    res = post("/api/learn/roadmap/toggle", {
        "user_id": "test_user",
        "item_id": "rm_superposition",
        "is_completed": True
    })
    assert res["success"] is True
    assert res["item_id"] == "rm_superposition"

    roadmap_res = get("/api/learn/roadmap?user_id=test_user")
    assert roadmap_res["success"] is True
    match = next(item for item in roadmap_res["roadmap"] if item["id"] == "rm_superposition")
    assert match["is_completed"] is True

def test_static_frontend_serving():
    resp = client.get("/")
    assert resp.status_code == 200
    assert "Quantaneer" in resp.text

