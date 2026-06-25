// Diamanté del Sol — Hale / Fay / Byker corporate network contacts
// Researched from: Florida/Michigan corporate registries, ZoomInfo, BBB,
//   Hobe Sound Community Chest public donor lists, direct website contact pages
//
// Entities:
//   Gregory & Lisa Hale — Benchmark III Corporation (Stuart, FL)
//     ↳ Linked to Daystar Properties via Hobe Sound Community Chest co-donations
//   Scott & Katherine Fay — Daystar Properties LLC / I / III (Hobe Sound, FL)
//     ↳ Active rental managers inside Diamante del Sol; no public email found (phone: 772-545-9477)
//   David G. Byker — Byker & Associates / L.A. Developers / Daystar Properties-CR (Grandville, MI)
//     ↳ Financial co-architect of DayStar CR pipeline; Michigan regulatory sanctions
//
// Hospitality operators managing units inside Diamante del Sol:
//   Kings of Jaco — Unit 502S oceanfront penthouse
//   Jaco VIP — "Diamond Sun" penthouse
//   Micasas / Oceans — luxury rental management, Jaco Walk HQ

export interface DiamNetContact {
  id: number;
  to: string;
  name: string;
  org: string;
  category: string;
}

export const DIAMANTE_NETWORK_CONTACTS: DiamNetContact[] = [
  // ── Hale ──────────────────────────────────────────────────────────────────
  {
    id: 16001,
    to: "ghale@benchmark3.com",
    name: "Gregory Hale",
    org: "Benchmark III Corporation",
    category: "NETWORK-REALESTATE",
  },

  // ── Byker ─────────────────────────────────────────────────────────────────
  {
    id: 16010,
    to: "david@bykerassociates.com",
    name: "David Byker",
    org: "Byker & Associates / L.A. Developers LLC",
    category: "NETWORK-DEVELOPER",
  },
  {
    id: 16011,
    to: "dbyker@bykerassociates.com",
    name: "David Byker",
    org: "Byker & Associates / L.A. Developers LLC",
    category: "NETWORK-DEVELOPER",
  },

  // ── Fay / Daystar FL — no public email found (phone: 772-545-9477) ────────
  // Scott M. Fay — Daystar Properties LLC / I / III, 7900 SE Bridge Road, Hobe Sound FL
  // Katherine Fay — listed rental host on Daystar Properties I LLC inside Diamante del Sol
  // Add email here if/when obtained directly.

  // ── Kings of Jaco — Unit 502S, Diamante del Sol ───────────────────────────
  {
    id: 16020,
    to: "reservations@kingsofjaco.com",
    name: "Reservations",
    org: "Kings of Jaco",
    category: "NETWORK-HOSPITALITY",
  },
  {
    id: 16021,
    to: "info@kingsofjaco.com",
    name: "Info",
    org: "Kings of Jaco",
    category: "NETWORK-HOSPITALITY",
  },

  // ── Jaco VIP — Diamond Sun / Diamante del Sol penthouse ───────────────────
  {
    id: 16030,
    to: "info@jacovip.com",
    name: "Info",
    org: "Jaco VIP",
    category: "NETWORK-HOSPITALITY",
  },

  // ── Micasas / Oceans — luxury rental mgmt, Jaco Walk ─────────────────────
  {
    id: 16040,
    to: "admin@micasas.com",
    name: "Admin",
    org: "Micasas Costa Rica",
    category: "NETWORK-HOSPITALITY",
  },
  {
    id: 16041,
    to: "reservations@micasas.com",
    name: "Reservations",
    org: "Micasas Costa Rica",
    category: "NETWORK-HOSPITALITY",
  },
  {
    id: 16042,
    to: "propertymanagement@micasas.com",
    name: "Property Management",
    org: "Micasas Costa Rica",
    category: "NETWORK-HOSPITALITY",
  },
];
