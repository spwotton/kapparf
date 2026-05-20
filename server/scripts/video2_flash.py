import os,json,sys,numpy as np
FRAMES="client/public/video_forensics/frames2"; OUT="server/data/video_forensics/vid2/flash_analysis.json"; FPS=4.0
def lum(path):
    try:
        with open(path,'rb') as f: data=f.read()
        c=data[len(data)//10:len(data)*9//10]
        return float(np.mean(np.frombuffer(c,dtype=np.uint8).astype(float)))
    except: return 0.0
frames=sorted([f for f in os.listdir(FRAMES) if f.endswith(".jpg")])
luminance=[lum(os.path.join(FRAMES,f)) for f in frames]
timeline=[{"frame":i+1,"t":round(i/FPS,3),"lum":round(l,2),"file":f} for i,(l,f) in enumerate(zip(luminance,frames))]
arr=np.array(luminance); mean=float(np.mean(arr)); std=float(np.std(arr))
thresh=mean+10.0; pulses=[]; in_p=False; si=0
for i,v in enumerate(arr):
    if v>=thresh and not in_p: in_p=True; si=i
    elif v<thresh and in_p:
        in_p=False; pi=int(np.argmax(arr[si:i]))+si
        pulses.append({"t_start":round(si/FPS,3),"t_peak":round(pi/FPS,3),"t_end":round((i-1)/FPS,3),"duration_s":round((i-1-si)/FPS,3),"peak_lum":round(float(arr[pi]),2),"mean_excess":round(float(arr[pi]-mean),2)})
freq_info=None
if len(pulses)>=2:
    ivs=[pulses[i+1]["t_peak"]-pulses[i]["t_peak"] for i in range(len(pulses)-1)]
    mi=float(np.mean(ivs)); fq=1.0/mi if mi>0 else None
    freq_info={"flash_count":len(pulses),"mean_interval_s":round(mi,4),"estimated_freq_hz":round(fq,4) if fq else None,"interval_std":round(float(np.std(ivs)),4),"regularity_pct":round((1-float(np.std(ivs))/mi)*100,1) if mi>0 else 0}
SIGS=[{"name":"FAA Part 107","freq_hz":0.5,"tol":0.15},{"name":"Military TCAS/IFF","freq_hz":1.0,"tol":0.2},{"name":"Starlink Optical","freq_hz":2.0,"tol":0.5},{"name":"DJI Enterprise","freq_hz":1.5,"tol":0.3},{"name":"ISR UAV Beacon","freq_hz":3.33,"tol":0.5},{"name":"Schumann Harm.","freq_hz":7.83,"tol":0.5}]
fhz=freq_info["estimated_freq_hz"] if freq_info else None
matches=[{**s,"detected_hz":round(fhz,4),"delta_hz":round(fhz-s["freq_hz"],4)} for s in SIGS if fhz and abs(fhz-s["freq_hz"])<=s["tol"]]
deltas=np.abs(np.diff(arr)); sharp=[{"t":round(i/FPS,3),"delta":round(float(d),2)} for i,d in enumerate(deltas) if d>float(np.mean(deltas))+2*float(np.std(deltas))]
result={"file":"IMG_0085_1779253681665.mov","fps_analyzed":FPS,"frame_count":len(frames),"duration_s":round(len(frames)/FPS,2),"luminance_stats":{"mean":round(mean,2),"std":round(std,2),"min":round(float(np.min(arr)),2),"max":round(float(np.max(arr)),2),"dynamic_range":round(float(np.max(arr)-np.min(arr)),2)},"flash_pulses":pulses,"flash_frequency":freq_info,"strobe_signature_matches":matches,"sharp_transitions":sharp,"timeline":timeline}
os.makedirs(os.path.dirname(OUT),exist_ok=True)
with open(OUT,"w") as f: json.dump(result,f,indent=2)
print(json.dumps({"status":"ok","pulses":len(pulses),"sig_matches":len(matches),"freq_hz":fhz}))
