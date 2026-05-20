import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  Radio,
  Building2,
  Eye,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Crosshair,
  AlertTriangle,
  Wifi,
} from "lucide-react";

const SUITES_CRISTINA_COORDS = { lat: 9.9367, lng: -84.1052 };

interface CameraNode {
  id: number;
  position: THREE.Vector3;
  floor: number;
  type: "corridor" | "exterior" | "stairwell" | "lobby" | "parking" | "roof";
  fov: number;
  rotation: number;
  label: string;
}

interface BuildingDef {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: number;
  emissive: number;
  label: string;
  type: "suites" | "ice" | "tower";
}

const BUILDINGS: BuildingDef[] = [
  {
    name: "Suites Cristina",
    position: [0, 0, 0],
    size: [28, 18, 40],
    color: 0x1a1a2e,
    emissive: 0x0a0a1a,
    label: "SUITES CRISTINA",
    type: "suites",
  },
  {
    name: "ICE Main Tower",
    position: [-55, 0, -10],
    size: [35, 32, 45],
    color: 0x0d1b2a,
    emissive: 0x051020,
    label: "ICE HQ — MAIN",
    type: "ice",
  },
  {
    name: "ICE Annex A",
    position: [-55, 0, 30],
    size: [25, 14, 30],
    color: 0x0d1b2a,
    emissive: 0x051020,
    label: "ICE ANNEX-A",
    type: "ice",
  },
  {
    name: "ICE Annex B",
    position: [-55, 0, -45],
    size: [22, 10, 25],
    color: 0x0d1b2a,
    emissive: 0x051020,
    label: "ICE ANNEX-B",
    type: "ice",
  },
];

function generateCameras(): CameraNode[] {
  const cameras: CameraNode[] = [];
  let id = 0;

  const floorHeight = 3.6;
  const buildingW = 28;
  const buildingD = 40;
  const floors = 5;

  for (let floor = 0; floor < floors; floor++) {
    const y = floor * floorHeight + 2;
    const isLobby = floor === 0;

    cameras.push({
      id: id++,
      position: new THREE.Vector3(buildingW / 2 + 0.5, y, -buildingD / 2 + 5),
      floor,
      type: isLobby ? "lobby" : "corridor",
      fov: 90,
      rotation: Math.PI / 2,
      label: isLobby ? "LOBBY-E-01" : `F${floor + 1}-CORR-E-${id}`,
    });
    cameras.push({
      id: id++,
      position: new THREE.Vector3(buildingW / 2 + 0.5, y, buildingD / 2 - 5),
      floor,
      type: "exterior",
      fov: 75,
      rotation: Math.PI / 2,
      label: `F${floor + 1}-EXT-E-${id}`,
    });
    cameras.push({
      id: id++,
      position: new THREE.Vector3(-buildingW / 2 - 0.5, y, -buildingD / 2 + 8),
      floor,
      type: "exterior",
      fov: 80,
      rotation: -Math.PI / 2,
      label: `F${floor + 1}-EXT-W-${id}`,
    });
    cameras.push({
      id: id++,
      position: new THREE.Vector3(-buildingW / 2 - 0.5, y, buildingD / 2 - 8),
      floor,
      type: "exterior",
      fov: 80,
      rotation: -Math.PI / 2,
      label: `F${floor + 1}-EXT-W-${id}`,
    });
    cameras.push({
      id: id++,
      position: new THREE.Vector3(0, y, -buildingD / 2 - 0.5),
      floor,
      type: "exterior",
      fov: 85,
      rotation: 0,
      label: `F${floor + 1}-EXT-N-${id}`,
    });
    cameras.push({
      id: id++,
      position: new THREE.Vector3(0, y, buildingD / 2 + 0.5),
      floor,
      type: "exterior",
      fov: 85,
      rotation: Math.PI,
      label: `F${floor + 1}-EXT-S-${id}`,
    });

    cameras.push({
      id: id++,
      position: new THREE.Vector3(buildingW / 2 - 2, y, 0),
      floor,
      type: "corridor",
      fov: 110,
      rotation: 0,
      label: `F${floor + 1}-HALL-${id}`,
    });
    cameras.push({
      id: id++,
      position: new THREE.Vector3(-buildingW / 2 + 2, y, 0),
      floor,
      type: "corridor",
      fov: 110,
      rotation: Math.PI,
      label: `F${floor + 1}-HALL-${id}`,
    });

    if (floor > 0) {
      cameras.push({
        id: id++,
        position: new THREE.Vector3(buildingW / 2 - 1, y, -buildingD / 2 + 1),
        floor,
        type: "stairwell",
        fov: 120,
        rotation: Math.PI / 4,
        label: `F${floor + 1}-STAIR-NE-${id}`,
      });
      cameras.push({
        id: id++,
        position: new THREE.Vector3(-buildingW / 2 + 1, y, buildingD / 2 - 1),
        floor,
        type: "stairwell",
        fov: 120,
        rotation: -Math.PI * 0.75,
        label: `F${floor + 1}-STAIR-SW-${id}`,
      });
    }
  }

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    cameras.push({
      id: id++,
      position: new THREE.Vector3(
        Math.cos(angle) * 12,
        floors * floorHeight + 1,
        Math.sin(angle) * 18,
      ),
      floor: floors,
      type: "roof",
      fov: 60,
      rotation: angle + Math.PI,
      label: `ROOF-PTZ-${id}`,
    });
  }

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    cameras.push({
      id: id++,
      position: new THREE.Vector3(
        Math.cos(angle) * (buildingW / 2 + 6),
        1.5,
        Math.sin(angle) * (buildingD / 2 + 6),
      ),
      floor: 0,
      type: "parking",
      fov: 90,
      rotation: angle + Math.PI,
      label: `PKG-${id}`,
    });
  }

  while (cameras.length < 72) {
    const floor = Math.floor(Math.random() * 5);
    const y = floor * 3.6 + 2;
    const side = Math.random() > 0.5 ? 1 : -1;
    cameras.push({
      id: id++,
      position: new THREE.Vector3(
        side * (14 + Math.random() * 2),
        y,
        (Math.random() - 0.5) * 36,
      ),
      floor,
      type: "corridor",
      fov: 90,
      rotation: side * Math.PI / 2,
      label: `F${floor + 1}-AUX-${id}`,
    });
  }

  return cameras.slice(0, 72);
}

