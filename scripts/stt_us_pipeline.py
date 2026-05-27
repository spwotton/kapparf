#!/usr/bin/env python3
"""STT + ultrasound band analysis on a WAV/m4a. Real audio only."""
import sys, os, json, wave, subprocess, tempfile
import numpy as np

def to_wav(src, sr=48000):
    if src.lower().endswith(".wav"):
        return src, False
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",src,"-ac","1","-ar",str(sr),"-c:a","pcm_s16le",tmp], check=True)
    return tmp, True

def read_wav(p):
    W=wave.open(p); sr=W.getframerate(); n=W.getnframes(); ch=W.getnchannels()
    raw=np.frombuffer(W.readframes(n), dtype=np.int16).astype(np.float32)/32768.0
    if ch>1: raw=raw.reshape(-1,ch).mean(axis=1)
    return raw, sr

def band_scan(mono, sr):
    F=np.fft.rfft(mono*np.hanning(len(mono))); ff=np.fft.rfftfreq(len(mono),1/sr); mag=np.abs(F)
    total=np.sum(mag**2)+1e-30
    nyq=sr/2
    bands=[("DC-20",0,20),("voice_low(20-200)",20,200),("voice(200-2k)",200,2000),
           ("hi(2k-8k)",2000,8000),("8k-12k",8000,12000),("12k-15k",12000,15000),
           ("nearUS(15k-18k)",15000,18000),("US(18k-22k)",18000,22000),("farUS(22k-24k)",22000,24000)]
    out=[]
    for n,lo,hi in bands:
        if lo>=nyq: continue
        hi=min(hi,nyq)
        m=(ff>=lo)&(ff<hi)
        if not m.any(): continue
        p=float(np.sum(mag[m]**2))
        pk_lin=float(np.max(mag[m])/(np.max(mag)+1e-30))
        out.append({"band":n,"lo":lo,"hi":hi,"pct":100*p/total,"peak_rel_db":20*np.log10(pk_lin+1e-12)})
    return out

def burst_detect_us(mono, sr, lo=18000, hi=22000):
    """Look for transient ultrasonic bursts above the band-noise floor."""
    if sr/2 < lo: return {"available":False,"reason":f"sr={sr} below {lo*2}"}
    win=4096; hop=1024
    nf=(len(mono)-win)//hop
    if nf<10: return {"available":False,"reason":"too short"}
    sf=np.fft.rfftfreq(win,1/sr); m=(sf>=lo)&(sf<min(hi,sr/2))
    energy=np.empty(nf)
    for i in range(nf):
        seg=mono[i*hop:i*hop+win]*np.hanning(win)
        spec=np.abs(np.fft.rfft(seg))
        energy[i]=float(np.sum(spec[m]**2))
    med=float(np.median(energy)); p95=float(np.percentile(energy,95)); mx=float(energy.max())
    t=np.arange(nf)*hop/sr
    spike=energy>5*med
    runs=[]; cur=None
    for i,s in enumerate(spike):
        if s and cur is None: cur=i
        elif not s and cur is not None: runs.append((float(t[cur]),float(t[i-1]))); cur=None
    if cur is not None: runs.append((float(t[cur]),float(t[-1])))
    return {"available":True,"band":[lo,hi],"median":med,"p95":p95,"max":mx,
            "max_t":float(t[np.argmax(energy)]),
            "ratio_max_over_median":mx/(med+1e-30),
            "n_bursts_gt5x":len(runs),"bursts":runs[:20]}

def stt(wav_path, language=None):
    """faster-whisper tiny on CPU. Returns segments."""
    from faster_whisper import WhisperModel
    model = WhisperModel("tiny", device="cpu", compute_type="int8")
    segs, info = model.transcribe(wav_path, language=language, vad_filter=True, beam_size=1)
    out=[]
    for s in segs:
        out.append({"t0":round(s.start,2),"t1":round(s.end,2),"text":s.text.strip()})
    return {"language":info.language,"language_prob":round(info.language_probability,3),
            "duration":round(info.duration,2),"segments":out}

if __name__=="__main__":
    src=sys.argv[1]
    do_stt = "--stt" in sys.argv
    wav, tmp = to_wav(src)
    mono, sr = read_wav(wav)
    dur=len(mono)/sr
    rms=20*np.log10(np.sqrt(np.mean(mono**2))+1e-12)
    pk=20*np.log10(np.max(np.abs(mono))+1e-12)
    print(f"\n=== {os.path.basename(src)} ===  sr={sr}  dur={dur:.2f}s  rms={rms:.1f}dBFS  peak={pk:.1f}dBFS")
    bands=band_scan(mono, sr)
    print("BAND ENERGY:")
    for b in bands:
        print(f"  {b['band']:20s} {b['pct']:7.3f}%   peak={b['peak_rel_db']:+6.2f}dB")
    us=burst_detect_us(mono, sr)
    print(f"\nULTRASOUND BURST SCAN (18-22 kHz): {us}")
    result={"file":src,"sr":sr,"dur":dur,"rms_dbfs":float(rms),"peak_dbfs":float(pk),
            "bands":bands,"ultrasound":us}
    if do_stt:
        try:
            print("\n[STT] running faster-whisper tiny...")
            result["stt"]=stt(wav)
            for s in result["stt"]["segments"][:30]:
                print(f"  [{s['t0']:6.2f}–{s['t1']:6.2f}] {s['text']}")
            print(f"  ({result['stt']['language']} p={result['stt']['language_prob']}, {len(result['stt']['segments'])} segs)")
        except Exception as e:
            result["stt_error"]=str(e); print(f"[STT] ERROR: {e}")
    out=sys.argv[2] if len(sys.argv)>2 and not sys.argv[2].startswith("--") else None
    if out:
        json.dump(result, open(out,"w"), indent=2)
        print(f"saved -> {out}")
    if tmp:
        try: os.remove(wav)
        except: pass
