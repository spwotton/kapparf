import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { KAPPA_CONSTANTS } from "@shared/schema";
import {
  Radio, Search, Shield, Wifi, Globe, Server,
  ArrowRight, CheckCircle, XCircle, Loader2, Copy,
  Hash, Lock, Unlock, Eye,
} from "lucide-react";

const MORSE_MAP: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---",
  "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...",
  "8": "---..", "9": "----.", ".": ".-.-.-", ",": "--..--", "?": "..--..",
  "'": ".----.", "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-",
  "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.",
  "-": "-....-", "_": "..--.-", '"': ".-..-.", "$": "...-..-", "@": ".--.-.",
  " ": "/",
};

const REVERSE_MORSE: Record<string, string> = {};
Object.entries(MORSE_MAP).forEach(([k, v]) => { REVERSE_MORSE[v] = k; });

function encodeMorse(text: string): string {
  return text.toUpperCase().split("").map(c => MORSE_MAP[c] || "").filter(Boolean).join(" ");
}

function decodeMorse(morse: string): string {
  return morse.split(" / ").map(word =>
    word.split(" ").map(c => REVERSE_MORSE[c] || "?").join("")
  ).join(" ");
}

const ADSB_DF_NAMES: Record<number, string> = {
  0: "Short Air-Air Surveillance", 4: "Surveillance Altitude Reply",
  5: "Surveillance Identity Reply", 11: "All-Call Reply",
  16: "Long Air-Air Surveillance", 17: "Extended Squitter (ADS-B)",
  18: "Extended Squitter (TIS-B)", 20: "Comm-B Altitude Reply",
  21: "Comm-B Identity Reply", 24: "Comm-D Extended Length",
};

function decodeAdsb(hex: string): Record<string, unknown> {
  const clean = hex.replace(/[^a-fA-F0-9]/g, "");
  if (clean.length < 14) return { error: "Minimum 14 hex characters (56 bits) required" };

  const bin = clean.split("").map(h => parseInt(h, 16).toString(2).padStart(4, "0")).join("");
  const df = parseInt(bin.slice(0, 5), 2);
  const result: Record<string, unknown> = {
    raw: clean.toUpperCase(),
    bitsLength: bin.length,
    downlinkFormat: df,
    dfName: ADSB_DF_NAMES[df] || `Unknown DF${df}`,
  };

  if (df === 17 || df === 18) {
    const icao = clean.slice(2, 8).toUpperCase();
    const typeCode = parseInt(bin.slice(32, 37), 2);
    result.icao = icao;
    result.capability = parseInt(bin.slice(5, 8), 2);
    result.typeCode = typeCode;

    if (typeCode >= 1 && typeCode <= 4) {
      result.category = "Aircraft Identification";
      const charset = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ##### ###############0123456789######";
      let callsign = "";
      for (let i = 0; i < 8; i++) {
        const idx = parseInt(bin.slice(40 + i * 6, 46 + i * 6), 2);
        callsign += charset[idx] || "?";
      }
      result.callsign = callsign.trim();
    } else if (typeCode >= 9 && typeCode <= 18) {
      result.category = "Airborne Position (Baro Alt)";
      const altBits = bin.slice(40, 52);
      const qBit = altBits[4];
      if (qBit === "1") {
        const n = parseInt(altBits.slice(0, 4) + altBits.slice(5), 2);
        result.altitude = n * 25 - 1000;
        result.altitudeUnit = "ft";
      }
    } else if (typeCode === 19) {
      result.category = "Airborne Velocity";
    } else if (typeCode >= 20 && typeCode <= 22) {
      result.category = "Airborne Position (GNSS Alt)";
    } else if (typeCode >= 5 && typeCode <= 8) {
      result.category = "Surface Position";
    } else if (typeCode === 28) {
      result.category = "Aircraft Status";
    } else if (typeCode === 29) {
      result.category = "Target State and Status";
    } else if (typeCode === 31) {
      result.category = "Aircraft Operation Status";
    }
  } else if (df === 11) {
    result.icao = clean.slice(2, 8).toUpperCase();
    result.capability = parseInt(bin.slice(5, 8), 2);
  } else if (df === 4 || df === 20) {
    result.flightStatus = parseInt(bin.slice(5, 8), 2);
  }

  return result;
}

