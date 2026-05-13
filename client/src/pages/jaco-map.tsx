import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Radio, RotateCcw, ZoomIn, ZoomOut, Crosshair,
  AlertTriangle, Wifi, MapPin, Layers,
  Satellite, Activity, Shield, Zap, Signal,
  X, Flag, Download, Clock,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CENTER = { lat: 9.6196, lon: -84.6282 };
const METERS_PER_DEG_LAT = 111320;
const METERS_PER_DEG_LON = 111320 * Math.cos(CENTER.lat * Math.PI / 180);
const SCENE_SCALE = 80;

function latLonToScene(lat: number, lon: number, elevM = 0): [number, number, number] {
  const x = ((lon - CENTER.lon) * METERS_PER_DEG_LON) / SCENE_SCALE;
  const z = -((lat - CENTER.lat) * METERS_PER_DEG_LAT) / SCENE_SCALE;
  return [x, elevM / SCENE_SCALE, z];
}

const DET_LAYERS = [
  { label: "Acoustic", range: 500,  color: 0x22ff88, opacity: 0.18 },
  { label: "EO/IR",    range: 1000, color: 0xffaa00, opacity: 0.14 },
  { label: "RF",       range: 3000, color: 0x4488ff, opacity: 0.10 },
  { label: "Radar",    range: 5000, color: 0xff3366, opacity: 0.07 },
];

const ENGAGE_LAYERS = [
  { label: "NDB4916 Dazzle (50m)",       range: 50,   color: 0x00aaff, opacity: 0.22 },
  { label: "RF Jam (2km)",               range: 2000, color: 0xffdd00, opacity: 0.10 },
  { label: "DragonFire DEW (1km)",       range: 1000, color: 0xff6600, opacity: 0.14 },
  { label: "30kW DEW Hard-Kill (3.5km)", range: 3500, color: 0xff0033, opacity: 0.07 },
];

const TDOA_NODES = [
  { id: "kiwi-sjo", label: "SJO-KIWI", lat: 9.9965,  lon: -84.2089, color: 0x00ffcc },
  { id: "kiwi-cr1", label: "CR1",       lat: 9.748,   lon: -83.752,  color: 0x44ff88 },
  { id: "kiwi-cr2", label: "CR2",       lat: 10.012,  lon: -84.891,  color: 0x88ff44 },
  { id: "kiwi-pan", label: "PAN-NW",    lat: 9.391,   lon: -84.054,  color: 0xffcc00 },
  { id: "kiwi-nic", label: "NIC-S",     lat: 11.023,  lon: -85.870,  color: 0xff8844 },
];

const FREQ_CHAIN = [
  { freq: "7.8 Hz",   label: "Schumann resonance",     band: "ELF",    active: true  },
  { freq: "16.5 kHz", label: "VLF NAA/SAQ",            band: "VLF",    active: true  },
  { freq: "433 MHz",  label: "Consumer drone C2",      band: "UHF",    active: true  },
  { freq: "978 MHz",  label: "ADS-B UAT",              band: "L-band", active: false },
  { freq: "1090 MHz", label: "ADS-B Mode S (OpenSky)", band: "L-band", active: true  },
  { freq: "2.4 GHz",  label: "FPV / DJI Occusync",    band: "S-band", active: true  },
  { freq: "5.8 GHz",  label: "FPV Hi-band / 802.11ac",band: "C-band", active: false },
  { freq: "9.7 GHz",  label: "X-band aviation radar",  band: "X-band", active: true  },
  { freq: "107 MHz",  label: "FM / covert comms",      band: "VHF",    active: false },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Target {
  id: string; label: string; lat: number; lon: number; elevM: number;
  type: "observer" | "crane" | "radar" | "cell" | "ops"; color: number; desc: string;
}

interface LiveAircraft {
  icao24: string; callsign: string | null; latitude: number; longitude: number;
  baroAltitude: number | null; geoAltitude: number | null; velocity: number | null;
  trueTrack: number | null; verticalRate: number | null; originCountry: string; squawk: string | null;
}

interface OpenSkyResponse { states: LiveAircraft[]; time: number; count: number; error?: string; }

// ─── Aircraft event types ─────────────────────────────────────────────────────

type AcEventType = "ENTRY" | "PROXIMITY" | "ALT_DROP" | "ALT_GAIN" | "HOVER" | "LOITER" | "EXIT" | "FLAGGED";

interface AircraftEvent {
  id: string;
  ts: number;
  icao24: string;
  callsign: string | null;
  type: AcEventType;
  lat: number;
  lon: number;
  altM: number | null;
  velocityMs: number | null;
  distKm: number;
  note: string;
  manual?: boolean;
}

interface AcHistEntry {
  firstSeen: number;
  lastSeen: number;
  pollCount: number;
  lastAlt: number | null;
  lastLat: number;
  lastLon: number;
  loiterLogged: number; // last ts a loiter event was logged
  flagged: boolean;
}

// ─── Haversine ────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const AC_EVENT_STYLE: Record<AcEventType, { cls: string; label: string }> = {
  ENTRY:     { cls: "text-cyan-400 border-cyan-500/30",    label: "ENTRY"    },
  PROXIMITY: { cls: "text-red-400 border-red-500/40",      label: "PROXIMITY"},
  ALT_DROP:  { cls: "text-orange-400 border-orange-500/30",label: "ALT DROP" },
  ALT_GAIN:  { cls: "text-amber-400 border-amber-500/20",  label: "ALT GAIN" },
  HOVER:     { cls: "text-red-400 border-red-500/40",      label: "HOVER"    },
  LOITER:    { cls: "text-orange-400 border-orange-500/30",label: "LOITER"   },
  EXIT:      { cls: "text-gray-500 border-gray-700",       label: "EXIT"     },
  FLAGGED:   { cls: "text-purple-400 border-purple-500/40",label: "FLAGGED"  },
};

// ─── Fixed targets ────────────────────────────────────────────────────────────

const TARGETS: Target[] = [
  { id: "pochote",    label: "HOTEL POCHOTE GRANDE — ECHO",   lat: 9.6196, lon: -84.6282, elevM: 5,   type: "observer", color: 0x00ffcc, desc: "Observer current position • Jaco Beach strip" },
  { id: "crane",      label: "CRANE-ALPHA — CALLE DANKERS",   lat: 9.621,  lon: -84.6295, elevM: 8,   type: "crane",    color: 0xffaa00, desc: "Construction crane • Suspected surveillance relay" },
  { id: "elmiro",     label: "EL MIRO RADAR DOME",            lat: 9.617,  lon: -84.623,  elevM: 110, type: "radar",    color: 0xff3333, desc: "Hillside • Full valley LOS • Suspected phased-array" },
  { id: "breakwater", label: "BREAKWATER 4G TOWER",           lat: 9.626,  lon: -84.641,  elevM: 6,   type: "cell",     color: 0xaa44ff, desc: "Punta de Jacó headland • 4G/LTE • 9.7GHz" },
  { id: "hermosa",    label: "HERMOSA PALMS — OPS BASE",      lat: 9.6142, lon: -84.6278, elevM: 4,   type: "ops",      color: 0xff6644, desc: "Michael G████████ complex • Hermosa Real estate origin" },
];

// ─── Threat helpers ───────────────────────────────────────────────────────────

function acThreat(ac: LiveAircraft) {
  const alt = ac.baroAltitude ?? ac.geoAltitude ?? 9999;
  const vel = ac.velocity ?? 0;
  if (alt < 500 && vel < 40) return { level: "CRITICAL", hex: 0xff0033, cls: "text-red-400",    bgCls: "bg-red-500/20 border-red-500/40" };
  if (alt < 1500)             return { level: "HIGH",     hex: 0xff6600, cls: "text-orange-400", bgCls: "bg-orange-500/15 border-orange-500/30" };
  if (alt < 5000)             return { level: "MED",      hex: 0xffcc00, cls: "text-amber-400",  bgCls: "bg-amber-500/10 border-amber-500/20" };
  return                             { level: "LOW",      hex: 0x4488cc, cls: "text-blue-400",   bgCls: "bg-blue-500/10 border-blue-500/20" };
}

function acY(altM: number | null) { return Math.min(45, Math.max(8, 8 + ((altM ?? 1000) / 12000) * 37)); }

// ─── Three.js scene helpers ───────────────────────────────────────────────────

