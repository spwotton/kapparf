import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// ── Constants from Aesthetic Codex ────────────────────────────────────────────
const KAPPA = 4 / Math.PI;
const PHI   = (1 + Math.sqrt(5)) / 2;
const DELTA = 0.02;

// ── Golden Spiral SVG ─────────────────────────────────────────────────────────
function GoldenSpiral({ size = 60 }: { size?: number }) {
  const b = Math.log(PHI) / (Math.PI / 2);
  const a = 0.8;
  const pts: string[] = [];
  for (let i = 0; i <= 240; i++) {
    const theta = i * (Math.PI / 60);
    const r = a * Math.exp(b * theta);
    const x = size / 2 + r * Math.cos(theta);
    const y = size / 2 + r * Math.sin(theta);
    pts.push(i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="text-green-800">
      <path d={pts.join(" ")} stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.6" />
    </svg>
  );
}

// ── κ Score Bar ───────────────────────────────────────────────────────────────
function KappaBar({ score }: { score: number }) {
  const pct = Math.min(100, score * 100);
  const color = score >= 0.55 ? "bg-green-500" : score >= 0.35 ? "bg-amber-400" : "bg-gray-600";
  return (
    <div className="flex items-center gap-2" data-testid="kappa-bar">
      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10px] text-gray-400 w-12 text-right">{score.toFixed(3)}</span>
    </div>
  );
}

// ── φ Density Indicator ───────────────────────────────────────────────────────
function PhiIndicator({ density }: { density: number }) {
  const target = 1 / PHI;
  const deviation = Math.abs(density - target);
  const close = deviation < 0.08;
  return (
    <span className={`font-mono text-[10px] ${close ? "text-green-400" : "text-gray-500"}`}
      title={`target: ${target.toFixed(3)}`}>
      φρ={density.toFixed(3)}{close ? " ✓" : ""}
    </span>
  );
}

// ── Lattice Grid Visualizer ───────────────────────────────────────────────────
function LatticeGrid({ fragments }: { fragments: any[] }) {
  const COLS = 32, ROWS = 12;
  const grid: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

  for (const f of fragments) {
    const col = Math.floor((f.freqBin / 64) * COLS);
    const row = Math.floor((f.timeBin / 144) * ROWS);
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      grid[row][col] = true;
    }
  }

  const detectedSet = new Set(
    fragments.filter(f => f.detected).map(f =>
      `${Math.floor((f.freqBin / 64) * COLS)}:${Math.floor((f.timeBin / 144) * ROWS)}`
    )
  );
  const morseSet = new Set(
    fragments.filter(f => f.patternType === "morse" || f.morseSeq).map(f =>
      `${Math.floor((f.freqBin / 64) * COLS)}:${Math.floor((f.timeBin / 144) * ROWS)}`
    )
  );

  return (
    <div className="border border-gray-800 bg-black p-3" data-testid="lattice-grid">
      <div className="text-[9px] font-mono text-gray-600 mb-1 flex justify-between">
        <span>1 kHz</span>
        <span className="text-gray-700">FREQUENCY (log₂) →</span>
        <span>30 MHz</span>
      </div>
      <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const key = `${col}:${row}`;
            const isMorse = morseSet.has(key);
            const isDetected = detectedSet.has(key);
            const isOccupied = grid[row][col];
            return (
              <div key={key}
                className={`h-[6px] rounded-[1px] transition-colors ${
                  isMorse ? "bg-green-400" :
                  isDetected ? "bg-amber-400" :
                  isOccupied ? "bg-gray-700" : "bg-gray-900"
                }`}
                title={`f-bin:${col*2} t-bin:${row*12}`}
              />
            );
          })
        )}
      </div>
      <div className="flex gap-4 mt-2 text-[8px] font-mono text-gray-600">
        <span><span className="inline-block w-2 h-2 bg-green-400 mr-1" />morse</span>
        <span><span className="inline-block w-2 h-2 bg-amber-400 mr-1" />CW/detected</span>
        <span><span className="inline-block w-2 h-2 bg-gray-700 mr-1" />signal</span>
        <span><span className="inline-block w-2 h-2 bg-gray-900 border border-gray-800 mr-1" />empty</span>
      </div>
    </div>
  );
}

