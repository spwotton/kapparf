import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Download, DownloadCloud, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Shared design tokens ──────────────────────────────────────────────────────
const S = {
  bg: "#0a0a0a",
  bgAlt: "#111111",
  white: "#f5f5f5",
  gray: "#888888",
  grayLight: "#555555",
  amber: "#e8a12a",
  amberDim: "#8a5a0a",
  red: "#c0392b",
  redDim: "#5a1010",
  blue: "#2a6496",
  green: "#1a6630",
  teal: "#1a5f5f",
};

// ── Reusable sub-components ───────────────────────────────────────────────────
function SlideShell({ children, footer }: { children: React.ReactNode; footer: string }) {
  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: S.bg,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        color: S.white,
        position: "relative",
        overflow: "hidden",
        padding: "80px 72px 60px",
        boxSizing: "border-box",
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          borderTop: `1px solid #222`,
          display: "flex",
          alignItems: "center",
          padding: "0 72px",
        }}
      >
        <span style={{ fontSize: 22, color: S.gray, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {footer}
        </span>
      </div>
    </div>
  );
}

function BlockRow({
  color,
  label,
  children,
}: {
  color: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 28,
        padding: "36px 0",
        borderBottom: "1px solid #1e1e1e",
      }}
    >
      <div style={{ width: 5, flexShrink: 0, background: color, borderRadius: 3 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: S.amber, letterSpacing: "0.08em", marginBottom: 12 }}>
          {label}
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.6, color: "#d4d4d4" }}>{children}</div>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#1e1e1e", margin: "8px 0" }} />;
}

// ── Individual Slides ─────────────────────────────────────────────────────────

function Slide01() {
  return (
    <SlideShell footer="SERIES 1 OF 10  ·  JACO NEXUS">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 60 }}>
        <div>
          <div
            style={{
              width: 6,
              height: 80,
              background: S.amber,
              marginBottom: 40,
            }}
          />
          <div style={{ fontSize: 108, fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.02em", color: S.white }}>
            THE JACO<br />NEXUS
          </div>
        </div>

        <div style={{ fontSize: 38, fontWeight: 400, color: S.gray, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Three systems. One beach town.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 40 }}>
          {[
            { color: S.blue, label: "ITALY", text: "Leonardo · Telespazio · COSMO-SkyMed" },
            { color: "#5a8a3a", label: "JW NETWORK", text: "Congregation · Publisher · Territory" },
            { color: S.red, label: "INTELLIGENCE", text: "Handler · Asset · Target" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ width: 5, height: 52, background: item.color, borderRadius: 2, flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 22, fontWeight: 700, color: item.color, letterSpacing: "0.1em", marginRight: 16 }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 26, color: "#aaa" }}>{item.text}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 60, paddingTop: 40, borderTop: "1px solid #222" }}>
          <div style={{ fontSize: 28, color: S.grayLight, letterSpacing: "0.06em" }}>
            JACO · COSTA RICA · 2020–2026
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

