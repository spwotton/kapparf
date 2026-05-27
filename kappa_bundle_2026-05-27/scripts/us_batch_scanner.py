# Drone ultrasound batch scanner — usage: python3 us_batch_scanner.py file1.wav file2.flac ...
# Detects tonal bursts in 18-22 kHz band. Writes per-file JSON to ./ultrasound_batch_out/
import os, json, subprocess, tempfile, wave, sys
import numpy as np
def scan(p):
    W=wave.open(p); sr=W.getframerate(); n=W.getnframes()
    if n<sr: return None
    mono=np.frombuffer(W.readframes(n),dtype=np.int16).astype(np.float32)/32768.0
    win=4096; hop=1024; nf=(len(mono)-win)//hop
    sf=np.fft.rfftfreq(win,1/sr); us_m=(sf>=18000)&(sf<min(22000,sr/2))
    if not us_m.any(): return None
    fsub=sf[us_m]
    peak_freq=np.empty(nf); us_rms=np.empty(nf); tonality=np.empty(nf)
    for i in range(nf):
        seg=mono[i*hop:i*hop+win]*np.hanning(win); spec=np.abs(np.fft.rfft(seg))
        us=spec[us_m]; ipk=int(np.argmax(us))
        peak_freq[i]=fsub[ipk]; us_rms[i]=float(np.sqrt(np.mean(us**2)))
        tonality[i]=float(us[ipk]/(np.median(us)+1e-30))
    med=float(np.median(us_rms))
    bi=np.where((tonality>10)&(us_rms>3*med))[0]
    bursts=[{"t":float(i*hop/sr),"f":float(peak_freq[i]),"ton":float(tonality[i]),"amp":float(us_rms[i]/(med+1e-30))} for i in bi]
    near={k:sum(1 for b in bursts if lo<=b["f"]<=hi) for k,(lo,hi) in {
        "18.0":(17900,18100),"18.6":(18400,18900),"19.7":(19500,19900),
        "20.0-21":(20000,21000),"21-22":(21000,22000)}.items()}
    if bursts:
        fs=np.array([b["f"] for b in bursts])
        h,e=np.histogram(fs,bins=np.arange(18000,22001,100))
        tops=np.argsort(h)[::-1][:6]
        clusters=[(int((e[i]+e[i+1])/2),int(h[i])) for i in tops if h[i]>0]
    else: clusters=[]
    return {"sr":sr,"dur":n/sr,"med":med,"max_ton":float(tonality.max()),
            "n_bursts":len(bursts),"near":near,"clusters":clusters,
            "loudest_burst": max(bursts,key=lambda b:b["amp"]) if bursts else None}

os.makedirs("ultrasound_batch_out", exist_ok=True)
for f in sys.argv[1:]:
    if not f.endswith(".wav"):
        tmp=tempfile.NamedTemporaryFile(suffix=".wav",delete=False).name
        subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f,"-ac","1","-ar","48000","-c:a","pcm_s16le",tmp],check=True,timeout=60)
        wav=tmp
    else: wav=f; tmp=None
    r=scan(wav)
    if tmp:
        try: os.remove(tmp)
        except: pass
    print(f"\n=== {os.path.basename(f)} ===")
    print(f"  dur={r['dur']:.1f}s  max_tonality={r['max_ton']:.1f}  total_tonal_bursts={r['n_bursts']}")
    print(f"  bursts by band: {r['near']}")
    print(f"  top freq clusters (Hz, count): {r['clusters']}")
    if r['loudest_burst']:
        lb=r['loudest_burst']
        print(f"  LOUDEST burst: t={lb['t']:.2f}s  f={lb['f']:.0f} Hz  tonality={lb['ton']:.1f}x  amp={lb['amp']:.1f}x median")
    json.dump(r, open(f"ultrasound_batch_out/{os.path.basename(f)}.json","w"), indent=2)
