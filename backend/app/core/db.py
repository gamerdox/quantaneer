"""
Quantaneer Persistent Database & Seed Data
Uses SQLite for robust relational persistence of users, profiles,
learning paths, lessons, topic mastery, quizzes, challenges,
saved circuits, simulation history, badges, and leaderboard.
"""

import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "quantaneer.db")

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users & Profiles
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        salt TEXT,
        role TEXT NOT NULL DEFAULT 'student',
        xp INTEGER DEFAULT 120,
        level INTEGER DEFAULT 2,
        streak_days INTEGER DEFAULT 3,
        avatar_seed TEXT DEFAULT 'quantum1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Safe column migrations if database already existed
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT;")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN salt TEXT;")
    except Exception:
        pass

    # Roadmap Progress Checklist Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_roadmap (
        user_id TEXT,
        item_id TEXT,
        is_completed INTEGER DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, item_id)
    );
    """)

    # 2. Lessons & Learning Modules
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        order_num INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        summary TEXT NOT NULL,
        content_markdown TEXT NOT NULL,
        interactive_component TEXT NOT NULL,
        starter_circuit_json TEXT,
        xp_reward INTEGER DEFAULT 50
    );
    """)

    # 3. User Progress
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_progress (
        user_id TEXT,
        lesson_id TEXT,
        completed INTEGER DEFAULT 0,
        mastery_percent REAL DEFAULT 0.0,
        completed_at TIMESTAMP,
        PRIMARY KEY (user_id, lesson_id)
    );
    """)

    # 4. Quizzes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_questions (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL,
        topic TEXT NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL, -- 'mcq', 'prediction', 'debug'
        options_json TEXT NOT NULL,
        correct_index INTEGER NOT NULL,
        explanation TEXT NOT NULL,
        difficulty TEXT DEFAULT 'intermediate'
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        quiz_id TEXT NOT NULL,
        selected_index INTEGER NOT NULL,
        is_correct INTEGER NOT NULL,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Challenges
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        description TEXT NOT NULL,
        target_description TEXT NOT NULL,
        starter_circuit_json TEXT,
        solution_criteria_json TEXT,
        xp_reward INTEGER DEFAULT 100
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS challenge_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        challenge_id TEXT NOT NULL,
        passed INTEGER NOT NULL,
        circuit_json TEXT,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. Saved Circuits & Simulation Runs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS circuits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        num_qubits INTEGER NOT NULL,
        gates_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS simulation_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        circuit_id TEXT,
        num_qubits INTEGER NOT NULL,
        gate_count INTEGER NOT NULL,
        result_json TEXT NOT NULL,
        run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 7. Badges
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        category TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_badges (
        user_id TEXT,
        badge_id TEXT,
        awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, badge_id)
    );
    """)

    conn.commit()
    seed_initial_data(conn)
    conn.close()

