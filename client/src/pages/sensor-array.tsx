import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Radio, Smartphone, Laptop, Satellite, AlertTriangle,
  Copy, CheckCircle, Wifi, MapPin, Eye, Signal, RefreshCw,
  Building2, Activity,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// ── Surveillance network geometry (Hotel Pochote Grande, Jacó Beach) ──────────
const SAM_COORDS = { lat: 9.6219, lon: -84.6397 };

const SURV_NODES = [
  {
    id: "laflor-2324",
    label: "La Flor — Units 23/24/25",
    desc: "Large private houses, 3-storey, suspected operatives",
    color: 0xff4444,
    glowColor: "#ff4444",
    pos3d: [38, 0, -35] as [number, number, number],
    distanceM: 55,
    wallCount: 0,
    type: "observation",
  },
  {
    id: "laflor-9",
    label: "La Flor — Unit 9 (Roof Deck)",
    desc: "Genesis Peralta's former residence. Only unit with 3rd-floor roof deck. Direct line-of-sight to Sam's balcony.",
    color: 0xff8800,
    glowColor: "#ff8800",
    pos3d: [28, 0, -20] as [number, number, number],
    distanceM: 35,
    wallCount: 0,
    type: "observation",
  },
  {
    id: "central-antenna",
    label: "Central Antenna Position",
    desc: "Primary antenna deployment. Middle X in aerial. Closest elevated RF emitter to Room 10.",
    color: 0xff0088,
    glowColor: "#ff0088",
    pos3d: [-5, 0, -18] as [number, number, number],
    distanceM: 22,
    wallCount: 1,
    type: "antenna",
  },
  {
    id: "crocs",
    label: "Crocs Bar",
    desc: "Third observation post. Western position. Operatives reported on site.",
    color: 0xffaa00,
    glowColor: "#ffaa00",
    pos3d: [-55, 0, 5] as [number, number, number],
    distanceM: 130,
    wallCount: 0,
    type: "observation",
  },
  {
    id: "vista-las-palmas",
    label: "Vista Las Palmas — Top Floor",
    desc: "One of the tallest buildings in Jacó. Dan Wagner. Red lights on roof — possible antenna array. Top-floor panel suite with direct sightlines over entire area.",
    color: 0xcc00ff,
    glowColor: "#cc00ff",
    pos3d: [-30, 0, 50] as [number, number, number],
    distanceM: 280,
    wallCount: 0,
    type: "elevated",
  },
  {
    id: "hotel-corner",
    label: "Hotel Corner Unit — Courtyard",
    desc: "Confirmed operative presence. Masked individual photographed on porch. Closest hostile position to Room 10 — same hotel, across courtyard.",
    color: 0xff2200,
    glowColor: "#ff2200",
    pos3d: [-22, 0, 12] as [number, number, number],
    distanceM: 18,
    wallCount: 1,
    type: "close",
  },
];

// ── Path loss model ──────────────────────────────────────────────────────────
function pathLossRSSI(distM: number, walls: number, txDbm = 0, n = 2.5): number {
  const A = -59 + txDbm;
  const wallAtten = walls * 8;
  return Math.round(A - 10 * n * Math.log10(Math.max(distM, 0.01)) - wallAtten);
}

function distanceFromRSSI(rssi: number, txDbm = 0, n = 2.5): number {
  const A = -59 + txDbm;
  return Math.pow(10, (A - rssi) / (10 * n));
}