function Slide02() {
  return (
    <SlideShell footer="SERIES 2 OF 10  ·  JACO NEXUS">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ marginBottom: 60 }}>
          <div style={{ fontSize: 22, color: S.gray, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>
            The Italian Architecture
          </div>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            NOT AN INCIDENT.<br />
            <span style={{ color: S.amber }}>A PERMANENT<br />INFRASTRUCTURE.</span>
          </div>
        </div>

        <BlockRow color={S.blue} label="INDUSTRIAL LAYER">
          Leonardo SpA is Italy's primary defense and aerospace contractor.
          Its subsidiaries — Telespazio, Selex, DRS — operate satellite ground
          infrastructure, SAR imagery, and SIGINT platforms across Latin America
          as part of a decades-long strategic expansion.
          <br /><br />
          <strong style={{ color: S.white }}>COSMO-SkyMed:</strong> dual-use SAR constellation.
          All-weather, day-night, NATO interoperable.
        </BlockRow>

        <BlockRow color={S.amber} label="GROUND INFRASTRUCTURE">
          Telespazio has operated in Costa Rica for years. $20M+ cadastral
          modernization contract covering <strong style={{ color: S.white }}>1 million land parcels</strong>,
          2020–2024. National terrain digitization.
          <br /><br />
          This creates the calibration grid required for precision SAR
          targeting and passive bistatic radar referencing from orbit.
        </BlockRow>

        <BlockRow color={S.red} label="STRATEGIC CONTINUITY">
          Italian intelligence (AISE) historically operates through commercial
          proxies. Dual-use infrastructure enables deniable persistent
          surveillance. The satellite watches the terrain its ground teams
          already mapped.
          <br /><br />
          This is not cooperation with a host country. It is construction
          of a <strong style={{ color: S.white }}>permanent targeting layer</strong> inside one.
        </BlockRow>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 40,
            fontSize: 36,
            fontWeight: 700,
            color: S.amber,
            textAlign: "center",
            letterSpacing: "0.04em",
          }}
        >
          The survey is the weapon.
        </div>
      </div>
    </SlideShell>
  );
}