def seed_initial_data(conn):
    cursor = conn.cursor()

    # Check if default user exists
    default_hash = "c464368d982e2524eb9756a2ffb5f74b88099488eb237345809c8c3e2c806519"
    default_salt = "quantaneer_salt_1"

    cursor.execute("SELECT COUNT(*) FROM users WHERE id = 'user_default'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, salt, role, xp, level, streak_days, avatar_seed)
        VALUES ('user_default', 'Aarav Sharma', 'aarav.sharma@quantaneer.edu', ?, ?, 'student', 450, 4, 5, 'aarav')
        """, (default_hash, default_salt))
        cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, salt, role, xp, level, streak_days, avatar_seed)
        VALUES ('instructor_demo', 'Dr. Radhika Sen', 'radhika.sen@iit.edu', ?, ?, 'instructor', 1250, 9, 21, 'radhika')
        """, (default_hash, default_salt))
        # Pre-seed other peer students for authentic leaderboard
        peers = [
            ('user_2', 'Priya Patel', 'priya@quantaneer.edu', default_hash, default_salt, 'student', 680, 5, 8, 'priya'),
            ('user_3', 'Rohan Gupta', 'rohan@quantaneer.edu', default_hash, default_salt, 'student', 520, 4, 4, 'rohan'),
            ('user_4', 'Ananya Iyer', 'ananya@quantaneer.edu', default_hash, default_salt, 'student', 410, 3, 3, 'ananya'),
            ('user_5', 'Vikram Rao', 'vikram@quantaneer.edu', default_hash, default_salt, 'student', 340, 3, 2, 'vikram'),
            ('user_6', 'Neha Joshi', 'neha@quantaneer.edu', default_hash, default_salt, 'student', 290, 2, 1, 'neha'),
        ]
        cursor.executemany("INSERT INTO users (id, name, email, password_hash, salt, role, xp, level, streak_days, avatar_seed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", peers)
    else:
        # Ensure password_hash is set on existing rows
        cursor.execute("UPDATE users SET password_hash = ?, salt = ? WHERE password_hash IS NULL", (default_hash, default_salt))

    # Seed 13 Modules
    cursor.execute("SELECT COUNT(*) FROM lessons")
    if cursor.fetchone()[0] == 0:
        lessons_data = [
            (
                "basics", 1, "Quantum Computing Basics", "Fundamentals",
                "Understand why classical bits (0 or 1) fail for quantum parallelism and how quantum states evolve deterministically via unitary transformations.",
                """# Quantum Computing Basics
Classical computers compute using electrical voltages representing discrete bits: either 0 or 1.
Quantum computers harness the counterintuitive principles of **quantum mechanics** — specifically linear superpositions of states, phase interference, and non-local entanglement.

### Key Milestones:
1. **Richard Feynman (1982)**: Pointed out that simulating quantum physics requires quantum computers.
2. **David Deutsch (1985)**: Formulated the universal quantum Turing machine.
3. **Peter Shor (1994)**: Discovered polynomial-time prime factorization algorithm, challenging RSA encryption.
4. **Lov Grover (1996)**: Discovered quadratic quantum database search algorithm.
                """,
                "concept_visualizer",
                json.dumps([{"type": "H", "target": 0, "control": None}]),
                50
            ),
            (
                "qubits", 2, "Qubits and Quantum States", "Fundamentals",
                "Deep dive into the fundamental unit of quantum information: the qubit. Statevector notation, Dirac bra-ket notation, and normalization.",
                """# Qubits and Quantum States
A classical bit exists in one of two definite states: 0 or 1.
A **qubit** (quantum bit) is a two-level quantum system represented as a linear combination in a 2-dimensional complex Hilbert space:

$$|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle$$

where $\\alpha, \\beta \\in \\mathbb{C}$ are probability amplitudes satisfying the normalization constraint:

$$|\\alpha|^2 + |\\beta|^2 = 1$$

Here:
* $|\\alpha|^2$ is the probability of measuring state $|0\\rangle$.
* $|\\beta|^2$ is the probability of measuring state $|1\\rangle$.
                """,
                "bloch_explorer",
                json.dumps([{"type": "X", "target": 0, "control": None}]),
                60
            ),
            (
                "superposition", 3, "Superposition Principle", "Fundamentals",
                "Explore quantum superposition. Witness how the Hadamard gate rotates pure states to the Bloch equator.",
                """# The Superposition Principle
Superposition allows a quantum system to exist simultaneously in a linear combination of all basis states until a measurement is performed.

The **Hadamard Gate (H)** is the primary gateway to quantum superposition. When applied to the ground state $|0\\rangle$:

$$H|0\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) = |+\\rangle$$

Both outcomes have equal probability:
$$P(0) = |1/\\sqrt{2}|^2 = 0.5 = 50\\%$$
$$P(1) = |1/\\sqrt{2}|^2 = 0.5 = 50\\%$$
                """,
                "interactive_hadamard",
                json.dumps([{"type": "H", "target": 0, "control": None}]),
                70
            ),
            (
                "measurement", 4, "Quantum Measurement & Wavefunction Collapse", "Fundamentals",
                "Understand the Born Rule, projective measurement, wavefunction collapse, and shot statistics.",
                """# Measurement and Wavefunction Collapse
In quantum mechanics, measurement is inherently destructive and probabilistic.

### The Born Rule:
When measuring a state $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ in the computational basis:
- You observe outcome $0$ with probability $P(0) = |\\alpha|^2$.
- You observe outcome $1$ with probability $P(1) = |\\beta|^2$.
- Immediately following measurement, the wavefunction **collapses** into the observed basis state. Any subsequent measurement will yield the same outcome with 100% certainty!
                """,
                "measurement_sampler",
                json.dumps([{"type": "H", "target": 0, "control": None}, {"type": "M", "target": 0, "control": None}]),
                60
            ),
            (
                "gates", 5, "Single-Qubit Quantum Gates", "Gates",
                "Master Pauli-X, Pauli-Y, Pauli-Z, Hadamard, Phase (S), and π/8 (T) unitary operations.",
                """# Single-Qubit Quantum Gates
All quantum operations (excluding measurement) must be **unitary operators** ($U^\\dagger U = I$), guaranteeing conservation of total probability.

### Core Gates:
* **Pauli-X**: Bit-flip matrix $\\begin{bmatrix}0&1\\\\1&0\\end{bmatrix}$. Rotates $\\pi$ radians around X-axis.
* **Pauli-Z**: Phase-flip matrix $\\begin{bmatrix}1&0\\\\0&-1\\end{bmatrix}$. Leaves $|0\\rangle$ untouched, maps $|1\\rangle \\to -|1\\rangle$.
* **Pauli-Y**: Combines bit and phase flips: $\\begin{bmatrix}0&-i\\\\i&0\\end{bmatrix}$.
* **S Gate**: $\\sqrt{Z}$ phase shift of $\\pi/2$.
* **T Gate**: $\\sqrt{S}$ phase shift of $\\pi/4$. Essential for fault-tolerant universal quantum computation!
                """,
                "gate_matrix_lab",
                json.dumps([{"type": "H", "target": 0, "control": None}, {"type": "S", "target": 0, "control": None}]),
                80
            ),
            (
                "circuit_design", 6, "Quantum Circuit Design & Wires", "Gates",
                "Learn how multi-qubit registers are arranged into quantum circuit diagrams with parallel wire representations.",
                """# Quantum Circuit Architecture
A quantum circuit represents quantum computations as a sequence of quantum gates applied along horizontal qubit wires.

Time flows strictly from **left to right**. Multiple gates situated on different qubits in the same vertical column are executed in parallel!

For an $n$-qubit circuit, the composite Hilbert space dimension is $2^n$. Tensor products $\\otimes$ represent composite systems.
                """,
                "circuit_builder_tutorial",
                json.dumps([{"type": "H", "target": 0, "control": None}, {"type": "X", "target": 1, "control": None}]),
                75
            ),
            (
                "entanglement", 7, "Quantum Entanglement", "Entanglement",
                "Einstein called it 'spooky action at a distance'. Understand non-separable quantum states.",
                """# Quantum Entanglement
A composite quantum state is **entangled** if it cannot be written as a product state of its individual constituent subsystems:

$$|\\psi_{AB}\\rangle \\neq |\\psi_A\\rangle \\otimes |\\psi_B\\rangle$$

When two qubits are entangled, their properties are inextricably linked regardless of spatial separation. Measuring one qubit instantaneously determines the state of the other qubit with zero communication time!
                """,
                "entanglement_demonstrator",
                json.dumps([{"type": "H", "target": 0, "control": None}, {"type": "CNOT", "target": 1, "control": 0}]),
                90
            ),
            (
                "bell_states", 8, "The Four Bell States", "Entanglement",
                "Construct and analyze the 4 orthonormal maximally entangled two-qubit Bell states.",
                """# The Four Canonical Bell States
The Bell states form an orthonormal basis for two qubits:

1. $|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$: H on q0, CNOT(0, 1)
2. $|\\Phi^-\\rangle = \\frac{|00\\rangle - |11\\rangle}{\\sqrt{2}}$: X on q0, H on q0, CNOT(0, 1)
3. $|\\Psi^+\\rangle = \\frac{|01\\rangle + |10\\rangle}{\\sqrt{2}}$: X on q1, H on q0, CNOT(0, 1)
4. $|\\Psi^-\\rangle = \\frac{|01\\rangle - |10\\rangle}{\\sqrt{2}}$: X on q0, X on q1, H on q0, CNOT(0, 1)
                """,
                "bell_state_lab",
                json.dumps([{"type": "H", "target": 0, "control": None}, {"type": "CNOT", "target": 1, "control": 0}]),
                100
            ),
            (
                "algorithms", 9, "Quantum Algorithms: Grover & Deutsch-Jozsa", "Algorithms",
                "Learn how quantum phase kickback and constructive interference achieve speedups over classical algorithms.",
                """# Introduction to Quantum Algorithms
Quantum algorithms solve computational problems exponentially or quadratically faster than the best known classical methods.

### Deutsch-Jozsa Algorithm:
Determines whether an oracle $f(x)$ is constant or balanced with just **one query**, whereas classical algorithms require $2^{n-1} + 1$ evaluations in the worst case!

### Grover's Algorithm:
Searches through $N = 2^n$ unstructured items in $O(\\sqrt{N})$ queries. Uses **amplitude amplification** to invert the marked target state and reflect around the mean.
                """,
                "algorithm_playground",
                json.dumps([{"type": "H", "target": 0, "control": None}, {"type": "H", "target": 1, "control": None}, {"type": "CZ", "target": 1, "control": 0}]),
                120
            ),
            (
                "cryptography", 10, "Quantum Cryptography (BB84 QKD)", "Security",
                "How quantum physics guarantees information-theoretic secrecy via the No-Cloning Theorem.",
                """# Quantum Key Distribution: BB84 Protocol
Proposed in 1984 by Charles Bennett and Gilles Brassard, BB84 allows two parties (Alice and Bob) to produce a shared random secret key.

Security is guaranteed by the **No-Cloning Theorem**: an eavesdropper (Eve) cannot intercept and clone unknown quantum photon polarization states without introducing detectable errors (Quantum Bit Error Rate, QBER).
                """,
                "bb84_lab",
                json.dumps([]),
                110
            ),
            (
                "nisq", 11, "NISQ Computing and Noise Models", "Hardware",
                "Noisy Intermediate-Scale Quantum hardware challenges: decoherence, gate infidelity, and error mitigation.",
                """# NISQ Era Realities
Today's quantum computers are in the **NISQ** (Noisy Intermediate-Scale Quantum) era:
- 50 to 1,000 physical qubits.
- Imperfect gate fidelities (typically 99% to 99.9%).
- Finite coherence times ($T_1$ relaxation time, $T_2$ dephasing time).
- No full fault-tolerant Quantum Error Correction (QEC) yet.
                """,
                "nisq_benchmark",
                json.dumps([{"type": "H", "target": 0, "control": None}, {"type": "CNOT", "target": 1, "control": 0}]),
                95
            ),
            (
                "programming", 12, "Quantum Programming with Qiskit", "Programming",
                "Translate circuits into Python Qiskit code. Quantum registers, classical registers, and backend execution.",
                """# Quantum Programming with Qiskit
Qiskit is the open-source quantum SDK created by IBM.

```python
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

simulator = AerSimulator()
compiled_circuit = transpile(qc, simulator)
result = simulator.run(compiled_circuit, shots=1000).result()
counts = result.get_counts()
print("Measurement counts:", counts)
```
                """,
                "qiskit_code_editor",
                json.dumps([{"type": "H", "target": 0, "control": None}, {"type": "CNOT", "target": 1, "control": 0}]),
                100
            ),
            (
                "final_project", 13, "Capstone Project: Custom Quantum Protocol", "Capstone",
                "Design, simulate, debug, benchmark, and export a complete multi-qubit algorithm or protocol.",
                """# Capstone Project
Synthesize everything you have learned!
You will build, simulate, and present an end-to-end quantum protocol:
1. Formulate problem specification.
2. Construct and optimize the quantum circuit.
3. Validate statevector, probabilities, and Bloch sphere trajectories.
4. Stress-test under NISQ noise models.
5. Export verified OpenQASM 2.0 and Qiskit code.
                """,
                "full_simulator_capstone",
                json.dumps([{"type": "H", "target": 0, "control": None}, {"type": "CNOT", "target": 1, "control": 0}]),
                200
            )
        ]
        cursor.executemany("""
        INSERT INTO lessons (id, order_num, title, category, summary, content_markdown, interactive_component, starter_circuit_json, xp_reward)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, lessons_data)

    # Seed User Progress for default user
    cursor.execute("SELECT COUNT(*) FROM user_progress WHERE user_id = 'user_default'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO user_progress (user_id, lesson_id, completed, mastery_percent) VALUES ('user_default', 'basics', 1, 100.0)")
        cursor.execute("INSERT INTO user_progress (user_id, lesson_id, completed, mastery_percent) VALUES ('user_default', 'qubits', 1, 95.0)")
        cursor.execute("INSERT INTO user_progress (user_id, lesson_id, completed, mastery_percent) VALUES ('user_default', 'superposition', 1, 90.0)")
        cursor.execute("INSERT INTO user_progress (user_id, lesson_id, completed, mastery_percent) VALUES ('user_default', 'measurement', 1, 85.0)")
        cursor.execute("INSERT INTO user_progress (user_id, lesson_id, completed, mastery_percent) VALUES ('user_default', 'gates', 0, 40.0)")

    # 4. Comprehensive Seed Quizzes with KaTeX LaTeX notation and Multi-Level Difficulty
    quiz_data = [
        # --- Basics & Superposition ---
        (
            "q_basics_1", "basics", "superposition",
            "What physical principle enables quantum computers to evaluate a linear combination of all computational basis states simultaneously?",
            "mcq",
            json.dumps(["Quantum Superposition: $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$", "Higher hardware clock frequencies", "Transistor miniaturization", "CMOS binary gates"]),
            0,
            "Quantum Superposition allows a qubit to exist in a linear combination of orthogonal basis states $|0\\rangle$ and $|1\\rangle$ with complex amplitudes $\\alpha, \\beta$.",
            "beginner"
        ),
        (
            "q_superposition_1", "superposition", "superposition",
            "When the Hadamard gate $H = \\frac{1}{\\sqrt{2}}\\begin{bmatrix} 1 & 1 \\\\ 1 & -1 \\end{bmatrix}$ is applied to ground state $|0\\rangle$, what is the resulting state?",
            "mcq",
            json.dumps([
                "$$|0\\rangle$$",
                "$$|1\\rangle$$",
                "$$H|0\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) = |+\\rangle$$",
                "$$H|0\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle) = |-\\rangle$$"
            ]),
            2,
            "Applying the Hadamard gate gives: $$H|0\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) = |+\\rangle$$ with equal 50% probability of measuring either $|0\\rangle$ or $|1\\rangle$.",
            "beginner"
        ),
        (
            "q_superposition_2", "superposition", "superposition",
            "What is the mathematical result of applying the Hadamard gate to state $|1\\rangle$?",
            "mcq",
            json.dumps([
                "$$H|1\\rangle = |+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)$$",
                "$$H|1\\rangle = |-\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle)$$",
                "$$H|1\\rangle = -|1\\rangle$$",
                "$$H|1\\rangle = |0\\rangle$$"
            ]),
            1,
            "Due to matrix multiplication: $$H|1\\rangle = \\frac{1}{\\sqrt{2}}\\begin{bmatrix} 1 & 1 \\\\ 1 & -1 \\end{bmatrix}\\begin{bmatrix} 0 \\\\ 1 \\end{bmatrix} = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle) = |-\\rangle$$.",
            "intermediate"
        ),
        (
            "q_superposition_3", "superposition", "superposition",
            "If a qubit is in state $$|\\psi\\rangle = \\frac{\\sqrt{3}}{2}|0\\rangle - \\frac{1}{2}|1\\rangle$$, what is the exact probability of measuring outcome 1?",
            "mcq",
            json.dumps(["$$\\frac{1}{2} = 50\\%$$", "$$\\left|-\\frac{1}{2}\\right|^2 = \\frac{1}{4} = 25\\%$$", "$$\\frac{3}{4} = 75\\%$$", "$$\\frac{1}{\\sqrt{2}} \\approx 70.7\\%$$"]),
            1,
            "By the Born rule, the probability of measuring outcome 1 is $$P(1) = |\\beta|^2 = \\left|-\\frac{1}{2}\\right|^2 = \\frac{1}{4} = 25\\%$$.",
            "advanced"
        ),

        # --- Quantum Gates ---
        (
            "q_gates_1", "gates", "gates",
            "Applying the Pauli-X gate $$X = \\begin{bmatrix} 0 & 1 \\\\ 1 & 0 \\end{bmatrix}$$ to state $|1\\rangle$ produces which state?",
            "mcq",
            json.dumps(["$$|0\\rangle$$", "$$|1\\rangle$$", "$$-|1\\rangle$$", "$$\\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$$"]),
            0,
            "Pauli-X acts as the quantum NOT gate: $$X|0\\rangle = |1\\rangle$$ and $$X|1\\rangle = |0\\rangle$$.",
            "beginner"
        ),
        (
            "q_gates_2", "gates", "gates",
            "What is the action of the Pauli-Z gate $$Z = \\begin{bmatrix} 1 & 0 \\\\ 0 & -1 \\end{bmatrix}$$ on the superposition state $$|+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)$$?",
            "mcq",
            json.dumps(["$$|+\\rangle$$", "$$|-\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle)$$", "$$|0\\rangle$$", "$$-|+\\rangle$$"]),
            1,
            "Applying Z flips the phase of $|1\\rangle$: $$Z|+\\rangle = \\frac{1}{\\sqrt{2}}(Z|0\\rangle + Z|1\\rangle) = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle) = |-\\rangle$$.",
            "intermediate"
        ),
        (
            "q_gates_3", "gates", "gates",
            "The T-gate is represented by $$T = \\begin{bmatrix} 1 & 0 \\\\ 0 & e^{i\\pi/4} \\end{bmatrix}$$. What is the relationship between the T-gate and the Phase gate $$S = \\begin{bmatrix} 1 & 0 \\\\ 0 & i \\end{bmatrix}$$?",
            "mcq",
            json.dumps(["$$T^2 = S$$", "$$S^2 = T$$", "$$T = S^4$$", "$$T^2 = Z$$"]),
            0,
            "Squaring the diagonal element: $$(e^{i\\pi/4})^2 = e^{i\\pi/2} = i$$. Therefore, $$T^2 = S$$ and $$S^2 = Z$$.",
            "advanced"
        ),

        # --- Bloch Sphere ---
        (
            "q_bloch_1", "qubits", "bloch_sphere",
            "On the standard 3D Bloch sphere parametrization $$|\\psi\\rangle = \\cos\\left(\\frac{\\theta}{2}\\right)|0\\rangle + e^{i\\phi}\\sin\\left(\\frac{\\theta}{2}\\right)|1\\rangle$$, which quantum state resides at the North Pole ($\\theta = 0$)?",
            "mcq",
            json.dumps(["$$|0\\rangle$$", "$$|1\\rangle$$", "$$|+\\rangle$$", "$$|i\\rangle$$"]),
            0,
            "At the North Pole, $\\theta = 0$, giving $\\cos(0) = 1$ and $\\sin(0) = 0$, which yields $$|\\psi\\rangle = |0\\rangle$$.",
            "beginner"
        ),
        (
            "q_bloch_2", "qubits", "bloch_sphere",
            "Which state on the Bloch sphere equator corresponds to angles $\\theta = \\frac{\\pi}{2}$ and $\\phi = \\frac{\\pi}{2}$?",
            "mcq",
            json.dumps([
                "$$|+i\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + i|1\\rangle)$$ along the $+y$ axis",
                "$$|+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)$$ along the $+x$ axis",
                "$$|-\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle)$$ along the $-x$ axis",
                "$$|1\\rangle$$ at the South Pole"
            ]),
            0,
            "For $\\theta = \\pi/2, \\phi = \\pi/2$, $\\cos(\\pi/4) = 1/\\sqrt{2}$ and $e^{i\\pi/2}\\sin(\\pi/4) = i/\\sqrt{2}$, pointing along the $+y$ axis on the equator: $$|+i\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + i|1\\rangle)$$.",
            "intermediate"
        ),
        (
            "q_bloch_3", "qubits", "bloch_sphere",
            "If a qubit is maximally entangled with another qubit (e.g. in Bell pair $$|\\Phi^+\\rangle$$), what is its Bloch vector radius $r = \\sqrt{x^2+y^2+z^2}$ inside its reduced density matrix $\\rho = \\frac{1}{2}(I + \\vec{r}\\cdot\\vec{\\sigma})$?",
            "mcq",
            json.dumps(["$$r = 1$$ (on the surface)", "$$r = 0$$ (at the origin, maximally mixed state)", "$$r = 0.5$$", "$$r = \\sqrt{2}$$"]),
            1,
            "Tracing out one qubit of a Bell pair leaves the other in a maximally mixed state $\\rho = \\frac{1}{2}I$. The Bloch vector has length $r = 0$, located at the center of the sphere.",
            "advanced"
        ),

        # --- Entanglement & Bell States ---
        (
            "q_bell_1", "bell_states", "bell_states",
            "Which two sequential quantum gates construct the canonical Bell state $$|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)$$ from ground state $|00\\rangle$?",
            "mcq",
            json.dumps([
                "Hadamard on $q_0$, followed by CNOT(control=$q_0$, target=$q_1$)",
                "Pauli-X on $q_0$, followed by Hadamard on $q_1$",
                "CNOT(control=$q_0$, target=$q_1$), followed by Hadamard on $q_0$",
                "Hadamard on both $q_0$ and $q_1$"
            ]),
            0,
            "$$|00\\rangle \\xrightarrow{H \\otimes I} \\frac{1}{\\sqrt{2}}(|00\\rangle + |10\\rangle) \\xrightarrow{\\text{CNOT}_{0,1}} \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle) = |\\Phi^+\\rangle$$.",
            "beginner"
        ),
        (
            "q_bell_2", "bell_states", "bell_states",
            "In the Bell state $$|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)$$, if qubit 0 is measured and yields '1', what is the exact probability of qubit 1 yielding '1'?",
            "mcq",
            json.dumps(["0%", "50%", "75%", "100% (Instantaneous state collapse to $|11\\rangle$)"]),
            3,
            "Because $|\\Phi^+\\rangle$ has non-zero amplitude only on $|00\\rangle$ and $|11\\rangle$, observing 1 on qubit 0 instantaneously collapses the composite state to $|11\\rangle$, making outcome 1 on qubit 1 guaranteed (100%).",
            "intermediate"
        ),
        (
            "q_bell_3", "bell_states", "bell_states",
            "According to the CHSH inequality, what is the maximum correlation value achievable by classical local hidden variable theories versus quantum entanglement (Tsirelson's bound)?",
            "mcq",
            json.dumps([
                "Classical $\\le 2$, Quantum $\\le 2\\sqrt{2} \\approx 2.828$",
                "Classical $\\le 1$, Quantum $\\le 2$",
                "Classical $\\le 4$, Quantum $\\le 4$",
                "Classical $\\le 2\\sqrt{2}$, Quantum $\\le 4$"
            ]),
            0,
            "John Bell and the CHSH theorem proved that classical local realism bounds $S \\le 2$, whereas quantum mechanics violates this bound up to Tsirelson's bound $S \\le 2\\sqrt{2} \\approx 2.828$.",
            "advanced"
        ),

        # --- Quantum Algorithms ---
        (
            "q_algorithms_1", "algorithms", "algorithms",
            "What is the theoretical query complexity of Grover's search algorithm for an unsorted database of size $N = 2^n$?",
            "mcq",
            json.dumps(["$$O(N)$$", "$$O(\\log N)$$", "$$O(\\sqrt{N})$$ (Quadratic Speedup)", "$$O(1)$$"]),
            2,
            "Grover's algorithm uses amplitude amplification to locate the target marked item in $O(\\sqrt{N})$ iterations, compared to $O(N)$ for classical search.",
            "beginner"
        ),
        (
            "q_algorithms_2", "algorithms", "algorithms",
            "In the Deutsch-Jozsa algorithm, how many quantum oracle queries are required to determine whether $f: \\{0,1\\}^n \\to \\{0,1\\}$ is constant or balanced?",
            "mcq",
            json.dumps([
                "Exactly 1 quantum query (vs up to $2^{n-1} + 1$ classically)",
                "$2^n$ queries",
                "$n$ queries",
                "$\\sqrt{N}$ queries"
            ]),
            0,
            "Using quantum parallelism and phase kickback, Deutsch-Jozsa solves the problem deterministically with a single oracle evaluation ($O(1)$ vs $O(2^{n-1})$ classical).",
            "intermediate"
        ),
        (
            "q_algorithms_3", "algorithms", "algorithms",
            "In phase kickback, if a controlled-U gate is applied and the target qubit is in an eigenstate $|u\\rangle$ such that $U|u\\rangle = e^{i\\theta}|u\\rangle$, where does the phase shift $e^{i\\theta}$ appear?",
            "mcq",
            json.dumps([
                "It is kicked back to the control qubit: $|1\\rangle \\to e^{i\\theta}|1\\rangle$",
                "It is dissipated into the environment",
                "It remains strictly on the target qubit",
                "It cancels out to zero"
            ]),
            0,
            "Phase kickback transfers the eigenvalue phase $e^{i\\theta}$ from the target state onto the control qubit: $|x\\rangle|u\\rangle \\to (e^{i\\theta})^x |x\\rangle|u\\rangle$.",
            "advanced"
        ),

        # --- Quantum Cryptography & Teleportation ---
        (
            "q_cryptography_1", "cryptography", "cryptography",
            "Why is it mathematically impossible for an eavesdropper (Eve) to secretly clone an arbitrary unknown quantum state in the BB84 protocol?",
            "mcq",
            json.dumps([
                "The No-Cloning Theorem ($U|\\psi\\rangle|0\\rangle = |\\psi\\rangle|\\psi\\rangle$ is impossible for arbitrary states)",
                "Light travels faster than electronic sniffers",
                "Quantum computers only support 0 and 1",
                "Photons absorb fiber optic cladding"
            ]),
            0,
            "Wootters and Zurek (1982) proved that linearity of quantum mechanics forbids unitary cloning of arbitrary non-orthogonal quantum states.",
            "beginner"
        ),
        (
            "q_teleportation_1", "cryptography", "teleportation",
            "To successfully teleport the unknown state of 1 qubit from Alice to Bob, how many classical bits must Alice transmit across a classical channel?",
            "mcq",
            json.dumps(["2 classical bits", "1 classical bit", "Zero classical bits", "4 classical bits"]),
            0,
            "Alice performs a Bell basis measurement on two qubits, yielding two classical measurement bits ($00, 01, 10,$ or $11$) which Bob needs to apply the correct unitary recovery operation ($I, X, Z,$ or $ZX$).",
            "intermediate"
        ),
        (
            "q_cryptography_2", "cryptography", "cryptography",
            "In the BB84 protocol against individual eavesdropping, what is the theoretical threshold for Quantum Bit Error Rate (QBER) above which Alice and Bob must abort?",
            "mcq",
            json.dumps(["$$\\approx 11\\%$$", "$$0\\%$$", "$$50\\%$$", "$$25\\%$$"]),
            0,
            "When QBER exceeds approximately 11%, the information leaked to Eve exceeds the mutual information between Alice and Bob that can be corrected via privacy amplification.",
            "advanced"
        )
    ]
    cursor.executemany("""
    INSERT OR REPLACE INTO quiz_questions (id, lesson_id, topic, question_text, question_type, options_json, correct_index, explanation, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, quiz_data)

    # Seed Challenges
    cursor.execute("SELECT COUNT(*) FROM challenges")
    if cursor.fetchone()[0] == 0:
        challenges_data = [
            (
                "ch_bell", "Construct Bell State |Φ+⟩", "Entanglement", "Easy",
                "Construct the maximally entangled Bell state (|00⟩ + |11⟩)/√2 from initial state |00⟩ using minimal gates.",
                "Resulting state must have probability 0.5 for |00> and 0.5 for |11>.",
                json.dumps([{"type": "H", "target": 0, "control": None}]),
                json.dumps({"target_probs": {"00": 0.5, "11": 0.5}, "max_gates": 2}),
                100
            ),
            (
                "ch_bit_flip", "Invert Qubit Register", "Gates", "Easy",
                "Invert a 2-qubit register from |00⟩ to |11⟩ using single-qubit gates.",
                "Both qubits must be flipped to state 1 with 100% probability.",
                json.dumps([]),
                json.dumps({"target_probs": {"11": 1.0}, "max_gates": 2}),
                80
            ),
            (
                "ch_superposition_all", "Uniform Superposition (2 Qubits)", "Superposition", "Easy",
                "Put 2 qubits into an equal superposition of all 4 states (|00⟩ + |01⟩ + |10⟩ + |11⟩)/2.",
                "Every basis state must have exactly 25% probability.",
                json.dumps([]),
                json.dumps({"target_probs": {"00": 0.25, "01": 0.25, "10": 0.25, "11": 0.25}, "max_gates": 2}),
                100
            ),
            (
                "ch_ghz", "Synthesize GHZ State", "Entanglement", "Medium",
                "Synthesize a 3-qubit GHZ state (|000⟩ + |111⟩)/√2 from |000⟩.",
                "Only |000> and |111> should have non-zero probability (50% each).",
                json.dumps([{"type": "H", "target": 0, "control": None}]),
                json.dumps({"target_probs": {"000": 0.5, "111": 0.5}, "max_gates": 3}),
                150
            ),
            (
                "ch_grover_oracle", "Mark Target in Grover", "Algorithms", "Hard",
                "Build a 2-qubit phase oracle that inverts the phase of state |11⟩ while leaving all other states positive.",
                "Target |11> should have phase -1 (or flipped phase relative to others).",
                json.dumps([{"type": "H", "target": 0, "control": None}, {"type": "H", "target": 1, "control": None}]),
                json.dumps({"target_oracle": "11"}),
                200
            )
        ]
        cursor.executemany("""
        INSERT INTO challenges (id, title, category, difficulty, description, target_description, starter_circuit_json, solution_criteria_json, xp_reward)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, challenges_data)

    # Seed Badges
    cursor.execute("SELECT COUNT(*) FROM badges")
    if cursor.fetchone()[0] == 0:
        badges_data = [
            ("quantum_beginner", "Quantum Beginner", "Completed your very first quantum lesson.", "Sparkles", "Learning"),
            ("circuit_builder", "Circuit Builder", "Constructed and executed a verified quantum circuit.", "Cpu", "Simulator"),
            ("superposition_explorer", "Superposition Explorer", "Created and verified equal superposition on the Bloch sphere.", "Orbit", "Concept"),
            ("entanglement_explorer", "Entanglement Explorer", "Synthesized a maximally entangled Bell state.", "Zap", "Entanglement"),
            ("algorithm_explorer", "Algorithm Explorer", "Successfully ran Grover search or Deutsch-Jozsa algorithm.", "Search", "Algorithms"),
            ("qiskit_coder", "Qiskit Coder", "Completed a quantum coding challenge in Python.", "Code", "Coding"),
            ("quantum_debugger", "Quantum Debugger", "Identified and corrected a circuit configuration anomaly.", "Wrench", "Debugging"),
            ("bb84_defender", "BB84 Defender", "Intercepted an eavesdropper in the BB84 QKD simulation.", "ShieldCheck", "Cryptography"),
            ("teleportation_explorer", "Teleportation Explorer", "Successfully teleported a quantum state across 3 qubits.", "Send", "Labs"),
            ("quantum_architect", "Quantum Architect", "Achieved Level 4 mastery and solved 3 or more advanced challenges.", "Award", "Mastery")
        ]
        cursor.executemany("INSERT INTO badges (id, name, description, icon, category) VALUES (?, ?, ?, ?, ?)", badges_data)

        # Award initial badges to default user
        cursor.execute("INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES ('user_default', 'quantum_beginner')")
        cursor.execute("INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES ('user_default', 'circuit_builder')")
        cursor.execute("INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES ('user_default', 'superposition_explorer')")

    conn.commit()

# Initialize DB on module load
init_db()
