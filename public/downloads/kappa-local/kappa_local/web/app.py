"""
KAPPA Local — Flask web dashboard
Serves at http://localhost:7979
"""
import json
import os
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

from kappa_local import llm as llm_mod


def create_app(db):
    app = Flask(__name__, template_folder="templates")
    CORS(app)

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/api/status")
    def status():
        stats  = db.stats()
        scores = db.get_kappa_history(limit=1)
        latest = scores[0] if scores else {}
        return jsonify({
            "kappa_score": latest.get("score", 0),
            "kappa_level": latest.get("level", "NOMINAL"),
            "phi_harm":    latest.get("phi_harm", 0),
            "domains":     json.loads(latest.get("domains", "[]")) if latest.get("domains") else [],
            "stats":       stats,
            "ollama_online": llm_mod.is_available(),
            "model": os.getenv("OLLAMA_MODEL", "llama3.2:3b"),
        })

    @app.route("/api/events")
    def events():
        domain = request.args.get("domain")
        limit  = int(request.args.get("limit", 100))
        return jsonify(db.get_events(limit=limit, domain=domain))

    @app.route("/api/ble")
    def ble():
        return jsonify(db.get_ble_devices(limit=200))

    @app.route("/api/network")
    def network():
        return jsonify(db.get_network_hosts(limit=100))

    @app.route("/api/analyses")
    def analyses():
        return jsonify(db.get_analyses(limit=20))

    @app.route("/api/kappa/history")
    def kappa_history():
        return jsonify(db.get_kappa_history(limit=100))

    @app.route("/api/analyze", methods=["POST"])
    def analyze():
        body    = request.json or {}
        prompt  = body.get("prompt", "Summarize current threat picture.")
        context = body.get("context", "")
        if not llm_mod.is_available():
            return jsonify({"error": "Ollama not running. Start with: ollama serve"}), 503
        response = llm_mod.generate(prompt, context_data=context)
        db.log_llm(context or "manual", prompt, response, os.getenv("OLLAMA_MODEL","llama3.2:3b"))
        return jsonify({"response": response})

    @app.route("/api/log", methods=["POST"])
    def log_event():
        body = request.json or {}
        eid  = db.log_event(
            domain=body.get("domain", "manual"),
            type_=body.get("type", "note"),
            description=body.get("description", ""),
            severity=body.get("severity", "info"),
            metadata=body.get("metadata"),
        )
        return jsonify({"id": eid, "ok": True})

    return app
