import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Radio, RotateCcw, ZoomIn, ZoomOut, Crosshair,
  AlertTriangle, Wifi, Eye, Antenna, MapPin, Layers,
  Satellite, Activity, Shield, Zap, Signal, Radar,
  ChevronDown, ChevronRight,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const CENTER = { lat: 9.6196, lon: -84.6282 };
const METERS_PER_DEG_LAT = 111320;
const METERS_PER_DEG_LON = 111320 * Math.cos(CENTER.lat * Math.PI / 180);
const SCENE_SCALE = 80; // 1 unit = 80 metres

function latLonToScene(lat: number, lon: number, elevM = 0): [number, number, number] {
  const x = ((lon - CENTER.lon) * METERS_PER_DEG_LON) / SCENE_SCALE;
  const z = -((lat - CENTER.lat) * METERS_PER_DEG_LAT) / SCENE_SCALE;
  const y = elevM / SCENE_SCALE;
  return [x, y, z];
}

// Detection layer radii in scene units (1 unit = 80m)
const DET_LAYERS = [
  { label: "Acoustic", range: 500,  color: 0x22ff88, opacity: 0.18 },
  { label: "EO/IR",    range: 1000, color: 0xffaa00, opacity: 0.14 },
  { label: "RF",       range: 3000, color: 0x4488ff, opacity: 0.10 },
  { label: "Radar",    range: 5000, color: 0xff3366, opacity: 0.07 },
];

// Engagement envelopes (centered on El Miro elevated position)
const ENGAGE_LAYERS = [
  { label: "NDB4916 Dazzle (50m)",      range: 50,   color: 0x00aaff, opacity: 0.22 },
  { label: "RF Jam (2km)",              range: 2000, color: 0xffdd00, opacity: 0.10 },
  { label: "DragonFire DEW (1km)",      range: 1000, color: 0xff6600, opacity: 0.14 },
  { label: "30kW DEW Hard-Kill (3.5km)",range: 3500, color: 0xff0033, opacity: 0.07 },
];

// KiwiSDR 5-point TDOA nodes used for triangulation (lat/lon/label)
const TDOA_NODES = [
  { id: "kiwi-sjo",    label: "SJO-KIWI",   lat: 9.9965,  lon: -84.2089, color: 0x00ffcc },
  { id: "kiwi-cr1",    label: "CR1",         lat: 9.748,   lon: -83.752,  color: 0x44ff88 },
  { id: "kiwi-cr2",    label: "CR2",         lat: 10.012,  lon: -84.891,  color: 0x88ff44 },
  { id: "kiwi-pan",    label: "PAN-NW",      lat: 9.391,   lon: -84.054,  color: 0xffcc00 },
  { id: "kiwi-nic",    label: "NIC-S",       lat: 11.023,  lon: -85.870,  color: 0xff8844 },
];

// Monitored frequency chain (from docs + KiwiSDR targets)
const FREQ_CHAIN = [
  { freq: "7.8 Hz",   label: "Schumann resonance",       band: "ELF",    active: true  },
  { freq: "16.5 kHz", label: "VLF NAA/SAQ",              band: "VLF",    active: true  },
  { freq: "433 MHz",  label: "Consumer drone C2 link",   band: "UHF",    active: true  },
  { freq: "978 MHz",  label: "ADS-B UAT",                band: "L-band", active: false },
  { freq: "1090 MHz", label: "ADS-B Mode S (OpenSky)",   band: "L-band", active: true  },
  { freq: "2.4 GHz",  label: "FPV / DJI Occusync",      band: "S-band", active: true  },
  { freq: "5.8 GHz",  label: "FPV Hi-band / 802.11ac",  band: "C-band", active: false },
  { freq: "9.7 GHz",  label: "X-band aviation radar",   band: "X-band", active: true  },
  { freq: "107 MHz",  label: "FM broadcast / covert",   band: "VHF",    active: false },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Target {
  id: string;
  label: string;
  lat: number;
  lon: number;
  elevM: number;
  type: "observer" | "crane" | "radar" | "cell" | "ops";
  color: number;
  desc: string;
}

interface LiveAircraft {
  icao24: string;
  callsign: string | null;
  latitude: number;
  longitude: number;
  baroAltitude: number | null;
  geoAltitude: number | null;
  velocity: number | null;
  trueTrack: number | null;
  verticalRate: number | null;
  originCountry: string;
  squawk: string | null;
}

interface OpenSkyResponse {
  states: LiveAircraft[];
  time: number;
  count: number;
  error?: string;
}

// ─── Fixed targets ────────────────────────────────────────────────────────────

const TARGETS: Target[] = [
  {
    id: "pochote",
    label: "HOTEL POCHOTE GRANDE — ECHO",
    lat: 9.6196, lon: -84.6282, elevM: 5,
    type: "observer", color: 0x00ffcc,
    desc: "Observer current position • Jaco Beach strip",
  },
  {
    id: "crane",
    label: "CRANE-ALPHA — CALLE DANKERS",
    lat: 9.621, lon: -84.6295, elevM: 8,
    type: "crane", color: 0xffaa00,
    desc: "Construction crane between Vista Las Palmas & Apartotel Flamboyant • Suspected surveillance relay",
  },
  {
    id: "elmiro",
    label: "EL MIRO RADAR DOME",
    lat: 9.617, lon: -84.623, elevM: 110,
    type: "radar", color: 0xff3333,
    desc: "Hillside restaurant • Elevated LOS to full valley • Suspected phased-array dome",
  },
  {
    id: "breakwater",
    label: "BREAKWATER 4G TOWER",
    lat: 9.626, lon: -84.641, elevM: 6,
    type: "cell", color: 0xaa44ff,
    desc: "Punta de Jacó headland • 4G/LTE macro cell • Previous Greenwald residence access point",
  },
  {
    id: "hermosa",
    label: "HERMOSA PALMS — OPS BASE",
    lat: 9.6142, lon: -84.6278, elevM: 4,
    type: "ops", color: 0xff6644,
    desc: "Michael G████████ complex • Hermosa Real estate network origin",
  },
];

// ─── Terrain builder ──────────────────────────────────────────────────────────

function buildTerrain(scene: THREE.Scene, elevData: number[][] | null) {
  const GRID = 48;
  const SIZE = 120;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, GRID - 1, GRID - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const gridLat0 = CENTER.lat - 0.04;
  const gridLat1 = CENTER.lat + 0.04;
  const gridLon0 = CENTER.lon - 0.055;
  const gridLon1 = CENTER.lon + 0.055;
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const idx = row * GRID + col;
      const lat = gridLat0 + (row / (GRID - 1)) * (gridLat1 - gridLat0);
      const lon = gridLon0 + (col / (GRID - 1)) * (gridLon1 - gridLon0);
      let elev = 0;
      if (elevData) {
        const r = Math.min(row, elevData.length - 1);
        const c = Math.min(col, (elevData[0]?.length ?? 1) - 1);
        elev = (elevData[r]?.[c] ?? 0);
      } else {
        const distFromCoast = (lon - gridLon0) / (gridLon1 - gridLon0);
        const hillShape = Math.max(0, (distFromCoast - 0.45)) * 2.2;
        const noise =
          Math.sin(lat * 420) * Math.cos(lon * 380) * 8 +
          Math.sin(lat * 210 + 1.2) * Math.cos(lon * 190 + 0.7) * 15 +
          Math.sin(lat * 80) * Math.cos(lon * 90) * 5;
        elev = Math.max(0, hillShape * 180 + noise + 3);
        const dLat = lat - 9.617;
        const dLon = lon - (-84.623);
        const distMiro = Math.sqrt(dLat * dLat + dLon * dLon);
        elev += Math.max(0, 110 * Math.exp(-distMiro * 8000));
      }
      pos.setY(idx, (elev / SCENE_SCALE));
    }
  }
  geo.computeVertexNormals();
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  const mat = new THREE.MeshStandardMaterial({ color: 0x2d5a1b, roughness: 0.9, metalness: 0.05 });
  loader.load("/api/terrain/tile/13/3876/2170", (tex) => {
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    mat.map = tex;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  }, undefined, () => {});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);
  const oceanGeo = new THREE.PlaneGeometry(60, SIZE);
  const oceanMat = new THREE.MeshStandardMaterial({ color: 0x003366, emissive: 0x001133, emissiveIntensity: 0.3, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.82 });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(-70, 0.05, 0);
  scene.add(ocean);
  const grid = new THREE.GridHelper(SIZE, 48, 0x112233, 0x0a1522);
  grid.position.y = 0.15;
  scene.add(grid);
  return mesh;
}

