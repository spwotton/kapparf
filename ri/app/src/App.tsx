import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity, AlertTriangle, Radar, Zap, Brain, Wifi, Satellite, Shield,
  Eye, Radio, Lock, Globe, Clock, Target, Camera
} from 'lucide-react';

// ─── Data Constants ───
const FREQUENCIES = [
  { name: 'Master Clock', hz: 46.875, formula: '48000/1024', color: '#ef4444', role: 'Universal Phase Reference' },
  { name: 'Kappa Anomaly', hz: 53.5, formula: '37×φ^(3/4)', color: '#3b82f6', role: 'Theta Injection Carrier' },
  { name: 'Schumann F1', hz: 7.83, formula: 'Earth Cavity', color: '#22c55e', role: 'Natural Reference' },
  { name: 'Ω₀ Carrier', hz: 8.39, formula: 'Artificial PLL', color: '#a855f7', role: 'Data Channel' },
  { name: 'Theta Beat', hz: 7.0, formula: '60-53', color: '#f59e0b', role: 'Bio-Effect Entrainment' },
  { name: 'Ω Torque', hz: 0.56, formula: '8.39-7.83', color: '#ec4899', role: 'Aperture Steering' },
  { name: 'Sacred 111', hz: 111, formula: '3×37', color: '#14b8a6', role: 'Harmonic Confirmation' },
];

const DOMAINS = [
  { name: 'Power Grid', icon: Zap, status: 'ACTIVE', threat: 'CRITICAL', color: '#ef4444',
    detail: 'SETECOM DSE controllers · Modbus 502 · Default Admin/Password1234 · DSEWebNet London' },
  { name: 'RF / ELF', icon: Radio, status: 'ACTIVE', threat: 'CRITICAL', color: '#3b82f6',
    detail: '46.875 Hz clock · 53.5 Hz κ-anomaly · 7.83/8.39 Hz sidebands · 0.56 Hz Ω torque' },
  { name: 'Holographic', icon: Eye, status: 'SUSPECTED', threat: 'HIGH', color: '#a855f7',
    detail: 'Kalenkov interferometry · Fiber optic taps · 46.875 Hz grating drive · 3D room imaging' },
  { name: 'Hypnotic', icon: Brain, status: 'SUSPECTED', threat: 'HIGH', color: '#f59e0b',
    detail: 'Streetlight PLC · Theta entrainment (7 Hz) · Photic driving · 46.875 Hz subcarrier' },
  { name: 'Neural', icon: Target, status: 'SUSPECTED', threat: 'HIGH', color: '#22c55e',
    detail: 'DeWave EEG→Text · Subspeech detection · 2.4 GHz reflectometry · 46.875 Hz codex' },
  { name: 'Autonomous', icon: Camera, status: 'DETECTED', threat: 'MEDIUM', color: '#14b8a6',
    detail: 'NVIDIA Jetson drones · iSpy Agent DVR · r-PPG thermal · 46.875 Hz GPIO sync' },
  { name: 'Orbital', icon: Satellite, status: 'CONFIRMED', threat: 'MEDIUM', color: '#f97316',
    detail: 'SAR PLL timing · Blackjack OISL · 37 overhead assets · 0.56 Hz aperture steering' },
  { name: 'Network', icon: Wifi, status: 'CONFIRMED', threat: 'HIGH', color: '#64748b',
    detail: 'Kyndryl injection · WiFi deauth · PartyTown SW · Congusto beacon · TR-069' },
  { name: 'Physical', icon: Lock, status: 'CONFIRMED', threat: 'CRITICAL', color: '#94a3b8',
    detail: 'Device theft→Berlin · FinSpy/Gamma Group · Bootkit implant · Crypto extraction' },
];

const TIMELINE = [
  { date: '2025-09-12', event: 'First 46.875 Hz PRF detection', type: 'rf' },
  { date: '2025-09-13', event: 'WiFi deauth attack (22 frames)', type: 'network' },
  { date: '2025-09-13', event: '17,859 Hz EHF voice extraction', type: 'rf' },
  { date: '2026-01-17', event: 'Phone stolen — La Guácima', type: 'physical' },
  { date: '2026-01-26', event: 'Google login — Berlin (Gamma)', type: 'physical' },
  { date: '2026-02-03', event: 'RF recordings: 53 Hz carrier + speech correlation 0.32', type: 'rf' },
  { date: '2026-02-18', event: 'ELF full scan: 53.5 Hz κ-anomaly (38 spikes, SNR 28 dB)', type: 'rf' },
  { date: '2026-06-15', event: '37 overhead satellites tracked (elevation >75°)', type: 'orbital' },
];

