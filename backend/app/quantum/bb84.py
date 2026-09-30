"""
Quantaneer BB84 Quantum Key Distribution (QKD) Engine
Simulates the authentic Bennett-Brassard 1984 protocol:
1. Alice prepares random classical bits and random bases (Rectilinear '+' or Diagonal 'x').
2. Eve (optional eavesdropper) intercepts qubits and measures in random bases, altering state if bases mismatch.
3. Bob measures incoming qubits in random bases.
4. Alice and Bob publicly reconcile bases over classical channel (sifting).
5. Sifted key is extracted.
6. A sample subset of the sifted key is compared to calculate Quantum Bit Error Rate (QBER).
7. If QBER > threshold (typically 11%), eavesdropping is detected and key is discarded.
"""

import random
from typing import Dict, Any, List

def simulate_bb84(num_bits: int = 16, enable_eve: bool = False, sample_fraction: float = 0.3) -> Dict[str, Any]:
    if num_bits < 8:
        num_bits = 8
    if num_bits > 128:
        num_bits = 128

    # Bases: '+' = Rectilinear (|0>, |1>), 'x' = Diagonal (|+>, |->)
    BASES = ['+', 'x']

    # 1. Alice generates random bits and random bases
    alice_bits = [random.randint(0, 1) for _ in range(num_bits)]
    alice_bases = [random.choice(BASES) for _ in range(num_bits)]

    # 2. Photons in transit (State preparation)
    # If base is '+', bit 0 -> |0>, bit 1 -> |1>
    # If base is 'x', bit 0 -> |+>, bit 1 -> |->
    transmitted_bits = list(alice_bits)
    transmitted_bases = list(alice_bases)

    eve_interceptions = []
    if enable_eve:
        # Eve performs intercept-resend attack
        eve_bases = [random.choice(BASES) for _ in range(num_bits)]
        eve_measured_bits = []
        for i in range(num_bits):
            if eve_bases[i] == transmitted_bases[i]:
                # Deterministic match
                measured = transmitted_bits[i]
            else:
                # Random collapse: 50% chance 0 or 1
                measured = random.randint(0, 1)
            eve_measured_bits.append(measured)

            # Eve sends newly prepared qubit in HER basis to Bob
            eve_interceptions.append({
                "index": i,
                "eve_basis": eve_bases[i],
                "eve_measured": measured,
                "state_disturbed": eve_bases[i] != transmitted_bases[i]
            })

        # Photons received by Bob are now determined by Eve's measurements
        received_bits = eve_measured_bits
        received_bases = eve_bases
    else:
        received_bits = transmitted_bits
        received_bases = transmitted_bases

    # 3. Bob chooses random measurement bases
    bob_bases = [random.choice(BASES) for _ in range(num_bits)]
    bob_bits = []
    for i in range(num_bits):
        if bob_bases[i] == received_bases[i]:
            bob_bits.append(received_bits[i])
        else:
            # 50% probability of random measurement when basis differs
            bob_bits.append(random.randint(0, 1))

    # 4. Sifting phase: Alice and Bob announce bases publicly
    matching_indices = [i for i in range(num_bits) if alice_bases[i] == bob_bases[i]]
    
    alice_sifted = [alice_bits[i] for i in matching_indices]
    bob_sifted = [bob_bits[i] for i in matching_indices]

    # 5. Error estimation (QBER)
    sifted_len = len(matching_indices)
    sample_size = max(1, int(sifted_len * sample_fraction)) if sifted_len > 2 else 0

    # Pick random indices from sifted key to test QBER
    test_indices = random.sample(range(sifted_len), sample_size) if sifted_len >= 2 else []
    
    errors = 0
    final_alice_key = []
    final_bob_key = []

    for idx in range(sifted_len):
        if idx in test_indices:
            if alice_sifted[idx] != bob_sifted[idx]:
                errors += 1
        else:
            final_alice_key.append(alice_sifted[idx])
            final_bob_key.append(bob_sifted[idx])

    tested_count = len(test_indices)
    qber = (errors / tested_count) if tested_count > 0 else 0.0

    # Security check: theoretical threshold ~11% for BB84 under intercept-resend
    threshold = 0.11
    is_secure = (qber < threshold) if tested_count > 0 else True

    security_verdict = ""
    if not enable_eve:
        if qber == 0.0:
            security_verdict = "Channel Secure: QBER = 0.0%. No eavesdropper detected. Secret key safely established."
        else:
            security_verdict = f"Channel Acceptable: QBER = {round(qber*100, 1)}% (below 11% threshold). Minor environmental noise."
    else:
        if qber >= threshold:
            security_verdict = f"ALERT: Eavesdropping Detected! QBER = {round(qber*100, 1)}% > 11% threshold. Eve's measurements disturbed quantum states due to the No-Cloning Theorem. Key aborted!"
        else:
            security_verdict = f"Suspicious Channel: QBER = {round(qber*100, 1)}%. Eve intercepted photons; key verification recommended."

    # Breakdown table rows for visual animation
    timeline = []
    for i in range(num_bits):
        timeline.append({
            "index": i,
            "alice_bit": alice_bits[i],
            "alice_basis": alice_bases[i],
            "eve_basis": eve_interceptions[i]["eve_basis"] if enable_eve else None,
            "eve_measured": eve_interceptions[i]["eve_measured"] if enable_eve else None,
            "bob_basis": bob_bases[i],
            "bob_bit": bob_bits[i],
            "basis_match": alice_bases[i] == bob_bases[i],
            "sifted": i in matching_indices,
            "discrepancy": (alice_bits[i] != bob_bits[i]) if (alice_bases[i] == bob_bases[i]) else None
        })

    return {
        "num_bits": num_bits,
        "eve_present": enable_eve,
        "alice_bits": alice_bits,
        "alice_bases": alice_bases,
        "bob_bases": bob_bases,
        "bob_bits": bob_bits,
        "matching_indices": matching_indices,
        "sifted_key_length": sifted_len,
        "alice_sifted_key": "".join(map(str, alice_sifted)),
        "bob_sifted_key": "".join(map(str, bob_sifted)),
        "tested_bits_count": tested_count,
        "errors_detected": errors,
        "qber": round(qber, 4),
        "qber_percentage": round(qber * 100, 2),
        "threshold_percentage": 11.0,
        "is_secure": is_secure,
        "security_verdict": security_verdict,
        "final_established_key": "".join(map(str, final_alice_key)) if is_secure else None,
        "timeline": timeline
    }
