import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Radio, RotateCcw, ZoomIn, ZoomOut, Crosshair,
  AlertTriangle, Wifi, Eye, Antenna, MapPin, Layers,
} from "lucide-react";

const CENTER = { lat: 9.6196, lon: -84.6282 };
const METERS_PER_DEG_LAT = 111320;
const METERS_PER_DEG_LON = 111320 * Math.cos(CENTER.lat * Math.PI / 180);
const SCENE_SCALE = 80; // 1 unit = SCENE_SCALE metres

function latLonToScene(lat: number, lon: number, elevM = 0): [number, number, number] {
  const x = ((lon - CENTER.lon) * METERS_PER_DEG_LON) / SCENE_SCALE;
  const z = -((lat - CENTER.lat) * METERS_PER_DEG_LAT) / SCENE_SCALE;
  const y = elevM / SCENE_SCALE;
  return [x, y, z];
}

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
        // Procedural fallback matching Jacó geography:
        // Flat coastal strip in west, hills rising to east
        const distFromCoast = (lon - gridLon0) / (gridLon1 - gridLon0);
        const hillShape = Math.max(0, (distFromCoast - 0.45)) * 2.2;
        const noise =
          Math.sin(lat * 420) * Math.cos(lon * 380) * 8 +
          Math.sin(lat * 210 + 1.2) * Math.cos(lon * 190 + 0.7) * 15 +
          Math.sin(lat * 80) * Math.cos(lon * 90) * 5;
        elev = Math.max(0, hillShape * 180 + noise + 3);
        // El Miro hill bump
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

  const mat = new THREE.MeshStandardMaterial({
    color: 0x2d5a1b,
    roughness: 0.9,
    metalness: 0.05,
    vertexColors: false,
  });

  // Load ESRI satellite tile via our proxy
  loader.load(
    "/api/terrain/tile/13/3876/2170",
    (tex) => {
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      mat.map = tex;
      mat.color.set(0xffffff);
      mat.needsUpdate = true;
    },
    undefined,
    () => { /* fallback to green */ },
  );

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Ocean plane (west)
  const oceanGeo = new THREE.PlaneGeometry(60, SIZE);
  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x003366,
    emissive: 0x001133,
    emissiveIntensity: 0.3,
    roughness: 0.05,
    metalness: 0.4,
    transparent: true,
    opacity: 0.82,
  });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(-70, 0.05, 0);
  scene.add(ocean);

  // Grid overlay
  const grid = new THREE.GridHelper(SIZE, 48, 0x112233, 0x0a1522);
  grid.position.y = 0.15;
  scene.add(grid);

  return mesh;
}