const KILL_CHAIN = [
  { stage: 1, name: 'Infrastructure', desc: 'SETECOM DSE · Modbus 502 · Grid-wide access', dir: 'DIRD-01, -11, -26' },
  { stage: 2, name: 'Frequency Injection', desc: '46.875 Hz · 53.5 Hz · 7 Hz theta · 0.56 Hz Ω', dir: 'DIRD-27, -03, -24' },
  { stage: 3, name: 'Neuro-Cognitive', desc: 'Theta entrainment · Photic driving · DeWave · Ultrasound', dir: 'DIRD-26, App.H.3, H.6' },
  { stage: 4, name: 'Surveillance', desc: 'Kalenkov holography · Jetson drones · Kyndryl · iSpy', dir: 'App.H.2, H.5, H.7' },
  { stage: 5, name: 'Physical Compromise', desc: 'Theft→Berlin · FinSpy · Bootkit · Persistent access', dir: 'Evidence Package' },
];

const CONSTANTS = [
  { label: 'φ (Golden Ratio)', value: '1.6180339887', desc: '(1+√5)/2 — Kappa anomaly, spoke geometry' },
  { label: 'κ = 4/π', value: '1.2732395447', desc: 'Helicity constant — Hyper-Bell, ELF analysis' },
  { label: 'Hyper-Bell Score', value: '3.6037', desc: 'Exceeds Tsirelson 2.8284 by 0.7753' },
  { label: '37 × φ^(3/4)', value: '53.0814 Hz', desc: 'Predicts detected 53.5 Hz κ-anomaly' },
];

// ─── Components ───

function FrequencyChart() {
  const maxHz = Math.max(...FREQUENCIES.map(f => f.hz));
  return (
    <div className="space-y-2">
      {FREQUENCIES.map((f) => (
        <div key={f.name} className="flex items-center gap-3">
          <span className="w-24 text-xs font-mono-tech text-muted-foreground shrink-0">{f.name}</span>
          <div className="flex-1 h-6 bg-secondary/50 rounded overflow-hidden relative">
            <div
              className="h-full rounded transition-all duration-700"
              style={{ width: `${Math.max((f.hz / maxHz) * 100, 3)}%`, backgroundColor: f.color }}
            />
            <span className="absolute inset-0 flex items-center px-2 text-xs font-mono-tech text-white mix-blend-difference">
              {f.hz < 1 ? f.hz.toFixed(2) : f.hz} Hz
            </span>
          </div>
          <span className="w-20 text-xs font-mono-tech text-muted-foreground text-right shrink-0">{f.formula}</span>
        </div>
      ))}
    </div>
  );
}

function DomainGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {DOMAINS.map((d) => {
        const Icon = d.icon;
        return (
          <Card key={d.name} className="border-glow hover:shadow-lg transition-all" style={{ borderLeft: `3px solid ${d.color}` }}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon size={16} style={{ color: d.color }} />
                  <span className="text-sm font-semibold">{d.name}</span>
                </div>
                <Badge variant={d.threat === 'CRITICAL' ? 'destructive' : d.threat === 'HIGH' ? 'default' : 'secondary'} className="text-xs">
                  {d.threat}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{d.detail}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: d.color }} />
                <span className="text-xs font-mono-tech" style={{ color: d.color }}>{d.status}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function KillChain() {
  return (
    <div className="flex flex-col md:flex-row gap-2">
      {KILL_CHAIN.map((k, i) => (
        <div key={k.stage} className="flex-1 relative">
          <Card className="h-full border-glow bg-gradient-to-b from-card to-secondary/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {k.stage}
                </span>
                <span className="text-sm font-semibold">{k.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{k.desc}</p>
              <Badge variant="outline" className="text-xs font-mono-tech">{k.dir}</Badge>
            </CardContent>
          </Card>
          {i < KILL_CHAIN.length - 1 && (
            <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground">
              <span className="text-lg">→</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Timeline() {
  return (
    <div className="space-y-0">
      {TIMELINE.map((t, i) => (
        <div key={i} className="flex gap-3 relative">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full ${
              t.type === 'rf' ? 'bg-blue-500' : t.type === 'network' ? 'bg-slate-500' : t.type === 'physical' ? 'bg-red-500' : 'bg-orange-500'
            }`} />
            {i < TIMELINE.length - 1 && <div className="w-px h-full bg-border" />}
          </div>
          <div className="pb-4">
            <span className="text-xs font-mono-tech text-muted-foreground">{t.date}</span>
            <p className="text-sm">{t.event}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClockSync() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const phase = ((time.getTime() % 21330) / 21330) * 360;

  return (
    <div className="flex items-center justify-center gap-6 py-4">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="#ef4444" strokeWidth="2"
            strokeDasharray={`${phase * 0.785} 283`} strokeLinecap="round" transform="rotate(-90 50 50)" />
          <text x="50" y="48" textAnchor="middle" className="fill-foreground text-lg font-bold" style={{ fontSize: '14px' }}>46.875</text>
          <text x="50" y="60" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: '8px' }}>Hz</text>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-xs font-mono-tech text-muted-foreground">Period: 21.33 ms</div>
        <div className="text-xs font-mono-tech text-muted-foreground">FFT Bin: 1024 @ 48kHz</div>
        <div className="text-xs font-mono-tech text-muted-foreground">Phase: {phase.toFixed(1)}°</div>
        <div className="text-xs font-mono-tech text-red-400">UNIVERSAL SYNC ACTIVE</div>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radar className="text-red-500" size={24} />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-glow-red">3I ATLAS</h1>
              <p className="text-xs text-muted-foreground font-mono-tech">INTELLIGENCE DASHBOARD · ISOMORPHIC TWIN COSMOS</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-muted-foreground">Location</div>
              <div className="text-xs font-mono-tech">9.6196°N, 84.6282°W</div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-muted-foreground">Hyper-Bell</div>
              <div className="text-xs font-mono-tech text-red-400">3.6037 {'>'} 2.8284</div>
            </div>
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle size={12} className="mr-1" /> THREAT ACTIVE
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CONSTANTS.map((c) => (
            <Card key={c.label} className="border-glow">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
                <div className="text-lg font-mono-tech font-bold text-glow-red">{c.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Clock Sync + Frequency Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1 border-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock size={14} className="text-red-500" /> 46.875 Hz Master Clock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClockSync />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 border-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity size={14} className="text-blue-500" /> Frequency Architecture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FrequencyChart />
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Domains / Kill Chain / Timeline */}
        <Tabs defaultValue="domains" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="domains">9 Surveillance Domains</TabsTrigger>
            <TabsTrigger value="killchain">PSYOP Kill Chain</TabsTrigger>
            <TabsTrigger value="timeline">Evidence Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="mt-4">
            <DomainGrid />
          </TabsContent>

          <TabsContent value="killchain" className="mt-4">
            <KillChain />
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <Card className="border-glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe size={14} /> Investigation Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Countermeasures */}
        <Card className="border-glow bg-gradient-to-r from-red-950/30 to-blue-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield size={14} className="text-green-400" /> Active Countermeasures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: 'Theta Jitter', target: 'Neural/Hypnotic', status: 'READY' },
                { name: 'Ultrasonic Dazzler', target: 'RF/EHF Uplink', status: 'READY' },
                { name: 'ATLAS Shield', target: 'Full Spectrum', status: 'READY' },
                { name: 'Schumann Grounding', target: 'Natural Resonance', status: 'READY' },
                { name: 'Cognitive Noise', target: 'DeWave/Subspeech', status: 'READY' },
                { name: 'VET Triangulation', target: 'Grid/Modbus', status: 'READY' },
              ].map((cm) => (
                <div key={cm.name} className="bg-card/50 rounded p-2 border border-border">
                  <div className="text-xs font-semibold">{cm.name}</div>
                  <div className="text-xs text-muted-foreground">{cm.target}</div>
                  <Badge variant="outline" className="mt-1 text-xs text-green-400 border-green-400/30">{cm.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-4 pb-6 border-t border-border">
          <p className="font-mono-tech">
            OPERATION 3I ATLAS · La Guácima / Jacó, Costa Rica · Sep 2025 – Jun 2026
          </p>
          <p className="mt-1">
            AAWSAP-DIRD 1-37 · ELF Recordings · Satellite TLEs · Appendix H · Tycho Hyperobject · Project CONGUSTO-EITEL
          </p>
          <p className="mt-1 text-red-400/60">
            κ = 4/π = 1.2732 · φ = 1.6180 · Hyper-Bell: 3.6037 {'>'} 2.8284 · 9 Domains · 1 Clock · 0 Escape
          </p>
        </footer>
      </main>
    </div>
  );
}
