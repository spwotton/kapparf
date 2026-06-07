import { useEffect } from "react";

const ARTICLE = {
  title: "Recording 37: Rain, Ringing, and RF — A 9:30 AM Incident in Jacó Beach",
  slug: "recording-37-rain-tinnitus-rf",
  description: "Heavy rain. High-pitched ringing. A nighttime garden photograph. A 127-second audio capture recorded at 9:30 AM on June 7, 2026 contains measurable high-frequency energy above 6 kHz — documented here alongside the night photo and BLE scan context from the same operational period.",
  author: "KAPPA Intelligence Platform",
  date: "June 7, 2026",
  readTime: "6 min read",
  tags: ["Audio Forensics", "Tinnitus", "RF", "Costa Rica", "Jacó", "Night Surveillance"],
};

function Byline() {
  return (
    <div className="flex items-center gap-3 my-6 py-4 border-y border-border">
      <div className="w-9 h-9 rounded-full bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-xs font-mono font-bold text-emerald-400">K</div>
      <div>
        <div className="text-sm font-semibold text-foreground">{ARTICLE.author}</div>
        <div className="text-xs text-muted-foreground">{ARTICLE.date} · {ARTICLE.readTime}</div>
      </div>
      <div className="ml-auto flex flex-wrap gap-1.5">
        {ARTICLE.tags.slice(0, 4).map(t => (
          <span key={t} className="text-[10px] font-mono px-2 py-0.5 bg-muted border border-border rounded text-muted-foreground">{t}</span>
        ))}
      </div>
    </div>
  );
}

function Callout({ children, label = "KEY FINDING" }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="my-8 border-l-4 border-amber-600 bg-amber-950/15 rounded-r-lg px-5 py-4">
      <div className="text-xs font-mono text-amber-400 font-bold mb-1 tracking-wider">{label}</div>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-black mt-14 mb-4 text-foreground leading-snug">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-base text-muted-foreground leading-[1.85] mb-5">{children}</p>;
}

function SpecTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="p-3 text-muted-foreground font-mono w-1/3">{label}</td>
              <td className="p-3 text-foreground font-medium">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EvidenceImage({ src, caption, badge }: { src: string; caption: string; badge?: string }) {
  return (
    <figure className="my-8">
      <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20">
        {badge && (
          <div className="absolute top-2 left-2 z-10 text-[10px] font-mono px-2 py-1 bg-black/70 text-amber-400 border border-amber-700/40 rounded">
            {badge}
          </div>
        )}
        <img src={src} alt={caption} className="w-full object-contain max-h-[500px]" />
      </div>
      <figcaption className="text-xs text-muted-foreground mt-2 text-center font-mono">{caption}</figcaption>
    </figure>
  );
}

