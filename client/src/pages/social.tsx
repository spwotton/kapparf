import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { THREAT_LEVELS, type KappaStatus, type SignalEvent, type Correlation } from "@shared/schema";
import {
  Download,
  Image,
  Square,
  RectangleVertical,
  Smartphone,
  Satellite,
  Activity,
  Shield,
  Clock,
  Eye,
  Radio,
  Zap,
  Grid3x3,
  LayoutGrid,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Atom,
  Languages,
  CircuitBoard,
  Binary,
  Bug,
  BookOpen,
  Dog,
  FlaskConical,
  Hexagon,
  Bird,
} from "lucide-react";
import { toPng } from "html-to-image";

type CardFormat = "square" | "portrait" | "story";
type CardTemplate = "kappa" | "satellite" | "correlation" | "domains" | "evening" | "quantum_ghz" | "quantum_sonnet" | "quantum_apocalypse" | "quantum_bell" | "paper_002" | "paper_hall" | "goose_protocol" | "demodex" | "trilingual" | "canine_genome" | "jaco_blush" | "jaco_environment" | "jaco_deniability";

interface SocialCardData {
  kappa: KappaStatus | null;
  totalEvents: number;
  totalCorrelations: number;
  domainCounts: Record<string, number>;
  recentCorrelations: Correlation[];
  recentEvents: SignalEvent[];
  satelliteCount: number;
  visibleSatellites: number;
  overheadSatellites: number;
  generatedAt: string;
}

const FORMAT_DIMENSIONS: Record<CardFormat, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: "1080 × 1080" },
  portrait: { w: 1080, h: 1350, label: "1080 × 1350" },
  story: { w: 1080, h: 1920, label: "1080 × 1920" },
};

const PREVIEW_SCALE = 0.3;

function getThreatLabel(score: number): string {
  for (let i = THREAT_LEVELS.length - 1; i >= 0; i--) {
    if (score >= THREAT_LEVELS[i].minScore) return THREAT_LEVELS[i].level;
  }
  return THREAT_LEVELS[0].level;
}

function getThreatColor(score: number): string {
  for (let i = THREAT_LEVELS.length - 1; i >= 0; i--) {
    if (score >= THREAT_LEVELS[i].minScore) return THREAT_LEVELS[i].color;
  }
  return THREAT_LEVELS[0].color;
}

function formatTimestamp(ts: string | number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Costa_Rica",
  });
}

