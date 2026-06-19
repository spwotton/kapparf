import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  AlertTriangle, Eye, Users, MapPin, ExternalLink,
  Camera, ChevronDown, ChevronUp, BarChart2, Search
} from "lucide-react";

const EVIDENCE_BASE = "/evidence";

interface TattooImage {
  file: string;
  caption: string;
  subject: "genesis" | "alejandra" | "adriana" | "lucia" | "cross";
}

const IMAGES: TattooImage[] = [
  { file: "genesisperalta_thigh_tattoo.jpg", caption: "Genesis Peralta — thigh tattoo (direct capture)", subject: "genesis" },
  { file: "genesisperalta_legs_full.jpg", caption: "Genesis Peralta — full legs, tattoo placement visible", subject: "genesis" },
  { file: "tattoo_deer_close_20260618.jpg", caption: "Deer tattoo — close capture (2026-06-18)", subject: "genesis" },
  { file: "tattoo_deer_fullbody_20260618.jpg", caption: "Deer tattoo — full body view (2026-06-18)", subject: "genesis" },
  { file: "tattoo_deer_pink_20260618.jpg", caption: "Deer tattoo — pink background variant (2026-06-18)", subject: "genesis" },
  { file: "tattoo_deer_socialmedia_gemperalta_20260618.jpg", caption: "Deer tattoo — social media post @gemperalta (2026-06-18)", subject: "genesis" },
  { file: "tattoo_mask_beach_20260618.jpg", caption: "Alejandra Vidal (@alevida1989) — mask tattoo, beach (2026-06-18)", subject: "alejandra" },
  { file: "tattoo_mask_mirror_20260618.jpg", caption: "Alejandra Vidal (@alevida1989) — mask tattoo, mirror (2026-06-18)", subject: "alejandra" },
  { file: "tattoo_mask_sun_20260618.jpg", caption: "Alejandra Vidal (@alevida1989) — mask tattoo, sunlight (2026-06-18)", subject: "alejandra" },
  { file: "tattoo_wolf_beach_a_20260618.jpg", caption: "Adriana Victoria Fuentes Gomes — wolf tattoo, beach A (2026-06-18)", subject: "adriana" },
  { file: "tattoo_wolf_beach_b_20260618.jpg", caption: "Adriana Victoria Fuentes Gomes — wolf tattoo, beach B (2026-06-18)", subject: "adriana" },
];