function buildLandmark(scene: THREE.Scene, t: Target): THREE.Group {
  const [x, baseY, z] = latLonToScene(t.lat, t.lon, t.elevM);
  const group = new THREE.Group();
  group.position.set(x, baseY, z);

  if (t.type === "observer") {
    // Hotel block
    const hotelGeo = new THREE.BoxGeometry(3, 4, 2.5);
    const hotelMat = new THREE.MeshStandardMaterial({
      color: 0x112233, emissive: 0x00ffcc, emissiveIntensity: 0.15,
      roughness: 0.4, metalness: 0.5, transparent: true, opacity: 0.9,
    });
    const hotel = new THREE.Mesh(hotelGeo, hotelMat);
    hotel.position.y = 2;
    hotel.castShadow = true;
    group.add(hotel);
    const edgeGeo = new THREE.EdgesGeometry(hotelGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: t.color, transparent: true, opacity: 0.7 });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.position.y = 2;
    group.add(edges);

    // Pulse ring
    const pulseGeo = new THREE.RingGeometry(3, 3.5, 32);
    const pulseMat = new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    pulse.rotation.x = -Math.PI / 2;
    pulse.position.y = 0.1;
    (pulse as any)._isPulse = true;
    group.add(pulse);
  }

  if (t.type === "crane") {
    // Crane mast
    const mastGeo = new THREE.CylinderGeometry(0.2, 0.3, 18, 6);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xdd8800, metalness: 0.8, roughness: 0.2 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 9;
    mast.castShadow = true;
    group.add(mast);
    // Jib arm
    const jibGeo = new THREE.BoxGeometry(14, 0.3, 0.3);
    const jibMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.7, roughness: 0.3 });
    const jib = new THREE.Mesh(jibGeo, jibMat);
    jib.position.set(4, 18.2, 0);
    group.add(jib);
    // Counter jib
    const cjibGeo = new THREE.BoxGeometry(5, 0.3, 0.3);
    const cjib = new THREE.Mesh(cjibGeo, jibMat);
    cjib.position.set(-3.5, 18.2, 0);
    group.add(cjib);
    // Suspicion dome on top
    const domeGeo = new THREE.SphereGeometry(0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.1 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 18.8;
    group.add(dome);
    // Warning light
    const warnGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const warnMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true });
    const warn = new THREE.Mesh(warnGeo, warnMat);
    warn.position.y = 19.5;
    (warn as any)._isBeacon = true;
    group.add(warn);
    // RF rings from crane
    for (let i = 0; i < 3; i++) {
      const rfGeo = new THREE.RingGeometry(2 + i * 5, 2.4 + i * 5, 48);
      const rfMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
      const rf = new THREE.Mesh(rfGeo, rfMat);
      rf.rotation.x = -Math.PI / 2;
      rf.position.y = 18 - i * 0.5;
      (rf as any)._isRF = i;
      group.add(rf);
    }
  }

  if (t.type === "radar") {
    // Hill mast
    const mastGeo = new THREE.CylinderGeometry(0.15, 0.25, 8, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.8, roughness: 0.2 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 4;
    group.add(mast);
    // Radar dome (Radome)
    const domeGeo = new THREE.SphereGeometry(1.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xeeeef5, metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.85 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 8.2;
    group.add(dome);
    const domeBaseMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, metalness: 0.4 });
    const domeBaseGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.4, 16);
    const domeBase = new THREE.Mesh(domeBaseGeo, domeBaseMat);
    domeBase.position.y = 8.0;
    group.add(domeBase);
    // Dish inside dome (visible)
    const dishGeo = new THREE.ConeGeometry(1.0, 0.5, 16, 1, true);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x2244ff, emissiveIntensity: 0.4, side: THREE.DoubleSide });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.y = 8.4;
    dish.rotation.x = Math.PI / 2;
    (dish as any)._isRotating = true;
    group.add(dish);
    // Radar sweep
    for (let i = 0; i < 3; i++) {
      const sweepGeo = new THREE.RingGeometry(3 + i * 6, 3.4 + i * 6, 48);
      const sweepMat = new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
      const sweep = new THREE.Mesh(sweepGeo, sweepMat);
      sweep.rotation.x = -Math.PI / 2;
      sweep.position.y = 8;
      (sweep as any)._isRF = i;
      group.add(sweep);
    }
    // Building
    const bldGeo = new THREE.BoxGeometry(4, 2.5, 3);
    const bldMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.8 });
    const bld = new THREE.Mesh(bldGeo, bldMat);
    bld.position.y = 1.25;
    group.add(bld);
  }

  if (t.type === "cell") {
    // Cell tower lattice structure
    const mastGeo = new THREE.CylinderGeometry(0.18, 0.35, 28, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.85, roughness: 0.15 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 14;
    mast.castShadow = true;
    group.add(mast);
    // Cross-arms with panel antennas
    for (let h = 0; h < 3; h++) {
      for (let a = 0; a < 3; a++) {
        const angle = (a / 3) * Math.PI * 2;
        const armGeo = new THREE.BoxGeometry(3, 0.1, 0.1);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x666677 });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(Math.cos(angle) * 1.5, 22 + h * 2, Math.sin(angle) * 1.5);
        arm.rotation.y = angle;
        group.add(arm);
        const panelGeo = new THREE.BoxGeometry(0.15, 1.2, 0.4);
        const panelMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, emissive: 0xaa44ff, emissiveIntensity: 0.15 });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(Math.cos(angle) * 3.2, 22 + h * 2, Math.sin(angle) * 3.2);
        group.add(panel);
      }
    }
    const beaconGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 28.5;
    (beacon as any)._isBeacon = true;
    group.add(beacon);
    // Cell ring pulses
    for (let i = 0; i < 3; i++) {
      const rfGeo = new THREE.RingGeometry(4 + i * 7, 4.5 + i * 7, 48);
      const rfMat = new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
      const rf = new THREE.Mesh(rfGeo, rfMat);
      rf.rotation.x = -Math.PI / 2;
      rf.position.y = 20;
      (rf as any)._isRF = i;
      group.add(rf);
    }
  }

  if (t.type === "ops") {
    // Low residential complex
    const bldGeo = new THREE.BoxGeometry(8, 5, 12);
    const bldMat = new THREE.MeshStandardMaterial({
      color: 0x1a0a2e, emissive: 0xff6644, emissiveIntensity: 0.08,
      roughness: 0.5, metalness: 0.4, transparent: true, opacity: 0.85,
    });
    const bld = new THREE.Mesh(bldGeo, bldMat);
    bld.position.y = 2.5;
    group.add(bld);
    const edgeGeo = new THREE.EdgesGeometry(bldGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: t.color, transparent: true, opacity: 0.4 });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.position.y = 2.5;
    group.add(edges);
    // Hidden antenna on roof
    const antGeo = new THREE.CylinderGeometry(0.05, 0.05, 3, 6);
    const antMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.set(2, 6.5, 3);
    group.add(ant);
    for (let i = 0; i < 2; i++) {
      const rfGeo = new THREE.RingGeometry(2 + i * 4, 2.3 + i * 4, 32);
      const rfMat = new THREE.MeshBasicMaterial({ color: 0xff6644, transparent: true, opacity: 0.09, side: THREE.DoubleSide });
      const rf = new THREE.Mesh(rfGeo, rfMat);
      rf.rotation.x = -Math.PI / 2;
      rf.position.y = 5;
      (rf as any)._isRF = i;
      group.add(rf);
    }
  }

  // Pin label glow sphere
  const pinGeo = new THREE.SphereGeometry(0.5, 8, 8);
  const pinMat = new THREE.MeshBasicMaterial({ color: t.color, transparent: true, opacity: 0.8 });
  const pin = new THREE.Mesh(pinGeo, pinMat);
  pin.position.y = -0.3;
  (pin as any)._isPin = true;
  group.add(pin);

  (group as any)._target = t;
  scene.add(group);
  return group;
}

