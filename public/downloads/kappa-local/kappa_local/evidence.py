"""
Evidence DB — SQLite-backed, SHA-256 integrity, USB-safe.
"""
import sqlite3
import hashlib
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


DATA_DIR = Path(os.getenv("KAPPA_DATA_DIR", Path(__file__).parent.parent / "data"))
DB_PATH  = DATA_DIR / "evidence.db"


def _sha256(data: str) -> str:
    return hashlib.sha256(data.encode()).hexdigest()


class EvidenceDB:
    def __init__(self, path: Path = DB_PATH):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def _conn(self):
        c = sqlite3.connect(self.path, timeout=10)
        c.row_factory = sqlite3.Row
        return c

    def init(self):
        with self._conn() as c:
            c.executescript("""
                CREATE TABLE IF NOT EXISTS events (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts          TEXT    NOT NULL,
                    epoch_ms    INTEGER NOT NULL,
                    domain      TEXT    NOT NULL,
                    type        TEXT    NOT NULL,
                    severity    TEXT    NOT NULL DEFAULT 'info',
                    description TEXT    NOT NULL,
                    metadata    TEXT,
                    sha256      TEXT    NOT NULL
                );
                CREATE TABLE IF NOT EXISTS ble_devices (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts          TEXT    NOT NULL,
                    address     TEXT    NOT NULL,
                    name        TEXT,
                    rssi        INTEGER,
                    tx_power    INTEGER,
                    uuids       TEXT,
                    connectable INTEGER DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS network_hosts (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts          TEXT    NOT NULL,
                    ip          TEXT    NOT NULL,
                    mac         TEXT,
                    hostname    TEXT,
                    open_ports  TEXT,
                    vendor      TEXT
                );
                CREATE TABLE IF NOT EXISTS llm_analyses (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts          TEXT    NOT NULL,
                    context     TEXT    NOT NULL,
                    prompt      TEXT    NOT NULL,
                    response    TEXT    NOT NULL,
                    model       TEXT    NOT NULL
                );
                CREATE TABLE IF NOT EXISTS kappa_scores (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts          TEXT    NOT NULL,
                    score       REAL    NOT NULL,
                    level       TEXT    NOT NULL,
                    phi_harm    INTEGER NOT NULL DEFAULT 0,
                    domains     TEXT
                );
            """)

    def log_event(self, domain: str, type_: str, description: str,
                  severity: str = "info", metadata: Optional[dict] = None) -> int:
        now = datetime.now(timezone.utc)
        ts  = now.isoformat()
        epoch_ms = int(now.timestamp() * 1000)
        payload  = f"{ts}|{domain}|{type_}|{description}"
        sha = _sha256(payload)
        with self._conn() as c:
            cur = c.execute(
                "INSERT INTO events (ts,epoch_ms,domain,type,severity,description,metadata,sha256) "
                "VALUES (?,?,?,?,?,?,?,?)",
                (ts, epoch_ms, domain, type_, severity, description,
                 json.dumps(metadata) if metadata else None, sha)
            )
            return cur.lastrowid

    def log_ble(self, address: str, name: Optional[str], rssi: int,
                tx_power: Optional[int], uuids: list, connectable: bool):
        ts = datetime.now(timezone.utc).isoformat()
        with self._conn() as c:
            c.execute(
                "INSERT INTO ble_devices (ts,address,name,rssi,tx_power,uuids,connectable) "
                "VALUES (?,?,?,?,?,?,?)",
                (ts, address, name, rssi, tx_power, json.dumps(uuids), int(connectable))
            )

    def log_host(self, ip: str, mac: Optional[str], hostname: Optional[str],
                 open_ports: list, vendor: Optional[str]):
        ts = datetime.now(timezone.utc).isoformat()
        with self._conn() as c:
            c.execute(
                "INSERT INTO network_hosts (ts,ip,mac,hostname,open_ports,vendor) VALUES (?,?,?,?,?,?)",
                (ts, ip, mac, hostname, json.dumps(open_ports), vendor)
            )

    def log_llm(self, context: str, prompt: str, response: str, model: str):
        ts = datetime.now(timezone.utc).isoformat()
        with self._conn() as c:
            c.execute(
                "INSERT INTO llm_analyses (ts,context,prompt,response,model) VALUES (?,?,?,?,?)",
                (ts, context, prompt, response, model)
            )

    def log_kappa(self, score: float, level: str, phi_harm: int = 0, domains: list = None):
        ts = datetime.now(timezone.utc).isoformat()
        with self._conn() as c:
            c.execute(
                "INSERT INTO kappa_scores (ts,score,level,phi_harm,domains) VALUES (?,?,?,?,?)",
                (ts, score, level, phi_harm, json.dumps(domains or []))
            )

    def get_events(self, limit: int = 100, domain: str = None) -> list:
        with self._conn() as c:
            if domain:
                rows = c.execute(
                    "SELECT * FROM events WHERE domain=? ORDER BY epoch_ms DESC LIMIT ?",
                    (domain, limit)
                ).fetchall()
            else:
                rows = c.execute(
                    "SELECT * FROM events ORDER BY epoch_ms DESC LIMIT ?", (limit,)
                ).fetchall()
            return [dict(r) for r in rows]

    def get_ble_devices(self, limit: int = 200) -> list:
        with self._conn() as c:
            rows = c.execute(
                "SELECT * FROM ble_devices ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    def get_network_hosts(self, limit: int = 100) -> list:
        with self._conn() as c:
            rows = c.execute(
                "SELECT * FROM network_hosts ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    def get_analyses(self, limit: int = 20) -> list:
        with self._conn() as c:
            rows = c.execute(
                "SELECT * FROM llm_analyses ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    def get_kappa_history(self, limit: int = 50) -> list:
        with self._conn() as c:
            rows = c.execute(
                "SELECT * FROM kappa_scores ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    def stats(self) -> dict:
        with self._conn() as c:
            return {
                "events":       c.execute("SELECT COUNT(*) FROM events").fetchone()[0],
                "ble_scans":    c.execute("SELECT COUNT(*) FROM ble_devices").fetchone()[0],
                "unique_ble":   c.execute("SELECT COUNT(DISTINCT address) FROM ble_devices").fetchone()[0],
                "net_hosts":    c.execute("SELECT COUNT(*) FROM network_hosts").fetchone()[0],
                "llm_analyses": c.execute("SELECT COUNT(*) FROM llm_analyses").fetchone()[0],
            }