// ─── Detection layers ─────────────────────────────────────────────────────────

function buildDetectionLayers(scene: THREE.Scene, enabled: boolean[]): THREE.Group {
  const group = new THREE.Group();
  const [ox, oy, oz] = latLonToScene(TARGETS[0].lat, TARGETS[0].lon, TARGETS[0].elevM);
  DET_LAYERS.forEach((layer, i) => {
    if (!enabled[i]) return;
    const r = (layer.range / SCENE_SCALE);
    const geo = new THREE.RingGeometry(r - 0.5, r + 0.5, 64);
    const mat = new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: layer.opacity * 2, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ox, oy + 0.3 + i * 0.1, oz);
    (ring as any)._detRing = i;
    group.add(ring);
    // Filled disc (very faint)
    const discGeo = new THREE.CircleGeometry(r, 64);
    const discMat = new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: layer.opacity * 0.4, side: THREE.DoubleSide });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(ox, oy + 0.2 + i * 0.1, oz);
    group.add(disc);
  });
  scene.add(group);
  return group;
}

// Engagement envelopes centred on El Miro (elevated threat position)
function buildEngagementLayers(scene: THREE.Scene, enabled: boolean): THREE.Group {
  const group = new THREE.Group();
  if (!enabled) { scene.add(group); return group; }
  const [ex, ey, ez] = latLonToScene(TARGETS[2].lat, TARGETS[2].lon, TARGETS[2].elevM);
  ENGAGE_LAYERS.forEach((layer, i) => {
    const r = Math.max(0.5, layer.range / SCENE_SCALE);
    const geo = new THREE.RingGeometry(r - 0.4, r + 0.4, 48);
    const mat = new THREE.MeshBasicMaterial({ color: layer.color, transparent: true, opacity: layer.opacity * 2.5, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ex, ey + 0.5 + i * 0.15, ez);
    (ring as any)._engRing = i;
    group.add(ring);
  });
  scene.add(group);
  return group;
}

// TDOA node markers
function buildTDOANodes(scene: THREE.Scene, enabled: boolean): THREE.Group {
  const group = new THREE.Group();
  if (!enabled) { scene.add(group); return group; }
  TDOA_NODES.forEach((node) => {
    // Check if in scene bounds before rendering (far nodes won't appear but that's ok)
    const [nx, , nz] = latLonToScene(node.lat, node.lon, 20);
    const geo = new THREE.OctahedronGeometry(1.2, 0);
    const mat = new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.8, wireframe: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(nx, 2, nz);
    (mesh as any)._tdoaNode = node.id;
    group.add(mesh);
    // Connection line from node to observer
    const [ox, oy, oz] = latLonToScene(TARGETS[0].lat, TARGETS[0].lon, TARGETS[0].elevM + 2);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(nx, 2, nz),
      new THREE.Vector3(ox, oy + 2, oz),
    ]);
    const lineMat = new THREE.LineBasicMaterial({ color: node.color, transparent: true, opacity: 0.12 });
    group.add(new THREE.Line(lineGeo, lineMat));
  });
  scene.add(group);
  return group;
}

// ─── Landmark builder ─────────────────────────────────────────────────────────