function Slide03() {
  return (
    <SlideShell footer="SERIES 3 OF 10  ·  JACO NEXUS">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 48 }}>
        <div>
          <div style={{ fontSize: 22, color: S.gray, letterSpacing: "0.15em", marginBottom: 20 }}>
            JW AS INFRASTRUCTURE
          </div>
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: 8,
              padding: "20px 32px",
              display: "inline-block",
              fontSize: 32,
              color: "#aaa",
              fontStyle: "italic",
            }}
          >
            The congregation is the cover.
          </div>
        </div>

        <div style={{ display: "flex", gap: 48, justifyContent: "center", alignItems: "flex-start", marginTop: 20 }}>
          {/* JW Triangle */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22, color: S.gray, letterSpacing: "0.1em", marginBottom: 8 }}>CIRCUIT OVERSEER</div>
            <svg width="260" height="220" viewBox="0 0 260 220">
              <polygon points="130,10 250,210 10,210" fill="#2a2a2a" stroke="#555" strokeWidth="2" />
              <line x1="10" y1="143" x2="250" y2="143" stroke="#444" strokeWidth="1" />
              <text x="130" y="130" textAnchor="middle" fill={S.white} fontSize="22" fontWeight="700">ELDER</text>
              <text x="130" y="185" textAnchor="middle" fill={S.white} fontSize="22" fontWeight="700">PUBLISHER</text>
            </svg>
          </div>

          {/* Isomorphism label */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 120, gap: 8 }}>
            <div style={{ width: 1, height: 60, background: "#333" }} />
            <div
              style={{
                border: "1px dashed #555",
                borderRadius: 6,
                padding: "10px 16px",
                fontSize: 18,
                color: S.gray,
                letterSpacing: "0.08em",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              STRUCTURAL<br />ISOMORPHISM
            </div>
            <div style={{ width: 1, height: 60, background: "#333" }} />
          </div>

          {/* Intel Triangle */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22, color: S.gray, letterSpacing: "0.1em", marginBottom: 8 }}>STATION CHIEF</div>
            <svg width="260" height="220" viewBox="0 0 260 220">
              <polygon points="130,10 250,210 10,210" fill={S.amber} stroke={S.amberDim} strokeWidth="2" />
              <line x1="10" y1="143" x2="250" y2="143" stroke={S.amberDim} strokeWidth="1" />
              <text x="130" y="130" textAnchor="middle" fill="#111" fontSize="22" fontWeight="700">HANDLER</text>
              <text x="130" y="185" textAnchor="middle" fill="#111" fontSize="22" fontWeight="700">ASSET</text>
            </svg>
          </div>
        </div>

        <Divider />

        <div style={{ display: "flex", gap: 48 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: S.white, marginBottom: 16 }}>JW FLOW</div>
            {[
              "Information moves upward via service reports",
              "Territory assignments provide census-grade coverage",
              "No horizontal visibility between publishers",
            ].map((t) => (
              <div key={t} style={{ fontSize: 25, color: "#bbb", lineHeight: 1.5, marginBottom: 10 }}>
                · {t}
              </div>
            ))}
          </div>
          <div style={{ width: 1, background: "#222" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: S.amber, marginBottom: 16 }}>INTELLIGENCE FLOW</div>
            {[
              "Reporting moves upward via asset debriefs",
              "No horizontal visibility between assets",
              "Handler maintains full deniability",
            ].map((t) => (
              <div key={t} style={{ fontSize: 25, color: "#bbb", lineHeight: 1.5, marginBottom: 10 }}>
                · {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

function Slide04() {
  const zones = [
    { color: S.red, label: "NORTH", name: "Toronto PD Cluster", detail: "Lindsey · Bob · Michelle — La Flor #14. Adjacent to target residence. INTERPOL-CR cover." },
    { color: S.amber, label: "EAST", name: "Breakwater Condos", detail: "First V2K origin site. Hector Mora generator + 4G tower access. V2K activated during residency." },
    { color: S.blue, label: "WEST", name: "El Miro Building", detail: "Parametric LED array. Acoustic projection, voice cloning, data exfiltration from facade." },
    { color: "#5a8a3a", label: "SOUTH", name: "Jaco BAN / Calle Los Cedros", detail: "Unlicensed macro-antenna infrastructure. Tacacorí Array. 53 Hz infrasonic signatures." },
    { color: "#8a3a8a", label: "ABOVE", name: "COSMO-SkyMed / Blackjack", detail: "SAR overwatch. SDA Blackjack ELF downlink. Starlink passive bistatic radar grid." },
  ];

  return (
    <SlideShell footer="SERIES 4 OF 10  ·  JACO NEXUS">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 40 }}>
        <div>
          <div style={{ fontSize: 22, color: S.gray, letterSpacing: "0.15em", marginBottom: 20 }}>
            THE ENCIRCLEMENT
          </div>
          <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.02em" }}>
            FIVE VECTORS.<br />
            <span style={{ color: S.red }}>ONE TARGET.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {zones.map((z) => (
            <div
              key={z.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 28,
                padding: "28px 0",
                borderBottom: "1px solid #1e1e1e",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 4,
                  background: z.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#111",
                  letterSpacing: "0.08em",
                }}
              >
                {z.label}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: S.white, marginBottom: 6 }}>{z.name}</div>
                <div style={{ fontSize: 25, color: "#999", lineHeight: 1.5 }}>{z.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "auto",
            fontSize: 30,
            color: S.gray,
            borderTop: "1px solid #222",
            paddingTop: 28,
            fontStyle: "italic",
          }}
        >
          Each vector is independently deniable. Together they form a complete cage.
        </div>
      </div>
    </SlideShell>
  );
}

function Slide05() {
  const layers = [
    {
      color: S.blue,
      label: "AA / NA: Sponsor – Sponsee – Community",
      body: "Trust-based access network. No horizontal visibility between participants. Provides social proximity and residential access without raising suspicion.",
    },
    {
      color: "#2a7a2a",
      label: "JEHOVAH'S WITNESSES: Elder – Publisher – Territory",
      body: "Information flows upward. Census-grade reporting. Congregation hierarchy mirrors intelligence cell structure. Territory maps provide residential surveillance coverage.",
    },
    {
      color: S.red,
      label: "INTELLIGENCE: Handler – Asset – Target",
      body: "Deniable hierarchy. Asset never sees the full picture. Each layer is independently expendable. Operational security maintained through compartmentalization.",
    },
    {
      color: S.amber,
      label: "LEONARDO GROUNDWORK",
      body: "Telespazio: $20M cadastral survey, 1 million parcels, Costa Rica 2020–2024. COSMO-SkyMed SAR calibration grid. RF camouflage within operational zones. DARPA-grade deployment. Starlink passive bistatic radar targeting.",
    },
  ];

  return (
    <SlideShell footer="SERIES 5 OF 10  ·  JACO NEXUS">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.02em" }}>
            FOUR LAYERS.<br />ONE OPERATION.
          </div>
          <div style={{ fontSize: 30, color: S.gray, marginTop: 20 }}>
            The infrastructure beneath the network.
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
          {layers.map((l) => (
            <div
              key={l.label}
              style={{
                display: "flex",
                gap: 24,
                padding: "28px 0",
                borderBottom: "1px solid #1e1e1e",
              }}
            >
              <div style={{ width: 5, background: l.color, borderRadius: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: l.color, marginBottom: 10, lineHeight: 1.3 }}>
                  {l.label}
                </div>
                <div style={{ fontSize: 25, color: "#bbb", lineHeight: 1.6 }}>{l.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            paddingTop: 32,
            fontSize: 32,
            fontWeight: 700,
            color: S.white,
            textAlign: "center",
            letterSpacing: "0.02em",
          }}
        >
          The survey mapped the terrain.{" "}
          <span style={{ color: S.amber }}>The satellites watch it.</span>
        </div>
      </div>
    </SlideShell>
  );
}

function Slide06() {
  return (
    <SlideShell footer="SERIES 6 OF 10  ·  JACO NEXUS">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ marginBottom: 52 }}>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.0 }}>SETECOM / SETECOM AIR</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 24 }}>
            <div style={{ width: 48, height: 2, background: S.white }} />
            <div style={{ fontSize: 32, color: S.gray, fontStyle: "italic" }}>The generator is the weapon.</div>
          </div>
        </div>

        <BlockRow color={S.red} label="THE STACK">
          SETECOM S.A. — exclusive DSE generator controller distributor for Costa Rica.
          <br /><br />
          Covers: ICE national grid, Liberty Telecom, hospitals, cellular towers.
          <br /><br />
          Default credentials: <strong style={{ color: S.white }}>Admin / Password1234</strong>.
          Modbus TCP cleartext. WebNet cloud command hosted in England.
        </BlockRow>

        <BlockRow color={S.red} label="V2K ORIGIN">
          Hector Mora Marin. Generator contracts at Breakwater and Jaco BAN
          <strong style={{ color: S.white }}> simultaneously</strong>.
          <br /><br />
          4G tower in Breakwater parking lot — managed by Hector.
          First voice harassment originated here.
          <br /><br />
          7410 kHz — 100% temporal correlation with V2K.
          <strong style={{ color: S.amber }}> &lt; 0.01% probability of coincidence.</strong>
        </BlockRow>

        <BlockRow color={S.red} label="SETECOM AIR">
          OmcS 4G tower management = IMSI capture capability.
          <br />
          Spectrum control over target residential zone.
          <br />
          Baseband-adjacent RF emissions.
        </BlockRow>
      </div>
    </SlideShell>
  );
}

