"""
LLM — Ollama integration for local SIGINT analysis.
Runs an analysis loop every 5 minutes using the evidence DB context.
"""
import os
import time
import json
import httpx
from datetime import datetime, timezone
from typing import Optional

OLLAMA_HOST  = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MODEL        = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
EMBED_MODEL  = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
INTERVAL_S   = 300  # 5 minutes


def _post(endpoint: str, payload: dict, timeout: int = 120) -> Optional[dict]:
    try:
        r = httpx.post(f"{OLLAMA_HOST}{endpoint}", json=payload, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[llm] Ollama error: {e}")
        return None


def is_available() -> bool:
    try:
        r = httpx.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
        return r.status_code == 200
    except Exception:
        return False


def generate(prompt: str, system: str = "", context_data: str = "") -> str:
    full_prompt = prompt
    if context_data:
        full_prompt = f"CONTEXT:\n{context_data}\n\nANALYSIS REQUEST:\n{prompt}"

    payload = {
        "model": MODEL,
        "prompt": full_prompt,
        "system": system or SIGINT_SYSTEM_PROMPT,
        "stream": False,
        "options": {"temperature": 0.3, "num_predict": 512}
    }
    result = _post("/api/generate", payload)
    if result:
        return result.get("response", "No response")
    return "[LLM unavailable — ensure Ollama is running: ollama serve]"


def analyze_ble_devices(devices: list) -> str:
    if not devices:
        return "No BLE devices to analyze."
    summary = []
    for d in devices[:20]:
        summary.append(
            f"- Address: {d.get('address','?')}  Name: {d.get('name','N/A')}  "
            f"RSSI: {d.get('rssi','?')}dBm  TX: {d.get('tx_power','?')}dBm  "
            f"Connectable: {d.get('connectable','?')}"
        )
    context = "\n".join(summary)
    prompt = (
        "Analyze these BLE devices from a SIGINT/surveillance perspective. "
        "Flag any devices with elevated TX power (>0 dBm), unusual UUIDs (FCF1, FEA6), "
        "or patterns inconsistent with consumer Bluetooth. "
        "Identify potential surveillance hardware. Be concise and specific."
    )
    return generate(prompt, context_data=context)


def analyze_network(hosts: list, events: list) -> str:
    host_summary = "\n".join(
        f"- IP: {h.get('ip')}  MAC: {h.get('mac','?')}  Ports: {h.get('open_ports','[]')}"
        for h in hosts[:15]
    )
    event_summary = "\n".join(
        f"- [{e.get('severity','?').upper()}] {e.get('domain','?')}: {e.get('description','?')}"
        for e in events[:10]
    )
    context = f"NETWORK HOSTS:\n{host_summary}\n\nRECENT EVENTS:\n{event_summary}"
    prompt = (
        "Analyze this network scan and event log for surveillance indicators. "
        "Look for: unusual open ports (TR-069, unexpected management interfaces), "
        "MAC OUI vendors inconsistent with declared devices, "
        "multi-domain signal correlations. Provide a threat assessment."
    )
    return generate(prompt, context_data=context)


def kappa_score(ble_devices: list, net_hosts: list, events: list) -> tuple[float, str, int]:
    """
    Compute a local κ-score (0–100) from available sensor data.
    Returns (score, level, phi_harmonics).
    """
    score = 0.0
    phi = 0

    # BLE scoring
    elevated_tx = [d for d in ble_devices if (d.get("tx_power") or -999) > 0]
    suspicious_uuids = [d for d in ble_devices
                        if any(u in json.dumps(d.get("uuids", [])) for u in ["FCF1","FEA6","DF00"])]
    score += min(len(elevated_tx) * 8, 30)
    score += min(len(suspicious_uuids) * 6, 20)
    if elevated_tx:
        phi += len(elevated_tx)

    # Network scoring
    management_ports = [80, 443, 8080, 7547, 8443, 8291, 22]
    for h in net_hosts:
        try:
            ports = json.loads(h.get("open_ports", "[]"))
            tr069 = 7547 in ports
            if tr069:
                score += 15
                phi += 2
            score += min(len(ports) * 1.5, 10)
        except Exception:
            pass

    # Event severity scoring
    sev_map = {"critical": 10, "high": 5, "medium": 2, "info": 0}
    for e in events[-20:]:
        score += sev_map.get(e.get("severity", "info"), 0)

    score = min(score, 100)
    phi = min(phi, 16)

    if score >= 90:
        level = "EMERGENCY"
    elif score >= 70:
        level = "CRITICAL"
    elif score >= 50:
        level = "HIGH"
    elif score >= 30:
        level = "ELEVATED"
    elif score >= 10:
        level = "NOMINAL"
    else:
        level = "NOMINAL"

    return round(score, 2), level, phi


SIGINT_SYSTEM_PROMPT = """You are a signals intelligence (SIGINT) analyst assistant embedded in KAPPA Local,
a portable signal intelligence platform operated by Samuel Wotton in Jacó Beach, Costa Rica.
The platform documents a multi-vector surveillance operation against the operator.
Working hypothesis: cartel-connected, state-adjacent, or NSA/CIA-affiliated operation.
Analyze data factually and concisely. Do not dismiss anomalies. Flag surveillance indicators clearly.
Keep responses under 400 words unless asked for detail."""


def analysis_loop(db):
    """Background loop: pulls recent data, runs LLM analysis every INTERVAL_S seconds."""
    time.sleep(30)  # give scanners time to collect initial data
    while True:
        try:
            if not is_available():
                time.sleep(60)
                continue

            ble   = db.get_ble_devices(limit=50)
            hosts = db.get_network_hosts(limit=20)
            events = db.get_events(limit=30)

            # Compute kappa score
            score, level, phi = kappa_score(ble, hosts, events)
            db.log_kappa(score, level, phi, domains=["ble","network"])
            db.log_event("kappa", "score", f"κ={score} {level} φ-harm={phi}",
                         severity="critical" if score >= 70 else "info")

            # BLE analysis if devices present
            if ble:
                resp = analyze_ble_devices(ble)
                db.log_llm("ble_devices", "Analyze BLE for surveillance indicators", resp, MODEL)
                db.log_event("llm", "ble_analysis", resp[:300], severity="info")

            # Full analysis every other cycle
            if hosts or events:
                resp = analyze_network(hosts, events)
                db.log_llm("network+events", "Network and event threat assessment", resp, MODEL)
                db.log_event("llm", "network_analysis", resp[:300], severity="info")

        except Exception as e:
            db.log_event("llm", "error", str(e), severity="info")

        time.sleep(INTERVAL_S)