function createScene(
  container: HTMLDivElement,
  setHoveredCamera: (c: CameraNode | null) => void,
  setStats: (s: { cameras: number; threats: number }) => void,
) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020208, 0.004);

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    500,
  );
  camera.position.set(60, 45, 60);
  camera.lookAt(0, 5, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x020208);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x1a1a3e, 0.4);
  scene.add(ambientLight);

  const moonLight = new THREE.DirectionalLight(0x4466aa, 0.6);
  moonLight.position.set(-50, 80, -30);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.camera.far = 200;
  moonLight.shadow.camera.left = -80;
  moonLight.shadow.camera.right = 80;
  moonLight.shadow.camera.top = 80;
  moonLight.shadow.camera.bottom = -80;
  scene.add(moonLight);

  const groundGeo = new THREE.PlaneGeometry(300, 300, 60, 60);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a14,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const gridHelper = new THREE.GridHelper(300, 60, 0x111133, 0x0a0a22);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  const roadGeo = new THREE.PlaneGeometry(12, 120);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a28,
    roughness: 0.8,
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(-27, 0.02, 0);
  scene.add(road);

  for (let z = -55; z < 55; z += 6) {
    const dashGeo = new THREE.PlaneGeometry(0.4, 2.5);
    const dashMat = new THREE.MeshStandardMaterial({
      color: 0x444455,
      emissive: 0x222233,
      emissiveIntensity: 0.3,
    });
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(-27, 0.03, z);
    scene.add(dash);
  }

  const buildingMeshes: THREE.Mesh[] = [];
  BUILDINGS.forEach((def) => {
    const geo = new THREE.BoxGeometry(def.size[0], def.size[1], def.size[2]);
    const mat = new THREE.MeshStandardMaterial({
      color: def.color,
      emissive: def.emissive,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: def.type === "suites" ? 0.85 : 0.7,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      def.position[0],
      def.size[1] / 2 + def.position[1],
      def.position[2],
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    buildingMeshes.push(mesh);

    if (def.type === "suites") {
      const edgesGeo = new THREE.EdgesGeometry(geo);
      const edgesMat = new THREE.LineBasicMaterial({
        color: 0x00ffaa,
        transparent: true,
        opacity: 0.4,
      });
      const edges = new THREE.LineSegments(edgesGeo, edgesMat);
      edges.position.copy(mesh.position);
      scene.add(edges);

      const floorHeight = 3.6;
      for (let f = 1; f < 5; f++) {
        const floorGeo = new THREE.PlaneGeometry(
          def.size[0] + 0.2,
          def.size[2] + 0.2,
        );
        const floorMat = new THREE.MeshBasicMaterial({
          color: 0x00ffaa,
          transparent: true,
          opacity: 0.06,
          side: THREE.DoubleSide,
        });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.set(
          def.position[0],
          f * floorHeight,
          def.position[2],
        );
        scene.add(floorMesh);
      }

      const room223Y = 1 * floorHeight + floorHeight / 2;
      const room223Geo = new THREE.BoxGeometry(6, floorHeight - 0.4, 5);
      const room223Mat = new THREE.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0x92400e,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.5,
      });
      const room223 = new THREE.Mesh(room223Geo, room223Mat);
      room223.position.set(0, room223Y, -5);
      scene.add(room223);

      const pulseGeo = new THREE.RingGeometry(4, 4.5, 32);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0xff3333,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const pulseRing = new THREE.Mesh(pulseGeo, pulseMat);
      pulseRing.rotation.x = -Math.PI / 2;
      pulseRing.position.set(0, room223Y, -5);
      (pulseRing as any)._isPulse = true;
      scene.add(pulseRing);
    }

    if (def.type === "ice") {
      const edgesGeo = new THREE.EdgesGeometry(geo);
      const edgesMat = new THREE.LineBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.3,
      });
      const edges = new THREE.LineSegments(edgesGeo, edgesMat);
      edges.position.copy(mesh.position);
      scene.add(edges);
    }

    for (let f = 0; f < Math.floor(def.size[1] / 3); f++) {
      for (let w = 0; w < 6; w++) {
        const winGeo = new THREE.PlaneGeometry(1.5, 1.2);
        const isLit = Math.random() > 0.5;
        const winMat = new THREE.MeshBasicMaterial({
          color: isLit
            ? def.type === "ice"
              ? 0xffaa33
              : 0x66ccff
            : 0x111122,
          transparent: true,
          opacity: isLit ? 0.7 : 0.3,
        });
        const win = new THREE.Mesh(winGeo, winMat);
        const wz =
          def.position[2] -
          def.size[2] / 2 +
          4 +
          w * ((def.size[2] - 8) / 5);
        win.position.set(
          def.position[0] + def.size[0] / 2 + 0.01,
          f * 3 + 2,
          wz,
        );
        scene.add(win);
      }
    }
  });

  const towerGroup = new THREE.Group();
  towerGroup.position.set(-38, 0, -55);

  const towerGeo = new THREE.CylinderGeometry(0.4, 0.8, 35, 8);
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x333344,
    metalness: 0.8,
    roughness: 0.2,
  });
  const towerMesh = new THREE.Mesh(towerGeo, towerMat);
  towerMesh.position.y = 17.5;
  towerMesh.castShadow = true;
  towerGroup.add(towerMesh);

  for (let i = 0; i < 4; i++) {
    const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 12, 4);
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x444455 });
    const strut = new THREE.Mesh(strutGeo, strutMat);
    const angle = (i / 4) * Math.PI * 2;
    strut.position.set(Math.cos(angle) * 1.5, 6, Math.sin(angle) * 1.5);
    strut.rotation.z = Math.cos(angle) * 0.3;
    strut.rotation.x = Math.sin(angle) * 0.3;
    towerGroup.add(strut);
  }

  for (let h = 0; h < 3; h++) {
    const dishGeo = new THREE.ConeGeometry(1.5, 0.8, 16, 1, true);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0x666677,
      metalness: 0.9,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(0, 28 + h * 2.5, 0);
    dish.rotation.x = Math.PI / 2 + (h - 1) * 0.4;
    dish.rotation.z = (h * Math.PI * 2) / 3;
    towerGroup.add(dish);
  }

  const beaconGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xd97706,
    transparent: true,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 35.5;
  (beacon as any)._isBeacon = true;
  towerGroup.add(beacon);

  scene.add(towerGroup);

  const rfRings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const rfGeo = new THREE.RingGeometry(2 + i * 8, 2.5 + i * 8, 64);
    const rfMat = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const rfRing = new THREE.Mesh(rfGeo, rfMat);
    rfRing.rotation.x = -Math.PI / 2;
    rfRing.position.set(-38, 30, -55);
    scene.add(rfRing);
    rfRings.push(rfRing);
  }

  const cameraNodes = generateCameras();
  setStats({ cameras: cameraNodes.length, threats: 3 });

  const cameraMeshes: THREE.Group[] = [];
  const coneMeshes: THREE.Mesh[] = [];

  cameraNodes.forEach((cam) => {
    const camGroup = new THREE.Group();
    camGroup.position.copy(cam.position);

    const bodyGeo = new THREE.BoxGeometry(0.4, 0.3, 0.6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x222233,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x00ff88,
      emissiveIntensity: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    camGroup.add(body);

    const lensGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.3, 8);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: 0x00ffaa,
      emissiveIntensity: 0.6,
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.4;
    camGroup.add(lens);

    const coneLen = cam.type === "roof" ? 12 : cam.type === "parking" ? 8 : 5;
    const coneRad =
      coneLen * Math.tan(((cam.fov / 2) * Math.PI) / 180) * 0.5;
    const coneGeo = new THREE.ConeGeometry(coneRad, coneLen, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color:
        cam.type === "roof"
          ? 0xff3366
          : cam.type === "lobby"
            ? 0xffaa00
            : 0x00ff88,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = Math.PI / 2;
    cone.position.z = coneLen / 2 + 0.3;
    camGroup.add(cone);
    coneMeshes.push(cone);

    camGroup.rotation.y = cam.rotation;

    (camGroup as any)._camData = cam;
    cameraMeshes.push(camGroup);
    scene.add(camGroup);
  });

  const particleCount = 800;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const particleSpeeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = Math.random() * 60;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    particleSpeeds[i] = 0.02 + Math.random() * 0.08;
  }
  particleGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  const particleMat = new THREE.PointsMaterial({
    color: 0x00ffaa,
    size: 0.15,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  const scanGeo = new THREE.RingGeometry(0, 50, 64);
  const scanMat = new THREE.MeshBasicMaterial({
    color: 0x00ffaa,
    transparent: true,
    opacity: 0.03,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const scanDisc = new THREE.Mesh(scanGeo, scanMat);
  scanDisc.rotation.x = -Math.PI / 2;
  scanDisc.position.set(0, 0.05, 0);
  scene.add(scanDisc);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const onMouseMove = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const bodies = cameraMeshes.map((g) => g.children[0]);
    const intersects = raycaster.intersectObjects(bodies);

    if (intersects.length > 0) {
      const hit = intersects[0].object.parent as THREE.Group;
      const camData = (hit as any)._camData as CameraNode;
      if (camData) {
        setHoveredCamera(camData);
        container.style.cursor = "pointer";
      }
    } else {
      setHoveredCamera(null);
      container.style.cursor = "grab";
    }
  };
  container.addEventListener("mousemove", onMouseMove);

  let isDown = false;
  let prevX = 0;
  let prevY = 0;
  let cameraAngle = Math.PI / 4;
  let cameraElevation = 0.6;
  let cameraDistance = 85;
  const target = new THREE.Vector3(0, 8, 0);

  const onDown = (e: MouseEvent) => {
    isDown = true;
    prevX = e.clientX;
    prevY = e.clientY;
    container.style.cursor = "grabbing";
  };
  const onUp = () => {
    isDown = false;
    container.style.cursor = "grab";
  };
  const onDrag = (e: MouseEvent) => {
    if (!isDown) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    cameraAngle -= dx * 0.005;
    cameraElevation = Math.max(
      0.1,
      Math.min(1.4, cameraElevation + dy * 0.005),
    );
    prevX = e.clientX;
    prevY = e.clientY;
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    cameraDistance = Math.max(30, Math.min(200, cameraDistance + e.deltaY * 0.1));
  };

  container.addEventListener("mousedown", onDown);
  container.addEventListener("mouseup", onUp);
  container.addEventListener("mouseleave", onUp);
  container.addEventListener("mousemove", onDrag);
  container.addEventListener("wheel", onWheel, { passive: false });

  let animId: number;
  const clock = new THREE.Clock();

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    camera.position.set(
      target.x + Math.cos(cameraAngle) * cameraDistance * Math.cos(cameraElevation),
      target.y + Math.sin(cameraElevation) * cameraDistance,
      target.z + Math.sin(cameraAngle) * cameraDistance * Math.cos(cameraElevation),
    );
    camera.lookAt(target);

    scene.traverse((obj) => {
      if ((obj as any)._isPulse) {
        const s = 1 + Math.sin(elapsed * 2) * 0.4;
        obj.scale.set(s, s, s);
        (obj as THREE.Mesh).material &&
          ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity !== undefined &&
          (((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
            0.3 + Math.sin(elapsed * 3) * 0.3);
      }
      if ((obj as any)._isBeacon) {
        ((obj as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
          0.5 + Math.sin(elapsed * 4) * 0.5;
      }
    });

    coneMeshes.forEach((cone, i) => {
      const baseOp = 0.04;
      const pulse = Math.sin(elapsed * 1.5 + i * 0.3) * 0.03;
      (cone.material as THREE.MeshBasicMaterial).opacity = baseOp + pulse;
    });

    cameraMeshes.forEach((g, i) => {
      const cam = (g as any)._camData as CameraNode;
      if (cam.type === "roof") {
        g.rotation.y = cam.rotation + Math.sin(elapsed * 0.3 + i) * 0.8;
      }
    });

    rfRings.forEach((ring, i) => {
      const s = 1 + ((elapsed * 0.5 + i * 0.3) % 1) * 2;
      ring.scale.set(s, s, s);
      (ring.material as THREE.MeshBasicMaterial).opacity =
        0.15 * (1 - ((elapsed * 0.5 + i * 0.3) % 1));
    });

    const posArr = particleGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      posArr[i * 3 + 1] += particleSpeeds[i];
      if (posArr[i * 3 + 1] > 60) {
        posArr[i * 3 + 1] = 0;
        posArr[i * 3] = (Math.random() - 0.5) * 200;
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 200;
      }
    }
    particleGeo.attributes.position.needsUpdate = true;

    const scanS = 1 + ((elapsed * 0.2) % 1) * 3;
    scanDisc.scale.set(scanS, scanS, scanS);
    scanMat.opacity = 0.04 * (1 - ((elapsed * 0.2) % 1));

    renderer.render(scene, camera);
  };

  animate();

  const onResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
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
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
    resetView: () => {
      cameraAngle = Math.PI / 4;
      cameraElevation = 0.6;
      cameraDistance = 85;
    },
    zoomIn: () => {
      cameraDistance = Math.max(30, cameraDistance - 15);
    },
    zoomOut: () => {
      cameraDistance = Math.min(200, cameraDistance + 15);
    },
    focusRoom223: () => {
      cameraAngle = Math.PI / 3;
      cameraElevation = 0.3;
      cameraDistance = 35;
      target.set(0, 5, -5);
    },
  };
}

export default function SuitesCristinaPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null);
  const [hoveredCamera, setHoveredCamera] = useState<CameraNode | null>(null);
  const [stats, setStats] = useState({ cameras: 0, threats: 0 });
  const [activeFloor, setActiveFloor] = useState<number | null>(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const s = createScene(containerRef.current, setHoveredCamera, setStats);
    sceneRef.current = s;
    return () => s.destroy();
  }, []);

  const cameraTypeColors: Record<string, string> = {
    corridor: "text-emerald-400",
    exterior: "text-cyan-400",
    stairwell: "text-amber-400",
    lobby: "text-orange-400",
    parking: "text-blue-400",
    roof: "text-rose-400",
  };

  return (
    <div className="relative w-full h-full bg-[#020208] overflow-hidden" data-testid="page-suites-cristina">
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab"
        data-testid="canvas-3d-map"
      />

      <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none z-10">
        <div className="pointer-events-auto space-y-2">
          <div className="bg-black/80 backdrop-blur-md border border-emerald-500/20 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider" data-testid="text-classification">
                CLASSIFIED — KAPPA SIGINT
              </span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight" data-testid="text-page-title">
              SUITES CRISTINA — TACTICAL SURVEILLANCE MAP
            </h1>
            <p className="text-xs text-emerald-400/70 font-mono" data-testid="text-subtitle">
              Sabana Norte, San José • Adjacent to ICE HQ • {SUITES_CRISTINA_COORDS.lat.toFixed(4)}°N {Math.abs(SUITES_CRISTINA_COORDS.lng).toFixed(4)}°W
            </p>
          </div>

          <Card className="bg-black/70 backdrop-blur-md border-amber-500/20 max-w-xs">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-300" data-testid="text-room-223">ROOM 223 — ECHO</span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono leading-relaxed">
                2nd floor, directly above lobby. Active target location.
                EvoFusion coverage: 360° perimeter + corridor + stairwell.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                onClick={() => sceneRef.current?.focusRoom223()}
                data-testid="button-focus-room-223"
              >
                <Eye className="h-3 w-3 mr-1" /> Focus Room 223
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="pointer-events-auto space-y-2">
          <div className="bg-black/80 backdrop-blur-md border border-emerald-500/20 rounded-lg px-3 py-2 text-right">
            <div className="text-[10px] text-gray-500 font-mono uppercase">Local Time (CST)</div>
            <div className="text-lg font-mono text-emerald-400 tabular-nums" data-testid="text-clock">
              {time.toLocaleTimeString("en-US", { hour12: false })}
            </div>
            <div className="text-[10px] text-gray-500 font-mono">
              {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>

          <div className="flex gap-1 justify-end">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-black/70 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => sceneRef.current?.zoomIn()}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-black/70 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => sceneRef.current?.zoomOut()}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-black/70 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => sceneRef.current?.resetView()}
              data-testid="button-reset-view"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-auto z-10 space-y-2">
        <Card className="bg-black/80 backdrop-blur-md border-emerald-500/20 w-72">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Surveillance Grid</span>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]" data-testid="badge-cam-count">
                {stats.cameras} NODES
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <Camera className="h-4 w-4 mx-auto text-emerald-400 mb-1" />
                <div className="text-sm font-bold text-white" data-testid="text-evopro-count">72</div>
                <div className="text-[9px] text-gray-500 font-mono">EVOPRO 4K</div>
              </div>
              <div className="text-center">
                <Building2 className="h-4 w-4 mx-auto text-amber-400 mb-1" />
                <div className="text-sm font-bold text-white" data-testid="text-ice-count">3</div>
                <div className="text-[9px] text-gray-500 font-mono">ICE BLDGS</div>
              </div>
              <div className="text-center">
                <Radio className="h-4 w-4 mx-auto text-amber-400 mb-1" />
                <div className="text-sm font-bold text-white" data-testid="text-tower-count">1</div>
                <div className="text-[9px] text-gray-500 font-mono">RF TOWER</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-gray-500 font-mono uppercase">Camera Types</div>
              {["corridor", "exterior", "stairwell", "lobby", "parking", "roof"].map(
                (type) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono ${cameraTypeColors[type]}`}>
                      {type.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {generateCameras().filter((c) => c.type === type).length}
                    </span>
                  </div>
                ),
              )}
            </div>

            <div className="border-t border-emerald-500/10 pt-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-mono">3 ICE BUILDINGS — DIRECT LINE OF SIGHT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-mono">RF TOWER — S-BAND CAPABLE</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {hoveredCamera && (
        <div
          className="absolute bottom-4 right-4 z-10 pointer-events-none"
          data-testid="panel-camera-info"
        >
          <Card className="bg-black/90 backdrop-blur-md border-cyan-500/30 w-64">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Camera className={`h-4 w-4 ${cameraTypeColors[hoveredCamera.type]}`} />
                <span className="text-sm font-mono text-white font-bold">{hoveredCamera.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] font-mono">
                <span className="text-gray-500">TYPE</span>
                <span className={cameraTypeColors[hoveredCamera.type]}>
                  {hoveredCamera.type.toUpperCase()}
                </span>
                <span className="text-gray-500">FLOOR</span>
                <span className="text-gray-300">
                  {hoveredCamera.floor === 0
                    ? "GROUND"
                    : hoveredCamera.floor === 5
                      ? "ROOF"
                      : `F${hoveredCamera.floor + 1}`}
                </span>
                <span className="text-gray-500">FOV</span>
                <span className="text-gray-300">{hoveredCamera.fov}°</span>
                <span className="text-gray-500">MODEL</span>
                <span className="text-emerald-400">EvoFusion 4K</span>
                <span className="text-gray-500">STATUS</span>
                <span className="text-green-400">● ACTIVE</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded px-3 py-1 text-[10px] text-gray-500 font-mono">
          DRAG to orbit • SCROLL to zoom • Hover cameras for intel
        </div>
      </div>
    </div>
  );
}
