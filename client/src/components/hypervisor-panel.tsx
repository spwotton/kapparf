import { useQuery } from "@tanstack/react-query";

interface HypervisorState {
  currentProblem: string;
  currentChannel: string;
  channelFreq: number;
  judgeWeights: { novelty: number; resonance: number; coherence: number; depth: number };
  cycleCount: number;
  psiBar: number;
  totalScored: number;
  vectorDbSize: number;
  recent: Array<{ id: string; headline: string; total: number; psi: number; dims: any }>;
  top: Array<{ id: string; headline: string; total: number; psi: number }>;
  constants: { K1: number; DELTA: number; THETA_K: number; ETA_STAR: number };
  dmnClamp: { active: boolean; freqHz: number; drift: number; note: string };
}

export function HypervisorPanel() {
  const { data, isLoading } = useQuery<HypervisorState>({
    queryKey: ["/api/humor-hypervisor/state"],
    refetchInterval: 15_000,
  });

  if (isLoading || !data) {
    return (
      <div className="text-[10px] text-gray-400 text-center font-sans" data-testid="panel-hypervisor-loading">
        loading hypervisor…
      </div>
    );
  }

  const w = data.judgeWeights;
  const dims: Array<[keyof typeof w, string]> = [
    ["novelty", "N"], ["resonance", "R"], ["coherence", "C"], ["depth", "D"],
  ];

  return (
    <div className="select-none" data-testid="panel-hypervisor">
      <div className="text-[9px] font-black tracking-[0.28em] uppercase text-gray-400 mb-2 text-center">
        Hypervisor
      </div>

      {/* Current investigation */}
      <div className="mb-3">
        <div className="text-[8px] font-sans tracking-[0.18em] uppercase text-gray-400">Investigation</div>
        <p className="font-serif italic text-[11px] text-gray-700 leading-snug mt-0.5"
          style={{ fontFamily: "Georgia, serif" }}
          data-testid="text-current-problem">
          "{data.currentProblem.length > 140 ? data.currentProblem.slice(0, 137) + "…" : data.currentProblem}"
        </p>
        <p className="text-[9px] font-sans text-gray-400 mt-1.5 tracking-wide">
          channel · <span className="text-gray-700">{data.currentChannel}</span> @ {data.channelFreq.toFixed(2)} Hz
        </p>
        {data.dmnClamp?.active && (
          <div className="mt-1.5 px-1.5 py-1 bg-gray-900 text-white text-[8px] font-sans tracking-[0.14em] uppercase rounded-sm"
            data-testid="badge-dmn-clamp">
            ⏚ DMN-clamp · PHAISTOS_ROOT 111 Hz
          </div>
        )}
      </div>

      {/* Engine metrics */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-sans text-gray-500 border-t border-gray-200 pt-2 mb-3">
        <div>cycle</div><div className="text-right text-gray-800" data-testid="text-cycle">{data.cycleCount}</div>
        <div>ψ̄</div><div className="text-right text-gray-800" data-testid="text-psi">{data.psiBar.toFixed(3)}</div>
        <div>scored</div><div className="text-right text-gray-800" data-testid="text-scored">{data.totalScored}</div>
        <div>vec.db</div><div className="text-right text-gray-800" data-testid="text-vecdb">{data.vectorDbSize}</div>
      </div>

      {/* Judge weights bars */}
      <div className="border-t border-gray-200 pt-2 mb-3">
        <div className="text-[8px] font-sans tracking-[0.18em] uppercase text-gray-400 mb-1.5">Judge Weights</div>
        <div className="space-y-1">
          {dims.map(([k, label]) => (
            <div key={k} className="flex items-center gap-2" data-testid={`weight-${k}`}>
              <span className="text-[9px] font-sans text-gray-500 w-3">{label}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gray-700 transition-all duration-700"
                  style={{ width: `${Math.round(w[k] * 100)}%` }}
                />
              </div>
              <span className="text-[8px] font-sans text-gray-500 w-6 text-right">{(w[k] * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top exemplar */}
      {data.top[0] && (
        <div className="border-t border-gray-200 pt-2">
          <div className="text-[8px] font-sans tracking-[0.18em] uppercase text-gray-400 mb-1">Top weighed</div>
          <p className="font-serif text-[10px] font-bold text-gray-800 leading-snug line-clamp-3"
            style={{ fontFamily: "Georgia, serif" }}
            data-testid="text-top-headline">
            {data.top[0].headline}
          </p>
          <p className="text-[8px] font-sans text-gray-400 mt-1">
            total {data.top[0].total.toFixed(3)} · ψ {data.top[0].psi.toFixed(3)}
          </p>
        </div>
      )}

      {/* Constants footer */}
      <div className="mt-3 pt-2 border-t border-gray-200 text-[8px] font-sans text-gray-400 leading-relaxed">
        κ₁={data.constants.K1.toFixed(4)} · Δ={data.constants.DELTA} · θ_K={data.constants.THETA_K}°
      </div>
    </div>
  );
}