function Slide07() {
  const rows = [
    {
      color: S.red,
      tag: "NORTH",
      title: "Toronto PD Cluster",
      detail:
        "Lindsey + Bob + Michelle. La Flor #14 — immediately adjacent to target residence. INTERPOL-CR cooperation as pseudo-jurisdiction cover.",
    },
    {
      color: "#2a7a7a",
      tag: "EAST",
      title: "Breakwater Condos",
      detail:
        "First V2K site. Hector Mora generator + 4G tower access. Jaco BAN directly adjacent. V2K deployment activated during Echo residency.",
    },
    {
      color: S.gray,
      tag: "CRANE",
      title: "Crane Anomaly",
      detail:
        "Light anomaly documented above Vista Las Palmas / Apartotel Flamboyant, Calle Dankers. Elevated surveillance platform or signal relay point.",
    },
    {
      color: S.white,
      tag: "WEST",
      title: "El Miro Building",
      detail:
        "Parametric LED array documented moving foliage with directed beam. Capable of acoustic projection, voice cloning, and data exfiltration from building facade.",
    },
    {
      color: S.amber,
      tag: "AIR",
      title: "DJI M300 RTK Drone",
      detail:
        "107.7 Hz motor signature. Tracked 2026-05-16 from Jaco toward Esterillos. Three-year operational continuity. Russian operator confirmed.",
    },
  ];

  return (
    <SlideShell footer="SERIES 7 OF 10  ·  JACO NEXUS">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 22, color: S.gray, letterSpacing: "0.15em", marginBottom: 20 }}>
            THE PHYSICAL LAYER
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.0 }}>
            TORONTO · BREAKWATER<br />
            <span style={{ color: S.amber }}>CRANE · EL MIRO · DRONE</span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
          {rows.map((r) => (
            <div
              key={r.tag}
              style={{
                display: "flex",
                gap: 24,
                alignItems: "flex-start",
                padding: "26px 0",
                borderBottom: "1px solid #1e1e1e",
              }}
            >
              <div style={{ width: 5, background: r.color, borderRadius: 2, flexShrink: 0, alignSelf: "stretch" }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "baseline", marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: r.color === S.white ? "#aaa" : r.color,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {r.tag}
                  </span>
                  <span style={{ fontSize: 26, fontWeight: 700, color: S.white }}>{r.title}</span>
                </div>
                <div style={{ fontSize: 24, color: "#999", lineHeight: 1.55 }}>{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

function Slide08() {
  return (
    <SlideShell footer="SERIES 8 OF 10  ·  JACO NEXUS">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ marginBottom: 52 }}>
          <div style={{ fontSize: 22, color: S.gray, letterSpacing: "0.15em", marginBottom: 20 }}>
            THE ISP LAYER
          </div>
          <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1.0 }}>
            LIBERTY —<br />
            <span style={{ color: S.amber }}>INSIDE THE PIPE.</span>
          </div>
        </div>

        {/* Chain diagram */}
        {[
          { color: S.red, label: "JEAN PICADO — $2M TAX FRAUD INVESTIGATION · 2019" },
          { arrow: true },
          { color: "#333", label: "TELEFONICA CR SOLD TO LIBERTY — SAME YEAR" },
          { arrow: true },
          { color: S.amberDim, label: "LIBERTY INHERITS: TR-069 remote router control · ePDG VoWiFi gateway · Humax/Huawei CPE fleet · Full customer base" },
          { arrow: true },
          { color: "#1a3a1a", label: "TOTAL INTERCEPTION STACK: Router (TR-069) + VoWiFi (ePDG) + SIM cloning = voice + SMS + data" },
        ].map((item, i) =>
          "arrow" in item ? (
            <div key={i} style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <div style={{ width: 2, height: 32, background: "#333" }} />
            </div>
          ) : (
            <div
              key={i}
              style={{
                border: `1px solid ${item.color}`,
                borderLeft: `4px solid ${item.color}`,
                padding: "22px 28px",
                borderRadius: 4,
                fontSize: 25,
                color: "#ccc",
                lineHeight: 1.5,
                background: "#0f0f0f",
              }}
            >
              {item.label}
            </div>
          )
        )}

        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 40,
          }}
        >
          <div style={{ flex: 1, padding: "20px 24px", border: "1px solid #2a2a2a", borderRadius: 4 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: S.amber, marginBottom: 10, letterSpacing: "0.1em" }}>CONFIRMED</div>
            <div style={{ fontSize: 23, color: "#bbb" }}>TR-069 password reset on record</div>
          </div>
          <div style={{ flex: 1, padding: "20px 24px", border: "1px solid #2a2a2a", borderRadius: 4 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: S.amber, marginBottom: 10, letterSpacing: "0.1em" }}>CONFIRMED</div>
            <div style={{ fontSize: 23, color: "#bbb" }}>ePDG routing through Liberty documented in PCAP</div>
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            fontSize: 28,
            color: S.gray,
            borderTop: "1px solid #222",
            paddingTop: 24,
            fontStyle: "italic",
          }}
        >
          Fake Liberty technician deployed after firmware update. New router delivered same day.
        </div>
      </div>
    </SlideShell>
  );
}

