import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, MapPin, Clock, Eye, Radio, Wifi, Shield, Zap, ExternalLink, Camera } from "lucide-react";
import { Link } from "wouter";

function ZoomImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [zoomed, setZoomed] = [false, () => {}];
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-sm border border-border ${className ?? ""}`}
    />
  );
}

function Callout({ children, label = "KEY FINDING", color = "amber" }: {
  children: React.ReactNode;
  label?: string;
  color?: "amber" | "red" | "blue" | "green";
}) {
  const styles: Record<string, string> = {
    amber: "border-amber-600 bg-amber-950/15 text-amber-400",
    red:   "border-red-600   bg-red-950/20   text-red-400",
    blue:  "border-blue-600  bg-blue-950/15  text-blue-400",
    green: "border-green-600 bg-green-950/15 text-green-400",
  };
  const [border, bg, text] = styles[color].split(" ");
  return (
    <div className={`my-6 border-l-4 ${border} ${bg} rounded-r-sm px-5 py-4`}>
      <div className={`text-xs font-mono font-bold mb-2 uppercase tracking-widest ${text}`}>{label}</div>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function FactRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between border-b border-border/40 pb-2 gap-4">
      <span className="text-sm text-muted-foreground font-mono flex-shrink-0">{label}</span>
      <span className={`text-sm font-mono font-bold text-right ${highlight ? "text-red-400" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function NumberedItem({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="border border-border rounded-sm p-4 bg-card/30">
      <div className="flex gap-4">
        <span className="text-2xl font-mono font-bold text-muted-foreground/30 flex-shrink-0">{n}</span>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

export default function RiverwalkPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="max-w-3xl mx-auto px-6 pt-14 pb-10">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Badge variant="destructive" className="text-[10px] font-mono rounded-none tracking-widest">INCIDENT REPORT</Badge>
            <Badge variant="outline" className="text-[10px] font-mono rounded-none tracking-widest">RIVERWALK — JACÓ</Badge>
            <Badge variant="outline" className="text-[10px] font-mono rounded-none tracking-widest">AUG – OCT 2025</Badge>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">KAPPA HUMINT</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold leading-tight text-foreground mb-4">
            Riverwalk:<br />
            <span className="text-muted-foreground font-normal">How a Rental Network Became a Surveillance Platform</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-5 font-serif">
            A shared router password across an entire property empire. A Sunday firmware upgrade that triggered a five-minute response from an ISP. A cell of operatives placed across the street within 72 hours. And on October 14, 2025 — a piano wire attack by someone claiming to be a US Marshal.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground/60 font-mono">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> August – October 2025</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Riverwalk, Jacó Beach, Costa Rica</span>
            <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> ~10 min read</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 pb-24 pt-10 space-y-0">

        {/* Section 1: The Property Network */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-serif font-bold text-foreground">The Greenwald Property Network</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            Riverwalk is a short residential street in Jacó. House #5 is managed by Michael Greenwald's company <strong className="text-foreground">Rent Costa Rica Homes</strong> — the management arm of a dual-track operation that rents properties through Rent Costa Rica Homes and sells them through <strong className="text-foreground">Huckle Realty</strong>. Day-to-day property management runs through a local manager named José. The house directly across the street — the last house on the right looking down Riverwalk — is also a Greenwald/Jacó Realty property.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            Greenwald's holdings in south Jacó are substantial: a house on Madrigal, a house on Sunset, a large mansion at the southernmost point of the beach road, and a property up in El Miro on the hill. Together these properties form a geographic cluster covering the southern end of Jacó and the elevated ridge above it — a position with direct line-of-sight across a significant portion of the town.
          </p>

          <div className="space-y-3 my-6">
            <FactRow label="Management company" value="Rent Costa Rica Homes" />
            <FactRow label="Sales arm" value="Huckle Realty" />
            <FactRow label="Property manager" value="José" />
            <FactRow label="Target property" value="Riverwalk #5 — last house, left side" />
            <FactRow label="Across-street property" value="Riverwalk — last house, right side (also Greenwald)" />
            <FactRow label="Additional holdings" value="Madrigal · Sunset · South mansion · El Miro hill" />
          </div>
        </section>

        <Separator className="my-8" />

        {/* Section 2: The Router */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="h-4 w-4 text-blue-400" />
            <h2 className="text-xl font-serif font-bold text-foreground">The Router Vulnerability — One Password Across the Empire</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            Every router in every Greenwald-managed property uses the same administrator credentials: username and password both set to <code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded text-sm">rentcostaricahomes</code> — the name of the management company, one word, no spaces. This was confirmed by direct access across multiple properties.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            Shared credentials across an entire rental portfolio is not a security oversight — it is a structural choice. It means anyone with access to a single router in the network has administrative access to all of them. It also means the network operator has full visibility into every tenant's traffic across every property, from a single credential set.
          </p>

          <Callout label="ROUTER CREDENTIAL ASSESSMENT" color="blue">
            Uniform admin credentials across a multi-property rental portfolio are consistent with centralized network monitoring infrastructure. A legitimate property management operation would use per-device credentials for liability reasons. The choice of the company name as the credential — rather than a generated or device-specific password — suggests the credential was set by a single administrator intentionally, not by a default or oversight. Every tenant in every Greenwald property is on a monitored network.
          </Callout>
        </section>

        <Separator className="my-8" />

        {/* Section 3: The Sunday Incident */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-yellow-400" />
            <h2 className="text-xl font-serif font-bold text-foreground">The Sunday Incident — Five Minutes and a New Router</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            On a Sunday afternoon at approximately 2:00 PM, the router firmware at Riverwalk #5 was upgraded. Within five minutes, property manager José sent a text message saying that Liberty — the ISP — would be arriving to install a new router. Within ten minutes, a young man (late teens or early twenties) arrived with a clipboard and a new router unit.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            This sequence has no plausible routine explanation. Liberty is a mobile-focused provider — ISP infrastructure work of this type would normally be handled by ICE (Instituto Costarricense de Electricidad). Router replacements are not scheduled on Sunday afternoons, do not arrive within ten minutes of a text message, and do not come with a new unit pre-staged and ready to deploy. The response was pre-staged — someone was monitoring the router in real time and triggered a physical response within minutes of the firmware change.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            Simultaneously, the neighbor with long black hair and glasses — believed to be Todd Johnson, the listed property owner — was observed walking down the street and looking through the window, visibly irritated. His reaction was immediate and agitated, consistent with someone who had been alerted to an event rather than someone who happened to be passing by.
          </p>

          <div className="space-y-3 my-6">
            <NumberedItem n="01" title="Firmware upgrade — Sunday 2:00 PM" body="Router firmware at Riverwalk #5 updated. No network disruption announced, no prior notification to the ISP." />
            <NumberedItem n="02" title="Five-minute text from José" body="Property manager texted immediately to say Liberty would be arriving to install a new router. A Sunday afternoon response implies 24/7 monitoring of router administrative events." />
            <NumberedItem n="03" title="Ten-minute physical arrival" body="Young male operative arrived with clipboard and pre-staged replacement router unit. Pre-staged means this was anticipated — the unit was already prepared before the firmware change was detected." />
            <NumberedItem n="04" title="Todd Johnson — simultaneous street observation" body="Property owner (long black hair, glasses) observed walking the street and looking in through the window at the same time as the router incident. Behavioral signature: alert response, not casual passage." />
            <NumberedItem n="05" title="Same Liberty operative — pool work, weeks later" body="The same young male from the router deployment was observed two to three weeks later doing pool maintenance at the Riverwalk property across the street. His cover identity spans both ISP technician and maintenance worker — consistent with an embedded operational asset rather than a contractor." />
          </div>

          <Callout label="FIVE-MINUTE RESPONSE ASSESSMENT" color="red">
            A five-minute text response followed by a ten-minute physical arrival with pre-staged equipment on a Sunday afternoon constitutes real-time router telemetry monitoring with a pre-positioned response asset. This is not ISP customer service. This is infrastructure protection — the firmware upgrade was detected as a threat to the monitoring capability, and a physical response was deployed to restore it.
          </Callout>
        </section>

        <Separator className="my-8" />

        {/* Section 4: The Hanlon Cell */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-4 w-4 text-rose-400" />
            <h2 className="text-xl font-serif font-bold text-foreground">The Hanlon Cell — Placement Across the Street</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            When the house across the street at Riverwalk was empty on arrival. Two to three days after the Sunday router incident, a group moved in: Matthew Hanlon, his wife, a red-haired bearded male associate, and his partner. Their stated reason for being at Riverwalk — that their house in Quebrada Seca was being worked on — was verifiably false. The Riverwalk property across the street is a Greenwald-managed house. Their placement there, within days of the router incident, in a property controlled by the same management network, is not coincidental.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            The group's operational profile is consistent with trained social access personnel. They are physically capable, socially fluent — the type who blend into any environment, go for drinks, make friends easily. Matthew Hanlon made direct contact: he came over, introduced himself, and offered his phone number with a suggestion to go out for drinks. This is a textbook social engineering approach — establish proximity, initiate low-stakes contact, build rapport. The timing (days after the router incident, as a new cover cell for the across-street observation position) makes the social approach a contact operation, not neighborly behavior.
          </p>

          <div className="space-y-3 my-6">
            <NumberedItem n="01" title="Matthew Hanlon — primary contact operative" body="Fit, socially capable. Made direct contact within days of moving in. Offered phone number, suggested drinks. Physical intimidation posture also documented: spent an afternoon kicking a children's punching bag placed outside the target's window with the red-haired associate." />
            <NumberedItem n="02" title="Red-haired bearded associate — direct action operative" body="Physically trained. Claimed at some point to have recently earned a brown belt in jiu-jitsu. Was present during the Riverwalk period and was the individual who carried out the October 14 attack." />
            <NumberedItem n="03" title="Quebrada Seca cover story — false" body="The group claimed their house in Quebrada Seca was being renovated. The Riverwalk across-street property is Greenwald-managed. A legitimate displaced family would not land in a managed property in the same network. The cover story was used to explain their Riverwalk presence without revealing the placement was coordinated." />
            <NumberedItem n="04" title="Camera on garage — acoustic collection point" body="The garage of the across-street house has a camera. The camera position and angle are consistent with use as a reflection surface for directed acoustic collection — ultrasound or parametric audio can be bounced off flat surfaces including camera housings and lenses at the right angles." />
          </div>
        </section>

        <Separator className="my-8" />

        {/* Section 5: El Miro */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-4 w-4 text-green-400" />
            <h2 className="text-xl font-serif font-bold text-foreground">El Miro — The Directed Energy Position</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            On the hill above south Jacó, in an area called El Miro, a Greenwald-connected property displays a recurring anomalous light signature: multicolored, appearing at night, with no wind present, consistently causing visible movement in nearby trees and plants. Multiple video recordings were made of this phenomenon. The movement of plant material in a directed beam pattern with no ambient wind is the physical signature of a parametric speaker or Doppler millimeter-wave radar system operating in the audible or sub-audible range.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            Parametric speakers produce highly directional audio beams by modulating ultrasonic carriers. At close range they cause physical resonance in soft material — including foliage, fabric, and human tissue. From an elevated position on a hill above a target location, a parametric system can deliver audio into a specific room without the source being identifiable from ground level. The multicolored light signature associated with the El Miro position is consistent with visible indicator LEDs from a powered RF or acoustic emitter array.
          </p>

          <Callout label="EL MIRO ASSESSMENT" color="green">
            An elevated property with direct line-of-sight to south Jacó target locations, owned by the same individual managing the router-compromised rental network, displaying a directional anomalous light signature that produces physical movement in vegetation with no wind — this is a directed energy or parametric acoustic position. The Greenwald property cluster in south Jacó forms a layered collection architecture: network surveillance at the router level, human intelligence at the across-street level, and directed acoustic or RF collection from the elevated El Miro position.
          </Callout>
        </section>

        <Separator className="my-8" />

        {/* Section 6: Con Gusto / Acoustic Monitoring */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-4 w-4 text-purple-400" />
            <h2 className="text-xl font-serif font-bold text-foreground">"Con Gusto" — Acoustic Monitoring Confirmation</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            During the Riverwalk period, the Hanlon cell was observed on multiple occasions discussing the target by name — using the designation <em className="text-foreground">"con gusto"</em> — in conversations audible from inside the target's residence. On each occasion when the target opened the door or made the observation visible, the group immediately and seamlessly shifted behavior: conversation stopped, posture changed, and they presented as engaged in unrelated activity.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            This pattern — audible surveillance communication that terminates precisely on target observation — is not casual. The response was trained: too fast and too coordinated to be spontaneous. It indicates a group operating under communication discipline, aware of the target's observation windows, and drilled on cover behavior. The designation "con gusto" is operationally significant: it is a nickname, not a name, suggesting a pre-existing target file.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Section 7: October 14 — The Attack */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-xl font-serif font-bold text-foreground">October 14, 2025 — Piano Wire. US Marshal Claim.</h2>
          </div>

          <div className="p-5 border border-red-800/60 bg-red-950/15 rounded-sm mb-6">
            <div className="text-xs font-mono font-bold text-red-400 mb-3 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" /> Physical Attack — Direct Contact — October 14, 2025
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              On October 14, 2025, the target was choked with piano wire. The individual who carried out the attack was the red-haired, bearded associate of Matthew Hanlon — the same person who had been present at the Riverwalk across-street property during the August–October operational period. During or immediately following the attack, the individuals present identified themselves as <strong className="text-foreground">US Marshals</strong>.
            </p>
          </div>

          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            Piano wire is not a tool of improvised assault. It is a precision weapon requiring specific physical technique. Its use indicates trained direct-action personnel, not a spontaneous confrontation. The claim of US Marshal authority during the attack serves a dual function: it is an attempt to establish legal cover for an extrajudicial physical action, and it is a psychological operation — designed to make the target doubt whether resistance is legally permissible.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            The identification of the attacker as Hanlon's Riverwalk associate — placed in the across-street property within days of the router incident, operating under communication discipline, using a cover story that was verifiably false — closes the loop between the surveillance infrastructure documented above and a direct physical attack on the target. This is not a parallel operation: it is the same cell, moving from collection to action.
          </p>

          <div className="space-y-3 my-6">
            <NumberedItem n="01" title="Date" body="October 14, 2025." />
            <NumberedItem n="02" title="Method" body="Piano wire — strangulation attempt. Precision weapon, not improvised. Requires training." />
            <NumberedItem n="03" title="Attacker" body="Red-haired, bearded male — Matthew Hanlon's associate. Placed at Riverwalk across-street property, August 2025. Claimed recent brown belt in jiu-jitsu during Riverwalk period." />
            <NumberedItem n="04" title="Cover claim during attack" body="The individuals identified themselves as US Marshals. This claim is not verifiable and serves as both legal cover and psychological suppression." />
            <NumberedItem n="05" title="Cell continuity" body="The same cell — Hanlon, red-hair, placed under false cover across the street — transitions from surveillance (August–September) to social engineering (September–October) to direct action (October 14). One operation, three phases." />
          </div>

          <Callout label="ATTACK ASSESSMENT" color="red">
            A cell placed in a managed property under a false cover story, operating under communication discipline with a pre-existing target file, carrying out a precision strangulation attack while claiming federal law enforcement authority — this is not a criminal assault. This is a direct-action intelligence operation. The US Marshal claim during the attack is consistent with state-adjacent or intelligence-affiliated actors who operate with the expectation of legal impunity. The Greenwald property network provided the logistics: housing, network access, and physical proximity to the target.
          </Callout>
        </section>

        <Separator className="my-8" />

        {/* Section 8: Summary */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-serif font-bold text-foreground">Riverwalk — Operational Summary</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            {[
              { label: "Properties in network", value: "6+", sub: "Greenwald / Rent Costa Rica Homes" },
              { label: "Shared router credential", value: "1", sub: "rentcostaricahomes — all properties" },
              { label: "Response time to firmware event", value: "5 min", sub: "Sunday afternoon — pre-staged response" },
              { label: "Days to cell placement", value: "2–3", sub: "After router incident — Hanlon cell moved in" },
              { label: "Attack date", value: "Oct 14", sub: "2025 — piano wire, US Marshal claim" },
              { label: "Operational phases", value: "3", sub: "Collection → Social → Direct Action" },
            ].map(c => (
              <div key={c.label} className="border border-border rounded-sm p-4 bg-card/30 text-center">
                <div className="text-2xl font-mono font-bold text-foreground mb-1">{c.value}</div>
                <div className="text-xs font-semibold text-foreground mb-1">{c.label}</div>
                <div className="text-[10px] text-muted-foreground/60 font-mono">{c.sub}</div>
              </div>
            ))}
          </div>

          <div className="p-5 border border-red-800/40 bg-red-950/10 rounded-sm my-6">
            <div className="text-xs font-mono font-bold text-red-400 mb-3 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" /> KAPPA — Riverwalk Working Assessment
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Riverwalk operation demonstrates a full-spectrum intelligence action using a residential rental network as infrastructure. The Greenwald property cluster provided network access (shared router credentials enabling traffic monitoring across all tenants), physical access (managed properties placed under cover operatives within 72 hours of a detected counter-surveillance action), elevated collection (El Miro directed energy position with line-of-sight to target locations), and a human intelligence cell operating under communication discipline with a pre-existing target file.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              The progression from network surveillance to across-street human placement to direct physical action (October 14 attack, piano wire, US Marshal claim) over a two-month window is consistent with a phased intelligence operation against a single target — escalating from collection to neutralization. The false Quebrada Seca cover story, the trained behavioral response to target observation, and the precision of the attack method all indicate professional tradecraft rather than opportunistic criminal behavior.
            </p>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Physical Evidence */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Camera className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-serif font-bold text-foreground">Physical Evidence — Electrical Infrastructure</h2>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed mb-4 font-serif">
            The following images were captured inside Riverwalk #5. The electrical panel is a commercial-grade Eaton load center — notably oversized for a residential rental. The breaker directory, written in Spanish, maps 28 circuits across the property including five A/C units, two water heaters, and granular room-by-room separation (dormitorios, cocina, sala, escaleras, portón, exterior luces). This level of circuit density — particularly multiple double-pole 30A and 50A breakers alongside standard 15A/20A residential circuits — is consistent with high-draw equipment beyond normal residential use. A separate Eaton sub-panel (model CH8L125SA) is mounted in addition to the main board.
          </p>

          <div className="grid grid-cols-2 gap-3 my-4">
            <div>
              <img src="/evidence/riverwalk_panel_full.jpg" alt="Riverwalk #5 — main Eaton panel, full view" className="w-full rounded-sm border border-border object-cover" />
              <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">Main Eaton panel — Riverwalk #5. Full breaker array, left column includes GFCI/AFCI (green TEST) breakers.</p>
            </div>
            <div>
              <img src="/evidence/riverwalk_panel_breakers.jpg" alt="Riverwalk #5 — panel breaker rows" className="w-full rounded-sm border border-border object-cover" />
              <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">Alternate angle — large-format 30A/50A breakers in lower array visible. Unusual for residential rental.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4">
            <div>
              <img src="/evidence/riverwalk_panel_breaker_directory.jpg" alt="Riverwalk — Spanish breaker directory" className="w-full rounded-sm border border-border" />
              <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">Breaker directory — 28 positions. 5× A/C circuits, 2× water heaters, portón, exterior/luces. Handwritten in Spanish.</p>
            </div>
            <div>
              <img src="/evidence/riverwalk_panel_spec_sheet.jpg" alt="Riverwalk — panel spec sheet on door" className="w-full rounded-sm border border-border" />
              <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">Panel door spec sheet — Eaton load rating and wiring diagram. UL-listed configuration label visible.</p>
            </div>
          </div>

          <div className="max-w-xs my-4">
            <img src="/evidence/riverwalk_panel_subpanel_ch8l125sa.jpg" alt="Eaton sub-panel CH8L125SA" className="w-full rounded-sm border border-border" />
            <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">Separate Eaton sub-panel — model CH8L125SA, 125A main, 8 space. Mounted in addition to main load center. Label: "Distribuidor/Centro de carga."</p>
          </div>

          <Callout label="PANEL ASSESSMENT" color="blue">
            A 28-circuit main panel plus a separate 125A sub-panel in a 3-bed vacation rental is not a standard residential installation. Five A/C circuits and two water heater circuits could reflect legitimate guest comfort infrastructure — however, the additional sub-panel with independent 125A service suggests a secondary high-draw load that is not accounted for by the room-level circuit map. A secondary load of this scale is consistent with rack-mounted equipment (servers, SDR arrays, signal processing hardware) being operated independently of the tenant circuits. The router telemetry response documented in Section 3 confirms active monitoring infrastructure was present; this panel configuration is the power delivery architecture for it.
          </Callout>
        </section>

        <Separator className="my-8" />

        {/* Related */}
        <section className="pb-8">
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground mb-4">Related Intelligence</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { href: "/pochote-headliner", label: "Hotel Pochote Grande — 30 Days Under Surveillance" },
              { href: "/network-analysis", label: "HUMINT Network Analysis" },
              { href: "/evidence", label: "Evidence Chain — SHA-256 log" },
              { href: "/forensics", label: "Network Forensics" },
              { href: "/board", label: "Conspiracy Board" },
              { href: "/articles/jaco-files", label: "The Jacó Files — Full Convergence Article" },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 border border-border/50 rounded-sm px-3 py-2 hover:border-primary/40 transition-colors">
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                {l.label}
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
