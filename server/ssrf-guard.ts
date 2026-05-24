import dns from "dns/promises";
import net from "net";
import http from "http";
import https from "https";

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

// ---------------------------------------------------------------------------
// IPv4 private / reserved range table
// ---------------------------------------------------------------------------

interface CidrRange { base: number; mask: number }

const BLOCKED_IPV4_RANGES: CidrRange[] = [
  { base: cidr("0.0.0.0"),         mask: 0xff000000 },
  { base: cidr("10.0.0.0"),        mask: 0xff000000 },
  { base: cidr("100.64.0.0"),      mask: 0xffc00000 },
  { base: cidr("127.0.0.0"),       mask: 0xff000000 },
  { base: cidr("169.254.0.0"),     mask: 0xffff0000 },
  { base: cidr("172.16.0.0"),      mask: 0xfff00000 },
  { base: cidr("192.0.0.0"),       mask: 0xffffff00 },
  { base: cidr("192.168.0.0"),     mask: 0xffff0000 },
  { base: cidr("198.18.0.0"),      mask: 0xfffe0000 },
  { base: cidr("198.51.100.0"),    mask: 0xffffff00 },
  { base: cidr("203.0.113.0"),     mask: 0xffffff00 },
  { base: cidr("224.0.0.0"),       mask: 0xe0000000 },
  { base: cidr("240.0.0.0"),       mask: 0xf0000000 },
  { base: cidr("255.255.255.255"), mask: 0xffffffff },
];

function cidr(ip: string): number {
  return ip.split(".").reduce((acc, o) => (acc << 8) | parseInt(o, 10), 0) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const n = cidr(ip);
  return BLOCKED_IPV4_RANGES.some(({ base, mask }) => (n & mask) === (base & mask));
}

// ---------------------------------------------------------------------------
// IPv6 private / reserved detection (including hex-form mapped IPv4)
// ---------------------------------------------------------------------------

/**
 * Attempt to extract the embedded IPv4 address from an IPv4-mapped IPv6
 * address in any representation:
 *   - ::ffff:127.0.0.1   (dotted decimal)
 *   - ::ffff:7f00:1      (hex groups — the form missed by prefix checks)
 *   - 0:0:0:0:0:ffff:7f00:1  (fully expanded hex groups)
 */
function extractMappedIPv4(ip: string): string | null {
  const lower = ip.toLowerCase();

  // Dotted-decimal: ::ffff:a.b.c.d
  const dotted = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted) return dotted[1];

  // Compact hex groups: ::ffff:xhxh:xlxl
  const compactHex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (compactHex) return hexGroupsToIPv4(compactHex[1], compactHex[2]);

  // Fully-expanded: 0:0:0:0:0:ffff:xhxh:xlxl
  const expandedHex = lower.match(/^(?:0+:){5}ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (expandedHex) return hexGroupsToIPv4(expandedHex[1], expandedHex[2]);

  return null;
}