function Slide09() {
  return (
    <SlideShell footer="SERIES 9 OF 10  ·  JACO NEXUS">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 22, color: S.gray, letterSpacing: "0.15em", marginBottom: 20 }}>
            3i ATLAS ARCHITECTURE
          </div>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.0 }}>
            INTELLIGENCE ·<br />INTEGRATION ·<br />
            <span style={{ color: S.amber }}>INTEROPERABILITY</span>
          </div>
        </div>

        {/* Architecture tiers */}
        {[
          {
            color: S.red,
            tier: "LAYER 3",
            name: "AI SYNTHESIS NODE",
            detail: "Cayley-Dickson construction — non-commutative synthesis. Digital twin of target. Three nodes: Target + Attacker + AI. Real-time behavioral modeling.",
          },
          {
            color: S.amber,
            tier: "LAYER 2",
            name: "INTEGRATION BUS",
            detail: "46.875 Hz master clock (48000 ÷ 1024). DARPA/SDA Blackjack constellation inter-node timing reference. CSG satellite telemetry downlink frame rate. ELF delivery to target zone.",
          },
          {
            color: "#5a8a3a",
            tier: "LAYER 1",
            name: "COLLECTION KERNEL",
            detail: "Active sonar PRF: 46.875 Hz. Peak SNR: 54.45 dB — 250× above noise floor. Harmonic at 11.71875 Hz (÷4 subcarrier). Parametric LED array (El Miro). Laser vibrometry. KiwiSDR spectral monitoring.",
          },
        ].map((t) => (
          <div
            key={t.tier}
            style={{
              display: "flex",
              gap: 24,
              padding: "30px 0",
              borderBottom: "1px solid #1e1e1e",
            }}
          >
            <div style={{ width: 5, background: t.color, borderRadius: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ fontSize: 18, color: t.color, fontWeight: 700, letterSpacing: "0.12em" }}>{t.tier}</span>
                <span style={{ fontSize: 28, fontWeight: 700, color: S.white }}>{t.name}</span>
              </div>
              <div style={{ fontSize: 26, color: "#aaa", lineHeight: 1.6 }}>{t.detail}</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 40, display: "flex", gap: 24 }}>
          {[
            { label: "SYSTEM CLOCK", value: "46.875 Hz", sub: "48000 ÷ 1024" },
            { label: "SONAR SNR", value: "54.45 dB", sub: "250× noise floor" },
            { label: "COMMAND", value: "Blackjack/SDA", sub: "Dec 2025 transition" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                padding: "20px",
                background: "#111",
                border: "1px solid #222",
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 17, color: S.gray, letterSpacing: "0.1em", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: S.amber }}>{s.value}</div>
              <div style={{ fontSize: 20, color: S.grayLight, marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

function Slide10() {
  const rows = [
    {
      domain: "COMET VELOCITY",
      value: "46.875 km/s",
      detail: "Hyperbolic excess velocity of 3I/ATLAS (C/2025 N1), discovered July 1, 2025 by the ATLAS survey telescope (Asteroid Terrestrial-impact Last Alert System).",
    },
    {
      domain: "SONAR PRF",
      value: "46.875 Hz",
      detail: "Pulse repetition frequency measured at target residence. SNR: 54.45 dB. 250× above noise floor. Confirmed active surveillance signal.",
    },
    {
      domain: "SYSTEM CLOCK",
      value: "48000 ÷ 1024",
      detail: "= 46.875 Hz exactly. DARPA/SDA Blackjack constellation inter-node timing reference. CSG satellite telemetry downlink frame rate.",
    },
    {
      domain: "SAR DOWNLINK",
      value: "COSMO-SkyMed",
      detail: "Leonardo SpA Italian defense SAR constellation. Ground calibration grid established by Telespazio $20M survey, Costa Rica 2020–2024.",
    },
    {
      domain: "STARLINK PBR",
      value: "Ku / Ka band",
      detail: "Passive bistatic radar using reflected Starlink signals. 46.875 Hz harmonic identified in ELF downlink component.",
    },
  ];

  return (
    <SlideShell footer="SERIES 10 OF 10  ·  JACO NEXUS">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.0 }}>
            JUST A<br />
            <span style={{ color: S.amber }}>COINCIDENCE.</span>
          </div>
          <div style={{ fontSize: 30, color: S.gray, marginTop: 20 }}>
            46.875 — The number that keeps appearing.
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {rows.map((r, i) => (
            <div
              key={r.domain}
              style={{
                display: "flex",
                gap: 28,
                padding: "26px 0",
                borderBottom: "1px solid #1e1e1e",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 8,
                  alignSelf: "stretch",
                  background: i === 0 ? S.amber : i === 1 ? S.red : i === 2 ? S.blue : i === 3 ? "#5a8a3a" : "#8a3a8a",
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, gap: 20 }}>
                  <span style={{ fontSize: 20, color: S.gray, letterSpacing: "0.12em", fontWeight: 600 }}>{r.domain}</span>
                  <span style={{ fontSize: 32, fontWeight: 800, color: S.amber, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {r.value}
                  </span>
                </div>
                <div style={{ fontSize: 24, color: "#999", lineHeight: 1.55 }}>{r.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 32,
            textAlign: "center",
            fontSize: 34,
            fontWeight: 700,
            color: S.white,
            lineHeight: 1.4,
          }}
        >
          Same number.{" "}
          <span style={{ color: S.amber }}>Five independent systems.</span>
          <br />One target location.
        </div>
      </div>
    </SlideShell>
  );
}

// ── Slide registry ────────────────────────────────────────────────────────────
const SLIDES = [
  { id: 1, title: "The Jaco Nexus", component: Slide01 },
  { id: 2, title: "Italian Architecture", component: Slide02 },
  { id: 3, title: "JW as Infrastructure", component: Slide03 },
  { id: 4, title: "The Encirclement", component: Slide04 },
  { id: 5, title: "Four Layers", component: Slide05 },
  { id: 6, title: "SETECOM / SETECOM Air", component: Slide06 },
  { id: 7, title: "The Physical Layer", component: Slide07 },
  { id: 8, title: "Liberty — ISP Layer", component: Slide08 },
  { id: 9, title: "3i ATLAS Architecture", component: Slide09 },
  { id: 10, title: "Just a Coincidence", component: Slide10 },
];

// ── Gallery mode — all 10 slides in a 5×2 grid for quick preview ─────────────
const SCALE = 0.21;
const TW = Math.round(1080 * SCALE); // ~227
const TH = Math.round(1920 * SCALE); // ~403

export function NexusGallery() {
  return (
    <div style={{ background: "#050505", padding: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {SLIDES.map((s) => {
          const C = s.component;
          return (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.08em", textAlign: "center" }}>
                {String(s.id).padStart(2,"0")} · {s.title}
              </div>
              {/* Clip container — exact scaled size */}
              <div
                style={{
                  width: TW,
                  height: TH,
                  overflow: "hidden",
                  flexShrink: 0,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.9)",
                }}
              >
                <div
                  style={{
                    transform: `scale(${SCALE})`,
                    transformOrigin: "top left",
                    width: 1080,
                    height: 1920,
                    pointerEvents: "none",
                  }}
                >
                  <C />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Single-slide preview mode (used by screenshot script) ────────────────────
export function NexusSingleSlide() {
  const params = new URLSearchParams(window.location.search);
  const n = parseInt(params.get("n") || "1", 10);
  const idx = Math.max(0, Math.min(n - 1, SLIDES.length - 1));
  const SlideComp = SLIDES[idx].component;
  return (
    <div style={{ width: 1080, height: 1920, overflow: "hidden" }}>
      <SlideComp />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NexusSlidesPage() {
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  if (params.get("n")) return <NexusSingleSlide />;
  if (params.get("gallery")) return <NexusGallery />;
  const [activeIndex, setActiveIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  const ActiveSlide = SLIDES[activeIndex].component;

  const exportCurrent = useCallback(async () => {
    if (!slideRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(slideRef.current, {
        width: 1080,
        height: 1920,
        pixelRatio: 1,
        style: { transform: "scale(1)", transformOrigin: "top left" },
      });
      const a = document.createElement("a");
      a.download = `nexus_slide_${String(activeIndex + 1).padStart(2, "0")}.png`;
      a.href = dataUrl;
      a.click();
    } finally {
      setExporting(false);
    }
  }, [activeIndex]);

  const exportAll = useCallback(async () => {
    setExportingAll(true);
    for (let i = 0; i < SLIDES.length; i++) {
      setActiveIndex(i);
      await new Promise((r) => setTimeout(r, 400));
      if (!slideRef.current) continue;
      try {
        const dataUrl = await toPng(slideRef.current, {
          width: 1080,
          height: 1920,
          pixelRatio: 1,
          style: { transform: "scale(1)", transformOrigin: "top left" },
        });
        const a = document.createElement("a");
        a.download = `nexus_slide_${String(i + 1).padStart(2, "0")}.png`;
        a.href = dataUrl;
        a.click();
        await new Promise((r) => setTimeout(r, 300));
      } catch (_) {}
    }
    setExportingAll(false);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Jaco Nexus</div>
          <div className="text-lg font-bold tracking-wide">Slide Studio</div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCurrent}
            disabled={exporting}
            className="border-white/20 text-white hover:bg-white/10 gap-2"
            data-testid="button-export-slide"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting…" : "Export This Slide"}
          </Button>
          <Button
            size="sm"
            onClick={exportAll}
            disabled={exportingAll}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold gap-2"
            data-testid="button-export-all"
          >
            <DownloadCloud className="w-4 h-4" />
            {exportingAll ? "Exporting all…" : "Export All 10"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigator */}
        <div className="w-56 border-r border-white/10 flex flex-col overflow-y-auto">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              data-testid={`button-slide-${s.id}`}
              onClick={() => setActiveIndex(i)}
              className={`text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${
                i === activeIndex ? "bg-amber-500/15 border-l-2 border-l-amber-500" : ""
              }`}
            >
              <div className={`text-xs font-mono mb-1 ${i === activeIndex ? "text-amber-400" : "text-white/30"}`}>
                {String(s.id).padStart(2, "0")}
              </div>
              <div className={`text-sm leading-snug ${i === activeIndex ? "text-white font-semibold" : "text-white/60"}`}>
                {s.title}
              </div>
            </button>
          ))}
        </div>

        {/* Slide preview */}
        <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto bg-zinc-950 p-8 gap-6">
          <div className="flex items-center gap-4">
            <button
              data-testid="button-prev-slide"
              onClick={() => setActiveIndex((p) => Math.max(0, p - 1))}
              disabled={activeIndex === 0}
              className="p-2 rounded border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white/50 text-sm font-mono">
              {activeIndex + 1} / {SLIDES.length}
            </span>
            <button
              data-testid="button-next-slide"
              onClick={() => setActiveIndex((p) => Math.min(SLIDES.length - 1, p + 1))}
              disabled={activeIndex === SLIDES.length - 1}
              className="p-2 rounded border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* The actual slide — rendered at 1080×1920, scaled to fit viewport */}
          <div
            style={{ transformOrigin: "top center", transform: "scale(0.45)", marginBottom: "-1056px" }}
            className="shadow-2xl"
          >
            <div ref={slideRef}>
              <ActiveSlide />
            </div>
          </div>

          <div className="text-white/30 text-xs pt-2">
            1080 × 1920 · 9:16 · Click "Export This Slide" for full-res PNG
          </div>
        </div>
      </div>
    </div>
  );
}