function buildLandmark(scene: THREE.Scene, t: Target): THREE.Group {
  const [x, baseY, z] = latLonToScene(t.lat, t.lon, t.elevM);
  const group = new THREE.Group();
  group.position.set(x, baseY, z);
  if (t.type === "observer") {
    const hotelGeo = new THREE.BoxGeometry(3, 4, 2.5);
    const hotelMat = new THREE.MeshStandardMaterial({ color: 0x112233, emissive: 0x00ffcc, emissiveIntensity: 0.15, roughness: 0.4, metalness: 0.5, transparent: true, opacity: 0.9 });
    const hotel = new THREE.Mesh(hotelGeo, hotelMat);
    hotel.position.y = 2;
    hotel.castShadow = true;
    group.add(hotel);
    const edgeGeo = new THREE.EdgesGeometry(hotelGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: t.color, transparent: true, opacity: 0.7 });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.position.y = 2;
    group.add(edges);
    const pulseGeo = new THREE.RingGeometry(3, 3.5, 32);
    const pulseMat = new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    pulse.rotation.x = -Math.PI / 2;
    pulse.position.y = 0.1;
    (pulse as any)._isPulse = true;
    group.add(pulse);
  }
  if (t.type === "crane") {
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xdd8800, metalness: 0.8, roughness: 0.2 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 18, 6), mastMat);
    mast.position.y = 9; mast.castShadow = true; group.add(mast);
    const jibMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.7, roughness: 0.3 });
    const jib = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 0.3), jibMat);
    jib.position.set(4, 18.2, 0); group.add(jib);
    const cjib = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 0.3), jibMat);
    cjib.position.set(-3.5, 18.2, 0); group.add(cjib);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.1 }));
    dome.position.y = 18.8; group.add(dome);
    const warn = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true }));
    warn.position.y = 19.5; (warn as any)._isBeacon = true; group.add(warn);
    for (let i = 0; i < 3; i++) {
      const rf = new THREE.Mesh(new THREE.RingGeometry(2 + i * 5, 2.4 + i * 5, 48), new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
      rf.rotation.x = -Math.PI / 2; rf.position.y = 18 - i * 0.5; (rf as any)._isRF = i; group.add(rf);
    }
  }
  if (t.type === "radar") {
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.8, roughness: 0.2 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 8, 8), mastMat);
    mast.position.y = 4; group.add(mast);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xeeeef5, metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.85 }));
    dome.position.y = 8.2; group.add(dome);
    const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0xccccdd, metalness: 0.4 }));
    domeBase.position.y = 8.0; group.add(domeBase);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.5, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x2244ff, emissiveIntensity: 0.4, side: THREE.DoubleSide }));
    dish.position.y = 8.4; dish.rotation.x = Math.PI / 2; (dish as any)._isRotating = true; group.add(dish);
    for (let i = 0; i < 3; i++) {
      const sweep = new THREE.Mesh(new THREE.RingGeometry(3 + i * 6, 3.4 + i * 6, 48), new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.1, side: THREE.DoubleSide }));
      sweep.rotation.x = -Math.PI / 2; sweep.position.y = 8; (sweep as any)._isRF = i; group.add(sweep);
    }
    const bld = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 3), new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.8 }));
    bld.position.y = 1.25; group.add(bld);
  }
  if (t.type === "cell") {
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.85, roughness: 0.15 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 28, 8), mastMat);
    mast.position.y = 14; mast.castShadow = true; group.add(mast);
    for (let h = 0; h < 3; h++) {
      for (let a = 0; a < 3; a++) {
        const angle = (a / 3) * Math.PI * 2;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0x666677 }));
        arm.position.set(Math.cos(angle) * 1.5, 22 + h * 2, Math.sin(angle) * 1.5); arm.rotation.y = angle; group.add(arm);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0xccccdd, emissive: 0xaa44ff, emissiveIntensity: 0.15 }));
        panel.position.set(Math.cos(angle) * 3.2, 22 + h * 2, Math.sin(angle) * 3.2); group.add(panel);
      }
    }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true }));
    beacon.position.y = 28.5; (beacon as any)._isBeacon = true; group.add(beacon);
    for (let i = 0; i < 3; i++) {
      const rf = new THREE.Mesh(new THREE.RingGeometry(4 + i * 7, 4.5 + i * 7, 48), new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true, opacity: 0.08, side: THREE.DoubleSide }));
      rf.rotation.x = -Math.PI / 2; rf.position.y = 20; (rf as any)._isRF = i; group.add(rf);
    }
  }
  if (t.type === "ops") {
    const bldMat = new THREE.MeshStandardMaterial({ color: 0x1a0a2e, emissive: 0xff6644, emissiveIntensity: 0.08, roughness: 0.5, metalness: 0.4, transparent: true, opacity: 0.85 });
    const bld = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 12), bldMat);
    bld.position.y = 2.5; group.add(bld);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(8, 5, 12)), new THREE.LineBasicMaterial({ color: t.color, transparent: true, opacity: 0.4 }));
    edges.position.y = 2.5; group.add(edges);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    ant.position.set(2, 6.5, 3); group.add(ant);
    for (let i = 0; i < 2; i++) {
      const rf = new THREE.Mesh(new THREE.RingGeometry(2 + i * 4, 2.3 + i * 4, 32), new THREE.MeshBasicMaterial({ color: 0xff6644, transparent: true, opacity: 0.09, side: THREE.DoubleSide }));
      rf.rotation.x = -Math.PI / 2; rf.position.y = 5; (rf as any)._isRF = i; group.add(rf);
    }
  }
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.8 }));
  pin.position.y = -0.3; (pin as any)._isPin = true; group.add(pin);
  (group as any)._target = t;
  scene.add(group);
  return group;
}

// ─── Scout drone (animated) ───────────────────────────────────────────────────

function buildDrone(scene: THREE.Scene): THREE.Group {
  const drone = new THREE.Group();
  drone.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x00ffcc, emissiveIntensity: 0.3 })));
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    arm.position.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6); arm.rotation.y = angle; drone.add(arm);
    const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 8), new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.6 }));
    prop.position.set(Math.cos(angle) * 1.1, 0.12, Math.sin(angle) * 1.1); (prop as any)._isProp = true; drone.add(prop);
    const ledCol = i < 2 ? 0xff0000 : 0x00ff00;
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: ledCol }));
    led.position.set(Math.cos(angle) * 1.1, -0.12, Math.sin(angle) * 1.1); drone.add(led);
  }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.5, 6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
  cone.rotation.x = Math.PI; cone.position.y = -3; (cone as any)._isScanCone = true; drone.add(cone);
  scene.add(drone);
  return drone;
}

// ─── Live aircraft mesh management ───────────────────────────────────────────

function aircraftThreatColor(ac: LiveAircraft): number {
  const alt = ac.baroAltitude ?? ac.geoAltitude ?? 9999;
  const vel = ac.velocity ?? 0;
  if (alt < 500 && vel < 40) return 0xff0033;  // CRITICAL — low, slow
  if (alt < 1500) return 0xff6600;              // HIGH
  if (alt < 5000) return 0xffcc00;              // MEDIUM
  return 0x4488cc;                              // LOW — commercial
}

