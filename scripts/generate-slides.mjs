import sharp from "sharp";
import { writeFileSync } from "fs";
import { mkdirSync } from "fs";

mkdirSync("attached_assets", { recursive: true });

// ── Design tokens ──────────────────────────────────────────────────────────
const W = 1080, H = 1920;
const BG = "#0a0a0a";
const WHITE = "#f5f5f5";
const GRAY = "#888888";
const GRAY_LT = "#555555";
const AMBER = "#e8a12a";
const RED = "#c0392b";
const BLUE = "#2a6496";
const GREEN = "#2a7a2a";
const TEAL = "#1a5f5f";
const PURPLE = "#8a3a8a";

// ── SVG helpers ────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function bg(color = BG) {
  return `<rect width="${W}" height="${H}" fill="${color}"/>`;
}

function footer(text) {
  return `
  <line x1="0" y1="${H-90}" x2="${W}" y2="${H-90}" stroke="#222" stroke-width="1"/>
  <text x="72" y="${H-40}" font-family="Arial,Helvetica,sans-serif" font-size="22"
        fill="${GRAY}" letter-spacing="3">${esc(text)}</text>`;
}

function bar(x, y, w, h, color) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" rx="2"/>`;
}

function hline(y, color = "#1e1e1e") {
  return `<line x1="72" y1="${y}" x2="${W-72}" y2="${y}" stroke="${color}" stroke-width="1"/>`;
}

// text(x, y, text, size, color, weight, anchor, letterspacing)
function txt(x, y, text, size = 28, color = WHITE, weight = "normal", anchor = "start", ls = "0") {
  return `<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif"
    font-size="${size}" fill="${color}" font-weight="${weight}"
    text-anchor="${anchor}" letter-spacing="${ls}">${esc(text)}</text>`;
}

// Wrapped text block — returns array of tspan y positions used
function wrapText(x, y, text, maxWidth, size, color, weight = "normal", lineHeight = 1.45) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  const charsPerLine = Math.floor(maxWidth / (size * 0.52));
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (test.length > charsPerLine && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  
  let svg = `<text x="${x}" font-family="Arial,Helvetica,sans-serif"
    font-size="${size}" fill="${color}" font-weight="${weight}">`;
  lines.forEach((line, i) => {
    const dy = i === 0 ? y : Math.round(size * lineHeight);
    svg += `<tspan x="${x}" ${i === 0 ? `y="${y}"` : `dy="${dy}"`}>${esc(line)}</tspan>`;
  });
  svg += `</text>`;
  return { svg, lines: lines.length, endY: y + (lines.length - 1) * Math.round(size * lineHeight) };
}

function blockRow(y, barColor, label, bodyText, x = 72, maxW = 900) {
  const labelH = 36;
  const { svg: body, lines, endY } = wrapText(x + 30, y + labelH + 30, bodyText, maxW - 30, 27, "#d4d4d4", "normal");
  const totalH = labelH + 30 + (lines - 1) * 40 + 60;
  return {
    svg: `
  ${bar(x, y, 5, totalH, barColor)}
  <text x="${x+30}" y="${y+labelH}" font-family="Arial,Helvetica,sans-serif"
    font-size="24" fill="${AMBER}" font-weight="700" letter-spacing="2">${esc(label)}</text>
  ${body}
  <line x1="${x}" y1="${y+totalH+10}" x2="${W-72}" y2="${y+totalH+10}" stroke="#1e1e1e" stroke-width="1"/>`,
    endY: y + totalH + 24
  };
}