function buildTerrain(scene: THREE.Scene, elevData: number[][] | null) {
  const GRID = 48, SIZE = 120;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, GRID - 1, GRID - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const gLat0 = CENTER.lat - 0.04, gLat1 = CENTER.lat + 0.04;
  const gLon0 = CENTER.lon - 0.055, gLon1 = CENTER.lon + 0.055;
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const idx = row * GRID + col;
      const lat = gLat0 + (row / (GRID - 1)) * (gLat1 - gLat0);
      const lon = gLon0 + (col / (GRID - 1)) * (gLon1 - gLon0);
      let elev = 0;
      if (elevData) {
        elev = elevData[Math.min(row, elevData.length - 1)]?.[Math.min(col, (elevData[0]?.length ?? 1) - 1)] ?? 0;
      } else {
        const d = (lon - gLon0) / (gLon1 - gLon0);
        const hill = Math.max(0, (d - 0.45)) * 2.2;
        const n = Math.sin(lat * 420) * Math.cos(lon * 380) * 8 + Math.sin(lat * 210 + 1.2) * Math.cos(lon * 190 + 0.7) * 15;
        elev = Math.max(0, hill * 180 + n + 3);
        const dL = lat - 9.617, dN = lon - (-84.623);
        elev += Math.max(0, 110 * Math.exp(-(dL * dL + dN * dN) * 8000));
      }
      pos.setY(idx, elev / SCENE_SCALE);
    }
  }
  geo.computeVertexNormals();

  // ── QUANTUM TERRAIN SHADER ──────────────────────────────────────────────────
  // Wave-function interference scan lines + PBR-approximated lighting + κ-phase
  // Derived from renderer_1774207206398.txt — SuperpositionShader / WaveFunctionShader
  const terrainVS = /* glsl */`
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vElevation;
    uniform float uTime;

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){
      vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
    }

    void main(){
      vUv=uv; vNormal=normalMatrix*normal;
      vec3 pos=position;
      // Micro-detail via multi-octave noise (κ=1.273 amplitude scale)
      float detail=(noise(pos.xz*6.0)*1.0+noise(pos.xz*13.0)*0.5+noise(pos.xz*27.0)*0.25)*0.35;
      pos.y+=detail*smoothstep(0.0,1.8,pos.y)*1.273;
      vElevation=pos.y;
      vec4 wp=modelMatrix*vec4(pos,1.0);
      vWorldPos=wp.xyz;
      gl_Position=projectionMatrix*viewMatrix*wp;
    }
  `;
  const terrainFS = /* glsl */`
    precision highp float;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vElevation;
    uniform float uTime;
    uniform sampler2D uSatTex;
    uniform float uHasTex;

    // κ wave-function interference — born rule probability density
    float kappaPhase(vec2 p, float t){
      const float KAPPA=1.273;
      float w1=sin(p.x*KAPPA*4.0-t*0.28)*cos(p.y*KAPPA*3.0+t*0.19);
      float w2=cos(p.x*2.31+p.y*3.14*KAPPA-t*0.11);
      // Born rule |ψ|² probability density
      float psi=w1*0.6+w2*0.4;
      return psi*psi; // always positive, like probability
    }

    // Wigner quasi-probability (from WaveFunctionShader)
    float wigner(vec2 ps){ float q=ps.x,p=ps.y; return exp(-q*q-p*p)/3.14159; }

    void main(){
      // Elevation-based terrain palette (jungle valley + ridge)
      float e=clamp(vElevation/2.0,0.0,1.0);
      vec3 beach=vec3(0.76,0.70,0.55);
      vec3 lowland=vec3(0.10,0.26,0.09);
      vec3 midland=vec3(0.13,0.20,0.07);
      vec3 ridge=vec3(0.18,0.16,0.10);
      vec3 rock=vec3(0.28,0.24,0.18);
      vec3 terrainCol=mix(beach,mix(lowland,mix(midland,mix(ridge,rock,
        smoothstep(0.75,1.0,e)),smoothstep(0.45,0.75,e)),
        smoothstep(0.12,0.45,e)),smoothstep(0.0,0.12,e));

      // Satellite texture blend
      vec3 base=terrainCol;
      if(uHasTex>0.5){
        vec4 sat=texture2D(uSatTex,vUv);
        float blend=smoothstep(0.0,0.1,e)*0.78; // fade to pure terrain at beach
        base=mix(terrainCol,sat.rgb*1.08,blend);
      }

      // κ-phase quantum scan line — very subtle teal shimmer at low elevation
      float kp=kappaPhase(vWorldPos.xz*0.08,uTime);
      vec3 kappaGlow=vec3(0.0,0.85,0.7)*kp*0.04*(1.0-e*0.9);

      // Wigner probability glow along ridges (interference fringe)
      float wig=wigner(vWorldPos.xz*0.04)*0.06*e;
      vec3 wigGlow=vec3(0.1,0.4,0.8)*wig;

      // PBR-approximated lighting
      vec3 sunDir=normalize(vec3(-0.35,0.85,-0.25));
      vec3 n=normalize(vNormal);
      float diffuse=max(dot(n,sunDir),0.0);
      // Ambient occlusion approximation via elevation gradient
      float ao=0.65+0.35*smoothstep(0.0,0.6,vElevation);
      // Specular highlight (Blinn-Phong)
      vec3 viewDir=normalize(vec3(0.4,0.75,0.5));
      vec3 half_=normalize(sunDir+viewDir);
      float spec=pow(max(dot(n,half_),0.0),18.0)*0.12*(1.0-e*0.5);

      vec3 lit=base*(0.32+diffuse*0.68)*ao+vec3(spec)+kappaGlow+wigGlow;

      // Subtle CRT scan line at horizon — KAPPA HF monitoring aesthetic
      float scan=sin(vWorldPos.x*3.5+uTime*0.4)*sin(vWorldPos.z*3.5-uTime*0.28);
      float scanMask=smoothstep(0.9,1.0,abs(scan))*0.018*(1.0-e);
      lit+=vec3(0.0,1.0,0.78)*scanMask;

      gl_FragColor=vec4(clamp(lit,0.0,1.0),1.0);
    }
  `;

  const terrainUniforms = { uTime:{value:0.0}, uSatTex:{value:null as THREE.Texture|null}, uHasTex:{value:0.0} };
  const mat = new THREE.ShaderMaterial({ vertexShader:terrainVS, fragmentShader:terrainFS, uniforms:terrainUniforms });
  (mat as any)._isTerrainShader = true;
  new THREE.TextureLoader().load("/api/terrain/tile/13/3876/2170", (tex) => {
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
    terrainUniforms.uSatTex.value=tex; terrainUniforms.uHasTex.value=1.0;
  }, undefined, () => {});
  scene.add(new THREE.Mesh(geo, mat));

  // ── QUANTUM OCEAN ────────────────────────────────────────────────────────────
  // Animated wave-interference caustics from TunnelingShader approach
  const oceanVS = /* glsl */`
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main(){
      vUv=uv;
      vec3 pos=position;
      // Wave superposition: 3 travelling waves at κ-harmonic angles
      float w1=sin(pos.x*0.18+uTime*1.1)*0.4;
      float w2=sin(pos.z*0.22-uTime*0.9)*0.35;
      float w3=sin((pos.x+pos.z)*0.14+uTime*0.7)*0.25;
      pos.y+=w1+w2+w3;
      vec4 wp=modelMatrix*vec4(pos,1.0);
      vWorldPos=wp.xyz;
      gl_Position=projectionMatrix*viewMatrix*wp;
    }
  `;
  const oceanFS = /* glsl */`
    precision highp float;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main(){
      // Deep Pacific Pacific coast water
      vec3 deep=vec3(0.01,0.07,0.18);
      vec3 shallow=vec3(0.02,0.14,0.28);
      vec3 foam=vec3(0.3,0.55,0.65);

      // Caustic interference pattern (TunnelingShader transmission coefficient idea)
      float c1=sin(vWorldPos.x*0.6+uTime*1.4)*sin(vWorldPos.z*0.7-uTime*1.1);
      float c2=sin((vWorldPos.x-vWorldPos.z)*0.5+uTime*0.9);
      float caustic=pow(max(c1*c2,0.0),2.5)*0.35;

      // Born-rule foam crests — probability density on wave peaks
      float peak=smoothstep(0.6,1.0,sin(vWorldPos.x*0.18+uTime*1.1)*0.5+0.5)*0.2;

      vec3 col=mix(deep,shallow,caustic+peak*0.5);
      col+=foam*(caustic*0.5+peak);

      // Specular sun glint
      vec3 n=normalize(vec3(sin(uTime*0.8)*0.1,1.0,cos(uTime*0.6)*0.1));
      vec3 sunDir=normalize(vec3(-0.35,0.85,-0.25));
      vec3 vd=normalize(vec3(0.4,0.75,0.5));
      float spec=pow(max(dot(normalize(n),normalize(sunDir+vd)),0.0),32.0)*0.5;
      col+=vec3(0.5,0.7,0.85)*spec;

      gl_FragColor=vec4(col,0.88);
    }
  `;
  const oceanUniforms = { uTime:{value:0.0} };
  const oceanMat = new THREE.ShaderMaterial({ vertexShader:oceanVS, fragmentShader:oceanFS, uniforms:oceanUniforms, transparent:true, side:THREE.DoubleSide });
  (oceanMat as any)._isOceanShader = true;
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(70, SIZE, 32, 32), oceanMat);
  ocean.rotation.x = -Math.PI / 2; ocean.position.set(-73, 0.0, 0); scene.add(ocean);

  // Subtle grid — very faint tactical overlay
  scene.add(new THREE.GridHelper(SIZE, 48, 0x0d1f2d, 0x081520));
}