const C = 299792458;

function rfCalc(freqHz: number) {
  const wavelength = C / freqHz;
  const period = 1 / freqHz;
  const nearField = wavelength / (2 * Math.PI);
  const harmonics = Array.from({ length: 8 }, (_, i) => ({
    n: i + 1,
    freq: freqHz * (i + 1),
  }));

  let band = "Unknown";
  if (freqHz < 30) band = "ELF";
  else if (freqHz < 300) band = "SLF";
  else if (freqHz < 3000) band = "ULF";
  else if (freqHz < 30000) band = "VLF";
  else if (freqHz < 300000) band = "LF";
  else if (freqHz < 3e6) band = "MF";
  else if (freqHz < 30e6) band = "HF";
  else if (freqHz < 300e6) band = "VHF";
  else if (freqHz < 3e9) band = "UHF";
  else if (freqHz < 30e9) band = "SHF";
  else if (freqHz < 300e9) band = "EHF";
  else band = "THF";

  return { wavelength, period, nearField, harmonics, band };
}

function formatFreq(hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(4)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(4)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(4)} kHz`;
  return `${hz.toFixed(4)} Hz`;
}

function formatLength(m: number): string {
  if (m >= 1e3) return `${(m / 1e3).toFixed(3)} km`;
  if (m >= 1) return `${m.toFixed(4)} m`;
  if (m >= 1e-3) return `${(m * 1e3).toFixed(4)} mm`;
  return `${(m * 1e6).toFixed(4)} µm`;
}

function MorseCodeTool() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const output = mode === "encode" ? encodeMorse(input) : decodeMorse(input);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("toolkit.morse")}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-[9px]">ggmorse</Badge>
            <Badge variant="outline" className="text-[9px]">Morserino-32</Badge>
          </div>
        </div>
        <CardDescription className="text-xs">{t("toolkit.morseDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant={mode === "encode" ? "default" : "outline"} size="sm"
            onClick={() => setMode("encode")} data-testid="button-morse-encode"
          >
            {t("toolkit.encode")}
          </Button>
          <Button
            variant={mode === "decode" ? "default" : "outline"} size="sm"
            onClick={() => setMode("decode")} data-testid="button-morse-decode"
          >
            {t("toolkit.decode")}
          </Button>
        </div>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "encode" ? "KAPPA SIGINT" : "-.-- .- / -.-. ---"}
          data-testid="input-morse"
        />
        {output && (
          <div className="p-3 bg-muted/50 rounded-md font-mono text-sm break-all" data-testid="text-morse-output">
            {output}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdsbDecoderTool() {
  const { t } = useI18n();
  const [hex, setHex] = useState("");
  const result = hex.replace(/[^a-fA-F0-9]/g, "").length >= 14 ? decodeAdsb(hex) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("toolkit.adsb")}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-[9px]">dump1090</Badge>
            <Badge variant="outline" className="text-[9px]">pyModeS</Badge>
          </div>
        </div>
        <CardDescription className="text-xs">{t("toolkit.adsbDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          placeholder="8D4840D6202CC371C32CE0576098"
          className="font-mono"
          data-testid="input-adsb-hex"
        />
        {result && !result.error && (
          <div className="space-y-1.5 text-xs" data-testid="text-adsb-result">
            {Object.entries(result).map(([key, val]) => (
              <div key={key} className="flex justify-between gap-2">
                <span className="text-muted-foreground font-mono">{key}</span>
                <span className="font-mono text-right truncate">
                  {typeof val === "object" ? JSON.stringify(val) : String(val)}
                </span>
              </div>
            ))}
          </div>
        )}
        {result?.error != null && (
          <p className="text-xs text-destructive">{String(result.error)}</p>
        )}
      </CardContent>
    </Card>
  );
}

function MacLookupTool() {
  const { t } = useI18n();
  const [mac, setMac] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tools/mac-lookup", { mac });
      return res.json();
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("toolkit.macLookup")}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-[9px]">Wireshark</Badge>
            <Badge variant="outline" className="text-[9px]">Bettercap</Badge>
          </div>
        </div>
        <CardDescription className="text-xs">{t("toolkit.macLookupDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={mac}
            onChange={(e) => setMac(e.target.value)}
            placeholder="AA:BB:CC:DD:EE:FF"
            className="font-mono"
            data-testid="input-mac"
          />
          <Button
            size="sm" onClick={() => mutation.mutate()}
            disabled={mutation.isPending || mac.replace(/[^a-fA-F0-9]/g, "").length < 6}
            data-testid="button-mac-lookup"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        {result && (
          <div className="space-y-1.5 text-xs" data-testid="text-mac-result">
            <div className="flex justify-between">
              <span className="text-muted-foreground">MAC</span>
              <span className="font-mono">{String(result.mac)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">OUI</span>
              <span className="font-mono">{String(result.oui)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("toolkit.vendor")}</span>
              <span className="font-semibold">{result.found ? String(result.vendor) : "Unknown"}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RfCalculatorTool() {
  const { t } = useI18n();
  const [freqStr, setFreqStr] = useState("46.875");
  const [unit, setUnit] = useState<"Hz" | "kHz" | "MHz" | "GHz">("Hz");

  const multiplier = { Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9 };
  const freqHz = parseFloat(freqStr) * multiplier[unit];
  const valid = !isNaN(freqHz) && freqHz > 0;
  const calc = valid ? rfCalc(freqHz) : null;

  const presets = [
    { label: "κ-Clock", freq: KAPPA_CONSTANTS.CLOCK_HZ, unit: "Hz" as const },
    { label: "Schumann", freq: 7.83, unit: "Hz" as const },
    { label: "433 MHz ISM", freq: 433, unit: "MHz" as const },
    { label: "1090 MHz ADS-B", freq: 1090, unit: "MHz" as const },
    { label: "2.4 GHz WiFi", freq: 2.4, unit: "GHz" as const },
    { label: "5.8 GHz WiFi", freq: 5.8, unit: "GHz" as const },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("toolkit.rfCalc")}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-[9px]">PhastFT</Badge>
            <Badge variant="outline" className="text-[9px]">urh</Badge>
          </div>
        </div>
        <CardDescription className="text-xs">{t("toolkit.rfCalcDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={freqStr}
            onChange={(e) => setFreqStr(e.target.value)}
            type="number" step="any" className="font-mono"
            data-testid="input-rf-freq"
          />
          <div className="flex gap-1">
            {(["Hz", "kHz", "MHz", "GHz"] as const).map(u => (
              <Button
                key={u} variant={unit === u ? "default" : "outline"} size="sm"
                onClick={() => setUnit(u)} data-testid={`button-rf-unit-${u}`}
              >
                {u}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {presets.map(p => (
            <Button key={p.label} variant="ghost" size="sm" className="text-xs h-7 px-2"
              onClick={() => { setFreqStr(String(p.freq)); setUnit(p.unit); }}
              data-testid={`button-rf-preset-${p.label.replace(/\s/g, "-")}`}
            >
              {p.label}
            </Button>
          ))}
        </div>
        {calc && (
          <div className="space-y-1.5 text-xs" data-testid="text-rf-result">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("toolkit.frequency")}</span>
              <span className="font-mono">{formatFreq(freqHz)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("toolkit.wavelength")}</span>
              <span className="font-mono">{formatLength(calc.wavelength)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("toolkit.period")}</span>
              <span className="font-mono">{calc.period < 1e-3 ? `${(calc.period * 1e6).toFixed(4)} µs` : `${(calc.period * 1e3).toFixed(4)} ms`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("toolkit.nearField")}</span>
              <span className="font-mono">{formatLength(calc.nearField)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("toolkit.band")}</span>
              <Badge variant="secondary" className="text-[10px]">{calc.band}</Badge>
            </div>
            <div className="pt-1">
              <span className="text-[10px] text-muted-foreground">{t("toolkit.harmonics")}</span>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {calc.harmonics.map(h => (
                  <span key={h.n} className="text-[10px] font-mono px-1.5 py-0.5 bg-muted/50 rounded">
                    {h.n}× {formatFreq(h.freq)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PortScannerTool() {
  const { t } = useI18n();
  const [target, setTarget] = useState("");
  const [result, setResult] = useState<{
    target: string; resolvedIp: string; ports: { port: number; open: boolean; service: string }[];
    openCount: number; scannedCount: number; timestamp: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tools/port-scan", { target });
      return res.json();
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("toolkit.portScan")}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-[9px]">nmap</Badge>
            <Badge variant="outline" className="text-[9px]">Above</Badge>
          </div>
        </div>
        <CardDescription className="text-xs">{t("toolkit.portScanDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="example.com"
            data-testid="input-port-target"
          />
          <Button
            size="sm" onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !target.trim()}
            data-testid="button-port-scan"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("toolkit.scan")}
          </Button>
        </div>
        {result && (
          <div className="space-y-2 text-xs" data-testid="text-port-result">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{result.target} ({result.resolvedIp})</span>
              <Badge variant="secondary" className="text-[10px]">
                {result.openCount}/{result.scannedCount} open
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
              {result.ports.map(p => (
                <div key={p.port} className={`flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[11px] ${p.open ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted/30 text-muted-foreground"}`}>
                  {p.open ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {p.port} {p.service}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WhoisTool() {
  const { t } = useI18n();
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tools/whois", { domain });
      return res.json();
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("toolkit.whois")}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-[9px]">theHarvester</Badge>
            <Badge variant="outline" className="text-[9px]">SpiderFoot</Badge>
          </div>
        </div>
        <CardDescription className="text-xs">{t("toolkit.whoisDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            data-testid="input-whois-domain"
          />
          <Button
            size="sm" onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !domain.trim()}
            data-testid="button-whois-lookup"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        {result && (
          <div className="space-y-2 text-xs" data-testid="text-whois-result">
            {Array.isArray(result.ipv4) && (result.ipv4 as string[]).length > 0 && (
              <div>
                <span className="text-muted-foreground">IPv4: </span>
                <span className="font-mono">{(result.ipv4 as string[]).join(", ")}</span>
              </div>
            )}
            {Array.isArray(result.ns) && (result.ns as string[]).length > 0 && (
              <div>
                <span className="text-muted-foreground">NS: </span>
                <span className="font-mono">{(result.ns as string[]).join(", ")}</span>
              </div>
            )}
            {Array.isArray(result.mx) && (result.mx as { priority: number; exchange: string }[]).length > 0 && (
              <div>
                <span className="text-muted-foreground">MX: </span>
                <span className="font-mono">
                  {(result.mx as { priority: number; exchange: string }[]).map(m => `${m.exchange} (${m.priority})`).join(", ")}
                </span>
              </div>
            )}
            {result.soa != null && (
              <div>
                <span className="text-muted-foreground">SOA: </span>
                <span className="font-mono">{(result.soa as { nsname: string }).nsname}</span>
              </div>
            )}
            {Array.isArray(result.txt) && (result.txt as string[]).length > 0 && (
              <div>
                <span className="text-muted-foreground block mb-1">TXT Records:</span>
                {(result.txt as string[]).map((txt, i) => (
                  <div key={i} className="font-mono text-[10px] bg-muted/30 px-2 py-1 rounded mb-1 break-all">{txt}</div>
                ))}
              </div>
            )}
            {Array.isArray(result.subdomains) && (result.subdomains as string[]).length > 0 && (
              <div>
                <span className="text-muted-foreground block mb-1">{t("toolkit.subdomains")} ({(result.subdomains as string[]).length}):</span>
                <div className="flex gap-1 flex-wrap">
                  {(result.subdomains as string[]).map(s => (
                    <Badge key={s} variant="secondary" className="text-[10px] font-mono">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HttpProbeTool() {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<{
    url: string; status: number; statusText: string; latency: number;
    headers: Record<string, string>; securityHeaders: Record<string, string | null>;
    securityScore: number; server: string | null; poweredBy: string | null;
    contentType: string | null; timestamp: string;
  } | null>(null);
  const [showAllHeaders, setShowAllHeaders] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tools/http-probe", { url });
      return res.json();
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("toolkit.httpProbe")}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-[9px]">Wireshark</Badge>
            <Badge variant="outline" className="text-[9px]">Bettercap</Badge>
            <Badge variant="outline" className="text-[9px]">tcpdump</Badge>
          </div>
        </div>
        <CardDescription className="text-xs">{t("toolkit.httpProbeDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            data-testid="input-http-url"
          />
          <Button
            size="sm" onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !url.trim()}
            data-testid="button-http-probe"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("toolkit.probe")}
          </Button>
        </div>
        {result && (
          <div className="space-y-3 text-xs" data-testid="text-http-result">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={result.status < 400 ? "secondary" : "destructive"} className="font-mono">
                {result.status} {result.statusText}
              </Badge>
              <span className="font-mono text-muted-foreground">{result.latency}ms</span>
              {result.server && <span className="font-mono">Server: {result.server}</span>}
              {result.poweredBy && <span className="font-mono text-muted-foreground">{result.poweredBy}</span>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-muted-foreground font-medium">{t("toolkit.securityHeaders")}</span>
                <Badge variant={result.securityScore >= 70 ? "secondary" : "destructive"} className="text-[10px]">
                  {result.securityScore}%
                </Badge>
              </div>
              <div className="space-y-1">
                {Object.entries(result.securityHeaders).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    {val ? <Lock className="h-3 w-3 text-green-600" /> : <Unlock className="h-3 w-3 text-red-500" />}
                    <span className="font-mono text-[11px]">{key}</span>
                    {val && <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">{val}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Button
                variant="ghost" size="sm" className="text-xs h-6 px-2"
                onClick={() => setShowAllHeaders(!showAllHeaders)}
                data-testid="button-toggle-headers"
              >
                {showAllHeaders ? t("toolkit.hideHeaders") : t("toolkit.showHeaders")} ({Object.keys(result.headers).length})
              </Button>
              {showAllHeaders && (
                <div className="mt-2 space-y-0.5 bg-muted/30 p-2 rounded">
                  {Object.entries(result.headers).map(([key, val]) => (
                    <div key={key} className="font-mono text-[10px]">
                      <span className="text-muted-foreground">{key}:</span> {val}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PacketDecoderTool() {
  const { t } = useI18n();
  const [hexInput, setHexInput] = useState("");

  const decode = (hex: string) => {
    const clean = hex.replace(/[^a-fA-F0-9]/g, "");
    if (clean.length < 28) return null;

    const bytes = [];
    for (let i = 0; i < clean.length; i += 2) {
      bytes.push(parseInt(clean.slice(i, i + 2), 16));
    }

    const result: Record<string, unknown> = {};

    if (bytes.length >= 14) {
      result.dstMac = bytes.slice(0, 6).map(b => b.toString(16).padStart(2, "0")).join(":").toUpperCase();
      result.srcMac = bytes.slice(6, 12).map(b => b.toString(16).padStart(2, "0")).join(":").toUpperCase();
      const etherType = (bytes[12] << 8) | bytes[13];
      result.etherType = `0x${etherType.toString(16).padStart(4, "0")}`;

      const etherNames: Record<number, string> = {
        0x0800: "IPv4", 0x0806: "ARP", 0x86DD: "IPv6",
        0x8100: "802.1Q VLAN", 0x88CC: "LLDP", 0x8847: "MPLS",
      };
      result.protocol = etherNames[etherType] || "Unknown";

      if (etherType === 0x0800 && bytes.length >= 34) {
        const ihl = (bytes[14] & 0x0F) * 4;
        result.ipVersion = (bytes[14] >> 4);
        result.ipHeaderLen = ihl;
        result.ttl = bytes[22];
        const ipProto = bytes[23];
        result.ipProtocol = ipProto;
        const protoNames: Record<number, string> = {
          1: "ICMP", 6: "TCP", 17: "UDP", 41: "IPv6-in-IPv4", 47: "GRE", 50: "ESP",
        };
        result.ipProtocolName = protoNames[ipProto] || `Proto ${ipProto}`;
        result.srcIp = bytes.slice(26, 30).join(".");
        result.dstIp = bytes.slice(30, 34).join(".");
        result.totalLength = (bytes[16] << 8) | bytes[17];

        if (ipProto === 6 && bytes.length >= 14 + ihl + 20) {
          const tcpOff = 14 + ihl;
          result.srcPort = (bytes[tcpOff] << 8) | bytes[tcpOff + 1];
          result.dstPort = (bytes[tcpOff + 2] << 8) | bytes[tcpOff + 3];
          const flags = bytes[tcpOff + 13];
          const flagNames = [];
          if (flags & 0x01) flagNames.push("FIN");
          if (flags & 0x02) flagNames.push("SYN");
          if (flags & 0x04) flagNames.push("RST");
          if (flags & 0x08) flagNames.push("PSH");
          if (flags & 0x10) flagNames.push("ACK");
          if (flags & 0x20) flagNames.push("URG");
          result.tcpFlags = flagNames.join(",");
          result.seqNo = ((bytes[tcpOff + 4] << 24) | (bytes[tcpOff + 5] << 16) | (bytes[tcpOff + 6] << 8) | bytes[tcpOff + 7]) >>> 0;
          result.windowSize = (bytes[tcpOff + 14] << 8) | bytes[tcpOff + 15];
        } else if (ipProto === 17 && bytes.length >= 14 + ihl + 8) {
          const udpOff = 14 + ihl;
          result.srcPort = (bytes[udpOff] << 8) | bytes[udpOff + 1];
          result.dstPort = (bytes[udpOff + 2] << 8) | bytes[udpOff + 3];
          result.udpLength = (bytes[udpOff + 4] << 8) | bytes[udpOff + 5];
        }
      }
    }

    return result;
  };

  const result = hexInput.replace(/[^a-fA-F0-9]/g, "").length >= 28 ? decode(hexInput) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("toolkit.packetDecode")}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-[9px]">tcpdump</Badge>
            <Badge variant="outline" className="text-[9px]">Wireshark</Badge>
            <Badge variant="outline" className="text-[9px]">Bettercap</Badge>
          </div>
        </div>
        <CardDescription className="text-xs">{t("toolkit.packetDecodeDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          placeholder="Paste raw packet hex bytes (Ethernet frame)..."
          className="font-mono text-xs h-20"
          data-testid="input-packet-hex"
        />
        {result && Object.keys(result).length > 0 && (
          <div className="space-y-1.5 text-xs" data-testid="text-packet-result">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(result).map(([key, val]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-mono text-right truncate">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function IntegratedTools() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight" data-testid="text-integrated-title">
          {t("toolkit.title")}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t("toolkit.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HttpProbeTool />
        <PacketDecoderTool />
        <PortScannerTool />
        <WhoisTool />
        <MacLookupTool />
        <RfCalculatorTool />
        <AdsbDecoderTool />
        <MorseCodeTool />
      </div>
    </div>
  );
}
