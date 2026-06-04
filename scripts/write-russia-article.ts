import { db } from "../server/db";
import { gooseArticles } from "../shared/schema";

const headline = "Russian National Operates Drone Surveillance Network Against U.S. Citizen in Costa Rica";
const subhead = "Eighteen months of forensic evidence — RF anomalies, network intrusion, and a death threat — have been filed with U.S. and Costa Rican federal authorities.";

const body = `A Russian national operating out of Esterillos Oeste on Costa Rica's Pacific coast has been the subject of a formal intelligence complaint documenting an 18-month surveillance campaign against a U.S. citizen residing in the Jacó corridor of Puntarenas province.

The subject, identified in court filings only as "J," lived with complainant Samuel Wotton for approximately six months in 2023 before relocating roughly 12 kilometres south. According to forensic documentation reviewed by this desk, J operates multiple high-capability commercial drones and has no visible legitimate income source.

SIGNAL INTELLIGENCE

Radio-frequency spectrum analysis conducted on 17 January 2026 — using a 48 kHz sample rate over a continuous 21-minute recording — detected a persistent 50 Hz ELF anomaly in the Jacó area. Costa Rica's national power grid operates at 60 Hz. A 50 Hz emission is consistent with European and Russian-standard electrical hardware, indicating foreign-sourced equipment operating without licence on Costa Rican soil.

The same recording captured a 46.875 Hz digital-signal-processing clock signature — mathematically derived from the standard 48,000 Hz ÷ 1,024 ratio — at signal-to-noise ratios between +79 and +89 dB. A 97.01 Hz continuous carrier and a 44.2 Hz rotational signature consistent with UAV propeller harmonics were also recorded. Infrasound emissions between 8.95 and 15.4 Hz, a range associated with physiological effects in human subjects, were detected throughout the recording window.

NETWORK FORENSICS

Packet-capture analysis of Wotton's local area network documented unauthorised devices using spoofed MAC addresses, persistent sessions on port 8009 — a Chromecast/cast-control channel used for screen mirroring and remote wake commands — and connection throttling events in which traffic was reduced to 196 packets (approximately 19 kilobytes) over 3.5 minutes, compared with approximately 3,791 packets in comparable baseline windows. Approximately 402,000 packets were recorded routing to more than 200 external IP addresses, including hosts flagged by commercial threat-intelligence platforms.

ISP-level TR-069/CWMP management-plane injection via port 7547 was documented on 30 January 2026, resulting in a forced router reset consistent with remote CPE control.

SATELLITE GEOMETRY — 3 JUNE 2026

At 22:44 UTC on 3 June 2026, three Russian GLONASS-M navigation satellites were simultaneously visible over Jacó: Cosmos 2456 at 51.6 degrees elevation, Cosmos 2434 at 35.2 degrees, and Cosmos 2460 at 22.1 degrees. The DARPA Blackjack constellation asset YAM-3 (SDA POET, NORAD 48915) completed a 59.5-degree elevation pass over the same coordinates at 17:25 Costa Rica time — one of four passes in the 48-hour window computed from current TLE data.

ACTOR NETWORK AND AUTHORITIES

Formal complaints have been filed with Costa Rica's Organismo de Investigación Judicial (Sección de Delitos Informáticos) and the Fiscalía Adjunta contra la Delincuencia Organizada under Ley 8754 (organised crime) and the cybercrime provisions of the Código Penal. On the U.S. side, the complaint has been submitted to the FBI Legal Attaché in San José, the Intelligence Community Inspector General, the House and Senate intelligence committees, the Defense Intelligence Agency, U.S. Southern Command, the DOJ National Security Division, Homeland Security Investigations, and OFAC.

The complaint also names a former Mayor of Garabito canton — Víctor Antonio Ríos Solís, confirmed by Tribunal Supremo de Elecciones case 1260-M-2001 and La Gaceta N.º 249 of 23 December 1998 — as providing municipal infrastructure and maritime-zone land access to the operation, and Setecom S.A., which holds Costa Rica's exclusive national distribution contract for Deep Sea Electronics generator controllers. Four CISA-published CVEs affect the deployed models, including remote code execution and unauthenticated shutdown, with Modbus port 502 publicly exposed on Setecom's public IP.

On the evening of 31 May 2026, approximately 24 hours after Wotton filed his first formal disclosure with U.S. authorities, he received an explicit verbal death threat. The KAPPA threat-correlation index stood at 85.74 — rated CRITICAL — at the time of publication.`;

async function main() {
  const [article] = await db.insert(gooseArticles).values({
    headline,
    subhead,
    body,
    tag: "INTEL",
    category: "intelligence",
    authorByline: "KAPPA SIGINT Desk",
    approved: true,
    sourceDescription: "KAPPA documented evidence — 3 June 2026",
    templateUsed: "investigative",
    wordCount: body.split(/\s+/).length,
    publishedAt: new Date(),
  }).returning();

  console.log("✓ Inserted:", article.id);
  console.log("  Headline:", article.headline);
  console.log("  Words:", article.wordCount);
}

main().catch(e => { console.error(e); process.exit(1); });