function buildRing(scene: THREE.Scene, group: THREE.Group, cx: number, cy: number, cz: number, range: number, color: number, opacity: number, yOff = 0) {
  const r = Math.max(0.5, range / SCENE_SCALE);
  const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.5, r + 0.5, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacity * 2, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(cx, cy + yOff, cz); group.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacity * 0.3, side: THREE.DoubleSide }));
  disc.rotation.x = -Math.PI / 2; disc.position.set(cx, cy + yOff - 0.05, cz); group.add(disc);
}

function buildDetLayers(scene: THREE.Scene): THREE.Group {
  const g = new THREE.Group(); const [ox, oy, oz] = latLonToScene(TARGETS[0].lat, TARGETS[0].lon, TARGETS[0].elevM);
  DET_LAYERS.forEach((l, i) => { buildRing(scene, g, ox, oy, oz, l.range, l.color, l.opacity, i * 0.12); (g.children[i * 2] as any)._detRing = i; });
  scene.add(g); return g;
}

function buildEngageLayers(scene: THREE.Scene): THREE.Group {
  const g = new THREE.Group(); const [ex, ey, ez] = latLonToScene(TARGETS[2].lat, TARGETS[2].lon, TARGETS[2].elevM);
  ENGAGE_LAYERS.forEach((l, i) => { buildRing(scene, g, ex, ey, ez, l.range, l.color, l.opacity, 0.5 + i * 0.15); (g.children[i * 2] as any)._engRing = i; });
  scene.add(g); return g;
}

function buildTDOALayer(scene: THREE.Scene): THREE.Group {
  const g = new THREE.Group();
  const [ox, oy, oz] = latLonToScene(TARGETS[0].lat, TARGETS[0].lon, TARGETS[0].elevM + 2);
  TDOA_NODES.forEach((n) => {
    const [nx, , nz] = latLonToScene(n.lat, n.lon, 20);
    const oct = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), new THREE.MeshBasicMaterial({ color: n.color, transparent: true, opacity: 0.8, wireframe: true }));
    oct.position.set(nx, 2, nz); (oct as any)._tdoaNode = n.id; g.add(oct);
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(nx, 2, nz), new THREE.Vector3(ox, oy + 2, oz)]);
    g.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: n.color, transparent: true, opacity: 0.12 })));
  });
  scene.add(g); return g;
}

function buildLandmark(scene: THREE.Scene, t: Target): THREE.Group {
  const [x, bY, z] = latLonToScene(t.lat, t.lon, t.elevM);
  const group = new THREE.Group(); group.position.set(x, bY, z);
  if (t.type === "observer") {
    const bGeo = new THREE.BoxGeometry(3, 4, 2.5);
    const bMat = new THREE.MeshStandardMaterial({ color: 0x112233, emissive: 0x00ffcc, emissiveIntensity: 0.15, transparent: true, opacity: 0.9 });
    const bld = new THREE.Mesh(bGeo, bMat); bld.position.y = 2; group.add(bld);
    group.add(Object.assign(new THREE.LineSegments(new THREE.EdgesGeometry(bGeo), new THREE.LineBasicMaterial({ color: t.color, transparent: true, opacity: 0.7 })), { position: new THREE.Vector3(0, 2, 0) }));
    const pulse = new THREE.Mesh(new THREE.RingGeometry(3, 3.5, 32), new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    pulse.rotation.x = -Math.PI / 2; pulse.position.y = 0.1; (pulse as any)._isPulse = true; group.add(pulse);
  }
  if (t.type === "crane") {
    const yM = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.7, roughness: 0.3 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 18, 6), new THREE.MeshStandardMaterial({ color: 0xdd8800, metalness: 0.8 }));
    mast.position.y = 9; group.add(mast);
    const jib = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 0.3), yM); jib.position.set(4, 18.2, 0); group.add(jib);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.6, metalness: 0.9 }));
    dome.position.y = 18.8; group.add(dome);
    const warn = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true }));
    warn.position.y = 19.5; (warn as any)._isBeacon = true; group.add(warn);
    for (let i = 0; i < 3; i++) {
      const rf = new THREE.Mesh(new THREE.RingGeometry(2 + i * 5, 2.4 + i * 5, 48), new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.1, side: THREE.DoubleSide }));
      rf.rotation.x = -Math.PI / 2; rf.position.y = 18; (rf as any)._isRF = i; group.add(rf);
    }
  }
  if (t.type === "radar") {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 8, 8), new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.8 }));
    mast.position.y = 4; group.add(mast);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xeeeef5, transparent: true, opacity: 0.85 }));
    dome.position.y = 8.2; group.add(dome);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.5, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x2244ff, emissiveIntensity: 0.4, side: THREE.DoubleSide }));
    dish.position.y = 8.4; dish.rotation.x = Math.PI / 2; (dish as any)._isRotating = true; group.add(dish);
    for (let i = 0; i < 3; i++) {
      const sw = new THREE.Mesh(new THREE.RingGeometry(3 + i * 6, 3.4 + i * 6, 48), new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.08, side: THREE.DoubleSide }));
      sw.rotation.x = -Math.PI / 2; sw.position.y = 8; (sw as any)._isRF = i; group.add(sw);
    }
    const bld = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 3), new THREE.MeshStandardMaterial({ color: 0x332211 }));
    bld.position.y = 1.25; group.add(bld);
  }
  if (t.type === "cell") {
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.85 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 28, 8), mastMat);
    mast.position.y = 14; group.add(mast);
    for (let h = 0; h < 3; h++) for (let a = 0; a < 3; a++) {
      const ang = (a / 3) * Math.PI * 2;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0xccccdd, emissive: 0xaa44ff, emissiveIntensity: 0.15 }));
      panel.position.set(Math.cos(ang) * 3.2, 22 + h * 2, Math.sin(ang) * 3.2); group.add(panel);
    }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true }));
    beacon.position.y = 28.5; (beacon as any)._isBeacon = true; group.add(beacon);
    for (let i = 0; i < 3; i++) {
      const rf = new THREE.Mesh(new THREE.RingGeometry(4 + i * 7, 4.5 + i * 7, 48), new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true, opacity: 0.07, side: THREE.DoubleSide }));
      rf.rotation.x = -Math.PI / 2; rf.position.y = 20; (rf as any)._isRF = i; group.add(rf);
    }
  }
  if (t.type === "ops") {
    const bld = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 12), new THREE.MeshStandardMaterial({ color: 0x1a0a2e, emissive: 0xff6644, emissiveIntensity: 0.08, transparent: true, opacity: 0.85 }));
    bld.position.y = 2.5; group.add(bld);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(8, 5, 12)), new THREE.LineBasicMaterial({ color: t.color, transparent: true, opacity: 0.4 }));
    edges.position.y = 2.5; group.add(edges);
  }
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.8 }));
  pin.position.y = -0.3; group.add(pin);
  (group as any)._target = t; scene.add(group); return group;
}

function buildDrone(scene: THREE.Scene): THREE.Group {
  const drone = new THREE.Group();
  drone.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x00ffcc, emissiveIntensity: 0.3 })));
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    arm.position.set(Math.cos(ang) * 0.6, 0, Math.sin(ang) * 0.6); arm.rotation.y = ang; drone.add(arm);
    const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 8), new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.6 }));
    prop.position.set(Math.cos(ang) * 1.1, 0.12, Math.sin(ang) * 1.1); (prop as any)._isProp = true; drone.add(prop);
  }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.5, 6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
  cone.rotation.x = Math.PI; cone.position.y = -3; (cone as any)._isScanCone = true; drone.add(cone);
  scene.add(drone); return drone;
}

function buildAircraftMesh(ac: LiveAircraft): THREE.Group {
  const color = acThreat(ac).hex;
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.0, 6), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, metalness: 0.7 }));
  body.rotation.x = Math.PI / 2; group.add(body);
  const ping = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.3, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
  ping.rotation.x = -Math.PI / 2; (ping as any)._isPing = true; group.add(ping);
  (group as any)._acData = ac; return group;
}

