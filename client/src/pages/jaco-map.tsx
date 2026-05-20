import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { buildWebGPUScene, type WGPUSceneTarget } from "@/lib/jaco-webgpu";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Radio, RotateCcw, ZoomIn, ZoomOut, Crosshair,
  AlertTriangle, Wifi, MapPin, Layers,
  Satellite, Activity, Shield, Zap, Signal,
  X, Flag, Download, Clock, Moon, Sun, Waves, FlaskConical, Cpu, Printer,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CENTER = { lat: 9.621887, lon: -84.63969 };
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
  PROXIMITY: { cls: "text-amber-400 border-amber-500/40",      label: "PROXIMITY"},
  ALT_DROP:  { cls: "text-orange-400 border-orange-500/30",label: "ALT DROP" },
  ALT_GAIN:  { cls: "text-amber-400 border-amber-500/20",  label: "ALT GAIN" },
  HOVER:     { cls: "text-amber-400 border-amber-500/40",      label: "HOVER"    },
  LOITER:    { cls: "text-orange-400 border-orange-500/30",label: "LOITER"   },
  EXIT:      { cls: "text-gray-500 border-gray-700",       label: "EXIT"     },
  FLAGGED:   { cls: "text-purple-400 border-purple-500/40",label: "FLAGGED"  },
};

// ─── Fixed targets ────────────────────────────────────────────────────────────

const TARGETS: Target[] = [
  { id: "pochote",    label: "HOTEL POCHOTE GRANDE — ECHO",   lat: 9.621887, lon: -84.63969, elevM: 5,   type: "observer", color: 0x00ffcc, desc: "Observer position • Hotel Pochote Grande • Jacó Beach (verified Google Maps)" },
  { id: "crane",      label: "CRANE-ALPHA — CALLE DANKERS",   lat: 9.621,    lon: -84.6295,  elevM: 8,   type: "crane",    color: 0xffaa00, desc: "Construction crane • Suspected surveillance relay" },
  { id: "elmiro",     label: "EL MIRO RADAR DOME",            lat: 9.617,    lon: -84.623,   elevM: 110, type: "radar",    color: 0xff3333, desc: "Hillside • 1.91km NE of ECHO • 3.1° look-down • Suspected phased-array" },
  { id: "breakwater", label: "BREAKWATER 4G TOWER",           lat: 9.626,    lon: -84.641,   elevM: 6,   type: "cell",     color: 0xaa44ff, desc: "Punta de Jacó headland • 4G/LTE • 9.7GHz" },
  { id: "hermosa",    label: "HERMOSA PALMS — OPS BASE",      lat: 9.5588,   lon: -84.6519,  elevM: 4,   type: "ops",      color: 0xff6644, desc: "Michael Greenwald complex • Playa Hermosa • 7.1km SSW of ECHO position" },
];

// ─── Threat helpers ───────────────────────────────────────────────────────────

