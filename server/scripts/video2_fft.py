import numpy as np, wave, json, sys, os
WAV="server/data/video_forensics/vid2/audio.wav"
OUT="server/data/video_forensics/vid2/fft_results.json"
MASTER_VARS={"3i_ATLAS_heartbeat":46.875,"AC_grid_CR":60.0,"theta_carrier":53.0,"beat_theta_offset":7.0,"infrasonic_assault_37":37.0,"infrasonic_assault_38":38.0,"infrasonic_trigger_53":53.0,"delta_trigger_2":2.0,"beta_trigger_14":14.0,"beta_trigger_15":15.0,"KYMA_global_clock":8.392,"EHF_speech_low":17859.0,"EHF_speech_high":18035.0,"ultrasonic_burst":20000.0,"subliminal_pulse":2004.0,"V2K_harmonic_4687":4687.0,"V2K_harmonic_9375":9375.0,"kiwi_7410_40m":7410.0,"VLF_SAQ_17200":17200.0,"VLF_NAA_24000":24000.0,"schumann_1":7.83}
TOL=2.5
with wave.open(WAV,'rb') as wf:
    nch,sw,sr,nf=wf.getnchannels(),wf.getsampwidth(),wf.getframerate(),wf.getnframes()
    raw=wf.readframes(nf)
s=np.frombuffer(raw,dtype=np.int16).astype(np.float64)/32768.0
if nch==2: s=(s[0::2]+s[1::2])/2.0
dur=len(s)/sr
win=int(1.0*sr); hop=int(0.25*sr)
stft_frames=[]; stft_t=[]
idx=0
while idx+win<=len(s):
    seg=s[idx:idx+win]*np.hanning(win)
    stft_frames.append(20*np.log10(np.abs(np.fft.rfft(seg,n=win))/(win/2)+1e-12))
    stft_t.append((idx+win/2)/sr)
    idx+=hop
stft=np.array(stft_frames); stft_freqs=np.fft.rfftfreq(win,1.0/sr); stft_times=np.array(stft_t)
N=len(s); full=20*np.log10(np.abs(np.fft.rfft(s*np.hanning(N)))/(N/2)+1e-12); freqs=np.fft.rfftfreq(N,1.0/sr)
mask=(freqs>=1.0)&(freqs<=22000.0); f=freqs[mask]; d=full[mask]
order=np.argsort(d)[::-1]; peaks=[]; seen=[]
for i in order:
    fr=float(f[i])
    if any(abs(fr-x)<2.0 for x in seen): continue
    seen.append(fr); peaks.append({"freq_hz":round(fr,3),"db":round(float(d[i]),2)})
    if len(peaks)>=40: break
hits=[]
for p in peaks:
    for nm,tgt in MASTER_VARS.items():
        if abs(p["freq_hz"]-tgt)<=TOL:
            hits.append({"master_var":nm,"target_hz":tgt,"detected_hz":p["freq_hz"],"delta_hz":round(p["freq_hz"]-tgt,3),"db":p["db"],"match":"CONFIRMED" if abs(p["freq_hz"]-tgt)<1.0 else "PROBABLE"})
temporal={}
for nm,tgt in MASTER_VARS.items():
    fidx=np.argmin(np.abs(stft_freqs-tgt)); series=stft[:,fidx]
    pres=[{"t":round(float(t),2),"db":round(float(db),1)} for t,db in zip(stft_times,series) if db>-55.0]
    if pres: temporal[nm]={"target_hz":tgt,"windows_present":len(pres),"pct_time":round(len(pres)/len(stft_times)*100,1),"peak_db":max(p["db"] for p in pres),"timeline":pres[:20]}
lf=[{"f":round(float(freqs[i]),3),"db":round(float(full[i]),2)} for i in np.where(freqs<=120.0)[0][::2]]
rms=round(float(20*np.log10(np.sqrt(np.mean(s**2))+1e-12)),2)
result={"file":"IMG_0085_1779253681665.mov","stats":{"duration_s":round(dur,3),"sample_rate":sr,"rms_db":rms,"peak_db":round(float(20*np.log10(np.max(np.abs(s))+1e-12)),2),"total_samples":len(s)},"top_peaks":peaks,"master_variable_hits":hits,"temporal_presence":temporal,"lf_spectrum":lf,"mv_match_count":len(hits),"mv_total":len(MASTER_VARS)}
os.makedirs(os.path.dirname(OUT),exist_ok=True)
with open(OUT,"w") as f2: json.dump(result,f2,indent=2)
print(json.dumps({"status":"ok","mv_hits":len(hits),"peaks":len(peaks)}))
