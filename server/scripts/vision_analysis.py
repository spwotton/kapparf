#!/usr/bin/env python3
"""
OpenRouter Vision Analysis — sends key frames to a multimodal LLM
for visual analysis cross-referenced against Master Variable signatures.
"""
import os, sys, json, base64
import urllib.request, urllib.error

FRAMES_DIR  = "client/public/video_forensics/frames"
OUT_PATH    = "server/data/video_forensics/vision_analysis.json"
API_KEY     = os.environ.get("OPENROUTER_API_KEY", "")
HF_KEY      = os.environ.get("HUGGINGFACE_API_KEY", "")

# Models to try in order (vision-capable)
MODELS = [
    "google/gemini-flash-1.5",
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "qwen/qwen2-vl-7b-instruct:free",
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o",
]

# Key frames to analyze (by index, 1-based, at 2fps extraction)
# t=0s(1), t=2.5s(6/peak_lum), t=5.5s(12), t=7.0s(15), t=15s(31/mid), t=23.0s(47), t=23.5s(48), t=30s(61)
KEY_FRAME_INDICES = [1, 6, 12, 15, 31, 47, 48, 61]

SYSTEM_PROMPT = """You are a signal intelligence analyst at KAPPA, a counter-surveillance platform.
You are analyzing frames from a live field recording of a suspected drone or low-altitude surveillance platform observed over a residential balcony in Jacó, Costa Rica.

Your task:
1. Identify any aerial object (drone, aircraft, satellite reflection, or other platform)
2. Describe the lighting characteristics: strobe pattern, color, intensity, pulse shape
3. Estimate altitude and distance if possible
4. Identify any antenna or sensor arrays visible
5. Assess if light pattern matches known signatures: FAA Part 107 (0.5 Hz), DJI Enterprise (1.5 Hz), ISR UAV (3.33 Hz), military TCAS (1 Hz), or anomalous patterns
6. Cross-reference: does anything suggest LIDAR, optical downlink, or modulated illumination?
7. Note any other objects, infrastructure, or environmental details relevant to surveillance assessment.

Be precise, technical, and intelligence-focused. No speculation beyond what is visually evident."""

USER_PROMPT = """These are sequential frames extracted at 2fps from a 30-second field recording taken from a residential balcony at night. A light source consistent with an aerial platform was observed.

Context from technical analysis:
- Sharp luminance transitions detected at t=5.5s, t=6.5s, t=7.0s, and t=23.0-23.5s
- Peak luminance at t=2.5s (mean_excess=+33.4 units)
- AC grid frequency confirmed at 59.971 Hz (Costa Rica 60 Hz grid coupling confirmed)
- One dominant FFT peak cluster: 87-120 Hz harmonics suggesting motorized platform vibration
- No clear strobe frequency established from luminance alone (limited by 2fps extraction rate)

Please analyze the visual content of all attached frames and provide your full intelligence assessment."""

def encode_frame(fname):
    path = os.path.join(FRAMES_DIR, fname)
    with open(path, "rb") as f:
        data = f.read()
    return base64.b64encode(data).decode("utf-8")

def call_openrouter(model, image_b64_list, frame_names):
    content = [{"type": "text", "text": USER_PROMPT}]
    for b64, name in zip(image_b64_list, frame_names):
        t_approx = (int(name.replace("frame_","").replace(".jpg","")) - 1) / 2.0
        content.append({"type": "text", "text": f"[Frame: {name} @ t={t_approx:.1f}s]"})
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
        })

    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": content},
        ],
        "max_tokens": 2000,
        "temperature": 0.1,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Authorization":  f"Bearer {API_KEY}",
            "Content-Type":   "application/json",
            "HTTP-Referer":   "https://kappa.replit.app",
            "X-Title":        "KAPPA SIGINT",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    if not API_KEY:
        print(json.dumps({"error": "OPENROUTER_API_KEY not set"})); return

    all_frames = sorted([f for f in os.listdir(FRAMES_DIR) if f.endswith(".jpg")])
    if not all_frames:
        print(json.dumps({"error": "no frames found"})); return

    # Select key frames (clamp to available)
    selected = []
    for idx in KEY_FRAME_INDICES:
        fname = f"frame_{idx:04d}.jpg"
        if fname in all_frames:
            selected.append(fname)
        elif all_frames:
            # Nearest available
            nearest = min(all_frames, key=lambda f: abs(int(f.replace("frame_","").replace(".jpg","")) - idx))
            if nearest not in selected:
                selected.append(nearest)

    print(f"[VISION] Encoding {len(selected)} key frames", file=sys.stderr)
    encoded = [encode_frame(f) for f in selected]

    result = {"frames_analyzed": selected, "model_used": None, "analysis": None, "error": None}

    for model in MODELS:
        try:
            print(f"[VISION] Trying model: {model}", file=sys.stderr)
            resp = call_openrouter(model, encoded, selected)
            text = resp["choices"][0]["message"]["content"]
            result["model_used"] = model
            result["analysis"]   = text
            result["usage"]      = resp.get("usage", {})
            print(f"[VISION] Success with {model} — {len(text)} chars", file=sys.stderr)
            break
        except Exception as e:
            print(f"[VISION] {model} failed: {e}", file=sys.stderr)
            result["error"] = str(e)
            continue

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(result, f, indent=2)

    print(json.dumps({
        "status": "ok" if result["analysis"] else "failed",
        "model": result["model_used"],
        "chars": len(result["analysis"]) if result["analysis"] else 0,
    }))

if __name__ == "__main__":
    main()