function aircraftAltToY(altM: number | null): number {
  const alt = altM ?? 1000;
  return Math.min(45, Math.max(8, 8 + (alt / 12000) * 37));
}

function buildAircraftMesh(ac: LiveAircraft): THREE.Group {
  const color = aircraftThreatColor(ac);
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.0, 6), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.3 }));
  body.rotation.x = Math.PI / 2;
  group.add(body);
  const pingGeo = new THREE.RingGeometry(1.0, 1.3, 24);
  const pingMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const ping = new THREE.Mesh(pingGeo, pingMat);
  ping.rotation.x = -Math.PI / 2;
  (ping as any)._isPing = true;
  group.add(ping);
  (group as any)._acData = ac;
  return group;
}

// ─── Scene factory ─────────────────────────────────────────────────────────────

function createScene(
  container: HTMLDivElement,
  elevData: number[][] | null,
  layerToggles: { det: boolean[]; engage: boolean; tdoa: boolean },
  setHoveredTarget: (t: Target | null) => void,
  setDroneTarget: (s: string) => void,
  setStats: (s: { targets: number; elevation: string; aircraft: number }) => void,
) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020a12, 0.003);
  scene.background = new THREE.Color(0x020a12);

  const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 600);
  camera.position.set(50, 55, 70);
  camera.lookAt(0, 5, 0);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  } catch {
    const fb = document.createElement("div");
    fb.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#00ffcc;font-family:monospace;font-size:13px;background:#020a12;";
    fb.innerHTML = `<div style="text-align:center;opacity:.7"><div style="font-size:18px;margin-bottom:8px">◌</div>JACÓ VALLEY 3D MAP<br><span style="font-size:10px;color:#445">WebGL unavailable in this environment<br>Open ciajw.com/jaco in Firefox or Chrome</span></div>`;
    container.appendChild(fb);
    return { destroy: () => fb.remove(), resetView: () => {}, zoomIn: () => {}, zoomOut: () => {}, focusTarget: () => {}, updateAircraft: () => {} };
  }
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x020a12);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x0a1520, 0.5));
  const sun = new THREE.DirectionalLight(0x5588aa, 0.7);
  sun.position.set(-40, 80, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -100; sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100;
  sun.shadow.camera.far = 300;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x224466, 0x112211, 0.4));

  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(1200 * 3);
  for (let i = 0; i < 1200; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 600;
    starPos[i * 3 + 1] = 80 + Math.random() * 120;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 600;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaabbcc, size: 0.3, transparent: true, opacity: 0.6 })));

  buildTerrain(scene, elevData);
  buildDetectionLayers(scene, layerToggles.det);
  buildEngagementLayers(scene, layerToggles.engage);
  buildTDOANodes(scene, layerToggles.tdoa);

  const landmarkGroups = TARGETS.map((t) => buildLandmark(scene, t));
  setStats({ targets: TARGETS.length, elevation: elevData ? "SRTM Live" : "Procedural", aircraft: 0 });

  TARGETS.slice(1).forEach((t) => {
    const [x1, y1, z1] = latLonToScene(TARGETS[0].lat, TARGETS[0].lon, TARGETS[0].elevM + 4);
    const [x2, y2, z2] = latLonToScene(t.lat, t.lon, t.elevM + (t.type === "radar" ? 9 : 5));
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)]);
    scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: t.color, transparent: true, opacity: 0.15 })));
  });

  const drone = buildDrone(scene);
  let droneT = 0;

  const partCount = 600;
  const partGeo = new THREE.BufferGeometry();
  const partPos = new Float32Array(partCount * 3);
  const partSpeeds = new Float32Array(partCount);
  for (let i = 0; i < partCount; i++) {
    partPos[i * 3] = (Math.random() - 0.5) * 180;
    partPos[i * 3 + 1] = Math.random() * 50;
    partPos[i * 3 + 2] = (Math.random() - 0.5) * 180;
    partSpeeds[i] = 0.015 + Math.random() * 0.04;
  }
  partGeo.setAttribute("position", new THREE.BufferAttribute(partPos, 3));
  const partMesh = new THREE.Points(partGeo, new THREE.PointsMaterial({ color: 0x00ffcc, size: 0.12, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(partMesh);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const onMouseMove = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    let found: Target | null = null;
    for (const h of hits) {
      let obj: THREE.Object3D | null = h.object;
      while (obj) {
        if ((obj as any)._target) { found = (obj as any)._target; break; }
        obj = obj.parent;
      }
      if (found) break;
    }
    setHoveredTarget(found);
    container.style.cursor = found ? "pointer" : "grab";
  };
  container.addEventListener("mousemove", onMouseMove);

  let isDown = false, prevX = 0, prevY = 0;
  let camAngle = Math.PI / 4, camElev = 0.65, camDist = 110;
  const camTarget = new THREE.Vector3(0, 8, 0);
  const onDown = (e: MouseEvent) => { isDown = true; prevX = e.clientX; prevY = e.clientY; container.style.cursor = "grabbing"; };
  const onUp = () => { isDown = false; container.style.cursor = "grab"; };
  const onDrag = (e: MouseEvent) => {
    if (!isDown) return;
    camAngle -= (e.clientX - prevX) * 0.005;
    camElev = Math.max(0.08, Math.min(1.35, camElev + (e.clientY - prevY) * 0.005));
    prevX = e.clientX; prevY = e.clientY;
  };
  const onWheel = (e: WheelEvent) => { e.preventDefault(); camDist = Math.max(25, Math.min(250, camDist + e.deltaY * 0.12)); };
  container.addEventListener("mousedown", onDown);
  container.addEventListener("mouseup", onUp);
  container.addEventListener("mouseleave", onUp);
  container.addEventListener("mousemove", onDrag);
  container.addEventListener("wheel", onWheel, { passive: false });

  // Aircraft mesh map
  const acMeshes = new Map<string, THREE.Group>();

  let animId: number;
  const clock = new THREE.Clock();
  const animate = () => {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    camera.position.set(
      camTarget.x + Math.cos(camAngle) * camDist * Math.cos(camElev),
      camTarget.y + Math.sin(camElev) * camDist,
      camTarget.z + Math.sin(camAngle) * camDist * Math.cos(camElev),
    );
    camera.lookAt(camTarget);

    droneT += 0.003;
    const segDur = 4.0;
    const fullCycle = TARGETS.length * segDur;
    const cycleT = (droneT * 10) % fullCycle;
    const seg = Math.floor(cycleT / segDur);
    const segFrac = (cycleT % segDur) / segDur;
    const fromTgt = TARGETS[seg % TARGETS.length];
    const toTgt = TARGETS[(seg + 1) % TARGETS.length];
    setDroneTarget(toTgt.label.split("—")[0].trim());
    const [fx, fy, fz] = latLonToScene(fromTgt.lat, fromTgt.lon, fromTgt.elevM);
    const [tx, ty, tz] = latLonToScene(toTgt.lat, toTgt.lon, toTgt.elevM);
    const ease = segFrac < 0.5 ? 2 * segFrac * segFrac : -1 + (4 - 2 * segFrac) * segFrac;
    drone.position.set(fx + (tx - fx) * ease, Math.max(fy, ty) + 12 + Math.sin(segFrac * Math.PI) * 8, fz + (tz - fz) * ease);
    drone.rotation.y = Math.atan2(tx - fx, tz - fz);

    scene.traverse((obj) => {
      if ((obj as any)._isPulse) {
        const s = 1 + Math.sin(t * 2) * 0.5;
        obj.scale.set(s, 1, s);
        ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(t * 3) * 0.25;
      }
      if ((obj as any)._isBeacon) ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(t * 5) * 0.6;
      if ((obj as any)._isRF !== undefined) {
        const ri = (obj as any)._isRF as number;
        const phase = (t * 0.6 + ri * 0.4) % 1;
        obj.scale.set(1 + phase * 1.8, 1, 1 + phase * 1.8);
        ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.12 * (1 - phase);
      }
      if ((obj as any)._detRing !== undefined) {
        const phase = (t * 0.3 + (obj as any)._detRing * 0.25) % 1;
        ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 1.5 + (obj as any)._detRing) * 0.08;
      }
      if ((obj as any)._engRing !== undefined) ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 2.2 + (obj as any)._engRing * 0.7) * 0.06;
      if ((obj as any)._isRotating) obj.rotation.z = t * 1.2;
      if ((obj as any)._isProp) obj.rotation.y = t * 20;
      if ((obj as any)._isScanCone) ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.04 + Math.sin(t * 3) * 0.04;
      if ((obj as any)._isPing) {
        const s = 1 + (Math.sin(t * 2.5) * 0.5 + 0.5) * 1.5;
        obj.scale.set(s, 1, s);
        ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - (s - 1) / 1.5);
      }
      if ((obj as any)._tdoaNode) {
        obj.rotation.x = t * 0.8;
        obj.rotation.z = t * 0.5;
      }
    });

    const pa = partGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < partCount; i++) {
      pa[i * 3 + 1] += partSpeeds[i];
      if (pa[i * 3 + 1] > 55) { pa[i * 3 + 1] = 0; pa[i * 3] = (Math.random() - 0.5) * 180; pa[i * 3 + 2] = (Math.random() - 0.5) * 180; }
    }
    partGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  };
  animate();

  const onResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener("resize", onResize);

  return {
    destroy: () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mousedown", onDown);
      container.removeEventListener("mouseup", onUp);
      container.removeEventListener("mouseleave", onUp);
      container.removeEventListener("mousemove", onDrag);
      container.removeEventListener("wheel", onWheel);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
    resetView: () => { camAngle = Math.PI / 4; camElev = 0.65; camDist = 110; camTarget.set(0, 8, 0); },
    zoomIn: () => { camDist = Math.max(25, camDist - 18); },
    zoomOut: () => { camDist = Math.min(250, camDist + 18); },
    focusTarget: (idx: number) => {
      const t = TARGETS[idx];
      if (!t) return;
      const [x, , z] = latLonToScene(t.lat, t.lon, 0);
      camTarget.set(x, 8, z); camDist = 45; camElev = 0.45;
    },
    updateAircraft: (aircraft: LiveAircraft[]) => {
      const seen = new Set<string>();
      for (const ac of aircraft) {
        if (!ac.latitude || !ac.longitude) continue;
        seen.add(ac.icao24);
        const [ax, , az] = latLonToScene(ac.latitude, ac.longitude, 0);
        const ay = aircraftAltToY(ac.baroAltitude ?? ac.geoAltitude);
        let mesh = acMeshes.get(ac.icao24);
        if (!mesh) {
          mesh = buildAircraftMesh(ac);
          acMeshes.set(ac.icao24, mesh);
          scene.add(mesh);
        }
        mesh.position.set(ax, ay, az);
        if (ac.trueTrack !== null) mesh.rotation.y = (ac.trueTrack * Math.PI) / 180;
        (mesh as any)._acData = ac;
      }
      // Remove stale
      for (const [id, mesh] of acMeshes.entries()) {
        if (!seen.has(id)) { scene.remove(mesh); acMeshes.delete(id); }
      }
      setStats(prev => ({ ...prev, aircraft: seen.size }));
    },
  };
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const TARGET_COLORS: Record<Target["type"], string> = { observer: "text-cyan-400", crane: "text-amber-400", radar: "text-red-400", cell: "text-purple-400", ops: "text-orange-400" };
const TARGET_BG: Record<Target["type"], string> = { observer: "border-cyan-500/30", crane: "border-amber-500/30", radar: "border-red-500/30", cell: "border-purple-500/30", ops: "border-orange-500/30" };

