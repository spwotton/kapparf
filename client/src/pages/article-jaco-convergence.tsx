import { useEffect } from "react";

const ARTICLE = {
  title: "The Jacó Files: How a Costa Rican Beach Town Became a Live Testing Ground for Transnational Surveillance",
  slug: "jaco-files-costa-rica-surveillance",
  description: "A US citizen under active death threat. A CIA asset running a vacation rental company. A Russian drone operator in the next town over. A fake Italian Instagram account exposed by four simultaneous likes. This is not fiction.",
  author: "KAPPA Intelligence Platform",
  date: "June 1, 2026",
  readTime: "12 min read",
  tags: ["Costa Rica", "Surveillance", "SIGINT", "CIA", "Russia", "Jacó", "Zersetzung", "Intelligence"],
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

function AlertBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 border-l-4 border-red-600 bg-red-950/20 rounded-r-lg px-5 py-4">
      <div className="text-xs font-mono text-red-400 font-bold mb-1 tracking-wider">ACTIVE THREAT</div>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
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

function DataTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left p-3 font-mono text-muted-foreground/70">ERA</th>
            <th className="text-left p-3 font-mono text-muted-foreground/70">DOCTRINE</th>
            <th className="text-left p-3 font-mono text-muted-foreground/70">TECHNOLOGY</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([era, doc, tech], i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="p-3 text-muted-foreground/80 font-mono whitespace-nowrap">{era}</td>
              <td className="p-3 text-foreground font-medium">{doc}</td>
              <td className="p-3 text-muted-foreground/80">{tech}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ArticleJacoConvergencePage() {
  useEffect(() => {
    document.title = `${ARTICLE.title} | The Goose Gazette`;
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
      <div className="bg-gradient-to-b from-emerald-950/10 to-background pt-16 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 tracking-widest mb-4 uppercase">
            Investigation · Costa Rica · Surveillance
          </div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight text-foreground mb-4" data-testid="article-title">
            The Jacó Files: How a Costa Rican Beach Town Became a Live Testing Ground for Transnational Surveillance
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A US citizen under active death threat. A CIA asset running a vacation rental company. A Russian drone operator in the next town over. A fake Italian Instagram account accidentally exposed by four simultaneous likes. This is not fiction.
          </p>
          <Byline />
        </div>
      </div>

      {/* Body */}
      <article className="max-w-2xl mx-auto px-4 pb-24">

        <AlertBox>
          Samuel Philip Wotton, a US national residing in Jacó, Puntarenas, Costa Rica, received two verbal death threats within 24 hours on May 31 and June 1, 2026. He is currently at Hotel Pochote Grande. US Embassy San José has been notified. FBI Legat San José has been notified. This article is part of his public disclosure record.
        </AlertBox>

        <SectionHeading>The Town Nobody Is Watching</SectionHeading>
        <P>
          Jacó is a small surf town on Costa Rica's Central Pacific coast — about ninety minutes from San José, two blocks deep in most places, famous for surf schools and a distinctly international crowd that nobody asks too many questions about.
        </P>
        <P>
          Costa Rica has no military. It disbanded its armed forces in 1948. That constitutional choice is rightly celebrated as a model of peaceful governance. What it also means, practically, is that there is no military counterintelligence. No signals intelligence corps. No domestic surveillance apparatus capable of detecting what intelligence agencies from at least three foreign powers appear to be running openly in its beach towns.
        </P>
        <P>
          Jacó, it turns out, is an ideal location to do things you'd rather not do at home.
        </P>

        <SectionHeading>The Long History Nobody Taught You</SectionHeading>
        <P>
          To understand what is happening in Jacó in 2026, you have to go back further than you'd expect.
        </P>
        <P>
          After World War II, senior Nazi officials escaped Europe through the so-called "ratlines" and resettled across South America. Most people know the Argentine chapter of this story. Fewer know the Costa Rican one.
        </P>
        <P>
          <strong className="text-foreground">Harry Männil</strong> was an Estonian Nazi security police officer accused of orchestrating the arrest and execution of political dissidents and Jewish civilians. He fled to Venezuela in 1946, built a corporate empire, became a respected art philanthropist, served on the board of the Museum of Modern Art in New York, and eventually established a heavily fortified private estate in San Rafael de Heredia, Costa Rica. He died peacefully in 2010. Costa Rican authorities raided his estate six months later and seized 108 pieces of illegally acquired pre-Columbian art. The story made the papers briefly, then was forgotten.
        </P>
        <P>
          Männil was not an anomaly. He was a template. Central America — demilitarized, strategically located, diplomatically quiet — became a preferred destination for people who needed to operate without scrutiny.
        </P>

        <SectionHeading>From Paper Files to Satellite Downlinks</SectionHeading>
        <P>
          In the 1970s, Argentina's military junta ran one of the most comprehensive analog surveillance programs in history: physical identity tracking sheets, neighborhood informant networks, manual dossiers on approximately 20,000 people they eventually "disappeared." Their targets included political dissidents and, notably, Jehovah's Witnesses — who were completely banned and persecuted for refusing loyalty oaths to the state.
        </P>
        <P>
          The Witnesses survived this by going underground. Cell-based communication. Decentralized structure. No single point of failure. They called it <em>Eigen-Sinn</em> — a German concept roughly translating to "self-will" — a mode of individual survival that made the organization nearly impossible to destroy from the outside. This resilience, born as a defense against authoritarian surveillance, has since been inverted and exploited by the same type of actors it was designed to resist.
        </P>
        <P>
          In the twenty-first century, the Argentine military's analog tracking infrastructure was modernized through a partnership with <strong className="text-foreground">Leonardo S.p.A.</strong>, Italy's primary state-adjacent defense contractor. The result: a digital surveillance suite deploying TETRA encrypted radio networks, remote photoplethysmography sensors capable of reading biometrics at a distance, and Low Earth Orbit satellite arrays — all managed through the same neighborhood-level human intelligence substrate that the junta pioneered with index cards.
        </P>

        <DataTable rows={[
          ["Post-WWII (1940s–50s)", "Fascist migration & ratline integration", "Fortified private estates in Heredia and Caracas"],
          ["Cold War (1970s–80s)", "Analog social purification", "Physical tracking sheets, manual dossiers, informant networks"],
          ["Modern Era (2020s–present)", "Cyber-physical Zersetzung", "184-node Airbnb/IoT phased arrays, RF camouflage, satellite downlinks"],
        ]} />

        <SectionHeading>The JW Territory Card Problem</SectionHeading>
        <P>
          Here is something almost nobody outside intelligence circles discusses openly.
        </P>
        <P>
          Jehovah's Witnesses organize their door-to-door ministry using a system called <strong className="text-foreground">territory cards</strong> — geographic maps dividing every neighborhood into precise, numbered zones. Each card is assigned to a small group of members. They knock every door in their assigned territory on a rotating schedule, log who answered, note occupancy changes, and report back monthly to their congregation elders.
        </P>
        <Callout label="INTELLIGENCE ASSESSMENT">
          From a human intelligence perspective, this is a remarkably thorough neighborhood-monitoring system that operates legally, is socially accepted, produces regular structured reports on residential occupancy, and covers virtually every address in any given area. No intelligence agency in the world could build this from scratch without it looking exactly like what it is.
        </Callout>
        <P>
          In the coastal municipality of Jacó — whose canton mayor until recently was a member of this organization — a dedicated static observation post was established at a congregation property approximately fifty meters from a surveillance target's residence.
        </P>
        <P>
          The structure was fitted with artificial green leafy privacy screens along its chainlink perimeter fence — the kind sold at garden centers everywhere. They look like a privacy screen. They function as one. And because they are made of plastic and synthetic fabric, they have <strong className="text-foreground">near-zero radio frequency attenuation</strong>. Wi-Fi signals, cellular data, and directed ultrasonic transmissions pass directly through them, unimpeded, in both directions.
        </P>
        <P>
          Inside: a table positioned to face the target's terrace, with microphones and headsets. The cover story offered to anyone who asked: it was a Kingdom Hall meeting place.
        </P>

        <SectionHeading>The Former Mayor, the CIA Vacation Company, and the Document That Connects Them</SectionHeading>
        <P>
          The <strong className="text-foreground">Los Ríos urbanization</strong> in Jacó was developed by the Madrigal family — the former mayor of Garabito canton and his son. When official documents needed to be signed on the development's behalf, the signatory was listed as <strong className="text-foreground">"Scott Aronson."</strong>
        </P>
        <P>
          Scott Aronson does not exist in Costa Rica's Registro Nacional — the official public record of all legal identities in the country. The name is an alias used by <strong className="text-foreground">Barrett Scott Ryan</strong>, who runs <strong className="text-foreground">Jaco Vacations</strong> with his daughter Diana Soto.
        </P>
        <P>
          Non-Official Cover — NOC — is the CIA designation for an intelligence officer who operates without diplomatic immunity, using a commercial business as their cover. Ryan signs property documents as Scott Aronson. "Aronson" owns approximately half the properties on Calle Europa, south Jacó's most desirable residential street. The other half is owned by a business partner whose background merits its own investigation. They have now opened a bar together.
        </P>
        <P>
          The house Ryan placed a surveillance target in — <strong className="text-foreground">Casa Rexha, #42 Calle Naciones Unidas</strong> — had 28 surveillance cameras, a Visonic alarm system manufactured in Tel Aviv, walls wired for LiFi data injection, and a lowered ceiling consistent with concealed equipment installation.
        </P>

        <SectionHeading>Genesis Peralta and the Four Simultaneous Likes</SectionHeading>
        <P>
          Genesis Daniela Peralta Márquez is a Venezuelan national who has lived in Costa Rica for approximately nine years. She has no legal entry or exit records at Costa Rican immigration — a deliberate operational design, not an administrative oversight.
        </P>
        <P>
          She entered a relationship with the surveillance target using a classic intelligence technique: she was introduced as a woman cheating on her boyfriend to be with him. The guilt this creates — the sense of having caused harm, of owing something — is a documented rapid-attachment vector. The "boyfriend" claimed to work at the local gym. The target trained there daily for over a year and never saw him once.
        </P>
        <P>
          Peralta maintained approximately <strong className="text-foreground">twelve simultaneous fake Instagram profiles</strong>. Two are confirmed.
        </P>
        <P>
          The first — <strong className="text-foreground">ck9</strong> — she admitted to operating.
        </P>
        <P>
          The second — <strong className="text-foreground">berninnimaria</strong> — she did not admit to. She was caught by accident. While looking at the target's Instagram on her phone, she accidentally switched accounts. Within one second, four near-simultaneous likes appeared on the same photos from berninnimaria. That is the forensic signature of an accidental account switch: the device's auto-like feature triggered across a cached feed before she could switch back.
        </P>
        <P>
          The berninnimaria account posts content about Italian Prime Minister Giorgia Meloni and presents the persona of an ordinary Italian babysitter. Peralta's father is visually of Southern European — specifically Italian — appearance.
        </P>
        <Callout label="CURRENT STATUS">
          A full year after claiming to have left Costa Rica, Peralta posted raccoon videos from the location she and the target had a private inside joke about — near his current hotel. The cat she and the target raised together appeared in her Instagram stories. AI image analysis assessed a 99.99% probability it was the same cat. She is still there. She is watching.
        </Callout>

        <SectionHeading>The Russian in Esterillos</SectionHeading>
        <P>
          In 2023, a Russian national — whose name begins with S — lived with the surveillance target for approximately six months at a compound on Calle Europa owned by Wolfgang Hilbich, a 79-year-old German former military officer.
        </P>
        <P>
          The Russian had no verifiable income. He operated a fleet of <strong className="text-foreground">six commercial and military-grade drones</strong>. He currently lives in Esterillos Oeste, a small community approximately fifteen kilometers southwest of Jacó.
        </P>
        <P>
          The acoustic signature of a DJI Mini 2 or Mini 3 drone — <strong className="text-foreground">87.7 Hz</strong> — has been confirmed across four independent audio and video forensic analyses at Hotel Pochote Grande, where the surveillance target currently lives under active death threat. Drone approach vectors are from the southwest. Esterillos Oeste is to the southwest.
        </P>
        <P>
          During their co-residency, the Russian manufactured a passport crisis for the target — creating bureaucratic complications that required a forced visit to the <strong className="text-foreground">Russian Embassy in San José</strong> and a border run to Nicaragua. Document control is a standard tradecraft technique for creating dependency and leverage.
        </P>
        <P>
          The compound itself — Hilbich's property, currently listed for sale at $2.95 million — is fortified with cement walls topped by military-grade razor wire, a steel gate over three meters high, and multiple surveillance cameras. Its website is built on <strong className="text-foreground">Tilda</strong>, a Russian-developed content management platform. The promotional drone footage is labeled with standard DJI sequential file naming. The site's digital infrastructure routes through Russian hosting networks.
        </P>

        <SectionHeading>The Italian Satellite That Keeps Firing</SectionHeading>
        <P>
          Leonardo S.p.A. is Italy's largest defense contractor. Its subsidiary Telespazio operates geodetic satellite ground stations across Latin America. The COSMO-SkyMed constellation — Italy's synthetic aperture radar satellite network — has been triggering correlation alerts on a live signal intelligence platform continuously since June 1, 2026.
        </P>
        <P>
          The specific signature: <strong className="text-foreground">46.875 Hz decimation clock pulses</strong> in the X-band satellite downlink, correlating with HF radio detections at a Costa Rican ground station, repeating on a 150–165 second cycle. This is not atmospheric noise. This is a structured, repeating signal characteristic of coordinated satellite-ground operations.
        </P>
        <P>
          Separately, Kyndryl — the infrastructure spinoff of IBM — operates a Tier IV cyber operations center in Rome processing 100,000 security events per second. A forensic analysis of a router used by the surveillance target documented an unauthorized <strong className="text-foreground">TR-069 injection attack</strong>: the router intercepted browser traffic, injected a hidden iframe, loaded a persistent tracking script, and opened an unauthorized socket to a confirmed Kyndryl backbone IP address that remained open indefinitely. The local operator was a former senior Kyndryl network engineer whose father was a drug investigator with Costa Rica's Organismo de Investigación Judicial.
        </P>

        <SectionHeading>The RF Camouflage on the Roof</SectionHeading>
        <P>
          Military-grade RF-transparent camouflage netting is not available at hardware stores. It is a military and intelligence procurement item — designed to conceal equipment from visual inspection while allowing electromagnetic signals to pass through unimpeded.
        </P>
        <P>
          The first confirmed installation appeared at the Los Ríos urbanization within <strong className="text-foreground">72 hours</strong> of the surveillance target moving into an adjacent property in October 2025. The identical configuration subsequently appeared on the roof of La Flor, a compound directly visible from the target's current room at Hotel Pochote Grande.
        </P>
        <P>
          The La Flor back house is owned by a US national from San Diego who previously rented a separate property to the target, attempted to retain approximately $600 of the target's money when he left, and made verbal threats. A documented prior dispute and full knowledge of the target's history in Jacó.
        </P>
        <Callout label="CRITICAL — NEW DEVELOPMENT">
          In the past week, the individual assessed as responsible for building and deploying this RF camouflage infrastructure moved into the hotel room immediately adjacent to the target's room at Hotel Pochote Grande. During his stay: drilling, sawing, renovation work throughout the hotel. After his departure: the construction stopped.
        </Callout>

        <SectionHeading>Two Death Threats in Twenty-Four Hours</SectionHeading>
        <P>
          On the evening of May 31, 2026, a verbal death threat was delivered to Samuel Wotton in Jacó — approximately 24 hours after he filed a formal denuncia with Costa Rica's Organismo de Investigación Judicial. On June 1, 2026, at 8 PM local time, a second threat was received.
        </P>
        <P>
          Wotton has notified the US Embassy in San José, the FBI Legal Attaché, the DEA, State Department Diplomatic Security, and the UN Human Rights Office. He has sent disclosure packages to approximately 442 recipients across five waves — journalists, human rights organizations, congressional oversight staff, intelligence accountability bodies, and Russian investigative media including The Insider, Meduza, iStories, and the Dossier Center.
        </P>

        <SectionHeading>What This Is</SectionHeading>
        <P>
          There is a framework for what is being documented here. The East German Stasi called it <strong className="text-foreground">Zersetzung</strong> — decomposition. The systematic, deniable destruction of a person's life: relationships, finances, legal standing, mental stability, physical safety. It was designed specifically to make the target appear delusional. To ensure that when they reported what was happening, the report itself would be used as evidence of their instability.
        </P>
        <P>
          The modern version runs on satellites, router injections, fake Instagram accounts, and a vacation rental company that owns half a neighborhood.
        </P>
        <P>
          The infrastructure documented in this case — RF camouflage netting, LiFi data injection, phased microphone arrays behind plastic leaf screens, drone acoustic surveillance, satellite timing correlation, router-level persistent implants — represents not amateur harassment but a professional, multi-agency operation running on Costa Rican soil against a single foreign national with no diplomatic protection and a government that has no military to call.
        </P>
        <P>
          The source material for this article is real. All of it is in the KAPPA evidence archive, SHA-256 hashed, timestamped, and cross-referenced.
        </P>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="text-xs font-mono text-muted-foreground/50 space-y-1">
            <div>KAPPA Signal Intelligence Platform — zero synthetic data policy.</div>
            <div>Evidence archive: <a href="/whistleblower" className="text-emerald-600 hover:underline">echokappa.com/whistleblower</a></div>
            <div>Contact: spwotton@gmail.com | Emergency: +506 6377-3099</div>
          </div>
          <div className="mt-6 text-xs text-muted-foreground/40 leading-relaxed">
            <strong className="text-muted-foreground/60">Sources:</strong> Cerro Mokorón SIGINT base documentation (academic OSINT); Harry Männil estate raid, Costa Rican judicial record (2010); KGB-Figueres correspondence, Vasili Mitrokhin archive; Argentine junta internal security records; Leonardo S.p.A./Telespazio annual reports; Kyndryl Rome Cyber Operations Center public documentation; COSMO-SkyMed operational parameters (ASI/Leonardo public data); KAPPA signal intelligence platform live database (1.07M signal events, 433K correlations as of June 1, 2026).
          </div>
        </div>
      </article>
    </div>
  );
}