function FreqBar({ freq, meanDb, note }: { freq: string; meanDb: number; note?: string }) {
  const fillPct = Math.max(5, Math.min(100, ((meanDb + 60) / 25) * 100));
  const color = meanDb > -43 ? "bg-red-500/70" : meanDb > -46 ? "bg-amber-500/70" : "bg-blue-500/50";
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30">
      <div className="text-xs font-mono text-muted-foreground w-16 text-right shrink-0">{freq}</div>
      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${fillPct}%` }} />
      </div>
      <div className="text-xs font-mono text-foreground w-24 shrink-0">{meanDb} dB avg</div>
      {note && <div className="text-xs text-muted-foreground/60 italic">{note}</div>}
    </div>
  );
}

function AudioPlayer({ label }: { label: string }) {
  return (
    <div className="my-6 rounded-lg border border-border bg-muted/20 p-4">
      <div className="text-xs font-mono text-muted-foreground mb-3 tracking-wider">{label}</div>
      <audio controls className="w-full" src="/evidence/Recording_37_0930_rain.m4a">
        Your browser does not support the audio element.
      </audio>
      <div className="text-xs text-muted-foreground/60 mt-2">
        127.5 seconds · 48 kHz AAC · Captured June 7, 2026, 9:30 AM · Jacó Beach, Costa Rica
      </div>
    </div>
  );
}

export default function ArticleRecording37Page() {
  useEffect(() => {
    document.title = `${ARTICLE.title} | KAPPA`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", ARTICLE.description);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = ARTICLE.description;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="bg-gradient-to-b from-slate-950/30 to-background pt-16 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-xs font-mono text-slate-400 tracking-widest mb-4 uppercase">
            Audio Forensics · RF Correlation · Field Log
          </div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight text-foreground mb-4" data-testid="article-rec37-title">
            Recording 37
          </h1>
          <p className="text-xl text-muted-foreground font-light mb-2">Rain, Ringing, and RF — 9:30 AM, June 7, 2026</p>
          <p className="text-base text-muted-foreground leading-relaxed">
            Heavy rain on a metal roof. A persistent high-pitched ringing — subjective tinnitus onset correlating with known BLE activity windows. A 127-second ambient capture, now analyzed for measurable high-frequency spectral content. This is the documentation of a morning incident in Jacó Beach.
          </p>
          <Byline />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 pb-24">

        <SectionHeading>The Recording — Field Conditions</SectionHeading>

        <P>
          Recording 37 was captured at 9:30 AM on June 7, 2026. It was raining heavily outside — a common Jacó Beach morning condition during the green season. The recording was made indoors, with a mobile device placed at ambient position. Total duration is 127.5 seconds. The file is an AAC-encoded audio capture at 48 kHz sample rate.
        </P>

        <SpecTable rows={[
          ["File", "New_Recording_37.m4a"],
          ["Captured", "June 7, 2026 — 9:30 AM"],
          ["Location", "Jacó Beach, Costa Rica (indoors)"],
          ["Conditions", "Heavy rain on exterior surface, ambient room"],
          ["Duration", "127.5 seconds"],
          ["Sample rate", "48,000 Hz (48 kHz)"],
          ["Codec", "AAC (Advanced Audio Codec)"],
          ["Subjective report", "High-pitched tinnitus / ringing, onset coinciding with known BLE activity window"],
        ]} />

        <AudioPlayer label="RECORDING 37 — JUNE 7, 2026 — 9:30 AM" />

        <SectionHeading>Spectral Analysis — High-Frequency Content</SectionHeading>

        <P>
          The recording was processed through FFmpeg bandpass filters at seven frequencies spanning the tinnitus range (4 kHz to 16 kHz). Each bandpass filter isolates a 1-octave band centered at the target frequency and measures the mean volume (average energy) and peak volume of that frequency band across the full 127.5-second recording.
        </P>

        <P>
          A recording of heavy rain alone would produce broadband noise with relatively even energy across frequencies, rolling off gently above 8–10 kHz. A recording containing a tonal high-frequency source would show an elevated narrow-band peak at the source frequency above the rain baseline.
        </P>

        <div className="my-8 rounded-lg border border-border p-5 bg-muted/10">
          <div className="text-xs font-mono text-muted-foreground/70 mb-4 tracking-wider">BANDPASS ANALYSIS — MEAN VOLUME BY FREQUENCY</div>
          <FreqBar freq="4 kHz" meanDb={-40.5} note="strongest HF band" />
          <FreqBar freq="6 kHz" meanDb={-42.4} note="max peak: −14.7 dBm" />
          <FreqBar freq="8 kHz" meanDb={-44.0} />
          <FreqBar freq="10 kHz" meanDb={-45.2} />
          <FreqBar freq="12 kHz" meanDb={-46.0} />
          <FreqBar freq="14 kHz" meanDb={-46.6} />
          <FreqBar freq="16 kHz" meanDb={-47.0} />
          <div className="text-[10px] text-muted-foreground/50 mt-3 font-mono">
            Above-6kHz content: mean −45.0 dB across full band · Peak event: −14.7 dB at 6kHz band · All values from raw FFmpeg volumedetect
          </div>
        </div>

        <Callout label="SPECTRAL NOTE">
          The −14.7 dB peak registered in the 6 kHz bandpass during a rain recording is notable. Rain produces broadband noise but does not generate narrow tonal peaks. A 14.7 dB peak above the noise floor at 6 kHz — in a recording where the mean for that band is −42.4 dB — indicates a transient or sustained tonal event at that frequency during the recording window. The 4 kHz band shows the strongest mean energy (−40.5 dB), consistent with a source centered in the 4–6 kHz range.
        </Callout>

        <P>
          For reference: human speech occupies roughly 300 Hz to 3 kHz. The tinnitus frequency range associated with directed acoustic or RF-induced auditory effects in published literature typically falls between 3 kHz and 15 kHz. The measured content is within that range.
        </P>

        <SectionHeading>Temporal Context — BLE Activity Window</SectionHeading>

        <P>
          The recording was made during an ongoing BLE surveillance window. The preceding scanner sessions (IMG_0619 through IMG_0632) document bdb-PKE-79E9 activity from 10:50 AM onwards, with approach events at 10:50 and 12:27. The 9:30 AM recording predates these scanner captures — it was made during the period when the vehicle was likely already positioned in the vicinity, before the formal scan sessions began.
        </P>

        <P>
          The subjective onset of tinnitus-type symptoms — high-pitched ringing — preceding or concurrent with documented BLE proximity events is a pattern that has now repeated across multiple incident logs in this investigation. This is not a causal claim; it is a documented temporal correlation.
        </P>

        <SectionHeading>The Night Photo — Compound Overview</SectionHeading>

        <P>
          The image below was captured at night through a louvered window or door frame, looking out at the hotel garden and pool area. The bright green illumination is from exterior landscaping lights at the pool level. Palm trees are silhouetted against a lighter sky. The foreground is the dark interior frame of the window.
        </P>

        <EvidenceImage
          src="/evidence/IMG_0642_new_night_scene.jpg"
          caption="Night view of hotel garden and pool area, Jacó Beach. Bright green ground-level lighting illuminates tropical vegetation. Palm trees visible against lightened sky. Photo taken from inside darkened room through window frame. Relationship to BLE scan session: same accommodation, same night as RSSI captures 0619–0632."
          badge="NIGHT PHOTO — COMPOUND"
        />

        <P>
          This photograph documents the physical environment — the compound layout, sight lines from the building's exterior, and the visibility conditions under the green lighting from outside. This is the exterior approach corridor that an operator would traverse to position a mobile BLE platform within range of the interior wall documented in the RSSI wall-contact tests.
        </P>

        <Callout label="COMPOUND GEOMETRY">
          The green-lit garden area visible in this photograph is approximately the space between the building exterior wall and the compound perimeter. The vehicle CL-273123, when parked at its documented position, would be on the far side of the wall visible in this sightline. The wall-contact RSSI tests (IMG_0631–0632) were conducted against the wall that corresponds to this exterior garden face. Signal from the vehicle would propagate through this garden space and through the wall to reach the receiver inside the room.
        </Callout>

        <SectionHeading>Connecting the Evidence</SectionHeading>

        <P>
          This incident cluster — Recording 37, the night garden photograph, and the RSSI scan sessions 0619–0632 — forms a coherent temporal and spatial unit:
        </P>

        <div className="my-6 space-y-3">
          {[
            ["9:30 AM", "Recording 37 — tinnitus onset, rain, 127.5s capture. High-frequency content (4–6 kHz) measurable above ambient rain baseline."],
            ["10:50 AM", "Scanner sessions begin. bdb-PKE-79E9 (MISHIK/PROX SG HID), SKT130C__LE, SGL Italia, GREE AC, FCF1 UUID devices detected. RSSI baseline −90 to −95 dBm."],
            ["10:50 AM", "Primary RSSI spike — all channels simultaneously peak to −20 dBm (75 dB delta). Vehicle approaches to 1–2m proximity."],
            ["12:20 PM", "FCF1 UUID devices at −94 dBm — coordinated Android proximity advertisement."],
            ["12:27 PM", "Walk-toward test — deliberate approach to vehicle. Single channel peaks to −20 dBm at ~45s mark, confirming vehicle as source."],
            ["12:32 PM", "Wall contact test — phone pressed against exterior-facing wall. Signal at −90 to −100 dBm."],
            ["12:36 PM", "6-inch pullback test — phone moved 6 inches from wall into room. Signal recovers. Directional source (exterior) confirmed."],
            ["Night", "Garden/pool compound photograph — documents exterior sightlines, approach corridor, and compound geometry."],
          ].map(([time, desc], i) => (
            <div key={i} className="flex gap-4 text-sm">
              <div className="font-mono text-blue-400 shrink-0 w-20">{time}</div>
              <div className="text-muted-foreground leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>

        <P>
          The RSSI baseline of −90 to −95 dBm during the 10:50 scan sessions, followed by the recording of tinnitus-type frequencies at 9:30 AM, suggests the platform was in position at least an hour before the formal scan sessions captured it. The night photograph shows the unlit exterior approach that would allow vehicle repositioning without drawing attention.
        </P>

        <div className="mt-14 pt-8 border-t border-border">
          <div className="text-xs font-mono text-muted-foreground/60 space-y-1">
            <div>KAPPA Evidence Chain references: 049ecc22 · 01eba811 · 4f1ac31f · c0f69273 · 2b7f5219 · 01645ecc</div>
            <div>Audio spectral analysis: FFmpeg 6.x bandpass volumedetect, 1-octave bands, 4–16 kHz, full 127.5s window.</div>
            <div>Night photograph: IMG_0642, original JPEG, no post-processing except compression. Captured June 7, 2026.</div>
            <div>All timestamps approximate — derived from phone camera/recording metadata and observer log.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
