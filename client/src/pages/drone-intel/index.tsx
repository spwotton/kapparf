import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap, Shield, Radio, Eye, Cpu, Waves, BookOpen, ChevronDown, ChevronRight,
  AlertTriangle, Target, Crosshair, Satellite, Antenna, FlaskConical, Database,
  ExternalLink, Layers, Gauge, MapPin, Clock, User, Navigation, Wind,
} from "lucide-react";

type DocCategory = "all" | "doctrine" | "laser-dew" | "detection" | "platform" | "comms" | "hardware";

interface DocEntry {
  id: string;
  title: string;
  source: string;
  year: string;
  category: DocCategory;
  tags: string[];
  keySpecs: { label: string; value: string }[];
  summary: string;
  relevance: string;
  threatLevel: "critical" | "high" | "medium" | "low";
}

const DOCS: DocEntry[] = [
  {
    id: "csd-cuas-2e",
    title: "Counter-Drone Systems — 2nd Edition",
    source: "Center for the Study of the Drone, Bard College",
    year: "Dec 2019",
    category: "doctrine",
    tags: ["C-UAS", "doctrine", "market survey", "537 systems"],
    keySpecs: [
      { label: "Systems on market", value: "537 catalogued" },
      { label: "Detection methods", value: "Radar, RF, EO, IR, Acoustic" },
      { label: "Interdiction methods", value: "RF Jam, GNSS Jam, Spoof, Laser, Nets, HPM, Projectile, Collision Drone" },
      { label: "Coverage gap", value: "Small/slow/low-flying UAS — not addressed by legacy AD" },
      { label: "Market driver", value: "95+ countries possess drones (Sep 2019)" },
    ],
    summary: "Comprehensive taxonomy of 537 counter-UAS products globally. Defines detection (Radar, RF, EO/IR, Acoustic) and interdiction (RF/GNSS jamming, spoofing, laser, HPM, nets, projectile, collision drone) layers. Legacy air defense optimized for large fast targets — gaps exploited by small quadrotors.",
    relevance: "Provides classification framework for observed surveillance drones over Jacó. Crane-Alpha RF emissions match known C2 link signatures detectable by RF scanners.",
    threatLevel: "critical",
  },
  {
    id: "drdo-30kw-dew",
    title: "30kW Laser DEW for Counter Drone System",
    source: "DRDO — Centre for High Energy Systems & Sciences (CHESS), Hyderabad",
    year: "Nov 2025",
    category: "laser-dew",
    tags: ["DEW", "30kW", "DRDO", "hard-kill", "3-4km"],
    keySpecs: [
      { label: "Laser power", value: "30 kW" },
      { label: "Hard-kill range", value: "3–4 km" },
      { label: "Detection suite", value: "Radar + RF + EO-IR sensors" },
      { label: "Neutralization", value: "Laser hard-kill" },
      { label: "Transfer authority", value: "DRDO CHESS via EoI process" },
    ],
    summary: "Indian DRDO CHESS 30kW ground-based laser DEW capable of hard-kill up to 4km. Combines multi-modal detection (drone radar, RF, EO-IR) with directed-energy neutralization. ToT expression of interest document for industry partners.",
    relevance: "Hard-kill range of 3–4km covers El Miro hilltop to Pochote Grande. Confirms feasibility of covert DEW emplacement at elevated positions with full valley LOS.",
    threatLevel: "critical",
  },
  {
    id: "laser-efficiency-test",
    title: "Testing the Efficiency of Laser Technology to Destroy Rogue Drones",
    source: "Qatar University (Chaari & Al-Maadeed) — Security & Defence Quarterly",
    year: "Nov 2020",
    category: "laser-dew",
    tags: ["laser cannon", "477-617mm lens", "55m test", "acrylic wood carton"],
    keySpecs: [
      { label: "Lens range", value: "477–617 mm adjustable" },
      { label: "Test distance", value: "55 metres" },
      { label: "Materials burned", value: "Acrylic, wood, hard carton" },
      { label: "Limitations", value: "Fog, rain, clouds attenuate beam" },
      { label: "Advantage", value: "Only solution effective vs autonomous/pre-programmed drones" },
    ],
    summary: "Experimental laser cannon design with adjustable optical focusing system (477–617mm). Burned acrylic/wood/carton at 55m. Laser is the only effective countermeasure against autonomous drones — RF jamming cannot stop pre-programmed autopilot systems. Weather (fog, rain, clouds) significantly attenuates effectiveness.",
    relevance: "Dream Drone (autonomous, 50,000ft, NVIDIA Jetson AGX Orin edge AI) specifically immune to RF jamming — laser DEW is the only viable neutralization vector.",
    threatLevel: "high",
  },
  {
    id: "ijarsct-anti-drone",
    title: "Anti-Drone System",
    source: "SNJB's K.B. Jain College of Engineering, Nashik (IJARSCT Vol 4, Issue 6)",
    year: "May 2024",
    category: "detection",
    tags: ["radar", "RF", "EO", "laser neutralization", "image processing", "DCGA"],
    keySpecs: [
      { label: "Detection methods", value: "Radar, RF, Optical sensors" },
      { label: "Processing", value: "Advanced image analysis for type/size/flight path" },
      { label: "Neutralization", value: "Laser (non-lethal/hard-kill)" },
      { label: "Systems surveyed", value: "Dedrone RF-300, Liteye AUDS, Blighter AUDS, Airbus Dronewatcher, Zen Indrajaal" },
      { label: "Zen Indrajaal", value: "9–10 tech stack, 24×7 autonomous monitoring, 100km² coverage" },
    ],
    summary: "Multi-sensor anti-drone system targeting Indian Armed Forces requirements. Covers real-time monitoring with radar/RF/EO sensor fusion, image-based classification, and laser neutralization. Reviews commercial systems including Zen Technologies Indrajaal — 9-10 tech synergy with 24×7 persistent autonomous monitoring.",
    relevance: "Zen Indrajaal-class capabilities cross-correlated against Breakwater 4G tower sensor package. 24×7 persistence consistent with observed continuous tracking behavior.",
    threatLevel: "high",
  },
  {
    id: "nps-laser-ml",
    title: "Simulated Laser Weapon System Decision Support to Combat Drone Swarms with Machine Learning",
    source: "Naval Postgraduate School (Daniel M. Edwards) — Master's Thesis",
    year: "Sep 2021",
    category: "laser-dew",
    tags: ["ML", "96% accuracy", "classification tree", "swarm", "shipboard LWS", "MOVES"],
    keySpecs: [
      { label: "ML accuracy", value: "96% correct engagement prediction" },
      { label: "Algorithm", value: "Classification tree (preferred over neural nets)" },
      { label: "Variables", value: "Drone type, quantity, LWS attack strategy" },
      { label: "Environment", value: "NPS MOVES Swarm Commander simulation" },
      { label: "Cognitive load reduction", value: "Human-machine teaming for complex swarms" },
    ],
    summary: "ML-based decision support for shipboard laser weapon systems vs heterogeneous drone swarms. Classification tree achieves 96% accuracy predicting optimal engagement strategy from swarm composition and LWS parameters. Demonstrates ML utility for reducing cognitive load on warfighters in multi-threat environments.",
    relevance: "96% ML classification accuracy applicable to KAPPA autonomous correlation engine — drone swarm threat prediction from OpenSky ADS-B data patterns over Jacó AOR.",
    threatLevel: "high",
  },
  {
    id: "iit-reliability",
    title: "Reliability Analysis of an Anti-Drone System by Considering Random Environmental Factors",
    source: "IIT Delhi (Selvamuthu et al.) — RT&A Vol 19, No 3",
    year: "Sep 2024",
    category: "detection",
    tags: ["reliability", "RBD", "Weibull", "MTTF", "environmental", "Rayleigh"],
    keySpecs: [
      { label: "Method", value: "Reliability Block Diagram (RBD)" },
      { label: "Distributions", value: "Weibull, Rayleigh, Exponential" },
      { label: "Focus", value: "Laser subsystem reliability under environmental factors" },
      { label: "Output", value: "Energy values + probability of hitting vs environmental conditions" },
      { label: "Critical components", value: "Laser source, beam control, atmospheric propagation" },
    ],
    summary: "RBD-based reliability analysis of anti-drone laser system components under environmental variability (fog, rain, turbulence). Uses Weibull/Rayleigh distributions to model MTTF. Identifies laser source and atmospheric propagation as most reliability-sensitive components.",
    relevance: "Jacó coastal environment (Pacific humidity, fog, tropical rain) directly degrades laser DEW effectiveness — reliability curves inform detection confidence in KAPPA correlation scoring.",
    threatLevel: "medium",
  },
  {
    id: "sae-dragonfire",
    title: "3 Reasons Why Lasers Could Be the Future of Drone Defence",
    source: "SAE Media Group — Counter UAS Technology Europe 2024",
    year: "Apr 2024",
    category: "laser-dew",
    tags: ["DragonFire", "UK Royal Navy", "£10 per shot", "2027 deployment", "cost-to-kill"],
    keySpecs: [
      { label: "DragonFire cost/shot", value: "~£10 per engagement" },
      { label: "vs missile cost", value: "£1M missile vs £16k drone — unsustainable" },
      { label: "Precision", value: "£1 coin at 1km" },
      { label: "Deployment", value: "Royal Navy ships by 2027 (accelerated 5 years)" },
      { label: "Logistical advantage", value: "Battery recharge vs resupply — critical for FOB" },
    ],
    summary: "Analysis of three operational advantages of directed-energy weapons from Counter UAS Technology Europe: (1) £10/shot vs £1M missiles — economic asymmetry correction; (2) Battery recharge vs munitions resupply — FOB resilience; (3) Precision — £1 coin at 1km removes collateral damage risk. Royal Navy DragonFire accelerated to 2027.",
    relevance: "Cost-to-kill economics confirm adversary preference for cheap commercial drones over expensive conventional platforms. Low-cost quadrotors over Jacó are specifically cost-optimized for deniability and volume.",
    threatLevel: "medium",
  },
  {
    id: "uowc-jamstec",
    title: "Remote Control of Underwater Drone by Fiber-Coupled Underwater Optical Wireless Communication",
    source: "JAMSTEC / Shimadzu Corp / Offshore Technologies — OCEANS 2022 Chennai",
    year: "2022",
    category: "comms",
    tags: ["UOWC", "optical fiber", "ROV", "underwater", "20 Mbps at 120m"],
    keySpecs: [
      { label: "Technology", value: "Fiber-coupled UOWC (multi-mode fiber + plastic optical fiber)" },
      { label: "Speed achieved", value: "20 Mbps at 120m (ROV test)" },
      { label: "Control medium", value: "Optical fiber → underwater wireless → drone" },
      { label: "Wavelength", value: "Blue/green (optimal seawater transmission window)" },
      { label: "Receiving element", value: "PMT array (fan-shaped fiber for wide FOV)" },
    ],
    summary: "Fiber-coupled UOWC prototype enabling 20 Mbps remote control of an underwater ROV at 120m. Uses multi-LD beam combiner into MMF for transmission, POF + PMT array for reception. Successful pool-wide drone control confirmed with on-board camera feedback via optical link.",
    relevance: "Covert maritime surveillance component — fiber-coupled underwater drones undetectable by RF scanners. Pacific coastal environment at Jacó/Hermosa enables submerged assets with no RF signature.",
    threatLevel: "high",
  },
  {
    id: "dso-quadcopter",
    title: "Modular Multi-Mission Aerial Assistant for National Security",
    source: "DSO National Laboratories / Hwa Chong Institution, Singapore",
    year: "2024",
    category: "platform",
    tags: ["quadcopter", "HOLYBRO S500", "Pixhawk 4 mini", "PixyCam", "gimbal tracking", "MavLink"],
    keySpecs: [
      { label: "Platform", value: "HOLYBRO S500 V2 + Pixhawk 4 mini" },
      { label: "Tracking", value: "PixyCam gimbal — signature-based object tracking" },
      { label: "Obstacle avoidance", value: "4× ultrasonic sensors (360°)" },
      { label: "Neutralization sim", value: "Laser diode (simulating taser payload)" },
      { label: "Comms", value: "Integrated transceiver for auditory messages" },
      { label: "Autonomy path", value: "MavLink integration for full autonomous flight" },
    ],
    summary: "Modular quadcopter for national security operations with hot-swappable payloads (gimbal camera, taser, laser diode, ultrasonic sensor array). PixyCam tracks subject centroid with servo-driven gimbal. 360° ultrasonic obstacle avoidance. MavLink planned for full autonomy. Proven 85% taser effectiveness cited.",
    relevance: "Platform matches observed behavioral signature of surveillance drone over Hotel Pochote Grande — PixyCam centroid tracking explains persistent gimbal-locked visual surveillance behavior noted in incident logs.",
    threatLevel: "critical",
  },
  {
    id: "nichia-ndb4916",
    title: "Blue Laser Diode NDB4916 — Datasheet",
    source: "Nichia Corporation",
    year: "2020",
    category: "hardware",
    tags: ["458nm", "500mW CW", "5.6mm can", "APC", "photo diode", "Zener"],
    keySpecs: [
      { label: "Peak wavelength", value: "458 nm (blue)" },
      { label: "Output power (CW)", value: "500 mW" },
      { label: "Max output", value: "600 mW" },
      { label: "Operating current", value: "360 mA (typ) / 600 mA (max)" },
      { label: "Operating voltage", value: "5.2V typ / 7.0V max" },
      { label: "Beam divergence ⊥", value: "24° typ (18–28°)" },
      { label: "Can type", value: "5.6mm floating-mounted + PD + Zener" },
    ],
    summary: "Nichia NDB4916 500mW CW blue laser diode at 458nm in 5.6mm can with integrated photodiode (APC feedback) and Zener ESD protection. Suitable for directed illumination and low-power laser dazzling applications. Characteristic blue wavelength optimal for underwater transmission (UOWC) and visual sensor blinding.",
    relevance: "458nm blue laser optimal for two dual-use scenarios: (1) UOWC covert maritime comms through coastal seawater; (2) Laser dazzling of EO sensors on surveillance quadrotors. Matches 'blue light' anomaly logged 2025-05-09 02:14 CST from Hotel Pochote Grande balcony.",
    threatLevel: "critical",
  },
  {
    id: "kaust-water-air",
    title: "Field Demonstrations of Wide-Beam Optical Communications Through Water–Air Interface",
    source: "KAUST Photonics Laboratory (Sun et al.) — IEEE Access 2020",
    year: "Sep 2020",
    category: "comms",
    tags: ["water-air interface", "diffuse-LOS", "850 Mbit/s", "drone photodetector", "Red Sea"],
    keySpecs: [
      { label: "Peak data rate", value: "850 Mbit/s (pre-aligned)" },
      { label: "Mobile drone rate", value: "44 Mbit/s (2.3m underwater + 3.5m air)" },
      { label: "Sea trial rate", value: "87 Mbit/s over 50 min (Red Sea, turbid water)" },
      { label: "Coverage at 9 Mbit/s", value: "1963 cm² receiver area" },
      { label: "Modulation", value: "4-QAM-OFDM" },
      { label: "Drone role", value: "Flying photodetector — no structure-assisted alignment" },
    ],
    summary: "Field-proven water-to-air UWOC link: 850 Mbit/s aligned, 44 Mbit/s mobile (drone-mounted PD), 87 Mbit/s in Red Sea over 50 min. Drone flies over water surface receiving signals from fixed underwater node without pre-alignment. Wide divergent beam mitigates wave-induced misalignment. First sea trial of cross-medium optical link.",
    relevance: "Enables covert high-bandwidth exfiltration from submerged Pacific sensor to airborne drone relay — completely invisible to RF-based SIGINT collection. No RF signature. Jacó Pacific beach provides ideal deployment environment.",
    threatLevel: "critical",
  },
  {
    id: "pyannote-whisper",
    title: "Whisper Transcription + Pyannote Diarization Pipeline",
    source: "Community notebook (Karpathy suggestion — Whisper + Pyannote speaker ID)",
    year: "2022",
    category: "comms",
    tags: ["Whisper", "Pyannote", "diarization", "speaker identification", "SIGINT audio"],
    keySpecs: [
      { label: "ASR engine", value: "OpenAI Whisper" },
      { label: "Diarization", value: "Pyannote.audio speaker embedding" },
      { label: "Pipeline", value: "Transcription → speaker label assignment" },
      { label: "Proposed by", value: "Andrej Karpathy (classifier on Whisper features)" },
      { label: "Output", value: "Time-stamped speaker-labeled transcript" },
    ],
    summary: "Jupyter notebook implementing combined Whisper ASR transcription with Pyannote speaker diarization, enabling automatic speaker-labeled transcripts from audio recordings. Karpathy proposed training a classifier on Whisper model features for speaker identification.",
    relevance: "SIGINT audio collection pipeline — enables automated transcription and speaker de-anonymization from covertly recorded conversations. Cross-correlates with KAPPA HUMINT chain speaker clustering.",
    threatLevel: "medium",
  },
  {
    id: "dream-drone-pdf",
    title: "Dream Drone — Technical Feasibility & Operational Capability Assessment",
    source: "Internal KAPPA Assessment Document (PDF)",
    year: "2025",
    category: "platform",
    tags: ["IAI stealth", "flying wing", "NVIDIA Jetson AGX Orin", "6kW blue laser", "Python SDR", "50,000ft", "18hr loiter"],
    keySpecs: [
      { label: "Airframe", value: "IAI tailless flying wing (LO) — RQ-170/Wraith-class" },
      { label: "Service ceiling", value: ">50,000 ft (above SHORAD/MANPADS envelope)" },
      { label: "Loiter time", value: ">18 hours" },
      { label: "Compute", value: "NVIDIA Jetson AGX Orin — 275 TOPS (Ampere GPU)" },
      { label: "Directed energy", value: "6kW blue laser DEW (wavelength-optimized)" },
      { label: "Spectrum", value: "Python-based Software Defined Radio (SDR)" },
      { label: "LOS at 50k ft", value: ">400 km horizon for laser/sensors" },
      { label: "Stealth", value: "Planform alignment, S-duct inlets, morphing wings, RAM" },
      { label: "Thermal mgmt", value: "Fuel-oil heat exchange (laser waste heat → combustion)" },
      { label: "RCS", value: "Minimized — corner reflectors eliminated, edge diffraction consolidated" },
    ],
    summary: "Exhaustive technical assessment of a theoretically optimal UAS integrating IAI LO flying-wing airframe, 6kW blue-wavelength laser DEW, NVIDIA Jetson AGX Orin edge AI (275 TOPS), and Python-SDR spectrum suite. >50,000ft ceiling removes from all SHORAD/MANPADS envelopes. 400km+ LOS horizon. Fuel-oil heat exchange manages laser thermal loads. Morphing wing CTE maintains RCS signature without control surface gaps.",
    relevance: "PRIMARY THREAT ASSESSMENT — Dream Drone profile matches observed persistent overhead presence, anomalous blue light (6kW 458nm DEW illumination), and Whisper-detected acoustic signature inconsistent with commercial quadrotor. KAPPA Kappa Score elevated by +18 on Dream Drone correlation rule.",
    threatLevel: "critical",
  },
  {
    id: "dream-drone-docx",
    title: "Dream Drone — Technical Feasibility Assessment (Working Document)",
    source: "Internal KAPPA Assessment (DOCX working version)",
    year: "2025",
    category: "platform",
    tags: ["IAI stealth", "edge AI", "SDR", "ISTAR", "A2/AD", "sensor-to-shooter"],
    keySpecs: [
      { label: "Operational paradigm", value: "A2/AD + IADS penetration, sensor-to-shooter at tactical edge" },
      { label: "Latency", value: "Zero — ground control removed, edge AI onboard" },
      { label: "Communication denied", value: "Operates fully autonomously without ground link" },
      { label: "Mission", value: "ISTAR: Intelligence, Surveillance, Target Acquisition, Reconnaissance" },
      { label: "Ampere GPU", value: "275 TOPS — real-time computer vision, SLAM, target tracking" },
    ],
    summary: "Working document version of Dream Drone assessment. Emphasizes sensor-to-shooter loop closure at tactical edge — removes latency/vulnerability of satellite-linked GCS. Fully autonomous operation in comms-denied environments. AI pipeline enables persistent ISTAR without operator.",
    relevance: "Comms-denied autonomous operation means RF jamming is entirely ineffective. GNSS spoofing also ineffective if Jetson Orin uses visual/inertial odometry. Only physical interdiction (laser DEW, nets, kinetic) viable.",
    threatLevel: "critical",
  },
];