function hexGroupsToIPv4(highHex: string, lowHex: string): string {
  const high = parseInt(highHex, 16);
  const low  = parseInt(lowHex,  16);
  return `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[|\]$/g, "");

  // Loopback / all-zeros
  if (lower === "::1" || lower === "::" || lower === "0:0:0:0:0:0:0:0" ||
      lower === "0:0:0:0:0:0:0:1") return true;

  // IPv4-mapped addresses — covers both dotted and hex-group forms
  const mapped = extractMappedIPv4(lower);
  if (mapped !== null) return isPrivateIPv4(mapped);

  // ULA (fc00::/7)
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;

  // Link-local (fe80::/10)
  if (lower.startsWith("fe8") || lower.startsWith("fe9") ||
      lower.startsWith("fea") || lower.startsWith("feb")) return true;

  // Multicast (ff00::/8)
  if (lower.startsWith("ff")) return true;

  return false;
}

function isPrivateIP(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // unrecognised format → block
}

// ---------------------------------------------------------------------------
// Hostname-level early blocks (before DNS)
// ---------------------------------------------------------------------------

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h === "0.0.0.0") return true;
  if (h.endsWith(".internal") || h.endsWith(".local") || h.endsWith(".localhost")) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Public API: resolve + validate ALL DNS answers
// ---------------------------------------------------------------------------

export interface ResolvedHost {
  hostname: string;
  ip: string;
  family: 4 | 6;
}

/**
 * Resolves ALL DNS answers for `hostname` and throws SsrfError if any result
 * is a private/reserved address. Returns the first public IP so callers can
 * pin the TCP connection to it, eliminating any TOCTOU window.
 */
export async function resolveAndValidate(hostname: string): Promise<ResolvedHost> {
  if (isBlockedHostname(hostname)) {
    throw new SsrfError("Access to internal/private hosts is not allowed");
  }

  // If the caller already supplied a raw IP, validate it directly.
  if (net.isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) throw new SsrfError("Access to internal/private addresses is not allowed");
    return { hostname, ip: hostname, family: 4 };
  }
  const bare = hostname.replace(/^\[|\]$/g, "");
  if (net.isIPv6(bare)) {
    if (isPrivateIPv6(bare)) throw new SsrfError("Access to internal/private addresses is not allowed");
    return { hostname, ip: bare, family: 6 };
  }

  let results: dns.LookupAddress[];
  try {
    results = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new SsrfError(`Unable to resolve hostname: ${hostname}`);
  }

  if (!results || results.length === 0) {
    throw new SsrfError(`No DNS records found for: ${hostname}`);
  }

  // Reject if ANY answer points to a private/reserved range.
  for (const { address } of results) {
    if (isPrivateIP(address)) {
      throw new SsrfError("Access to internal/private addresses is not allowed");
    }
  }

  const first = results[0];
  return { hostname, ip: first.address, family: first.family as 4 | 6 };
}

// ---------------------------------------------------------------------------
// Pinned fetch — uses a custom Agent whose lookup always returns the
// pre-validated IP, so there is no second DNS resolution (no TOCTOU).
// ---------------------------------------------------------------------------

type NodeRequestOptions = http.RequestOptions & https.RequestOptions;

function buildPinnedAgent(isHttps: boolean, ip: string, family: 4 | 6) {
  const lookupFn = (
    _host: string,
    _opts: dns.LookupOptions,
    callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
  ) => callback(null, ip, family);

  return isHttps
    ? new https.Agent({ lookup: lookupFn as any })
    : new http.Agent({ lookup: lookupFn as any });
}

function headersToNodeObj(init: HeadersInit | undefined): Record<string, string> {
  if (!init) return {};
  if (init instanceof Headers) {
    const out: Record<string, string> = {};
    init.forEach((v, k) => { out[k] = v; });
    return out;
  }
  if (Array.isArray(init)) {
    return Object.fromEntries(init.map(([k, v]) => [k, v]));
  }
  return init as Record<string, string>;
}

/**
 * Performs a fetch that is pinned to the pre-validated IP, eliminating the
 * DNS TOCTOU gap. Uses Node's built-in http/https modules — no external
 * dependencies required.
 */
export async function pinnedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const parsed = new URL(url);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new SsrfError("Only HTTP/HTTPS URLs are supported");
  }

  const { ip, family } = await resolveAndValidate(parsed.hostname);
  const isHttps = parsed.protocol === "https:";
  const agent = buildPinnedAgent(isHttps, ip, family);

  const reqHeaders: Record<string, string> = {
    "Host": parsed.host,
    ...headersToNodeObj(options.headers),
  };

  const reqOptions: NodeRequestOptions = {
    hostname: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : (isHttps ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method: (options.method || "GET").toUpperCase(),
    headers: reqHeaders,
    agent,
  };

  const mod = isHttps ? https : http;

  return new Promise<Response>((resolve, reject) => {
    const req = mod.request(reqOptions, (res) => {
      const responseHeaders = new Headers();
      Object.entries(res.headers).forEach(([k, v]) => {
        if (v !== undefined) {
          responseHeaders.set(k, Array.isArray(v) ? v.join(", ") : String(v));
        }
      });

      // For redirect:manual, return immediately without consuming body.
      const status = res.statusCode ?? 0;
      const isRedirect = status >= 300 && status < 400;
      if (options.redirect === "manual" && isRedirect) {
        res.resume(); // discard body
        resolve(new Response(null, { status, statusText: res.statusMessage, headers: responseHeaders }));
        return;
      }

      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks);
        resolve(new Response(body, { status, statusText: res.statusMessage, headers: responseHeaders }));
      });
      res.on("error", reject);
    });

    req.on("error", reject);

    if (options.signal) {
      const sig = options.signal as AbortSignal;
      if (sig.aborted) {
        req.destroy();
      } else {
        sig.addEventListener("abort", () => req.destroy(), { once: true });
      }
    }

    req.end();
  });
}