function buildDrone(scene: THREE.Scene): THREE.Group {
  const drone = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(0.6, 0.2, 0.6);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x00ffcc, emissiveIntensity: 0.3 });
  drone.add(new THREE.Mesh(bodyGeo, bodyMat));
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const armGeo = new THREE.BoxGeometry(1.2, 0.06, 0.06);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6);
    arm.rotation.y = angle;
    drone.add(arm);
    const propGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 8);
    const propMat = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.6 });
    const prop = new THREE.Mesh(propGeo, propMat);
    prop.position.set(Math.cos(angle) * 1.1, 0.12, Math.sin(angle) * 1.1);
    (prop as any)._isProp = true;
    drone.add(prop);
    const ledGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const ledCol = i < 2 ? 0xff0000 : 0x00ff00;
    const ledMat = new THREE.MeshBasicMaterial({ color: ledCol });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(Math.cos(angle) * 1.1, -0.12, Math.sin(angle) * 1.1);
    drone.add(led);
  }
  // Scan cone pointing down
  const coneGeo = new THREE.ConeGeometry(2.5, 6, 16, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.rotation.x = Math.PI;
  cone.position.y = -3;
  (cone as any)._isScanCone = true;
  drone.add(cone);
  scene.add(drone);
  return drone;
}

function createScene(
  container: HTMLDivElement,
  elevData: number[][] | null,
  setHoveredTarget: (t: Target | null) => void,
  setDroneTarget: (s: string) => void,
  setStats: (s: { targets: number; elevation: string }) => void,
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
    // WebGL unavailable (sandboxed environment) — show static fallback
    const fb = document.createElement("div");
    fb.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#00ffcc;font-family:monospace;font-size:13px;background:#020a12;";
    fb.innerHTML = `<div style="text-align:center;opacity:.7"><div style="font-size:18px;margin-bottom:8px">◌</div>JACÓ VALLEY 3D MAP<br><span style="font-size:10px;color:#445">WebGL unavailable in this environment<br>Open ciajw.com/jaco in Firefox or Chrome</span></div>`;
    container.appendChild(fb);
    return { destroy: () => fb.remove(), resetView: () => {}, zoomIn: () => {}, zoomOut: () => {}, focusTarget: () => {} };
  }
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x020a12);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x0a1520, 0.5);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0x5588aa, 0.7);
  sun.position.set(-40, 80, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -100; sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100;
  sun.shadow.camera.far = 300;
  scene.add(sun);
  const hemi = new THREE.HemisphereLight(0x224466, 0x112211, 0.4);
  scene.add(hemi);
  // Stars
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

  const landmarkGroups = TARGETS.map((t) => buildLandmark(scene, t));
  setStats({ targets: TARGETS.length, elevation: elevData ? "SRTM Live" : "Procedural" });

  // LOS lines between observer and each target
  TARGETS.slice(1).forEach((t) => {
    const [x1, y1, z1] = latLonToScene(TARGETS[0].lat, TARGETS[0].lon, TARGETS[0].elevM + 4);
    const [x2, y2, z2] = latLonToScene(t.lat, t.lon, t.elevM + (t.type === "radar" ? 9 : 5));
    const points = [new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: t.color, transparent: true, opacity: 0.15 });
    scene.add(new THREE.Line(lineGeo, lineMat));
  });

  // Drone
  const drone = buildDrone(scene);
  let dronePhase = 0;
  let droneT = 0;

  // Particles
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

  // Raycaster for hover
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

  // Orbit controls
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

    // Drone flight path: figure-8 between all targets
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
    drone.position.set(
      fx + (tx - fx) * ease,
      Math.max(fy, ty) + 12 + Math.sin(segFrac * Math.PI) * 8,
      fz + (tz - fz) * ease,
    );
    drone.rotation.y = Math.atan2(tx - fx, tz - fz);

    scene.traverse((obj) => {
      if ((obj as any)._isPulse) {
        const s = 1 + Math.sin(t * 2) * 0.5;
        obj.scale.set(s, 1, s);
        ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(t * 3) * 0.25;
      }
      if ((obj as any)._isBeacon) {
        ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(t * 5) * 0.6;
      }
      if ((obj as any)._isRF !== undefined) {
        const ri = (obj as any)._isRF as number;
        const phase = (t * 0.6 + ri * 0.4) % 1;
        obj.scale.set(1 + phase * 1.8, 1, 1 + phase * 1.8);
        ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.12 * (1 - phase);
      }
      if ((obj as any)._isRotating) {
        obj.rotation.z = t * 1.2;
      }
      if ((obj as any)._isProp) {
        obj.rotation.y = t * 20;
      }
      if ((obj as any)._isScanCone) {
        ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.04 + Math.sin(t * 3) * 0.04;
      }
    });

    // Particle drift
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
      camTarget.set(x, 8, z);
      camDist = 45;
      camElev = 0.45;
    },
  };
}

