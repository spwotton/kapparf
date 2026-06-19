import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { AlertTriangle, ExternalLink, Radio, Shield, Eye, Zap, Users, Clock } from "lucide-react";

export default function IsomorphicThreatPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10 font-serif">

      {/* Header */}
      <div className="space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap gap-2">
          <Badge variant="destructive" className="text-[10px] font-mono rounded-none tracking-widest">INTELLIGENCE SYNTHESIS</Badge>
          <Badge variant="outline" className="text-[10px] font-mono rounded-none tracking-widest">TRANSNATIONAL THREAT MODEL</Badge>
          <Badge variant="outline" className="text-[10px] font-mono rounded-none tracking-widest">JACÓ, COSTA RICA</Badge>
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground">
          Transnational Cyber-Physical Predation<br />
          <span className="text-muted-foreground font-normal">An Isomorphic Analysis of the Costa Rican Threat Landscape</span>
        </h1>
        <p className="text-sm text-muted-foreground font-mono">June 19, 2026 · Jacó Beach, Puntarenas, Costa Rica · KAPPA SIGINT Platform</p>
        <p className="text-base text-foreground leading-relaxed">
          Costa Rica's geopolitical position has made it a nexus for sophisticated multi-jurisdictional intelligence operations.
          Forensic operational analysis of the Hotel Pochote Grande environment reveals a deeply embedded parallel architecture
          — transnational networks employing psychoacoustic surveillance, SIGINT, and coordinated psychological decomposition
          tactics that mirror the historical methodologies of state intelligence apparatuses, hybridized for the digital age.
        </p>
      </div>

      {/* Operatives Table */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-destructive" />
          <h2 className="text-lg font-bold tracking-tight">Confirmed Operative Semiotic Matrix</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Three confirmed operatives bearing standardized right-thigh tattoos functioning as hierarchical ownership markers,
          network identifiers, and operational signaling mechanisms.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">Operative / Origin</th>
                <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">Tattoo</th>
                <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">Semiotic Signal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="px-3 py-3 align-top">
                  <p className="font-semibold text-foreground">Adriana Victoria Fuentes Gomes</p>
                  <p className="text-xs text-muted-foreground">Margarita Island, Venezuela · Aurora Yoga, Jacó</p>
                </td>
                <td className="px-3 py-3 align-top text-muted-foreground">Blue Wolf<br /><span className="text-xs">(geometric line-art)</span></td>
                <td className="px-3 py-3 align-top text-muted-foreground text-xs leading-relaxed">Pack loyalty signal. Asset "protected by the collective." Mirrors structural dynamics of Venezuelan <em>colectivo</em> organizations and paramilitary intelligence networks.</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-3 py-3 align-top">
                  <p className="font-semibold text-foreground">Genesis Peralta</p>
                  <p className="text-xs text-muted-foreground">Petare, Caracas, Venezuela · La Flor Unit 9</p>
                </td>
                <td className="px-3 py-3 align-top text-muted-foreground">Deer with Roses</td>
                <td className="px-3 py-3 align-top text-muted-foreground text-xs leading-relaxed">"Prey that knows it is prey." Hunted innocence / Christian martyrdom iconography. Asset fully aware of their status in the trafficking or intelligence hierarchy — functioning under severe coercion.</td>
              </tr>
              <tr className="bg-destructive/5 border-b border-destructive/20">
                <td className="px-3 py-3 align-top">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    Alejandra Vidal
                    <Badge variant="destructive" className="text-[9px] px-1 py-0 font-mono">CONFIRMED Jun 19</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">@alevida1989</p>
                </td>
                <td className="px-3 py-3 align-top text-muted-foreground">Theater Mask<br /><span className="text-xs">(comedy/tragedy)</span></td>
                <td className="px-3 py-3 align-top text-muted-foreground text-xs leading-relaxed">Humiliation Movie paradigm signature. Orchestrated performance as psychological decomposition weapon. Physical mask worn June 19, 2026 — geometrically confirmed match to tattoo. Eliminates all plausible deniability.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Standardized breast augmentation ("Barbie" aesthetic) documented across all three subjects. Centralized controller financing creates permanent medical record trail anchoring identities to geographic and temporal nodes.
        </p>
      </section>

      <Separator />

      {/* Humiliation Movie */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-amber-500" />
          <h2 className="text-lg font-bold tracking-tight">The Humiliation Movie Paradigm</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The surveillance operation targeting Echo is not merely an intelligence-gathering exercise. It is a distributed,
          reality-television-style psychological torture mechanism — designated the "Humiliation Movie" hypothesis.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Covert Recording", body: "Continuous capture of target behavior, private moments, and reactions using pre-positioned optical and acoustic sensors within the hospitality environment." },
            { label: "Reality Mining", body: "Collection of technology-based behavioral metadata — location, timing, physiological response — to build a predictive model of the target's cognitive state." },
            { label: "Orchestrated Encounters", body: "Manufactured social situations designed to fabricate compromising material (kompromat) while maintaining the appearance of organic interaction." },
            { label: "Gamified Surveillance", body: "Variable-ratio reinforcement mechanism: operatives receive immediate feedback from target responses, making observation behaviorally addictive — identical to the slot-machine mechanism." },
          ].map((item, i) => (
            <Card key={i} className="border">
              <CardContent className="pt-4 pb-4 space-y-1.5">
                <p className="text-xs font-mono font-semibold uppercase tracking-widest text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The theater mask iconography communicates the framework explicitly: <em>the performance is the weapon</em>. Knowing you are
          being watched while watching yourself is the mechanism of cognitive decomposition. Alejandra Vidal wearing the physical
          mask on June 19 was a deliberate semiotic activation — confirming the operation is live and the target is aware they are
          being filmed.
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          PARALLEL: Israeli military "Blue Wolf" gamified biometric surveillance program — soldiers compete to photograph Palestinians;
          prizes awarded to most prolific units. Same variable-ratio reinforcement mechanism.
        </p>
      </section>

      <Separator />

      {/* Signal Degradation Pipeline */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-cyan-400" />
          <h2 className="text-lg font-bold tracking-tight">Signal Degradation Pipeline — 4-Layer Architecture</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The auditory harassment component of the operation runs through a documented four-stage synthesis and injection pipeline
          designed to maximize psychological impact while maintaining plausible deniability against standard forensic analysis.
        </p>
        <div className="space-y-2">
          {[
            {
              phase: "01 · SOURCE INPUT",
              tech: "Live or recorded Spanish language audio",
              color: "border-l-slate-500",
              fn: "Foundational linguistic raw material captured from the target's immediate environment or the stalker's local communication network."
            },
            {
              phase: "02 · CRYPTOGRAPHIC INTERSTITIAL",
              tech: "Morse Code Translation",
              color: "border-l-amber-500",
              fn: "Three functions: (a) Homage to Cold War numbers stations — signals state-level capability; (b) Degrades signal to evade acoustic anomaly detection; (c) Psychological warfare — cognitive burden of 'someone is always listening.'"
            },
            {
              phase: "03 · PROCESSING LAYER",
              tech: "BART Model (Facebook/Meta seq2seq)",
              color: "border-l-blue-500",
              fn: "Advanced open-source sequence-to-sequence model. Strategic use of open-source provides plausible deniability — audited infrastructure can dismiss BART as benign NLP research."
            },
            {
              phase: "04 · INJECTION LAYER",
              tech: "Synthetic Voice Synthesis — voices.gator.com / Resemble AI",
              color: "border-l-red-500",
              fn: "Processed text converted to highly realistic synthetic audio via advanced voice cloning. Encoder-decoder architecture captures vocal characteristics and emotional prosody. Injected directly into localized network — cloned voices mimic family members, trusted associates, or the operatives themselves."
            },
          ].map((stage, i) => (
            <div key={i} className={`border-l-2 pl-4 py-2 ${stage.color}`}>
              <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{stage.phase}</p>
              <p className="text-sm font-semibold text-foreground mb-1">{stage.tech}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{stage.fn}</p>
            </div>
          ))}
        </div>
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Brainwave Entrainment:</span> The system generates a carrier frequency of 53.0 Hz.
              Against Costa Rica's 60 Hz AC grid, this produces a 7.0 Hz beat frequency — the center of the human Theta brainwave band (4–8 Hz).
              Sustained exposure induces chronic fatigue and cognitive susceptibility.
              Operating in tandem: the <span className="font-semibold text-foreground">Frey Effect (Microwave Auditory Effect)</span> — pulsed microwave
              beams modulated at speech-formant frequencies (2004 Hz, 2511 Hz) project synthesized audio directly to the auditory cortex via
              thermoelastic pressure waves, bypassing the eardrum entirely.
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Hospitality Infrastructure */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-violet-400" />
          <h2 className="text-lg font-bold tracking-tight">Hospitality Infrastructure as Operational Theater</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Hotel Pochote Grande is assessed as operating under the "empty when occupied" paradigm — a classic intelligence safe house
          configuration. The ownership structure (German-connected, corporate shell) facilitates a completely controlled environment.
          When the target occupies the facility, the property claims to be empty. This contradiction is the operation itself.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {[
            { label: "Pre-wired monitoring", body: "Optical and acoustic sensors embedded in room infrastructure prior to target routing." },
            { label: "Access without audit trail", body: "Management cover provides deniable physical access to target's space outside scheduled cleaning windows." },
            { label: "Bilateral geometry", body: "Internal corner unit operative + external antenna post creates full-envelope coverage with no blind angle." },
            { label: "Psychological double-bind", body: "Target's reality contradicts official narrative. Attempting to verify drives further engagement with the surveillance puzzle — this is the intended effect." },
          ].map((item, i) => (
            <Card key={i} className="border">
              <CardContent className="pt-3 pb-3 space-y-1">
                <p className="font-mono font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Ratline Continuum */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-bold tracking-tight">Geographic-Historical Recursion: The Ratline Continuum</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The operational methodologies documented at Hotel Pochote Grande represent the terminal evolution of intelligence
          lineages tracing directly to the mid-20th century:
        </p>
        <div className="space-y-3 text-sm text-muted-foreground">
          {[
            { era: "1945–1955", label: "Nazi Ratlines → Costa Rica", body: "SS Feldmeier brothel networks and Salon Kitty surveillance operations provided foundational architecture for sexual compromise operations. Evasion routes terminated predominantly in South and Central America. Costa Rica's non-extradition status for political/intelligence offenses made it structurally attractive." },
            { era: "1950–1989", label: "Stasi Zersetzung Programs", body: "East German perfection of psychological decomposition — deploying seduction agents (Romeo/Swallow) to systematically dismantle targets through sexual entrapment, reality manipulation, and social network destruction." },
            { era: "1960–1990", label: "Gladio / Italian Reality Mining", body: "NATO stay-behind networks and Telespazio/Leonardo S.p.A. private humiliation filming operations. Continuous cyber-espionage and satellite intercept capabilities." },
            { era: "1990–present", label: "FSB/SVR Swallows + SEBIN Hybridization", body: "Russian refinement of female honeypots for kompromat manufacturing. Venezuelan SEBIN adaptation leveraging the regional migration crisis as logistical cover for deploying compromise assets into Costa Rica's hospitality sector." },
            { era: "2026", label: "Costa Rica: Hybridized Operational Theater", body: "All lineages merged. Stasi psychological decomposition + SEBIN compromise assets + Italian private humiliation filming + modern AI/SDR technical infrastructure. Hotel Pochote Grande, Jacó Beach is the current physical staging ground." },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-20 text-right">
                <span className="text-[10px] font-mono text-muted-foreground/50">{item.era}</span>
              </div>
              <div className="border-l border-border/60 pl-4 pb-4 flex-1">
                <p className="font-semibold text-foreground text-sm mb-1">{item.label}</p>
                <p className="leading-relaxed text-xs">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Mesh / 3i ATLAS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <h2 className="text-lg font-bold tracking-tight">3i ATLAS Surveillance Mesh — Technical Infrastructure</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The technical backbone delivering synthetic auditory payloads and maintaining localized cyber-physical predation
          relies on a weaponized mesh architecture achieving total digital and physical dominance over the target's environment.
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Rogue mesh nodes:</span> Standard TP-Link Deco units reconfigured
            via MAC-spoofing to operate as ghost nodes, invisibly bridging the target's internal network with adjacent surveillance posts.
            Bypasses WPA3 encryption and hardware firewalls without triggering standard intrusion detection.
          </p>
          <p>
            <span className="font-semibold text-foreground">Passive capture infrastructure:</span> SDR receivers and WiFi Pineapple
            units operating from vehicles permanently parked in the immediate vicinity. Continuous packet capture and network mapping.
          </p>
          <p>
            <span className="font-semibold text-foreground">Electrical infrastructure hijack:</span> Eaton breaker panels and Visonic
            alarm system vulnerabilities exploited to repurpose house wiring as a localized antenna array for electromagnetic and
            psychoacoustic signal injection directly into the living space.
          </p>
          <p>
            <span className="font-semibold text-foreground">Biometric calibration:</span> r-PPG cameras extract real-time Heart Rate
            Variability from microscopic skin color fluctuations. Thermal imaging maps facial temperature drops (sympathetic vasoconstriction).
            Nicotine inhalation events used as immutable biometric anchor timestamps for sensor calibration — a closed-loop system
            with "devastating accuracy."
          </p>
        </div>
      </section>

      <Separator />

      {/* Alert */}
      <Card className="bg-destructive/5 border-destructive/30">
        <CardContent className="pt-4 pb-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm font-semibold">Operational Status — June 19, 2026</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Alejandra Vidal (@alevida1989) confirmed wearing physical theater mask in person today — matching permanent right-thigh tattoo.
            Identity of the anchor operative is now forensically established across two independent capture events.
            KAPPA Kappa Score: ELEVATED. 34-day documentation record intact and SHA-256 verified.
          </p>
        </CardContent>
      </Card>

      {/* Footer nav */}
      <div className="flex flex-wrap gap-4 pt-2 text-xs font-sans">
        <Link href="/tattoo-branding" data-testid="link-tattoo"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground underline underline-offset-2">
          Operative Physical Marker Analysis <ExternalLink className="w-3 h-3" />
        </Link>
        <Link href="/pochote-headliner" data-testid="link-pochote"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground underline underline-offset-2">
          30 Days at Hotel Pochote Grande <ExternalLink className="w-3 h-3" />
        </Link>
        <Link href="/network-analysis" data-testid="link-network"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground underline underline-offset-2">
          HUMINT Network Analysis <ExternalLink className="w-3 h-3" />
        </Link>
        <Link href="/evidence-chain" data-testid="link-evidence"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground underline underline-offset-2">
          Evidence Chain <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

    </div>
  );
}