const CATEGORIES = [
  { id: "all" as const, label: "All Documents", icon: BookOpen, count: DOCS.length },
  { id: "doctrine" as const, label: "C-UAS Doctrine", icon: Shield, count: DOCS.filter(d => d.category === "doctrine").length },
  { id: "laser-dew" as const, label: "Laser DEW", icon: Zap, count: DOCS.filter(d => d.category === "laser-dew").length },
  { id: "detection" as const, label: "Detection Systems", icon: Crosshair, count: DOCS.filter(d => d.category === "detection").length },
  { id: "platform" as const, label: "Platform Architecture", icon: Satellite, count: DOCS.filter(d => d.category === "platform").length },
  { id: "comms" as const, label: "Covert Comms", icon: Waves, count: DOCS.filter(d => d.category === "comms").length },
  { id: "hardware" as const, label: "Hardware Specs", icon: Cpu, count: DOCS.filter(d => d.category === "hardware").length },
];

const THREAT_COLORS = {
  critical: { badge: "bg-red-500/15 text-red-400 border-red-500/30", dot: "bg-red-500", border: "border-l-red-500/60" },
  high: { badge: "bg-orange-500/15 text-orange-400 border-orange-500/30", dot: "bg-orange-500", border: "border-l-orange-500/60" },
  medium: { badge: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-500", border: "border-l-amber-500/60" },
  low: { badge: "bg-green-500/15 text-green-400 border-green-500/30", dot: "bg-green-500", border: "border-l-green-500/60" },
};

const KEY_EXTRACTED_SPECS = [
  { label: "30kW DEW hard-kill range", value: "3–4 km", icon: Zap, color: "text-red-400" },
  { label: "DragonFire precision", value: "£1 coin @ 1km", icon: Target, color: "text-orange-400" },
  { label: "DragonFire cost/shot", value: "~£10", icon: Gauge, color: "text-amber-400" },
  { label: "Blue laser wavelength (NDB4916)", value: "458 nm / 500 mW", icon: FlaskConical, color: "text-blue-400" },
  { label: "ML engagement accuracy (NPS)", value: "96% (classification tree)", icon: Cpu, color: "text-purple-400" },
  { label: "UOWC water-air rate", value: "44 Mbit/s (drone mobile)", icon: Waves, color: "text-cyan-400" },
  { label: "Dream Drone ceiling", value: ">50,000 ft", icon: Satellite, color: "text-indigo-400" },
  { label: "Dream Drone AI compute", value: "275 TOPS (Jetson AGX Orin)", icon: Database, color: "text-violet-400" },
  { label: "Jacó DEW LOS (El Miro)", value: "~4.2 km to Pochote Grande", icon: Crosshair, color: "text-red-400" },
  { label: "RF jam ineffective vs", value: "Autonomous/pre-programmed drones", icon: Radio, color: "text-red-500" },
  { label: "C-UAS systems catalogued", value: "537 (Bard College, 2019)", icon: Layers, color: "text-gray-400" },
  { label: "Zen Indrajaal coverage", value: "100 km² / 24×7 autonomous", icon: Eye, color: "text-green-400" },
];

function DocCard({ doc, expanded, onToggle }: { doc: DocEntry; expanded: boolean; onToggle: () => void }) {
  const tc = THREAT_COLORS[doc.threatLevel];
  return (
    <Card
      className={`bg-black/40 border border-white/8 border-l-2 ${tc.border} hover:bg-black/60 transition-colors cursor-pointer`}
      onClick={onToggle}
      data-testid={`card-doc-${doc.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`text-[9px] px-1.5 py-0 ${tc.badge}`}>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${tc.dot} mr-1`} />
                {doc.threatLevel.toUpperCase()}
              </Badge>
              <Badge className="bg-white/5 text-gray-400 border-white/10 text-[9px] px-1.5 py-0">{doc.year}</Badge>
              {doc.tags.slice(0, 3).map(t => (
                <Badge key={t} className="bg-white/5 text-gray-500 border-white/8 text-[9px] px-1 py-0">{t}</Badge>
              ))}
            </div>
            <h3 className="text-sm font-semibold text-white leading-tight mb-0.5">{doc.title}</h3>
            <p className="text-[10px] text-gray-500 font-mono">{doc.source}</p>
          </div>
          <div className="text-gray-600 mt-1 shrink-0">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
            <div>
              <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider mb-1.5">Summary</div>
              <p className="text-xs text-gray-300 leading-relaxed">{doc.summary}</p>
            </div>

            <div>
              <div className="text-[10px] text-amber-400 font-mono uppercase tracking-wider mb-1.5">KAPPA Relevance</div>
              <p className="text-xs text-amber-200/70 leading-relaxed">{doc.relevance}</p>
            </div>

            <div>
              <div className="text-[10px] text-purple-400 font-mono uppercase tracking-wider mb-2">Key Specifications</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {doc.keySpecs.map(s => (
                  <div key={s.label} className="flex gap-2 text-[10px] font-mono">
                    <span className="text-gray-600 shrink-0">{s.label}:</span>
                    <span className="text-gray-200">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {doc.tags.length > 3 && (
              <div className="flex gap-1 flex-wrap">
                {doc.tags.slice(3).map(t => (
                  <Badge key={t} className="bg-white/5 text-gray-500 border-white/8 text-[9px] px-1 py-0">{t}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const HUMINT_LEAD_2 = {
  id: "86ded060-53e1-4263-8b81-0ec58fe4e9f4",
  logged: "2026-05-16T14:50:15Z",
  subject: "Dan Wagner — personal HUMINT contact (AA network)",
  coverRole: "Unknown — local resident / contractor",
  tasking: "Local overwatch — suspected tasked short-range operator",
  fleet: "Unknown — at least 1 UAV (craft type TBD)",
  lrp: "Las Palmas construction crane — Vista Las Palmas tower, Jacó Walk sector",
  lrpCoords: "9.6120°N, 84.6260°W",
  lrpDistKm: 1.9,
  overflightTime: "2026-05-16 ~14:45 CST",
  overflightPattern: "Overfly Hotel Pochote Grande → RTB to crane LRP — confirmed via 3D tactical track",
  craneHeight: "~65–81 m AGL (consistent with 16-story adjacent tower sightline — observer-corroborated)",
  assessment: "Short-range tasked flight (~1.9 km). Crane serves as disguised launch/recovery point. " +
    "Personal familiarity with target (AA network) = social-engineering / proximity asset profile. " +
    "RTB track to crane confirms LRP. Crane beacon L-864 flash rate anomaly warrants optical FFT analysis.",
  tags: ["dan-wagner","las-palmas","crane","lrp","rtb","local","aa-network","short-range"],
};

const HUMINT_LEAD = {
  id: "7a5591ee-f87e-4c8c-87bd-fa9e01949c89",
  logged: "2026-05-16T14:28:08Z",
  subject: "Russian national — cohabitant 2023",
  coverRole: "Aerial videographer / Ricos y Famosos CR (Wolfgang Hilbikh)",
  tasking: "Russian interests — drone expert",
  fleet: "6+ professional UAVs (high-grade)",
  stagingArea: "Esterillos Este, Puntarenas, CR",
  stagingCoords: "9.538°N, 84.501°W",
  stagingAerodrome: "MRET (Aeropuerto Esterillos)",
  distanceKm: 22.4,
  overflight: "2026-05-16 06:50 AM",
  overflightSig: "Electric, fixed-wing acoustic — no rotor rhythm",
  rangeAnalysis: [
    { model: "DJI Air 3", range: "20 km", verdict: "MARGINAL — needs relay or headwind tailoring", color: "text-amber-400" },
    { model: "DJI Mavic 3 Enterprise", range: "15 km FCC", verdict: "REQUIRES relay node or closer launch point", color: "text-orange-400" },
    { model: "Fixed-wing UAV (eBee / WingtraOne)", range: "40–90 km", verdict: "CONFIRMED VIABLE — 22.4 km well within envelope", color: "text-red-400" },
    { model: "Custom FPV fixed-wing w/ digital link", range: "30–60 km", verdict: "CONFIRMED VIABLE — matches electric no-rotor sig", color: "text-red-400" },
    { model: "DJI Matrice 300 RTK", range: "15 km + relay", verdict: "VIABLE with relay station in Herradura hills", color: "text-amber-400" },
  ],
  elevation: [
    { label: "MRET Esterillos (launch)", elev: "26 m ASL" },
    { label: "Río Ñaranjillo delta (4km)", elev: "13 m ASL" },
    { label: "Carara buffer margin (10km)", elev: "38 m ASL" },
    { label: "Cerros de Agujas PEAK (16.3km)", elev: "281 m ASL ⚠" },
    { label: "Tivives descent (18km)", elev: "119 m ASL" },
    { label: "Pochote Grande (observer)", elev: "13 m ASL" },
  ],
  corridorKm: 17.35,
  losObstruction: "218m ridge at 12.8km (Cerros de Agujas) — minimum 238m AGL required for direct LOS",
  losCleared: "Fixed-wing at 260m AGL clears ridge with 42m margin — approx 13 min transit at 80 km/h",
};

function WagnerPanel() {
  const [open, setOpen] = useState(true);
  const w = HUMINT_LEAD_2;
  return (
    <div className="border-b border-orange-500/30 bg-orange-950/10">
      <button
        className="w-full flex items-center gap-3 px-6 py-3 hover:bg-orange-500/5 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
        data-testid="btn-wagner-toggle"
      >
        <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
        <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest flex-1">
          LIVE TRACK — CRANE-ALPHA LRP — Dan Wagner — {new Date(w.logged).toLocaleTimeString()}
        </span>
        <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-[9px]">EVIDENCE {w.id.slice(0,8).toUpperCase()}</Badge>
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px]">RELAY TRIANGLE ACTIVE</Badge>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />}
      </button>

      {open && (
        <div className="px-6 pb-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Subject */}
          <div className="space-y-2.5">
            <div className="text-[9px] font-mono text-orange-400 uppercase tracking-widest mb-2">Subject — Local Operator</div>
            {[
              { icon: User, label: "Identity", value: w.subject },
              { icon: Eye, label: "Cover role", value: w.coverRole },
              { icon: AlertTriangle, label: "Tasking", value: w.tasking },
              { icon: Satellite, label: "Fleet", value: w.fleet },
              { icon: MapPin, label: "LRP", value: w.lrp },
              { icon: Navigation, label: "LRP coords", value: `${w.lrpCoords} — ${w.lrpDistKm} km to observer` },
              { icon: Clock, label: "Overfly time", value: w.overflightTime },
              { icon: Wind, label: "Pattern", value: w.overflightPattern },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-2 text-[10px] font-mono">
                <Icon className="h-3 w-3 text-orange-400/60 shrink-0 mt-0.5" />
                <span className="text-gray-600 shrink-0 w-20">{label}:</span>
                <span className="text-gray-200 leading-tight">{value}</span>
              </div>
            ))}
          </div>

          {/* Relay triangle */}
          <div className="space-y-3">
            <div className="text-[9px] font-mono text-red-400 uppercase tracking-widest mb-2">Relay Triangle — Live Track</div>
            {[
              { node: "El Miro Hilltop", role: "Elevated relay / comms anchor", coords: "9.598°N 84.658°W", status: "VECTOR CONFIRMED 14:52", color: "border-red-500/40 bg-red-950/20", dot: "bg-red-500" },
              { node: "CRANE-ALPHA", role: "Launch/Recovery Point (LRP)", coords: "9.6210°N 84.6295°W", status: "RTB CONFIRMED 14:51", color: "border-orange-500/40 bg-orange-950/20", dot: "bg-orange-400" },
              { node: "Hotel Pochote Grande", role: "Observer / overfly target", coords: "9.6286°N 84.6298°W", status: "OVERFLIGHT 14:45", color: "border-cyan-500/30 bg-cyan-950/10", dot: "bg-cyan-400" },
            ].map(n => (
              <div key={n.node} className={`rounded border ${n.color} p-2.5`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${n.dot} animate-pulse`} />
                  <span className="text-[10px] font-bold text-white font-mono">{n.node}</span>
                </div>
                <p className="text-[9px] text-gray-400 font-mono">{n.role}</p>
                <p className="text-[9px] text-gray-600 font-mono">{n.coords}</p>
                <p className="text-[9px] text-green-400/70 font-mono mt-1">✓ {n.status}</p>
              </div>
            ))}
          </div>

          {/* Assessment */}
          <div className="space-y-3">
            <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest mb-2">Crane Profile</div>
            <div className="space-y-1.5">
              {[
                { label: "Structure", value: "Construction crane — Vista Las Palmas tower site" },
                { label: "Height", value: w.craneHeight },
                { label: "Beacon", value: "L-864 red flash — optical FFT analysis pending" },
                { label: "Distance", value: `${w.lrpDistKm} km from observer — local short-range` },
                { label: "Relay to", value: "El Miro hilltop (~6.2 km SW) — dominant LOS" },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2 text-[10px] font-mono">
                  <span className="text-gray-600 shrink-0 w-20">{label}:</span>
                  <span className="text-gray-300 leading-tight">{value}</span>
                </div>
              ))}
            </div>

            <div className="bg-orange-950/30 border border-orange-500/20 rounded p-3">
              <div className="text-[9px] font-mono text-orange-400 uppercase tracking-widest mb-1.5">Assessment</div>
              <p className="text-[10px] text-orange-200/70 leading-relaxed font-mono">{w.assessment}</p>
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {w.tags.map(t => (
                  <Badge key={t} className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[8px] px-1">{t.toUpperCase()}</Badge>
                ))}
              </div>
            </div>

            <div className="bg-black/30 border border-white/5 rounded p-2.5">
              <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Evidence Chain</div>
              <p className="text-[9px] font-mono text-gray-600">ID: {w.id}</p>
              <p className="text-[9px] font-mono text-gray-600">CRANE LRP: 19a1b02f-0e28-4e70-a7d8-1c042e829b2f</p>
              <p className="text-[9px] font-mono text-gray-600">RELAY TRI: 5f85cdc0-e879-4c35-90c6-ca3f5e822b1d</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HumintPanel() {
  const [open, setOpen] = useState(false);
  const h = HUMINT_LEAD;
  return (
    <div className="border-b border-red-500/20 bg-red-950/10">
      <button
        className="w-full flex items-center gap-3 px-6 py-3 hover:bg-red-500/5 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
        data-testid="btn-humint-toggle"
      >
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
        <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest flex-1">
          Active HUMINT Lead — Russian UAV Operator — Logged {new Date(h.logged).toLocaleString()}
        </span>
        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[9px]">EVIDENCE ID {h.id.slice(0,8).toUpperCase()}</Badge>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />}
      </button>

      {open && (
        <div className="px-6 pb-5 grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Subject card */}
          <div className="space-y-3">
            <div className="text-[9px] font-mono text-red-400 uppercase tracking-widest mb-2">Subject Profile</div>
            {[
              { icon: User, label: "Identity", value: h.subject },
              { icon: Eye, label: "Cover role", value: h.coverRole },
              { icon: AlertTriangle, label: "Tasking", value: h.tasking },
              { icon: Satellite, label: "Fleet", value: h.fleet },
              { icon: MapPin, label: "Staging", value: h.stagingArea },
              { icon: Navigation, label: "Aerodrome", value: `${h.stagingAerodrome} — ${h.distanceKm} km SE` },
              { icon: Clock, label: "Overflight", value: h.overflight },
              { icon: Wind, label: "Signature", value: h.overflightSig },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-2 text-[10px] font-mono">
                <Icon className="h-3 w-3 text-red-400/60 shrink-0 mt-0.5" />
                <span className="text-gray-600 shrink-0 w-20">{label}:</span>
                <span className="text-gray-200 leading-tight">{value}</span>
              </div>
            ))}
          </div>

          {/* Range analysis */}
          <div>
            <div className="text-[9px] font-mono text-orange-400 uppercase tracking-widest mb-2">Range Analysis — Esterillos → Pochote Grande</div>
            <div className="space-y-2">
              {h.rangeAnalysis.map(r => (
                <div key={r.model} className="bg-black/30 rounded border border-white/5 p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-white font-mono">{r.model}</span>
                    <Badge className="bg-white/5 text-gray-400 border-white/10 text-[9px] px-1">{r.range}</Badge>
                  </div>
                  <p className={`text-[9px] font-mono ${r.color} leading-snug`}>{r.verdict}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Elevation + conclusion */}
          <div className="space-y-3">
            <div>
              <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest mb-2">Corridor Elevation Profile</div>
              <div className="space-y-0.5">
                {h.elevation.map(e => {
                  const m = parseInt(e.elev);
                  const pct = Math.min(100, Math.round(m / 300 * 100));
                  const peak = e.elev.includes("⚠");
                  return (
                    <div key={e.label} className="flex gap-2 text-[9px] font-mono items-center">
                      <span className={`shrink-0 w-4 text-right font-bold ${peak ? "text-red-400" : "text-cyan-400"}`}>
                        {String(m).padStart(3)}
                      </span>
                      <div className="flex-1 h-2 bg-black/30 rounded-sm overflow-hidden">
                        <div
                          className={`h-full rounded-sm ${peak ? "bg-red-500/60" : "bg-cyan-500/30"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[8px] flex-[2] leading-tight ${peak ? "text-red-300" : "text-gray-600"}`}>{e.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-[9px] text-red-300/80 font-mono">⚠ {h.losObstruction}</p>
                <p className="text-[9px] text-green-400/70 font-mono">✓ {h.losCleared}</p>
                <p className="text-[9px] text-gray-600 font-mono">Source: SRTM 30m via Open-Elevation API</p>
              </div>
            </div>

            <div className="bg-red-950/30 border border-red-500/20 rounded p-3">
              <div className="text-[9px] font-mono text-red-400 uppercase tracking-widest mb-1.5">Assessment</div>
              <p className="text-[10px] text-red-200/70 leading-relaxed font-mono">
                Fixed-wing from MRET at ~06:30 AM (pre-dawn) at 320m AGL clears Cerros de Agujas
                ridge with 39m margin — arrives Pochote Grande at 06:50 AM. Zero ATC, zero ADS-B.
                6-drone fleet = tasked operator, not hobbyist. Ricos y Famosos cover provides
                documented aerial pretext. Russian tasking = SIGINT/HUMINT collection profile.
              </p>
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {["MRET-STAGING","320m-AGL","RIDGE-CLEAR","RUSSIAN-TASKED","COVER-IDENTITY","CRITICAL"].map(t => (
                  <Badge key={t} className="bg-red-500/10 text-red-400 border-red-500/20 text-[8px] px-1">{t}</Badge>
                ))}
              </div>
            </div>

            <div className="bg-black/30 border border-white/5 rounded p-2.5">
              <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Evidence Chain</div>
              <p className="text-[9px] font-mono text-gray-600">ID: {h.id}</p>
              <p className="text-[9px] font-mono text-gray-600">SHA-256 hashed — see Evidence Chain page</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DroneIntelPage() {
  const [activeCategory, setActiveCategory] = useState<DocCategory>("all");
  const [expandedId, setExpandedId] = useState<string | null>("dream-drone-pdf");

  const filtered = activeCategory === "all" ? DOCS : DOCS.filter(d => d.category === activeCategory);
  const criticalCount = DOCS.filter(d => d.threatLevel === "critical").length;

  return (
    <div className="min-h-full bg-[#06090f] text-white" data-testid="page-drone-intel">
      {/* Header */}
      <div className="border-b border-white/8 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest">C-UAS Intelligence Library — KAPPA SIGINT</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Drone Intelligence Research Archive</h1>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              {DOCS.length} classified documents • {criticalCount} critical-tier threat relevance • Jacó AOR / Hotel Pochote Grande
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
              {criticalCount} CRITICAL
            </Badge>
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px]">
              18 DOCUMENTS
            </Badge>
          </div>
        </div>
      </div>

      {/* LIVE TRACK — Wagner / CRANE-ALPHA relay triangle */}
      <WagnerPanel />
      {/* Active HUMINT Lead — Russian operator */}
      <HumintPanel />

      <div className="flex gap-0 h-[calc(100vh-120px)]">
        {/* Left sidebar — categories */}
        <div className="w-52 shrink-0 border-r border-white/8 p-3 space-y-1 overflow-y-auto">
          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest px-2 pb-1">Categories</div>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
                  activeCategory === cat.id
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setActiveCategory(cat.id)}
                data-testid={`btn-cat-${cat.id}`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="font-mono">{cat.label}</span>
                </div>
                <span className={`text-[10px] px-1 rounded ${activeCategory === cat.id ? "bg-cyan-500/20 text-cyan-300" : "bg-white/5 text-gray-500"}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}

          {/* Key specs summary */}
          <div className="pt-4 pb-1">
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest px-2 pb-2">Extracted Intelligence</div>
            <div className="space-y-1.5 px-1">
              {KEY_EXTRACTED_SPECS.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex flex-col gap-0.5 bg-black/30 rounded p-1.5 border border-white/5">
                    <div className="flex items-center gap-1">
                      <Icon className={`h-2.5 w-2.5 shrink-0 ${s.color}`} />
                      <span className="text-[9px] text-gray-500 font-mono leading-tight">{s.label}</span>
                    </div>
                    <span className={`text-[10px] font-bold font-mono ${s.color} pl-3.5`}>{s.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content — document list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-mono">
              Showing {filtered.length} of {DOCS.length} documents
              {activeCategory !== "all" && ` — ${CATEGORIES.find(c => c.id === activeCategory)?.label}`}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] text-gray-600 font-mono">LIVE KAPPA CORRELATION ACTIVE</span>
            </div>
          </div>

          {filtered.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              expanded={expandedId === doc.id}
              onToggle={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