function createScene(
  container: HTMLDivElement,
  elevData: number[][] | null,
  setHoveredTarget: (t: Target | null) => void,
  setDroneTarget: (s: string) => void,
  setAircraftCount: (n: number) => void,
) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020a12, 0.003);
  scene.background = new THREE.Color(0x020a12);
  const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 600);
  camera.position.set(50, 55, 70); camera.lookAt(0, 5, 0);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  } catch {
    const fb = document.createElement("div");
    fb.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#00ffcc;font-family:monospace;font-size:13px;background:#020a12;";
    fb.innerHTML = `<div style="text-align:center;opacity:.7"><div style="font-size:22px;margin-bottom:10px">◌</div>JACÓ VALLEY 3D MAP<br><span style="font-size:10px;color:#445;line-height:2">WebGL unavailable in this preview<br>Open ciajw.com/jaco in Chrome/Firefox</span></div>`;
    container.appendChild(fb);
    return { destroy: () => fb.remove(), resetView: () => {}, zoomIn: () => {}, zoomOut: () => {}, focusTarget: () => {}, updateAircraft: () => {} };
  }
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x0a1520, 0.5));
  const sun = new THREE.DirectionalLight(0x5588aa, 0.7);
  sun.position.set(-40, 80, -20); sun.castShadow = true; scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x224466, 0x112211, 0.4));

  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(1200 * 3);
  for (let i = 0; i < 1200; i++) { starPos[i*3]=(Math.random()-.5)*600; starPos[i*3+1]=80+Math.random()*120; starPos[i*3+2]=(Math.random()-.5)*600; }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaabbcc, size: 0.3, transparent: true, opacity: 0.6 })));

  buildTerrain(scene, elevData);
  buildDetLayers(scene);
  buildEngageLayers(scene);
  buildTDOALayer(scene);
  TARGETS.forEach(t => buildLandmark(scene, t));

  TARGETS.slice(1).forEach(t => {
    const [x1,y1,z1] = latLonToScene(TARGETS[0].lat, TARGETS[0].lon, TARGETS[0].elevM+4);
    const [x2,y2,z2] = latLonToScene(t.lat, t.lon, t.elevM+5);
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1,y1,z1),new THREE.Vector3(x2,y2,z2)]);
    scene.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: t.color, transparent: true, opacity: 0.15 })));
  });

  const drone = buildDrone(scene);
  const partCount = 600;
  const partGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(partCount*3), pSpd = new Float32Array(partCount);
  for (let i=0;i<partCount;i++){pPos[i*3]=(Math.random()-.5)*180;pPos[i*3+1]=Math.random()*50;pPos[i*3+2]=(Math.random()-.5)*180;pSpd[i]=.015+Math.random()*.04;}
  partGeo.setAttribute("position",new THREE.BufferAttribute(pPos,3));
  scene.add(new THREE.Points(partGeo,new THREE.PointsMaterial({color:0x00ffcc,size:0.12,transparent:true,opacity:0.3,blending:THREE.AdditiveBlending,depthWrite:false})));

  const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
  const onMM = (e: MouseEvent) => {
    const r = container.getBoundingClientRect();
    mouse.x=((e.clientX-r.left)/r.width)*2-1; mouse.y=-((e.clientY-r.top)/r.height)*2+1;
    raycaster.setFromCamera(mouse,camera);
    let found: Target|null=null;
    for (const h of raycaster.intersectObjects(scene.children,true)) {
      let obj:THREE.Object3D|null=h.object;
      while(obj){if((obj as any)._target){found=(obj as any)._target;break;}obj=obj.parent;}
      if(found)break;
    }
    setHoveredTarget(found); container.style.cursor=found?"pointer":"grab";
  };
  container.addEventListener("mousemove",onMM);

  let isDown=false,prevX=0,prevY=0,camAngle=Math.PI/4,camElev=0.65,camDist=110;
  const camTarget=new THREE.Vector3(0,8,0);
  const onDown=(e:MouseEvent)=>{isDown=true;prevX=e.clientX;prevY=e.clientY;container.style.cursor="grabbing";};
  const onUp=()=>{isDown=false;container.style.cursor="grab";};
  const onDrag=(e:MouseEvent)=>{if(!isDown)return;camAngle-=(e.clientX-prevX)*.005;camElev=Math.max(.08,Math.min(1.35,camElev+(e.clientY-prevY)*.005));prevX=e.clientX;prevY=e.clientY;};
  const onWheel=(e:WheelEvent)=>{e.preventDefault();camDist=Math.max(25,Math.min(250,camDist+e.deltaY*.12));};
  container.addEventListener("mousedown",onDown); container.addEventListener("mouseup",onUp);
  container.addEventListener("mouseleave",onUp); container.addEventListener("mousemove",onDrag);
  container.addEventListener("wheel",onWheel,{passive:false});

  // Touch support
  let lastTouchDist = 0;
  const onTouchStart=(e:TouchEvent)=>{if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;lastTouchDist=Math.sqrt(dx*dx+dy*dy);}else if(e.touches.length===1){isDown=true;prevX=e.touches[0].clientX;prevY=e.touches[0].clientY;}};
  const onTouchMove=(e:TouchEvent)=>{e.preventDefault();if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;const dist=Math.sqrt(dx*dx+dy*dy);camDist=Math.max(25,Math.min(250,camDist-(dist-lastTouchDist)*.5));lastTouchDist=dist;}else if(e.touches.length===1&&isDown){camAngle-=(e.touches[0].clientX-prevX)*.005;camElev=Math.max(.08,Math.min(1.35,camElev+(e.touches[0].clientY-prevY)*.005));prevX=e.touches[0].clientX;prevY=e.touches[0].clientY;}};
  const onTouchEnd=()=>{isDown=false;};
  container.addEventListener("touchstart",onTouchStart,{passive:false});
  container.addEventListener("touchmove",onTouchMove,{passive:false});
  container.addEventListener("touchend",onTouchEnd);

  const acMeshes = new Map<string, THREE.Group>();
  let animId: number;
  const clock = new THREE.Clock();

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    camera.position.set(
      camTarget.x+Math.cos(camAngle)*camDist*Math.cos(camElev),
      camTarget.y+Math.sin(camElev)*camDist,
      camTarget.z+Math.sin(camAngle)*camDist*Math.cos(camElev),
    ); camera.lookAt(camTarget);

    const segDur=4.0,fullCycle=TARGETS.length*segDur,cycleT=(t*2.5)%fullCycle;
    const seg=Math.floor(cycleT/segDur),frac=(cycleT%segDur)/segDur;
    const from=TARGETS[seg%TARGETS.length],to=TARGETS[(seg+1)%TARGETS.length];
    setDroneTarget(to.label.split("—")[0].trim());
    const [fx,fy,fz]=latLonToScene(from.lat,from.lon,from.elevM);
    const [tx,ty,tz]=latLonToScene(to.lat,to.lon,to.elevM);
    const ease=frac<.5?2*frac*frac:-1+(4-2*frac)*frac;
    drone.position.set(fx+(tx-fx)*ease,Math.max(fy,ty)+12+Math.sin(frac*Math.PI)*8,fz+(tz-fz)*ease);
    drone.rotation.y=Math.atan2(tx-fx,tz-fz);

    scene.traverse(obj=>{
      if((obj as any)._isPulse){const s=1+Math.sin(t*2)*.5;obj.scale.set(s,1,s);((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.25+Math.sin(t*3)*.25;}
      if((obj as any)._isBeacon)((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.4+Math.sin(t*5)*.6;
      if((obj as any)._isRF!==undefined){const p=(t*.6+(obj as any)._isRF*.4)%1;obj.scale.set(1+p*1.8,1,1+p*1.8);((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.12*(1-p);}
      if((obj as any)._detRing!==undefined)((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.15+Math.sin(t*1.5+(obj as any)._detRing)*.08;
      if((obj as any)._engRing!==undefined)((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.12+Math.sin(t*2.2+(obj as any)._engRing*.7)*.06;
      if((obj as any)._isRotating)obj.rotation.z=t*1.2;
      if((obj as any)._isProp)obj.rotation.y=t*20;
      if((obj as any)._isScanCone)((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.04+Math.sin(t*3)*.04;
      if((obj as any)._isPing){const s=1+(Math.sin(t*2.5)*.5+.5)*1.5;obj.scale.set(s,1,s);((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.6*(1-(s-1)/1.5);}
      if((obj as any)._tdoaNode){obj.rotation.x=t*.8;obj.rotation.z=t*.5;}
      // Update quantum shader uTime uniforms
      if(obj instanceof THREE.Mesh){
        const m=obj.material as any;
        if(m?._isTerrainShader&&m.uniforms?.uTime) m.uniforms.uTime.value=t;
        if(m?._isOceanShader&&m.uniforms?.uTime) m.uniforms.uTime.value=t;
      }
    });

    const pa=partGeo.attributes.position.array as Float32Array;
    for(let i=0;i<partCount;i++){pa[i*3+1]+=pSpd[i];if(pa[i*3+1]>55){pa[i*3+1]=0;pa[i*3]=(Math.random()-.5)*180;pa[i*3+2]=(Math.random()-.5)*180;}}
    partGeo.attributes.position.needsUpdate=true;
    renderer.render(scene,camera);
  };
  animate();

  const onResize=()=>{camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();renderer.setSize(container.clientWidth,container.clientHeight);};
  window.addEventListener("resize",onResize);

  return {
    destroy:()=>{ cancelAnimationFrame(animId); window.removeEventListener("resize",onResize);
      container.removeEventListener("mousemove",onMM); container.removeEventListener("mousedown",onDown);
      container.removeEventListener("mouseup",onUp); container.removeEventListener("mouseleave",onUp);
      container.removeEventListener("mousemove",onDrag); container.removeEventListener("wheel",onWheel);
      container.removeEventListener("touchstart",onTouchStart); container.removeEventListener("touchmove",onTouchMove);
      container.removeEventListener("touchend",onTouchEnd);
      renderer.dispose(); renderer.domElement.parentNode?.removeChild(renderer.domElement);
    },
    resetView:()=>{camAngle=Math.PI/4;camElev=.65;camDist=110;camTarget.set(0,8,0);},
    zoomIn:()=>{camDist=Math.max(25,camDist-18);},
    zoomOut:()=>{camDist=Math.min(250,camDist+18);},
    focusTarget:(idx:number)=>{const t=TARGETS[idx];if(!t)return;const[x,,z]=latLonToScene(t.lat,t.lon,0);camTarget.set(x,8,z);camDist=45;camElev=.45;},
    updateAircraft:(aircraft:LiveAircraft[])=>{
      const seen=new Set<string>();
      for(const ac of aircraft){
        if(!ac.latitude||!ac.longitude)continue;
        seen.add(ac.icao24);
        const[ax,,az]=latLonToScene(ac.latitude,ac.longitude,0);
        let mesh=acMeshes.get(ac.icao24);
        if(!mesh){mesh=buildAircraftMesh(ac);acMeshes.set(ac.icao24,mesh);scene.add(mesh);}
        mesh.position.set(ax,acY(ac.baroAltitude??ac.geoAltitude),az);
        if(ac.trueTrack!==null)mesh.rotation.y=(ac.trueTrack*Math.PI)/180;
      }
      for(const[id,mesh]of acMeshes.entries())if(!seen.has(id)){scene.remove(mesh);acMeshes.delete(id);}
      setAircraftCount(seen.size);
    },
  };
}

// ─── Panel definitions ────────────────────────────────────────────────────────

const TARGET_COLOR: Record<Target["type"], string> = { observer:"text-cyan-400", crane:"text-amber-400", radar:"text-red-400", cell:"text-purple-400", ops:"text-orange-400" };
const TARGET_BORDER: Record<Target["type"], string> = { observer:"border-cyan-500/30", crane:"border-amber-500/30", radar:"border-red-500/30", cell:"border-purple-500/30", ops:"border-orange-500/30" };

// Panel IDs
type PanelId = "targets" | "tdoa" | "adsb" | "layers" | "freq" | "dream";

interface PanelDef { id: PanelId; icon: typeof MapPin; label: string; side: "left"|"right"; accentCls: string; }

const PANELS: PanelDef[] = [
  { id:"targets", icon:MapPin,    label:"Targets",  side:"left",  accentCls:"text-cyan-400   border-cyan-500/40"   },
  { id:"tdoa",    icon:Signal,    label:"TDOA",     side:"left",  accentCls:"text-green-400  border-green-500/40"  },
  { id:"adsb",    icon:Satellite, label:"ADS-B",    side:"right", accentCls:"text-blue-400   border-blue-500/40"   },
  { id:"layers",  icon:Layers,    label:"Layers",   side:"right", accentCls:"text-indigo-400 border-indigo-500/40" },
  { id:"freq",    icon:Activity,  label:"Freq",     side:"right", accentCls:"text-amber-400  border-amber-500/40"  },
  { id:"dream",   icon:Shield,    label:"Threat",   side:"right", accentCls:"text-red-400    border-red-500/40"    },
];

// ─── Page component ────────────────────────────────────────────────────────────

export default function JacoMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof createScene>|null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<Target|null>(null);
  const [droneTarget, setDroneTarget] = useState("");
  const [aircraftCount, setAircraftCount] = useState(0);
  const [elevStatus, setElevStatus] = useState<"loading"|"ok"|"fallback">("loading");
  const [elevData, setElevData] = useState<number[][]|null>(null);
  const [time, setTime] = useState(new Date());

  // Active panels — one per side on desktop, one total on mobile
  const [activeLeft, setActiveLeft] = useState<PanelId|null>(null);
  const [activeRight, setActiveRight] = useState<PanelId|null>(null);
  const [activeMobile, setActiveMobile] = useState<PanelId|null>(null);

  // Layer toggles (inside Layers panel)
  const [detLayers, setDetLayers] = useState([true,true,true,true]);

  // Aircraft event tracking
  const acHistory = useRef<Map<string, AcHistEntry>>(new Map());
  const [acEvents, setAcEvents] = useState<AircraftEvent[]>([]);
  const [acEventTab, setAcEventTab] = useState<"live"|"log">("live");

  // Blade rail hover state — rails slide in on hover, hidden by default
  const [leftRailHovered, setLeftRailHovered] = useState(false);
  const [rightRailHovered, setRightRailHovered] = useState(false);

  const { data: oskyData, dataUpdatedAt } = useQuery<OpenSkyResponse>({
    queryKey: ["/api/opensky/jaco"], refetchInterval: 30_000, staleTime: 25_000,
  });
  const liveAircraft = oskyData?.states ?? [];

  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(t); },[]);

  useEffect(()=>{
    const GRID=16,latMin=CENTER.lat-.04,latMax=CENTER.lat+.04,lonMin=CENTER.lon-.055,lonMax=CENTER.lon+.055;
    const locs:string[]=[];
    for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++){
      locs.push(`${(latMin+(r/(GRID-1))*(latMax-latMin)).toFixed(5)},${(lonMin+(c/(GRID-1))*(lonMax-lonMin)).toFixed(5)}`);
    }
    fetch(`/api/terrain/elevation?locations=${encodeURIComponent(locs.join("|"))}`)
      .then(r=>r.json()).then(d=>{
        if(d?.results){const flat=d.results.map((r:any)=>r.elevation??0);const g2:number[][]=[];for(let row=0;row<GRID;row++)g2.push(flat.slice(row*GRID,(row+1)*GRID));setElevData(g2);setElevStatus("ok");}
        else setElevStatus("fallback");
      }).catch(()=>setElevStatus("fallback"));
  },[]);

  useEffect(()=>{
    if(elevStatus==="loading"||!containerRef.current)return;
    const s=createScene(containerRef.current,elevData,setHoveredTarget,setDroneTarget,setAircraftCount);
    sceneRef.current=s; return()=>s.destroy();
  },[elevStatus,elevData]);

  useEffect(()=>{
    if(liveAircraft.length===0) return;
    sceneRef.current?.updateAircraft(liveAircraft);

    const now = Date.now();
    const hist = acHistory.current;
    const newEvts: AircraftEvent[] = [];
    const seen = new Set<string>();

    liveAircraft.forEach(ac => {
      const lat = ac.latitude; const lon = ac.longitude;
      if(!lat||!lon) return;
      const distKm = haversineKm(CENTER.lat, CENTER.lon, lat, lon);
      const alt = ac.baroAltitude ?? ac.geoAltitude ?? null;
      const vel = ac.velocity ?? null;
      seen.add(ac.icao24);

      const prev = hist.get(ac.icao24);
      if(!prev) {
        // New entry
        const e: AircraftEvent = { id:`${ac.icao24}-${now}`, ts:now, icao24:ac.icao24, callsign:ac.callsign,
          type:"ENTRY", lat, lon, altM:alt, velocityMs:vel, distKm, note:`Entered AOR · ${distKm.toFixed(1)}km from ECHO` };
        newEvts.push(e);
        hist.set(ac.icao24, { firstSeen:now, lastSeen:now, pollCount:1, lastAlt:alt, lastLat:lat, lastLon:lon, loiterLogged:0, flagged:false });
        return;
      }

      const updated: AcHistEntry = { ...prev, lastSeen:now, pollCount:prev.pollCount+1, lastLat:lat, lastLon:lon };

      // PROXIMITY — <1km
      if(distKm < 1.0 && prev.pollCount >= 1) {
        newEvts.push({ id:`${ac.icao24}-prox-${now}`, ts:now, icao24:ac.icao24, callsign:ac.callsign,
          type:"PROXIMITY", lat, lon, altM:alt, velocityMs:vel, distKm,
          note:`PROXIMITY ALERT · ${(distKm*1000).toFixed(0)}m from ECHO${alt!=null?` · ${Math.round(alt)}m AGL`:""}` });
      }

      // ALT_DROP / ALT_GAIN — >100m change
      if(alt!=null && prev.lastAlt!=null) {
        const delta = alt - prev.lastAlt;
        if(delta < -100) newEvts.push({ id:`${ac.icao24}-adrop-${now}`, ts:now, icao24:ac.icao24, callsign:ac.callsign,
          type:"ALT_DROP", lat, lon, altM:alt, velocityMs:vel, distKm, note:`Rapid descent ${Math.abs(Math.round(delta))}m · now ${Math.round(alt)}m` });
        else if(delta > 100) newEvts.push({ id:`${ac.icao24}-again-${now}`, ts:now, icao24:ac.icao24, callsign:ac.callsign,
          type:"ALT_GAIN", lat, lon, altM:alt, velocityMs:vel, distKm, note:`Rapid climb +${Math.round(delta)}m · now ${Math.round(alt)}m` });
      }

      // HOVER — alt <400m, vel <5 m/s, 2+ polls
      if(alt!=null && alt<400 && vel!=null && vel<5 && prev.pollCount>=2) {
        newEvts.push({ id:`${ac.icao24}-hover-${now}`, ts:now, icao24:ac.icao24, callsign:ac.callsign,
          type:"HOVER", lat, lon, altM:alt, velocityMs:vel, distKm,
          note:`HOVER · ${Math.round(alt)}m · ${vel.toFixed(1)}m/s · ${distKm.toFixed(2)}km from ECHO` });
      }

      // LOITER — 3+ polls, dist <3km, max one event per 2min
      if(prev.pollCount>=3 && distKm<3 && (now - prev.loiterLogged) > 120_000) {
        newEvts.push({ id:`${ac.icao24}-loiter-${now}`, ts:now, icao24:ac.icao24, callsign:ac.callsign,
          type:"LOITER", lat, lon, altM:alt, velocityMs:vel, distKm,
          note:`Loitering ${prev.pollCount} polls · ${distKm.toFixed(2)}km from ECHO` });
        updated.loiterLogged = now;
      }

      updated.lastAlt = alt;
      hist.set(ac.icao24, updated);
    });

    // EXIT — was in hist but not seen this poll
    hist.forEach((h, icao) => {
      if(!seen.has(icao) && now - h.lastSeen < 120_000) {
        newEvts.push({ id:`${icao}-exit-${now}`, ts:now, icao24:icao, callsign:null,
          type:"EXIT", lat:h.lastLat, lon:h.lastLon, altM:h.lastAlt, velocityMs:null,
          distKm:haversineKm(CENTER.lat,CENTER.lon,h.lastLat,h.lastLon),
          note:`Left AOR after ${h.pollCount} polls · ${Math.round((now-h.firstSeen)/60000)}min dwell` });
        hist.delete(icao);
      }
    });

    if(newEvts.length>0) setAcEvents(prev=>[...newEvts,...prev].slice(0,500));
  },[liveAircraft]);

  const flagAircraft = useCallback((ac: LiveAircraft) => {
    const now = Date.now();
    const distKm = haversineKm(CENTER.lat, CENTER.lon, ac.latitude, ac.longitude);
    const evt: AircraftEvent = { id:`${ac.icao24}-flag-${now}`, ts:now, icao24:ac.icao24, callsign:ac.callsign,
      type:"FLAGGED", lat:ac.latitude, lon:ac.longitude, altM:ac.baroAltitude??ac.geoAltitude??null,
      velocityMs:ac.velocity??null, distKm, note:`MANUALLY FLAGGED · operator annotation`, manual:true };
    const h = acHistory.current.get(ac.icao24);
    if(h) acHistory.current.set(ac.icao24, {...h, flagged:true});
    setAcEvents(prev=>[evt,...prev].slice(0,500));
    setAcEventTab("log");
  },[]);

  const exportEvents = useCallback(() => {
    const payload = { observer:{ lat:CENTER.lat, lon:CENTER.lon }, exportedAt:new Date().toISOString(), events:acEvents };
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`kappa-adsb-events-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  },[acEvents]);

  const toggleLeft = useCallback((id:PanelId)=>setActiveLeft(p=>p===id?null:id),[]);
  const toggleRight = useCallback((id:PanelId)=>setActiveRight(p=>p===id?null:id),[]);
  const toggleMobile = useCallback((id:PanelId)=>setActiveMobile(p=>p===id?null:id),[]);

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("en-US",{hour12:false}) : "—";

  // ── Panel content renderer ──────────────────────────────────────────────────
  const renderPanelContent = (id: PanelId) => {
    if (id === "targets") return (
      <div className="space-y-2">
        {TARGETS.map((t,i)=>(
          <button key={t.id} className={`w-full text-left border rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5 active:bg-white/10 ${TARGET_BORDER[t.type]}`}
            onClick={()=>sceneRef.current?.focusTarget(i)} data-testid={`button-target-${t.id}`}>
            <div className="flex items-center gap-2">
              <MapPin className={`h-3.5 w-3.5 shrink-0 ${TARGET_COLOR[t.type]}`}/>
              <span className={`text-xs font-mono font-bold leading-tight ${TARGET_COLOR[t.type]}`}>{t.label.split("—")[0].trim()}</span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono mt-0.5 ml-5">{t.lat.toFixed(4)}°N {Math.abs(t.lon).toFixed(4)}°W · +{t.elevM}m</div>
          </button>
        ))}
        <div className="border-t border-white/8 pt-2 space-y-1.5 mt-1">
          <div className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-amber-400 shrink-0"/><span className="text-[10px] text-amber-300 font-mono">CRANE — GRIDTIDE C2 SUSPECTED</span></div>
          <div className="flex items-center gap-2"><Radio className="h-3 w-3 text-red-400 shrink-0"/><span className="text-[10px] text-red-300 font-mono">EL MIRO — FULL VALLEY LOS + DEW</span></div>
          <div className="flex items-center gap-2"><Wifi className="h-3 w-3 text-purple-400 shrink-0"/><span className="text-[10px] text-purple-300 font-mono">BREAKWATER — 4G/LTE + 9.7GHz</span></div>
        </div>
      </div>
    );

    if (id === "tdoa") return (
      <div className="space-y-3">
        <div className="text-[10px] text-gray-500 font-mono">5-point triangulation via TDOA phase-difference correlation</div>
        {TDOA_NODES.map(n=>(
          <div key={n.id} className="flex items-center justify-between py-1.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{background:`#${n.color.toString(16).padStart(6,"0")}`}}/>
              <span className="text-xs font-mono font-bold text-white">{n.label}</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-gray-400">{n.lat.toFixed(3)}°N</div>
              <div className="text-[10px] font-mono text-gray-600">{Math.abs(n.lon).toFixed(3)}°W</div>
            </div>
          </div>
        ))}
        <div className="pt-1 space-y-1">
          <div className="flex items-center gap-2"><Crosshair className="h-3 w-3 text-green-400"/><span className="text-[10px] text-green-300 font-mono">Array coverage: Jaco AOR + Pacific coast</span></div>
          <div className="flex items-center gap-2"><Signal className="h-3 w-3 text-green-400"/><span className="text-[10px] text-green-300 font-mono">Frequencies: HF 3–30 MHz / VLF 16 kHz</span></div>
        </div>
      </div>
    );

    if (id === "adsb") return (
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500 font-mono">OpenSky · Jacó AOR · {lastUpdate}</span>
          <Badge className={`text-[9px] px-1.5 py-0 ${aircraftCount>0?"bg-red-500/15 text-red-400 border-red-500/30":"bg-gray-700 text-gray-500 border-gray-700"}`}>
            {aircraftCount} AC
          </Badge>
        </div>
        {/* Sub-tabs */}
        <div className="flex gap-0 border border-white/10 rounded overflow-hidden mb-2">
          {(["live","log"] as const).map(tab=>(
            <button key={tab} onClick={()=>setAcEventTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${acEventTab===tab?"bg-blue-500/20 text-blue-300":"text-gray-600 hover:text-gray-400"}`}
              data-testid={`tab-adsb-${tab}`}>
              {tab==="live"?<Satellite className="h-3 w-3"/>:<Clock className="h-3 w-3"/>}
              {tab==="live"?"Live":"Events"}
              {tab==="log"&&acEvents.length>0&&<span className="ml-0.5 text-[8px] text-red-400">{acEvents.length}</span>}
            </button>
          ))}
        </div>
        {/* Live aircraft tab */}
        {acEventTab==="live"&&(
          <>
            {liveAircraft.length===0&&(
              <div className="text-center py-6 text-[11px] text-gray-600 font-mono">No airborne traffic in AOR</div>
            )}
            <div className="space-y-1.5 overflow-y-auto max-h-72">
              {liveAircraft.slice(0,15).map(ac=>{
                const th=acThreat(ac);
                const hist=acHistory.current.get(ac.icao24);
                return(
                  <div key={ac.icao24} className={`text-[10px] font-mono border rounded px-2 py-1.5 ${th.bgCls}${hist?.flagged?" ring-1 ring-purple-500/50":""}`} data-testid={`row-aircraft-${ac.icao24}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`font-bold text-xs ${th.cls}`}>{ac.callsign||ac.icao24.toUpperCase()}</div>
                        <div className="text-gray-500">{ac.originCountry}</div>
                        <div className="text-gray-600">{ac.squawk?`SQK ${ac.squawk}`:""}</div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="text-gray-300">{ac.baroAltitude?`${Math.round(ac.baroAltitude)}m`:"—"}</div>
                        <div className="text-gray-400">{ac.velocity?`${Math.round(ac.velocity)}m/s`:"—"}</div>
                        <Badge className={`text-[8px] px-1 py-0 ${th.bgCls}`}>{th.level}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                      <span className="text-gray-600">{haversineKm(CENTER.lat,CENTER.lon,ac.latitude,ac.longitude).toFixed(1)}km</span>
                      <button onClick={()=>flagAircraft(ac)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${hist?.flagged?"text-purple-400 bg-purple-500/15":"text-gray-600 hover:text-purple-400 hover:bg-purple-500/10"}`}
                        data-testid={`btn-flag-${ac.icao24}`}>
                        <Flag className="h-2.5 w-2.5"/>{hist?.flagged?"FLAGGED":"FLAG"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {liveAircraft.length>15&&<div className="text-[10px] text-gray-600 font-mono text-center">+{liveAircraft.length-15} more</div>}
          </>
        )}
        {/* Event log tab */}
        {acEventTab==="log"&&(
          <>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-500 font-mono">{acEvents.length} events logged</span>
              <button onClick={exportEvents} disabled={acEvents.length===0}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 disabled:opacity-30 transition-colors"
                data-testid="btn-export-events">
                <Download className="h-2.5 w-2.5"/>EXPORT JSON
              </button>
            </div>
            {acEvents.length===0&&(
              <div className="text-center py-6 text-[11px] text-gray-600 font-mono">No events detected yet.<br/>Events auto-log as aircraft are polled.</div>
            )}
            <div className="space-y-1 overflow-y-auto max-h-72">
              {acEvents.slice(0,60).map(evt=>{
                const s=AC_EVENT_STYLE[evt.type];
                return(
                  <div key={evt.id} className={`border rounded px-2 py-1.5 text-[10px] font-mono ${s.cls}`} data-testid={`evt-${evt.id}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[9px] px-1 rounded border font-bold ${s.cls}`}>{s.label}</span>
                      <span className="text-gray-600 text-[9px]">{new Date(evt.ts).toLocaleTimeString("en-US",{hour12:false})}</span>
                    </div>
                    <div className="font-bold">{evt.callsign||evt.icao24.toUpperCase()}</div>
                    <div className="text-gray-500 leading-relaxed">{evt.note}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );

    if (id === "layers") return (
      <div className="space-y-4">
        <div>
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-2">Detection Rings</div>
          {DET_LAYERS.map((l,i)=>(
            <button key={l.label} className={`flex items-center gap-2.5 w-full py-2 border-b border-white/5 transition-colors ${detLayers[i]?"text-white":"text-gray-600"}`}
              onClick={()=>setDetLayers(p=>{const n=[...p];n[i]=!n[i];return n;})} data-testid={`toggle-det-${i}`}>
              <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{background:`#${l.color.toString(16).padStart(6,"0")}`,opacity:detLayers[i]?1:.25}}/>
              <span className="text-xs font-mono flex-1 text-left">{l.label}</span>
              <span className="text-[10px] font-mono text-gray-500">{l.range>=1000?`${l.range/1000}km`:`${l.range}m`}</span>
            </button>
          ))}
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-2">Engagement Envelopes</div>
          {ENGAGE_LAYERS.map(l=>(
            <div key={l.label} className="flex items-center gap-2.5 py-2 border-b border-white/5">
              <Zap className="h-3 w-3 shrink-0" style={{color:`#${l.color.toString(16).padStart(6,"0")}`}}/>
              <span className="text-[10px] font-mono flex-1 text-gray-400">{l.label}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-2">Data Sources</div>
          {[{label:"OpenSky ADS-B",ok:true},{label:"SRTM DEM",ok:elevStatus==="ok"},{label:"KiwiSDR TDOA",ok:true},{label:"ESRI Imagery",ok:true},{label:"PCAP backup",ok:false}].map(s=>(
            <div key={s.label} className="flex items-center gap-2.5 py-1.5 border-b border-white/5">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.ok?"bg-green-400":"bg-gray-700"}`}/>
              <span className={`text-[10px] font-mono ${s.ok?"text-gray-300":"text-gray-600"}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );

    if (id === "freq") return (
      <div className="space-y-1">
        <div className="text-[10px] text-gray-600 font-mono mb-3">● = actively monitored via KiwiSDR / OpenSky</div>
        {FREQ_CHAIN.map(f=>(
          <div key={f.freq} className={`flex items-center gap-2.5 py-1.5 border-b border-white/5 ${f.active?"text-white":"text-gray-600"}`}>
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${f.active?"bg-green-400":"bg-gray-700"}`}/>
            <span className={`w-16 shrink-0 text-[10px] font-mono font-bold ${f.active?"text-cyan-400":"text-gray-600"}`}>{f.freq}</span>
            <span className="text-[9px] font-mono text-gray-600 shrink-0 w-12">[{f.band}]</span>
            <span className="text-[10px] font-mono truncate">{f.label}</span>
          </div>
        ))}
      </div>
    );

    if (id === "dream") return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/>
          <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">Active threat — Jacó AOR</span>
        </div>
        {[
          ["Platform", "IAI flying wing (LO tailless)"],
          ["Ceiling", ">50,000 ft — above SHORAD"],
          ["Loiter", ">18 hours persistent"],
          ["AI compute", "Jetson AGX Orin 275 TOPS"],
          ["DEW", "6kW blue laser (458nm)"],
          ["SDR", "Python SDR — full spectrum"],
          ["LOS @ 50kft", ">400 km horizon"],
          ["RCS", "Planform-aligned — minimized"],
          ["Jam-immune", "Autonomous edge AI — no GCS"],
          ["Counter", "Laser DEW only — RF jam ineffective"],
        ].map(([k,v])=>(
          <div key={k} className="flex gap-3 py-1 border-b border-red-500/10">
            <span className="text-[10px] font-mono text-gray-600 w-20 shrink-0">{k}</span>
            <span className="text-[10px] font-mono text-red-300">{v}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-red-500/20 text-[10px] font-mono text-red-400">
          KAPPA Rule #23 — correlation +18 Kappa Score
        </div>
      </div>
    );

    return null;
  };

  const leftPanels = PANELS.filter(p=>p.side==="left");
  const rightPanels = PANELS.filter(p=>p.side==="right");
  const mobilePanelDef = PANELS.find(p=>p.id===activeMobile);

  return (
    <div className="relative w-full h-full bg-[#020a12] overflow-hidden select-none" data-testid="page-jaco-map">
      {/* 3D canvas — always full screen */}
      <div ref={containerRef} className="absolute inset-0 touch-none" data-testid="canvas-jaco-3d"/>

      {/* Loading overlay */}
      {elevStatus==="loading"&&(
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-[#020a12]">
          <div className="text-center space-y-4">
            <div className="h-4 w-4 rounded-full bg-cyan-400 animate-pulse mx-auto"/>
            <div className="text-xs font-mono text-cyan-400 tracking-wider">FETCHING SRTM ELEVATION…</div>
            <div className="text-[10px] font-mono text-gray-600">{CENTER.lat.toFixed(4)}°N {Math.abs(CENTER.lon).toFixed(4)}°W</div>
          </div>
        </div>
      )}

      {/* ── TOP HUD STRIP — minimal, always visible ── */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 py-2 bg-black/75 backdrop-blur-md border-b border-white/8" data-testid="hud-strip">
        {/* Left — identity */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0"/>
          <div className="min-w-0">
            <div className="text-[11px] font-mono font-bold text-white truncate leading-tight">JACÓ VALLEY — TACTICAL 3D</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[9px] font-mono px-1 rounded ${elevStatus==="ok"?"text-green-400":"text-amber-400"}`}>
                {elevStatus==="ok"?"● SRTM":"△ PROC"}
              </span>
              <span className={`text-[9px] font-mono px-1 rounded ${aircraftCount>0?"text-red-400":"text-gray-600"}`}>
                ✈ {aircraftCount} AC
              </span>
              <span className="text-[9px] font-mono text-cyan-500">5PT-TDOA</span>
              {droneTarget&&<span className="text-[9px] font-mono text-purple-400 truncate max-w-20 hidden sm:block">→ {droneTarget}</span>}
            </div>
          </div>
        </div>

        {/* Right — clock + zoom controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-mono text-cyan-400 tabular-nums leading-tight" data-testid="text-clock">
              {time.toLocaleTimeString("en-US",{hour12:false})}
            </div>
            <div className="text-[9px] font-mono text-gray-600">CST</div>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10" onClick={()=>sceneRef.current?.zoomIn()} data-testid="button-zoom-in"><ZoomIn className="h-3.5 w-3.5"/></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10" onClick={()=>sceneRef.current?.zoomOut()} data-testid="button-zoom-out"><ZoomOut className="h-3.5 w-3.5"/></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10" onClick={()=>sceneRef.current?.resetView()} data-testid="button-reset-view"><RotateCcw className="h-3.5 w-3.5"/></Button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
           DESKTOP BLADE UI  (md and up)
           Rails are hidden by default — only a 2px accent line shows.
           Hovering the 20px edge zone slides the full rail in.
           Panels open offset from the rail when active.
         ════════════════════════════════════════════════════════════ */}

      {/* LEFT edge system */}
      <div className="hidden md:block absolute left-0 top-10 bottom-0 z-30 w-5"
        onMouseEnter={()=>setLeftRailHovered(true)}
        onMouseLeave={()=>setLeftRailHovered(false)}>
        {/* Permanent 2px accent line */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-green-500/20 to-transparent pointer-events-none"/>
        {/* Sliding rail */}
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-black/92 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-3 gap-0.5"
          style={{ transform:(leftRailHovered||activeLeft!==null)?"translateX(0)":"translateX(-100%)", transition:"transform 180ms cubic-bezier(0.4,0,0.2,1)", pointerEvents:(leftRailHovered||activeLeft!==null)?"auto":"none" }}>
          {leftPanels.map(p=>{
            const Icon=p.icon; const isActive=activeLeft===p.id;
            return(
              <button key={p.id} onClick={()=>toggleLeft(p.id)}
                className={`relative flex flex-col items-center justify-center gap-1 w-9 h-14 rounded-lg transition-all duration-150 ${isActive?"bg-white/10 border border-white/15":"hover:bg-white/5 border border-transparent"}`}
                data-testid={`blade-left-${p.id}`} title={p.label}>
                {isActive&&<div className={`absolute left-0 top-3 h-8 w-0.5 rounded-r ${p.accentCls.split(" ")[0].replace("text-","bg-")}`}/>}
                <Icon className={`h-4 w-4 transition-colors ${isActive?p.accentCls.split(" ")[0]:"text-gray-500"}`}/>
                <span className={`text-[8px] font-mono uppercase tracking-wide transition-colors ${isActive?p.accentCls.split(" ")[0]:"text-gray-600"}`}>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Left blade panel — slides from rail edge */}
      {leftPanels.map(p=>(
        <div key={p.id} className="hidden md:block absolute top-10 bottom-0 z-20 w-72 bg-black/92 backdrop-blur-xl border-r border-white/10 overflow-hidden"
          style={{ left:"40px", transform:activeLeft===p.id?"translateX(0)":"translateX(calc(-100% - 40px))", transition:"transform 250ms cubic-bezier(0.4,0,0.2,1)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-2">
              <p.icon className={`h-4 w-4 ${p.accentCls.split(" ")[0]}`}/>
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${p.accentCls.split(" ")[0]}`}>{p.label}</span>
            </div>
            <button onClick={()=>setActiveLeft(null)} className="text-gray-600 hover:text-white transition-colors p-1 rounded"><X className="h-3.5 w-3.5"/></button>
          </div>
          <div className="overflow-y-auto p-4 h-full pb-16">{renderPanelContent(p.id)}</div>
        </div>
      ))}

      {/* RIGHT edge system */}
      <div className="hidden md:block absolute right-0 top-10 bottom-0 z-30 w-5"
        onMouseEnter={()=>setRightRailHovered(true)}
        onMouseLeave={()=>setRightRailHovered(false)}>
        {/* Permanent 2px accent line */}
        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-indigo-500/20 to-transparent pointer-events-none"/>
        {/* Sliding rail */}
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-black/92 backdrop-blur-xl border-l border-white/10 flex flex-col items-center py-3 gap-0.5"
          style={{ transform:(rightRailHovered||activeRight!==null)?"translateX(0)":"translateX(100%)", transition:"transform 180ms cubic-bezier(0.4,0,0.2,1)", pointerEvents:(rightRailHovered||activeRight!==null)?"auto":"none" }}>
          {rightPanels.map(p=>{
            const Icon=p.icon; const isActive=activeRight===p.id;
            return(
              <button key={p.id} onClick={()=>toggleRight(p.id)}
                className={`relative flex flex-col items-center justify-center gap-1 w-9 h-14 rounded-lg transition-all duration-150 ${isActive?"bg-white/10 border border-white/15":"hover:bg-white/5 border border-transparent"}`}
                data-testid={`blade-right-${p.id}`} title={p.label}>
                {isActive&&<div className={`absolute right-0 top-3 h-8 w-0.5 rounded-l ${p.accentCls.split(" ")[0].replace("text-","bg-")}`}/>}
                <Icon className={`h-4 w-4 transition-colors ${isActive?p.accentCls.split(" ")[0]:"text-gray-500"}`}/>
                <span className={`text-[8px] font-mono uppercase tracking-wide transition-colors ${isActive?p.accentCls.split(" ")[0]:"text-gray-600"}`}>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right blade panel — slides from rail edge */}
      {rightPanels.map(p=>(
        <div key={p.id} className="hidden md:block absolute top-10 bottom-0 z-20 w-72 bg-black/92 backdrop-blur-xl border-l border-white/10 overflow-hidden"
          style={{ right:"40px", transform:activeRight===p.id?"translateX(0)":"translateX(calc(100% + 40px))", transition:"transform 250ms cubic-bezier(0.4,0,0.2,1)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-2">
              <p.icon className={`h-4 w-4 ${p.accentCls.split(" ")[0]}`}/>
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${p.accentCls.split(" ")[0]}`}>{p.label}</span>
            </div>
            <button onClick={()=>setActiveRight(null)} className="text-gray-600 hover:text-white transition-colors p-1 rounded"><X className="h-3.5 w-3.5"/></button>
          </div>
          <div className="overflow-y-auto p-4 h-full pb-16">{renderPanelContent(p.id)}</div>
        </div>
      ))}

      {/* Desktop hover tooltip */}
      {hoveredTarget&&(
        <div className="hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className={`bg-black/90 backdrop-blur-xl border rounded-xl px-4 py-3 min-w-64 max-w-xs ${TARGET_BORDER[hoveredTarget.type]}`}>
            <div className="flex items-center gap-2 mb-1">
              <Crosshair className={`h-4 w-4 ${TARGET_COLOR[hoveredTarget.type]}`}/>
              <span className={`text-xs font-mono font-bold ${TARGET_COLOR[hoveredTarget.type]}`}>{hoveredTarget.label.split("—")[0].trim()}</span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono leading-relaxed">{hoveredTarget.desc}</p>
            <div className="grid grid-cols-2 gap-x-4 mt-1.5 text-[9px] font-mono">
              <span className="text-gray-600">LAT</span><span className="text-gray-300">{hoveredTarget.lat.toFixed(5)}°N</span>
              <span className="text-gray-600">LON</span><span className="text-gray-300">{Math.abs(hoveredTarget.lon).toFixed(5)}°W</span>
              <span className="text-gray-600">ELEV</span><span className="text-gray-300">+{hoveredTarget.elevM}m ASL</span>
            </div>
          </div>
        </div>
      )}

      {/* Desktop bottom hint */}
      <div className="hidden md:block absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded px-3 py-1 text-[9px] text-gray-600 font-mono">
          DRAG orbit · SCROLL zoom · CLICK tabs to open panels · HOVER targets for intel
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
           MOBILE BOTTOM SHEET UI  (below md)
         ════════════════════════════════════════════════════════════ */}

      {/* Mobile bottom sheet backdrop */}
      {activeMobile&&(
        <div className="md:hidden fixed inset-0 z-30 bg-black/40" onClick={()=>setActiveMobile(null)}/>
      )}

      {/* Mobile bottom sheet */}
      <div className={`md:hidden fixed bottom-14 left-0 right-0 z-40 bg-[#0a1220]/97 backdrop-blur-2xl rounded-t-2xl border-t border-white/12 transition-transform duration-300 ease-out ${activeMobile?"translate-y-0":"translate-y-full"}`}
        style={{maxHeight:"66vh"}} data-testid="mobile-sheet">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20"/>
        </div>
        {/* Sheet header */}
        {mobilePanelDef&&(
          <div className="flex items-center justify-between px-5 py-2 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <mobilePanelDef.icon className={`h-4.5 w-4.5 ${mobilePanelDef.accentCls.split(" ")[0]}`}/>
              <span className={`text-sm font-mono font-bold uppercase tracking-wider ${mobilePanelDef.accentCls.split(" ")[0]}`}>{mobilePanelDef.label}</span>
            </div>
            <button onClick={()=>setActiveMobile(null)} className="text-gray-500 p-2 -mr-2"><X className="h-4 w-4"/></button>
          </div>
        )}
        {/* Sheet content */}
        <div className="overflow-y-auto px-5 py-4" style={{maxHeight:"calc(66vh - 80px)"}}>
          {activeMobile&&renderPanelContent(activeMobile)}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center bg-black/95 backdrop-blur-2xl border-t border-white/10 safe-area-bottom" data-testid="mobile-tab-bar"
        style={{paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {PANELS.map(p=>{
          const Icon=p.icon; const isActive=activeMobile===p.id;
          return(
            <button key={p.id} onClick={()=>toggleMobile(p.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors relative ${isActive?"":""}`}
              data-testid={`mobile-tab-${p.id}`}>
              {isActive&&<div className={`absolute top-0 left-2 right-2 h-0.5 rounded-b ${p.accentCls.split(" ")[0].replace("text-","bg-")}`}/>}
              <Icon className={`h-5 w-5 transition-colors ${isActive?p.accentCls.split(" ")[0]:"text-gray-600"}`}/>
              <span className={`text-[9px] font-mono tracking-wide transition-colors ${isActive?p.accentCls.split(" ")[0]:"text-gray-600"}`}>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile clock (floating, top-right corner of canvas) */}
      <div className="md:hidden absolute top-12 right-2 z-20 text-right pointer-events-none">
        <div className="text-xs font-mono text-cyan-400/70 tabular-nums">{time.toLocaleTimeString("en-US",{hour12:false})}</div>
      </div>
    </div>
  );
}
