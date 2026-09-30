"""
Quantaneer AI Quantum Mentor & Circuit Debugger
Provides high-depth quantum analysis, contextual explanations,
circuit diagnosis with Before/After repairs, hints, and learning path recommendations.
Supports offline deterministic quantum reasoning and optional Gemini API integration.
"""

import os
import json
import math
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from .engine import simulate_circuit, validate_circuit

def call_gemini_api(prompt: str, api_key: str) -> Optional[str]:
    """
    Calls Gemini REST API (gemini-2.0-flash / gemini-1.5-flash) with graceful timeout and fallback.
    Encourages KaTeX formatting for equations ($$...$$ and $...$).
    """
    if not api_key or not api_key.strip():
        return None
    key = api_key.strip()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}"
    payload = {
        "contents": [{
            "parts": [{
                "text": (
                    "You are Quantaneer's Chief Quantum AI Mentor and Professor. "
                    "Provide mathematically rigorous, pedagogical, and clear answers. "
                    "Always format quantum equations using KaTeX LaTeX syntax: "
                    "inline math as $...$ and block math as $$...$$ "
                    "(e.g., $$H|0\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) = |+\\rangle$$). "
                    "Keep explanations structured with bold concepts and bullet points.\n\n"
                    f"User Query: {prompt}"
                )
            }]
        }],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1200
        }
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            candidates = data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts and "text" in parts[0]:
                    return parts[0]["text"]
    except Exception:
        # Graceful fallback to offline deterministic quantum mentor
        pass
    return None

def explain_simulation(circuit_data: Dict[str, Any], level: str = "intermediate") -> Dict[str, Any]:
    """
    Explains 'What just happened?' in the simulation.
    Analyzes gates applied and their mathematical/physical consequence.
    Levels: simple, intermediate, technical.
    """
    num_qubits = circuit_data.get("num_qubits", 1)
    gates = circuit_data.get("gates", [])
    
    if not gates:
        return {
            "title": "Ground State |0...0⟩",
            "summary": f"No quantum gates applied. The system remains in the computational ground state |{'0'*num_qubits}⟩ with 100% probability.",
            "details": "In quantum mechanics, all qubits are conventionally initialized to the |0⟩ basis state.",
            "level": level
        }

    # Execute circuit to get real resulting state
    sim_result = simulate_circuit(num_qubits, gates)
    if not sim_result["success"]:
        return {
            "title": "Simulation Error",
            "summary": "Circuit could not be evaluated due to configuration issues.",
            "details": sim_result.get("error", "Unknown validation error"),
            "level": level
        }

    statevector = sim_result["statevector"]
    active_states = [s for s in statevector if s["probability"] > 0.001]
    
    # Classify state
    is_superposition = len(active_states) > 1
    is_entangled = False
    if num_qubits >= 2 and is_superposition:
        # Check purity of individual qubits
        bloch_list = sim_result["bloch_spheres"]
        for b in bloch_list:
            if b["radius"] < 0.95:  # mixed reduced state implies entanglement!
                is_entangled = True
                break

    last_gate = gates[-1]
    gtype = last_gate["type"]
    t = last_gate["target"]
    c = last_gate.get("control")

    summary = ""
    details = ""
    physical_intuition = ""

    if is_entangled:
        if level == "simple":
            summary = "Your circuit created Quantum Entanglement! The qubits are now super-connected."
            details = "Measuring one qubit will instantly force the other qubit into a matching state, even if they are light-years apart."
            physical_intuition = "This is what Albert Einstein called 'spooky action at a distance'. The two qubits no longer have independent realities; only the combined system exists."
        elif level == "technical":
            summary = "Non-separable statevector generated: |ψ⟩ ≠ |q0⟩ ⊗ |q1⟩."
            details = f"Reduced density matrix Tr_B(|ψ⟩⟨ψ|) yields purity < 1.0 (Bloch radius {bloch_list[0]['radius']}), proving quantum entanglement across the bipartite partition."
            physical_intuition = "The Schmidt rank is > 1. Joint measurements violate the Bell-CHSH inequality (|S| > 2), ruling out local hidden-variable theories."
        else:
            summary = "You successfully generated an Entangled Quantum State."
            details = f"A Hadamard on q{c if c is not None else 0} created superposition, followed by a CNOT gate on q{t} that correlated the computational basis amplitudes."
            physical_intuition = f"The active basis states are {', '.join([s['basis'] for s in active_states])}. The outcome of qubit {t} is strictly dependent on qubit {c}."

    elif is_superposition:
        if level == "simple":
            summary = "Superposition active! The qubits are in multiple possibilities at once."
            details = f"There are {len(active_states)} possible measurement outcomes. You will see different results if you measure multiple times."
            physical_intuition = "Think of a spinning coin: until it lands on the table (measurement), it has a probability of being either heads or tails."
        elif level == "technical":
            summary = f"Statevector distributed across {len(active_states)} orthogonal Hilbert basis vectors."
            amp_strs = [f"{s['basis']}: {s['probability']*100:.1f}%" for s in active_states]
            details = f"Probability amplitudes: {', '.join(amp_strs)}. Sum of squares equals 1.0 (Born rule)."
            physical_intuition = "Unitary rotation has aligned the statevector with the Bloch sphere equator (θ = π/2), maximizing quantum entropy prior to measurement."
        else:
            summary = f"The circuit generated an equal superposition across {len(active_states)} states."
            details = f"Hadamard gate rotated computational basis state |0⟩ to |+⟩. Each basis state has equal probability {100/len(active_states):.1f}%."
            physical_intuition = "Quantum interference causes the probability amplitudes to distribute uniformly across the computational subspace."

    else:
        # Deterministic state
        state_str = active_states[0]["basis"] if active_states else "|0⟩"
        summary = f"Deterministic output: {state_str} with 100% probability."
        details = f"The gates applied (including {gtype} on q{t}) executed a reversible computational transformation leaving no superposition."
        physical_intuition = "The quantum statevector points directly to a pole of the Bloch sphere, behaving identically to a classical bit register."

    return {
        "title": f"Simulation Analysis: {gtype} Gate on q[{t}]",
        "summary": summary,
        "details": details,
        "physical_intuition": physical_intuition,
        "is_entangled": is_entangled,
        "is_superposition": is_superposition,
        "active_outcomes": len(active_states),
        "level": level
    }