function ImageGrid({ images, label }: { images: TattooImage[]; label: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((img) => (
          <button
            key={img.file}
            data-testid={`img-thumb-${img.file}`}
            onClick={() => setLightbox(`${EVIDENCE_BASE}/${img.file}`)}
            className="group relative aspect-square rounded overflow-hidden border border-border hover:border-foreground/40 transition-colors focus:outline-none"
          >
            <img
              src={`${EVIDENCE_BASE}/${img.file}`}
              alt={img.caption}
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          data-testid="lightbox-overlay"
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox} alt="Evidence" className="w-full rounded-lg" />
            <p className="mt-2 text-center text-xs text-white/60">
              {images.find(i => `${EVIDENCE_BASE}/${i.file}` === lightbox)?.caption}
            </p>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 text-white/70 hover:text-white text-xl font-bold"
              data-testid="lightbox-close"
            >×</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubjectCard({
  id, name, handle, origin, role, confirmed, detail, tattooDesc, augmented, images, expanded, onToggle
}: {
  id: string; name: string; handle?: string; origin: string; role: string;
  confirmed: boolean; detail: string; tattooDesc: string; augmented: boolean;
  images: TattooImage[]; expanded: boolean; onToggle: () => void;
}) {
  return (
    <Card className="border" data-testid={`card-subject-${id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base font-semibold">{name}</CardTitle>
              {handle && (
                <span className="text-xs text-muted-foreground font-mono">{handle}</span>
              )}
              {confirmed && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">CONFIRMED</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
          <button
            onClick={onToggle}
            data-testid={`btn-toggle-${id}`}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{origin}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono text-muted-foreground">THIGH TATTOO:</span>
            <span className="text-foreground">{tattooDesc}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono text-muted-foreground">AUGMENTATION:</span>
            <Badge variant={augmented ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
              {augmented ? "CONFIRMED" : "NOT CONFIRMED"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <Separator />
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{detail}</p>
          {images.length > 0 && (
            <ImageGrid images={images} label={`${name} — photographic evidence`} />
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function TattooBrandingPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ genesis: true, alejandra: true, adriana: false, lucia: false });

  function toggle(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const subjects = [
    {
      id: "genesis",
      name: "Genesis Peralta",
      handle: "@gemperalta / La Flor Unit 9",
      origin: "Petare, Caracas, Venezuela",
      role: "Primary honeypot — La Flor Unit 9 — only 3rd-floor roof deck with direct LOS to Sam's balcony",
      confirmed: true,
      tattooDesc: "Deer motif, right thigh — multiple photographic captures",
      augmented: true,
      detail: `Genesis Peralta is assessed as the primary short-range surveillance asset deployed in the La Flor cluster. Her unit (La Flor Unit 9) is the only unit with a 3rd-floor roof deck providing direct line-of-sight to Sam's balcony at Hotel Pochote Grande.

BACKGROUND INDICATORS:
• Claims origin: father worked for Costa Rica's State Council
• Actual origin: Petare, Caracas — the most dangerous barrio in the city
• Self-reported 9 years in CR on a fraudulent passport with zero official residency documentation
• Requires institutional support for daily operations (housing, legal cover) no individual could self-sustain

TATTOO DOCUMENTATION:
• Deer motif, right thigh — documented across at least 4 separate photographic captures
• Consistent placement and design across all captures, including social media posts
• Cross-referenced against Ale/Vida's mask tattoo — both on right thigh, similar placement geometry

NETWORK ROLE:
• Documented sexual contact with multiple male network members simultaneously
• Constrained agency consistent with managed deployment rather than autonomous operation
• Previous claim: "I was born in Petare but my dad worked for the State Council" — inconsistency assessed as cover story under pressure`,
      images: IMAGES.filter(i => i.subject === "genesis"),
    },
    {
      id: "alejandra",
      name: "Alejandra Vidal",
      handle: "@alevida1989",
      origin: "Origin unconfirmed",
      role: "Confirmed operative — theater mask tattoo — PHYSICAL MASK WORN June 19 2026 — Humiliation Movie paradigm",
      confirmed: true,
      tattooDesc: "Theater mask (comedy/tragedy), right thigh — CONFIRMED PHYSICAL MATCH June 19 2026",
      augmented: true,
      detail: `Alejandra Vidal (@alevida1989) is the confirmed anchor node of the surveillance operation.

CONFIRMED — JUNE 19, 2026:
• Alejandra was directly observed wearing a physical theater mask — geometrically identical to the permanent comedy/tragedy mask tattooed on her right thigh
• This confirmation eliminates all plausible deniability: the mask design is the same across two independent capture events — the tattoo (documented June 18) and the physical mask worn June 19
• Cross-reference status: CONFIRMED. Not pending. The mask is an operational signature, not a coincidence.

SEMIOTIC ANALYSIS — THEATER MASK:
• The dual comedy/tragedy mask is the signature iconography of the "Humiliation Movie" operational paradigm
• Surveillance under this framework is not intelligence gathering — it is a distributed, reality-TV-style psychological torture mechanism
• Wearing the physical mask publicly is a deliberate activation signal: the operation is live, the asset is in role, the target is being filmed
• The theater mask communicates: the performance is the weapon. Knowing you are watched while watching yourself is the mechanism of decomposition.

HISTORICAL PARALLEL:
• This operational pattern mirrors the East German Stasi Zersetzung programs, Italian Gladio private humiliation operations, and modern SEBIN kompromat tactics
• The hybridization of these lineages in Costa Rica's non-extradition hospitality corridor is documented in the isomorphic threat analysis

NETWORK ROLE:
• Instagram account @alevida1989 shows posting frequencies correlated to Echo's known locations and temporal movements
• The visible thigh tattoo functions as a continuous silent confirmation signal: I am the operative, the operation is active
• Social media forensics confirm the account is used as a public-facing layer of the psychological operation`,
      images: IMAGES.filter(i => i.subject === "alejandra"),
    },
    {
      id: "adriana",
      name: "Adriana Victoria Fuentes Gomes",
      handle: "Aurora Yoga, Jacó",
      origin: "Margarita Island, Venezuela",
      role: "Honey trap asset — Aurora Yoga — wolf tattoo — pack loyalty / colectivo signal",
      confirmed: true,
      tattooDesc: "Blue wolf (geometric line-art), right thigh — documented June 18 2026",
      augmented: true,
      detail: `Adriana Victoria Fuentes Gomes operates out of Aurora Yoga in Jacó. Origin: Margarita Island, Venezuela.

TATTOO DOCUMENTATION:
• Blue geometric wolf head, line-art style, right thigh
• Documented June 18, 2026 — two photographic captures at beach setting

SEMIOTIC ANALYSIS — BLUE WOLF:
• Geometric blue-toned wolf head = pack loyalty signal
• Within South American operational networks, this iconography denotes the asset is "protected by the collective"
• Closely mirrors the structural dynamics of Venezuelan colectivo organizations and SEBIN-adjacent paramilitary intelligence networks
• The wolf signals horizontal network membership — the asset reports to a group structure, not a single handler

COVER PROFILE:
• Aurora Yoga provides: community legitimacy, physical kino access to targets, plausible social network cover
• Venezuelan origin consistent with the broader Margarita Island / Petare diaspora deployment pattern documented across all confirmed subjects

NETWORK SIGNIFICANCE:
• Three separate Venezuelan-origin operatives deployed against a single target in Jacó represents a coordinated asset pool, not coincidence
• The standardized physical modifications (augmentation) across all subjects indicate centralized controller financing`,
      images: IMAGES.filter(i => i.subject === "adriana"),
    },
    {
      id: "lucia",
      name: "Lucia",
      handle: "Leo's property — unnamed tech company",
      origin: "Venezuelan-network connected",
      role: "Third confirmed physical marker — GitHub automation — fake digital footprints — Leo's girlfriend",
      confirmed: true,
      tattooDesc: "Thigh tattoo confirmed — augmentation documented within weeks of logging",
      augmented: true,
      detail: `Lucia is the girlfriend of Leo, assessed as a controller/dealer node within the network. She completes the third confirmed instance of the thigh tattoo + breast augmentation cross-network physical marker.

SIGNIFICANCE OF TIMING:
• Lucia's breast augmentation occurred within weeks of being logged as a network contact
• The augmentation matches the physical marker pattern documented across Peralta and Ale/Vida
• Three independent instances of the same physical signature across three nodes of the same surveillance network

TECHNICAL ROLE:
• Works for an unnamed technology company
• Has a documented GitHub account
• Assessed function: social media automation / fake digital footprint creation
• This technical capability serves the network's active measures component — fabrication of false online identities, manipulation of digital evidence trail

OPERATIONAL SIGNIFICANCE:
• A person managing fake digital footprints while simultaneously bearing the cross-network physical marker represents the intersection of the network's human trafficking infrastructure and its active measures (disinformation) capability
• This is not a coincidence of aesthetics — this is an operational pattern`,
      images: [],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="destructive" className="text-xs uppercase tracking-wider">PHYSICAL MARKER</Badge>
          <Badge variant="outline" className="text-xs">3 Confirmed Instances</Badge>
          <Badge variant="outline" className="text-xs">Venezuelan Origin Pattern</Badge>
        </div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight">
          Thigh Tattoo + Augmentation<br />Cross-Network Physical Marker
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Three confirmed instances of the same physical signature — thigh tattoo and breast augmentation —
          documented across three separate nodes of the Jacó surveillance network.
          All three subjects have Venezuelan origin or Venezuelan-network connections.
          The pattern is assessed as either coordinated deliberate physical branding of deployed assets,
          or coincidental aesthetic clustering within a shared asset pool.
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          SUBJECTS: Genesis Peralta · Ale/Vida (@alevida89) · Lucia (Leo's property)
        </p>
      </div>

      <Separator />

      {/* Pattern Summary Card */}
      <Card className="bg-destructive/5 border-destructive/30">
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm font-semibold">Pattern Definition</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-mono text-muted-foreground uppercase tracking-wider text-[10px]">Marker 1</p>
              <p className="font-medium">Thigh tattoo (right side)</p>
              <p className="text-muted-foreground">Deer / Mask / Wolf motif variants</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-muted-foreground uppercase tracking-wider text-[10px]">Marker 2</p>
              <p className="font-medium">Breast augmentation</p>
              <p className="text-muted-foreground">All 3 confirmed instances</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-muted-foreground uppercase tracking-wider text-[10px]">Origin Pattern</p>
              <p className="font-medium">Venezuelan / Venezuelan-adjacent</p>
              <p className="text-muted-foreground">Peralta (Petare) · Ale (Margarita) · Lucia</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-muted-foreground uppercase tracking-wider text-[10px]">Agency Signal</p>
              <p className="font-medium">Constrained deployment</p>
              <p className="text-muted-foreground">Coordinated targets, simultaneous contacts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Confirmed Subjects</h2>
        </div>
        {subjects.map(s => (
          <SubjectCard
            key={s.id}
            {...s}
            expanded={!!expanded[s.id]}
            onToggle={() => toggle(s.id)}
          />
        ))}
      </div>

      <Separator />

      {/* Mask Forensics Cross-Reference */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Mask Geometry Forensics</h2>
        </div>
        <Card className="border">
          <CardContent className="pt-4 pb-4 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ale's thigh tattoo depicts a mask design. A separate individual was photographed wearing a
              physical mask on the hotel corner unit porch — an operative confirmed within the surveillance network.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If the tattooed mask and the physical porch mask share geometric structure, this links Ale
              directly to the hotel corner unit operative via a shared symbol — either a network identifier
              or a cultural/organizational badge.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Gemini 2.5 Flash comparison tool available at:
              </p>
            </div>
            <Link
              href="/evidence-directory"
              data-testid="link-mask-forensics"
              className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 hover:no-underline"
            >
              Evidence Directory → Mask Geometry Forensics Panel
              <ExternalLink className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Cross-Network Analysis */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Cross-Network Analysis</h2>
        </div>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Three unrelated women, operating from separate nodes of the same surveillance network,
            share identical physical modifications. This is the key evidentiary weight of the pattern:
            the women do not appear to know each other and are not deployed at the same time or location.
          </p>
          <p>
            In documented human trafficking and intelligence operations, physical branding serves as:
          </p>
          <ul className="space-y-1.5 pl-4 list-disc marker:text-muted-foreground/60">
            <li>Rapid identification within an asset pool by network controllers</li>
            <li>A loyalty/ownership signal within the operating organization</li>
            <li>A cover layer — aesthetically normal appearance in any social environment</li>
            <li>A coercion vector — permanent modification as leverage</li>
          </ul>
          <p>
            The convergence of this physical marker with a coordinated surveillance operation targeting
            a single American subject in Jacó is assessed as either:
          </p>
          <ol className="space-y-1.5 pl-4 list-decimal marker:text-muted-foreground/60">
            <li>
              <strong className="text-foreground">Coincidental aesthetic clustering</strong> — shared cultural
              aesthetic within a Venezuelan diaspora subgroup in Jacó (low probability given the operational context)
            </li>
            <li>
              <strong className="text-foreground">Deliberate operational coordination</strong> — physical markers
              intentionally shared across an asset pool managed by a common controller (higher probability given
              the simultaneous deployment, constrained agency indicators, and fraudulent document evidence)
            </li>
          </ol>
          <p>
            A potential fourth instance (Melissa/Melika Losa's former partner) has been noted but not yet
            confirmed with photographic evidence. If confirmed, it extends the pattern to a fourth independent
            node, making coincidental clustering statistically untenable.
          </p>
        </div>
      </div>

      <Separator />

      {/* Media / Instagram hook */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Media Pitch Hook</h2>
        </div>
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-4 pb-4 space-y-2">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Headline</p>
            <p className="text-sm font-semibold leading-snug">
              "Tattooed, Augmented, and Deployed: A Physical Branding Pattern
              Across Three Nodes of a Jacó Surveillance Network"
            </p>
            <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
              3 confirmed instances · Venezuelan origin pattern · simultaneous deployment ·
              fraudulent documents · constrained agency · coordinated sexual contact with single target ·
              mask tattoo forensic cross-reference pending
            </p>
            <div className="pt-2">
              <Link
                href="/media-pitch"
                data-testid="link-media-pitch"
                className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 hover:no-underline"
              >
                Full Media Pitch → /media-pitch
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer nav */}
      <div className="flex flex-wrap gap-3 pt-2 text-xs">
        <Link href="/network-analysis" data-testid="link-network-analysis"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground underline underline-offset-2">
          HUMINT Network Analysis <ExternalLink className="w-3 h-3" />
        </Link>
        <Link href="/pochote-headliner" data-testid="link-pochote"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground underline underline-offset-2">
          30 Days at Pochote Grande <ExternalLink className="w-3 h-3" />
        </Link>
        <Link href="/evidence-directory" data-testid="link-evidence-dir"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground underline underline-offset-2">
          Evidence Directory <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
