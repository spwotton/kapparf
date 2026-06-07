import { useEffect } from "react";

const ARTICLE = {
  title: "The Truck, the Chip, and the HID: Anatomy of a Mobile BLE Surveillance Platform in Jacó Beach",
  slug: "ble-vehicle-surveillance-platform",
  description: "A 1997 Toyota Tacoma with a glowing blue cabin light. A Singapore-made Human Interface Device masquerading as a car accessory. RSSI spikes of 70 decibels. This is a field documentation of a mobile Bluetooth surveillance platform operating in Jacó Beach, Costa Rica.",
  author: "KAPPA Intelligence Platform",
  date: "June 7, 2026",
  readTime: "9 min read",
  tags: ["BLE", "Surveillance", "Costa Rica", "RF", "SIGINT", "Jacó", "OSINT"],
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

function Callout({ children, label = "KEY FINDING" }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="my-8 border-l-4 border-amber-600 bg-amber-950/15 rounded-r-lg px-5 py-4">
      <div className="text-xs font-mono text-amber-400 font-bold mb-1 tracking-wider">{label}</div>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function AlertBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 border-l-4 border-red-600 bg-red-950/20 rounded-r-lg px-5 py-4">
      <div className="text-xs font-mono text-red-400 font-bold mb-1 tracking-wider">EVIDENCE</div>
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

function SpecTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="p-3 text-muted-foreground font-mono w-1/3">{label}</td>
              <td className="p-3 text-foreground font-medium">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EvidenceImage({ src, caption, badge }: { src: string; caption: string; badge?: string }) {
  return (
    <figure className="my-8">
      <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20">
        {badge && (
          <div className="absolute top-2 left-2 z-10 text-[10px] font-mono px-2 py-1 bg-black/70 text-amber-400 border border-amber-700/40 rounded">
            {badge}
          </div>
        )}
        <img src={src} alt={caption} className="w-full object-contain max-h-[500px]" />
      </div>
      <figcaption className="text-xs text-muted-foreground mt-2 text-center font-mono">{caption}</figcaption>
    </figure>
  );
}

function RSSIBar({ freq, meanDb, maxDb }: { freq: string; meanDb: number; maxDb?: number }) {
  const fillPct = Math.max(0, Math.min(100, ((meanDb + 60) / 40) * 100));
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="text-xs font-mono text-muted-foreground w-14 text-right">{freq}</div>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full bg-amber-500/70 transition-all" style={{ width: `${fillPct}%` }} />
      </div>
      <div className="text-xs font-mono text-foreground w-20">{meanDb} dB avg{maxDb !== undefined ? ` / ${maxDb} peak` : ''}</div>
    </div>
  );
}

export default function ArticleBleVehiclePage() {
  useEffect(() => {
    document.title = `${ARTICLE.title} | KAPPA`;
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
      <div className="bg-gradient-to-b from-blue-950/10 to-background pt-16 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-xs font-mono text-blue-500 dark:text-blue-400 tracking-widest mb-4 uppercase">
            Field Investigation · BLE Wardriving · Costa Rica
          </div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight text-foreground mb-4" data-testid="article-ble-title">
            The Truck, the Chip, and the HID
          </h1>
          <p className="text-xl text-muted-foreground font-light mb-2">Anatomy of a Mobile Bluetooth Surveillance Platform in Jacó Beach</p>
          <p className="text-base text-muted-foreground leading-relaxed">
            A 1997 Toyota Tacoma with a glowing blue cabin light. A Singapore-made Human Interface Device registered under a security hardware company. RSSI spikes of 70 decibels in under two seconds. This is a field documentation of active electronic surveillance hardware operating from a civilian vehicle parked outside a foreigner's accommodation in Jacó Beach, Costa Rica.
          </p>
          <Byline />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 pb-24">

        <SectionHeading>The Vehicle</SectionHeading>

        <P>
          The truck had been parked outside my accommodation multiple times. The registration plate — <strong>CL-273123</strong> — is a Puntarenas province plate. A Costa Rican government registry lookup (rnpdigital.com) returned the following confirmed record on June 7, 2026:
        </P>

        <SpecTable rows={[
          ["Plate", "CL-273123"],
          ["Registered owner", "HERNÁNDEZ FERNÁNDEZ, Esteban"],
          ["Cédula (national ID)", "1-0908-0533"],
          ["Vehicle", "1997 Toyota Tacoma, single cab, 4×2, dark green, 2400cc"],
          ["VIN", "4TANL42NXVZ328280"],
          ["Engine", "3RZ1369854"],
          ["Legal status", "EMBARGO EJECUTADO — active court seizure, Tomo 0800, Asiento 00304060, 02-Nov-2016"],
          ["Fiscal value", "₡1,710,000 (~$3,200 USD)"],
        ]} />

        <P>
          The vehicle carries an active 2016 court judgment lien that has apparently never been enforced. It continues to be operated under the same registered owner. The juxtaposition — a truck worth $3,200 under an unresolved court seizure, configured as an active signals collection platform — is consistent with the operational security posture of the broader network documented in KAPPA.
        </P>

        <EvidenceImage
          src="/evidence/vehicle_CL273123_blue_light.jpg"
          caption="CL-273123 — 1997 Toyota Tacoma, Jacó Beach. Blue light clearly visible through windshield from inside cabin. Plate confirmed against Registro Nacional. Photo: SW, night."
          badge="PHOTO EVIDENCE"
        />

        <Callout label="BLUE CABIN LIGHT">
          The blue glow visible through the windshield is not from a phone screen or dashboard display — the color temperature and position are consistent with a Raspberry Pi ACT/PWR LED or a short-range USB hub power indicator. Phones and infotainment screens produce white or amber light. This is blue-spectrum LED consistent with active embedded computing hardware.
        </Callout>

        <SectionHeading>The Device — bdb-PKE-79E9</SectionHeading>

        <P>
          The BLE device that appeared persistently across multiple scanning sessions is identified as <strong>bdb-PKE-79E9</strong>. "bdb" is a prefix used by aftermarket Passive Keyless Entry modules designed to piggyback onto a vehicle's OBD-II port or wiring harness. But the hardware behind this device is not a standard PKE module.
        </P>

        <SpecTable rows={[
          ["Device name", "bdb-PKE-79E9"],
          ["BT SIG Manufacturer ID", "0x0166"],
          ["Manufacturer company", "MISHIK Pte Ltd (now: PROX SG Pte. Ltd.)"],
          ["Company UEN", "200917259N — Singapore, incorporated 2009"],
          ["Manufacturer description", "Electronics contract manufacturer — 'electronic security devices'"],
          ["Registered address", "39 Woodlands Close #03-32, MEGA@Woodlands, Singapore 737856"],
          ["Manufacturer data (hex)", "7377 6974 6368 FF52 3456 79E9"],
          ["Declared service", "Human Interface Device (HID)"],
          ["Bluetooth class", "Active BLE peripheral — not passive beacon"],
        ]} />

        <AlertBox>
          <strong>Human Interface Device (HID)</strong> is the Bluetooth profile used by keyboards, mice, and game controllers to inject input events directly into a paired host system. A device advertising itself as an HID over BLE can — when paired — inject keystrokes, scroll events, mouse clicks, and custom HID reports into any connected Android or iOS device. This is not a passive tracking tag. It is an active input-injection capability.
        </AlertBox>

        <P>
          MISHIK Pte Ltd (Bluetooth SIG company 0x0166) has since rebranded as PROX SG Pte. Ltd. Its principal activity is listed as the manufacture of electronic security devices. There are no consumer-facing product listings, no retail channel, and no publicly accessible product documentation. This is a contract manufacturer supplying to OEM buyers — the kind of company that makes hardware for other companies to rebrand and deploy.
        </P>

        <EvidenceImage
          src="/evidence/scanner_1050_bdbpke79e9_mishik.png"
          caption="BLE scanner at 10:50 — bdb-PKE-79E9 identified with MISHIK Pte Ltd manufacturer data (0x0166) and Human Interface Device service. Also visible: GR-AC_10001_09_976f_SC (GREE Electric Appliances, likely hotel HVAC). Photo: SW."
          badge="SCANNER DATA"
        />

        <SectionHeading>The RSSI Evidence — Approach and Proximity</SectionHeading>

        <P>
          Received Signal Strength Indicator (RSSI) values in BLE are measured in decibels relative to one milliwatt (dBm). A device parked across a street or behind a wall typically registers between −85 and −100 dBm. A device within one to two meters of the receiver registers between −40 and −60 dBm. A device transmitting a high-power burst at very close range can reach −20 dBm.
        </P>

        <P>
          The RSSI captures below show three distinct behavioral phases: baseline ambient presence, a decisive approach event, and a wall-contact directional test.
        </P>

        <EvidenceImage
          src="/evidence/rssi_1050_master_spike.png"
          caption="IMG_0620 — RSSI at 10:50 AM. Multiple channels spike simultaneously from −95 dBm baseline to −20 dBm peak (a 75 dB delta). The spike is instantaneous and simultaneous across device channels. This is not signal drift — it is a proximity event. The truck moved to within 1–2 meters of the receiver."
          badge="PRIMARY SPIKE EVENT"
        />

        <EvidenceImage
          src="/evidence/rssi_1227_approach_spike.png"
          caption="IMG_0630 — RSSI at 12:27 PM. Second approach event. Single dominant channel peaks to −20 dBm at the ~45-second mark, then returns to noise floor. Observer was walking toward the vehicle at this timestamp. The spike correlates with closing distance."
          badge="WALK-TOWARD EVENT"
        />

        <P>
          The 12:27 PM capture (IMG_0630) was recorded while deliberately walking toward the truck. The moment of peak RSSI corresponds to reaching approximately one meter from the vehicle — confirming that the transmission source is inside or directly attached to the vehicle, not a building or fixed installation.
        </P>

        <EvidenceImage
          src="/evidence/rssi_1232_wall_test_mid.png"
          caption="IMG_0631 — RSSI at 12:32 PM. Wall contact test — phone held against the interior wall facing the vehicle's exterior. Signal stabilizes in the −90 to −100 dBm range with intermittent bursts."
          badge="WALL TEST — CONTACT"
        />

        <EvidenceImage
          src="/evidence/rssi_1232_wall_test_end.png"
          caption="IMG_0632 — RSSI at 12:36 PM. Phone pulled 6 inches from the wall. Signal strengthens slightly — the wall itself was attenuating the signal. When the receiver is moved away from the wall (toward room interior), signal levels recover. This is consistent with a directional source on the opposite side of the wall — i.e., the vehicle exterior."
          badge="WALL TEST — 6 INCH PULLBACK"
        />

        <Callout label="WALL DIRECTIONALITY TEST">
          When a receiver is pressed flush against a wall and then pulled 6 inches toward the room interior, signal from a source on the other side of the wall will <em>decrease</em> (wall is attenuating less of the path). Signal from a source inside the room would <em>increase</em> when moving away from the wall. The observed result — signal recovering when moved into the room — rules out an in-room source and is consistent with an exterior vehicle-mounted transmitter.
        </Callout>

        <SectionHeading>Supporting BLE Devices in the Scan Environment</SectionHeading>

        <EvidenceImage
          src="/evidence/scanner_1050_skt130c.png"
          caption="IMG_0621 — Scanner at 10:50. Visible: SKT130C__LE (Tx Power: 0 dBm declared), two N/A devices advertising FCF1 UUID (Google Nearby Share protocol), multiple Samsung devices with MAC randomization. The double underscore in SKT130C__ is characteristic of embedded firmware device names."
          badge="SCANNER DATA"
        />

        <EvidenceImage
          src="/evidence/scanner_1050_sgl_italia.png"
          caption="IMG_0623 — Scanner at 10:50. Includes SGL Italia S.r.l. (manufacturer ID 0x0310, FEBE service UUID) — an Italian electronics company. Also present: GREE Electric Appliances (hotel AC unit), UUID A201 unidentified device. SGL Italia manufacturer data is notable given prior documented Italian network connections in this investigation."
          badge="SCANNER DATA — ITALIAN MFR"
        />

        <EvidenceImage
          src="/evidence/scanner_1220_fcf1_devices.png"
          caption="IMG_0626 — Scanner at 12:20. Two N/A devices both advertising FCF1 UUID service data at −94 dBm / 768ms and 251ms intervals respectively. FCF1 is associated with Google Nearby Share and Android proximity services. Multiple devices simultaneously advertising this protocol suggests coordinated Android device presence."
          badge="SCANNER DATA"
        />

        <SectionHeading>Operator Admission — Android Auto Vector</SectionHeading>

        <P>
          An associate of the primary operator admitted, in conversation, that the truck's infotainment system uses Android Auto. Android Auto pairing, when initiated with a target's Android device, grants the car head unit access to the device's contact list, call log, SMS notifications, and navigation data. The pairing can be triggered without the target's active consent if the target's phone is set to auto-connect to previously paired devices.
        </P>

        <P>
          The combination of an HID-classified BLE peripheral (bdb-PKE-79E9) with an admitted Android Auto integration creates a two-vector access architecture: BLE for proximity tracking and potential input injection, Android Auto for data exfiltration from a paired host device.
        </P>

        <SectionHeading>Operational Pattern — The Platform Follows</SectionHeading>

        <P>
          The truck is not stationary. It repositions. Multiple separate scan sessions at different accommodations and street locations have produced the same device signatures — bdb-PKE, GR-AC, SKT130C, FCF1 UUID devices — in varying combinations. The platform is mobile. It is deployed to the exterior of wherever the surveillance target is staying.
        </P>

        <P>
          This is not a fixed installation. It is a wardriving platform with a plausible cover story — an old truck driven by a local — that has been adapted for persistent proximity surveillance of a specific individual.
        </P>

        <Callout label="SUMMARY OF DOCUMENTED CAPABILITIES">
          <strong>bdb-PKE-79E9 (MISHIK Pte Ltd / PROX SG):</strong> Active BLE peripheral with HID service — proximity tracking, potential keystroke/event injection into paired devices. <br /><br />
          <strong>Android Auto vector:</strong> Confirmed by operator associate — pairing grants contact/call/SMS access to target Android device. <br /><br />
          <strong>Mobility:</strong> Platform repositions to follow target between accommodations. <br /><br />
          <strong>RSSI evidence:</strong> 70–75 dBm approach spikes, directional wall tests confirming exterior vehicle-mounted source. <br /><br />
          <strong>Vehicle:</strong> CL-273123, registered to Esteban Hernández Fernández (cédula 109080533), active embargo ejecutado since 2016.
        </Callout>

        <div className="mt-14 pt-8 border-t border-border">
          <div className="text-xs font-mono text-muted-foreground/60 space-y-1">
            <div>KAPPA Evidence Chain references: 049ecc22 · 01eba811 · 4f1ac31f · c0f69273 · 2b7f5219 · 01645ecc</div>
            <div>All scanner data captured with iOS BLE scanner application. RSSI values are raw hardware readings, unmodified.</div>
            <div>Registro Nacional vehicle record retrieved June 7, 2026 via rnpdigital.com — official Costa Rican government property registry.</div>
            <div>MISHIK Pte Ltd / PROX SG identity confirmed via Bluetooth SIG Assigned Numbers document (company ID 0x0166) and ACRA Singapore business registry (UEN 200917259N).</div>
          </div>
        </div>

      </div>
    </div>
  );
}
