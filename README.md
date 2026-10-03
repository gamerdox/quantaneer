# Quantaneer (QuantumLearn AI)
### AI-Based Interactive Quantum Algorithm Learning Platform
**Smart India Hackathon (SIH 2026) • Problem Statement ID: SIH26140**  
**Organization:** Egreen Quanta  
**Theme:** Smart Education  
**Category:** Software  
**Full System Report:** [DETAILED_SYSTEM_REPORT.md](file:///D:/quantaneer/DETAILED_SYSTEM_REPORT.md)  

---

## 🌌 Executive Summary & Core Product Idea
Quantum computing education remains bottlenecked by abstract linear algebra, non-intuitive counter-principles (superposition, entanglement, phase kickback), and lack of accessible real-time hands-on simulation.

**Quantaneer** solves this by enforcing an active learning loop:
$$\text{Learn} \longrightarrow \text{See} \longrightarrow \text{Build} \longrightarrow \text{Simulate} \longrightarrow \text{Understand} \longrightarrow \text{Practice} \longrightarrow \text{Master}$$

Every concept is paired with an interactive mathematical simulator, 3D Bloch sphere projections, real-time quantum statevector transformations, statistical shot sampling, and an intelligent AI Quantum Mentor.

---

## 🎨 Visual Identity: Luxurious Light Mode System
The platform features an ultra-clean, luxurious, high-end light theme designed for prolonged educational sessions without eye fatigue:
* **Base Surfaces:** Pure pearl white (`#ffffff`) and soft ambient slate (`#f8fafc`) with subtle frosted glassmorphism borders (`border-purple-200/80`).
* **Vibrant Accent Colors:**
  * **Neon Purple** (`#7c3aed` / `#6d28d9`): Primary operations, quantum state vectors, active routes.
  * **Luxury Gold** (`#f59e0b` / `#d97706`): Phase gates, rewards, achievements, and warnings.
  * **Emerald Green** (`#10b981` / `#059669`): Pauli-X, measurement confirmations, high fidelity ($>90\%$), success states.
  * **Electric Orange & Cyan** (`#f97316` / `#0284c7`): Entanglement links, CHSH inequality, NISQ noise channels.
* **Mathematical Precision:** Native LaTeX typesetting powered by KaTeX across all lessons, formulas, questions, and hints:
  $$H|0\rangle = \frac{1}{\sqrt{2}}(|0\rangle + |1\rangle) = |+\rangle$$
  $$|\Phi^+\rangle = \frac{1}{\sqrt{2}}(|00\rangle + |11\rangle)$$

---

## 🏛️ Comprehensive Architecture Map

| Architectural Layer | Technology Stack | Core Capabilities |
| :--- | :--- | :--- |
| **Frontend UI / UX** | React 19, TypeScript, Vite 8, Tailwind CSS v4, KaTeX, Canvas Confetti | Luxurious Light Theme, HTML5 Drag-and-Drop, full Undo/Redo stack (`Ctrl+Z` / `Ctrl+Y`), responsive mobile layout |
| **Quantum Engine (Core)** | NumPy & Pure TypeScript Statevector Engine | Exact $2^n$ complex amplitudes, Kronecker tensor products, unitary transformations, projective measurements, shot sampling, partial trace reduced density matrices |
| **3D Visualization Layer** | HTML5 Canvas 3D Orbit Engine | Interactive 3D Bloch sphere with mouse orbital controls, axes $(\hat{x}, \hat{y}, \hat{z})$, spherical coordinates $(\theta, \phi)$, statevector projection arrow, purity $\text{Tr}(\rho^2)$ and multi-qubit partial trace view |
| **Backend API** | Python 3.14, FastAPI, Uvicorn, SQLite | RESTful API endpoints for circuit execution, step mode, OpenQASM 2.0 generation, laboratory simulations, quiz grading, challenge verification, and analytics |
| **Authentication & AuthZ** | PBKDF2-HMAC-SHA256 + PyJWT | Secure user password hashing with per-user salt, JSON Web Tokens, student and instructor role separation, 1-click demo logins |
| **AI Quantum Mentor** | Local Deterministic Quantum Brain + Gemini 2.0 Flash Bridge | Context-aware circuit debugger with Before/After repair analysis, pedagogical hints, and user-configurable Gemini API key support |
| **Laboratories Layer** | Specialized Quantum Labs | BB84 QKD with Eve intercept-resend attack, 3-qubit Quantum Teleportation, Grover Search amplitude amplification, Bell CHSH inequality violation, and NISQ noise emulation |
| **Persistence & Analytics**| Relational SQLite Database | Stores student records, 13 curriculum modules, adaptive quiz question bank, custom saved circuits, interactive roadmap checklist, badges, and instructor telemetry |

---

## ⚡ 8 Primary Sections

### 1. Home (`/`)
* **SIH26140 Positioning:** Official problem statement header and Egreen Quanta theme.
* **Live Interactive Demo:** Real-time circuit builder embedded directly on the landing page with instant statevector calculation.
* **Pedagogical Workflow:** Visual representation of the Learn → Build → Simulate → Master cycle.

### 2. Learn (`/learn`)
* **13 Structured Curriculum Stages:**
  1. Quantum Computing Basics
  2. Qubits and Quantum States
  3. Superposition Principle ($H|0\rangle = |+\rangle$)
  4. Quantum Measurement & Wavefunction Collapse
  5. Single-Qubit Quantum Gates (H, X, Y, Z, S, T)
  6. Quantum Circuit Design & Wire Layouts
  7. Quantum Entanglement & Non-Separability
  8. The Four Bell States ($|\Phi^\pm\rangle, |\Psi^\pm\rangle$)
  9. Quantum Algorithms (Grover & Deutsch-Jozsa)
  10. Quantum Cryptography (BB84 QKD)
  11. NISQ Computing & Noise Models
  12. Quantum Programming with Qiskit
  13. Capstone Project: Custom Quantum Protocol
* **Guided Roadmap Planner:** Interactive checkbox checklist allowing students to track their progress through 15 milestones, persistently saved to the backend database with XP awards.
* **Interactive Features:** Mathematical formulas rendered in KaTeX, inline concept check quizzes, and **"Try in Simulator"** one-click direct transfer.

### 3. Visual Quantum Circuit Simulator (`/simulator`) — Flagship Feature
* **HTML5 Drag-and-Drop:** Intuitive drag-and-drop of gate icons directly onto a rectangular wire window.
* **Dual Accessibility:** Full click-to-place support alongside drag-and-drop for effortless use on smartphones and tablets.
* **Rich Gate Palette:** $H, X, Y, Z, S, T, \text{CNOT}, \text{CZ}, \text{SWAP}, M$ (Measurement), and Barrier.
* **Undo / Redo Stack:** Complete historical state tracking with Undo (`Ctrl+Z`), Redo (`Ctrl+Y`), and Clear actions.
* **Custom Layout Controls:** Dynamically adjust wire depth (4 to 12 steps) and qubit count (1 to 4 qubits).
* **Circuit Persistence:** Save custom circuit designs with custom titles/descriptions to the SQLite database and reload anytime.
* **Real-Time Simulation:** Calculates exact complex amplitudes, state probabilities, and phase angles ($0^\circ$ to $360^\circ$).
* **Statistical Shot Sampling:** Multinomial measurement distributions (512, 1024, 4096 shots).
* **Interactive 3D Bloch Sphere:** Orbital mouse controls, spherical angles $(\theta, \phi)$, coordinates $(x, y, z)$, and multi-qubit partial trace density matrix calculations.
* **OpenQASM 2.0 Export:** Genuine QASM code generation matching placed gates, with preview, copy, and download.
* **Prebuilt Presets:** One-click presets for Superposition, Bit Flip, Bell State, GHZ State, Grover Search, and Teleportation.

### 4. Quantum Labs (`/labs`)
* **BB84 QKD Lab:** Alice random bits and bases, Bob random bases, optional Eve intercept-resend attack toggle, photon transmission animation, sifted key extraction, QBER calculation, and No-Cloning theorem security verdict.
* **Quantum Teleportation Lab:** 3-qubit interactive protocol with 4 step-by-step stages, Bell pair creation, Bell measurement, and classical feed-forward unitary corrections.
* **Grover's Search Lab:** 2-qubit database search with target state selector ($|00\rangle, |01\rangle, |10\rangle, |11\rangle$), phase inversion oracle, diffusion operator (inversion about average), and probability amplification from 25% to 100%.
* **Bell State & CHSH Lab:** 4 Bell states ($|\Phi^+\rangle, |\Phi^-\rangle, |\Psi^+\rangle, |\Psi^-\rangle$), correlation probability matrix, and CHSH inequality violation tester ($|S| = 2.828 > 2.0$).
* **NISQ Noise Benchmark Lab:** Depolarizing noise slider (0% to 20%), circuit depth and gate count metrics, noisy vs. ideal measurement histogram comparison, and quantum state fidelity calculation.

### 5. Practice & Coding (`/practice`)
* **AI Adaptive Quiz:** Dynamically serves questions by topic with increasing difficulty (Beginner $\to$ Intermediate $\to$ Advanced) based on user accuracy, streak counters, and celebratory confetti effects.
* **Circuit Challenges:** Daily challenges (Construct Bell State, Invert Register, Uniform Superposition, GHZ State, Grover Oracle) with real mathematical circuit verification.
* **Qiskit Studio:** Interactive Python code editor with safe syntax parsing, test cases, and simulation output terminal.

### 6. AI Quantum Mentor (`/ai-tutor`)
* **Context-Aware Mentor:** Full live visibility into student's active circuit, current lesson, and quiz performance.
* **Circuit Debugger:** Detects anomalies (e.g. CNOT applied before Hadamard, identical control/target, redundant consecutive self-inverse gates) with **Before vs. After** visual repair comparisons.
* **User-Configurable Gemini API:** Support for live Google Gemini 2.0 Flash via top navigation settings modal, with graceful offline deterministic fallback.

### 7. Progress & Gamification (`/progress`)
* **Metrics:** XP points, Level, Streak days, and overall curriculum completion percentage.
* **Concept Mastery Heatmap:** Identifies weak concepts requiring reinforcement.
* **10 Authentic Badges:** *Quantum Beginner, Circuit Builder, Superposition Explorer, Entanglement Explorer, Algorithm Explorer, Qiskit Coder, Quantum Debugger, BB84 Defender, Teleportation Explorer, Quantum Architect*.
* **Leaderboards:** National and College ranking tables.

### 8. Instructor Dashboard (`/instructor`)
* **Cohort Metrics:** Enrolled learners, active students, average course progress, and class quiz accuracy.
* **Difficulty Heatmap:** Real-time view of concepts where students struggled most in quizzes and challenges.
* **AI Instructor Copilot:** Dedicated copilot providing cohort diagnostic summaries, remedial strategy generators, and interactive queries.
* **Student Roster:** Individual drill-down modal showing student learning path, mastery, and quiz attempt history.

---

## 🔐 Authentication & Demo Credentials

Authentication uses secure PBKDF2-HMAC-SHA256 password hashing with unique per-user salts and JWT tokens. 1-click demo buttons are provided in the login modal:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `aarav.sharma@quantaneer.edu` | `quantum123` |
| **Instructor** | `radhika.sen@iit.edu` | `quantum123` |

New users can also register instantly via the Sign Up tab.

---

## 🚀 Quick Start Guide

### Option 1: Unified Production Server (Recommended)
Double-click `start.bat` (or run `./start.ps1` in PowerShell). This launches the FastAPI server which serves both backend APIs and the pre-built React frontend:
```bash
# Windows Batch
start.bat

# PowerShell
.\start.ps1
```
* **Local Browser:** `http://localhost:8000`
* **Local Wi-Fi / Mobile:** Accessible to any smartphone or iPad on the same Wi-Fi network at `http://<YOUR-PC-IP>:8000`.

### Option 2: Full Development Environment (Hot-Reload)
Double-click `start_dev.bat` to run backend and frontend concurrently with live hot-reloading:
```bash
start_dev.bat
```
* **Frontend Dev:** `http://localhost:5173`
* **Backend API Docs:** `http://localhost:8000/docs`

### Option 3: Universal Public HTTPS Tunnel (Anywhere Access)
To demo on remote devices, mobile 5G, or share with evaluators without port forwarding:
```bash
start_tunnel.bat
```
This generates a secure public HTTPS URL (e.g., `https://xxxx.loca.lt`) forwarded to your local instance.

---

## 🧪 Verification & Automated Test Suite

Quantaneer includes an automated pytest suite covering 30 unit and integration tests across the mathematical quantum engine, Bloch sphere, labs, authentication, and API endpoints:
```bash
cd backend
pytest tests/ -v
```
**Results:** `30 passed in 0.82s (100% pass rate)`