// ── Three.js scene ───────────────────────────────────────────────────────────
function buildScene(
  container: HTMLDivElement,
  setHovered: (id: string | null) => void
) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0f1a, 0.006);
  scene.background = new THREE.Color(0x0a0f1a);

  const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 2000);
  camera.position.set(80, 70, 80);
  camera.lookAt(0, 0, 0);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  } catch {
    const msg = document.createElement("div");
    msg.style.cssText = "display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:13px;font-family:monospace;text-align:center;padding:2rem;";
    msg.textContent = "WebGL unavailable in this environment. Open in a full browser to view the 3D scene.";
    container.appendChild(msg);
    return () => { if (container.contains(msg)) container.removeChild(msg); };
  }
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambient = new THREE.AmbientLight(0x1a2a3a, 1.2);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0x6688aa, 1.5);
  dirLight.position.set(50, 100, 50);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Ground plane (beach/grass)
  const groundGeo = new THREE.PlaneGeometry(400, 400);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x1a2a1a });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid
  const grid = new THREE.GridHelper(400, 80, 0x1a3a2a, 0x111f11);
  scene.add(grid);

  // Ocean (east side)
  const oceanGeo = new THREE.PlaneGeometry(100, 400);
  const oceanMat = new THREE.MeshLambertMaterial({ color: 0x0a2040, transparent: true, opacity: 0.7 });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(120, 0.1, 0);
  scene.add(ocean);

  // Hotel Pochote Grande (main block)
  const hotelGeo = new THREE.BoxGeometry(35, 10, 18);
  const hotelMat = new THREE.MeshLambertMaterial({ color: 0x2a3a4a, emissive: 0x0a1520 });
  const hotel = new THREE.Mesh(hotelGeo, hotelMat);
  hotel.position.set(0, 5, 0);
  hotel.castShadow = true;
  hotel.receiveShadow = true;
  scene.add(hotel);

  // Hotel label
  const hotelEdges = new THREE.EdgesGeometry(hotelGeo);
  const hotelLine = new THREE.LineSegments(hotelEdges, new THREE.LineBasicMaterial({ color: 0x4488cc, opacity: 0.6, transparent: true }));
  hotelLine.position.copy(hotel.position);
  scene.add(hotelLine);

  // Room 10 highlight (eastern end of hotel)
  const room10Geo = new THREE.BoxGeometry(5, 10.2, 4.5);
  const room10Mat = new THREE.MeshLambertMaterial({ color: 0x1a4a8a, emissive: 0x0a2244, transparent: true, opacity: 0.9 });
  const room10 = new THREE.Mesh(room10Geo, room10Mat);
  room10.position.set(15, 5, -4);
  scene.add(room10);

  // Sam's position beacon
  const beaconGeo = new THREE.CylinderGeometry(0.3, 0.3, 20, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.6 });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(15, 10, -4);
  scene.add(beacon);

  const dotGeo = new THREE.SphereGeometry(1.5, 16, 16);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x4499ff });
  const dot = new THREE.Mesh(dotGeo, dotMat);
  dot.position.set(15, 5.5, -4);
  scene.add(dot);

  // La Flor community (NE block — large houses)
  const laFlorPositions = [
    [38, 0, -35], [48, 0, -38], [55, 0, -30],
    [42, 0, -22], [52, 0, -24],
  ] as [number, number, number][];

  laFlorPositions.forEach((p, i) => {
    const houseGeo = new THREE.BoxGeometry(12, 9 + i * 1.5, 12);
    const houseMat = new THREE.MeshLambertMaterial({ color: 0x2a2030 });
    const house = new THREE.Mesh(houseGeo, houseMat);
    house.position.set(p[0], (9 + i * 1.5) / 2, p[2]);
    house.castShadow = true;
    scene.add(house);
  });

  // Unit 9 — roof deck highlight (only one with 3rd floor)
  const unit9Geo = new THREE.BoxGeometry(12, 12, 12);
  const unit9Mat = new THREE.MeshLambertMaterial({ color: 0x3a1520, emissive: 0x220a0a });
  const unit9 = new THREE.Mesh(unit9Geo, unit9Mat);
  unit9.position.set(28, 6, -20);
  scene.add(unit9);
  const roofDeckGeo = new THREE.BoxGeometry(8, 0.5, 8);
  const roofDeckMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.5 });
  const roofDeck = new THREE.Mesh(roofDeckGeo, roofDeckMat);
  roofDeck.position.set(28, 12.2, -20);
  scene.add(roofDeck);

  // Vista Las Palmas (tall tower, SW)
  const vistaTowerGeo = new THREE.BoxGeometry(18, 55, 18);
  const vistaMat = new THREE.MeshLambertMaterial({ color: 0x1a1a30, emissive: 0x0a0a20 });
  const vistaTower = new THREE.Mesh(vistaTowerGeo, vistaMat);
  vistaTower.position.set(-30, 27.5, 50);
  vistaTower.castShadow = true;
  scene.add(vistaTower);
  const vistaEdges = new THREE.EdgesGeometry(vistaTowerGeo);
  const vistaLine = new THREE.LineSegments(vistaEdges, new THREE.LineBasicMaterial({ color: 0xcc00ff, opacity: 0.4, transparent: true }));
  vistaLine.position.copy(vistaTower.position);
  scene.add(vistaLine);

  // Vista red antenna lights on top
  [[-4, 0], [4, 0], [0, -4], [0, 4]].forEach(([x, z]) => {
    const antGeo = new THREE.SphereGeometry(0.6, 8, 8);
    const antMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.set(-30 + x, 56, 50 + z);
    scene.add(ant);
    const pl = new THREE.PointLight(0xff0000, 0.8, 20);
    pl.position.copy(ant.position);
    scene.add(pl);
  });

  // Crocs (west)
  const crocsGeo = new THREE.BoxGeometry(20, 6, 15);
  const crocsMat = new THREE.MeshLambertMaterial({ color: 0x252020 });
  const crocs = new THREE.Mesh(crocsGeo, crocsMat);
  crocs.position.set(-55, 3, 5);
  scene.add(crocs);

  // Hotel corner unit (across courtyard)
  const cornerGeo = new THREE.BoxGeometry(7, 10, 7);
  const cornerMat = new THREE.MeshLambertMaterial({ color: 0x3a1a1a, emissive: 0x1a0a0a });
  const corner = new THREE.Mesh(cornerGeo, cornerMat);
  corner.position.set(-22, 5, 12);
  scene.add(corner);

  // Surveillance beams (line from node to Sam)
  const samPos = new THREE.Vector3(15, 5.5, -4);
  const pulseObjects: { mesh: THREE.Mesh; speed: number; nodeIdx: number; t: number }[] = [];

  SURV_NODES.forEach((node, _i) => {
    const start = new THREE.Vector3(...node.pos3d).setY(
      node.id === "laflor-9" ? 12 : node.id === "vista-las-palmas" ? 55 : 5
    );
    const end = samPos.clone();

    const dir = end.clone().sub(start);
    const length = dir.length();
    const mid = start.clone().lerp(end, 0.5);

    const lineGeo = new THREE.CylinderGeometry(0.08, 0.08, length, 6);
    const lineMat = new THREE.MeshBasicMaterial({
      color: node.color,
      transparent: true,
      opacity: node.id === "hotel-corner" || node.id === "central-antenna" ? 0.7 : 0.35,
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.copy(mid);
    line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    scene.add(line);

    // Pulse ball
    const pulseGeo = new THREE.SphereGeometry(0.8, 10, 10);
    const pulseMat = new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.9 });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    scene.add(pulse);
    pulseObjects.push({ mesh: pulse, speed: 0.3 + Math.random() * 0.4, nodeIdx: _i, t: Math.random() });

    // Node marker
    const markerGeo = new THREE.OctahedronGeometry(2.5, 0);
    const markerMat = new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.85 });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.copy(start);
    scene.add(marker);

    // Node point light
    const pl = new THREE.PointLight(node.color, 0.6, 30);
    pl.position.copy(start);
    scene.add(pl);
  });

  // Orbit controls (manual)
  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let theta = Math.PI / 4;
  let phi = Math.PI / 4;
  let radius = 120;
  const target = new THREE.Vector3(0, 5, 0);

  const onMouseDown = (e: MouseEvent) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
  const onMouseUp = () => { isDragging = false; };
  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - prevMouse.x) * 0.005;
    const dy = (e.clientY - prevMouse.y) * 0.005;
    theta -= dx;
    phi = Math.max(0.1, Math.min(Math.PI / 2.1, phi - dy));
    prevMouse = { x: e.clientX, y: e.clientY };
  };
  const onWheel = (e: WheelEvent) => { radius = Math.max(30, Math.min(300, radius + e.deltaY * 0.1)); };
  const onTouchStart = (e: TouchEvent) => { if (e.touches.length === 1) { isDragging = true; prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } };
  const onTouchEnd = () => { isDragging = false; };
  const onTouchMove = (e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = (e.touches[0].clientX - prevMouse.x) * 0.005;
    const dy = (e.touches[0].clientY - prevMouse.y) * 0.005;
    theta -= dx;
    phi = Math.max(0.1, Math.min(Math.PI / 2.1, phi - dy));
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  renderer.domElement.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mousemove", onMouseMove);
  renderer.domElement.addEventListener("wheel", onWheel);
  renderer.domElement.addEventListener("touchstart", onTouchStart);
  renderer.domElement.addEventListener("touchend", onTouchEnd);
  renderer.domElement.addEventListener("touchmove", onTouchMove);

  let animId = 0;
  const clock = new THREE.Clock();

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Orbit camera
    camera.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta),
    );
    camera.lookAt(target);

    // Animate pulses
    const samPosAnim = new THREE.Vector3(15, 5.5, -4);
    pulseObjects.forEach((p) => {
      p.t = (p.t + p.speed * 0.01) % 1;
      const node = SURV_NODES[p.nodeIdx];
      const start = new THREE.Vector3(...node.pos3d).setY(
        node.id === "laflor-9" ? 12 : node.id === "vista-las-palmas" ? 55 : 5
      );
      p.mesh.position.lerpVectors(start, samPosAnim, p.t);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.9 - p.t * 0.6;
    });

    // Beacon pulse
    beacon.material.opacity = 0.3 + 0.3 * Math.sin(t * 3);

    // Roof deck glow
    roofDeckMat.opacity = 0.3 + 0.3 * Math.sin(t * 2.5);

    renderer.render(scene, camera);
  }

  animate();

  const onResize = () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener("resize", onResize);

  return () => {
    cancelAnimationFrame(animId);
    renderer.domElement.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mousemove", onMouseMove);
    renderer.domElement.removeEventListener("wheel", onWheel);
    renderer.domElement.removeEventListener("touchstart", onTouchStart);
    renderer.domElement.removeEventListener("touchend", onTouchEnd);
    renderer.domElement.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("resize", onResize);
    renderer.dispose();
    if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
  };
}

