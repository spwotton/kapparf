#!/usr/bin/env python3
"""
Speech-to-text on real captured audio.
Targets the *_speech_band.wav and *_demodulated.wav files in new_audio_evidence/
which are the demodulated/cleaned speech band extracted from the Feb 3, 2026 events.

Uses faster-whisper if available, else openai-whisper.
Outputs: pipeline_results/speech_to_text_<ts>.json
"""
import os, sys, json, glob, time
from pathlib import Path
from datetime import datetime

OUT = Path("pipeline_results"); OUT.mkdir(exist_ok=True)
TS  = datetime.now().strftime("%Y%m%d_%H%M%S")

def main():
    targets = []
    for pattern in [
        "new_audio_evidence/*speech_band.wav",
        "new_audio_evidence/*cleaned.wav",
        "new_audio_evidence/*best_segment.wav",
        "new_audio_evidence/*demodulated.wav",
        "attached_assets/*.wav",
        "server/data/video_forensics/*.wav",
    ]:
        targets.extend(glob.glob(pattern))
    targets = sorted(set(targets))
    print(f"[stt] {len(targets)} candidate audio files")

    try:
        import whisper
    except ImportError:
        print("[stt] whisper not available, aborting")
        return

    print("[stt] loading whisper tiny model...")
    model = whisper.load_model("tiny")
    print("[stt] model loaded")

    results = []
    for i, t in enumerate(targets, 1):
        print(f"  [{i:3d}/{len(targets)}] {os.path.basename(t)}")
        rec = {"file": t}
        try:
            t0 = time.time()
            r = model.transcribe(t, language=None, fp16=False, verbose=False,
                                 condition_on_previous_text=False,
                                 no_speech_threshold=0.4)
            rec["language"] = r.get("language")
            rec["text"] = r.get("text", "").strip()
            rec["segments"] = [
                {"start": round(s["start"], 2), "end": round(s["end"], 2),
                 "text": s["text"].strip(),
                 "no_speech_prob": round(s.get("no_speech_prob", 0.0), 3),
                 "avg_logprob": round(s.get("avg_logprob", 0.0), 3)}
                for s in r.get("segments", [])
            ]
            rec["elapsed_s"] = round(time.time() - t0, 1)
        except Exception as e:
            rec["error"] = str(e)
        results.append(rec)

    out = {"generated_at": datetime.now().isoformat(),
           "model": "whisper-tiny",
           "file_count": len(results),
           "results": results}
    path = OUT / f"speech_to_text_{TS}.json"
    path.write_text(json.dumps(out, indent=2))
    print(f"[stt] wrote {path}")

if __name__ == "__main__":
    main()