const TARGET_COLORS: Record<Target["type"], string> = {
  observer: "text-cyan-400",
  crane: "text-amber-400",
  radar: "text-red-400",
  cell: "text-purple-400",
  ops: "text-orange-400",
};
const TARGET_BG: Record<Target["type"], string> = {
  observer: "border-cyan-500/30",
  crane: "border-amber-500/30",
  radar: "border-red-500/30",
  cell: "border-purple-500/30",
  ops: "border-orange-500/30",
};

export default function JacoMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<Target | null>(null);
  const [droneTarget, setDroneTarget] = useState("");
  const [stats, setStats] = useState({ targets: 0, elevation: "Loading…" });
  const [elevData, setElevData] = useState<number[][] | null>(null);
  const [elevStatus, setElevStatus] = useState<"loading" | "ok" | "fallback">("loading");
  const [time, setTime] = useState(new Date());
  const [activeTarget, setActiveTarget] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch real SRTM elevation data
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
          for (let row = 0; row < GRID; row++) {
            grid2d.push(flat.slice(row * GRID, (row + 1) * GRID));
          }
          setElevData(grid2d);
          setElevStatus("ok");
        } else {
          setElevStatus("fallback");
        }
      })
      .catch(() => setElevStatus("fallback"));
  }, []);

  // Init Three.js once elevation is settled
  useEffect(() => {
    if (elevStatus === "loading") return;
    if (!containerRef.current) return;
    const s = createScene(containerRef.current, elevData, setHoveredTarget, setDroneTarget, setStats);
    sceneRef.current = s;
    return () => s.destroy();
  }, [elevStatus, elevData]);

  const handleFocus = useCallback((idx: number) => {
    setActiveTarget(idx);
    sceneRef.current?.focusTarget(idx);
  }, []);

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

      {/* Top-left header */}
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
            <div className="flex items-center gap-3 mt-1.5">
              <Badge className={`text-[9px] px-1.5 py-0 ${elevStatus === "ok" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                {elevStatus === "ok" ? "● SRTM LIVE" : elevStatus === "fallback" ? "△ PROCEDURAL" : "◌ LOADING"}
              </Badge>
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px] px-1.5 py-0">
                ESRI SATELLITE TEXTURE
              </Badge>
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px] px-1.5 py-0">
                DRONE ACTIVE
              </Badge>
            </div>
          </div>

          {/* Drone status */}
          <div className="bg-black/70 backdrop-blur-md border border-cyan-500/15 rounded-lg px-3 py-2 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Drone Scan</span>
            </div>
            <div className="text-xs text-white font-mono mt-0.5 truncate">
              → {droneTarget || "INITIALIZING…"}
            </div>
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
        </div>
      </div>

      {/* Bottom-left: target list */}
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
                  <span className={`text-[11px] font-mono font-bold ${TARGET_COLORS[t.type]}`}>
                    {t.label.split("—")[0].trim()}
                  </span>
                </div>
                <div className="text-[9px] text-gray-500 font-mono ml-4 mt-0.5">
                  {t.lat.toFixed(4)}°N {Math.abs(t.lon).toFixed(4)}°W • +{t.elevM}m
                </div>
              </button>
            ))}
            <div className="border-t border-cyan-500/10 pt-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-mono">CRANE — GRIDTIDE C2 SUSPECTED</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Radio className="h-3 w-3 text-red-400" />
                <span className="text-[10px] text-red-400 font-mono">EL MIRO — FULL VALLEY LOS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3 w-3 text-purple-400" />
                <span className="text-[10px] text-purple-400 font-mono">BREAKWATER — 4G/LTE MACRO</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hover tooltip */}
      {hoveredTarget && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none" data-testid="panel-target-info">
          <Card className={`bg-black/90 backdrop-blur-md ${TARGET_BG[hoveredTarget.type]} w-72`}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Crosshair className={`h-4 w-4 ${TARGET_COLORS[hoveredTarget.type]}`} />
                <span className={`text-sm font-mono font-bold ${TARGET_COLORS[hoveredTarget.type]}`}>
                  {hoveredTarget.label.split("—")[0].trim()}
                </span>
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