def debug_circuit(num_qubits: int, gates: List[Dict[str, Any]], target_intent: Optional[str] = None) -> Dict[str, Any]:
    """
    Intelligently analyzes a circuit for errors, anti-patterns, redundant gates,
    and unintended behavior with Before & After correction comparisons.
    """
    issues = []
    suggestions = []
    corrected_gates = list(gates)

    # 1. Structural check
    valid, err = validate_circuit(num_qubits, gates)
    if not valid:
        return {
            "has_issues": True,
            "status": "Circuit Validation Error",
            "issues": [{
                "severity": "critical",
                "message": err,
                "location": "Circuit validation",
                "explanation": "Gates with invalid qubit bounds or identical control/target cannot be executed."
            }],
            "suggestions": ["Ensure target and control qubits are distinct and between 0 and " + str(num_qubits - 1)],
            "before_circuit": gates,
            "after_circuit": []
        }

    # 2. Check for consecutive self-inverse gates (H*H = I, X*X = I, Z*Z = I, CNOT*CNOT = I)
    i = 0
    while i < len(gates) - 1:
        g1 = gates[i]
        g2 = gates[i + 1]
        if g1["type"] == g2["type"] and g1["target"] == g2["target"] and g1.get("control") == g2.get("control"):
            if g1["type"] in ["H", "X", "Y", "Z", "CNOT", "SWAP"]:
                issues.append({
                    "severity": "warning",
                    "location": f"Gates {i+1} and {i+2}",
                    "message": f"Redundant consecutive {g1['type']} gates on q[{g1['target']}].",
                    "explanation": f"{g1['type']} is self-inverse ({g1['type']} · {g1['type']} = I). Applying it twice cancels out completely, wasting circuit depth."
                })
                suggestions.append(f"Remove the duplicate {g1['type']} gate on q[{g1['target']}].")
                # Remove both for suggested circuit
                corrected_gates = [g for idx, g in enumerate(gates) if idx != i and idx != (i + 1)]
                break
        i += 1

    # 3. Intent-specific checks (e.g. Bell state debugging)
    if target_intent == "bell_state":
        # Check if CNOT has control before H or target before H
        h_found = any(g["type"] == "H" for g in gates)
        cnot_found = any(g["type"] == "CNOT" for g in gates)
        if not h_found:
            issues.append({
                "severity": "high",
                "location": "q[0]",
                "message": "Missing Hadamard (H) gate before entanglement.",
                "explanation": "To create Bell state (|00⟩ + |11⟩)/√2, qubit 0 must first be put in superposition via an H gate before applying CNOT."
            })
            suggestions.append("Insert H on q[0] before the CNOT gate.")
            corrected_gates = [{"type": "H", "target": 0, "control": None}, {"type": "CNOT", "target": 1, "control": 0}]

        elif cnot_found:
            # Check order: H must come before CNOT
            h_idx = next(idx for idx, g in enumerate(gates) if g["type"] == "H")
            cnot_idx = next(idx for idx, g in enumerate(gates) if g["type"] == "CNOT")
            if cnot_idx < h_idx:
                issues.append({
                    "severity": "high",
                    "location": f"Step {cnot_idx + 1}",
                    "message": "CNOT applied before Hadamard gate.",
                    "explanation": "If CNOT is applied to |00⟩ before H, the control qubit is 0, so CNOT does nothing! The state remains unentangled."
                })
                suggestions.append("Move Hadamard to step 1 and CNOT to step 2.")
                corrected_gates = [{"type": "H", "target": 0, "control": None}, {"type": "CNOT", "target": 1, "control": 0}]

    # 4. Check for Measurement in middle of circuit without following gates
    m_indices = [idx for idx, g in enumerate(gates) if g["type"] == "M"]
    for m_idx in m_indices:
        if m_idx < len(gates) - 1:
            issues.append({
                "severity": "info",
                "location": f"Step {m_idx + 1}",
                "message": "Mid-circuit measurement detected.",
                "explanation": "Measuring a qubit collapses its superposition. Subsequent coherent quantum interference on this qubit will be destroyed."
            })

    has_issues = len(issues) > 0
    return {
        "has_issues": has_issues,
        "status": "Issues Detected" if has_issues else "Circuit Verified Clean",
        "issues": issues,
        "suggestions": suggestions if suggestions else ["Circuit structure is mathematically sound."],
        "before_circuit": gates,
        "after_circuit": corrected_gates if has_issues else gates
    }