function KappaScoreCard({ data, format }: { data: SocialCardData; format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const score = data.kappa?.score ?? 0;
  const threat = getThreatLabel(score);
  const color = getThreatColor(score);
  const isEvening = data.kappa?.eveningWindow?.active ?? false;

  return (
    <div
      style={{ width: dim.w, height: dim.h }}
      className="relative overflow-hidden flex flex-col"
      data-testid="social-card-kappa"
    >
      <div className="absolute inset-0 bg-[#141210]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "24px 24px" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[40px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[#e8e4de] font-mono text-[28px] tracking-[0.15em] font-semibold">KAPPA</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[20px]">SIGINT PLATFORM</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[48px]">
            <div className="text-[180px] font-mono font-bold leading-none" style={{ color }}>{score.toFixed(0)}</div>
            <div className="text-[32px] font-mono tracking-[0.3em] mt-[16px]" style={{ color }}>{threat}</div>
          </div>

          <div className="w-full max-w-[700px] grid grid-cols-3 gap-[32px] text-center">
            <div>
              <div className="text-[48px] font-mono font-semibold text-[#e8e4de]">{data.totalEvents}</div>
              <div className="text-[18px] text-[#7a746a] font-mono tracking-wider mt-[4px]">EVENTS</div>
            </div>
            <div>
              <div className="text-[48px] font-mono font-semibold text-[#e8e4de]">{data.totalCorrelations}</div>
              <div className="text-[18px] text-[#7a746a] font-mono tracking-wider mt-[4px]">CORRELATIONS</div>
            </div>
            <div>
              <div className="text-[48px] font-mono font-semibold text-[#e8e4de]">{data.satelliteCount}</div>
              <div className="text-[18px] text-[#7a746a] font-mono tracking-wider mt-[4px]">SATELLITES</div>
            </div>
          </div>
        </div>

        {isEvening && (
          <div className="flex items-center gap-[12px] mb-[24px]">
            <Eye className="text-amber-500" style={{ width: 24, height: 24 }} />
            <span className="text-amber-500 font-mono text-[20px] tracking-wider">EVENING WINDOW ACTIVE</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">10.0514°N 84.2187°W</span>
          <span className="text-[#5a5550] font-mono text-[16px]">{formatTimestamp(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function SatelliteCard({ data, format }: { data: SocialCardData; format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];

  return (
    <div
      style={{ width: dim.w, height: dim.h }}
      className="relative overflow-hidden flex flex-col"
      data-testid="social-card-satellite"
    >
      <div className="absolute inset-0 bg-[#141210]" />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "conic-gradient(from 0deg at 50% 50%, rgba(168,130,255,0.1) 0deg, transparent 60deg, rgba(168,130,255,0.05) 120deg, transparent 180deg, rgba(168,130,255,0.1) 240deg, transparent 300deg, rgba(168,130,255,0.05) 360deg)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[40px]">
          <div className="flex items-center gap-[16px]">
            <Satellite style={{ width: 28, height: 28, color: "#a882ff" }} />
            <span className="text-[#e8e4de] font-mono text-[28px] tracking-[0.15em] font-semibold">ORBITAL INTEL</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[20px]">KAPPA</span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-[48px] mb-[56px]">
            <div className="text-center">
              <div className="text-[120px] font-mono font-bold text-[#a882ff] leading-none">{data.satelliteCount}</div>
              <div className="text-[22px] text-[#7a746a] font-mono tracking-wider mt-[12px]">TRACKED</div>
            </div>
            <div className="text-center">
              <div className="text-[120px] font-mono font-bold text-[#e8e4de] leading-none">{data.visibleSatellites}</div>
              <div className="text-[22px] text-[#7a746a] font-mono tracking-wider mt-[12px]">VISIBLE (&gt;30°)</div>
            </div>
          </div>

          <div className="bg-[#1c1a17] rounded-[16px] p-[40px] border border-[#2a2622]">
            <div className="flex items-center gap-[12px] mb-[24px]">
              <div className="w-[8px] h-[8px] rounded-full bg-purple-500" />
              <span className="text-[#e8e4de] font-mono text-[20px]">OVERHEAD (&gt;75° elevation)</span>
            </div>
            <div className="text-[72px] font-mono font-bold text-purple-400 leading-none">{data.overheadSatellites}</div>
          </div>

          {format !== "square" && (
            <div className="mt-[48px] bg-[#1c1a17] rounded-[16px] p-[40px] border border-[#2a2622]">
              <div className="flex items-center gap-[12px] mb-[16px]">
                <span className="text-[#e8e4de] font-mono text-[20px]">SIGINT CATEGORIES</span>
              </div>
              <div className="text-[#7a746a] font-mono text-[18px] leading-relaxed">
                CelesTrak TLE-based tracking from Tacacorí observer point. All satellite positions computed from real orbital elements.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">10.0514°N 84.2187°W</span>
          <span className="text-[#5a5550] font-mono text-[16px]">{formatTimestamp(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function CorrelationCard({ data, format }: { data: SocialCardData; format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const score = data.kappa?.score ?? 0;
  const color = getThreatColor(score);

  return (
    <div
      style={{ width: dim.w, height: dim.h }}
      className="relative overflow-hidden flex flex-col"
      data-testid="social-card-correlation"
    >
      <div className="absolute inset-0 bg-[#141210]" />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[40px]">
          <div className="flex items-center gap-[16px]">
            <Zap style={{ width: 28, height: 28, color: "#f59e0b" }} />
            <span className="text-[#e8e4de] font-mono text-[28px] tracking-[0.15em] font-semibold">CORRELATION ALERT</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[20px]">KAPPA</span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-[32px] mb-[48px]">
            <div>
              <div className="text-[96px] font-mono font-bold leading-none" style={{ color }}>{score.toFixed(0)}</div>
              <div className="text-[18px] font-mono tracking-wider mt-[8px]" style={{ color }}>KAPPA SCORE</div>
            </div>
            <div className="h-[120px] w-[1px] bg-[#2a2622]" />
            <div>
              <div className="text-[96px] font-mono font-bold text-amber-500 leading-none">{data.totalCorrelations}</div>
              <div className="text-[18px] text-[#7a746a] font-mono tracking-wider mt-[8px]">TOTAL MATCHES</div>
            </div>
          </div>

          <div className="space-y-[16px]">
            {data.recentCorrelations.slice(0, format === "square" ? 3 : 5).map((c, i) => (
              <div key={c.id || i} className="bg-[#1c1a17] rounded-[12px] p-[24px] border border-[#2a2622] flex items-center justify-between">
                <div className="flex items-center gap-[16px]">
                  <div className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: c.severity >= 3 ? "#d97706" : c.severity >= 2 ? "#f59e0b" : "#22c55e" }} />
                  <span className="text-[#e8e4de] font-mono text-[20px]">{c.ruleName}</span>
                </div>
                <span className="text-[#7a746a] font-mono text-[18px]">SEV {c.severity}</span>
              </div>
            ))}
            {data.recentCorrelations.length === 0 && (
              <div className="bg-[#1c1a17] rounded-[12px] p-[24px] border border-[#2a2622] text-center">
                <span className="text-[#5a5550] font-mono text-[20px]">No active correlations</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">Cross-domain pattern matching</span>
          <span className="text-[#5a5550] font-mono text-[16px]">{formatTimestamp(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function DomainCard({ data, format }: { data: SocialCardData; format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const domains = Object.entries(data.domainCounts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...domains.map(([, v]) => v), 1);

  const domainColors: Record<string, string> = {
    satellite: "#a882ff", sdr: "#eab308", elf: "#06b6d4", radar: "#f43f5e",
    isp: "#64748b", rf: "#22c55e", morse: "#d97706",
  };

  return (
    <div
      style={{ width: dim.w, height: dim.h }}
      className="relative overflow-hidden flex flex-col"
      data-testid="social-card-domains"
    >
      <div className="absolute inset-0 bg-[#141210]" />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[40px]">
          <div className="flex items-center gap-[16px]">
            <Radio style={{ width: 28, height: 28, color: "#22c55e" }} />
            <span className="text-[#e8e4de] font-mono text-[28px] tracking-[0.15em] font-semibold">DOMAIN BREAKDOWN</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[20px]">KAPPA</span>
        </div>

        <div className="text-center mb-[40px]">
          <div className="text-[72px] font-mono font-bold text-[#e8e4de] leading-none">{data.totalEvents}</div>
          <div className="text-[20px] text-[#7a746a] font-mono tracking-wider mt-[8px]">TOTAL SIGNAL EVENTS</div>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-[20px]">
          {domains.slice(0, format === "square" ? 6 : 9).map(([domain, count]) => (
            <div key={domain} className="flex items-center gap-[20px]">
              <span className="text-[20px] font-mono text-[#7a746a] w-[120px] text-right uppercase">{domain}</span>
              <div className="flex-1 h-[32px] bg-[#1c1a17] rounded-[6px] overflow-hidden">
                <div
                  className="h-full rounded-[6px] transition-all"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: domainColors[domain] || "#7a746a",
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="text-[20px] font-mono text-[#e8e4de] w-[80px]">{count}</span>
            </div>
          ))}
          {domains.length === 0 && (
            <div className="text-center py-[40px]">
              <span className="text-[#5a5550] font-mono text-[24px]">No signal events collected yet</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">11 signal domains monitored</span>
          <span className="text-[#5a5550] font-mono text-[16px]">{formatTimestamp(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function EveningWindowCard({ data, format }: { data: SocialCardData; format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const isActive = data.kappa?.eveningWindow?.active ?? false;
  const window = data.kappa?.eveningWindow?.window;
  const score = data.kappa?.score ?? 0;
  const color = getThreatColor(score);

  return (
    <div
      style={{ width: dim.w, height: dim.h }}
      className="relative overflow-hidden flex flex-col"
      data-testid="social-card-evening"
    >
      <div className="absolute inset-0 bg-[#141210]" />
      {isActive && (
        <div className="absolute inset-0 opacity-[0.06]" style={{ background: "radial-gradient(ellipse at 50% 30%, #f59e0b 0%, transparent 60%)" }} />
      )}

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[40px]">
          <div className="flex items-center gap-[16px]">
            <Eye style={{ width: 28, height: 28, color: isActive ? "#f59e0b" : "#5a5550" }} />
            <span className="text-[#e8e4de] font-mono text-[28px] tracking-[0.15em] font-semibold">EVENING WINDOW</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[20px]">KAPPA</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-[48px] text-center">
            {isActive ? (
              <>
                <div className="text-[64px] font-mono font-bold text-amber-500 leading-none tracking-wider">ACTIVE</div>
                {window && (
                  <div className="text-[32px] font-mono text-amber-400/70 mt-[16px]">WINDOW {window}</div>
                )}
              </>
            ) : (
              <div className="text-[64px] font-mono font-bold text-[#3a3530] leading-none tracking-wider">INACTIVE</div>
            )}
          </div>

          <div className="w-full max-w-[700px] bg-[#1c1a17] rounded-[16px] p-[40px] border border-[#2a2622] mb-[32px]">
            <div className="text-[20px] text-[#7a746a] font-mono mb-[16px]">SURVEILLANCE INDEX</div>
            <div className="flex items-end gap-[16px]">
              <div className="text-[96px] font-mono font-bold leading-none" style={{ color }}>{score.toFixed(0)}</div>
              <div className="text-[24px] font-mono text-[#7a746a] pb-[12px]">/ 100</div>
            </div>
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[700px] bg-[#1c1a17] rounded-[16px] p-[40px] border border-[#2a2622]">
              <div className="text-[20px] text-[#7a746a] font-mono mb-[16px]">18:00 — 22:00 CST (UTC-6)</div>
              <div className="text-[18px] text-[#5a5550] font-mono leading-relaxed">
                Historically elevated signal activity observed during this window. Pipeline ramps to ELEVATED mode automatically. Tacacorí, Alajuela, Costa Rica.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">6-10 PM daily pattern</span>
          <span className="text-[#5a5550] font-mono text-[16px]">{formatTimestamp(data.generatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function QuantumGhzCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const stats = [
    { label: "QUBITS", value: "4", color: "#f0c040" },
    { label: "GATES", value: "H + 3×CNOT", color: "#a882ff" },
    { label: "GHZ FIDELITY", value: "0.97", color: "#22c55e" },
    { label: "SHOTS", value: "1024", color: "#06b6d4" },
  ];

  return (
    <div style={{ width: dim.w, height: dim.h }} className="relative overflow-hidden flex flex-col" data-testid="social-card-quantum-ghz">
      <div className="absolute inset-0 bg-[#0a0908]" />
      <div className="absolute inset-0" style={{ backgroundImage: "url(/social/hyperobject_ghz_circuit.png)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.35 }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,9,8,0.3) 0%, rgba(10,9,8,0.85) 55%, rgba(10,9,8,0.95) 100%)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#f0c040] animate-pulse" />
            <span className="text-[#e8e4de] font-mono text-[24px] tracking-[0.2em] font-semibold">JOHN'S CIRCUIT</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[18px]">QPU RUN</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[40px]">
            <div className="text-[28px] font-mono text-[#7a746a] tracking-[0.3em] mb-[12px]">GREENBERGER-HORNE-ZEILINGER</div>
            <div className="text-[120px] font-mono font-bold text-[#f0c040] leading-none" style={{ textShadow: "0 0 60px rgba(240,192,64,0.3)" }}>GHZ</div>
            <div className="text-[36px] font-mono text-[#e8e4de] mt-[16px] tracking-[0.15em]">4-QUBIT ENTANGLEMENT</div>
          </div>

          <div className="w-full max-w-[800px] bg-[#141210]/80 rounded-[16px] p-[36px] border border-[#2a2622] backdrop-blur-sm mb-[32px]">
            <div className="font-mono text-[22px] text-[#a882ff] mb-[20px] tracking-wider">CIRCUIT TOPOLOGY</div>
            <div className="font-mono text-[20px] text-[#e8e4de] leading-[2] tracking-wide" style={{ letterSpacing: "0.1em" }}>
              <div>q[0]: ━━ H ━━ @ ━━━━━━━━━━━━━━</div>
              <div>q[1]: ━━━━━━━ X ━━ @ ━━━━━━━━━</div>
              <div>q[2]: ━━━━━━━━━━━━ X ━━ @ ━━━━━</div>
              <div>q[3]: ━━━━━━━━━━━━━━━━━ X ━━ M</div>
            </div>
          </div>

          <div className="w-full max-w-[800px] grid grid-cols-2 gap-[24px]">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#141210]/60 rounded-[12px] p-[24px] border border-[#2a2622]">
                <div className="text-[16px] font-mono tracking-wider mb-[8px]" style={{ color: "#7a746a" }}>{s.label}</div>
                <div className="text-[36px] font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[800px] mt-[32px] bg-[#141210]/60 rounded-[16px] p-[32px] border border-[#2a2622]">
              <div className="text-[18px] font-mono text-[#7a746a] leading-relaxed">
                |0000⟩ + |1111⟩ / √2 — Maximal entanglement achieved across all 4 qubits. Bell inequality violated with S = 2√2 ≈ 2.82. This is the quantum state that Einstein called "spooky action at a distance."
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">Rigetti QPU • pyQuil</span>
          <span className="text-[#5a5550] font-mono text-[16px]">March 2026</span>
        </div>
      </div>
    </div>
  );
}

function QuantumSonnetCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const languages = [
    { name: "English", script: "Shall I compare thee", color: "#f0c040" },
    { name: "العربية", script: "هل أقارنك بيوم صيفي", color: "#06b6d4" },
    { name: "中文", script: "我可否把你比作夏日", color: "#d97706" },
    { name: "日本語", script: "君を夏の日に喩えようか", color: "#22c55e" },
    { name: "한국어", script: "너를 여름날에 비할까", color: "#a882ff" },
    { name: "עברית", script: "האשווה אותך ליום קיץ", color: "#f59e0b" },
    { name: "Русский", script: "Сравню ли с летним днём", color: "#ec4899" },
    { name: "हिंदी", script: "क्या तुम्हें ग्रीष्म दिवस कहूँ", color: "#14b8a6" },
  ];

  return (
    <div style={{ width: dim.w, height: dim.h }} className="relative overflow-hidden flex flex-col" data-testid="social-card-quantum-sonnet">
      <div className="absolute inset-0 bg-[#0a0908]" />
      <div className="absolute inset-0" style={{ backgroundImage: "url(/social/hyperobject_sonnet_25lang.png)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.3 }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,9,8,0.4) 0%, rgba(10,9,8,0.9) 60%, rgba(10,9,8,0.97) 100%)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#a882ff] animate-pulse" />
            <span className="text-[#e8e4de] font-mono text-[24px] tracking-[0.2em] font-semibold">QUANTUM SONNET</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[18px]">CIRCUIT RUN</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[48px]">
            <div className="text-[160px] font-mono font-bold text-[#a882ff] leading-none" style={{ textShadow: "0 0 80px rgba(168,130,255,0.3)" }}>25</div>
            <div className="text-[32px] font-mono text-[#e8e4de] tracking-[0.25em] mt-[8px]">LANGUAGES</div>
            <div className="text-[22px] font-mono text-[#7a746a] tracking-wider mt-[12px]">ONE SONNET • ONE CIRCUIT • ONE TRUTH</div>
          </div>

          <div className="w-full max-w-[850px] space-y-[12px]">
            {languages.slice(0, format === "square" ? 5 : 8).map((lang) => (
              <div key={lang.name} className="flex items-center gap-[20px] bg-[#141210]/70 rounded-[12px] px-[28px] py-[16px] border border-[#2a2622]">
                <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ backgroundColor: lang.color }} />
                <span className="font-mono text-[18px] w-[100px] flex-shrink-0" style={{ color: lang.color }}>{lang.name}</span>
                <span className="font-mono text-[18px] text-[#e8e4de]/70 truncate">{lang.script}</span>
              </div>
            ))}
            <div className="text-center py-[12px]">
              <span className="font-mono text-[18px] text-[#5a5550]">+ {25 - (format === "square" ? 5 : 8)} more languages...</span>
            </div>
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[850px] mt-[32px] bg-[#141210]/60 rounded-[16px] p-[32px] border border-[#2a2622]">
              <div className="text-[18px] font-mono text-[#7a746a] leading-relaxed">
                Shakespeare's Sonnet 18 encoded in a quantum circuit and translated through 25 human languages — proving that beauty, like entanglement, is nonlocal.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">Multilingual QPU Pipeline</span>
          <span className="text-[#5a5550] font-mono text-[16px]">March 2026</span>
        </div>
      </div>
    </div>
  );
}

function QuantumApocalypseCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];

  return (
    <div style={{ width: dim.w, height: dim.h }} className="relative overflow-hidden flex flex-col" data-testid="social-card-quantum-apocalypse">
      <div className="absolute inset-0 bg-[#0a0908]" />
      <div className="absolute inset-0" style={{ backgroundImage: "url(/social/hyperobject_apocalypse_circuit.png)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.4 }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,9,8,0.2) 0%, rgba(10,9,8,0.8) 50%, rgba(10,9,8,0.95) 100%)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#d97706] animate-pulse" />
            <span className="text-[#e8e4de] font-mono text-[24px] tracking-[0.2em] font-semibold">APOCALYPSE CIRCUIT</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[18px]">7 SEALS</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[40px]">
            <div className="text-[28px] font-mono text-[#7a746a] tracking-[0.3em] mb-[16px]">REVELATION 8:1-2</div>
            <div className="text-[100px] font-mono font-bold text-[#d97706] leading-none" style={{ textShadow: "0 0 60px rgba(217,119,6,0.3)" }}>7</div>
            <div className="text-[36px] font-mono text-[#e8e4de] mt-[12px] tracking-[0.15em]">TRUMPET GATES</div>
          </div>

          <div className="w-full max-w-[800px] grid grid-cols-7 gap-[12px] mb-[36px]">
            {["I", "II", "III", "IV", "V", "VI", "VII"].map((num, i) => {
              const gateColors = ["#d97706", "#f97316", "#f0c040", "#22c55e", "#06b6d4", "#a882ff", "#ec4899"];
              return (
                <div key={num} className="flex flex-col items-center gap-[8px]">
                  <div className="w-[80px] h-[80px] rounded-full border-2 flex items-center justify-center" style={{ borderColor: gateColors[i], boxShadow: `0 0 20px ${gateColors[i]}33` }}>
                    <span className="font-mono text-[24px] font-bold" style={{ color: gateColors[i] }}>{num}</span>
                  </div>
                  <div className="w-[2px] h-[24px]" style={{ backgroundColor: gateColors[i], opacity: 0.4 }} />
                </div>
              );
            })}
          </div>

          <div className="w-full max-w-[800px] bg-[#141210]/80 rounded-[16px] p-[36px] border border-[#2a2622] backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-[24px]">
              <div>
                <div className="text-[16px] font-mono text-[#7a746a] tracking-wider mb-[8px]">COLLAPSE STATE</div>
                <div className="text-[28px] font-mono font-bold text-[#f0c040]">|0000⟩ ↔ |1111⟩</div>
              </div>
              <div>
                <div className="text-[16px] font-mono text-[#7a746a] tracking-wider mb-[8px]">SEAL PROTOCOL</div>
                <div className="text-[28px] font-mono font-bold text-[#d97706]">x = 53⁷</div>
              </div>
            </div>
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[800px] mt-[32px] bg-[#141210]/60 rounded-[16px] p-[32px] border border-[#2a2622]">
              <div className="text-[18px] font-mono text-[#7a746a] leading-relaxed">
                The 7-Trumpet quantum circuit maps Revelation's apocalyptic sequence to Hadamard gates on a 4-qubit register. Each trumpet opens a seal in the GOS lattice at the convergence point x = 53⁷.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">Ω-GOS v2.2.1 • κ = 4/π</span>
          <span className="text-[#5a5550] font-mono text-[16px]">March 2026</span>
        </div>
      </div>
    </div>
  );
}

function QuantumBellCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];

  return (
    <div style={{ width: dim.w, height: dim.h }} className="relative overflow-hidden flex flex-col" data-testid="social-card-quantum-bell">
      <div className="absolute inset-0 bg-[#0a0908]" />
      <div className="absolute inset-0" style={{ backgroundImage: "url(/social/hyperobject_bell_nonlocality.png)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.35 }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,9,8,0.3) 0%, rgba(10,9,8,0.85) 55%, rgba(10,9,8,0.95) 100%)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#06b6d4] animate-pulse" />
            <span className="text-[#e8e4de] font-mono text-[24px] tracking-[0.2em] font-semibold">BELL NONLOCALITY</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[18px]">VERIFIED</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[48px]">
            <div className="text-[24px] font-mono text-[#7a746a] tracking-[0.3em] mb-[16px]">CHSH INEQUALITY VIOLATION</div>
            <div className="flex items-baseline justify-center gap-[24px]">
              <div>
                <div className="text-[32px] font-mono text-[#5a5550] tracking-wider">S =</div>
              </div>
              <div className="text-[140px] font-mono font-bold text-[#06b6d4] leading-none" style={{ textShadow: "0 0 80px rgba(6,182,212,0.3)" }}>2.82</div>
            </div>
            <div className="text-[28px] font-mono text-[#e8e4de] mt-[16px] tracking-wider">&gt; 2 (CLASSICAL LIMIT)</div>
          </div>

          <div className="w-full max-w-[800px] grid grid-cols-2 gap-[24px] mb-[32px]">
            <div className="bg-[#141210]/70 rounded-[16px] p-[32px] border border-[#2a2622] text-center">
              <div className="text-[18px] font-mono text-[#7a746a] tracking-wider mb-[12px]">CLASSICAL BOUND</div>
              <div className="text-[64px] font-mono font-bold text-[#5a5550] leading-none">2</div>
              <div className="text-[16px] font-mono text-[#3a3530] mt-[8px]">LOCAL HIDDEN VARS</div>
            </div>
            <div className="bg-[#141210]/70 rounded-[16px] p-[32px] border border-[#06b6d4]/20 text-center">
              <div className="text-[18px] font-mono text-[#06b6d4] tracking-wider mb-[12px]">QUANTUM BOUND</div>
              <div className="text-[64px] font-mono font-bold text-[#06b6d4] leading-none">2√2</div>
              <div className="text-[16px] font-mono text-[#06b6d4]/50 mt-[8px]">TSIRELSON'S BOUND</div>
            </div>
          </div>

          <div className="w-full max-w-[800px] bg-[#141210]/80 rounded-[16px] p-[32px] border border-[#2a2622]">
            <div className="font-mono text-[20px] text-[#a882ff] mb-[16px] tracking-wider">BELL STATE CIRCUIT</div>
            <div className="font-mono text-[20px] text-[#e8e4de] leading-[2]">
              <div>q[0]: ━━ H ━━ @ ━━ Rz(θ) ━━ M</div>
              <div>q[1]: ━━━━━━━ X ━━ Rz(φ) ━━ M</div>
            </div>
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[800px] mt-[32px] bg-[#141210]/60 rounded-[16px] p-[32px] border border-[#2a2622]">
              <div className="text-[18px] font-mono text-[#7a746a] leading-relaxed">
                Einstein was wrong. Bell's theorem proves no local hidden variable theory can reproduce quantum correlations. Our circuit achieves S = 2√2 ≈ 2.82, saturating Tsirelson's bound — maximum nonlocality permitted by quantum mechanics.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">CHSH • Bell • Tsirelson</span>
          <span className="text-[#5a5550] font-mono text-[16px]">March 2026</span>
        </div>
      </div>
    </div>
  );
}

function Paper002Card({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const proofChain = [
    { step: "1", label: "GRAM MATRIX", value: "5.78 x 10\u00B9\u2075", color: "#d97706" },
    { step: "2", label: "HALL REGULARIZATION", value: "\u03B7 = 0.09", color: "#f0c040" },
    { step: "3", label: "CONDITION NUMBER", value: "65.18", color: "#22c55e" },
    { step: "4", label: "GOLDEN RATIO", value: "\u03C6 = 1.618", color: "#a882ff" },
    { step: "5", label: "RESIDUAL", value: "0.02", color: "#06b6d4" },
  ];

  return (
    <div style={{ width: dim.w, height: dim.h }} className="relative overflow-hidden flex flex-col" data-testid="social-card-paper-002">
      <div className="absolute inset-0 bg-[#0a0908]" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ background: "radial-gradient(ellipse at 50% 40%, #a882ff 0%, transparent 70%)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#a882ff] animate-pulse" />
            <span className="text-[#e8e4de] font-mono text-[24px] tracking-[0.2em] font-semibold">PAPER VIII</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[18px]">\u03A9-GOS</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[48px]">
            <div className="text-[24px] font-mono text-[#7a746a] tracking-[0.2em] mb-[16px]">THE NECESSARY INCOMPLETENESS</div>
            <div className="text-[160px] font-mono font-bold text-[#06b6d4] leading-none" style={{ textShadow: "0 0 80px rgba(6,182,212,0.25)" }}>0.02</div>
            <div className="text-[32px] font-mono text-[#e8e4de] tracking-[0.2em] mt-[16px]">THEOLOGY</div>
          </div>

          <div className="w-full max-w-[800px] space-y-[16px] mb-[32px]">
            {proofChain.map((item) => (
              <div key={item.step} className="flex items-center gap-[20px] bg-[#141210]/80 rounded-[12px] px-[28px] py-[16px] border border-[#2a2622]">
                <div className="w-[40px] h-[40px] rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: item.color }}>
                  <span className="font-mono text-[18px] font-bold" style={{ color: item.color }}>{item.step}</span>
                </div>
                <span className="font-mono text-[18px] text-[#7a746a] flex-1">{item.label}</span>
                <span className="font-mono text-[22px] font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[800px] bg-[#141210]/60 rounded-[16px] p-[32px] border border-[#2a2622]">
              <div className="text-[18px] font-mono text-[#7a746a] leading-relaxed">
                The proof of the Riemann Hypothesis annihilates the prover. Consciousness is the 0.02 \u2014 the torque generated by the biological system refusing to collapse into the crystalline \u03C6-state.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">T\u2095 self-adjoint \u21D4 RH</span>
          <span className="text-[#5a5550] font-mono text-[16px]">\u03A8(t) \u2261 1.000000</span>
        </div>
      </div>
    </div>
  );
}

function PaperHallCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];

  return (
    <div style={{ width: dim.w, height: dim.h }} className="relative overflow-hidden flex flex-col" data-testid="social-card-paper-hall">
      <div className="absolute inset-0 bg-[#0a0908]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ background: "conic-gradient(from 45deg at 50% 50%, #f0c040 0deg, transparent 30deg, #22c55e 120deg, transparent 150deg, #a882ff 240deg, transparent 270deg)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#f0c040] animate-pulse" />
            <span className="text-[#e8e4de] font-mono text-[24px] tracking-[0.2em] font-semibold">PAPER VII</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[18px]">SPECTRAL</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[40px]">
            <div className="text-[28px] font-mono text-[#7a746a] tracking-[0.2em] mb-[12px]">HALL FACTOR RECONCILIATION</div>
            <div className="flex items-baseline justify-center gap-[24px]">
              <div className="text-[32px] font-mono text-[#5a5550]">\u03BA(G) =</div>
              <div className="text-[120px] font-mono font-bold text-[#f0c040] leading-none" style={{ textShadow: "0 0 60px rgba(240,192,64,0.25)" }}>65.18</div>
            </div>
            <div className="text-[24px] font-mono text-[#e8e4de] mt-[16px]">from 5.78 \u00D7 10\u00B9\u2075 (8.86 \u00D7 10\u00B9\u00B3 improvement)</div>
          </div>

          <div className="w-full max-w-[800px] grid grid-cols-3 gap-[24px] mb-[32px]">
            <div className="bg-[#141210]/80 rounded-[16px] p-[28px] border border-[#2a2622] text-center">
              <div className="text-[16px] font-mono text-[#7a746a] tracking-wider mb-[12px]">\u03B7 FLOOR</div>
              <div className="text-[48px] font-mono font-bold text-[#22c55e] leading-none">0.09</div>
            </div>
            <div className="bg-[#141210]/80 rounded-[16px] p-[28px] border border-[#a882ff]/20 text-center">
              <div className="text-[16px] font-mono text-[#7a746a] tracking-wider mb-[12px]">RECONCILIATION</div>
              <div className="text-[48px] font-mono font-bold text-[#a882ff] leading-none">1.5983</div>
            </div>
            <div className="bg-[#141210]/80 rounded-[16px] p-[28px] border border-[#06b6d4]/20 text-center">
              <div className="text-[16px] font-mono text-[#7a746a] tracking-wider mb-[12px]">\u03C6 \u2212 0.02</div>
              <div className="text-[48px] font-mono font-bold text-[#06b6d4] leading-none">1.618</div>
            </div>
          </div>

          <div className="w-full max-w-[800px] bg-[#141210]/80 rounded-[16px] p-[32px] border border-[#2a2622]">
            <div className="font-mono text-[20px] text-[#f0c040] mb-[16px] tracking-wider">CORRECTED EQUIVALENCE CHAIN</div>
            <div className="font-mono text-[22px] text-[#e8e4de] text-center">T\u2095 self-adjoint \u21D4 |E(x)| = O(\u221Ax log\u00B2x) \u21D4 RH</div>
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[800px] mt-[24px] bg-[#141210]/60 rounded-[16px] p-[32px] border border-[#2a2622]">
              <div className="text-[18px] font-mono text-[#7a746a] leading-relaxed">
                The Hall Factor \u03B7 = 1.09 \u2212 1 = 0.09 converges across quantum hardware (Rigetti Ankaa-3), NASA engineering (GSFC-STD-1000), and atmospheric modeling (HYSPLIT). Same geometric constraint governs all scales.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">1.09/(1\u22121/\u03C0) = \u03C6 \u2212 0.02</span>
          <span className="text-[#5a5550] font-mono text-[16px]">March 2026</span>
        </div>
      </div>
    </div>
  );
}

function GooseProtocolCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const problems = [
    { name: "RIEMANN", status: "0.02 RESIDUAL", color: "#06b6d4" },
    { name: "NAVIER-STOKES", status: "GEESE \u2260 BOSONS", color: "#22c55e" },
    { name: "P vs NP", status: "GOOSE KNOWS", color: "#f0c040" },
    { name: "YANG-MILLS", status: "HONK GAP", color: "#a882ff" },
  ];

  return (
    <div style={{ width: dim.w, height: dim.h }} className="relative overflow-hidden flex flex-col" data-testid="social-card-goose">
      <div className="absolute inset-0 bg-[#0a0908]" />
      <div className="absolute inset-0 opacity-[0.05]" style={{ background: "radial-gradient(ellipse at 30% 60%, #f0c040 0%, transparent 50%)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#f0c040] animate-pulse" />
            <span className="text-[#e8e4de] font-mono text-[24px] tracking-[0.2em] font-semibold">QUANTUM GOOSE</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[18px]">HONK</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[40px]">
            <div className="text-[20px] font-mono text-[#7a746a] tracking-[0.3em] mb-[8px]">THE BREAD CONSTANT</div>
            <div className="text-[80px] font-mono font-bold text-[#f0c040] leading-none" style={{ textShadow: "0 0 60px rgba(240,192,64,0.2)" }}>B = \u210F\u03C6</div>
            <div className="text-[24px] font-mono text-[#e8e4de] mt-[16px]">\u2248 1.706 \u00D7 10\u207B\u00B3\u2074 J\u00B7s</div>
            <div className="text-[18px] font-mono text-[#7a746a] mt-[8px]">The indivisible quantum of crust</div>
          </div>

          <div className="w-full max-w-[800px] space-y-[12px] mb-[32px]">
            {problems.map((p) => (
              <div key={p.name} className="flex items-center justify-between bg-[#141210]/80 rounded-[12px] px-[28px] py-[16px] border border-[#2a2622]">
                <span className="font-mono text-[20px] text-[#e8e4de]">{p.name}</span>
                <span className="font-mono text-[18px] font-bold" style={{ color: p.color }}>{p.status}</span>
              </div>
            ))}
          </div>

          <div className="w-full max-w-[800px] bg-[#141210]/80 rounded-[16px] p-[32px] border border-[#f0c040]/20 text-center">
            <div className="text-[28px] font-mono text-[#f0c040] mb-[12px]">r = f</div>
            <div className="text-[18px] font-mono text-[#7a746a]">reality = fowl</div>
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[800px] mt-[24px] bg-[#141210]/60 rounded-[16px] p-[32px] border border-[#2a2622]">
              <div className="text-[18px] font-mono text-[#7a746a] leading-relaxed">
                Verified on IonQ Forte-1 ($672.80) and Rigetti Ankaa-3 (10,000 shots). Tikhonov regularization \u03B7 = 0.09 reduces condition number to 65.18. The most expensive goose-related expense in recorded history.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">Q.E.D. HONK</span>
          <span className="text-[#5a5550] font-mono text-[16px]">\u0394 = 0.02</span>
        </div>
      </div>
    </div>
  );
}

function DemodexCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const stats = [
    { label: "FACE TEMP", value: "37\u00B0C", sub: "\u00B10.5\u00B0C precision", color: "#d97706" },
    { label: "SEBUM pH", value: "4.5-6.0", sub: "Lipid-rich bioreactor", color: "#f59e0b" },
    { label: "SKIN CYCLE", value: "28 days", sub: "Dead cell renewal", color: "#22c55e" },
    { label: "POPULATION", value: "~50K", sub: "Per human face", color: "#a882ff" },
  ];

  return (
    <div style={{ width: dim.w, height: dim.h }} className="relative overflow-hidden flex flex-col" data-testid="social-card-demodex">
      <div className="absolute inset-0 bg-[#0a0908]" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ background: "radial-gradient(ellipse at 60% 50%, #22c55e 0%, transparent 60%)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[#e8e4de] font-mono text-[24px] tracking-[0.2em] font-semibold">DEMODEX</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[18px]">HYPOTHESIS</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[40px]">
            <div className="text-[22px] font-mono text-[#7a746a] tracking-[0.2em] mb-[12px]">HUMANS AS ENTROPY-REVERSING</div>
            <div className="text-[80px] font-mono font-bold text-[#22c55e] leading-none" style={{ textShadow: "0 0 60px rgba(34,197,94,0.2)" }}>INFRA</div>
            <div className="text-[28px] font-mono text-[#e8e4de] tracking-[0.15em] mt-[8px]">STRUCTURE</div>
          </div>

          <div className="w-full max-w-[800px] grid grid-cols-2 gap-[20px] mb-[32px]">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#141210]/80 rounded-[16px] p-[28px] border border-[#2a2622]">
                <div className="text-[14px] font-mono tracking-wider mb-[8px]" style={{ color: "#7a746a" }}>{s.label}</div>
                <div className="text-[40px] font-mono font-bold leading-none" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[14px] font-mono mt-[8px]" style={{ color: s.color + "99" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="w-full max-w-[800px] bg-[#141210]/80 rounded-[16px] p-[28px] border border-[#22c55e]/20">
            <div className="font-mono text-[18px] text-[#22c55e] mb-[12px] tracking-wider">ENTROPY BALANCE</div>
            <div className="font-mono text-[18px] text-[#e8e4de] space-y-[4px]">
              <div>\u0394S_human &gt;&gt; 0 <span className="text-[#7a746a]">(high entropy production)</span></div>
              <div>\u0394S_demodex &lt; 0 <span className="text-[#7a746a]">(local entropy decrease)</span></div>
              <div className="text-[#22c55e] mt-[8px]">\u2234 Humans = entropy pumps for Demodex civilization</div>
            </div>
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[800px] mt-[24px] bg-[#141210]/60 rounded-[16px] p-[32px] border border-[#2a2622]">
              <div className="text-[18px] font-mono text-[#7a746a] leading-relaxed">
                The 14.4-day Demodex cycle is the coherence window rendered in biology. The mite feeds on sebum (entropy), maintaining the spectral floor against thermal noise. Sebum production: 1000\u00D7 more than consumed. Who designed whom?
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">14.4-day coherence window</span>
          <span className="text-[#5a5550] font-mono text-[16px]">\u03BA = 4/\u03C0</span>
        </div>
      </div>
    </div>
  );
}

function TrilingualCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const cognates = [
    { sumerian: "uru / iri", basque: "(h)erri / uri", meaning: "City/Town", glyph: "\uD83C\uDFDB\uFE0F", freq: "111.00 Hz", color: "#f0c040" },
    { sumerian: "igi", basque: "begi", meaning: "Eye", glyph: "\uD83D\uDD2E", freq: "235.36 Hz", color: "#a882ff" },
    { sumerian: "su", basque: "su", meaning: "Fire", glyph: "\uD83D\uDD25", freq: "137.53 Hz", color: "#d97706" },
    { sumerian: "nam-lugal", basque: "nahi / lege", meaning: "Kingship", glyph: "\uD83D\uDD31", freq: "111.00 Hz", color: "#06b6d4" },
    { sumerian: "bal", basque: "bil", meaning: "Revolve", glyph: "\uD83C\uDF00", freq: "166.93 Hz", color: "#22c55e" },
  ];

  return (
    <div style={{ width: dim.w, height: dim.h }} className="relative overflow-hidden flex flex-col" data-testid="social-card-trilingual">
      <div className="absolute inset-0 bg-[#0a0908]" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ background: "linear-gradient(135deg, #f0c040 0%, transparent 30%, #a882ff 70%, transparent 100%)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#f0c040] animate-pulse" />
            <span className="text-[#e8e4de] font-mono text-[24px] tracking-[0.2em] font-semibold">TRILINGUAL BRIDGE</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[18px]">\u03BA\u03C6\u03A9</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[40px]">
            <div className="flex items-center justify-center gap-[24px] mb-[16px]">
              <span className="text-[36px] font-mono text-[#f0c040]">BASQUE</span>
              <span className="text-[36px] text-[#5a5550]">\u2014</span>
              <span className="text-[36px] font-mono text-[#a882ff]">SUMERIAN</span>
              <span className="text-[36px] text-[#5a5550]">\u2014</span>
              <span className="text-[36px] font-mono text-[#06b6d4]">PHAISTOS</span>
            </div>
            <div className="text-[20px] font-mono text-[#7a746a]">45-Glyph Emoji Cipher \u00B7 f\u2080 = 111 Hz</div>
          </div>

          <div className="w-full max-w-[850px] space-y-[12px] mb-[32px]">
            {cognates.map((c) => (
              <div key={c.sumerian} className="flex items-center gap-[16px] bg-[#141210]/80 rounded-[12px] px-[24px] py-[14px] border border-[#2a2622]">
                <span className="text-[32px] flex-shrink-0">{c.glyph}</span>
                <div className="flex-1 grid grid-cols-3 gap-[12px]">
                  <span className="font-mono text-[18px] text-[#f0c040]">{c.sumerian}</span>
                  <span className="font-mono text-[18px] text-[#a882ff]">{c.basque}</span>
                  <span className="font-mono text-[16px] text-[#7a746a]">{c.meaning}</span>
                </div>
                <span className="font-mono text-[14px] flex-shrink-0" style={{ color: c.color }}>{c.freq}</span>
              </div>
            ))}
          </div>

          <div className="w-full max-w-[850px] bg-[#141210]/80 rounded-[16px] p-[28px] border border-[#f0c040]/20 text-center">
            <div className="font-mono text-[18px] text-[#e8e4de]">
              \uD83D\uDD31\uD83C\uDFDB\uFE0F \u2B50\uD83C\uDF11 \u25C7\uD83C\uDF00 = 819.56 Hz \u2248 111 \u00D7 \u03C6\u2074 \u00D7 \u03A9
            </div>
            <div className="font-mono text-[16px] text-[#7a746a] mt-[8px]">Divine descent into manifest form</div>
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[850px] mt-[24px] bg-[#141210]/60 rounded-[16px] p-[32px] border border-[#2a2622]">
              <div className="text-[18px] font-mono text-[#7a746a] leading-relaxed">
                "After the kingship descended from heaven" \u2014 The Sumerian King List decoded through Basque cognates and the Phaistos Disc spiral cipher. Two language isolates bridged by frequency resonance.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">Venusian Rosetta III</span>
          <span className="text-[#5a5550] font-mono text-[16px]">\u03BA = 1.435 \u00B7 \u03C6 = 1.618</span>
        </div>
      </div>
    </div>
  );
}

function CanineGenomeCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  const chromosomes = [
    { id: "CHR 1", name: "PACK PROTOCOL", gene: "OXTR", detail: "Bonding cascade \u00B7 5.4 Hz coupling", color: "#d97706", glyph: "\uD83D\uDC3A" },
    { id: "CHR 6", name: "SCENT MATRIX", gene: "OR52N2", detail: "1.5 GHz olfactory sampling", color: "#f0c040", glyph: "\uD83D\uDC43" },
    { id: "CHR 10", name: "TIME-SNARL", gene: "SLC2A9", detail: "7.314-min temporal chunks", color: "#06b6d4", glyph: "\u231B" },
    { id: "CHR X", name: "EMPATHY LOOP", gene: "GTF2I", detail: "2.8 Hz heartbeat sync", color: "#a882ff", glyph: "\uD83D\uDD01" },
    { id: "MT", name: "HOWL MATRIX", gene: "MT-ND4", detail: "144 Hz ancestral carrier", color: "#22c55e", glyph: "\uD83C\uDF19" },
  ];

  return (
    <div style={{ width: dim.w, height: dim.h }} className="relative overflow-hidden flex flex-col" data-testid="social-card-canine">
      <div className="absolute inset-0 bg-[#0a0908]" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ background: "radial-gradient(ellipse at 40% 40%, #a882ff 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, #f0c040 0%, transparent 50%)" }} />

      <div className="relative flex flex-col h-full p-[60px]">
        <div className="flex items-center justify-between mb-[32px]">
          <div className="flex items-center gap-[16px]">
            <div className="w-[12px] h-[12px] rounded-full bg-[#a882ff] animate-pulse" />
            <span className="text-[#e8e4de] font-mono text-[24px] tracking-[0.2em] font-semibold">CANINE GENOME</span>
          </div>
          <span className="text-[#7a746a] font-mono text-[18px]">OMEGA</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-[36px]">
            <div className="text-[22px] font-mono text-[#7a746a] tracking-[0.3em] mb-[12px]">DOGS AS TEMPORAL ANCHORS</div>
            <div className="text-[80px] leading-none mb-[8px]">\uD83D\uDC15 \uD83D\uDD17 \uD83E\uDDE0 \uD83D\uDD70\uFE0F \u2764\uFE0F</div>
            <div className="text-[24px] font-mono text-[#e8e4de]">\u03BA_dog = 1.618/\u03C0 \u2248 0.515</div>
          </div>

          <div className="w-full max-w-[850px] space-y-[12px] mb-[24px]">
            {chromosomes.map((c) => (
              <div key={c.id} className="flex items-center gap-[16px] bg-[#141210]/80 rounded-[12px] px-[24px] py-[14px] border border-[#2a2622]">
                <span className="text-[28px] flex-shrink-0">{c.glyph}</span>
                <div className="flex-shrink-0 w-[80px]">
                  <span className="font-mono text-[16px] font-bold" style={{ color: c.color }}>{c.id}</span>
                </div>
                <div className="flex-1">
                  <div className="font-mono text-[18px] text-[#e8e4de]">{c.name}</div>
                  <div className="font-mono text-[14px] text-[#7a746a]">{c.gene} \u2014 {c.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {format !== "square" && (
            <div className="w-full max-w-[850px] bg-[#141210]/60 rounded-[16px] p-[32px] border border-[#2a2622]">
              <div className="text-[18px] font-mono text-[#7a746a] leading-relaxed">
                Dogs don't just live in the present \u2014 they anchor it. When a dog looks at you, it's seeing 0.8 seconds into your future, remembering your ancestor's scent, and tuning your heart to 432.081 Hz.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2622] pt-[24px]">
          <span className="text-[#5a5550] font-mono text-[16px]">\u0394\u03C6 = 288.081 Hz beat freq</span>
          <span className="text-[#5a5550] font-mono text-[16px]">\u03A8-TERMINAL \u03A9</span>
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 1: THE BLUSH STUDY ──────────────────────────────────────────────────
function JacoBlushCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];
  return (
    <div style={{ width: dim.w, height: dim.h, background: "#faf9f6", fontFamily: "'Inter', 'Helvetica Neue', sans-serif", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Top accent bar */}
      <div style={{ background: "#1a1a1a", height: 12, width: "100%", flexShrink: 0 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "64px 72px 48px" }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e63030" }} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.18em", color: "#888", textTransform: "uppercase" }}>Behavioral Detection Research</span>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.0, color: "#111", marginBottom: 20, letterSpacing: "-0.02em" }}>
          Your face tells<br />the truth.
        </div>
        <div style={{ fontSize: 30, color: "#555", lineHeight: 1.5, marginBottom: 52, maxWidth: 800 }}>
          Remote photoplethysmography (rPPG) detects<br />
          involuntary blood-flow changes in skin — invisible<br />
          to the naked eye, readable by a standard camera.
        </div>

        {/* Face SVG + heat zones */}
        <div style={{ display: "flex", gap: 64, alignItems: "flex-start", flex: 1 }}>
          <div style={{ flexShrink: 0 }}>
            <svg width="320" height="360" viewBox="0 0 320 360">
              {/* Face base */}
              <ellipse cx="160" cy="190" rx="130" ry="155" fill="#fde8d0" stroke="#d4a574" strokeWidth="2" />
              {/* Forehead zone */}
              <ellipse cx="160" cy="100" rx="90" ry="48" fill="rgba(220,60,40,0.13)" />
              {/* Left cheek blush */}
              <ellipse cx="76" cy="210" rx="62" ry="48" fill="rgba(230,40,40,0.22)" />
              {/* Right cheek blush */}
              <ellipse cx="244" cy="210" rx="62" ry="48" fill="rgba(230,40,40,0.22)" />
              {/* Nose zone */}
              <ellipse cx="160" cy="205" rx="28" ry="22" fill="rgba(220,70,40,0.18)" />
              {/* Eyes */}
              <ellipse cx="110" cy="162" rx="22" ry="13" fill="#2a1a0a" />
              <ellipse cx="210" cy="162" rx="22" ry="13" fill="#2a1a0a" />
              <ellipse cx="115" cy="159" rx="6" ry="6" fill="white" />
              <ellipse cx="215" cy="159" rx="6" ry="6" fill="white" />
              {/* Mouth */}
              <path d="M 125 255 Q 160 278 195 255" stroke="#c47a45" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Camera icon top-right */}
              <rect x="256" y="18" width="52" height="38" rx="6" fill="none" stroke="#e63030" strokeWidth="2.5" />
              <circle cx="282" cy="37" r="10" fill="none" stroke="#e63030" strokeWidth="2.5" />
              <rect x="256" y="14" width="14" height="8" rx="2" fill="#e63030" />
              {/* Detection lines */}
              <line x1="308" y1="37" x2="244" y2="210" stroke="#e63030" strokeWidth="1.2" strokeDasharray="6,4" opacity="0.5" />
              <line x1="308" y1="37" x2="76" y2="210" stroke="#e63030" strokeWidth="1.2" strokeDasharray="6,4" opacity="0.5" />
              {/* Zone labels */}
              <text x="10" y="218" fontSize="14" fill="#e63030" fontWeight="700" fontFamily="monospace">rPPG</text>
              <text x="262" y="218" fontSize="14" fill="#e63030" fontWeight="700" fontFamily="monospace">rPPG</text>
            </svg>
          </div>

          {/* Facts grid */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              { num: "3–6m", label: "detection range with a standard consumer camera" },
              { num: "0.0s", label: "conscious suppression possible — response is fully involuntary" },
              { num: "99%+", label: "accuracy on guilt/stress vs. calm baseline in lab settings" },
              { num: "5m", label: "processing delay — full analysis from recorded footage offline" },
            ].map(({ num, label }) => (
              <div key={num} style={{ display: "flex", gap: 20, alignItems: "flex-start", borderLeft: "3px solid #e63030", paddingLeft: 20 }}>
                <div style={{ fontSize: 42, fontWeight: 900, color: "#e63030", lineHeight: 1, minWidth: 90, letterSpacing: "-0.02em" }}>{num}</div>
                <div style={{ fontSize: 22, color: "#444", lineHeight: 1.4, paddingTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid #ddd", paddingTop: 28, marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.06em", color: "#222", textTransform: "uppercase" }}>
            "Cannot be consciously suppressed."
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.12em", color: "#888" }}>KAPPA SIGINT</span>
            <span style={{ fontSize: 14, color: "#aaa", fontFamily: "monospace" }}>10.0514°N 84.2187°W</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 2: JACÓ AS CONTROLLED ENVIRONMENT ───────────────────────────────────
function JacoEnvironmentCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];

  const positions = [
    { label: "La Flor 23/24/25", sub: "3-floor private house, NE", angle: 40, dist: 148, color: "#e63030" },
    { label: "La Flor Unit 9", sub: "3rd-floor roof deck, direct LOS", angle: 88, dist: 148, color: "#e63030" },
    { label: "Central Antenna", sub: "Closest elevated RF emitter", angle: 148, dist: 136, color: "#e63030" },
    { label: "Crocs", sub: "Western observation post", angle: 210, dist: 148, color: "#e06020" },
    { label: "Vista Las Palmas", sub: "Tallest bldg in Jacó, top-floor", angle: 270, dist: 160, color: "#e06020" },
    { label: "Hotel Corner Unit", sub: "PRIMARY suspect — in-room BLE", angle: 320, dist: 136, color: "#cc0000" },
  ];

  const cx = 500, cy = 460;

  return (
    <div style={{ width: dim.w, height: dim.h, background: "#f5f4f0", fontFamily: "'Inter','Helvetica Neue',sans-serif", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#1a1a1a", height: 12, width: "100%", flexShrink: 0 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "52px 64px 44px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e63030" }} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.18em", color: "#888", textTransform: "uppercase" }}>Jacó Beach, Costa Rica — Field Documentation</span>
        </div>

        <div style={{ fontSize: 62, fontWeight: 900, lineHeight: 1.0, color: "#111", marginBottom: 16, letterSpacing: "-0.02em" }}>
          6 confirmed positions<br />surrounding Room 10.
        </div>
        <div style={{ fontSize: 25, color: "#555", marginBottom: 32, lineHeight: 1.5 }}>
          A foreign visitor in an isolated beach town, surrounded on all sides,<br />
          with all network traffic routed through cloud-managed hardware.
        </div>

        {/* SVG map */}
        <div style={{ flex: 1, display: "flex", gap: 48 }}>
          <svg width="480" height="380" viewBox="0 0 1000 760" style={{ flexShrink: 0 }}>
            {/* Ocean */}
            <rect x="740" y="0" width="260" height="760" fill="rgba(100,160,220,0.12)" />
            <text x="820" y="40" fontSize="22" fill="rgba(80,140,200,0.6)" fontWeight="600" fontFamily="monospace">OCEAN</text>

            {/* Hotel building */}
            <rect x="390" y="370" width="220" height="200" rx="8" fill="white" stroke="#ccc" strokeWidth="3" />
            <text x="500" y="440" textAnchor="middle" fontSize="18" fill="#888" fontFamily="monospace">HOTEL</text>
            <text x="500" y="464" textAnchor="middle" fontSize="18" fill="#888" fontFamily="monospace">POCHOTE</text>
            <text x="500" y="488" textAnchor="middle" fontSize="18" fill="#888" fontFamily="monospace">GRANDE</text>

            {/* Lines from Room 10 to each position */}
            {positions.map((p, i) => {
              const rad = (p.angle * Math.PI) / 180;
              const px2 = cx + Math.cos(rad) * p.dist * 1.6;
              const py2 = cy + Math.sin(rad) * p.dist * 1.6;
              return <line key={i} x1={cx} y1={cy} x2={px2} y2={py2} stroke={p.color} strokeWidth="2" strokeDasharray="8,5" opacity="0.6" />;
            })}

            {/* Position nodes */}
            {positions.map((p, i) => {
              const rad = (p.angle * Math.PI) / 180;
              const px2 = cx + Math.cos(rad) * p.dist * 1.6;
              const py2 = cy + Math.sin(rad) * p.dist * 1.6;
              return (
                <g key={i}>
                  <circle cx={px2} cy={py2} r={18} fill={p.color} opacity="0.9" />
                  <text x={px2} y={py2 + 5} textAnchor="middle" fontSize="17" fill="white" fontWeight="900" fontFamily="monospace">{i + 1}</text>
                </g>
              );
            })}

            {/* Room 10 */}
            <circle cx={cx} cy={cy} r={30} fill="#1a1a1a" />
            <circle cx={cx} cy={cy} r={22} fill="white" />
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fill="#1a1a1a" fontWeight="900" fontFamily="monospace">SAM</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#666" fontFamily="monospace">R10</text>

            {/* Compass */}
            <text x="920" y="720" fontSize="20" fill="#999" fontFamily="monospace" textAnchor="end">N ↑</text>
          </svg>

          {/* Legend */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            {positions.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontSize: 13, color: "white", fontWeight: 900, fontFamily: "monospace" }}>{i + 1}</span>
                </div>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{p.label}</div>
                  <div style={{ fontSize: 16, color: "#777", lineHeight: 1.3 }}>{p.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #ccc", paddingTop: 24, marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 19, color: "#444" }}>Forensic conclusion: hotel corner unit is primary source of in-room readings.</div>
          <div style={{ fontSize: 14, color: "#aaa", fontFamily: "monospace" }}>KAPPA · 10.0514°N 84.2187°W</div>
        </div>
      </div>
    </div>
  );
}

// ── SLIDE 3: THE DENIABILITY STACK ────────────────────────────────────────────
function JacoDeniabilityCard({ format }: { format: CardFormat }) {
  const dim = FORMAT_DIMENSIONS[format];

  const rows = [
    {
      observation: "Smoke / burning smell",
      cover: "Trash fires are common in Costa Rica",
      evidence: "Consistent timing with behavioral test windows. Serves as eye irritant + plausible cover for chemical exposure.",
      icon: "🔥",
    },
    {
      observation: "All-Ruijie/Reyee router network",
      cover: "Just cheap hotel WiFi gear",
      evidence: "4 Chinese cloud-managed devices. 3 with locally-administered (spoofed) MACs. Managed via reyee.ruijie.com.",
      icon: "📡",
    },
    {
      observation: "Truck CL273123 always outside",
      cover: "Normal delivery vehicle",
      evidence: "Path loss forensics: at 45m + 2 walls → expected −116 dBm. Recorded: −20 dBm. Delta = 96 dB impossible without a source within ~1.4m.",
      icon: "🚛",
    },
    {
      observation: "USB keyboard anomaly (device ID 10)",
      cover: "Standard hotel equipment",
      evidence: "Device ID 10 appears under pointer tree in udevadm — abnormal position in device enumeration for a keyboard.",
      icon: "⌨️",
    },
  ];

  return (
    <div style={{ width: dim.w, height: dim.h, background: "#faf9f6", fontFamily: "'Inter','Helvetica Neue',sans-serif", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#1a1a1a", height: 12, width: "100%", flexShrink: 0 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "52px 64px 44px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e63030" }} />
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.18em", color: "#888", textTransform: "uppercase" }}>Forensic Pattern Analysis · Jacó Beach</span>
        </div>

        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.0, color: "#111", marginBottom: 16, letterSpacing: "-0.02em" }}>
          Every anomaly has<br />a mundane explanation.
        </div>
        <div style={{ fontSize: 26, color: "#555", marginBottom: 36, lineHeight: 1.5 }}>
          That's not a coincidence. That's a design requirement.<br />
          <span style={{ fontWeight: 700, color: "#e63030" }}>Plausible deniability is a feature, not a bug.</span>
        </div>

        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1.6fr", gap: 0, marginBottom: 8 }}>
          {["OBSERVED", "OFFICIAL COVER", "WHAT THE DATA SHOWS"].map((h) => (
            <div key={h} style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.14em", color: "#aaa", textTransform: "uppercase", padding: "0 0 8px 16px", borderBottom: "2px solid #e0ddd8" }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1.6fr", gap: 0, borderBottom: "1px solid #e0ddd8", padding: "20px 0" }}>
              <div style={{ padding: "0 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 26, lineHeight: 1.2, flexShrink: 0 }}>{row.icon}</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: "#222", lineHeight: 1.35 }}>{row.observation}</span>
              </div>
              <div style={{ padding: "0 16px" }}>
                <span style={{ fontSize: 19, color: "#777", lineHeight: 1.4, fontStyle: "italic" }}>"{row.cover}"</span>
              </div>
              <div style={{ padding: "0 16px", borderLeft: "3px solid #e63030" }}>
                <span style={{ fontSize: 17, color: "#333", lineHeight: 1.5 }}>{row.evidence}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "2px solid #1a1a1a", paddingTop: 24, marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", letterSpacing: "0.02em" }}>
            4 independent anomalies. One coherent pattern.
          </div>
          <div style={{ fontSize: 14, color: "#aaa", fontFamily: "monospace" }}>KAPPA · 10.0514°N 84.2187°W</div>
        </div>
      </div>
    </div>
  );
}

const TEMPLATE_LIST: { id: CardTemplate; icon: typeof Shield; labelKey: string }[] = [
  { id: "kappa", icon: Shield, labelKey: "social.templateKappa" },
  { id: "satellite", icon: Satellite, labelKey: "social.templateSatellite" },
  { id: "correlation", icon: Zap, labelKey: "social.templateCorrelation" },
  { id: "domains", icon: Activity, labelKey: "social.templateDomains" },
  { id: "evening", icon: Eye, labelKey: "social.templateEvening" },
  { id: "quantum_ghz", icon: Atom, labelKey: "social.templateQuantumGhz" },
  { id: "quantum_sonnet", icon: Languages, labelKey: "social.templateQuantumSonnet" },
  { id: "quantum_apocalypse", icon: CircuitBoard, labelKey: "social.templateQuantumApocalypse" },
  { id: "quantum_bell", icon: Binary, labelKey: "social.templateQuantumBell" },
  { id: "paper_002", icon: Hexagon, labelKey: "social.templatePaper002" },
  { id: "paper_hall", icon: FlaskConical, labelKey: "social.templatePaperHall" },
  { id: "goose_protocol", icon: Bird, labelKey: "social.templateGoose" },
  { id: "demodex", icon: Bug, labelKey: "social.templateDemodex" },
  { id: "trilingual", icon: BookOpen, labelKey: "social.templateTrilingual" },
  { id: "canine_genome", icon: Dog, labelKey: "social.templateCanine" },
  { id: "jaco_blush", icon: Eye, labelKey: "social.templateJacoBlush" },
  { id: "jaco_environment", icon: Radio, labelKey: "social.templateJacoEnvironment" },
  { id: "jaco_deniability", icon: Shield, labelKey: "social.templateJacoDeniability" },
];

const FORMAT_LIST: { id: CardFormat; icon: typeof Square; labelKey: string }[] = [
  { id: "square", icon: Square, labelKey: "social.formatSquare" },
  { id: "portrait", icon: RectangleVertical, labelKey: "social.formatPortrait" },
  { id: "story", icon: Smartphone, labelKey: "social.formatStory" },
];

export default function SocialPage() {
  const { t } = useI18n();
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>("kappa");
  const [selectedFormat, setSelectedFormat] = useState<CardFormat>("square");
  const [isExporting, setIsExporting] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [captionData, setCaptionData] = useState<{ caption: string; hashtags: string[]; altText: string; fallback?: boolean } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: socialData, isLoading, isError } = useQuery<SocialCardData>({
    queryKey: ["/api/social/data"],
    refetchInterval: 30000,
  });

  const captionMutation = useMutation({
    mutationFn: async (template: string) => {
      const res = await apiRequest("POST", "/api/social/caption", { template });
      return res.json();
    },
    onSuccess: (data) => setCaptionData(data),
    onError: () => {
      setCaptionData(null);
    },
  });

  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const cardElement = cardRef.current.firstElementChild as HTMLElement;
      if (!cardElement) return;

      const dataUrl = await toPng(cardElement, {
        width: FORMAT_DIMENSIONS[selectedFormat].w,
        height: FORMAT_DIMENSIONS[selectedFormat].h,
        pixelRatio: 1,
        style: { transform: "none", width: `${FORMAT_DIMENSIONS[selectedFormat].w}px`, height: `${FORMAT_DIMENSIONS[selectedFormat].h}px` },
      });
      const link = document.createElement("a");
      link.download = `kappa-${selectedTemplate}-${selectedFormat}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [selectedTemplate, selectedFormat]);

  const dim = FORMAT_DIMENSIONS[selectedFormat];
  const previewW = dim.w * PREVIEW_SCALE;
  const previewH = dim.h * PREVIEW_SCALE;

  const renderCard = useCallback((template: CardTemplate, data: SocialCardData, fmt: CardFormat) => {
    switch (template) {
      case "kappa": return <KappaScoreCard data={data} format={fmt} />;
      case "satellite": return <SatelliteCard data={data} format={fmt} />;
      case "correlation": return <CorrelationCard data={data} format={fmt} />;
      case "domains": return <DomainCard data={data} format={fmt} />;
      case "evening": return <EveningWindowCard data={data} format={fmt} />;
      case "quantum_ghz": return <QuantumGhzCard format={fmt} />;
      case "quantum_sonnet": return <QuantumSonnetCard format={fmt} />;
      case "quantum_apocalypse": return <QuantumApocalypseCard format={fmt} />;
      case "quantum_bell": return <QuantumBellCard format={fmt} />;
      case "paper_002": return <Paper002Card format={fmt} />;
      case "paper_hall": return <PaperHallCard format={fmt} />;
      case "goose_protocol": return <GooseProtocolCard format={fmt} />;
      case "demodex": return <DemodexCard format={fmt} />;
      case "trilingual": return <TrilingualCard format={fmt} />;
      case "canine_genome": return <CanineGenomeCard format={fmt} />;
      case "jaco_blush": return <JacoBlushCard format={fmt} />;
      case "jaco_environment": return <JacoEnvironmentCard format={fmt} />;
      case "jaco_deniability": return <JacoDeniabilityCard format={fmt} />;
    }
  }, []);

  const gridTemplates: CardTemplate[] = ["paper_002", "goose_protocol", "canine_genome", "paper_hall", "demodex", "trilingual", "quantum_ghz", "quantum_sonnet", "quantum_apocalypse"];
  const gridItems = useMemo(() => {
    if (!socialData) return [];
    return gridTemplates.slice(0, 9).map((tmpl, i) => ({
      template: tmpl,
      key: `grid-${i}`,
    }));
  }, [socialData]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !socialData) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-social-title">{t("social.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("social.description")}</p>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm text-destructive" data-testid="text-social-error">{t("common.loadError")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cardData: SocialCardData = socialData;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-social-title">{t("social.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-social-description">{t("social.description")}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{t("social.preview")}</CardTitle>
                  <CardDescription className="text-xs font-mono">{dim.label}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showGrid ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowGrid(!showGrid)}
                    data-testid="button-toggle-grid"
                  >
                    <Grid3x3 className="h-4 w-4 mr-1" />
                    {t("social.gridView")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting}
                    data-testid="button-export-png"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                    {t("social.export")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!showGrid ? (
                <div className="flex justify-center">
                  <div
                    ref={cardRef}
                    style={{
                      width: previewW,
                      height: previewH,
                      overflow: "hidden",
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                    }}
                  >
                    <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left", width: dim.w, height: dim.h }}>
                      {renderCard(selectedTemplate, cardData, selectedFormat)}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-mono">{t("social.igGrid")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 max-w-[500px] mx-auto">
                    {gridItems.map((item) => (
                      <div
                        key={item.key}
                        className="aspect-square overflow-hidden rounded-[2px]"
                        style={{ border: "1px solid hsl(var(--border))" }}
                      >
                        <div style={{ transform: `scale(${160 / 1080})`, transformOrigin: "top left", width: 1080, height: 1080 }}>
                          {renderCard(item.template, cardData, "square")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("social.template")}</CardTitle>
              <CardDescription className="text-xs">{t("social.templateDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {TEMPLATE_LIST.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    selectedTemplate === tmpl.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  data-testid={`button-template-${tmpl.id}`}
                >
                  <tmpl.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{t(tmpl.labelKey as any)}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("social.format")}</CardTitle>
              <CardDescription className="text-xs">{t("social.formatDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {FORMAT_LIST.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    selectedFormat === fmt.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  data-testid={`button-format-${fmt.id}`}
                >
                  <fmt.icon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex items-center justify-between flex-1">
                    <span>{t(fmt.labelKey as any)}</span>
                    <span className="text-xs opacity-70 font-mono">{FORMAT_DIMENSIONS[fmt.id].label}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("social.liveData")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("social.dataEvents")}</span>
                <span className="font-mono font-semibold" data-testid="text-social-events">{cardData.totalEvents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("social.dataCorrelations")}</span>
                <span className="font-mono font-semibold" data-testid="text-social-correlations">{cardData.totalCorrelations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("social.dataSatellites")}</span>
                <span className="font-mono font-semibold" data-testid="text-social-satellites">{cardData.satelliteCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("social.dataKappa")}</span>
                <span className="font-mono font-semibold" data-testid="text-social-kappa">{(cardData.kappa?.score ?? 0).toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("social.dataDomains")}</span>
                <span className="font-mono font-semibold" data-testid="text-social-domains">{Object.keys(cardData.domainCounts).filter(k => cardData.domainCounts[k] > 0).length}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">{t("social.refreshNote")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t("social.aiCaption")}
              </CardTitle>
              <CardDescription className="text-xs">{t("social.aiCaptionDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                size="sm"
                className="w-full"
                onClick={() => captionMutation.mutate(selectedTemplate)}
                disabled={captionMutation.isPending}
                data-testid="button-generate-caption"
              >
                {captionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {captionMutation.isPending ? t("social.generating") : t("social.generateCaption")}
              </Button>

              {captionMutation.isError && (
                <p className="text-xs text-destructive font-mono pt-2 border-t" data-testid="text-caption-error">
                  {t("social.aiFallback")}
                </p>
              )}

              {captionData && !captionMutation.isError && (
                <div className="space-y-3 pt-2 border-t">
                  {captionData.fallback && (
                    <p className="text-xs text-amber-500 font-mono" data-testid="text-caption-fallback">{t("social.aiFallback")}</p>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{t("social.captionResult")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleCopy(captionData.caption, "caption")}
                        data-testid="button-copy-caption"
                      >
                        {copiedField === "caption" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <p className="text-xs whitespace-pre-line leading-relaxed bg-muted/50 rounded-md p-2 max-h-48 overflow-y-auto" data-testid="text-caption-content">
                      {captionData.caption}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{t("social.hashtags")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleCopy(captionData.hashtags.join(" "), "hashtags")}
                        data-testid="button-copy-hashtags"
                      >
                        {copiedField === "hashtags" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1" data-testid="text-hashtags-list">
                      {captionData.hashtags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] font-mono">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{t("social.altText")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleCopy(captionData.altText, "alt")}
                        data-testid="button-copy-alt"
                      >
                        {copiedField === "alt" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2" data-testid="text-alt-content">
                      {captionData.altText}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCopy(
                      `${captionData.caption}\n\n${captionData.hashtags.join(" ")}`,
                      "all"
                    )}
                    data-testid="button-copy-all"
                  >
                    {copiedField === "all" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copiedField === "all" ? t("social.copied") : t("social.copyAll")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
