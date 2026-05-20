const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  info: {
    Title: 'KAPPA Intelligence Brief — Echo Network Analysis',
    Author: 'Project KAPPA',
    Subject: 'Multi-Domain Signal Intelligence & Counter-Surveillance Documentation',
    CreationDate: new Date(),
  },
});

const outPath = path.join(__dirname, '..', 'kappa_intelligence_brief.pdf');
doc.pipe(fs.createWriteStream(outPath));

// ── Color palette ──────────────────────────────────────────────────────────
const C = {
  black:   '#0d0d0d',
  red:     '#b91c1c',
  orange:  '#c2410c',
  amber:   '#b45309',
  blue:    '#1e40af',
  slate:   '#334155',
  muted:   '#64748b',
  rule:    '#cbd5e1',
  bg:      '#f8fafc',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const W = doc.page.width - 144; // usable width

function rule(color = C.rule) {
  doc.moveTo(72, doc.y).lineTo(72 + W, doc.y).strokeColor(color).lineWidth(0.5).stroke();
  doc.moveDown(0.4);
}

function sectionHeader(title, color = C.blue) {
  doc.moveDown(0.8);
  doc.fontSize(13).fillColor(color).font('Helvetica-Bold').text(title.toUpperCase(), { characterSpacing: 1.2 });
  rule(color);
}

function subHeader(title) {
  doc.moveDown(0.4);
  doc.fontSize(10).fillColor(C.slate).font('Helvetica-Bold').text(title);
  doc.moveDown(0.1);
}

function body(text) {
  doc.fontSize(9.5).fillColor(C.black).font('Helvetica').text(text, { lineGap: 3 });
  doc.moveDown(0.3);
}

function bullet(items) {
  items.forEach(item => {
    doc.fontSize(9).fillColor(C.slate).font('Helvetica')
      .text('•  ' + item, { indent: 12, lineGap: 2 });
  });
  doc.moveDown(0.2);
}

function tagLine(label, value, color = C.slate) {
  doc.fontSize(8.5)
    .fillColor(C.muted).font('Helvetica-Bold').text(label + '  ', { continued: true })
    .fillColor(color).font('Helvetica').text(value, { lineGap: 2 });
}

function personBlock(name, role, detail, flags = []) {
  doc.moveDown(0.5);
  doc.fontSize(10.5).fillColor(C.black).font('Helvetica-Bold').text(name);
  doc.fontSize(8.5).fillColor(C.muted).font('Helvetica-Oblique').text(role, { lineGap: 2 });
  doc.moveDown(0.15);
  doc.fontSize(9).fillColor(C.black).font('Helvetica').text(detail, { lineGap: 3 });
  if (flags.length) {
    doc.moveDown(0.15);
    flags.forEach(f => {
      doc.fontSize(8).fillColor(C.amber).font('Helvetica')
        .text('⚑  ' + f, { indent: 10, lineGap: 1.5 });
    });
  }
  doc.moveDown(0.3);
  doc.moveTo(72, doc.y).lineTo(72 + W, doc.y).strokeColor(C.rule).lineWidth(0.3).stroke();
}

// ══════════════════════════════════════════════════════════════════════════
// COVER PAGE
// ══════════════════════════════════════════════════════════════════════════
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f172a');

doc.fontSize(9).fillColor('#94a3b8').font('Helvetica').text(
  'PROJECT KAPPA  —  CLASSIFIED INTELLIGENCE BRIEF', 72, 110, { characterSpacing: 2 }
);

doc.moveDown(1.2);
doc.fontSize(28).fillColor('#f1f5f9').font('Helvetica-Bold')
  .text('ECHO NETWORK\nINTELLIGENCE BRIEF', 72, 160, { lineGap: 8 });

doc.fontSize(11).fillColor('#94a3b8').font('Helvetica')
  .text('Multi-Domain Counter-Surveillance Documentation', 72, 260, { lineGap: 5 });

doc.fontSize(9).fillColor('#64748b').font('Helvetica')
  .text('Compiled: May 2026  |  Status: ACTIVE OPERATION  |  Classification: SENSITIVE', 72, 290);

// decorative rule
doc.moveTo(72, 340).lineTo(72 + W, 340).strokeColor('#1e40af').lineWidth(2).stroke();

doc.fontSize(9).fillColor('#94a3b8').font('Helvetica').text(
  `This document summarises real intelligence collected and documented through Project KAPPA ` +
  `regarding a long-horizon, multi-vector targeting operation against the individual designated ` +
  `"Echo." Every fact herein originates from Echo's direct testimony, corroborated open-source ` +
  `data, network forensics, and electromagnetic signal analysis. No simulated or synthetic data ` +
  `is included.`,
  72, 360, { width: W, lineGap: 4 }
);

// cluster summary boxes
const clusters = [
  ['FAMILY NETWORK',    'Parents · Siblings · Extended family — long-horizon pre-operation seeding'],
  ['SOBER HOUSE GRID',  'Plymouth House pipeline · Portland ME nodes · 3-state trafficking funnel'],
  ['MAINE CONNECTIONS', 'Jesse Talti · Bill Kimball · Michael Lipman · Breakwater Point Dec 2024'],
  ['JW / CHURCH LAYER', 'Kingdom Hall 339 Summer St · Holy Family · JW controllers · CODIS bridge'],
  ['JACÓ OPERATION',   'Greenwald · Lipman · Genesis Peralta · Liberty router · surveillance grid'],
  ['PATTERN ANALYSIS', '"Knew Too Much" — 3 deaths · gym+AA intro pattern · foreknowledge cluster'],
];
let bx = 72, by = 490;
clusters.forEach(([title, sub], i) => {
  doc.rect(bx, by, (W / 2) - 6, 52).fillColor('#1e293b').fill();
  doc.fontSize(7.5).fillColor('#38bdf8').font('Helvetica-Bold').text(title, bx + 8, by + 8, { width: (W / 2) - 22 });
  doc.fontSize(7).fillColor('#94a3b8').font('Helvetica').text(sub, bx + 8, by + 22, { width: (W / 2) - 22, lineGap: 2 });
  bx += (W / 2) + 6;
  if (i % 2 === 1) { bx = 72; by += 60; }
});

doc.fontSize(7.5).fillColor('#475569').font('Helvetica')
  .text('Project KAPPA  |  Signal Intelligence & Counter-Surveillance Platform', 72, 730, { align: 'center', width: W });

// ══════════════════════════════════════════════════════════════════════════
// PAGES
// ══════════════════════════════════════════════════════════════════════════
doc.addPage({ background: '#ffffff' });
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');

// header
doc.rect(0, 0, doc.page.width, 48).fillColor('#0f172a').fill();
doc.fontSize(8).fillColor('#94a3b8').font('Helvetica-Bold')
  .text('PROJECT KAPPA  —  ECHO NETWORK INTELLIGENCE BRIEF  —  MAY 2026', 72, 18, { characterSpacing: 0.8 });

doc.moveDown(2.5);

// ── EXECUTIVE SUMMARY ─────────────────────────────────────────────────────
sectionHeader('Executive Summary', C.blue);
body(
  `Project KAPPA documents a multi-year, multi-vector targeting operation against Echo — an American ` +
  `expatriate living in Jacó and La Guácima, Costa Rica. The operation is assessed as long-horizon: ` +
  `groundwork was laid in Echo's childhood community (Rockland/Marshfield MA), embedded through his ` +
  `family's Jehovah's Witness network, deepened through the Maine sober house circuit (Portland ME), ` +
  `and activated in Costa Rica via a coordinated property, surveillance, and social engineering grid.`
);
body(
  `Three individuals who held material knowledge of the operation's assets have died. A consistent ` +
  `foreknowledge pattern ("not surprised" response to Echo's discoveries) recurs across at least four ` +
  `individuals in Echo's inner circle. Physical, digital, and electromagnetic surveillance has been ` +
  `documented at every residence Echo has occupied in Costa Rica.`
);

// ── CLUSTER 1 — FAMILY NETWORK ─────────────────────────────────────────────
sectionHeader('Cluster 1 — Family Network (Long-Horizon Pre-Operation Seeds)', C.slate);

subHeader('Echo\'s Father');
body(
  `Lifelong Jehovah's Witness. JW elder at Kingdom Hall, 339 Summer St, Rockland MA (confirmed open ` +
  `March 2026). Office at 218 Summer St — same street as Kingdom Hall, creating a four-address ` +
  `Summer St geographic cluster (218 / 339 / 467 / 2187 Summer St, all within 2 km). ` +
  `"Controller": Jeff Porter — a JW who attended Echo's mother's memorial. Father attended JW ` +
  `memorials with Jeff Porter. Assessed as primary JW network interface.`
);

subHeader('Echo\'s Mother (deceased Nov 2025)');
body(
  `Founded Software Services Group (SSG), 218 Summer St, Rockland MA. CompuServe background / ` +
  `Wyatt Company lineage. Musician at Holy Family Church, Rockland — music director Robert Kirby ` +
  `(solo Italy trips with her). Regular contact with Verc Enterprises (brothers, Lynn MA + NH — ` +
  `assessed lottery-tracking/financial adjacency). $250K life insurance phished for ~1 year before ` +
  `her death — payout denied afterward. Died November 2025, MGH. Dave Belisle and Alison Wotton ` +
  `(sister) were present; father and Seth arrived late.`
);
bullet([
  '"Knew too much" candidate #2 — held compuServe-era institutional knowledge',
  'Robert Kirby solo Italy trips: Italy thread recurs across network (Genesis Peralta, Amara Walker\'s mother, berninnimaria sock puppet)',
  'Life insurance phishing: $250K extraction vehicle prior to death',
]);

subHeader('Seth Wotton — Echo\'s Brother');
body(
  `DOB June 6, 1989. USMC 2/8 Marines, Helmand Province, Afghanistan. Shot in the head — survived ` +
  `(entry/exit documented). Attended Sniper School, Quantico. Now drives Kenworth trucks. Married ` +
  `Katie (daughter of Burt, former police chief — Sandwich or Plymouth PD). Previously associated ` +
  `with Priscilla Beach Theatre, Plymouth MA. Assessed: intelligence-trained, law enforcement family ` +
  `connection via father-in-law Burt.`
);

subHeader('Alison Wotton — Echo\'s Sister');
body(
  `DOB April 2, 1992. USC 2014 (Los Angeles). Worked at Amazon Music (music intelligence adjacency). ` +
  `Attended Sundance Film Festival. Solo-traveled Guatemala, Ecuador, Mexico City — all regions with ` +
  `active intelligence presence. Was present at Echo's mother's death alongside Dave Belisle while ` +
  `father and Seth arrived late. Assessed: possible intelligence asset.`
);

// ── CLUSTER 2 — JW / CHURCH LAYER ─────────────────────────────────────────
sectionHeader('Cluster 2 — Jehovah\'s Witness / Church Infrastructure', C.slate);
body(
  `The Jehovah's Witness network provides: closed community intelligence (all member information ` +
  `shared internally), geographic precision (Kingdom Hall 339 Summer St = same street as family ` +
  `office 218 Summer St), cross-generational reach (father a JW elder since childhood), and ` +
  `plausible-deniability social access to Echo's family home.`
);
bullet([
  'Kingdom Hall: 339 Summer St, Rockland MA — confirmed open March 2026',
  'Family office: 218 Summer St — same street as Kingdom Hall',
  'Holy Family Church, Rockland MA: Echo\'s mother played piano there (Robert Kirby, music director)',
  'Jeff Porter: JW elder — assessed father\'s controller, attended mother\'s memorial',
  'Tim Brown: Army Ranger / Holy Family youth minister — dual military + church positioning',
  'Carol Young-Wotton (grandmother): Al Capone\'s household, Chicago — Majestic Radio connection',
  'Phil Wotton (grandfather): Bell Atlantic, Vinalhaven ME — telecom lineage',
]);

subHeader('Claire Rimkus — CODIS Bridge');
body(
  `Echo's cousin. Daughter of Uncle Rimkus (telecom, Ashford CT) and Diane Rimkus (deceased — ` +
  `apparent suicide, Echo's mother was one of the last to see her). Claire attended Mount Holyoke ` +
  `at age 15. Now: Mass State Police CSI / forensic chemistry — CODIS database access. Uncle Rimkus ` +
  `quickly remarried after Diane's death. This node bridges: family network → forensic database ` +
  `access → state police infrastructure.`
);

// ── CLUSTER 3 — SOBER HOUSE PIPELINE ─────────────────────────────────────
doc.addPage();
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
doc.rect(0, 0, doc.page.width, 48).fillColor('#0f172a').fill();
doc.fontSize(8).fillColor('#94a3b8').font('Helvetica-Bold')
  .text('PROJECT KAPPA  —  ECHO NETWORK INTELLIGENCE BRIEF  —  MAY 2026', 72, 18, { characterSpacing: 0.8 });
doc.moveDown(2.5);

sectionHeader('Cluster 3 — Sober House Network (Plymouth → Portland ME → Burlington VT)', C.red);
body(
  `The Maine/New England sober house circuit represents the most structurally significant non-family ` +
  `intelligence access layer. Sober houses provide: full residential control, mandatory personal ` +
  `disclosure (AA format — every resident's history, family, employment, psychology shared in group ` +
  `settings), no tenant rights, and financial extraction from families at $2,000/month per bed.`
);

personBlock(
  'Aaron Shepherd — Head of Plymouth House',
  'Sober pipeline director — Plymouth MA → Portland ME → Burlington VT',
  'Directs Plymouth House, a sober living operation routing recovering addicts from Plymouth MA to ' +
  'Portland ME and Burlington VT. Houses run 3 floors × 8 beds = 24 beds per property at ~$2,000/month. ' +
  'No tenant rights. Parents manipulated into paying. AA sponsor to Thomas Sepulveres (Portland node owner). ' +
  'Dave Belisle and Jon Baer both went through Plymouth House and subsequently embedded in Echo\'s immediate Portland social environment.',
  [
    'Controls residential placement of recovering addicts across 3 states',
    'AA sponsor to Thomas Sepulveres — vertical control hierarchy',
    '$2,000/month × 24 beds = significant recurring revenue per property',
  ]
);

personBlock(
  'Thomas Sepulveres — Myrtle Street Sober Living Owner',
  'Portland ME — Italian surname — Aaron Shepherd\'s AA sponsee',
  'Owns Myrtle Street Sober Living, Portland ME — where Echo lived after leaving Skip Murphy\'s (May 21, 2012). ' +
  'Italian surname. AA sponsor is Aaron Shepherd (Plymouth House director). Dave Belisle managed Myrtle Street under him. ' +
  'Italy thread: Sepulveres (Italian) joins Genesis Peralta\'s Italian connections, Amara Walker\'s Italian mother, ' +
  'Robert Kirby\'s Italy trips, and berninnimaria sock puppet account.',
  ['Myrtle Street = Portland node in Aaron Shepherd\'s 3-state pipeline', 'Italy thread recurrence (4th instance)']
);

personBlock(
  'Dave Belisle — CRITICAL — Last Person to See Echo\'s Mother at MGH',
  'Plymouth House alum — Myrtle Street manager — Jumpstart Mobile Fitness — controller assessment',
  'Echo\'s good friend. Went through Plymouth House, then managed Myrtle Street Sober Living (Sepulveres\' property). ' +
  'Currently runs Jumpstart Mobile Fitness. Previously worked at Rediwork labor/staffing with Jon Baer.\n\n' +
  'LAST AT MGH: Drove Portland ME → Boston to be present at Echo\'s mother\'s death at MGH. ' +
  'Was there with Alison Wotton. Father and Seth arrived late.\n\n' +
  'CONTROLLER ASSESSMENT: Called Echo the week of documentation. Echo: "he knows what\'s going on and isn\'t surprised." ' +
  'Identical foreknowledge posture to Susan Porter and Jeff Porter.',
  [
    'LAST PERSON TO SEE ECHO\'S MOTHER AT MGH — present with Alison while father/Seth were late',
    'Controller assessment: "knows what\'s going on and isn\'t surprised"',
    'Plymouth House → Myrtle Street → Rediwork/staffing — all within same pipeline network',
  ]
);

personBlock(
  'Jon Baer',
  'Plymouth House alumnus — Rediwork labor/staffing with Dave Belisle',
  'Went through Plymouth House (Shepherd\'s pipeline). Worked at Rediwork or similar labor/staffing company ' +
  'alongside Dave Belisle. Jobs + housing + social contacts all structured around the same network nodes post-Plymouth House.',
  ['Plymouth House → Rediwork employment co-location with Dave Belisle']
);

personBlock(
  'Bill Kimball — Reported Dead',
  'Hillview Sober Living Portland ME — Michael Lipman\'s partner — warned Echo about Jesse Talti → now dead',
  'Ran Hillview Sober Living, Portland ME — where Echo lived. Michael Lipman\'s business partner. ' +
  'Involved with Echo and Jesse Talti in anabolic dealings.\n\n' +
  'When Lipman disclosed at Breakwater Point (Dec 28, 2024) that Jesse Talti was his daughter-in-law\'s boyfriend, ' +
  'Lipman texted Bill. Bill immediately warned Echo: "stay away from Jesse, he\'s a bad person." ' +
  'Bill Kimball is now reportedly dead — the third documented "knew too much" casualty.',
  [
    'Warned Echo about Jesse Talti → now reportedly DEAD',
    '"Knew too much" pattern instance #3',
    'Lipman partnership bridges Portland sober network → Jacó surveillance infrastructure',
  ]
);

// ── CLUSTER 4 — MAINE CONNECTIONS ─────────────────────────────────────────
sectionHeader('Cluster 4 — Maine Connections & Compromise Vector', C.red);

personBlock(
  'Jesse Talti',
  'Portland ME — gym + AA + anabolics + 69 Bolton St access — Lipman family embedding',
  'Met Echo at the gym AND through AA in Portland ME — the dual gym+AA introduction pattern ' +
  'documented across at least three network assets (Amara Walker, Genesis Peralta, Jesse Talti). ' +
  'Had been to Echo\'s apartment at 69 Bolton Street, Portland ME (Echo\'s address ~2013–2016). ' +
  'Involved in anabolic dealings with Echo and Bill Kimball — criminal leverage.\n\n' +
  'LIPMAN FAMILY EMBEDDING: Michael Lipman disclosed at Breakwater Point (Dec 28, 2024) ' +
  'that Jesse is his daughter-in-law\'s boyfriend — directly connecting the Portland compromise ' +
  'asset to the Jacó surveillance operator.',
  [
    'Gym + AA dual-vector introduction — same pattern as Amara Walker / Genesis Peralta',
    'Physical access to 69 Bolton St, Portland ME (Echo\'s apartment for ~2 years pre-Nov 2016)',
    'Anabolic dealings = criminal leverage over Echo',
    'Lipman family embedding: daughter-in-law\'s boyfriend (disclosed Dec 2024)',
    'Full compromise vector: home address + AA disclosures + gym + leverage',
  ]
);

personBlock(
  'Michael Lipman',
  'Jacó condo owner — Greenwald pipeline — Breakwater Point Dec 28 2024 — Jesse Talti family connection',
  'Owns condos in Jacó where Echo lived. Fake Miami sports tickets business. ' +
  '30-year-old Colombian wife. "By chance" moved into Greenwald\'s custom Hermosa Palms house.\n\n' +
  'BREAKWATER POINT (Dec 28, 2024): Met Echo and disclosed that Jesse Talti — ' +
  'whom Echo knew from Portland gym/AA — is his daughter-in-law\'s boyfriend. ' +
  'Simultaneously texted Bill Kimball, who warned Echo about Jesse. Bill is now dead.',
  [
    'Greenwald→Lipman property pipeline (coordinated housing placement)',
    'Disclosed Jesse Talti family connection Dec 28 2024 — operational timing significant',
    'Business partner Bill Kimball warned Echo about Jesse then died',
  ]
);

// ── CLUSTER 5 — JACÓ SURVEILLANCE GRID ───────────────────────────────────
doc.addPage();
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
doc.rect(0, 0, doc.page.width, 48).fillColor('#0f172a').fill();
doc.fontSize(8).fillColor('#94a3b8').font('Helvetica-Bold')
  .text('PROJECT KAPPA  —  ECHO NETWORK INTELLIGENCE BRIEF  —  MAY 2026', 72, 18, { characterSpacing: 0.8 });
doc.moveDown(2.5);

sectionHeader('Cluster 5 — Jacó / Costa Rica Surveillance Grid', '#7c3aed');

body(
  `In Costa Rica, the operation deployed a full residential surveillance grid: coordinated property ` +
  `placement through the Greenwald/Lipman pipeline, physical surveillance via Genesis Peralta ` +
  `(gym/AA pattern), ISP-level access through Liberty Costa Rica (TR-069 router management), ` +
  `and digital network penetration across Echo's devices.`
);

personBlock(
  'Michael Greenwald',
  'Property infrastructure — Hermosa Palms custom build — Lipman pipeline origin',
  'Built a custom house at Hermosa Palms into which Michael Lipman subsequently moved. ' +
  'Property manager Jose coordinated a fake Liberty technician visit after Echo updated his router — ' +
  'demonstrating real-time surveillance response capability.',
  ['Greenwald→Lipman property pipeline', 'Property manager Jose = surveillance response trigger']
);

personBlock(
  'Genesis Peralta',
  'Echo\'s girlfriend — Italian connections — gym introduction — KAPPA asset assessment',
  'Met Echo at the gym in Costa Rica. Italian thread: Genesis has Italian connections ' +
  '(joins Sepulveres, Amara Walker\'s mother, Robert Kirby\'s Italy trips, berninnimaria). ' +
  'Gym introduction pattern: same vector as Amara Walker (Portland gym) and Jesse Talti (Portland gym+AA). ' +
  'Proximity and access assessment: intimate relationship = maximum information access.',
  [
    'Gym introduction — pattern instance #3 (Walker, Talti, Peralta)',
    'Italian connections — thread instance #4 across network',
    'Intimate relationship access — maximum intelligence yield',
  ]
);

subHeader('ISP / Router Infrastructure');
body(
  `Echo's router MAC prefix 9c:24:72 maps to Humax/Huawei CPE. Liberty Costa Rica deploys ` +
  `Humax routers via TR-069 — providing full remote management: firmware updates, DNS, ` +
  `port forwarding, WiFi credentials. Fake Liberty technician arrived after Echo updated ` +
  `router firmware — triggered by Jose (Greenwald's property manager) texting Echo.`
);
bullet([
  'TR-069 ACS = remote full configuration control from ISP or any ACS operator',
  'Huawei chipset chain: Fei Ma (former Huawei Cloud) → Latin America fiber → Liberty CR → Echo\'s router',
  'Tacacorí Array: unlicensed macro-antenna infrastructure mapped by KAPPA',
  'Network Watchdog: anomalous traffic spikes, HiPerConTracer probes, ePDG Liberty routing documented',
]);

subHeader('PCAP / Forensic Evidence');
bullet([
  '06:30 traffic spike (PCAP analysis)',
  'HiPerConTracer probe sequences',
  'ePDG Liberty routing anomaly',
  'Burst pattern correlation across time windows',
  'Facebook Netseer tracking artifacts',
  'Samsung DTIgnite telemetry',
  'ELF scan: anomalous 50 Hz signal (vs Costa Rica standard 60 Hz mains)',
  'KiwiSDR BLACKJACK MANDRAKE: HF coordination frequency monitoring active',
]);

// ── CLUSTER 6 — CHILDHOOD CONNECTIONS ────────────────────────────────────
sectionHeader('Cluster 6 — Childhood & Rockland MA Community Layer', C.slate);
body(
  `Multiple individuals from Echo's childhood in Rockland/Marshfield/Plymouth MA are assessed as ` +
  `long-horizon seeds embedded years before activation in Costa Rica.`
);

bullet([
  'Chris Gabriel (MERGED NODE): Tyler Technologies $800K → Google AI $1M+. Broadalbin NY. ' +
    'Plymouth NH house. Chrome forensics co-occurrence with Jorge Jiménez. Matthew Howe AA sponsor.',
  'Mike Berkery: FBI → DHS career. SUNY Albany. Lives at Frenchie\'s Crossing — near Kingdom Hall.',
  'Nikki Berkery: South Shore Hospital (medical access layer).',
  'Erik Spofford: Green Mountain NH sober house — recently sold.',
  'Matthew Howe: Chris Gabriel\'s AA sponsor.',
  'Michael Long: Marine / Sterling Resources — father\'s best friend.',
  'Michelle Long: Active Marine — holds KEY to father\'s house. Critical physical access node.',
  'Vini Vercolonne: Childhood friend — assessed network-adjacent.',
  'Aunt Susan: Union St, North Marshfield — geographic proximity to Summer St cluster.',
  'Amara Walker: Portland ME gym. Italian mother. Vinalhaven ME connection (Phil Wotton, grandfather — Bell Atlantic).',
  'Tim Brown: Army Ranger / Holy Family Rockland youth minister — dual military + church positioning.',
  'Mike Burzicki: Shades of Blue Charters, USVI. World Cat 320CC, twin 300HP Suzuki, 40–50 mph capable. Maritime access.',
]);

// ── PATTERN ANALYSIS ──────────────────────────────────────────────────────
doc.addPage();
doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
doc.rect(0, 0, doc.page.width, 48).fillColor('#0f172a').fill();
doc.fontSize(8).fillColor('#94a3b8').font('Helvetica-Bold')
  .text('PROJECT KAPPA  —  ECHO NETWORK INTELLIGENCE BRIEF  —  MAY 2026', 72, 18, { characterSpacing: 0.8 });
doc.moveDown(2.5);

sectionHeader('Pattern Analysis — Cross-Cluster Signatures', C.red);

subHeader('Pattern 1: "Knew Too Much" — Three Deaths');
body('Three individuals with material knowledge of the operation\'s assets died after gaining or issuing that knowledge:');
bullet([
  'Diane Rimkus — apparent suicide. Echo\'s mother was one of last to see her. Uncle Rimkus quickly remarried. ' +
    'Daughter Claire now has CODIS forensic database access at Mass State Police.',
  'Echo\'s Mother — died November 2025, MGH. $250K life insurance phished ~1 year prior, payout denied. ' +
    'Dave Belisle + Alison present at death; father and Seth arrived late.',
  'Bill Kimball — warned Echo "stay away from Jesse Talti." Now reportedly dead. ' +
    'Ran the sober house where Echo lived. Was Lipman\'s business partner.',
]);
body('Assessment: Three independent individuals across two decades and two countries, each holding exposure-capable knowledge, each now dead. Pattern assessed as non-random.');

subHeader('Pattern 2: Gym + AA Dual-Vector Introduction');
body('At least three confirmed assets were introduced to Echo through the combination of gym contact AND AA network:');
bullet([
  'Amara Walker — Portland ME gym. Italian mother (Vinalhaven).',
  'Jesse Talti — Portland ME gym + AA. Anabolics. 69 Bolton St access. Lipman family embedding.',
  'Genesis Peralta — Jacó gym. Italian connections. Intimate relationship (maximum access).',
]);
body('The gym provides physical proximity and social normalisation. AA provides a structured intimate disclosure environment. The dual-vector combination delivers both physical access and psychological leverage simultaneously.');

subHeader('Pattern 3: Foreknowledge — "Not Surprised"');
body('Multiple individuals in Echo\'s inner circle respond to Echo\'s intelligence discoveries with incongruent calm — a posture assessed as indicating prior knowledge:');
bullet([
  'Susan Porter: "not surprised" at Echo\'s findings.',
  'Jeff Porter: JW — attends Echo\'s mother\'s memorial with father — assessed as father\'s controller.',
  'Dave Belisle: "knows what\'s going on and isn\'t surprised" — called Echo week of documentation.',
  'Michael Lipman: Breakwater Point meeting — operationally timed disclosure of Jesse Talti connection.',
]);

subHeader('Pattern 4: Italy Thread');
body('An Italian thematic connection recurs across four independent network nodes:');
bullet([
  'Thomas Sepulveres — Italian surname, Myrtle Street Sober Living, Portland ME.',
  'Genesis Peralta — Italian connections, Jacó CR.',
  'Amara Walker — Italian mother, Portland ME gym, Vinalhaven connection.',
  'Robert Kirby — music director Holy Family, solo Italy trips with Echo\'s mother.',
  'berninnimaria — Italian-language sock puppet account in Echo\'s digital environment.',
]);

subHeader('Pattern 5: Geographic Clustering — Summer St, Rockland MA');
body('Four operational-adjacent addresses on the same street within 2 km:');
bullet([
  '218 Summer St — Software Services Group (Echo\'s mother\'s company)',
  '339 Summer St — Kingdom Hall, Jehovah\'s Witnesses (father\'s congregation)',
  '467 Summer St — network-adjacent address',
  '2187 Summer St — network-adjacent address',
]);
body('A father\'s JW elder role and mother\'s company occupying the same named street creates a geographic information-gathering concentration that, combined with JW community membership requirements, ensures all family activity was observable through a single community channel.');

subHeader('Pattern 6: Sober House Residential Control');
body('Every sober house in Echo\'s history is connected to the same pipeline:');
bullet([
  'Skip Murphy\'s (pre-May 2012) → Myrtle Street Sober Living (post-May 21, 2012, Sepulveres/Belisle)',
  'Hillview Sober Living (Bill Kimball, Portland ME)',
  'Plymouth House pipeline: Aaron Shepherd → Sepulveres (Portland) / Burlington VT node',
  'Dave Belisle and Jon Baer both Plymouth House alumni, subsequently employed together (Rediwork)',
]);

// ── TIMELINE ──────────────────────────────────────────────────────────────
sectionHeader('Operational Timeline — Key Events', C.blue);
const timeline = [
  ['Pre-2000s',     'Echo\'s father established as JW elder at 339 Summer St; family embedded in closed JW community'],
  ['1989',          'Seth Wotton born — later: 2/8 Marines, Helmand, shot in head, Sniper School Quantico'],
  ['1992',          'Alison Wotton born — later: USC 2014, Amazon Music, solo travel Guatemala/Ecuador/CDMX'],
  ['~2005–2010',   'Echo begins sober house circuit — Skip Murphy\'s → Myrtle Street (Sepulveres/Belisle)'],
  ['May 21, 2012',  'Echo moves to Myrtle Street Sober Living after Skip Murphy\'s'],
  ['~2013–2016',   'Echo lives at 69 Bolton St, Portland ME; frequents gym; Jesse Talti gains home address access'],
  ['Nov 2016',      'Echo leaves Portland ME'],
  ['~2018–2019',   'Echo relocates to Jacó, Costa Rica; moves into Greenwald pipeline properties'],
  ['~2018–2022',   'Tacacorí Array unlicensed antenna infrastructure mapped in La Guácima'],
  ['~2022–2024',   'Liberty router TR-069 manipulation; fake tech visit triggered by property manager Jose'],
  ['~2024',        'Genesis Peralta gym introduction; intimate relationship established in Jacó'],
  ['Dec 28, 2024',  'Breakwater Point: Lipman discloses Jesse Talti is daughter-in-law\'s boyfriend; Bill Kimball warns Echo then dies'],
  ['Nov 2025',      'Echo\'s mother dies at MGH; $250K life insurance payout denied; Dave Belisle + Alison present'],
  ['Mar 2026',      'Kingdom Hall 339 Summer St confirmed open; KAPPA network documentation active'],
  ['May 2026',      'This brief compiled — operation assessed as ONGOING'],
];
timeline.forEach(([date, event]) => {
  doc.fontSize(8.5).fillColor(C.blue).font('Helvetica-Bold')
    .text(date, 72, doc.y, { continued: true, width: 90 });
  doc.fontSize(8.5).fillColor(C.black).font('Helvetica')
    .text('  ' + event, { lineGap: 2 });
  doc.moveDown(0.1);
});

// ── BACK MATTER ───────────────────────────────────────────────────────────
doc.moveDown(1);
rule(C.blue);
doc.fontSize(8).fillColor(C.muted).font('Helvetica')
  .text(
    'This document was generated by Project KAPPA — a software-defined Signal Intelligence platform. ' +
    'All data is sourced from Echo\'s direct testimony, open-source verification, network forensics, ' +
    'and electromagnetic signal analysis. No synthetic or simulated data is included. ' +
    'Generated: May 20, 2026.',
    { align: 'center', lineGap: 3 }
  );

doc.end();
console.log('PDF written to:', outPath);