def get_quantum_hint(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Provides pedagogical hints without spoiling the entire solution.
    """
    topic = context.get("topic", "superposition").lower()
    step = context.get("hint_level", 1)

    hints_db = {
        "superposition": [
            "Hint 1: Look at the gate palette for a gate that rotates states from the Z axis to the X axis.",
            "Hint 2: The Hadamard gate (H) turns |0⟩ into (|0⟩ + |1⟩)/√2.",
            "Hint 3: Place a single 'H' gate on wire q[0] and press Run Simulation."
        ],
        "bell_state": [
            "Hint 1: Entanglement requires two ingredients: superposition on one qubit, and a controlled interaction.",
            "Hint 2: Start with H on q[0]. Then find a 2-qubit gate that flips q[1] when q[0] is 1.",
            "Hint 3: Apply H on q[0], then place CNOT with control=0 and target=1."
        ],
        "grover": [
            "Hint 1: Grover's search needs an Oracle to flip the phase of the target state, followed by a Diffusion operator.",
            "Hint 2: For 2 qubits searching for |11⟩, a simple Controlled-Z (CZ) gate acts as the phase oracle!",
            "Hint 3: The diffusion operator reflects amplitudes around the mean using H -> X -> CZ -> X -> H."
        ],
        "bb84": [
            "Hint 1: Remember the two measurement bases: Rectilinear (+) and Diagonal (x).",
            "Hint 2: When Alice and Bob use the same basis, their measured bits match 100% of the time in a noiseless channel.",
            "Hint 3: If an eavesdropper (Eve) measures in the wrong basis, she introduces ~25% error on the intercepted bits."
        ]
    }

    topic_hints = hints_db.get(topic, hints_db["superposition"])
    idx = min(step - 1, len(topic_hints) - 1)
    
    return {
        "topic": topic,
        "hint_level": idx + 1,
        "max_hints": len(topic_hints),
        "hint": topic_hints[idx],
        "has_more": (idx + 1) < len(topic_hints)
    }

def ask_quantum_mentor(
    query: str,
    circuit_context: Optional[Dict[str, Any]] = None,
    user_progress: Optional[Dict[str, Any]] = None,
    gemini_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Central AI Mentor answering questions with genuine quantum physics comprehension.
    Supports live Gemini 2.0 Flash generation when API key is provided, with
    instant fallback to mathematical offline deterministic responses.
    """
    effective_key = gemini_api_key or os.environ.get("GEMINI_API_KEY")
    if effective_key:
        prompt_with_context = query
        if circuit_context and "gates" in circuit_context:
            prompt_with_context += f"\n\nContextual Quantum Circuit: {circuit_context.get('num_qubits', 2)} qubits, Gates: {json.dumps(circuit_context.get('gates', []))}"
        live_ai_resp = call_gemini_api(prompt_with_context, effective_key)
        if live_ai_resp:
            return {
                "answer": live_ai_resp,
                "mode": "LIVE_GEMINI",
                "source": "Gemini 2.0 Flash (Cloud Neural Quantum Copilot)",
                "recommended_action": "Generated dynamically via Google Gemini."
            }

    q_lower = query.lower()

    # Contextual check: if user asked "why are my bell-state probabilities wrong"
    if "bell" in q_lower and ("wrong" in q_lower or "error" in q_lower or "00" in q_lower):
        if circuit_context and "gates" in circuit_context:
            debug_res = debug_circuit(circuit_context.get("num_qubits", 2), circuit_context.get("gates", []), "bell_state")
            if debug_res["has_issues"]:
                issue = debug_res["issues"][0]
                return {
                    "answer": f"**Circuit Inspection Found:**\n\n{issue['message']}\n\n**Why this happens:** {issue['explanation']}\n\n**How to fix it:** {debug_res['suggestions'][0]}",
                    "mode": "DEBUG",
                    "debug_details": debug_res,
                    "recommended_action": "Apply the suggested correction in the simulator."
                }

    if "hadamard" in q_lower or "h gate" in q_lower:
        return {
            "answer": """### The Hadamard Gate (H)
The **Hadamard gate** is the foundational building block for quantum superposition and interference.

* **Matrix Representation:**
  $$H = \\frac{1}{\\sqrt{2}}\\begin{bmatrix} 1 & 1 \\\\ 1 & -1 \\end{bmatrix}$$
* **Transformation:**
  $$H|0\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} = |+\\rangle$$
  $$H|1\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}} = |-\\rangle$$
* **Bloch Sphere Effect:** Rotates the state vector $\\pi$ radians around the $(\\hat{x} + \\hat{z})/\\sqrt{2}$ diagonal axis, converting the North Pole ($|0\\rangle$) directly to the equator ($|+\\rangle$).
* **Reversibility:** Note that $H^2 = I$. Applying Hadamard twice restores the initial state!""",
            "mode": "EXPLAIN",
            "recommended_lesson": "superposition"
        }

    if "entangle" in q_lower or "spooky" in q_lower or "bell" in q_lower:
        return {
            "answer": """### Quantum Entanglement & Bell States
A state is **entangled** when its composite wavefunction cannot be factored into independent individual qubit states:

$$|\\psi_{AB}\\rangle \\neq |\\psi_A\\rangle \\otimes |\\psi_B\\rangle$$

In the canonical Bell state:
$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$

* Neither qubit has a definite state on its own (each has a 50% random chance of yielding 0 or 1).
* Yet, their outcomes are **100% correlated**! If Alice measures her qubit and observes 1, Bob's qubit instantaneously collapses to 1.
* This non-local correlation was experimentally verified to violate Bell's inequality, earning the 2022 Nobel Prize in Physics.""",
            "mode": "EXPLAIN",
            "recommended_lesson": "bell_states"
        }

    if "grover" in q_lower:
        return {
            "answer": """### Grover's Quantum Search Algorithm
Grover's algorithm searches an unsorted database of $N = 2^n$ items in $O(\\sqrt{N})$ steps, providing a quadratic speedup over classical $O(N)$ searches.

### Key Steps:
1. **Equal Superposition:** Apply Hadamard gates to all $n$ qubits.
2. **Oracle ($U_w$):** Flips the phase of the target marked state: $|w\\rangle \\to -|w\\rangle$.
3. **Diffusion Operator ($U_s$):** Inverts all amplitudes around their mean value ($2|s\\rangle\\langle s| - I$).
4. **Result:** The target amplitude increases while non-target amplitudes shrink! For $N=4$ (2 qubits), exactly **one** iteration achieves 100% target probability.""",
            "mode": "EXPLAIN",
            "recommended_lesson": "algorithms"
        }

    if "bb84" in q_lower or "cryptography" in q_lower or "qkd" in q_lower:
        return {
            "answer": """### BB84 Quantum Key Distribution
BB84 (Bennett-Brassard 1984) allows two communication partners (Alice and Bob) to create a shared, unbreakable one-time-pad key using single photons.

* **Heisenberg Uncertainty & No-Cloning:** If Eve intercepts a photon transmitted in an unknown polarization basis, she must choose a basis to measure it. If she guesses incorrectly, she permanently perturbs the photon state.
* **Error Detection (QBER):** When Alice and Bob compare a test sample of their sifted key, any eavesdropping shows up as an elevated Quantum Bit Error Rate (QBER). If QBER > 11%, they abort the transmission!""",
            "mode": "EXPLAIN",
            "recommended_lesson": "cryptography"
        }

    if "phase kickback" in q_lower or "kickback" in q_lower:
        return {
            "answer": """### 🔄 Phase Kickback in Quantum Circuits
**Phase Kickback** is one of the most critical mechanisms behind quantum algorithm speedups (used in Deutsch-Jozsa, Grover, and Shor's algorithms).

* **Mechanism:** When a controlled operation (like CNOT or Controlled-U) is applied, and the **target qubit is in an eigenstate of the gate with eigenvalue $e^{i\\theta}$**, the phase shift $\\theta$ is "kicked back" to the **control qubit**!
* **Example with CNOT:**
  1. Target qubit in $|-\\rangle = (|0\\rangle - |1\\rangle)/\\sqrt{2}$ (eigenstate of $X$ with eigenvalue $-1$).
  2. If control is $|0\\rangle$, target unchanged: $|0\\rangle|-\\rangle$.
  3. If control is $|1\\rangle$, target flips: $X|-\\rangle = -|-\\rangle$.
  4. State becomes $-|1\\rangle|-\\rangle$.
  5. Overall: $|x\\rangle|-\\rangle \\to (-1)^x |x\\rangle|-\\rangle$! The phase $(-1)^x$ appears on the control qubit $x$!""",
            "mode": "EXPLAIN",
            "recommended_lesson": "algorithms"
        }

    if "deutsch" in q_lower or "jozsa" in q_lower:
        return {
            "answer": """### ⚡ The Deutsch-Jozsa Algorithm
The **Deutsch-Jozsa algorithm** was one of the first demonstrations of an exponential quantum speedup over deterministic classical computation.

* **Problem:** Given an oracle function $f: \\{0,1\\}^n \\to \\{0,1\\}$, determine whether $f$ is **constant** (outputs all 0s or all 1s) or **balanced** (outputs 0 for half of inputs, 1 for the other half).
* **Classical Complexity:** Requires up to $2^{n-1} + 1$ evaluations in the worst case.
* **Quantum Complexity:** Solves the problem with **exactly 1 quantum query**!
* **How it works:** Uses Hadamard transforms to create superposition, encodes function evaluations into relative phases via phase kickback, and uses constructive interference on $|00...0\\rangle$ (if constant) or destructive interference (if balanced).""",
            "mode": "EXPLAIN",
            "recommended_lesson": "algorithms"
        }

    if "teleport" in q_lower:
        return {
            "answer": """### 🛸 Quantum Teleportation Protocol
Quantum teleportation transfers an arbitrary unknown quantum state $|\\psi\\rangle$ using **entanglement** and **classical communication**.

* **Resources Required:** 1 shared EPR Bell pair $(q_1, q_2)$ and 2 classical bits sent through a classical channel.
* **Key Step 1:** Alice entangles input qubit $q_0$ with her Bell half $q_1$ via CNOT and Hadamard.
* **Key Step 2:** Alice measures $q_0$ and $q_1$ in the computational basis, collapsing her qubits and destroying the original state on $q_0$.
* **Key Step 3:** Bob receives Alice's 2 classical bits $(m_1, m_0)$ and applies corresponding unitary corrections:
  * $00 \\to I$ (do nothing)
  * $01 \\to X$
  * $10 \\to Z$
  * $11 \\to ZX$
* **No-Cloning Compliance:** Since the original state on $q_0$ is destroyed by measurement, information is transferred without violating the No-Cloning theorem!""",
            "mode": "EXPLAIN",
            "recommended_lesson": "cryptography"
        }

    if "shor" in q_lower or "factor" in q_lower:
        return {
            "answer": """### 🔐 Shor's Algorithm for Prime Factorization
Discovered by Peter Shor in 1994, this algorithm factors large integers $N$ in polynomial time $\\tilde{O}((\\log N)^3)$, threatening RSA public-key cryptography.

* **Classical Best (General Number Field Sieve):** Sub-exponential time $O(e^{c(\\log N)^{1/3}})$.
* **Quantum Speedup:** Transforms the factorization problem into **order finding** (finding period $r$ of $f(x) = a^x \\pmod N$).
* **Quantum Fourier Transform (QFT):** Uses quantum phase estimation and constructive interference to measure the period $r$ in $O((\\log N)^2)$ steps.
* Once period $r$ is found, classical greatest common divisor $\\gcd(a^{r/2} \\pm 1, N)$ reveals the prime factors!""",
            "mode": "EXPLAIN",
            "recommended_lesson": "algorithms"
        }

    if "bloch" in q_lower or "sphere" in q_lower:
        return {
            "answer": """### 🌐 The Bloch Sphere Representation
The **Bloch Sphere** is a 3D geometric representation of pure single-qubit states as points on the surface of a unit sphere ($r = 1$).

* **State Parametrization:**
  $$|\\psi\\rangle = \\cos\\left(\\frac{\\theta}{2}\\right)|0\\rangle + e^{i\\phi}\\sin\\left(\\frac{\\theta}{2}\\right)|1\\rangle$$
  where $\\theta \\in [0, \\pi]$ is the polar angle and $\\phi \\in [0, 2\\pi)$ is the azimuthal phase angle.
* **Key Poles and Equator:**
  * **North Pole ($+Z$):** $|0\\rangle$ ($\\theta = 0$)
  * **South Pole ($-Z$):** $|1\\rangle$ ($\\theta = \\pi$)
  * **$+X$ Equator:** $|+\\rangle = (|0\\rangle + |1\\rangle)/\\sqrt{2}$ ($\\theta = \\pi/2, \\phi = 0$)
  * **$-X$ Equator:** $|-\\rangle = (|0\\rangle - |1\\rangle)/\\sqrt{2}$ ($\\theta = \\pi/2, \\phi = \\pi$)
  * **$+Y$ Equator:** $|+i\\rangle = (|0\\rangle + i|1\\rangle)/\\sqrt{2}$ ($\\theta = \\pi/2, \\phi = \\pi/2$)
* **Reduced Density Matrix:** For multi-qubit systems, entangled qubits have Bloch vectors with radius $r < 1$, lying inside the sphere (mixed state).""",
            "mode": "EXPLAIN",
            "recommended_lesson": "qubits"
        }

    if "no-cloning" in q_lower or "cloning" in q_lower:
        return {
            "answer": """### 🛡️ The No-Cloning Theorem
Formulated by Wootters, Zurek, and Dieks in 1982, the **No-Cloning Theorem** proves that it is mathematically impossible to create an identical copy of an arbitrary unknown quantum state.

* **Mathematical Proof Sketch:**
  Assume a unitary cloning operator $U$ exists such that for any states $|\\psi\\rangle, |\\phi\\rangle$:
  $$U(|\\psi\\rangle |0\\rangle) = |\\psi\\rangle |\\psi\\rangle$$
  $$U(|\\phi\\rangle |0\\rangle) = |\\phi\\rangle |\\phi\\rangle$$
  Taking the inner product:
  $$\\langle\\psi|\\phi\\rangle = (\\langle\\psi|\\phi\\rangle)^2$$
  This equation holds ONLY if $\\langle\\psi|\\phi\\rangle = 0$ (orthogonal states) or $\\langle\\psi|\\phi\\rangle = 1$ (identical states).
  Therefore, no universal unitary cloner can exist for arbitrary non-orthogonal quantum states!
* **Cryptographic Implication:** This is the physical bedrock of quantum cryptography (BB84 QKD) — eavesdroppers cannot duplicate flying qubits without detection.""",
            "mode": "EXPLAIN",
            "recommended_lesson": "cryptography"
        }

    # General mentor response
    return {
        "answer": f"""### 💡 AI Quantum Mentor Guidance
Regarding your question: *"{query}"*

In quantum computing, three core principles drive computational advantage:
1. **Superposition:** Systems exist in linear amplitude combinations $\\alpha|0\\rangle + \\beta|1\\rangle$, allowing parallel state evolution.
2. **Phase Interference:** Unitary gates alter complex phases so incorrect computational paths interfere destructively, while correct solutions interfere constructively.
3. **Entanglement:** Composite statevectors cannot be factored ($|\\psi_{{AB}}\\rangle \\neq |\\psi_A\\rangle \\otimes |\\psi_B\\rangle$), enabling non-local correlation protocols like Teleportation and Superdense Coding.

Feel free to construct this in the **Visual Quantum Circuit Simulator** or test it inside the **Quantum Labs** to inspect real-time statevector amplitudes!""",
        "mode": "ASK",
        "recommended_action": "Open the Quantum Simulator to test this interaction."
    }