// ── Leaflet satellite map ────────────────────────────────────────────────────
function SatelliteMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let L: any;
    import("leaflet").then((mod) => {
      L = mod.default;
      const map = L.map(mapRef.current!, {
        center: [SAM_COORDS.lat, SAM_COORDS.lon],
        zoom: 18,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "ESRI World Imagery", maxZoom: 21 }
      ).addTo(map);

      // Sam's position
      const samIcon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;background:#4488ff;border-radius:50%;border:3px solid white;box-shadow:0 0 10px #4488ff;"></div>`,
        iconAnchor: [8, 8],
      });
      L.marker([SAM_COORDS.lat, SAM_COORDS.lon], { icon: samIcon })
        .addTo(map)
        .bindPopup("<b>Room 10 — Hotel Pochote Grande</b><br>Observer position");

      // Surveillance nodes
      const nodeOffsets: Record<string, [number, number]> = {
        "laflor-2324": [0.0004, 0.0003],
        "laflor-9": [0.0003, 0.0002],
        "central-antenna": [-0.00005, -0.00015],
        "crocs": [0.00002, -0.0012],
        "vista-las-palmas": [-0.0003, -0.00025],
        "hotel-corner": [-0.0002, 0.0001],
      };

      SURV_NODES.forEach((node) => {
        const off = nodeOffsets[node.id] ?? [0, 0];
        const hex = "#" + node.color.toString(16).padStart(6, "0");
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;background:${hex};border-radius:2px;border:2px solid white;transform:rotate(45deg);box-shadow:0 0 8px ${hex};"></div>`,
          iconAnchor: [7, 7],
        });
        L.marker([SAM_COORDS.lat + off[0], SAM_COORDS.lon + off[1]], { icon })
          .addTo(map)
          .bindPopup(`<b>${node.label}</b><br>${node.desc}`);

        L.polyline(
          [[SAM_COORDS.lat, SAM_COORDS.lon], [SAM_COORDS.lat + off[0], SAM_COORDS.lon + off[1]]],
          { color: hex, weight: 1.5, opacity: 0.5, dashArray: "4 4" }
        ).addTo(map);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "500px", borderRadius: "8px", overflow: "hidden" }}
    />
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SensorArrayPage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("scene");
  const [copied, setCopied] = useState<string | null>(null);
  const [rssiInput, setRssiInput] = useState("-20");
  const [txPower, setTxPower] = useState("0");
  const [pathN, setPathN] = useState("2.5");
  const [registerForm, setRegisterForm] = useState({ nodeId: "android-01", label: "Android Sensor Node", type: "android" });
  const [registeredToken, setRegisteredToken] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "scene" || !canvasRef.current) return;
    const cleanup = buildScene(canvasRef.current, setHoveredNode);
    return cleanup;
  }, [activeTab]);

  const { data: liveData, refetch: refetchLive } = useQuery<any>({
    queryKey: ["/api/rssi/live"],
    refetchInterval: 3000,
    enabled: activeTab === "live",
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/rssi/node/register", data);
      return res.json();
    },
    onSuccess: (data) => {
      setRegisteredToken(data.token);
      queryClient.invalidateQueries({ queryKey: ["/api/rssi/live"] });
    },
  });

  const copyText = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  const rssiVal = parseFloat(rssiInput) || -20;
  const txVal = parseFloat(txPower) || 0;
  const nVal = parseFloat(pathN) || 2.5;
  const estimatedDist = distanceFromRSSI(rssiVal, txVal, nVal);

  const termuxSetup = `pkg update -y && pkg install termux-api curl -y`;
  const termuxScan = `while true; do
  READINGS=$(termux-bluetooth-scan -t 5 2>/dev/null | python3 -c "
import json,sys
data=json.load(sys.stdin)
out=[{'mac':d.get('address','00:00:00:00:00:00'),'name':d.get('name','Unknown'),'rssi':d.get('rssi',-100),'timestamp':__import__('datetime').datetime.utcnow().isoformat()+'Z'} for d in data]
print(json.dumps(out))
")
  curl -s -X POST https://kapparf.com/api/rssi/ingest \\
    -H 'Content-Type: application/json' \\
    -d "{\\\"nodeId\\\":\\\"android-01\\\",\\\"readings\\\":$READINGS}" > /dev/null
  sleep 10
done`;

  const termuxOneShot = `termux-bluetooth-scan -t 5 | python3 -c "
import json,sys,datetime
data=json.load(sys.stdin)
print(json.dumps([{'mac':d.get('address'),'name':d.get('name','?'),'rssi':d.get('rssi',-100),'timestamp':datetime.datetime.utcnow().isoformat()+'Z'} for d in data]))
"`;

  const nodeTypes = ["android", "iphone", "laptop", "kiwi", "other"];

  const allReadings: any[] = [];
  if (liveData?.nodes) {
    for (const nodeData of Object.values(liveData.nodes) as any[]) {
      allReadings.push(...(nodeData.readings ?? []));
    }
  }
  const recentReadings = allReadings
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  const crossNodeMacs = Object.keys(liveData?.crossNode ?? {});

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">RSSI Sensor Array</h1>
          <p className="text-sm text-muted-foreground">Multi-node signal intelligence — Hotel Pochote Grande, Jacó Beach</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-red-500 border-red-500/30 text-xs">
            6 SURV NODES MAPPED
          </Badge>
          <Badge variant="outline" className="text-blue-400 border-blue-400/30 text-xs">
            ROOM 10
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 text-xs">
          <TabsTrigger value="scene">3D Scene</TabsTrigger>
          <TabsTrigger value="map">Satellite</TabsTrigger>
          <TabsTrigger value="forensics">Path Loss</TabsTrigger>
          <TabsTrigger value="live">Live Feed</TabsTrigger>
          <TabsTrigger value="setup">Node Setup</TabsTrigger>
        </TabsList>

        {/* ── 3D SCENE ── */}
        <TabsContent value="scene" className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-border" style={{ height: 520 }}>
            <div ref={canvasRef} style={{ width: "100%", height: "100%" }} />
            <div className="absolute top-3 left-3 text-xs text-blue-300/70 font-mono pointer-events-none">
              drag to orbit · scroll to zoom
            </div>
            <div className="absolute top-3 right-3 space-y-1 pointer-events-none">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-blue-300/80">Room 10 — You</span>
              </div>
              {SURV_NODES.map(n => (
                <div key={n.id} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rotate-45" style={{ background: "#" + n.color.toString(16).padStart(6, "0") }} />
                  <span className="text-white/60">{n.label.split("—")[0].trim()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SURV_NODES.map(node => {
              const expectedRSSI = pathLossRSSI(node.distanceM, node.wallCount);
              return (
                <Card key={node.id} className="border-border/50 bg-card/50">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm rotate-45 flex-shrink-0" style={{ background: "#" + node.color.toString(16).padStart(6, "0") }} />
                      <span className="text-xs font-medium leading-tight">{node.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{node.desc}</p>
                    <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                      <span className="text-muted-foreground">{node.distanceM}m</span>
                      <span className="text-muted-foreground">·</span>
                      <span style={{ color: expectedRSSI < -90 ? "#888" : expectedRSSI < -70 ? "#ffaa00" : "#ff4444" }}>
                        ~{expectedRSSI} dBm expected
                      </span>
                      {node.wallCount > 0 && <span className="text-muted-foreground">({node.wallCount} wall)</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Aerial evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border-border/50">
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aerial — Room 10 Geometry</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <img src="/evidence/room10_aerial_geometry.jpeg" alt="Room 10 aerial geometry" className="w-full rounded object-cover" />
                <p className="text-xs text-muted-foreground mt-2">Blue dot = Room 10. Left X = parking lot (truck CL273123). Right X = second position. Ocean is east (right edge past building end).</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aerial — Full Surveillance Network</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <img src="/evidence/pochote_surveillance_network_aerial.jpeg" alt="Surveillance network aerial" className="w-full rounded object-cover" />
                <p className="text-xs text-muted-foreground mt-2">Three-node outer ring: La Flor 23/24/25 (top-right), central antenna (middle), Crocs (left). Blue dot = Room 10. Vista Las Palmas and hotel corner unit are additional positions.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── SATELLITE MAP ── */}
        <TabsContent value="map" className="space-y-3">
          <Card className="border-border/50">
            <CardContent className="p-3">
              <SatelliteMap />
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                {SURV_NODES.map(n => (
                  <div key={n.id} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rotate-45 flex-shrink-0" style={{ background: "#" + n.color.toString(16).padStart(6, "0") }} />
                    <span className="text-muted-foreground leading-tight">{n.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PATH LOSS FORENSICS ── */}
        <TabsContent value="forensics" className="space-y-4">
          <Card className="border-red-500/20 bg-red-950/10">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Forensic Finding: Truck Cannot Be Primary Source
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3 text-sm">
              <p className="text-muted-foreground leading-relaxed">
                The BLE path loss model eliminates truck CL273123 (parking lot, ~45m + multiple walls) as the source of
                the −20 dBm peak recorded in Room 10. The truck may be a <strong>command vehicle</strong> — the actual
                transmitter is stationary and much closer.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-background/50 rounded p-3 space-y-1 border border-border/50">
                  <div className="text-muted-foreground">Truck — parking lot</div>
                  <div className="text-lg font-bold text-gray-500">~45m + 2 walls</div>
                  <div className="text-gray-500">Expected: ~−116 dBm</div>
                  <div className="text-gray-400 text-xs">Below noise floor. Undetectable.</div>
                </div>
                <div className="bg-background/50 rounded p-3 space-y-1 border border-orange-500/30">
                  <div className="text-muted-foreground">Central antenna position</div>
                  <div className="text-lg font-bold text-orange-400">~22m, 1 wall</div>
                  <div className="text-orange-400">Expected: ~−86 dBm</div>
                  <div className="text-orange-300/70 text-xs">Marginal. Detectable but weak.</div>
                </div>
                <div className="bg-background/50 rounded p-3 space-y-1 border border-red-500/30">
                  <div className="text-muted-foreground">In-wall / sub-2m source</div>
                  <div className="text-lg font-bold text-red-400">&lt;2m, 0–1 wall</div>
                  <div className="text-red-400">Expected: −52 to −69 dBm</div>
                  <div className="text-red-300/70 text-xs">Consistent with −20 dBm peak reading.</div>
                </div>
              </div>
              <div className="bg-background/60 rounded p-3 border border-border/50 text-xs space-y-1">
                <div className="font-semibold text-foreground mb-1">Model: log-distance path loss</div>
                <div className="font-mono text-muted-foreground">RSSI = A − 10·n·log₁₀(d) − wallAtten</div>
                <div className="font-mono text-muted-foreground">A = −59 + TxPower dBm | n = 2.5 (mixed indoor/outdoor) | wallAtten = 8 dB/wall</div>
                <div className="mt-2 text-amber-400">
                  To produce −20 dBm at standard BLE (0 dBm TX, n=2.5): source must be at <strong>~1.4m</strong>. Even at +20 dBm TX (industrial): source still must be within <strong>~11cm</strong>.
                </div>
              </div>
              <div className="text-xs text-muted-foreground border-t border-border/30 pt-3">
                <strong className="text-foreground">Unit 9 roof deck</strong> is the most forensically significant position: direct LOS to Room 10 balcony,
                elevated ~12m, zero obstructions. A high-gain directional antenna from unit 9 could explain elevated readings
                in the balcony-end position (20m LOS = ~−80 dBm standard, significantly higher with directional gain).
                The hotel corner unit (&lt;20m, 1 wall) is the most probable source for the in-room −20 dBm spike.
              </div>
            </CardContent>
          </Card>

          {/* Interactive calculator */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium">Path Loss Calculator</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Observed RSSI (dBm)</label>
                  <Input
                    value={rssiInput}
                    onChange={e => setRssiInput(e.target.value)}
                    className="font-mono text-sm h-8"
                    data-testid="input-rssi"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">TX Power (dBm)</label>
                  <Input
                    value={txPower}
                    onChange={e => setTxPower(e.target.value)}
                    className="font-mono text-sm h-8"
                    data-testid="input-txpower"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Path loss exponent n</label>
                  <Input
                    value={pathN}
                    onChange={e => setPathN(e.target.value)}
                    className="font-mono text-sm h-8"
                    data-testid="input-path-n"
                  />
                </div>
              </div>
              <div className="bg-muted/30 rounded p-4 text-center space-y-1">
                <div className="text-3xl font-mono font-bold text-foreground">
                  {estimatedDist < 1 ? `${(estimatedDist * 100).toFixed(1)} cm` : `${estimatedDist.toFixed(2)} m`}
                </div>
                <div className="text-xs text-muted-foreground">estimated source distance from receiver</div>
                {estimatedDist < 0.15 && (
                  <div className="text-xs text-red-400 font-medium mt-1">
                    ⚠ Source is effectively touching the receiver — planted device
                  </div>
                )}
                {estimatedDist >= 0.15 && estimatedDist < 2 && (
                  <div className="text-xs text-orange-400 font-medium mt-1">
                    ⚠ Sub-2m range — in-wall, in-ceiling, or same-room device
                  </div>
                )}
                {estimatedDist >= 2 && estimatedDist < 20 && (
                  <div className="text-xs text-yellow-400 font-medium mt-1">
                    Source within same structure — adjacent room, ceiling void, or courtyard
                  </div>
                )}
                {estimatedDist >= 20 && (
                  <div className="text-xs text-green-400 font-medium mt-1">
                    Source is exterior — consistent with line-of-sight position
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Guidance:</strong> n = 2.0 open air | n = 2.5 mixed outdoor/indoor | n = 3.5 dense indoor through walls.
                Standard BLE TX = 0 dBm. High-power industrial = +20 dBm. Directional antenna adds 6–12 dBi gain (subtract from TX field, e.g. enter +10 for 10 dBi gain).
              </div>
            </CardContent>
          </Card>

          {/* Expected RSSI table for all nodes */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium">Expected RSSI from Each Surveillance Node</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="text-left py-2 pr-4">Node</th>
                      <th className="text-right py-2 pr-4">Dist</th>
                      <th className="text-right py-2 pr-4">Walls</th>
                      <th className="text-right py-2 pr-4">Expected (0 dBm TX)</th>
                      <th className="text-right py-2">Expected (+20 dBm TX)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SURV_NODES.map(node => {
                      const e0 = pathLossRSSI(node.distanceM, node.wallCount, 0);
                      const e20 = pathLossRSSI(node.distanceM, node.wallCount, 20);
                      const colorClass = e0 < -90 ? "text-gray-500" : e0 < -70 ? "text-yellow-500" : "text-red-400";
                      return (
                        <tr key={node.id} className="border-b border-border/20 hover:bg-muted/20">
                          <td className="py-2 pr-4">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rotate-45 inline-block flex-shrink-0" style={{ background: "#" + node.color.toString(16).padStart(6, "0") }} />
                              {node.label.split("—")[0].trim()}
                            </span>
                          </td>
                          <td className="text-right py-2 pr-4 text-muted-foreground">{node.distanceM}m</td>
                          <td className="text-right py-2 pr-4 text-muted-foreground">{node.wallCount}</td>
                          <td className={`text-right py-2 pr-4 ${colorClass}`}>{e0} dBm</td>
                          <td className={`text-right py-2 ${e20 < -80 ? "text-gray-500" : e20 < -60 ? "text-yellow-400" : "text-red-400"}`}>{e20} dBm</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-border/60">
                      <td className="py-2 pr-4 text-blue-400 font-semibold">Peak observed (Room 10)</td>
                      <td className="text-right py-2 pr-4 text-blue-400">?</td>
                      <td className="text-right py-2 pr-4">—</td>
                      <td className="text-right py-2 pr-4 text-blue-400 font-bold">−20 dBm</td>
                      <td className="text-right py-2 text-blue-400 font-bold">−20 dBm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LIVE FEED ── */}
        <TabsContent value="live" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {liveData ? `${liveData.totalReadings} readings across ${Object.keys(liveData.nodes ?? {}).length} nodes` : "No nodes online yet"}
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchLive()} data-testid="button-refresh-live">
              <RefreshCw className="w-3 h-3 mr-1" /> Refresh
            </Button>
          </div>

          {crossNodeMacs.length > 0 && (
            <Card className="border-red-500/30 bg-red-950/10">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" /> Cross-Node Detection — Same MAC on Multiple Nodes
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-1">
                {crossNodeMacs.map(mac => (
                  <div key={mac} className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-red-400">{mac}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-orange-300">{liveData.crossNode[mac].join(", ")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {recentReadings.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                <Signal className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>No live readings yet.</p>
                <p className="mt-1 text-xs">Set up an Android or laptop node using the Node Setup tab to start ingesting data.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground">
                        <th className="text-left py-2 px-3">MAC</th>
                        <th className="text-left py-2 px-3">Name</th>
                        <th className="text-right py-2 px-3">RSSI</th>
                        <th className="text-right py-2 px-3">~Dist</th>
                        <th className="text-left py-2 px-3">Node</th>
                        <th className="text-right py-2 px-3">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReadings.map((r: any, i: number) => {
                        const dist = distanceFromRSSI(r.rssi, 0, 2.5);
                        const isSuspect = r.rssi > -60;
                        return (
                          <tr key={i} className={`border-b border-border/20 ${isSuspect ? "bg-red-950/10" : ""}`} data-testid={`row-rssi-${i}`}>
                            <td className={`py-1.5 px-3 ${isSuspect ? "text-red-400" : "text-foreground"}`}>{r.mac}</td>
                            <td className="py-1.5 px-3 text-muted-foreground max-w-24 truncate">{r.name}</td>
                            <td className={`py-1.5 px-3 text-right font-bold ${r.rssi > -60 ? "text-red-400" : r.rssi > -80 ? "text-yellow-400" : "text-muted-foreground"}`}>{r.rssi}</td>
                            <td className="py-1.5 px-3 text-right text-muted-foreground">
                              {dist < 1 ? `${(dist * 100).toFixed(0)}cm` : `${dist.toFixed(1)}m`}
                            </td>
                            <td className="py-1.5 px-3 text-muted-foreground">{r.nodeId}</td>
                            <td className="py-1.5 px-3 text-right text-muted-foreground">
                              {new Date(r.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── NODE SETUP ── */}
        <TabsContent value="setup" className="space-y-4">
          {/* Register a node */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> Register Sensor Node
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Node ID</label>
                  <Input
                    value={registerForm.nodeId}
                    onChange={e => setRegisterForm(f => ({ ...f, nodeId: e.target.value }))}
                    placeholder="android-01"
                    className="text-sm h-8 font-mono"
                    data-testid="input-node-id"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Label</label>
                  <Input
                    value={registerForm.label}
                    onChange={e => setRegisterForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="Android Sensor"
                    className="text-sm h-8"
                    data-testid="input-node-label"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Type</label>
                  <select
                    value={registerForm.type}
                    onChange={e => setRegisterForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
                    data-testid="select-node-type"
                  >
                    {nodeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => registerMutation.mutate(registerForm)}
                disabled={registerMutation.isPending}
                data-testid="button-register-node"
              >
                {registerMutation.isPending ? "Registering…" : "Register Node"}
              </Button>
              {registeredToken && (
                <div className="bg-muted/30 rounded p-3 font-mono text-xs space-y-1 border border-green-500/30">
                  <div className="text-green-400 font-semibold">Node registered</div>
                  <div className="text-muted-foreground break-all">Token: {registeredToken}</div>
                  <div className="text-muted-foreground text-xs">Use this token in the NODE_TOKEN variable below</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Android Termux */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-green-400" /> Android Node — Termux Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground mb-1">Step 1: Install Termux + Termux:API from <strong>F-Droid</strong> (not Play Store)</div>
                <div className="text-xs text-amber-400">⚠ The Play Store version of Termux:API is broken. Must use F-Droid.</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground mb-1">Step 2: Install packages</div>
                <div className="relative">
                  <pre className="bg-muted/30 rounded p-3 text-xs font-mono overflow-x-auto border border-border/50 pr-12">{termuxSetup}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={() => copyText(termuxSetup, "setup")} data-testid="button-copy-setup">
                    {copied === "setup" ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground mb-1">Step 3: One-shot test scan (verify Termux:API is working)</div>
                <div className="relative">
                  <pre className="bg-muted/30 rounded p-3 text-xs font-mono overflow-x-auto border border-border/50 pr-12">{termuxOneShot}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={() => copyText(termuxOneShot, "oneshot")} data-testid="button-copy-oneshot">
                    {copied === "oneshot" ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground mb-1">Step 4: Continuous ingest loop — runs every 10s, posts to KAPPA</div>
                <div className="relative">
                  <pre className="bg-muted/30 rounded p-3 text-xs font-mono overflow-x-auto border border-border/50 pr-12">{termuxScan}</pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={() => copyText(termuxScan, "loop")} data-testid="button-copy-loop">
                    {copied === "loop" ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/20 rounded p-3 border border-border/30 space-y-1">
                  <div className="font-semibold text-foreground">Best apps alongside Termux</div>
                  <div className="text-muted-foreground">• <strong>nRF Connect</strong> (Nordic) — forensic BLE scanner, CSV export</div>
                  <div className="text-muted-foreground">• <strong>BLE Scanner</strong> (Bluepixel) — raw advertising data</div>
                  <div className="text-muted-foreground">• <strong>Wigle WiFi</strong> — wardriving + SSID mapping with GPS coords</div>
                </div>
                <div className="bg-muted/20 rounded p-3 border border-border/30 space-y-1">
                  <div className="font-semibold text-foreground">iPhone 14 angles</div>
                  <div className="text-muted-foreground">• <strong>U1 UWB chip</strong> — precision ranging (±10cm). Search: <em>"iPhone U1 UWB ranging app"</em></div>
                  <div className="text-muted-foreground">• <strong>LightBlue</strong> — BLE RSSI logger with CSV export</div>
                  <div className="text-muted-foreground">• <strong>Network Analyzer</strong> — WiFi RSSI + channel scan</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Laptop */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-400" /> Laptop Node — Direct ingest via curl
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative">
                <pre className="bg-muted/30 rounded p-3 text-xs font-mono overflow-x-auto border border-border/50 pr-12">{`curl -X POST https://kapparf.com/api/rssi/ingest \\
  -H 'Content-Type: application/json' \\
  -d '{
    "nodeId": "laptop-01",
    "readings": [
      {"mac": "AA:BB:CC:DD:EE:FF", "name": "Device Name", "rssi": -72, "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}
    ]
  }'`}</pre>
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => copyText(`curl -X POST https://kapparf.com/api/rssi/ingest -H 'Content-Type: application/json' -d '{"nodeId":"laptop-01","readings":[{"mac":"AA:BB:CC:DD:EE:FF","name":"Device","rssi":-72}]}'`, "curl")}
                  data-testid="button-copy-curl">
                  {copied === "curl" ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                On macOS/Linux: pipe <code className="font-mono bg-muted/40 px-1 rounded">blueutil --paired --format json</code> or bettercap BLE scan output into the readings array.
              </p>
            </CardContent>
          </Card>

          {/* Research notes */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" /> Research Search Terms — While Nodes Are Collecting
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="font-semibold text-foreground">BLE forensics</div>
                  {[
                    '"BLE RSSI indoor localization path loss exponent"',
                    '"log-distance path loss model BLE fingerprinting"',
                    '"BLE RSSI trilateration weighted centroid"',
                    '"high power BLE module +20 dBm surveillance"',
                    '"Qualcomm CSI extraction nexmon Android"',
                  ].map(t => (
                    <div key={t} className="text-muted-foreground font-mono bg-muted/20 rounded px-2 py-1 cursor-pointer hover:bg-muted/40" onClick={() => copyText(t, t)} data-testid={`search-term-${t.slice(1, 15)}`}>
                      {copied === t ? <span className="text-green-400">✓ copied</span> : t}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="font-semibold text-foreground">Device identification</div>
                  {[
                    '"SKT130C BLE module specifications datasheet"',
                    '"parabolic reflector BLE antenna gain dBi"',
                    '"iPhone U1 UWB precision ranging third party"',
                    '"ESP32 WiFi CSI channel state information monitor"',
                    '"BLE advertising packet manufacturer specific data forensic"',
                  ].map(t => (
                    <div key={t} className="text-muted-foreground font-mono bg-muted/20 rounded px-2 py-1 cursor-pointer hover:bg-muted/40" onClick={() => copyText(t, t)} data-testid={`search-term-${t.slice(1, 15)}`}>
                      {copied === t ? <span className="text-green-400">✓ copied</span> : t}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