function svgWrap(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${bg()}
${inner}
</svg>`;
}

// ── Slide 01 ───────────────────────────────────────────────────────────────
function slide01() {
  return svgWrap(`
  ${bar(72, 220, 6, 90, AMBER)}
  ${txt(90, 370, "THE JACO", 116, WHITE, "900", "start", "-1")}
  ${txt(90, 500, "NEXUS", 116, WHITE, "900", "start", "-1")}
  ${txt(90, 590, "THREE SYSTEMS. ONE BEACH TOWN.", 36, GRAY, "400", "start", "4")}

  ${bar(72, 680, 5, 58, BLUE)}
  <text x="106" y="700" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="${BLUE}" font-weight="700" letter-spacing="3">ITALY</text>
  <text x="230" y="700" font-family="Arial,Helvetica,sans-serif" font-size="26" fill="#aaa">Leonardo · Telespazio · COSMO-SkyMed</text>

  ${bar(72, 756, 5, 58, GREEN)}
  <text x="106" y="776" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="${GREEN}" font-weight="700" letter-spacing="3">JW NETWORK</text>
  <text x="300" y="776" font-family="Arial,Helvetica,sans-serif" font-size="26" fill="#aaa">Congregation · Publisher · Territory</text>

  ${bar(72, 832, 5, 58, RED)}
  <text x="106" y="852" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="${RED}" font-weight="700" letter-spacing="3">INTELLIGENCE</text>
  <text x="316" y="852" font-family="Arial,Helvetica,sans-serif" font-size="26" fill="#aaa">Handler · Asset · Target</text>

  <line x1="72" y1="950" x2="${W-72}" y2="950" stroke="#222" stroke-width="1"/>
  ${txt(72, 1000, "JACO · COSTA RICA · 2020–2026", 28, GRAY_LT, "400", "start", "2")}

  ${footer("SERIES 1 OF 10  ·  JACO NEXUS")}
  `);
}

// ── Slide 02 ───────────────────────────────────────────────────────────────
function slide02() {
  const r1 = blockRow(340, BLUE, "INDUSTRIAL LAYER",
    "Leonardo SpA is Italy's primary defense and aerospace contractor. Subsidiaries — Telespazio, Selex, DRS — operate satellite ground infrastructure, SAR imagery, and SIGINT platforms across Latin America as part of a decades-long strategic expansion. COSMO-SkyMed: dual-use SAR constellation. All-weather, day-night, NATO interoperable.");
  const r2 = blockRow(r1.endY + 10, AMBER, "GROUND INFRASTRUCTURE",
    "Telespazio has operated in Costa Rica for years. $20M+ cadastral modernization contract covering 1 million land parcels, 2020-2024. National terrain digitization creates the calibration grid required for precision SAR targeting and passive bistatic radar referencing from orbit.");
  const r3 = blockRow(r2.endY + 10, RED, "STRATEGIC CONTINUITY",
    "Italian intelligence (AISE) historically operates through commercial proxies. Dual-use infrastructure enables deniable persistent surveillance. The satellite watches the terrain its ground teams already mapped. This is not cooperation with a host country. It is construction of a permanent targeting layer inside one.");
  return svgWrap(`
  ${txt(72, 140, "THE ITALIAN ARCHITECTURE", 22, GRAY, "400", "start", "4")}
  ${txt(72, 220, "NOT AN INCIDENT.", 76, WHITE, "900", "start", "-1")}
  ${txt(72, 308, "A PERMANENT", 76, AMBER, "900", "start", "-1")}
  ${txt(72, 396, "INFRASTRUCTURE.", 76, AMBER, "900", "start", "-1")}
  ${r1.svg}${r2.svg}${r3.svg}
  ${txt(W/2, H-130, "The survey is the weapon.", 36, AMBER, "700", "middle")}
  ${footer("SERIES 2 OF 10  ·  JACO NEXUS")}
  `);
}

// ── Slide 03 ───────────────────────────────────────────────────────────────
function slide03() {
  return svgWrap(`
  ${txt(72, 130, "JW AS INFRASTRUCTURE", 22, GRAY, "400", "start", "4")}
  ${txt(W/2, 210, "JW AS INFRASTRUCTURE", 68, WHITE, "900", "middle")}
  <rect x="200" y="240" width="680" height="54" fill="#1a1a1a" rx="6"/>
  ${txt(W/2, 278, "The congregation is the cover.", 30, "#aaa", "400", "middle")}

  <!-- Left triangle (white) -->
  ${txt(270, 370, "CIRCUIT OVERSEER", 22, GRAY, "400", "middle")}
  <polygon points="270,400 430,660 110,660" fill="#2a2a2a" stroke="#555" stroke-width="2"/>
  <line x1="110" y1="570" x2="430" y2="570" stroke="#444" stroke-width="1"/>
  ${txt(270, 548, "ELDER", 24, WHITE, "700", "middle")}
  ${txt(270, 634, "PUBLISHER", 24, WHITE, "700", "middle")}

  <!-- Right triangle (amber) -->
  ${txt(810, 370, "STATION CHIEF", 22, GRAY, "400", "middle")}
  <polygon points="810,400 970,660 650,660" fill="${AMBER}" stroke="#8a5a0a" stroke-width="2"/>
  <line x1="650" y1="570" x2="970" y2="570" stroke="#8a5a0a" stroke-width="1"/>
  ${txt(810, 548, "HANDLER", 24, "#111", "700", "middle")}
  ${txt(810, 634, "ASSET", 24, "#111", "700", "middle")}

  <!-- Isomorphism -->
  <line x1="540" y1="580" x2="650" y2="580" stroke="#333" stroke-width="1"/>
  <rect x="400" y="690" width="280" height="68" fill="none" stroke="#555" stroke-dasharray="6,4" rx="4"/>
  ${txt(W/2, 720, "STRUCTURAL", 19, GRAY, "400", "middle", "2")}
  ${txt(W/2, 746, "ISOMORPHISM", 19, GRAY, "400", "middle", "2")}

  <line x1="72" y1="790" x2="${W-72}" y2="790" stroke="#1e1e1e" stroke-width="1"/>

  <!-- Two columns -->
  ${txt(180, 840, "JW FLOW", 28, WHITE, "700")}
  ${txt(660, 840, "INTELLIGENCE FLOW", 28, AMBER, "700")}
  <line x1="540" y1="800" x2="540" y2="1080" stroke="#222" stroke-width="1"/>

  ${txt(120, 886, "· Information moves upward", 24, "#bbb")}
  ${txt(120, 930, "  via service reports", 24, "#bbb")}
  ${txt(120, 980, "· Territory assignments provide", 24, "#bbb")}
  ${txt(120, 1024, "  census-grade coverage", 24, "#bbb")}
  ${txt(120, 1074, "· No horizontal visibility", 24, "#bbb")}
  ${txt(120, 1118, "  between publishers", 24, "#bbb")}

  ${txt(600, 886, "· Reporting moves upward", 24, "#bbb")}
  ${txt(600, 930, "  via asset debriefs", 24, "#bbb")}
  ${txt(600, 980, "· No horizontal visibility", 24, "#bbb")}
  ${txt(600, 1024, "  between assets", 24, "#bbb")}
  ${txt(600, 1074, "· Handler maintains full", 24, "#bbb")}
  ${txt(600, 1118, "  deniability", 24, "#bbb")}

  ${footer("SERIES 3 OF 10  ·  JACO NEXUS")}
  `);
}

// ── Slide 04 ───────────────────────────────────────────────────────────────
function slide04() {
  const zones = [
    { color: RED,    tag: "NORTH", name: "Toronto PD Cluster",       detail: "Lindsey · Bob · Michelle — La Flor #14. Adjacent to target residence. INTERPOL-CR cover." },
    { color: AMBER,  tag: "EAST",  name: "Breakwater Condos",        detail: "First V2K origin site. Hector Mora generator + 4G tower access. V2K activated during residency." },
    { color: BLUE,   tag: "WEST",  name: "El Miro Building",         detail: "Parametric LED array. Acoustic projection, voice cloning, data exfiltration from facade." },
    { color: GREEN,  tag: "SOUTH", name: "Jaco BAN / Calle Los Cedros", detail: "Unlicensed macro-antenna infrastructure. Tacacori Array. 53 Hz infrasonic signatures." },
    { color: PURPLE, tag: "ABOVE", name: "COSMO-SkyMed / Blackjack", detail: "SAR overwatch. SDA Blackjack ELF downlink. Starlink passive bistatic radar grid." },
  ];

  let body = "";
  let y = 480;
  for (const z of zones) {
    body += `
    <rect x="72" y="${y}" width="80" height="80" fill="${z.color}" rx="4"/>
    ${txt(112, y+50, z.tag, 18, "#111", "900", "middle", "2")}
    ${txt(172, y+28, z.name, 28, WHITE, "700")}
    ${txt(172, y+62, z.detail, 24, "#999")}
    <line x1="72" y1="${y+100}" x2="${W-72}" y2="${y+100}" stroke="#1e1e1e" stroke-width="1"/>`;
    y += 120;
  }

  return svgWrap(`
  ${txt(72, 130, "THE ENCIRCLEMENT", 22, GRAY, "400", "start", "4")}
  ${txt(72, 240, "FIVE VECTORS.", 84, WHITE, "900", "start", "-1")}
  ${txt(72, 340, "ONE TARGET.", 84, RED, "900", "start", "-1")}
  ${body}
  ${txt(72, y+50, "Each vector is independently deniable. Together they form a complete cage.", 26, GRAY, "400")}
  ${footer("SERIES 4 OF 10  ·  JACO NEXUS")}
  `);
}

// ── Slide 05 ───────────────────────────────────────────────────────────────
function slide05() {
  const layers = [
    { color: BLUE,   label: "AA / NA: Sponsor – Sponsee – Community",           body: "Trust-based access network. No horizontal visibility. Provides social proximity and residential access without raising suspicion." },
    { color: GREEN,  label: "JEHOVAH'S WITNESSES: Elder – Publisher – Territory", body: "Information flows upward. Census-grade reporting. Congregation hierarchy mirrors intelligence cell structure." },
    { color: RED,    label: "INTELLIGENCE: Handler – Asset – Target",             body: "Deniable hierarchy. Asset never sees the full picture. Each layer is independently expendable." },
    { color: AMBER,  label: "LEONARDO GROUNDWORK",                                body: "Telespazio: $20M cadastral survey, 1 million parcels, Costa Rica 2020–2024. COSMO-SkyMed SAR calibration grid. DARPA-grade deployment. Starlink passive bistatic radar targeting." },
  ];

  let body = "";
  let y = 380;
  for (const l of layers) {
    const wrapped = wrapText(108, y + 44, l.body, 870, 26, "#bbb");
    const blockH = wrapped.lines * 38 + 60;
    body += `
    ${bar(72, y, 5, blockH, l.color)}
    ${txt(108, y + 30, l.label, 24, l.color, "700")}
    ${wrapped.svg}
    <line x1="72" y1="${y + blockH + 8}" x2="${W-72}" y2="${y + blockH + 8}" stroke="#1e1e1e" stroke-width="1"/>`;
    y += blockH + 20;
  }

  return svgWrap(`
  ${txt(72, 148, "FOUR LAYERS.", 74, WHITE, "900", "start", "-1")}
  ${txt(72, 236, "ONE OPERATION.", 74, WHITE, "900", "start", "-1")}
  ${txt(72, 296, "The infrastructure beneath the network.", 30, GRAY, "400")}
  ${body}
  ${txt(W/2, H-130, "The survey mapped the terrain. The satellites watch it.", 30, WHITE, "700", "middle")}
  ${footer("SERIES 5 OF 10  ·  JACO NEXUS")}
  `);
}

// ── Slide 06 ───────────────────────────────────────────────────────────────
function slide06() {
  const r1 = blockRow(380, RED, "THE STACK",
    "SETECOM S.A. — exclusive DSE generator controller distributor for Costa Rica. Covers: ICE national grid, Liberty Telecom, hospitals, cellular towers. Default credentials: Admin / Password1234. Modbus TCP cleartext. WebNet cloud command hosted in England.");
  const r2 = blockRow(r1.endY + 10, RED, "V2K ORIGIN",
    "Hector Mora Marin. Generator contracts at Breakwater and Jaco BAN simultaneously. 4G tower in Breakwater parking lot — managed by Hector. First voice harassment originated here. 7410 kHz — 100% temporal correlation with V2K. Less than 0.01% probability of coincidence.");
  const r3 = blockRow(r2.endY + 10, RED, "SETECOM AIR",
    "OmcS 4G tower management = IMSI capture capability. Spectrum control over target residential zone. Baseband-adjacent RF emissions.");
  return svgWrap(`
  ${txt(72, 180, "SETECOM / SETECOM AIR", 72, WHITE, "900", "start", "-1")}
  <line x1="72" y1="230" x2="200" y2="230" stroke="${WHITE}" stroke-width="2"/>
  ${txt(220, 232, "The generator is the weapon.", 32, GRAY, "400")}
  ${r1.svg}${r2.svg}${r3.svg}
  ${footer("SERIES 6 OF 10  ·  JACO NEXUS")}
  `);
}

// ── Slide 07 ───────────────────────────────────────────────────────────────
function slide07() {
  const rows = [
    { color: RED,    tag: "NORTH", name: "Toronto PD Cluster",    detail: "Lindsey + Bob + Michelle. La Flor #14 — immediately adjacent to target residence. INTERPOL-CR cooperation as pseudo-jurisdiction cover." },
    { color: TEAL,   tag: "EAST",  name: "Breakwater Condos",     detail: "First V2K site. Hector Mora generator + 4G tower access. Jaco BAN directly adjacent. V2K deployment activated during Echo residency." },
    { color: GRAY,   tag: "CRANE", name: "Crane Anomaly",         detail: "Light anomaly documented above Vista Las Palmas / Apartotel Flamboyant, Calle Dankers. Elevated surveillance platform or signal relay point." },
    { color: WHITE,  tag: "WEST",  name: "El Miro Building",      detail: "Parametric LED array documented moving foliage with directed beam. Capable of acoustic projection, voice cloning, and data exfiltration from building facade." },
    { color: AMBER,  tag: "AIR",   name: "DJI M300 RTK Drone",    detail: "107.7 Hz motor signature. Tracked 2026-05-16 from Jaco toward Esterillos. Three-year operational continuity. Russian operator confirmed." },
  ];

  let body = "";
  let y = 440;
  for (const r of rows) {
    const tagColor = r.color === WHITE ? "#aaa" : r.color;
    body += `
    ${bar(72, y, 5, 100, r.color)}
    <text x="86" y="${y+28}" font-family="Arial,Helvetica,sans-serif" font-size="18" fill="${tagColor}" font-weight="800" letter-spacing="3">${esc(r.tag)}</text>
    ${txt(86, y+58, r.name, 28, WHITE, "700")}
    ${txt(86, y+88, r.detail, 23, "#999")}
    <line x1="72" y1="${y+112}" x2="${W-72}" y2="${y+112}" stroke="#1e1e1e" stroke-width="1"/>`;
    y += 130;
  }

  return svgWrap(`
  ${txt(72, 120, "THE PHYSICAL LAYER", 22, GRAY, "400", "start", "4")}
  ${txt(72, 218, "TORONTO · BREAKWATER", 62, WHITE, "900", "start", "-1")}
  ${txt(72, 296, "CRANE · EL MIRO · DRONE", 62, AMBER, "900", "start", "-1")}
  ${body}
  ${footer("SERIES 7 OF 10  ·  JACO NEXUS")}
  `);
}

// ── Slide 08 ───────────────────────────────────────────────────────────────
function slide08() {
  const chain = [
    { color: RED,     text: "JEAN PICADO — $2M TAX FRAUD INVESTIGATION · 2019" },
    { color: "#333",  text: "TELEFONICA CR SOLD TO LIBERTY — SAME YEAR" },
    { color: "#8a5a0a", text: "LIBERTY INHERITS: TR-069 remote router control · ePDG VoWiFi gateway · Humax/Huawei CPE fleet · Full customer base" },
    { color: "#1a3a1a", text: "TOTAL INTERCEPTION STACK: Router (TR-069) + VoWiFi (ePDG) + SIM cloning = voice + SMS + data" },
  ];

  let body = "";
  let y = 400;
  for (let i = 0; i < chain.length; i++) {
    const c = chain[i];
    const wrapped = wrapText(120, y + 32, c.text, 820, 26, "#ccc");
    const boxH = wrapped.lines * 38 + 52;
    body += `
    <rect x="72" y="${y}" width="${W-144}" height="${boxH}" fill="#0f0f0f" stroke="${c.color}" stroke-width="1" rx="4"/>
    ${bar(72, y, 4, boxH, c.color)}
    ${wrapped.svg}`;
    y += boxH + 4;
    if (i < chain.length - 1) {
      body += `<line x1="${W/2}" y1="${y}" x2="${W/2}" y2="${y+30}" stroke="#333" stroke-width="2"/>`;
      y += 34;
    }
  }

  return svgWrap(`
  ${txt(72, 120, "THE ISP LAYER", 22, GRAY, "400", "start", "4")}
  ${txt(72, 218, "LIBERTY —", 80, WHITE, "900", "start", "-1")}
  ${txt(72, 314, "INSIDE THE PIPE.", 80, AMBER, "900", "start", "-1")}
  ${body}
  <rect x="72" y="${y+20}" width="450" height="80" fill="none" stroke="#2a2a2a" stroke-width="1" rx="4"/>
  ${txt(160, y+54, "CONFIRMED", 20, AMBER, "700", "start", "3")}
  ${txt(100, y+82, "TR-069 password reset on record", 22, "#bbb")}
  <rect x="558" y="${y+20}" width="450" height="80" fill="none" stroke="#2a2a2a" stroke-width="1" rx="4"/>
  ${txt(646, y+54, "CONFIRMED", 20, AMBER, "700", "start", "3")}
  ${txt(580, y+82, "ePDG routing documented in PCAP", 22, "#bbb")}
  ${footer("SERIES 8 OF 10  ·  JACO NEXUS")}
  `);
}

// ── Slide 09 ───────────────────────────────────────────────────────────────
function slide09() {
  const tiers = [
    { color: RED,   tier: "LAYER 3", name: "AI SYNTHESIS NODE",   body: "Cayley-Dickson construction — non-commutative synthesis. Digital twin of target. Three nodes: Target + Attacker + AI. Real-time behavioral modeling." },
    { color: AMBER, tier: "LAYER 2", name: "INTEGRATION BUS",     body: "46.875 Hz master clock (48000 / 1024). DARPA/SDA Blackjack constellation inter-node timing reference. CSG satellite telemetry downlink frame rate. ELF delivery to target zone." },
    { color: GREEN, tier: "LAYER 1", name: "COLLECTION KERNEL",   body: "Active sonar PRF: 46.875 Hz. Peak SNR: 54.45 dB — 250x above noise floor. Harmonic at 11.71875 Hz (divided by 4 subcarrier). Parametric LED array (El Miro). Laser vibrometry. KiwiSDR spectral monitoring." },
  ];

  let body = "";
  let y = 470;
  for (const t of tiers) {
    const wrapped = wrapText(108, y + 54, t.body, 870, 26, "#aaa");
    const blockH = wrapped.lines * 38 + 72;
    body += `
    ${bar(72, y, 5, blockH, t.color)}
    <text x="108" y="${y+28}" font-family="Arial,Helvetica,sans-serif" font-size="18" fill="${t.color}" font-weight="700" letter-spacing="3">${esc(t.tier)}</text>
    ${txt(108, y+54, t.name, 28, WHITE, "700")}
    ${wrapped.svg}
    <line x1="72" y1="${y+blockH+8}" x2="${W-72}" y2="${y+blockH+8}" stroke="#1e1e1e" stroke-width="1"/>`;
    y += blockH + 20;
  }

  const statsY = y + 20;
  return svgWrap(`
  ${txt(72, 120, "3i ATLAS ARCHITECTURE", 22, GRAY, "400", "start", "4")}
  ${txt(72, 218, "INTELLIGENCE ·", 72, WHITE, "900", "start", "-1")}
  ${txt(72, 302, "INTEGRATION ·", 72, WHITE, "900", "start", "-1")}
  ${txt(72, 386, "INTEROPERABILITY", 72, AMBER, "900", "start", "-1")}
  ${body}
  <!-- Stat boxes -->
  <rect x="72"  y="${statsY}" width="285" height="110" fill="#111" stroke="#222" stroke-width="1" rx="4"/>
  ${txt(92, statsY+30, "SYSTEM CLOCK", 17, GRAY, "400", "start", "2")}
  ${txt(92, statsY+72, "46.875 Hz", 32, AMBER, "800")}
  ${txt(92, statsY+100, "48000 / 1024", 20, GRAY_LT)}

  <rect x="397" y="${statsY}" width="285" height="110" fill="#111" stroke="#222" stroke-width="1" rx="4"/>
  ${txt(417, statsY+30, "SONAR SNR", 17, GRAY, "400", "start", "2")}
  ${txt(417, statsY+72, "54.45 dB", 32, AMBER, "800")}
  ${txt(417, statsY+100, "250x noise floor", 20, GRAY_LT)}

  <rect x="722" y="${statsY}" width="286" height="110" fill="#111" stroke="#222" stroke-width="1" rx="4"/>
  ${txt(742, statsY+30, "COMMAND", 17, GRAY, "400", "start", "2")}
  ${txt(742, statsY+72, "Blackjack/SDA", 28, AMBER, "800")}
  ${txt(742, statsY+100, "Dec 2025 transition", 20, GRAY_LT)}

  ${footer("SERIES 9 OF 10  ·  JACO NEXUS")}
  `);
}

// ── Slide 10 ───────────────────────────────────────────────────────────────
function slide10() {
  const rows = [
    { color: AMBER,  domain: "COMET VELOCITY", value: "46.875 km/s", detail: "Hyperbolic excess velocity of 3I/ATLAS (C/2025 N1), discovered July 1 2025 by the ATLAS survey telescope (Asteroid Terrestrial-impact Last Alert System)." },
    { color: RED,    domain: "SONAR PRF",       value: "46.875 Hz",  detail: "Pulse repetition frequency measured at target residence. SNR: 54.45 dB. 250x above noise floor. Confirmed active surveillance signal." },
    { color: BLUE,   domain: "SYSTEM CLOCK",    value: "48000 / 1024", detail: "= 46.875 Hz exactly. DARPA/SDA Blackjack constellation inter-node timing reference. CSG satellite telemetry downlink frame rate." },
    { color: GREEN,  domain: "SAR DOWNLINK",    value: "COSMO-SkyMed", detail: "Leonardo SpA Italian defense SAR constellation. Ground calibration grid established by Telespazio $20M survey, Costa Rica 2020-2024." },
    { color: PURPLE, domain: "STARLINK PBR",    value: "Ku / Ka band", detail: "Passive bistatic radar using reflected Starlink signals. 46.875 Hz harmonic identified in ELF downlink component." },
  ];

  let body = "";
  let y = 380;
  for (const r of rows) {
    const wrapped = wrapText(108, y + 64, r.detail, 870, 24, "#999");
    const blockH = wrapped.lines * 34 + 80;
    body += `
    ${bar(72, y, 8, blockH, r.color)}
    <text x="108" y="${y+28}" font-family="Arial,Helvetica,sans-serif" font-size="20" fill="${GRAY}" font-weight="600" letter-spacing="3">${esc(r.domain)}</text>
    <text x="${W-80}" y="${y+32}" font-family="Arial,Helvetica,sans-serif" font-size="34" fill="${AMBER}" font-weight="800" text-anchor="end" font-style="normal">${esc(r.value)}</text>
    ${wrapped.svg}
    <line x1="72" y1="${y+blockH+8}" x2="${W-72}" y2="${y+blockH+8}" stroke="#1e1e1e" stroke-width="1"/>`;
    y += blockH + 16;
  }

  return svgWrap(`
  ${txt(72, 160, "JUST A", 84, WHITE, "900", "start", "-1")}
  ${txt(72, 258, "COINCIDENCE.", 84, AMBER, "900", "start", "-1")}
  ${txt(72, 318, "46.875 — The number that keeps appearing.", 30, GRAY, "400")}
  ${body}
  ${txt(W/2, H-130, "Same number. Five independent systems. One target location.", 30, WHITE, "700", "middle")}
  ${footer("SERIES 10 OF 10  ·  JACO NEXUS")}
  `);
}

// ── Generate all slides ────────────────────────────────────────────────────
const slides = [
  { n: "01", fn: slide01 },
  { n: "02", fn: slide02 },
  { n: "03", fn: slide03 },
  { n: "04", fn: slide04 },
  { n: "05", fn: slide05 },
  { n: "06", fn: slide06 },
  { n: "07", fn: slide07 },
  { n: "08", fn: slide08 },
  { n: "09", fn: slide09 },
  { n: "10", fn: slide10 },
];

console.log("Generating slides...");
for (const { n, fn } of slides) {
  const svgStr = fn();
  const outPath = `attached_assets/nexus_slide_${n}.png`;
  await sharp(Buffer.from(svgStr))
    .png()
    .toFile(outPath);
  console.log(`✓ Slide ${n} → ${outPath}`);
}
console.log("Done! All 10 slides saved.");
