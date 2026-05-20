// ─── LICENSE PLATE SYSTEM ─────────────────────────────────────────────────────
// Flip this ONE boolean to switch every alias to the real name everywhere.
export const REVEAL_NAMES = false;

export const CAST = {
  DAVE:    { alias: "Dave Mira",           real: "Pablo Mora" },
  GENESIS: { alias: "Lila Quacksworth",    real: "Genesis Peralta" },
  HECTOR:  { alias: "Gerald Stonepath",    real: "Hector Mora" },
  KENNETH: { alias: "Biff Talonforth",     real: "Kenneth Tencio" },
  JEAN:    { alias: "Pierre Baguette",     real: "Jean Picado Solis" },
  ECHO:    { alias: "The Correspondent",   real: "Echo" },
  HOTEL:   { alias: "Hotel Poseidon",      real: "Hotel Poseidon" },
  TOWN:    { alias: "Jacó",                real: "Jacó" },
} as const;

export type PersonaKey = keyof typeof CAST;

export function cast(key: PersonaKey): string {
  return REVEAL_NAMES ? CAST[key].real : CAST[key].alias;
}
