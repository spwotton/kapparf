---
name: SSRF guard via Node socket lookup hook
description: Pinning outbound fetches to vetted IPs with node:https `lookup` — two non-obvious bypasses that look "safe" but aren't.
---

When hardening a server-side fetch of an attacker-influenceable URL (e.g. an
image URL returned by an external provider) without `undici` available, the
dependency-free approach is `node:https` `request(url, { lookup })` with a custom
`lookup` hook that resolves all A/AAAA records, rejects if ANY is private, and
returns only vetted addresses. TLS SNI/cert checks still use the original
hostname, so https verification is preserved and the address is pinned (no
second resolution → closes DNS-rebinding/multi-record TOCTOU).

**Two gotchas that silently break it — both discovered by functional testing,
not by reading the code:**

1. **Happy Eyeballs calls the hook with `options.all === true`.** Node 20's
   `autoSelectFamily` defaults on; net invokes the `lookup` hook expecting an
   **array** back. If the hook returns a single `(address, family)` the socket
   gets an undefined address → `Invalid IP address: undefined` on EVERY real
   hostname (the happy path is dead). Fix: branch on `options.all` — return the
   full validated `LookupAddress[]` when true, single address otherwise. The
   `net.LookupFunction` callback type already permits `string | LookupAddress[]`.

2. **IP-literal hosts NEVER invoke the lookup hook.** For `https://127.0.0.1` or
   `https://169.254.169.254` (or `https://[::1]`) Node connects directly and
   skips DNS entirely, so the hook's validation is bypassed. A failed connection
   shows up as `ECONNREFUSED <ip>:443`, which *looks* blocked but is really
   "nothing was listening" — a live internal service would be reached. Fix:
   before connecting, strip `[]` from `u.hostname`, and if `isIP(host) !== 0`
   run the private-address check directly.

3. **The private-address classifier is the real heart of the guard, and a
   partial RFC1918 blocklist is NOT enough.** The dangerous, easy-to-miss bypass
   is **IPv4-mapped IPv6 in hex/canonical form**: Node's WHATWG URL normalizes
   `[::ffff:127.0.0.1]` → `[::ffff:7f00:1]` (and `::ffff:10.0.0.1` → `::ffff:a00:1`).
   A classifier that only special-cases the dotted `::ffff:` form lets the hex
   form fall through as "public." You MUST expand the two trailing hextets back
   to IPv4 (`(hi>>8)&255 . hi&255 . (lo>>8)&255 . lo&255`) and apply the IPv4
   rules. Same for NAT64 `64:ff9b::`. Other must-cover non-global ranges: CGNAT
   `100.64/10`, `0/8`, multicast `224/4`, reserved `240/4`, link-local must be
   the full `fe80::/10` (first hextet 0xfe80–0xfebf, not just the literal "fe80"
   prefix), ULA `fc00::/7`, documentation `2001:db8::/32`. Fail closed on
   malformed. Prefer "allow only globally-routable unicast" over "block a few
   known private ranges."

**Why:** the "blocked ✓ ECONNREFUSED" false positive is the dangerous trap —
an SSRF guard can appear to pass tests while doing nothing. Always assert the
rejection happens with YOUR error message (e.g. "disallowed address") BEFORE any
socket connect, never trust a connection-level failure as proof of blocking.

**How to apply:** any time you add a server fetch of a URL whose host an
external/untrusted party can influence. Test matrix that actually proves it:
real public image (positive), `http://` scheme, IPv4 loopback literal, metadata
IP `169.254.169.254`, IPv6 `[::1]` literal, **`::ffff:7f00:1` and `::ffff:a00:1`
(hex-form mapped — the classic bypass)**, `fe9a::1`/`febf::1` (link-local /10
edges), and a real public non-image host (proves content-type rejection + that
real connections still work). Also assert public addrs incl. `::ffff:8.8.8.8`
are NOT flagged.