function acThreat(ac: LiveAircraft) {
  const alt = ac.baroAltitude ?? ac.geoAltitude ?? 9999;
  const vel = ac.velocity ?? 0;
  if (alt < 500 && vel < 40) return { level: "CRITICAL", hex: 0xff0033, cls: "text-amber-400",    bgCls: "bg-amber-500/20 border-amber-500/40" };
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

// Scene terrain bounds (CENTER.lat ±0.04° → ±55.6 scene units; use 52 as safe clamp)
const TERRAIN_HALF_Z = 52;
const TERRAIN_HALF_X = 70;

function buildLandmark(scene: THREE.Scene, t: Target): THREE.Group {
  const [rawX, bY, rawZ] = latLonToScene(t.lat, t.lon, t.elevM);

  // Detect distant target (outside scene terrain bounds)
  const isDistant = Math.abs(rawX) > TERRAIN_HALF_X || Math.abs(rawZ) > TERRAIN_HALF_Z;

  let x = rawX, z = rawZ;
  if (isDistant) {
    // Clamp proportionally to terrain edge so direction is preserved
    const scaleX = Math.abs(rawX) > TERRAIN_HALF_X ? TERRAIN_HALF_X / Math.abs(rawX) : 1;
    const scaleZ = Math.abs(rawZ) > TERRAIN_HALF_Z ? TERRAIN_HALF_Z / Math.abs(rawZ) : 1;
    const scale = Math.min(scaleX, scaleZ) * 0.93;
    x = rawX * scale;
    z = rawZ * scale;
  }

  const group = new THREE.Group(); group.position.set(x, bY, z);

  if (isDistant) {
    // Tall beacon pylon
    const mastMat = new THREE.MeshStandardMaterial({ color: t.color, emissive: t.color, emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.4 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 32, 6), mastMat);
    mast.position.y = 16; group.add(mast);

    // Strobe beacon at top
    const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.9 }));
    strobe.position.y = 32.5; (strobe as any)._isBeacon = true; group.add(strobe);

    // Directional arrow pointing toward actual (clamped → real) location
    const dx = rawX - x, dz = rawZ - z;
    const dLen = Math.sqrt(dx * dx + dz * dz);
    if (dLen > 0.01) {
      const nx = dx / dLen, nz = dz / dLen;
      const arrowYaw = Math.atan2(nx, nz);
      const arrowGroup = new THREE.Group();
      arrowGroup.position.set(nx * 4, 28, nz * 4);
      arrowGroup.rotation.y = arrowYaw;
      // Stem
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 9), new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.85 }));
      stem.position.z = -4.5; arrowGroup.add(stem);
      // Head
      const head = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4.5, 8), new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.95 }));
      head.rotation.x = -Math.PI / 2; head.position.z = -10; arrowGroup.add(head);
      group.add(arrowGroup);
    }

    // Pulsing base ring
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.5, 4.5, 32), new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1; (ring as any)._isPulse = true; group.add(ring);

    // Second ring (range indicator — 7km)
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(6, 7, 48), new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.1, side: THREE.DoubleSide }));
    ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.05; group.add(ring2);

    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: t.color }));
    pin.position.y = -0.3; group.add(pin);

    (group as any)._target = t; (group as any)._isDistant = true;
    scene.add(group); return group;
  }

  if (t.type === "observer") {
    // Multi-story hotel — concrete structure with glowing windows
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x1a2535, metalness: 0.15, roughness: 0.85 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a1a2e, emissive: 0x00ffcc, emissiveIntensity: 0.35, metalness: 0.7, roughness: 0.1, transparent: true, opacity: 0.8 });
    // Ground floor lobby (wider)
    const lobby = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 4), concreteMat); lobby.position.y = 0.6; group.add(lobby);
    // 4 floors stacked
    for (let fl = 0; fl < 4; fl++) {
      const floor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.4, 3.2), concreteMat);
      floor.position.y = 1.8 + fl * 1.45; group.add(floor);
      // Balcony slab
      const balc = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: 0x1e2e3e, metalness: 0.4 }));
      balc.position.set(0, 1.8 + fl * 1.45 + 0.65, 1.9); group.add(balc);
      // Window strip per floor (both sides)
      for (let w = 0; w < 5; w++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.05), glassMat);
        win.position.set(-1.8 + w * 0.9, 1.8 + fl * 1.45, 1.62); group.add(win);
        const winB = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.05), glassMat);
        winB.position.set(-1.8 + w * 0.9, 1.8 + fl * 1.45, -1.62); group.add(winB);
      }
    }
    // Roof equipment — AC units, comms dish, water tank
    const roofY = 1.8 + 4 * 1.45 + 0.7;
    const ac = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.9), new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.6 }));
    ac.position.set(-1.2, roofY, 0.5); group.add(ac);
    const comsDish = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.9 }));
    comsDish.position.set(1.2, roofY, 0); comsDish.rotation.x = -Math.PI * 0.7; group.add(comsDish);
    const comsMast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6), new THREE.MeshStandardMaterial({ color: 0x667788, metalness: 0.85 }));
    comsMast.position.set(1.2, roofY + 1.7, 0); group.add(comsMast);
    // Roof beacon
    const rBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: t.color }));
    rBeacon.position.set(0, roofY + 0.6, 0); (rBeacon as any)._isBeacon = true; group.add(rBeacon);
    // Outer edge wire frame glow
    const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(4.3, roofY + 0.4, 3.3));
    const frame = new THREE.LineSegments(frameGeo, new THREE.LineBasicMaterial({ color: t.color, transparent: true, opacity: 0.25 }));
    frame.position.y = (roofY + 0.4) / 2; group.add(frame);
    const pulse = new THREE.Mesh(new THREE.RingGeometry(3.5, 4.2, 48), new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
    pulse.rotation.x = -Math.PI / 2; pulse.position.y = 0.05; (pulse as any)._isPulse = true; group.add(pulse);
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
    // Bunker base building
    const bldMat = new THREE.MeshStandardMaterial({ color: 0x2a1e12, metalness: 0.3, roughness: 0.9 });
    const bld = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 5), bldMat);
    bld.position.y = 1.5; group.add(bld);
    // Concrete reinforcing ribs on building
    for (let r = 0; r < 3; r++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 5.2), new THREE.MeshStandardMaterial({ color: 0x221a0e, metalness: 0.2 }));
      rib.position.set(-2.8 + r * 2.8, 1.6, 0); group.add(rib);
    }
    // Blast door slit
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.1), new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.9, emissive: 0x110022, emissiveIntensity: 0.5 }));
    door.position.set(0, 1.3, 2.55); group.add(door);
    // Pedestal tower
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 6, 10), new THREE.MeshStandardMaterial({ color: 0x252015, metalness: 0.5, roughness: 0.7 }));
    pedestal.position.y = 6; group.add(pedestal);
    // Radome — white composite sphere, hexagonal panel seams via wireframe sphere
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xe8ecf0, metalness: 0.1, roughness: 0.3, transparent: true, opacity: 0.88 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.8, 12, 9), domeMat);
    dome.position.y = 10.8; group.add(dome);
    // Hex panel seam wireframe overlay
    const domeWire = new THREE.Mesh(new THREE.SphereGeometry(2.85, 12, 9), new THREE.MeshBasicMaterial({ color: 0xaabbc8, wireframe: true, transparent: true, opacity: 0.18 }));
    domeWire.position.y = 10.8; group.add(domeWire);
    // Inner emissive radar glow through dome
    const domeGlow = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 8), new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.25 }));
    domeGlow.position.y = 10.8; (domeGlow as any)._isRadarGlow = true; group.add(domeGlow);
    // Rotating radar arm (visible through dome)
    const radarArm = new THREE.Group(); radarArm.position.y = 10.8;
    const armBar = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.15, 0.3), new THREE.MeshStandardMaterial({ color: 0x334466, metalness: 0.85 }));
    radarArm.add(armBar);
    const headL = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x6699ff, emissive: 0x2244ff, emissiveIntensity: 0.8 }));
    headL.position.x = 2.1; headL.rotation.z = -Math.PI / 2; radarArm.add(headL);
    const headR = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x6699ff, emissive: 0x2244ff, emissiveIntensity: 0.8 }));
    headR.position.x = -2.1; headR.rotation.z = Math.PI / 2; radarArm.add(headR);
    (radarArm as any)._isRotating = true; group.add(radarArm);
    // Pulsing scan sweeps
    for (let i = 0; i < 4; i++) {
      const sw = new THREE.Mesh(new THREE.RingGeometry(4 + i * 7, 4.6 + i * 7, 64), new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.07 - i * 0.01, side: THREE.DoubleSide }));
      sw.rotation.x = -Math.PI / 2; sw.position.y = 10; (sw as any)._isRF = i; group.add(sw);
    }
    // Warning beacon on dome top
    const warn = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    warn.position.y = 13.7; (warn as any)._isBeacon = true; group.add(warn);
    // Red PointLight at dome to color local terrain
    const radarPt = new THREE.PointLight(0xff1111, 2.5, 20); radarPt.position.y = 11; group.add(radarPt);
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

  // ── Central body — carbon-fibre hexagonal platform ───────────────────────
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, metalness: 0.85, roughness: 0.25, emissive: 0x001a14, emissiveIntensity: 0.4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.28, 8), bodyMat);
  drone.add(body);
  // top plate edge ring
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 6, 16), new THREE.MeshStandardMaterial({ color: 0x1a2a2a, metalness: 0.9, roughness: 0.2 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.14; drone.add(rim);
  // status LED strip along rim
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
  const led = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.045, 4, 32), ledMat);
  led.rotation.x = Math.PI / 2; led.position.y = -0.02; (led as any)._isDroneLED = true; drone.add(led);

  // ── 4 Arms + motor nacelles ───────────────────────────────────────────────
  const ARM_DIRS = [45, 135, 225, 315];
  const armMat = new THREE.MeshStandardMaterial({ color: 0x0d1117, metalness: 0.75, roughness: 0.35 });
  const nacelleMat = new THREE.MeshStandardMaterial({ color: 0x141820, metalness: 0.9, roughness: 0.15 });

  ARM_DIRS.forEach((deg, i) => {
    const ang = deg * Math.PI / 180;
    const ax = Math.sin(ang), az = Math.cos(ang);

    // Tapered arm (wide at body, narrow at tip)
    const armGroup = new THREE.Group();
    armGroup.rotation.y = -ang;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 2.4), armMat);
    arm.position.z = 1.3; armGroup.add(arm);
    // Carbon-fibre ribs on arm
    for (let r = 0; r < 3; r++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.04), new THREE.MeshStandardMaterial({ color: 0x1a2030, metalness: 0.7 }));
      rib.position.set(0, 0.06, 0.7 + r * 0.7); armGroup.add(rib);
    }
    drone.add(armGroup);

    // Motor nacelle cylinder
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.3, 12), nacelleMat);
    nacelle.position.set(ax * 2.55, 0.0, az * 2.55); drone.add(nacelle);
    const nacTop = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x222a32, metalness: 0.95 }));
    nacTop.position.set(ax * 2.55, 0.18, az * 2.55); drone.add(nacTop);

    // ── Rotor blades — 2 crossed thin blades ─────────────────────────────
    const rotorHub = new THREE.Group();
    rotorHub.position.set(ax * 2.55, 0.25, az * 2.55);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide });
    for (let b = 0; b < 2; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 0.18), bladeMat);
      blade.rotation.y = b * Math.PI / 2; rotorHub.add(blade);
    }
    // Blur disc (shows spinning motion)
    const blurDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.35, 0.02, 32),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x334455 : 0x223344, transparent: true, opacity: 0.28, depthWrite: false })
    );
    rotorHub.add(blurDisc);
    (rotorHub as any)._rotorIdx = i;
    drone.add(rotorHub);

    // ── Nav lights ────────────────────────────────────────────────────────
    if (i === 0) { // Front-right: green
      const nl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0x00ff44 }));
      nl.position.set(ax * 2.55, 0.1, az * 2.55); (nl as any)._isNavLight = "green"; drone.add(nl);
      const pt = new THREE.PointLight(0x00ff44, 0.8, 4); pt.position.copy(nl.position); drone.add(pt);
    }
    if (i === 1) { // Front-left: red
      const nl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff2200 }));
      nl.position.set(ax * 2.55, 0.1, az * 2.55); (nl as any)._isNavLight = "red"; drone.add(nl);
      const pt = new THREE.PointLight(0xff2200, 0.8, 4); pt.position.copy(nl.position); drone.add(pt);
    }
    if (i === 2) { // Rear: white strobe
      const nl = new THREE.Mesh(new THREE.SphereGeometry(0.10, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      nl.position.set(ax * 2.55, 0.1, az * 2.55); (nl as any)._isNavLight = "strobe"; drone.add(nl);
    }
  });

  // ── Camera gimbal ─────────────────────────────────────────────────────────
  const gMat = new THREE.MeshStandardMaterial({ color: 0x1a1a20, metalness: 0.9, roughness: 0.1 });
  const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), gMat);
  gimbal.position.y = -0.38; drone.add(gimbal);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0x06080c, emissive: 0x1133aa, emissiveIntensity: 0.6, metalness: 0.99 }));
  lens.position.y = -0.62; (lens as any)._isLens = true; drone.add(lens);

  // ── Downwash illumination + scan volumes ──────────────────────────────────
  const belly = new THREE.PointLight(0x44ffee, 1.4, 12); belly.position.y = -1.0; (belly as any)._isBellyLight = true; drone.add(belly);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(3.5, 9, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }));
  cone.rotation.x = Math.PI; cone.position.y = -4.5; (cone as any)._isScanCone = true; drone.add(cone);
  // inner hot cone
  const coneInner = new THREE.Mesh(new THREE.ConeGeometry(1.0, 9, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xaaffee, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }));
  coneInner.rotation.x = Math.PI; coneInner.position.y = -4.5; drone.add(coneInner);
  // Scan rings at different depths
  for (let r = 0; r < 3; r++) {
    const scanRing = new THREE.Mesh(new THREE.RingGeometry(1.8 + r * 1.1, 2.0 + r * 1.1, 32), new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.06 - r * 0.015, side: THREE.DoubleSide, depthWrite: false }));
    scanRing.rotation.x = -Math.PI / 2; scanRing.position.y = -3 - r * 2.2; (scanRing as any)._isScanRing = r; drone.add(scanRing);
  }

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

  function webglFallback(msg?: string) {
    const fb = document.createElement("div");
    fb.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#00ffcc;font-family:monospace;font-size:13px;background:#020a12;";
    fb.innerHTML = `<div style="text-align:center;opacity:.7"><div style="font-size:22px;margin-bottom:10px">◌</div>JACÓ VALLEY 3D MAP<br><span style="font-size:10px;color:#445;line-height:2">${msg ?? "WebGL unavailable in this environment"}<br>Open this page in Chrome or Firefox</span></div>`;
    container.appendChild(fb);
    return { destroy: () => fb.remove(), resetView: () => {}, zoomIn: () => {}, zoomOut: () => {}, focusTarget: () => {}, updateAircraft: () => {} };
  }

  // Quick canvas probe — catches both missing WebGL and context-creation failure
  const probe = document.createElement("canvas");
  const probeCtx = probe.getContext("webgl2") || probe.getContext("webgl") || probe.getContext("experimental-webgl");
  if (!probeCtx) return null;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", canvas: probe as HTMLCanvasElement });
    // Verify the GL context actually exists after construction
    if (!renderer.getContext()) {
      renderer.dispose();
      return null;
    }
    // Detach probe canvas — we'll let Three.js create its own
    renderer.dispose();
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  // ── Lighting: Quake-engine night — deep moonlit valley ────────────────────
  scene.add(new THREE.AmbientLight(0x04080f, 0.3));
  // Cold moonlight from high left
  const moon = new THREE.DirectionalLight(0x8ab4d4, 0.55);
  moon.position.set(-60, 110, -30); moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024); moon.shadow.camera.near = 1; moon.shadow.camera.far = 400;
  moon.shadow.camera.left = -80; moon.shadow.camera.right = 80;
  moon.shadow.camera.top = 80; moon.shadow.camera.bottom = -80;
  scene.add(moon);
  // Subtle warm fill from east (dawn glow on ridge)
  const fillLight = new THREE.DirectionalLight(0x3a1a05, 0.18);
  fillLight.position.set(80, 20, -60); scene.add(fillLight);
  // Sky hemisphere — deep night blue sky / dark green jungle floor
  scene.add(new THREE.HemisphereLight(0x0d1f3a, 0x0a120a, 0.5));

  // ── Colored point lights at each target for dramatic set-dressing ─────────
  const TARGET_LIGHTS: [number, number, number, number, number][] = [
    // [lat, lon, elevM, color, intensity]
    [TARGETS[0].lat, TARGETS[0].lon, TARGETS[0].elevM + 8, 0x00ffcc, 2.0],  // ECHO: teal
    [TARGETS[1].lat, TARGETS[1].lon, TARGETS[1].elevM + 20, 0xff8800, 1.8], // crane: amber
    [TARGETS[2].lat, TARGETS[2].lon, TARGETS[2].elevM + 6, 0xff2222, 3.0],  // El Miro: red
    [TARGETS[3].lat, TARGETS[3].lon, TARGETS[3].elevM + 10, 0xaa44ff, 1.6], // breakwater: purple
    [TARGETS[4].lat, TARGETS[4].lon, TARGETS[4].elevM + 6, 0xff5533, 1.4],  // hermosa: orange
  ];
  TARGET_LIGHTS.forEach(([lat, lon, elev, col, intensity]) => {
    const [lx, ly, lz] = latLonToScene(lat, lon, elev);
    const pl = new THREE.PointLight(col, intensity, 28); pl.position.set(lx, ly, lz); scene.add(pl);
  });

  // ── Moon sphere in sky ────────────────────────────────────────────────────
  const moonSphere = new THREE.Mesh(
    new THREE.SphereGeometry(8, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xd8e8f5 })
  );
  moonSphere.position.set(-180, 220, -280); scene.add(moonSphere);
  // Moon glow halo
  const moonHalo = new THREE.Mesh(
    new THREE.SphereGeometry(14, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x6090c0, transparent: true, opacity: 0.07, side: THREE.BackSide })
  );
  moonHalo.position.copy(moonSphere.position); scene.add(moonHalo);

  // ── Stars — 3 layers of depth ─────────────────────────────────────────────
  const starLayers = [
    { count: 800, spread: 600, y0: 80, yH: 140, size: 0.25, col: 0xd0e0f0, op: 0.7 },
    { count: 400, spread: 400, y0: 90, yH: 100, size: 0.45, col: 0xffeedd, op: 0.5 },
    { count: 200, spread: 500, y0: 100, yH: 120, size: 0.18, col: 0xaabbff, op: 0.4 },
  ];
  starLayers.forEach(({ count, spread, y0, yH, size, col, op }) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { pos[i*3]=(Math.random()-.5)*spread; pos[i*3+1]=y0+Math.random()*yH; pos[i*3+2]=(Math.random()-.5)*spread; }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: col, size, transparent: true, opacity: op, sizeAttenuation: true })));
  });

  // ── Ground mist — dense low-altitude particles ─────────────────────────────
  const mistGeo = new THREE.BufferGeometry();
  const mPos = new Float32Array(1200 * 3);
  for (let i = 0; i < 1200; i++) { mPos[i*3]=(Math.random()-.5)*160; mPos[i*3+1]=Math.random()*2.5; mPos[i*3+2]=(Math.random()-.5)*160; }
  mistGeo.setAttribute("position", new THREE.BufferAttribute(mPos, 3));
  scene.add(new THREE.Points(mistGeo, new THREE.PointsMaterial({ color: 0x8ab8c8, size: 2.8, transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })));

  // ── El Miro scan beam — slow sweep SpotLight ───────────────────────────────
  const scanBeam = new THREE.SpotLight(0xff2222, 4.0, 80, Math.PI / 14, 0.5, 1.5);
  const [emX, emY, emZ] = latLonToScene(TARGETS[2].lat, TARGETS[2].lon, TARGETS[2].elevM + 12);
  scanBeam.position.set(emX, emY, emZ); scene.add(scanBeam); scene.add(scanBeam.target);
  (scanBeam as any)._isScanBeam = true;

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
  drone.visible = false; // hidden until real OpenSky contact positions it
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

    // ── Drone model hidden until real OpenSky contact detected ───────────────
    // droneTarget is set exclusively by the real OpenSky loiter detector below.
    // No simulated patrol. drone.visible is toggled by updateAircraft() only.
    if (drone.visible) {
      // Hover bob only when a real contact is active
      drone.position.y += Math.sin(t*2.3)*0.35;
    }

    // ── Scan beam rotation ────────────────────────────────────────────────────
    const sb = scanBeam as any;
    if (sb._isScanBeam) {
      const sweepAngle = t * 0.35;
      const sweepR = 35;
      scanBeam.target.position.set(
        emX + Math.sin(sweepAngle) * sweepR,
        emY - 15,
        emZ + Math.cos(sweepAngle) * sweepR
      );
      scanBeam.target.updateMatrixWorld();
      (scanBeam as THREE.SpotLight).intensity = 3.5 + Math.sin(t * 2.1) * 0.8;
    }

    scene.traverse(obj=>{
      if((obj as any)._isPulse){const s=1+Math.sin(t*2)*.5;obj.scale.set(s,1,s);((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.25+Math.sin(t*3)*.25;}
      if((obj as any)._isBeacon)((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.4+Math.sin(t*5)*.6;
      if((obj as any)._isRF!==undefined){const p=(t*.6+(obj as any)._isRF*.4)%1;obj.scale.set(1+p*1.8,1,1+p*1.8);((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.12*(1-p);}
      if((obj as any)._detRing!==undefined)((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.15+Math.sin(t*1.5+(obj as any)._detRing)*.08;
      if((obj as any)._engRing!==undefined)((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.12+Math.sin(t*2.2+(obj as any)._engRing*.7)*.06;
      // Radar arm spins on Y axis (not Z — it's horizontal)
      if((obj as any)._isRotating)obj.rotation.y=t*0.9;
      if((obj as any)._isProp)obj.rotation.y=t*20;
      if((obj as any)._isScanCone)((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.04+Math.sin(t*3)*.04;
      if((obj as any)._isScanRing!==undefined){const p=(t*.4+(obj as any)._isScanRing*.3)%1;obj.scale.set(1+p*1.2,1,1+p*1.2);((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.07*(1-p);}
      if((obj as any)._isPing){const s=1+(Math.sin(t*2.5)*.5+.5)*1.5;obj.scale.set(s,1,s);((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=.6*(1-(s-1)/1.5);}
      if((obj as any)._tdoaNode){obj.rotation.x=t*.8;obj.rotation.z=t*.5;}
      // Radar dome inner glow pulse
      if((obj as any)._isRadarGlow)((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=0.18+Math.sin(t*1.8)*0.12;
      // Drone LED ring breathes teal
      if((obj as any)._isDroneLED)((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setHSL(0.47, 1.0, 0.45+Math.sin(t*3)*0.15);
      // Nav lights blink pattern
      if((obj as any)._isNavLight==="green")((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=t%1.5<0.06?1.0:0.55;
      if((obj as any)._isNavLight==="red")((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=t%1.8<0.07?1.0:0.5;
      if((obj as any)._isNavLight==="strobe"){const s=(t%1.2<0.06||((t+0.07)%1.2<0.06));((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity=s?1.0:0.0;}
      // Belly PointLight pulses with rotor effort
      if((obj as any)._isBellyLight)(obj as THREE.PointLight).intensity=1.2+Math.abs(pitch)*4+Math.sin(t*8)*0.15;
      // Rotor hubs spin fast — alternate CW/CCW like real quad
      if((obj as any)._rotorIdx!==undefined){const dir=(obj as any)._rotorIdx%2===0?1:-1;obj.rotation.y=t*28*dir;}
      // Update quantum shader uTime uniforms
      if(obj instanceof THREE.Mesh){
        const m=obj.material as any;
        if(m?._isTerrainShader&&m.uniforms?.uTime) m.uniforms.uTime.value=t;
        if(m?._isOceanShader&&m.uniforms?.uTime) m.uniforms.uTime.value=t;
      }
    });

    // Ambient particle drift — slow upward float
    const pa=partGeo.attributes.position.array as Float32Array;
    for(let i=0;i<partCount;i++){pa[i*3+1]+=pSpd[i]*0.6;if(pa[i*3+1]>55){pa[i*3+1]=0;pa[i*3]=(Math.random()-.5)*180;pa[i*3+2]=(Math.random()-.5)*180;}}
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
    getCanvas:()=>renderer.domElement,
    focusTarget:(idx:number)=>{const t=TARGETS[idx];if(!t)return;const[x,,z]=latLonToScene(t.lat,t.lon,0);camTarget.set(x,8,z);camDist=45;camElev=.45;},
    updateAircraft:(aircraft:LiveAircraft[])=>{
      const seen=new Set<string>();
      const haversineKm=(la1:number,lo1:number,la2:number,lo2:number)=>{
        const R=6371,dLa=(la2-la1)*Math.PI/180,dLo=(lo2-lo1)*Math.PI/180;
        const a=Math.sin(dLa/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)**2;
        return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
      };
      // Find closest real contact to Jacó center (within 8km) for drone model
      let closestAc: LiveAircraft|null = null;
      let closestDist = Infinity;
      for(const ac of aircraft){
        if(!ac.latitude||!ac.longitude)continue;
        seen.add(ac.icao24);
        const dist = haversineKm(ac.latitude,ac.longitude,CENTER.lat,CENTER.lon);
        if(dist < 8 && dist < closestDist){ closestDist=dist; closestAc=ac; }
        const[ax,,az]=latLonToScene(ac.latitude,ac.longitude,0);
        let mesh=acMeshes.get(ac.icao24);
        if(!mesh){mesh=buildAircraftMesh(ac);acMeshes.set(ac.icao24,mesh);scene.add(mesh);}
        mesh.position.set(ax,acY(ac.baroAltitude??ac.geoAltitude),az);
        if(ac.trueTrack!==null)mesh.rotation.y=(ac.trueTrack*Math.PI)/180;
      }
      // Position drone model on closest real contact; hide when none in AOR
      if(closestAc){
        const[dx,,dz]=latLonToScene(closestAc.latitude!,closestAc.longitude!,0);
        const dAlt = acY(closestAc.baroAltitude??closestAc.geoAltitude);
        drone.position.set(dx, dAlt, dz);
        if(closestAc.trueTrack!==null) drone.rotation.y=(closestAc.trueTrack*Math.PI)/180;
        drone.visible=true;
        // Set droneTarget to nearest landmark
        let nearestLabel="";let nearestDist=Infinity;
        for(const tgt of TARGETS){
          const d=haversineKm(closestAc.latitude!,closestAc.longitude!,tgt.lat,tgt.lon);
          if(d<nearestDist){nearestDist=d;nearestLabel=tgt.label.split("—")[0].trim();}
        }
        if(nearestLabel) setDroneTarget(nearestLabel);
      } else {
        drone.visible=false;
      }
      for(const[id,mesh]of acMeshes.entries())if(!seen.has(id)){scene.remove(mesh);acMeshes.delete(id);}
      setAircraftCount(seen.size);
    },
  };
}

// ─── Panel definitions ────────────────────────────────────────────────────────

const TARGET_COLOR: Record<Target["type"], string> = { observer:"text-cyan-400", crane:"text-amber-400", radar:"text-amber-400", cell:"text-purple-400", ops:"text-orange-400" };
const TARGET_BORDER: Record<Target["type"], string> = { observer:"border-cyan-500/30", crane:"border-amber-500/30", radar:"border-amber-500/30", cell:"border-purple-500/30", ops:"border-orange-500/30" };

// Panel IDs
type PanelId = "targets" | "tdoa" | "adsb" | "layers" | "freq" | "dream" | "oracle";

interface PanelDef { id: PanelId; icon: typeof MapPin; label: string; side: "left"|"right"; accentCls: string; }

const PANELS: PanelDef[] = [
  { id:"targets", icon:MapPin,    label:"Targets",  side:"left",  accentCls:"text-cyan-400   border-cyan-500/40"   },
  { id:"tdoa",    icon:Signal,    label:"TDOA",     side:"left",  accentCls:"text-green-400  border-green-500/40"  },
  { id:"adsb",    icon:Satellite, label:"ADS-B",    side:"right", accentCls:"text-blue-400   border-blue-500/40"   },
  { id:"layers",  icon:Layers,    label:"Layers",   side:"right", accentCls:"text-indigo-400 border-indigo-500/40" },
  { id:"freq",    icon:Activity,  label:"Freq",     side:"right", accentCls:"text-amber-400  border-amber-500/40"  },
  { id:"dream",   icon:Shield,    label:"Threat",   side:"right", accentCls:"text-amber-400    border-amber-500/40"    },
  { id:"oracle",  icon:Moon,      label:"Oracle",   side:"right", accentCls:"text-violet-400 border-violet-500/40" },
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
  const [renderMode, setRenderMode] = useState<"webgpu"|"webgl"|"leaflet"|null>(null);

  // ── Auto-loop detector state ────────────────────────────────────────────────
  const [loopAlert, setLoopAlert] = useState<string|null>(null);
  const visitLog = useRef<{target:string; ts:number}[]>([]);
  const lastLoopCapture = useRef<number>(0);
  const acLoiterLog = useRef<Map<string,{positions:{lat:number;lon:number;ts:number}[];alerted:boolean}>>(new Map());

  const exportPng = useCallback(() => {
    const canvas = sceneRef.current?.getCanvas();
    if (!canvas) return;
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `kappa-tactical-${ts}.png`;
    a.click();
  }, []);

  const printPdf = useCallback(() => {
    const canvas = sceneRef.current?.getCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const ts = new Date().toLocaleString("en-US", { hour12: false });
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>KAPPA Tactical 3D — ${ts}</title>
      <style>
        body{margin:0;background:#06090f;color:#4ade80;font-family:monospace;padding:16px}
        img{width:100%;max-width:100%;display:block;border:1px solid #1a2a3a}
        .meta{font-size:10px;color:#4ade80;margin-bottom:8px;opacity:.8}
        .title{font-size:14px;font-weight:bold;color:#fff;margin-bottom:4px}
        .tags{font-size:9px;color:#666;margin-top:6px}
        @media print{body{padding:0} .noprint{display:none}}
      </style></head><body>
      <div class="title">JACÓ VALLEY — TACTICAL 3D — KAPPA SIGINT</div>
      <div class="meta">Exported: ${ts} CST | Observer: 9.6286°N 84.6298°W | CRANE-ALPHA: 9.6210°N 84.6295°W</div>
      <img src="${dataUrl}" />
      <div class="tags">CRANE-ALPHA LRP CONFIRMED • DAN WAGNER SUSPECT • RELAY TRIANGLE ACTIVE • CLOSED LOOP 14:45–14:54 CST</div>
      <script>window.onload=()=>{window.print()}</script>
    </body></html>`);
    w.document.close();
  }, []);

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

  // 3-Layer AI Oracle state
  const [oracleAnalysis, setOracleAnalysis] = useState<{layer: number; label: string; content: string}[]>([]);
  const [oracleRunning, setOracleRunning] = useState(false);
  const [oracleTs, setOracleTs] = useState<string | null>(null);

  const { data: oskyData, dataUpdatedAt } = useQuery<OpenSkyResponse>({
    queryKey: ["/api/opensky/jaco"], refetchInterval: 30_000, staleTime: 25_000,
  });
  const liveAircraft = oskyData?.states ?? [];

  // ── Ω-Oracle data streams ──────────────────────────────────────────────────
  const { data: oracleData } = useQuery<any>({
    queryKey: ["/api/oracle/conjunction"], refetchInterval: 60_000, staleTime: 55_000,
  });

  const runOracleAnalysis = useCallback(async () => {
    if (oracleRunning) return;
    setOracleRunning(true);
    setOracleAnalysis([]);
    const acSnapshot = liveAircraft.slice(0, 8).map(a =>
      `${a.callsign?.trim()||a.icao24} alt=${a.baroAltitude??a.geoAltitude??'?'}m spd=${a.velocity??'?'}m/s`
    ).join('; ');
    try {
      const res = await fetch('/api/gos/oracle/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          droneTarget,
          aircraftCount,
          acSnapshot,
          kappaScore: oracleData?.kappaBoost ?? 0,
          lunar: oracleData?.lunar?.phaseName ?? 'unknown',
          solarClass: oracleData?.solarClass ?? 'B',
          targets: TARGETS.map(t => `${t.id}:${t.type}`).join(','),
          echoLat: CENTER.lat,
          echoLon: CENTER.lon,
          elMiroDist: '1.91km',
          elMiroAngle: '3.1°',
        }),
      });
      const data = await res.json();
      if (data.layers) {
        setOracleAnalysis(data.layers);
        setOracleTs(new Date().toLocaleTimeString());
      }
    } catch {
      setOracleAnalysis([{ layer: 0, label: 'Error', content: 'Oracle unavailable — check API key' }]);
    } finally {
      setOracleRunning(false);
    }
  }, [oracleRunning, droneTarget, aircraftCount, liveAircraft, oracleData]);
  const { data: tidalData } = useQuery<any>({
    queryKey: ["/api/tidal"], refetchInterval: 120_000, staleTime: 115_000,
  });
  const { data: solarData } = useQuery<any>({
    queryKey: ["/api/proxy/solar-xray"], refetchInterval: 90_000, staleTime: 85_000,
  });

  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(t); },[]);

  // ── ADS-B loop detector: only fires when a confirmed live OpenSky contact is active ──
  // RULE: if liveAircraft is empty, droneTarget is stale state — do NOT log, do NOT
  // screenshot, show an explicit NO-DATA error instead. Zero synthetic detections.
  useEffect(()=>{
    if(!droneTarget) return;
    const now = Date.now();

    // Hard guard: no real contact = no detection. Stale droneTarget must not produce incidents.
    if (!liveAircraft.length) {
      setLoopAlert("NO LIVE ADS-B CONTACT — loop detector suspended");
      setTimeout(()=>setLoopAlert(null), 8_000);
      visitLog.current = []; // clear stale log
      return;
    }

    const COOLDOWN = 90_000;
    if (now - lastLoopCapture.current < COOLDOWN) {
      visitLog.current.push({target: droneTarget, ts: now});
      if (visitLog.current.length > 30) visitLog.current.shift();
      return;
    }
    // Check if this target was visited in the last 20 min (= closed loop)
    const prior = visitLog.current.filter(v => v.target === droneTarget && now - v.ts < 20 * 60_000);
    if (prior.length > 0) {
      const loopDurSec = Math.round((now - prior[prior.length-1].ts) / 1000);
      const label = `ADS-B LOOP — ${droneTarget} — ${Math.round(loopDurSec/60)}m circuit — ICAO: ${liveAircraft[0]?.icao24 ?? "?"}`;
      setLoopAlert(label);
      lastLoopCapture.current = now;
      // Log incident — real contact only, no auto-screenshot
      const ac = liveAircraft[0];
      fetch("/api/incidents", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          title: `ADS-B Loop — ${droneTarget} — ${loopDurSec}s — ICAO ${ac?.icao24 ?? "unknown"}`,
          description: `Real ADS-B contact (ICAO: ${ac?.icao24 ?? "unknown"}, callsign: ${ac?.callsign ?? "none"}, origin: ${ac?.originCountry ?? "?"}) detected returning to "${droneTarget}" after ${loopDurSec}s. Alt: ${Math.round(ac?.baroAltitude ?? ac?.geoAltitude ?? 0)}m, speed: ${Math.round(ac?.velocity ?? 0)}m/s. Circuit path: ${[...new Set(visitLog.current.slice(-8).map(v=>v.target))].join(" → ")}. OpenSky confirmed ${liveAircraft.length} contact(s) in AOR at time of detection. No ADS-B = no incident.`,
          severity: 4, category: "drone",
          lat: ac?.latitude ?? 9.621, lng: ac?.longitude ?? -84.6295,
          tags: ["ads-b-confirmed","loop","real-aircraft",ac?.icao24 ?? "unknown",(ac?.callsign ?? "").toLowerCase().trim(),"no-simulation"],
        }),
      }).catch(()=>{});
      setTimeout(()=>setLoopAlert(null), 30_000);
    }
    visitLog.current.push({target: droneTarget, ts: now});
    if (visitLog.current.length > 30) visitLog.current.shift();
  }, [droneTarget, liveAircraft]);

  // ── OpenSky loiter detector: real aircraft circling Jacó ─────────────────────
  useEffect(()=>{
    if (!liveAircraft.length) return;
    const now = Date.now();
    const LOITER_RADIUS_KM = 5;
    const LOITER_MIN_PASSES = 3;
    const haversineKm = (la1:number,lo1:number,la2:number,lo2:number)=>{
      const R=6371,dLa=(la2-la1)*Math.PI/180,dLo=(lo2-lo1)*Math.PI/180;
      const a=Math.sin(dLa/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)**2;
      return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    };
    for (const ac of liveAircraft) {
      if (!ac.latitude || !ac.longitude) continue;
      const log = acLoiterLog.current.get(ac.icao24) ?? {positions:[], alerted:false};
      log.positions.push({lat:ac.latitude, lon:ac.longitude, ts:now});
      // Keep 20 min window
      log.positions = log.positions.filter(p=>now-p.ts<20*60_000);
      acLoiterLog.current.set(ac.icao24, log);
      if (log.alerted || log.positions.length < LOITER_MIN_PASSES) continue;
      // Check if all positions are within LOITER_RADIUS_KM of Jacó center
      const allNear = log.positions.every(p=>haversineKm(p.lat,p.lon,CENTER.lat,CENTER.lon)<LOITER_RADIUS_KM);
      if (allNear && !log.alerted) {
        log.alerted = true;
        const call = (ac as any).callsign?.trim() || ac.icao24;
        const alt = ac.baroAltitude ?? ac.geoAltitude ?? 0;
        setLoopAlert(`ADS-B LOITER: ${call} (${ac.icao24}) — ${log.positions.length} passes <${LOITER_RADIUS_KM}km / ${Math.round(alt)}m`);
        // No auto-screenshot — manual export only
        fetch("/api/incidents", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({
            title: `ADS-B Loiter — ${call} (ICAO: ${ac.icao24}) — ${log.positions.length} passes`,
            description: `Real ADS-B aircraft ${call} (ICAO: ${ac.icao24}, origin: ${ac.originCountry}) detected loitering over Jacó AOR. ${log.positions.length} confirmed position reports within ${LOITER_RADIUS_KM}km of CENTER over 20min window. Alt: ${Math.round(alt)}m, speed: ${Math.round((ac as any).velocity??0)}m/s. OpenSky-verified contact — not simulated. Use manual export button for screenshot.`,
            severity: 4, category: "drone",
            lat: ac.latitude, lng: ac.longitude,
            tags: ["ads-b-confirmed","loiter","real-aircraft",ac.icao24,call.toLowerCase(),"no-simulation"],
          }),
        }).catch(()=>{});
        setTimeout(()=>setLoopAlert(null), 30_000);
      }
    }
  }, [liveAircraft]);

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
    const el = containerRef.current;
    let cancelled = false;
    let cleanup: (()=>void) | null = null;

    // Try WebGPU first; fall back to Three.js (WebGL) if unavailable
    const wgpuTargets: WGPUSceneTarget[] = TARGETS.map(t => ({
      id: t.id, label: t.label, lat: t.lat, lon: t.lon, elevM: t.elevM,
      type: t.type, color: t.color,
    }));

    buildWebGPUScene(el, wgpuTargets, elevData, setDroneTarget, setAircraftCount)
      .then(handle => {
        if (cancelled) { handle?.destroy(); return; }
        if (handle) {
          sceneRef.current = handle as unknown as ReturnType<typeof createScene>;
          setRenderMode("webgpu");
          cleanup = () => handle.destroy();
        } else {
          // WebGPU unavailable — try Three.js / WebGL
          const s = createScene(el, elevData, setHoveredTarget, setDroneTarget, setAircraftCount);
          if (s) {
            sceneRef.current = s;
            setRenderMode("webgl");
            cleanup = () => s.destroy();
          } else {
            // WebGL also unavailable — fall back to Leaflet 2D map
            setRenderMode("leaflet");
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        const s = createScene(el, elevData, setHoveredTarget, setDroneTarget, setAircraftCount);
        if (s) {
          sceneRef.current = s;
          setRenderMode("webgl");
          cleanup = () => s.destroy();
        } else {
          setRenderMode("leaflet");
        }
      });

    return () => {
      cancelled = true;
      cleanup?.();
      sceneRef.current = null;
    };
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
            <div className="text-[10px] text-gray-500 font-mono mt-0.5 ml-5 flex items-center gap-1.5">
              {t.lat.toFixed(4)}°N {Math.abs(t.lon).toFixed(4)}°W · +{t.elevM}m
              {t.id === "hermosa" && (
                <span className="inline-flex items-center gap-0.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 rounded px-1 py-0 text-[9px] font-bold tracking-wider">
                  7.3km SSW · PLAYA HERMOSA
                </span>
              )}
            </div>
          </button>
        ))}
        <div className="border-t border-white/8 pt-2 space-y-1.5 mt-1">
          <div className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-amber-400 shrink-0"/><span className="text-[10px] text-amber-300 font-mono">CRANE — GRIDTIDE C2 SUSPECTED</span></div>
          <div className="flex items-center gap-2"><Radio className="h-3 w-3 text-amber-400 shrink-0"/><span className="text-[10px] text-amber-300 font-mono">EL MIRO — FULL VALLEY LOS + DEW</span></div>
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
          <Badge className={`text-[9px] px-1.5 py-0 ${aircraftCount>0?"bg-amber-500/15 text-amber-400 border-amber-500/30":"bg-gray-700 text-gray-500 border-gray-700"}`}>
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
              {tab==="log"&&acEvents.length>0&&<span className="ml-0.5 text-[8px] text-amber-400">{acEvents.length}</span>}
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
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"/>
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Active threat — Jacó AOR</span>
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
          <div key={k} className="flex gap-3 py-1 border-b border-amber-500/10">
            <span className="text-[10px] font-mono text-gray-600 w-20 shrink-0">{k}</span>
            <span className="text-[10px] font-mono text-amber-300">{v}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-amber-500/20 text-[10px] font-mono text-amber-400">
          KAPPA Rule #23 — correlation +18 Kappa Score
        </div>
      </div>
    );

    // ── ORACLE — lunar / tidal / solar / sonic / Willow scan / GOS lattice ──
    if (id === "oracle") {
      const lunar  = oracleData?.lunar;
      const jup    = oracleData?.jupiter;
      const sonic  = oracleData?.sonic;
      const latt   = lunar?.gosLattice;
      const conj   = oracleData?.conjunctions ?? [];

      // Willow confidence: composite of all oracle streams
      const willowScore = Math.min(100,
        (lunar?.tychoWindow ? 25 : 0) +
        (latt?.latticeOk ? 20 : 0) +
        (jup?.jovianWindow ? 20 : 0) +
        (sonic?.blueCount > 0 ? 15 : 0) +
        ((sonic?.alignmentScore ?? 0) * 0.2)
      );
      const willowActive = willowScore >= 35;

      const xClass   = solarData?.xrayClass ?? "?";
      const xLabel   = solarData?.label ?? "—";
      const flare    = solarData?.flare ?? false;
      const tidalH   = tidalData?.heightM;
      const tidalTr  = tidalData?.trend ?? 0;

      return (
        <div className="space-y-5" data-testid="oracle-panel">

          {/* ── Conjunction alerts ───────────────────────────────────────── */}
          {conj.length > 0 && (
            <div className="space-y-1">
              {conj.map((c: string) => (
                <div key={c} className="flex items-center gap-2 px-2 py-1.5 rounded bg-violet-500/10 border border-violet-500/25">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse shrink-0"/>
                  <span className="text-[9px] font-mono text-violet-300">{c}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── SEGMENT 1: LUNAR / TYCHO ─────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Moon className="h-3 w-3 text-violet-400"/>
              <span className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest">Lunar / Tycho</span>
            </div>
            {lunar ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{lunar.phaseGlyph}</span>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-white">{lunar.phaseName}</div>
                    <div className="text-[9px] font-mono text-gray-500">{(lunar.illumination * 100).toFixed(0)}% lit · {lunar.ageDays.toFixed(1)}d old</div>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width:`${lunar.illumination*100}%` }}/>
                </div>
                <div className="flex gap-2 text-[9px] font-mono">
                  <span className="text-gray-600">Alt</span><span className="text-gray-400">{lunar.altDeg.toFixed(0)}°</span>
                  <span className="text-gray-600">Az</span><span className="text-gray-400">{lunar.azDeg.toFixed(0)}°</span>
                  <span className="text-gray-600">{(lunar.distanceKm/1000).toFixed(0)}k km</span>
                </div>
                <div className={`px-2 py-1.5 rounded border text-[9px] font-mono ${lunar.tychoWindow ? "bg-violet-500/15 border-violet-500/40 text-violet-300" : "bg-gray-900/50 border-gray-700/30 text-gray-600"}`}>
                  {lunar.tychoReason}
                </div>
                {lunar.springTide && (
                  <div className="text-[9px] font-mono text-amber-400">⚡ SPRING TIDE — gravitational peak</div>
                )}
              </div>
            ) : (
              <div className="text-[9px] font-mono text-gray-700 animate-pulse">computing lunar ephemeris…</div>
            )}
          </div>

          {/* ── SEGMENT 2: TIDAL / OCEAN ─────────────────────────────────── */}
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Waves className="h-3 w-3 text-blue-400"/>
              <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest">Tidal / Ocean</span>
              {tidalData?.source === "harmonic-model" && <span className="text-[8px] font-mono text-gray-600 ml-auto">harmonic</span>}
            </div>
            {tidalH != null ? (
              <div className="space-y-1.5">
                <div className="flex items-end gap-2">
                  <span className="text-xl font-mono text-blue-300">{tidalH.toFixed(2)}<span className="text-xs text-gray-600">m</span></span>
                  <span className={`text-[10px] font-mono ${tidalTr > 0 ? "text-green-400" : tidalTr < 0 ? "text-amber-400" : "text-gray-600"}`}>
                    {tidalTr > 0 ? "▲ flood" : tidalTr < 0 ? "▼ ebb" : "— slack"}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500/70 rounded-full" style={{ width:`${Math.min(100,Math.max(0,(tidalH/2.5)*100))}%` }}/>
                </div>
                <div className="text-[9px] font-mono text-gray-600">{tidalData.station === "fallback" ? "M2+S2+K1+O1 model" : `NOAA ${tidalData.station}`}</div>
              </div>
            ) : (
              <div className="text-[9px] font-mono text-gray-700 animate-pulse">fetching tidal data…</div>
            )}
          </div>

          {/* ── SEGMENT 3: SOLAR / X-RAY ─────────────────────────────────── */}
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sun className="h-3 w-3 text-amber-400"/>
              <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest">Solar / X-Ray</span>
              {flare && <span className="text-[8px] font-mono text-amber-400 animate-pulse ml-auto">FLARE</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-mono font-bold ${xClass==="X"?"text-amber-400":xClass==="M"?"text-orange-400":xClass==="C"?"text-amber-400":"text-gray-500"}`}>{xLabel}</span>
              <div className="text-[9px] font-mono text-gray-600">GOES-Primary · SWPC</div>
            </div>
          </div>

          {/* ── SEGMENT 4: SONIC ALIGNMENT (KiwiSDR) ─────────────────────── */}
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Radio className="h-3 w-3 text-green-400"/>
              <span className="text-[9px] font-mono font-bold text-green-400 uppercase tracking-widest">Sonic Alignment · KiwiSDR</span>
            </div>
            {sonic ? (
              <div className="space-y-1">
                <div className="flex gap-3 mb-2">
                  <div className="text-center">
                    <div className="text-sm font-mono text-green-400">{sonic.alignmentScore.toFixed(0)}%</div>
                    <div className="text-[8px] font-mono text-gray-600">score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-mono text-blue-400">{sonic.blueCount}</div>
                    <div className="text-[8px] font-mono text-gray-600">450nm</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-mono text-violet-400">{sonic.gosCount}</div>
                    <div className="text-[8px] font-mono text-gray-600">GOS locks</div>
                  </div>
                </div>
                {/* Per-frequency rows */}
                <div className="space-y-0.5">
                  {(sonic.targets ?? []).filter((t: any) => t.gos).map((t: any) => (
                    <div key={t.hz} className={`flex items-center justify-between px-2 py-0.5 rounded text-[9px] font-mono ${t.blue ? "bg-blue-500/10 border border-blue-500/20" : "bg-gray-900/30"}`}>
                      <span className={t.detected ? (t.blue ? "text-blue-300" : "text-green-400") : "text-gray-700"}>
                        {t.detected ? "●" : "○"} {t.label}
                      </span>
                      <span className="text-gray-600">{t.hz < 1000 ? `${t.hz}Hz` : `${(t.hz/1000).toFixed(1)}kHz`}</span>
                    </div>
                  ))}
                </div>
                {sonic.blueCount > 0 && (
                  <div className="mt-2 px-2 py-1.5 rounded bg-blue-500/10 border border-blue-500/30 text-[9px] font-mono text-blue-300">
                    ⚡ 450nm / 666.44 THz sonic mirror active · Rev 13:18 resonance · GF(53): {666%53}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[9px] font-mono text-gray-700 animate-pulse">awaiting KiwiSDR scan cycle…</div>
            )}
          </div>

          {/* ── SEGMENT 5: WILLOW SCAN — sonar passive sweep ─────────────── */}
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center gap-1.5 mb-3">
              <FlaskConical className="h-3 w-3 text-cyan-400"/>
              <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Willow Scan</span>
              <span className="text-[8px] font-mono text-gray-600 ml-auto">passive sonar</span>
            </div>
            {/* Sonar display */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Sonar rings */}
                {[1, 0.7, 0.45, 0.25].map((s, i) => (
                  <div key={i} className={`absolute rounded-full border ${willowActive && i === 0 ? "border-cyan-400/60 animate-ping" : "border-cyan-500/15"}`}
                    style={{ width:`${s*100}%`, height:`${s*100}%` }}/>
                ))}
                {/* Sweep line */}
                <div className="absolute w-1/2 h-px bg-gradient-to-r from-transparent to-cyan-400/60 origin-left animate-spin"
                  style={{ animationDuration:"3s" }}/>
                {/* Center dot */}
                <div className={`h-2 w-2 rounded-full ${willowActive ? "bg-cyan-400 animate-pulse" : "bg-gray-700"} z-10`}/>
                {/* Fish — Willow signal */}
                {willowActive && (
                  <div className="absolute text-[10px] animate-bounce" style={{ top:"22%", left:"58%" }}>🐟</div>
                )}
              </div>
              {/* Confidence bar */}
              <div className="w-full">
                <div className="flex justify-between text-[9px] font-mono mb-1">
                  <span className={willowActive ? "text-cyan-400" : "text-gray-600"}>
                    {willowActive ? "SIGNAL DETECTED" : "SCANNING..."}
                  </span>
                  <span className="text-gray-600">{willowScore.toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${willowScore>60?"bg-cyan-400":willowScore>35?"bg-cyan-600":"bg-gray-700"}`}
                    style={{ width:`${willowScore}%` }}/>
                </div>
              </div>
              <div className="text-[8px] font-mono text-gray-700 text-center leading-relaxed">
                Tycho·Jovian·GOS·450nm·tidal<br/>
                Google Willow 128q entanglement hypothesis
              </div>
            </div>
          </div>

          {/* ── SEGMENT 6: GOS LATTICE ───────────────────────────────────── */}
          {latt && (
            <div className="border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="h-3 w-3 text-yellow-400"/>
                <span className="text-[9px] font-mono font-bold text-yellow-400 uppercase tracking-widest">GOS Lattice</span>
                <span className={`ml-auto text-[8px] font-mono px-1.5 py-0.5 rounded ${latt.latticeOk ? "text-green-400 bg-green-400/10" : "text-amber-400 bg-amber-400/10"}`}>
                  {latt.latticeOk ? "LOCKED" : "SLIP"}
                </span>
              </div>
              <div className="space-y-0.5">
                {(latt.checks ?? []).map((c: any) => (
                  <div key={c.name} className="flex items-center justify-between text-[9px] font-mono">
                    <span className={c.ok ? (c.name.includes("666")||c.name.includes("450") ? "text-blue-400" : "text-gray-400") : "text-gray-700"}>{c.name}</span>
                    <span className={c.ok ? "text-green-400" : "text-amber-500/60"}>
                      {c.ok ? "✓" : "✗"} {c.computed.toFixed(4)}{c.unit}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[8px] font-mono text-gray-700 leading-relaxed">{latt.revelationNote}</div>
            </div>
          )}

          {/* ── PHENOMENON LOG ───────────────────────────────────────────── */}
          {(sonic?.phenomenonLog?.length > 0 || oracleData?.kappaBoost > 0) && (
            <div className="border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3 w-3 text-gray-500"/>
                <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Phenomenon Log</span>
                <span className="text-[8px] font-mono text-gray-700 ml-auto italic">// like a good ghost hunter</span>
              </div>
              <div className="space-y-1">
                {oracleData?.kappaBoost > 0 && (
                  <div className="text-[9px] font-mono text-violet-400/80">κ-boost +{oracleData.kappaBoost} from oracle conjunctions</div>
                )}
                {(sonic?.phenomenonLog ?? []).map((p: any, i: number) => (
                  <div key={i} className={`px-2 py-1 rounded border text-[9px] font-mono ${p.confidence==="corroborated"?"border-violet-500/30 bg-violet-500/8":p.confidence==="probable"?"border-blue-500/20 bg-blue-500/5":"border-gray-700/30 bg-transparent"}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={p.confidence==="corroborated"?"text-violet-400":p.confidence==="probable"?"text-blue-400":"text-gray-600"}>
                        {p.type.replace("_"," ")}
                      </span>
                      <span className="text-gray-700 ml-auto">{p.confidence}</span>
                    </div>
                    <div className="text-gray-500 leading-tight">{p.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ── 3-LAYER AI ORACLE ────────────────────────────────────────── */}
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Cpu className="h-3 w-3 text-violet-400"/>
              <span className="text-[9px] font-mono font-bold text-violet-400 uppercase tracking-widest">3-Layer AI Oracle</span>
              {oracleTs && <span className="text-[8px] font-mono text-gray-600 ml-auto">{oracleTs}</span>}
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={oracleRunning}
              onClick={runOracleAnalysis}
              data-testid="button-oracle-analyze"
              className="w-full h-6 text-[9px] font-mono border-violet-500/30 text-violet-300 hover:bg-violet-500/10 mb-2"
            >
              {oracleRunning ? (
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse"/>Analyzing…</span>
              ) : '⟁ Run Scene Analysis'}
            </Button>
            {oracleAnalysis.length > 0 && (
              <div className="space-y-2">
                {oracleAnalysis.map((item, i) => (
                  <div key={i} className={`px-2 py-2 rounded border text-[9px] font-mono ${
                    item.layer === 3 ? 'border-violet-500/40 bg-violet-500/8' :
                    item.layer === 2 ? 'border-amber-500/30 bg-amber-500/5' :
                    'border-gray-700/30 bg-transparent'
                  }`}>
                    <div className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${
                      item.layer === 3 ? 'text-violet-400' :
                      item.layer === 2 ? 'text-amber-400' : 'text-gray-500'
                    }`}>L{item.layer} · {item.label}</div>
                    <div className="text-gray-300 leading-snug whitespace-pre-wrap">{item.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      );
    }

    return null;
  };

  const leftPanels = PANELS.filter(p=>p.side==="left");
  const rightPanels = PANELS.filter(p=>p.side==="right");
  const mobilePanelDef = PANELS.find(p=>p.id===activeMobile);

  return (
    <div className="relative w-full h-full bg-[#020a12] overflow-hidden select-none" data-testid="page-jaco-map">
      {/* 3D canvas — always full screen (hidden when leaflet mode active) */}
      <div ref={containerRef} className={`absolute inset-0 touch-none ${renderMode === "leaflet" ? "hidden" : ""}`} data-testid="canvas-jaco-3d"/>

      {/* Leaflet 2D fallback map */}
      {renderMode === "leaflet" && (
        <div className="absolute inset-0" data-testid="leaflet-fallback-map">
          <MapContainer
            center={[CENTER.lat, CENTER.lon]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {TARGETS.map(t => {
              const colorHex = "#" + t.color.toString(16).padStart(6, "0");
              const icon = new L.DivIcon({
                html: `<div style="background:${colorHex};width:14px;height:14px;border-radius:${t.type==="radar"?"3px":"50%"};border:2px solid white;box-shadow:0 0 6px ${colorHex}80;"></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7],
                className: "",
              });
              return (
                <Marker key={t.id} position={[t.lat, t.lon]} icon={icon}>
                  <Popup>
                    <div className="text-sm">
                      <strong>{t.label.split("—")[0].trim()}</strong>
                      <br />
                      <span className="text-xs text-gray-600">{t.desc}</span>
                      <br />
                      <span className="text-xs font-mono">{t.lat.toFixed(5)}°N, {Math.abs(t.lon).toFixed(5)}°W · +{t.elevM}m</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {DET_LAYERS.map((l) => (
              <Circle
                key={l.label}
                center={[TARGETS[0].lat, TARGETS[0].lon]}
                radius={l.range}
                pathOptions={{ color: "#" + l.color.toString(16).padStart(6,"0"), fillColor: "#" + l.color.toString(16).padStart(6,"0"), fillOpacity: l.opacity * 0.5, weight: 1, dashArray: "4 4" }}
              />
            ))}
            {ENGAGE_LAYERS.map((l) => (
              <Circle
                key={l.label}
                center={[TARGETS[2].lat, TARGETS[2].lon]}
                radius={l.range}
                pathOptions={{ color: "#" + l.color.toString(16).padStart(6,"0"), fillColor: "#" + l.color.toString(16).padStart(6,"0"), fillOpacity: l.opacity * 0.4, weight: 1 }}
              />
            ))}
            {liveAircraft.filter(ac => ac.latitude != null && ac.longitude != null).map(ac => {
              const altM = ac.baroAltitude ?? ac.geoAltitude ?? null;
              const spdMs = ac.velocity ?? null;
              const heading = ac.trueTrack ?? 0;
              const threatLevel =
                altM === null ? "UNKNOWN" :
                altM < 500  ? "HIGH" :
                altM < 2000 ? "MEDIUM" : "LOW";
              const threatColor =
                threatLevel === "HIGH"    ? "#ef4444" :
                threatLevel === "MEDIUM"  ? "#f97316" :
                threatLevel === "UNKNOWN" ? "#6b7280" : "#22c55e";
              const aircraftIcon = new L.DivIcon({
                html: `<div style="
                  transform: rotate(${heading}deg);
                  font-size: 18px;
                  line-height: 1;
                  filter: drop-shadow(0 0 4px ${threatColor});
                  color: ${threatColor};
                ">✈</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                className: "",
              });
              const callsign = ac.callsign?.trim() || ac.icao24;
              const altStr = altM !== null ? `${Math.round(altM)} m` : "—";
              const spdStr = spdMs !== null ? `${Math.round(spdMs * 1.944)} kt` : "—";
              return (
                <Marker
                  key={ac.icao24}
                  position={[ac.latitude, ac.longitude]}
                  icon={aircraftIcon}
                >
                  <Popup>
                    <div style={{ fontFamily: "monospace", fontSize: "12px", minWidth: "160px" }}>
                      <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>
                        ✈ {callsign}
                      </div>
                      <div>ICAO: <strong>{ac.icao24.toUpperCase()}</strong></div>
                      <div>Origin: {ac.originCountry || "—"}</div>
                      <div>Altitude: <strong>{altStr}</strong></div>
                      <div>Speed: <strong>{spdStr}</strong></div>
                      <div>Heading: {heading ? `${Math.round(heading)}°` : "—"}</div>
                      {ac.squawk && <div>Squawk: {ac.squawk}</div>}
                      <div style={{ marginTop: "6px" }}>
                        Threat:{" "}
                        <span style={{ color: threatColor, fontWeight: "bold" }}>
                          {threatLevel}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
          {/* Fallback banner */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none" data-testid="leaflet-fallback-banner">
            <div className="bg-amber-900/90 border border-amber-500/60 rounded-lg px-4 py-2 text-xs font-mono text-amber-200 flex items-center gap-2 shadow-lg backdrop-blur-sm">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              3D rendering unavailable — showing 2D overlay map
            </div>
          </div>
        </div>
      )}

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
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0"/>
          <div className="min-w-0">
            <div className="text-[11px] font-mono font-bold text-white truncate leading-tight">JACÓ VALLEY — TACTICAL 3D</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[9px] font-mono px-1 rounded ${elevStatus==="ok"?"text-green-400":"text-amber-400"}`}>
                {elevStatus==="ok"?"● SRTM":"△ PROC"}
              </span>
              {renderMode && (
                <span className={`text-[9px] font-mono px-1 rounded border ${
                  renderMode==="webgpu" ? "text-violet-300 border-violet-500/40 bg-violet-500/10" :
                  renderMode==="leaflet" ? "text-amber-400 border-amber-500/40 bg-amber-500/10" :
                  "text-gray-500 border-gray-700/40"
                }`}>
                  {renderMode==="webgpu" ? "⬡ WebGPU" : renderMode==="leaflet" ? "◻ 2D Map" : "◻ WebGL"}
                </span>
              )}
              <span className={`text-[9px] font-mono px-1 rounded ${aircraftCount>0?"text-amber-400":"text-gray-600"}`}>
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
          <div className="flex gap-1 items-center">
            {loopAlert && (
              <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/40 rounded px-2 py-0.5 animate-pulse mr-1">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0"/>
                <span className="text-[9px] font-mono text-orange-300 max-w-48 truncate">{loopAlert}</span>
              </div>
            )}
            <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-green-400 hover:bg-green-500/10" onClick={exportPng} title="Export PNG" data-testid="button-export-png"><Download className="h-3.5 w-3.5"/></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10" onClick={printPdf} title="Print / Save PDF" data-testid="button-print-pdf"><Printer className="h-3.5 w-3.5"/></Button>
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
