"""
KAPPA Local — entry point
Boots Flask web UI, background BLE+network scanners, LLM analysis loop.
"""
import os
import sys
import threading
import time
import signal
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from rich.console import Console
from rich.panel import Panel
from rich.text import Text

console = Console()

def banner():
    t = Text()
    t.append("KAPPA LOCAL\n", style="bold cyan")
    t.append("Signal Intelligence Platform — Offline Edition\n", style="yellow")
    t.append("ciajw.com · kapparf.com\n", style="dim")
    console.print(Panel(t, border_style="cyan"))

def main():
    banner()

    from kappa_local.evidence import EvidenceDB
    from kappa_local.web.app import create_app

    db = EvidenceDB()
    db.init()
    console.print("[green][+][/green] Evidence DB ready")

    from kappa_local import ble, network, llm

    ble_thread = threading.Thread(target=ble.scan_loop, args=(db,), daemon=True)
    net_thread = threading.Thread(target=network.scan_loop, args=(db,), daemon=True)
    llm_thread = threading.Thread(target=llm.analysis_loop, args=(db,), daemon=True)

    ble_thread.start()
    console.print("[green][+][/green] BLE scanner started")

    net_thread.start()
    console.print("[green][+][/green] Network scanner started")

    llm_thread.start()
    console.print("[green][+][/green] LLM analysis loop started")

    port = int(os.getenv("KAPPA_WEB_PORT", 7979))
    console.print(f"[green][+][/green] Web UI → [cyan]http://localhost:{port}[/cyan]")
    console.print("[dim]Press Ctrl+C to stop[/dim]\n")

    def handle_exit(sig, frame):
        console.print("\n[yellow][!][/yellow] Shutting down KAPPA Local...")
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    app = create_app(db)
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)


if __name__ == "__main__":
    main()