function threatColorClass(ac: LiveAircraft): string {
  const alt = ac.baroAltitude ?? ac.geoAltitude ?? 9999;
  const vel = ac.velocity ?? 0;
  if (alt < 500 && vel < 40) return "text-red-400";
  if (alt < 1500) return "text-orange-400";
  if (alt < 5000) return "text-amber-400";
  return "text-blue-400";
}
function threatLabel(ac: LiveAircraft): string {
  const alt = ac.baroAltitude ?? ac.geoAltitude ?? 9999;
  const vel = ac.velocity ?? 0;
  if (alt < 500 && vel < 40) return "CRITICAL";
  if (alt < 1500) return "HIGH";
  if (alt < 5000) return "MED";
  return "LOW";
}

// ─── Page component ────────────────────────────────────────────────────────────

export default function JacoMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<Target | null>(null);
  const [droneTarget, setDroneTarget] = useState("");
  const [stats, setStats] = useState({ targets: 0, elevation: "Loading…", aircraft: 0 });
  const [elevData, setElevData] = useState<number[][] | null>(null);
  const [elevStatus, setElevStatus] = useState<"loading" | "ok" | "fallback">("loading");
  const [time, setTime] = useState(new Date());
  const [activeTarget, setActiveTarget] = useState<number | null>(null);

  // Layer toggles: detection, engagement, TDOA
  const [detLayers, setDetLayers] = useState([true, true, true, true]);
  const [engageLayer, setEngageLayer] = useState(true);
  const [tdoaLayer, setTdoaLayer] = useState(true);

  // Panels
  const [showFreqPanel, setShowFreqPanel] = useState(false);
  const [showDreamPanel, setShowDreamPanel] = useState(false);
  const [showAircraftPanel, setShowAircraftPanel] = useState(true);

  // ── Live OpenSky data ─────────────────────────────────────────────────────
  const { data: oskyData, dataUpdatedAt } = useQuery<OpenSkyResponse>({
    queryKey: ["/api/opensky/jaco"],
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  const liveAircraft = oskyData?.states ?? [];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Fetch SRTM elevation ──────────────────────────────────────────────────
  useEffect(() => {
    const GRID = 16;
    const latMin = CENTER.lat - 0.04, latMax = CENTER.lat + 0.04;
    const lonMin = CENTER.lon - 0.055, lonMax = CENTER.lon + 0.055;
    const locs: string[] = [];
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const lat = latMin + (r / (GRID - 1)) * (latMax - latMin);
        const lon = lonMin + (c / (GRID - 1)) * (lonMax - lonMin);
        locs.push(`${lat.toFixed(5)},${lon.toFixed(5)}`);
      }
    }
    fetch(`/api/terrain/elevation?locations=${encodeURIComponent(locs.join("|"))}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.results) {
          const flat = data.results.map((r: any) => r.elevation ?? 0);
          const grid2d: number[][] = [];
          for (let row = 0; row < GRID; row++) grid2d.push(flat.slice(row * GRID, (row + 1) * GRID));
          setElevData(grid2d); setElevStatus("ok");
        } else setElevStatus("fallback");
      })
      .catch(() => setElevStatus("fallback"));
  }, []);

  // ── Init Three.js ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (elevStatus === "loading") return;
    if (!containerRef.current) return;
    const s = createScene(
      containerRef.current,
      elevData,
      { det: detLayers, engage: engageLayer, tdoa: tdoaLayer },
      setHoveredTarget,
      setDroneTarget,
      setStats,
    );
    sceneRef.current = s;
    return () => s.destroy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elevStatus, elevData]);

  // ── Push aircraft to scene ────────────────────────────────────────────────
  useEffect(() => {
    if (liveAircraft.length > 0) sceneRef.current?.updateAircraft(liveAircraft);
  }, [liveAircraft]);

  const handleFocus = useCallback((idx: number) => {
    setActiveTarget(idx);
    sceneRef.current?.focusTarget(idx);
  }, []);

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", { hour12: false }) : "—";

  return (
    <div className="relative w-full h-full bg-[#020a12] overflow-hidden" data-testid="page-jaco-map">
      <div ref={containerRef} className="absolute inset-0 cursor-grab" data-testid="canvas-jaco-3d" />

      {elevStatus === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-[#020a12]">
          <div className="text-center space-y-3">
            <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse mx-auto" />
            <div className="text-xs font-mono text-cyan-400">FETCHING SRTM ELEVATION DATA…</div>
            <div className="text-[10px] font-mono text-gray-600">OpenTopoData • {CENTER.lat.toFixed(4)}°N {Math.abs(CENTER.lon).toFixed(4)}°W</div>
          </div>
        </div>
      )}

      {/* ── Top-left header ── */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none z-10">
        <div className="pointer-events-auto space-y-2">
          <div className="bg-black/80 backdrop-blur-md border border-cyan-500/20 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-400 uppercase tracking-wider">CLASSIFIED — KAPPA SIGINT</span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight" data-testid="text-page-title">
              JACÓ VALLEY — TACTICAL 3D TERRAIN MAP
            </h1>
            <p className="text-xs text-cyan-400/70 font-mono">
              Hotel Pochote Grande • {CENTER.lat.toFixed(4)}°N {Math.abs(CENTER.lon).toFixed(4)}°W • Puntarenas, CR
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className={`text-[9px] px-1.5 py-0 ${elevStatus === "ok" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                {elevStatus === "ok" ? "● SRTM LIVE" : elevStatus === "fallback" ? "△ PROCEDURAL" : "◌ LOADING"}
              </Badge>
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px] px-1.5 py-0">ESRI SAT</Badge>
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px] px-1.5 py-0">DRONE ACTIVE</Badge>
              <Badge className={`text-[9px] px-1.5 py-0 ${liveAircraft.length > 0 ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-gray-500/10 text-gray-500 border-gray-700"}`}>
                ✈ {stats.aircraft} ADS-B
              </Badge>
              <Badge className={`text-[9px] px-1.5 py-0 ${tdoaLayer ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-700"}`}>
                ◈ {TDOA_NODES.length}-PT TDOA
              </Badge>
            </div>
          </div>

          {/* Drone status */}
          <div className="bg-black/70 backdrop-blur-md border border-cyan-500/15 rounded-lg px-3 py-2 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Scout Drone</span>
            </div>
            <div className="text-xs text-white font-mono mt-0.5 truncate">→ {droneTarget || "INITIALIZING…"}</div>
          </div>

          {/* Data sources badge strip */}
          <div className="bg-black/60 backdrop-blur-sm border border-white/8 rounded px-2 py-1.5 flex gap-1.5 flex-wrap max-w-sm">
            <span className="text-[9px] text-gray-600 font-mono uppercase">Sources:</span>
            {[
              { label: "OpenSky ADS-B", ok: true },
              { label: "SRTM DEM", ok: elevStatus === "ok" },
              { label: "KiwiSDR TDOA", ok: tdoaLayer },
              { label: "ESRI Imagery", ok: true },
              { label: "PCAP backup", ok: false },
            ].map(s => (
              <span key={s.label} className={`text-[9px] font-mono px-1 rounded ${s.ok ? "text-green-400 bg-green-500/10" : "text-gray-600 bg-white/5"}`}>
                {s.ok ? "●" : "○"} {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Clock + controls */}
        <div className="pointer-events-auto space-y-2">
          <div className="bg-black/80 backdrop-blur-md border border-cyan-500/20 rounded-lg px-3 py-2 text-right">
            <div className="text-[10px] text-gray-500 font-mono uppercase">Local Time (CST)</div>
            <div className="text-lg font-mono text-cyan-400 tabular-nums" data-testid="text-clock">
              {time.toLocaleTimeString("en-US", { hour12: false })}
            </div>
            <div className="text-[10px] text-gray-500 font-mono">
              {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div className="flex gap-1 justify-end">
            <Button size="icon" variant="outline" className="h-8 w-8 bg-black/70 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10" onClick={() => sceneRef.current?.zoomIn()} data-testid="button-zoom-in"><ZoomIn className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" className="h-8 w-8 bg-black/70 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10" onClick={() => sceneRef.current?.zoomOut()} data-testid="button-zoom-out"><ZoomOut className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" className="h-8 w-8 bg-black/70 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10" onClick={() => sceneRef.current?.resetView()} data-testid="button-reset-view"><RotateCcw className="h-4 w-4" /></Button>
          </div>
          {/* Layer toggles */}
          <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 space-y-1.5">
            <div className="text-[9px] text-gray-600 font-mono uppercase tracking-widest mb-1">Overlay Layers</div>
            {DET_LAYERS.map((l, i) => (
              <button
                key={l.label}
                className={`flex items-center gap-1.5 w-full text-[9px] font-mono px-1 py-0.5 rounded transition-colors ${detLayers[i] ? "text-white" : "text-gray-600"}`}
                onClick={() => setDetLayers(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
                data-testid={`toggle-det-${i}`}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: `#${l.color.toString(16).padStart(6, "0")}`, opacity: detLayers[i] ? 1 : 0.3 }} />
                {l.label} ({l.range >= 1000 ? `${l.range / 1000}km` : `${l.range}m`})
              </button>
            ))}
            <button
              className={`flex items-center gap-1.5 w-full text-[9px] font-mono px-1 py-0.5 rounded transition-colors ${engageLayer ? "text-orange-400" : "text-gray-600"}`}
              onClick={() => setEngageLayer(p => !p)}
              data-testid="toggle-engage"
            >
              <Zap className="h-2 w-2" /> DEW Envelopes
            </button>
            <button
              className={`flex items-center gap-1.5 w-full text-[9px] font-mono px-1 py-0.5 rounded transition-colors ${tdoaLayer ? "text-cyan-400" : "text-gray-600"}`}
              onClick={() => setTdoaLayer(p => !p)}
              data-testid="toggle-tdoa"
            >
              <Signal className="h-2 w-2" /> TDOA Nodes
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom-left: target list ── */}
      <div className="absolute bottom-4 left-4 pointer-events-auto z-10 space-y-2">
        <Card className="bg-black/80 backdrop-blur-md border-cyan-500/20 w-72">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Surveillance Targets</span>
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px]">{stats.targets} NODES</Badge>
            </div>
            {TARGETS.map((t, i) => (
              <button
                key={t.id}
                className={`w-full text-left rounded border px-2 py-1.5 transition-colors ${activeTarget === i ? "bg-white/5" : "hover:bg-white/5"} ${TARGET_BG[t.type]}`}
                onClick={() => handleFocus(i)}
                data-testid={`button-target-${t.id}`}
              >
                <div className="flex items-center gap-1.5">
                  <MapPin className={`h-3 w-3 ${TARGET_COLORS[t.type]}`} />
                  <span className={`text-[11px] font-mono font-bold ${TARGET_COLORS[t.type]}`}>{t.label.split("—")[0].trim()}</span>
                </div>
                <div className="text-[9px] text-gray-500 font-mono ml-4 mt-0.5">{t.lat.toFixed(4)}°N {Math.abs(t.lon).toFixed(4)}°W • +{t.elevM}m</div>
              </button>
            ))}
            <div className="border-t border-cyan-500/10 pt-2 space-y-1">
              <div className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-amber-400" /><span className="text-[10px] text-amber-400 font-mono">CRANE — GRIDTIDE C2 SUSPECTED</span></div>
              <div className="flex items-center gap-1.5"><Radio className="h-3 w-3 text-red-400" /><span className="text-[10px] text-red-400 font-mono">EL MIRO — FULL VALLEY LOS + DEW</span></div>
              <div className="flex items-center gap-1.5"><Wifi className="h-3 w-3 text-purple-400" /><span className="text-[10px] text-purple-400 font-mono">BREAKWATER — 4G/LTE + 9.7GHz</span></div>
            </div>
          </CardContent>
        </Card>

        {/* TDOA node list */}
        {tdoaLayer && (
          <Card className="bg-black/70 backdrop-blur-md border-green-500/15 w-72">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Signal className="h-3 w-3 text-green-400" />
                <span className="text-[10px] font-mono text-green-400 uppercase tracking-wider">5-Point TDOA KiwiSDR Array</span>
              </div>
              <div className="space-y-1">
                {TDOA_NODES.map(n => (
                  <div key={n.id} className="flex items-center justify-between text-[9px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: `#${n.color.toString(16).padStart(6, "0")}` }} />
                      <span className="text-gray-400">{n.label}</span>
                    </div>
                    <span className="text-gray-600">{n.lat.toFixed(3)}°N</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[9px] text-gray-600 font-mono">Triangulation via TDOA phase-difference correlation</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Right column: live aircraft + frequency chain ── */}
      <div className="absolute top-4 right-4 mt-48 pointer-events-auto z-10 space-y-2" style={{ marginTop: "220px" }}>
        {/* Live aircraft panel */}
        <Card className="bg-black/80 backdrop-blur-md border-white/10 w-72">
          <CardContent className="p-3">
            <button
              className="flex items-center justify-between w-full mb-2"
              onClick={() => setShowAircraftPanel(p => !p)}
              data-testid="toggle-aircraft-panel"
            >
              <div className="flex items-center gap-2">
                <Satellite className="h-3 w-3 text-blue-400" />
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">ADS-B Live Track</span>
                <Badge className={`text-[9px] px-1 py-0 ${liveAircraft.length > 0 ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-gray-700 text-gray-500 border-gray-700"}`}>
                  {liveAircraft.length} AC
                </Badge>
              </div>
              {showAircraftPanel ? <ChevronDown className="h-3 w-3 text-gray-500" /> : <ChevronRight className="h-3 w-3 text-gray-500" />}
            </button>
            {showAircraftPanel && (
              <>
                <div className="text-[9px] text-gray-600 font-mono mb-2">
                  OpenSky · Jacó AOR ±25km · Updated {lastUpdate}
                </div>
                {liveAircraft.length === 0 && (
                  <div className="text-[10px] text-gray-600 font-mono text-center py-3">No airborne traffic in AOR</div>
                )}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {liveAircraft.slice(0, 12).map(ac => (
                    <div key={ac.icao24} className={`flex items-start justify-between text-[9px] font-mono border border-white/5 rounded px-1.5 py-1 ${threatColorClass(ac)}`} data-testid={`row-aircraft-${ac.icao24}`}>
                      <div>
                        <div className="font-bold">{ac.callsign || ac.icao24.toUpperCase()}</div>
                        <div className="text-gray-600">{ac.originCountry} · {ac.squawk ? `SQK ${ac.squawk}` : "no sqk"}</div>
                        <div className="text-gray-500">{ac.lat?.toFixed(3) ?? ac.latitude?.toFixed(3)}°N {Math.abs(ac.lon ?? ac.longitude)?.toFixed(3)}°W</div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div>{ac.baroAltitude ? `${Math.round(ac.baroAltitude)}m` : "—"}</div>
                        <div>{ac.velocity ? `${Math.round(ac.velocity)}m/s` : "—"}</div>
                        <Badge className={`text-[8px] px-1 py-0 ${ac.baroAltitude && ac.baroAltitude < 500 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-gray-700 text-gray-400 border-gray-700"}`}>
                          {threatLabel(ac)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {liveAircraft.length > 12 && (
                  <div className="text-[9px] text-gray-600 font-mono text-center mt-1">+{liveAircraft.length - 12} more</div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Frequency chain */}
        <Card className="bg-black/80 backdrop-blur-md border-white/10 w-72">
          <CardContent className="p-3">
            <button
              className="flex items-center justify-between w-full mb-2"
              onClick={() => setShowFreqPanel(p => !p)}
              data-testid="toggle-freq-panel"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Frequency Chain</span>
              </div>
              {showFreqPanel ? <ChevronDown className="h-3 w-3 text-gray-500" /> : <ChevronRight className="h-3 w-3 text-gray-500" />}
            </button>
            {showFreqPanel && (
              <div className="space-y-1">
                {FREQ_CHAIN.map(f => (
                  <div key={f.freq} className={`flex items-center gap-2 text-[9px] font-mono ${f.active ? "text-white" : "text-gray-600"}`}>
                    <span className={`shrink-0 inline-block h-1.5 w-1.5 rounded-full ${f.active ? "bg-green-400" : "bg-gray-700"}`} />
                    <span className={`w-16 shrink-0 ${f.active ? "text-cyan-400" : "text-gray-600"}`}>{f.freq}</span>
                    <span className="text-gray-500 text-[8px] shrink-0">[{f.band}]</span>
                    <span className="truncate">{f.label}</span>
                  </div>
                ))}
                <div className="mt-2 text-[9px] text-gray-600 font-mono border-t border-white/5 pt-1">
                  Green = actively monitored via KiwiSDR / OpenSky
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dream Drone threat panel */}
        <Card className="bg-black/80 backdrop-blur-md border-red-500/20 w-72">
          <CardContent className="p-3">
            <button
              className="flex items-center justify-between w-full mb-2"
              onClick={() => setShowDreamPanel(p => !p)}
              data-testid="toggle-dream-panel"
            >
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">Dream Drone Threat</span>
              </div>
              {showDreamPanel ? <ChevronDown className="h-3 w-3 text-gray-500" /> : <ChevronRight className="h-3 w-3 text-gray-500" />}
            </button>
            {showDreamPanel && (
              <div className="space-y-1.5 text-[9px] font-mono">
                {[
                  ["Platform", "IAI flying wing (LO tailless)"],
                  ["Ceiling", ">50,000 ft — above SHORAD"],
                  ["Loiter", ">18 hours persistent"],
                  ["AI", "Jetson AGX Orin 275 TOPS"],
                  ["DEW", "6kW blue laser (458nm)"],
                  ["SDR", "Python SDR — full spectrum"],
                  ["LOS @ 50kft", ">400 km horizon"],
                  ["RCS", "Planform-aligned — minimized"],
                  ["Jam-immune", "Autonomous edge AI — no GCS"],
                  ["Countermeasure", "Laser DEW only — RF jam ineffective"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-gray-600 shrink-0 w-24">{k}</span>
                    <span className="text-red-300">{v}</span>
                  </div>
                ))}
                <div className="mt-2 border-t border-red-500/20 pt-2 text-[9px] text-red-400">
                  KAPPA Rule #23 — Dream Drone correlation +18 Kappa Score
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Hover tooltip ── */}
      {hoveredTarget && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none" data-testid="panel-target-info">
          <Card className={`bg-black/90 backdrop-blur-md ${TARGET_BG[hoveredTarget.type]} w-72`}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Crosshair className={`h-4 w-4 ${TARGET_COLORS[hoveredTarget.type]}`} />
                <span className={`text-sm font-mono font-bold ${TARGET_COLORS[hoveredTarget.type]}`}>{hoveredTarget.label.split("—")[0].trim()}</span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono leading-relaxed">{hoveredTarget.desc}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] font-mono">
                <span className="text-gray-600">LAT</span><span className="text-gray-300">{hoveredTarget.lat.toFixed(5)}°N</span>
                <span className="text-gray-600">LON</span><span className="text-gray-300">{Math.abs(hoveredTarget.lon).toFixed(5)}°W</span>
                <span className="text-gray-600">ELEV</span><span className="text-gray-300">+{hoveredTarget.elevM}m ASL</span>
                <span className="text-gray-600">TYPE</span><span className={TARGET_COLORS[hoveredTarget.type]}>{hoveredTarget.type.toUpperCase()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded px-3 py-1 text-[10px] text-gray-500 font-mono">
          DRAG to orbit • SCROLL to zoom • Click targets to focus • Hover for intel
        </div>
      </div>
    </div>
  );
}
