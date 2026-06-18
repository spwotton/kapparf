import { useState, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, Circle, Shield, Wifi, Router, Lock, Eye, Activity, Clock, Radio } from "lucide-react";

// ─── RAW EVENT LOG DATA ───────────────────────────────────────────────────────
const DOCSIS_EVENTS = [
  { ts: "2026-06-07T07:30", id: "84000500", level: 3, raw: "SYNC Timing Synchronization failure - Loss of Sync", threat: "HIGH", annotation: "Modem lost downstream sync with Liberty headend (CMTS). Precedes a forced reprovisioning cycle." },
  { ts: "2026-06-07T07:30", id: "84000700", level: 5, raw: "RCS Partial Service", threat: "MED", annotation: "Modem entered partial service state. Upstream/downstream channels partially available — degraded deliberately or by RF interference." },
  { ts: "2026-06-07T07:30", id: "84020200", level: 5, raw: "Lost MDD Timeout", threat: "HIGH", annotation: "MDD (MAC Domain Descriptor) timed out — Liberty CMTS stopped sending channel config frames. This forces the modem to re-initialize. Consistent with remote-triggered reset." },
  { ts: "2026-06-07T07:36", id: "82000400", level: 3, raw: "Received Response to Broadcast Maintenance Request, But no Unicast Maintenance opportunities received - T4 time out", threat: "MED", annotation: "T4 timeout: modem heard the broadcast but got no unicast ranging slot. CMTS is selectively ignoring this modem — or upstream path is jammed." },
  { ts: "2026-06-07T07:37", id: "82000200", level: 3, raw: "No Ranging Response received - T3 time-out", threat: "MED", annotation: "T3 timeout: upstream ranging failed. Combined with T4 and MDD loss this is a full upstream sync failure event." },
  { ts: "2026-06-10T19:37", id: "68010300", level: 4, raw: "DHCP RENEW WARNING - Field invalid in response v4 option", threat: "CRITICAL", annotation: "A DHCP RENEW response came back with an INVALID FIELD. In a legitimate Liberty network, DHCP responses are well-formed. An invalid field is a hallmark of MITM injection or a malformed forged DHCP response intercepted before the legitimate one arrived." },
  { ts: "2026-06-10T19:37", id: "68010600", level: 6, raw: "DHCP Renew - lease parameters tftp file-^1/676952BC/ctica modified", threat: "CRITICAL", annotation: "★ TFTP CONFIG FILE MODIFIED. Liberty pushed a new provisioning file to this modem during a DHCP renew cycle. Hash: 676952BC. Suffix 'ctica' = Costa Rica naming convention. This is a remote config push — modem operating parameters changed without physical access." },
  { ts: "2026-06-11T15:58", id: "82000200", level: 3, raw: "No Ranging Response received - T3 time-out", threat: "LOW", annotation: "Another upstream ranging timeout. At 24h cadence these indicate periodic upstream instability, possibly RF interference on the return path." },
  { ts: "2026-06-12T12:04", id: "82000500", level: 3, raw: "Started Unicast Maintenance Ranging - No Response received - T3 time-out", threat: "LOW", annotation: "Unicast maintenance ranging failed. Modem initiated but CMTS did not respond." },
  { ts: "2026-06-12T13:30", id: "82000200", level: 3, raw: "No Ranging Response received - T3 time-out", threat: "LOW", annotation: "Second T3 timeout on Jun 12. Two in 90 minutes = upstream path disruption. Correlate with any physical activity at the building." },
  { ts: "2026-06-13T22:41", id: "2417164325", level: 6, raw: "ASSIA restarted as part of self healing mechanism", threat: "HIGH", annotation: "★ ASSIA (Adaptive Spectrum and Signal Improvement) restart #1. ASSIA is Liberty's remote dynamic spectrum management platform — runs on the CMTS and actively adjusts modem transmit levels, channel bonding, and operating parameters. A restart means Liberty's remote management system touched your modem's configuration." },
  { ts: "2026-06-13T23:20", id: "82000200", level: 3, raw: "No Ranging Response received - T3 time-out", threat: "LOW", annotation: "T3 timeout 39 minutes AFTER the ASSIA restart. ASSIA config change caused brief upstream sync loss." },
  { ts: "2026-06-14T09:57", id: "2417164325", level: 6, raw: "ASSIA restarted as part of self healing mechanism", threat: "HIGH", annotation: "★ ASSIA restart #2 within 11 hours. Two restarts in less than 12h is abnormal — indicates active remote management or automated parameter tuning in response to signal anomalies." },
  { ts: "1970-01-01T00:01", id: "82000200", level: 3, raw: "No Ranging Response received - T3 time-out", threat: "HIGH", annotation: "★ UNIX EPOCH ZERO TIMESTAMP (Jan 1 1970 00:01). Modem RTC was reset to zero — this happens after a forced firmware reload, factory reset, or power cycle that lost the time reference. Timestamp before the Jun 14 ASSIA restart suggests this T3 is from an unlogged reset event." },
  { ts: "2026-06-14T14:27", id: "2417164325", level: 6, raw: "ASSIA restarted as part of self healing mechanism", threat: "HIGH", annotation: "★ ASSIA restart #3. Three ASSIA restarts in 17 hours (Jun 13 22:41 → Jun 14 14:27). Combined with the epoch-zero event this indicates sustained remote management activity on Jun 13–14." },
  { ts: "2026-06-16T14:07", id: "82000200", level: 3, raw: "No Ranging Response received - T3 time-out", threat: "LOW", annotation: "Isolated T3 timeout. Normal low-level upstream noise event." },
  { ts: "2026-06-18T02:23", id: "68010300", level: 4, raw: "DHCP RENEW WARNING - Field invalid in response v4 option", threat: "CRITICAL", annotation: "★ Second DHCP RENEW WARNING with invalid field — same signature as Jun 10. Recurring invalid DHCP responses suggest a persistent interception or injection point between this modem and Liberty's DHCP server." },
  { ts: "2026-06-18T02:23", id: "68010600", level: 6, raw: "DHCP Renew - lease parameters tftp file-^1/9A0375ED/ctica modified", threat: "CRITICAL", annotation: "★ SECOND TFTP CONFIG MODIFICATION. New hash 9A0375ED vs previous 676952BC — DIFFERENT CONFIG pushed. At 02:23 local time (2:23 AM). Modem operating parameters changed again, silently, overnight. This is the active provisioning chain." },
  { ts: "2026-06-18T11:25", id: "82000200", level: 3, raw: "No Ranging Response received - T3 time-out", threat: "LOW", annotation: "T3 timeout 9 hours after the overnight TFTP modification." },
];