// ── Arrangement Card ──────────────────────────────────────────────────────────
function ArrangementCard({ arr }: { arr: any }) {
  const typeColors: Record<string, string> = {
    morse: "text-green-400 border-green-900",
    cw: "text-amber-400 border-amber-900",
    harmonic: "text-blue-400 border-blue-900",
    tdoa: "text-purple-400 border-purple-900",
    syllable: "text-cyan-400 border-cyan-900",
  };
  const col = typeColors[arr.clusterType] ?? "text-gray-400 border-gray-800";
  const aboveThreshold = arr.kappaScore >= 0.55;

  return (
    <div className={`border ${aboveThreshold ? "border-green-900/60 bg-green-950/20" : "border-gray-800 bg-gray-950"} p-3`}
      data-testid={`arrangement-${arr.id}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${col.split(" ")[0]}`}>
          {arr.clusterType}
        </span>
        <div className="flex items-center gap-2">
          {aboveThreshold && (
            <span className="text-[8px] font-mono text-green-500 bg-green-950 px-1">ABOVE κ-THR</span>
          )}
          {arr.sentToLlm && (
            <span className="text-[8px] font-mono text-blue-400">⊛ synthesized</span>
          )}
          <span className="text-[8px] font-mono text-gray-600">{arr.fragmentCount} frags</span>
        </div>
      </div>
      <KappaBar score={arr.kappaScore} />
      <div className="flex items-center justify-between mt-1">
        <PhiIndicator density={arr.phiDensity} />
        <span className="text-[8px] font-mono text-gray-700">
          {new Date(arr.createdAt).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-[9px] font-mono text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
        {arr.hypothesis}
      </p>
    </div>
  );
}

// ── Finding Card ──────────────────────────────────────────────────────────────
function FindingCard({ f }: { f: any }) {
  const [open, setOpen] = useState(false);
  const confColor = f.confidence >= 0.7 ? "text-green-400" : f.confidence >= 0.4 ? "text-amber-400" : "text-gray-500";

  return (
    <div className="border border-gray-800 bg-gray-950 p-3 cursor-pointer"
      onClick={() => setOpen(o => !o)}
      data-testid={`finding-${f.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono text-gray-600 uppercase">{f.patternType}</span>
            <span className={`text-[9px] font-mono font-bold ${confColor}`}>
              conf={f.confidence?.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] font-mono text-gray-300 leading-snug line-clamp-2">
            {f.hypothesis}
          </p>
        </div>
        <span className="text-gray-700 text-[10px] shrink-0">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-gray-800 pt-3">
          {f.decodedMessage && (
            <div>
              <div className="text-[8px] font-mono text-gray-600 uppercase mb-0.5">Decoded</div>
              <div className="font-mono text-[11px] text-green-300 bg-black px-2 py-1">
                {f.decodedMessage}
              </div>
            </div>
          )}
          {f.morseFragments?.length > 0 && (
            <div>
              <div className="text-[8px] font-mono text-gray-600 uppercase mb-0.5">Morse Fragments</div>
              <div className="flex flex-wrap gap-1">
                {f.morseFragments.map((m: string, i: number) => (
                  <span key={i} className="font-mono text-[9px] bg-gray-900 text-amber-300 px-1 py-0.5">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
          {f.connections?.length > 0 && (
            <div>
              <div className="text-[8px] font-mono text-gray-600 uppercase mb-0.5">Connections</div>
              <div className="flex flex-wrap gap-1">
                {f.connections.map((c: string, i: number) => (
                  <span key={i} className="font-mono text-[8px] bg-gray-900 text-blue-300 px-1">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="text-[8px] font-mono text-gray-700">
            model: {f.model?.split("/").pop()} · {new Date(f.createdAt).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Fragment Row ──────────────────────────────────────────────────────────────
function FragmentRow({ f }: { f: any }) {
  const typeColor: Record<string, string> = {
    morse: "text-green-400", CW: "text-amber-400",
    syllable: "text-cyan-400", tone: "text-blue-400",
    noise: "text-gray-700", vision: "text-purple-400",
  };
  const col = typeColor[f.patternType] ?? "text-gray-500";

  return (
    <div className="grid grid-cols-[80px_80px_60px_60px_1fr] gap-2 py-1 border-b border-gray-900 text-[9px] font-mono"
      data-testid={`fragment-${f.id}`}>
      <span className="text-gray-600 truncate">{f.nodeId}</span>
      <span className="text-gray-500">{f.freqHz > 0 ? `${(f.freqHz/1000).toFixed(1)}kHz` : "speech"}</span>
      <span className={col}>{f.patternType}</span>
      <span className="text-gray-600">{f.snrDb > -50 ? `${f.snrDb?.toFixed(1)}dB` : "—"}</span>
      <span className="text-gray-500 truncate">
        {f.morseSeq
          ? <span className="text-amber-300">{f.morseSeq.slice(0, 30)}</span>
          : f.decodedText
          ? <span className="text-gray-400">"{f.decodedText.slice(0, 40)}"</span>
          : <span className="text-gray-800">{f.simhash}…</span>
        }
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SignalLatticePage() {
  const [tab, setTab] = useState<"lattice" | "arrangements" | "findings" | "fragments">("lattice");

  const { data: status, isLoading } = useQuery<any>({
    queryKey: ["/api/lattice/status"],
    refetchInterval: 15_000,
  });

  const { data: fragments = [] } = useQuery<any[]>({
    queryKey: ["/api/lattice/fragments"],
    refetchInterval: 30_000,
    enabled: tab === "fragments" || tab === "lattice",
  });

  const { data: findings = [] } = useQuery<any[]>({
    queryKey: ["/api/lattice/findings"],
    refetchInterval: 30_000,
    enabled: tab === "findings",
  });

  const cycleMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/lattice/cycle"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lattice/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lattice/fragments"] });
    },
  });

  const arrangements = status?.recentArrangements ?? [];
  const findingList = status?.recentFindings ?? findings;
  const consts = status?.constants ?? { kappa: KAPPA, phi: PHI, delta: DELTA };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-gray-500 font-mono flex items-center justify-center text-[11px]">
        initializing lattice…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono">
      {/* ── Header ── */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-600 tracking-[0.2em] uppercase mb-1">
              KAPPA · Signal Intelligence
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Signal Lattice Hypervisor
            </h1>
            <p className="text-[10px] text-gray-600 mt-0.5 italic">
              "Every peg finds its hole. Every pattern reveals itself through κ-resonance."
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${status?.running ? "bg-green-500 animate-pulse" : "bg-gray-700"}`} />
              <span className="text-[10px] text-gray-500">
                {status?.running ? "HYPERVISOR ONLINE" : "OFFLINE"}
              </span>
            </div>
            <GoldenSpiral size={48} />
          </div>
        </div>

        {/* Constants */}
        <div className="grid grid-cols-5 gap-4 mt-4 py-3 border-t border-gray-900">
          {[
            { label: "κ (Helicity-Lock)", value: consts.kappa?.toFixed(4) ?? "1.2732" },
            { label: "φ (Golden Ratio)", value: consts.phi?.toFixed(4) ?? "1.6180" },
            { label: "Δ (Goose Gap)", value: consts.delta ?? "0.02" },
            { label: "κ-threshold", value: consts.kappaThr?.toFixed(3) ?? "0.550" },
            { label: "φ-density target", value: (1/PHI).toFixed(3) },
          ].map(c => (
            <div key={c.label} data-testid={`const-${c.label}`}>
              <div className="text-[8px] text-gray-700 uppercase tracking-wider">{c.label}</div>
              <div className="text-[14px] font-bold text-green-400">{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-px border-b border-gray-800 bg-gray-800">
        {[
          { label: "Corpus", value: status?.corpusSize ?? 0, testid: "stat-corpus" },
          { label: "Detected", value: status?.detectedFragments ?? 0, testid: "stat-detected" },
          { label: "Morse", value: status?.morseFragments ?? 0, testid: "stat-morse", hi: true },
          { label: "CW", value: status?.cwFragments ?? 0, testid: "stat-cw" },
          { label: "Nodes", value: status?.activeNodes ?? 0, testid: "stat-nodes" },
          { label: "Arrangements", value: status?.arrangementCount ?? 0, testid: "stat-arrangements" },
          { label: "Findings", value: status?.findingCount ?? 0, testid: "stat-findings", hi: true },
        ].map(s => (
          <div key={s.label} className="bg-black px-4 py-3" data-testid={s.testid}>
            <div className="text-[8px] text-gray-700 uppercase tracking-wider">{s.label}</div>
            <div className={`text-xl font-bold ${s.hi ? "text-green-400" : "text-white"}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex border-b border-gray-800 px-6">
        {(["lattice", "arrangements", "findings", "fragments"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            data-testid={`tab-${t}`}
            className={`px-4 py-2.5 text-[10px] uppercase tracking-widest transition-colors ${
              tab === t ? "text-green-400 border-b border-green-400" : "text-gray-600 hover:text-gray-400"
            }`}>
            {t}
            {t === "findings" && findingList.length > 0 && (
              <span className="ml-1 text-[8px] bg-green-900 text-green-400 px-1 rounded-full">
                {findingList.length}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto self-center">
          <button onClick={() => cycleMut.mutate()}
            disabled={cycleMut.isPending}
            data-testid="button-run-cycle"
            className="text-[9px] px-3 py-1.5 border border-gray-700 text-gray-400 hover:border-green-700 hover:text-green-400 transition-colors disabled:opacity-50">
            {cycleMut.isPending ? "running…" : "▶ Run Cycle"}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-6">

        {/* LATTICE TAB */}
        {tab === "lattice" && (
          <div className="space-y-6">
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">
                Frequency × Time Grid — {fragments.length} fragments plotted
              </div>
              <LatticeGrid fragments={fragments} />
            </div>

            {arrangements.length > 0 && (
              <div>
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">
                  Top Clusters (by κ-score)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {arrangements.slice(0, 4).map((a: any) => (
                    <ArrangementCard key={a.id} arr={a} />
                  ))}
                </div>
              </div>
            )}

            {findingList.length > 0 && (
              <div>
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">
                  Latest Findings
                </div>
                <div className="space-y-2">
                  {findingList.slice(0, 3).map((f: any) => (
                    <FindingCard key={f.id} f={f} />
                  ))}
                </div>
              </div>
            )}

            {corpus.size === 0 && arrangements.length === 0 && (
              <div className="text-center py-16 text-gray-700 text-[11px] space-y-2">
                <div className="flex justify-center"><GoldenSpiral size={80} /></div>
                <div>Corpus building… first cycle in ~90s after server start.</div>
                <div className="text-gray-800">
                  κ-threshold: {KAPPA_FIT_THRESHOLD} · φ-density target: {(1/PHI).toFixed(3)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ARRANGEMENTS TAB */}
        {tab === "arrangements" && (
          <div className="space-y-2">
            <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">
              {arrangements.length} arrangements — threshold κ≥0.55 triggers LLM synthesis
            </div>
            {arrangements.length === 0 ? (
              <div className="text-center py-12 text-gray-700 text-[11px]">
                No arrangements yet — corpus still accumulating fragments.
              </div>
            ) : (
              arrangements.map((a: any) => <ArrangementCard key={a.id} arr={a} />)
            )}
          </div>
        )}

        {/* FINDINGS TAB */}
        {tab === "findings" && (
          <div className="space-y-2">
            <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">
              {findingList.length} findings — LLM synthesis of high-κ arrangements
            </div>
            {findingList.length === 0 ? (
              <div className="text-center py-12 text-gray-700 text-[11px]">
                <div>No findings yet — arrangements need κ≥0.55 before LLM synthesis fires.</div>
                <div className="mt-2 text-gray-800">The lattice learns with each cycle.</div>
              </div>
            ) : (
              findingList.map((f: any) => <FindingCard key={f.id} f={f} />)
            )}
          </div>
        )}

        {/* FRAGMENTS TAB */}
        {tab === "fragments" && (
          <div>
            <div className="grid grid-cols-[80px_80px_60px_60px_1fr] gap-2 py-1 border-b border-gray-800 text-[8px] text-gray-700 uppercase tracking-wider mb-1">
              <span>Node</span><span>Freq</span><span>Type</span><span>SNR</span><span>Pattern/Hash</span>
            </div>
            <div className="text-[9px] text-gray-600 mb-2">{fragments.length} fragments (newest first)</div>
            {fragments.length === 0 ? (
              <div className="text-center py-12 text-gray-700 text-[11px]">
                Harvesting from KiwiSDR scanner… check back after first cycle.
              </div>
            ) : (
              fragments.slice(0, 100).map((f: any) => <FragmentRow key={f.id} f={f} />)
            )}
          </div>
        )}

      </div>

      {/* ── Footer ── */}
      <div className="border-t border-gray-900 px-6 py-3 text-[8px] font-mono text-gray-800 flex items-center justify-between">
        <span>κ={KAPPA.toFixed(4)} · φ={PHI.toFixed(4)} · Δ={DELTA} · cycle #{status?.cycleCount ?? 0}</span>
        <span className="italic">Ψ(t) ≡ 1 · every pattern finds its lattice</span>
      </div>
    </div>
  );
}

// Export constant for use in parent component
const KAPPA_FIT_THRESHOLD = 0.55;