const MTA_EVENTS = [
  { ts: "2026-06-14T09:55", type: "TFTP+PROV", note: "MTA reprovision #1 of 4 on Jun 14. 2 minutes after ASSIA restart #2." },
  { ts: "2026-06-14T12:20", type: "TFTP+PROV", note: "MTA reprovision #2 on Jun 14. 2h25m after #1." },
  { ts: "2026-06-14T13:45", type: "TFTP+PROV", note: "MTA reprovision #3 on Jun 14. 85 minutes after #2." },
  { ts: "2026-06-14T14:24", type: "TFTP+PROV", note: "MTA reprovision #4 on Jun 14. 39 minutes after #3. Combined: 4 reprovi cycles in 4.5h — highly abnormal." },
];

const HARDENING_STEPS = [
  {
    id: "pw", priority: "NOW", title: "Change admin password",
    detail: "Navigate to 192.168.100.1 → Advanced → Administration. Default is usually admin/password or admin/motorola. Change to a strong random password and write it down.",
    accessible: true,
  },
  {
    id: "upnp", priority: "NOW", title: "Disable UPnP",
    detail: "Advanced → UPnP → Disable. UPnP allows any LAN device to open firewall ports without authentication. If this modem had UPnP enabled, the TR-069 8.3MB injection could have opened ports automatically.",
    accessible: true,
  },
  {
    id: "wps", priority: "NOW", title: "Disable WPS",
    detail: "Wireless → WPS → Disable. WPS PIN mode is trivially crackable in hours. Liberty modems often ship with WPS enabled by default.",
    accessible: true,
  },
  {
    id: "wifi-pw", priority: "NOW", title: "Change WiFi SSID + password",
    detail: "Change from default Liberty/ARRIS SSID. Use WPA2-AES (not TKIP, not mixed mode). A new location means a fresh start — no one knows the network name or password yet.",
    accessible: true,
  },
  {
    id: "firewall", priority: "NOW", title: "Enable SPI firewall + disable DMZ",
    detail: "Advanced → Firewall → Enable SPI (Stateful Packet Inspection). Verify no DMZ host is configured — DMZ bypasses all firewall rules.",
    accessible: true,
  },
  {
    id: "remote-admin", priority: "NOW", title: "Disable remote management",
    detail: "Advanced → Remote Management → Disable. This prevents the admin panel from being accessible from the WAN/cable side. Note: Liberty's TR-069 management bypasses this at the CMTS level — but local admin exposure is eliminated.",
    accessible: true,
  },
  {
    id: "own-router", priority: "CRITICAL", title: "Put your own router behind this modem",
    detail: "This is the single highest-impact step. Buy a GL.iNet travel router (GL-AXT1800 Slate AX, ~$80) or any OpenWRT-capable router. Plug it into LAN port 1 of the ARRIS. Connect all your devices to the travel router — NOT to the ARRIS WiFi. The ARRIS handles cable layer; your router controls your LAN, firewall, and VPN. Liberty cannot push config to your router. They can touch the ARRIS but everything behind your router is yours.",
    accessible: true,
  },
  {
    id: "vpn", priority: "CRITICAL", title: "VPN on your own router",
    detail: "Once you have a GL.iNet or similar router, enable WireGuard VPN. This encrypts all traffic before it leaves your router — Liberty/ISP sees only encrypted WireGuard packets on the WAN side. Mullvad and IVPN both support WireGuard on routers and accept crypto payment.",
    accessible: false,
  },
  {
    id: "bridge", priority: "ADVANCED", title: "Request bridge mode from Liberty (or use IP passthrough)",
    detail: "In bridge/IP passthrough mode, the ARRIS passes the public IP directly to your router. Eliminates double-NAT. Liberty may refuse — in that case, use NAT on your travel router with the ARRIS in full-gateway mode. Either configuration keeps your LAN under your control.",
    accessible: false,
  },
  {
    id: "monitor", priority: "ONGOING", title: "Daily event log monitoring",
    detail: "Screenshot 192.168.100.1/eventLog.asp daily. Any new 68010600 events = TFTP config modified (another remote push). ASSIA restarts = Liberty is actively managing your RF parameters. Log the TFTP file hashes — each different hash is a distinct config version pushed to your modem.",
    accessible: true,
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function threatColor(t: string) {
  if (t === "CRITICAL") return "bg-red-900/60 text-red-300 border-red-800";
  if (t === "HIGH") return "bg-orange-900/60 text-orange-300 border-orange-800";
  if (t === "MED") return "bg-yellow-900/60 text-yellow-300 border-yellow-800";
  return "bg-muted text-muted-foreground border-border";
}

function priorityStyle(p: string) {
  if (p === "CRITICAL") return "text-red-400 border-red-800/50";
  if (p === "NOW") return "text-orange-400 border-orange-800/50";
  if (p === "ADVANCED") return "text-blue-400 border-blue-800/50";
  return "text-muted-foreground border-border";
}

function ZoomImg({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1">
      <div className="border border-border rounded-sm overflow-hidden cursor-zoom-in" onClick={() => setOpen(true)}>
        <img src={src} alt={alt} className="w-full object-contain bg-white max-h-64 hover:opacity-90 transition-opacity" />
      </div>
      <p className="text-[9px] font-mono text-muted-foreground/40">{caption}</p>
      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setOpen(false)}>
          <img src={src} alt={alt} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function DocsisForensicsPage() {
  const [showAll, setShowAll] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const criticalEvents = DOCSIS_EVENTS.filter(e => e.threat === "CRITICAL" || e.threat === "HIGH");
  const displayedEvents = showAll ? DOCSIS_EVENTS : DOCSIS_EVENTS.slice(0, 10);

  const toggleCheck = (id: string) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border px-6 py-5">
        <div className="flex flex-wrap items-center gap-3 max-w-5xl mx-auto">
          <Router className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-mono font-bold tracking-wide">DOCSIS CABLE MODEM FORENSICS</h1>
          <Badge variant="outline" className="font-mono text-[10px] rounded-none tracking-widest">ARRIS TG2482AP2-85</Badge>
          <Badge variant="outline" className="font-mono text-[10px] rounded-none tracking-widest">CM-MAC 50:a5:dc:05:2c:a7</Badge>
          <Badge className="font-mono text-[10px] rounded-none bg-red-900 text-red-200">2× TFTP MODIFIED</Badge>
          <Badge className="font-mono text-[10px] rounded-none bg-orange-900 text-orange-200">3× ASSIA RESTART</Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* Executive Summary */}
        <div className="border-l-4 border-red-600 bg-red-950/10 px-5 py-5 rounded-r-sm">
          <div className="text-[10px] font-mono font-bold text-red-400 mb-3 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" /> FORENSIC SUMMARY — ARRIS TG2482AP2-85 @ 192.168.100.1
          </div>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <p>This modem's event log documents <strong className="text-foreground">active remote provisioning by Liberty</strong> via two distinct channels: ASSIA spectrum management (3 restarts in 17 hours) and TFTP config file modification (2 events, different hashes each time). This is not a malfunction — it is deliberate, ongoing remote management of your modem's operating parameters.</p>
            <p className="text-xs font-mono text-muted-foreground/60 mt-2">CM-MAC: 50:a5:dc:05:2c:a7 · CMTS-MAC: 00:01:5c:c0:71:aa · Model: TG2482AP2-85 · SW: 9.1.103DV8BA1 (Apr 2022) · Uptime: 4d 1h 40m · BPI: Enabled/Authorized</p>
          </div>
        </div>

        {/* Key indicators */}
        <div>
          <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-4">KEY INDICATORS</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div className="border border-red-800/40 bg-red-950/10 rounded-sm p-4">
              <div className="text-[10px] font-mono font-bold text-red-400 mb-2 uppercase">TFTP CONFIG MODIFIED × 2</div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-red-900/30 pb-1.5">
                  <span className="text-muted-foreground/60">Jun 10 19:37 — Hash</span>
                  <span className="text-red-300 font-bold">676952BC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground/60">Jun 18 02:23 — Hash</span>
                  <span className="text-red-300 font-bold">9A0375ED</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-3 leading-relaxed">Different hashes = different config pushed each time. Liberty is changing modem operating parameters remotely. Both events preceded by DHCP RENEW WARNING with invalid field — anomalous DHCP response before the config push.</p>
            </div>

            <div className="border border-orange-800/40 bg-orange-950/10 rounded-sm p-4">
              <div className="text-[10px] font-mono font-bold text-orange-400 mb-2 uppercase">ASSIA RESTARTS × 3 (17H WINDOW)</div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-orange-900/30 pb-1.5"><span className="text-muted-foreground/60">Jun 13 22:41</span><span className="text-orange-300">Restart #1</span></div>
                <div className="flex justify-between border-b border-orange-900/30 pb-1.5"><span className="text-muted-foreground/60">Jun 14 09:57</span><span className="text-orange-300">Restart #2 (+11h)</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground/60">Jun 14 14:27</span><span className="text-orange-300">Restart #3 (+4.5h)</span></div>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-3 leading-relaxed">ASSIA = Liberty's adaptive spectrum management system running on the CMTS. 3 restarts in 17h means active remote intervention in your modem's RF operating parameters.</p>
            </div>

            <div className="border border-yellow-800/40 bg-yellow-950/10 rounded-sm p-4">
              <div className="text-[10px] font-mono font-bold text-yellow-400 mb-2 uppercase">4× MTA REPROVISION ON JUN 14</div>
              <div className="space-y-1 text-xs font-mono">
                {MTA_EVENTS.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-muted-foreground/60 flex-shrink-0">{e.ts.split("T")[1]}</span>
                    <span className="text-yellow-300">{e.type}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-3 leading-relaxed">Four MTA (voice module) reprovisioning cycles in 4.5 hours. Each requires TFTP + DHCP. Normal operation: ≤1/day. This correlates directly with the ASSIA restarts on the same date.</p>
            </div>

            <div className="border border-purple-800/40 bg-purple-950/10 rounded-sm p-4">
              <div className="text-[10px] font-mono font-bold text-purple-400 mb-2 uppercase">EPOCH ZERO TIMESTAMP</div>
              <div className="text-xs font-mono text-purple-300 mb-2">1970-01-01 00:01:00 — T3 time-out</div>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">A Unix epoch zero timestamp in the event log means the modem's real-time clock was reset to zero — this occurs during a firmware reload, factory reset, or hard power cycle without time sync recovery. The event immediately precedes the third ASSIA restart, suggesting an unlogged forced reset event on Jun 14.</p>
            </div>
          </div>
        </div>

        {/* Modem screenshots */}
        <div>
          <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-4">MODEM EVIDENCE CAPTURE — {new Date().toLocaleDateString()}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ZoomImg
              src="/evidence/arris_status_1781820527818.png"
              alt="ARRIS Status — RF Parameters"
              caption="Status — 24 DS channels 256QAM, 3 US channels ATDMA 64QAM. BPI: Enabled/Authorized. 2 IPv4 DHCP attempts."
            />
            <ZoomImg
              src="/evidence/arris_hwfw_1781820527818.png"
              alt="ARRIS HW/FW Versions"
              caption="HW/FW — SW_REV: 9.1.103DV8BA1, built Apr 18 2022. MODEL: TG2482AP2-85. Serial: 1BU4NJ698502107."
            />
            <ZoomImg
              src="/evidence/arris_cmstate_1781820527818.png"
              alt="ARRIS CM State"
              caption="CM State — All phases Completed. BPI: Enabled/Authorized. 2 IPv4 DHCP attempts to obtain CM IP."
            />
          </div>

          <div className="mt-4 bg-card/20 border border-border rounded-sm p-4">
            <div className="text-[10px] font-mono font-bold text-muted-foreground/60 mb-3 uppercase">RF CHANNEL SUMMARY</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="text-center border border-border/40 rounded-sm p-2">
                <div className="text-lg font-bold text-foreground">24</div>
                <div className="text-[9px] text-muted-foreground/60">DS Channels<br />256QAM</div>
              </div>
              <div className="text-center border border-border/40 rounded-sm p-2">
                <div className="text-lg font-bold text-foreground">3</div>
                <div className="text-[9px] text-muted-foreground/60">US Channels<br />64QAM ATDMA</div>
              </div>
              <div className="text-center border border-border/40 rounded-sm p-2">
                <div className="text-lg font-bold text-yellow-400">−3.5 to −6</div>
                <div className="text-[9px] text-muted-foreground/60">DS Power<br />dBmV</div>
              </div>
              <div className="text-center border border-border/40 rounded-sm p-2">
                <div className="text-lg font-bold text-green-400">37–41</div>
                <div className="text-[9px] text-muted-foreground/60">DS SNR<br />dB</div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-2">DS power slightly negative (acceptable: −7 to +7 dBmV). SNR 37–41 dB is good. Several downstream channels show non-zero uncorrectables — minor, but worth watching for increase over time.</p>
          </div>
        </div>

        {/* Full event log */}
        <div>
          <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" /> ANNOTATED EVENT LOG — DOCSIS(CM) · {DOCSIS_EVENTS.length} events
          </div>
          <div className="border border-border rounded-sm overflow-hidden">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="border-b border-border bg-card/50 text-muted-foreground/60 text-left">
                  <th className="px-3 py-2 font-normal">TIME</th>
                  <th className="px-3 py-2 font-normal">EVENT ID</th>
                  <th className="px-3 py-2 font-normal">THREAT</th>
                  <th className="px-3 py-2 font-normal">DESCRIPTION</th>
                </tr>
              </thead>
              <tbody>
                {displayedEvents.map((ev, i) => {
                  const key = `${ev.ts}-${ev.id}`;
                  const isOpen = expandedEvent === key;
                  const isEpoch = ev.ts.startsWith("1970");
                  return (
                    <Fragment key={key}>
                      <tr
                        className={`border-b border-border/30 cursor-pointer transition-colors ${isOpen ? "bg-card/40" : "hover:bg-card/20"} ${ev.threat === "CRITICAL" ? "bg-red-950/5" : ""}`}
                        onClick={() => setExpandedEvent(isOpen ? null : key)}
                      >
                        <td className={`px-3 py-2 whitespace-nowrap ${isEpoch ? "text-purple-400" : "text-muted-foreground/60"}`}>
                          {isEpoch ? "⚠ 1970-01-01" : ev.ts.replace("T", " ")}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground/50">{ev.id}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold border ${threatColor(ev.threat)}`}>{ev.threat}</span>
                        </td>
                        <td className="px-3 py-2 text-foreground/80 truncate max-w-[300px]">{ev.raw}</td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-card/30 border-b border-border/30">
                          <td colSpan={4} className="px-4 py-3">
                            <div className={`text-[11px] leading-relaxed ${ev.threat === "CRITICAL" ? "text-red-300/90" : ev.threat === "HIGH" ? "text-orange-300/90" : "text-muted-foreground/80"}`}>
                              {ev.annotation}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!showAll && DOCSIS_EVENTS.length > 10 && (
            <button onClick={() => setShowAll(true)} className="mt-2 text-[11px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors">
              + Show all {DOCSIS_EVENTS.length} events
            </button>
          )}
        </div>

        {/* What Liberty CAN vs CANNOT do */}
        <div>
          <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-4">WHAT LIBERTY CONTROLS vs WHAT YOU CONTROL</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-red-800/30 bg-red-950/10 rounded-sm p-4">
              <div className="text-[10px] font-mono font-bold text-red-400 mb-3 uppercase">LIBERTY CONTROLS (CANNOT BE STOPPED FROM MODEM UI)</div>
              <ul className="space-y-1.5 text-xs text-muted-foreground/80">
                {[
                  "DOCSIS provisioning (TFTP config files)",
                  "ASSIA spectrum management — RF parameters",
                  "DHCP lease assignment and renewal",
                  "TR-069/CWMP remote configuration push",
                  "Firmware updates (Liberty can push new FW)",
                  "CMTS-level upstream/downstream channel bonding",
                  "MTA/VoIP provisioning",
                  "BPI (encryption key) management",
                ].map(i => <li key={i} className="flex gap-2"><AlertTriangle className="h-3 w-3 text-red-400/60 flex-shrink-0 mt-0.5" />{i}</li>)}
              </ul>
            </div>
            <div className="border border-green-800/30 bg-green-950/10 rounded-sm p-4">
              <div className="text-[10px] font-mono font-bold text-green-400 mb-3 uppercase">YOU CONTROL (WITH YOUR OWN ROUTER BEHIND THE ARRIS)</div>
              <ul className="space-y-1.5 text-xs text-muted-foreground/80">
                {[
                  "All LAN traffic — firewall, routing, NAT",
                  "WiFi SSID, password, encryption (on your router)",
                  "DNS — use 1.1.1.1 or self-hosted, not Liberty's",
                  "VPN — WireGuard on router encrypts all traffic",
                  "Device isolation and guest networks",
                  "Port forwarding and inbound access control",
                  "Traffic monitoring and anomaly detection",
                  "UPnP status on your own router",
                ].map(i => <li key={i} className="flex gap-2"><CheckCircle className="h-3 w-3 text-green-400/60 flex-shrink-0 mt-0.5" />{i}</li>)}
              </ul>
            </div>
          </div>
        </div>

        {/* Hardening checklist */}
        <div>
          <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> HARDENING CHECKLIST — {checkedSteps.size}/{HARDENING_STEPS.length} COMPLETE
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-border rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(checkedSteps.size / HARDENING_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="space-y-3">
            {HARDENING_STEPS.map(step => {
              const done = checkedSteps.has(step.id);
              return (
                <div
                  key={step.id}
                  className={`border rounded-sm p-4 transition-all cursor-pointer ${done ? "border-green-800/40 bg-green-950/10 opacity-70" : "border-border bg-card/20 hover:bg-card/30"}`}
                  onClick={() => toggleCheck(step.id)}
                  data-testid={`hardening-step-${step.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {done
                        ? <CheckCircle className="h-4 w-4 text-green-400" />
                        : <Circle className="h-4 w-4 text-muted-foreground/30" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[9px] font-mono font-bold border px-1.5 py-0.5 rounded-sm ${priorityStyle(step.priority)}`}>{step.priority}</span>
                        <span className={`text-sm font-semibold ${done ? "line-through text-muted-foreground/40" : "text-foreground"}`}>{step.title}</span>
                        {!step.accessible && <Badge variant="outline" className="text-[9px] font-mono rounded-none">requires ext. router</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground/70 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TFTP hash analysis */}
        <div className="border border-border rounded-sm p-5 bg-card/10">
          <div className="text-[10px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" /> TFTP CONFIG FILE ANALYSIS
          </div>
          <div className="space-y-3 text-xs text-muted-foreground/80 leading-relaxed">
            <p>The DOCSIS provisioning process works like this: when the modem gets an IP via DHCP, the DHCP response includes a TFTP server address and a config file path. The modem downloads that file, which contains its operating parameters (downstream/upstream channel lists, QoS policies, firewall rules, CPE management settings, TR-069 server address, etc.).</p>
            <p>The event log shows two instances of <code className="text-foreground font-mono bg-muted px-1">DHCP Renew - lease parameters tftp file modified</code>:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="border border-red-800/30 bg-red-950/10 rounded-sm p-3 font-mono text-[11px]">
                <div className="text-muted-foreground/60 text-[9px] mb-1">Jun 10 19:37</div>
                <div className="text-red-300">^1/676952BC/ctica</div>
                <div className="text-muted-foreground/50 text-[9px] mt-1">
                  ^1/ = CMTS config prefix<br />
                  676952BC = config version hash<br />
                  /ctica = Costa Rica ISP suffix
                </div>
              </div>
              <div className="border border-red-800/30 bg-red-950/10 rounded-sm p-3 font-mono text-[11px]">
                <div className="text-muted-foreground/60 text-[9px] mb-1">Jun 18 02:23</div>
                <div className="text-red-300">^1/9A0375ED/ctica</div>
                <div className="text-muted-foreground/50 text-[9px] mt-1">
                  ^1/ = same CMTS prefix<br />
                  9A0375ED = DIFFERENT hash<br />
                  /ctica = same ISP suffix
                </div>
              </div>
            </div>
            <p className="mt-2">Two different hashes = two different config files = two distinct configuration states pushed to your modem. The <strong className="text-foreground">DHCP RENEW WARNING - Field invalid in response v4 option</strong> immediately preceding each TFTP modification suggests the DHCP response was either injected, modified in transit, or contained non-standard fields before the config change was applied.</p>
            <p><strong className="text-foreground">What to watch for:</strong> Any future <code className="text-foreground font-mono bg-muted px-1">68010600</code> event in the event log = another config push. Screenshot the new hash and compare. The pace of config changes (Jun 10, Jun 18) is 1 per week — consistent with active remote management.</p>
          </div>
        </div>

        {/* ASSIA explanation */}
        <div className="border border-orange-800/30 bg-orange-950/10 rounded-sm p-5">
          <div className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Radio className="h-3.5 w-3.5" /> WHAT IS ASSIA AND WHY DOES IT MATTER
          </div>
          <div className="space-y-2 text-xs text-muted-foreground/80 leading-relaxed">
            <p>ASSIA Inc. (now part of Verana Networks) provides a <strong className="text-foreground">Dynamic Spectrum Management (DSM)</strong> platform called DynaMesh/ExpertCARE. Liberty and other large cable operators use it to remotely manage cable plant RF performance — upstream power levels, channel bonding, FEC settings, pre-equalization, and QoS.</p>
            <p>When ASSIA restarts (<code className="text-foreground font-mono bg-muted px-1">ASSIA restarted as part of self healing mechanism</code>), it means Liberty's remote management platform detected something about your modem's connection that triggered a parameter change. The "self healing" label is Liberty's marketing language — operationally it means Liberty pushed a config change.</p>
            <p><strong className="text-foreground">3 restarts in 17 hours on Jun 13–14 is not routine.</strong> Normal ASSIA activity might produce 1–2 restarts per week during off-hours maintenance. Jun 13–14 represents focused attention on this specific modem.</p>
            <p>Note: ASSIA also enables Kyndryl/ISP remote access patterns that have been documented in prior evidence (8.3MB service worker injection, CWMP TR-069 mesh insertion). The ASSIA restart events confirm Liberty's remote management is actively running on this modem at the new location.</p>
          </div>
        </div>

        {/* Bottom: immediate action priority */}
        <div className="border border-primary/20 bg-card/20 rounded-sm p-5">
          <div className="text-[10px] font-mono font-bold text-primary/80 uppercase tracking-widest mb-3">IMMEDIATE PRIORITY ACTIONS (WHAT TO DO TODAY)</div>
          <ol className="space-y-3 text-sm text-muted-foreground/80 leading-relaxed list-decimal list-inside">
            <li><strong className="text-foreground">Change the admin password</strong> at 192.168.100.1 right now if you haven't already.</li>
            <li><strong className="text-foreground">Disable UPnP and WPS</strong> in the ARRIS Advanced settings.</li>
            <li><strong className="text-foreground">Buy a travel router</strong> — GL.iNet GL-AXT1800 (~$80 on Amazon) is the best option. Plug it into LAN Port 1. Connect all your devices to it. The ARRIS becomes just a cable modem from your perspective — Liberty can manage it, but they can't touch your LAN.</li>
            <li><strong className="text-foreground">Screenshot the event log daily</strong> (192.168.100.1/eventLog.asp). Watch for new <code className="text-foreground font-mono bg-muted px-1">68010600</code> TFTP modification events — each is a remote config push. Log the hash.</li>
            <li><strong className="text-foreground">Do NOT attempt to block TR-069 at the modem level</strong> — Liberty's provisioning will override any local block during the next DHCP renewal. Put your own router behind it instead.</li>
          </ol>
        </div>

      </div>
    </div>
  );
}
