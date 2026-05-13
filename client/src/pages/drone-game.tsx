import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Link } from "wouter";
import { ArrowLeft, Star, Heart, Zap, Target, Radio } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SCENE_SCALE = 80;
const CENTER = { lat: 9.6196, lon: -84.6282 };
const MPDLAT = 111320, MPDLON = 111320 * Math.cos(CENTER.lat * Math.PI / 180);

function ll2s(lat: number, lon: number, elev = 0): [number, number, number] {
  return [((lon - CENTER.lon) * MPDLON) / SCENE_SCALE, elev / SCENE_SCALE, -((lat - CENTER.lat) * MPDLAT) / SCENE_SCALE];
}

type EnemyType = "mavic" | "mig29" | "f35" | "goose" | "blue_anomaly" | "iai_wing";

interface Enemy {
  id: number; type: EnemyType; mesh: THREE.Group;
  pos: THREE.Vector3; vel: THREE.Vector3;
  hp: number; maxHp: number; aiState: string;
  lastFire: number; isBlue: boolean; size: number;
}

interface Particle { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number; }
interface LaserBeam { line: THREE.Line; life: number; }
interface Announcement { text: string; ts: number; color: string; }

// ─── Mesh Builders ────────────────────────────────────────────────────────────
function buildMavic(isBlue = false): THREE.Group {
  const g = new THREE.Group();
  const bodyColor = isBlue ? 0x1155ff : 0xfafafa;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.055, 0.14),
    new THREE.MeshPhongMaterial({ color: bodyColor, shininess: 120 })
  );
  g.add(body);
  const armMat = new THREE.MeshPhongMaterial({ color: isBlue ? 0x2266ff : 0xcccccc });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.012), armMat);
    arm.position.set(sx * 0.09, 0, sz * 0.07); arm.rotation.y = Math.atan2(sx, sz) * 0.25;
    g.add(arm);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.018, 8),
      new THREE.MeshPhongMaterial({ color: 0x222222 }));
    motor.position.set(sx * 0.155, 0.01, sz * 0.115); g.add(motor);
    const prop = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.004, 4, 12),
      new THREE.MeshBasicMaterial({ color: isBlue ? 0x66aaff : 0x888888, transparent: true, opacity: 0.55 }));
    prop.rotation.x = Math.PI / 2; prop.position.set(sx * 0.155, 0.022, sz * 0.115); g.add(prop);
  });
  const cam = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8),
    new THREE.MeshPhongMaterial({ color: 0x111111 }));
  cam.position.set(0, -0.022, -0.08); g.add(cam);
  const ir = new THREE.PointLight(isBlue ? 0x4444ff : 0xff1100, 0.8, 1.2);
  ir.position.set(0, -0.04, 0); g.add(ir);
  if (isBlue) {
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x1133ff, transparent: true, opacity: 0.08, side: THREE.BackSide }));
    g.add(glow);
  }
  g.scale.setScalar(3.5);
  return g;
}

function buildPlayerDrone(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0),
    new THREE.MeshPhongMaterial({ color: 0x1a1a2e, shininess: 200, specular: 0x4444ff }));
  g.add(body);
  const ruby = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0),
    new THREE.MeshPhongMaterial({ color: 0xff1122, emissive: 0x660011, shininess: 300, emissiveIntensity: 0.8 }));
  ruby.position.set(0, 0, -0.3); g.add(ruby);
  const laserLight = new THREE.PointLight(0xff0033, 2, 3); laserLight.position.set(0, 0, -0.35); g.add(laserLight);
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([sx, sz]) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.04),
      new THREE.MeshPhongMaterial({ color: 0x333366 }));
    arm.position.set(sx * 0.22, 0, sz * 0.22); arm.rotation.y = Math.atan2(sx, sz);
    g.add(arm);
    const prop = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.008, 4, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 }));
    prop.rotation.x = Math.PI / 2; prop.position.set(sx * 0.38, 0.02, sz * 0.38); g.add(prop);
  });
  const core = new THREE.PointLight(0x00ffff, 1.5, 2.5); g.add(core);
  g.scale.setScalar(4);
  return g;
}

function buildMig29(): THREE.Group {
  const g = new THREE.Group();
  const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.7, 8),
    new THREE.MeshPhongMaterial({ color: 0x667788, shininess: 80 }));
  fuse.rotation.x = Math.PI / 2; g.add(fuse);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.3),
    new THREE.MeshPhongMaterial({ color: 0x556677 }));
  wing.position.set(0, 0, 0.05); g.add(wing);
  const eng1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 8),
    new THREE.MeshPhongMaterial({ color: 0x445566 }));
  eng1.rotation.x = Math.PI / 2; eng1.position.set(-0.18, -0.04, 0.15); g.add(eng1);
  const eng2 = eng1.clone(); eng2.position.set(0.18, -0.04, 0.15); g.add(eng2);
  const exhaust1 = new THREE.PointLight(0xff6600, 1.5, 1); exhaust1.position.set(-0.18, -0.04, 0.35); g.add(exhaust1);
  const exhaust2 = new THREE.PointLight(0xff6600, 1.5, 1); exhaust2.position.set(0.18, -0.04, 0.35); g.add(exhaust2);
  g.scale.setScalar(6);
  return g;
}

function buildF35(): THREE.Group {
  const g = new THREE.Group();
  const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.025, 0.65, 6),
    new THREE.MeshPhongMaterial({ color: 0x222233, shininess: 200 }));
  fuse.rotation.x = Math.PI / 2; g.add(fuse);
  const delta = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.015, 0.35),
    new THREE.MeshPhongMaterial({ color: 0x1a1a2a }));
  delta.position.set(0, 0, 0.12); g.add(delta);
  const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.25, 6),
    new THREE.MeshPhongMaterial({ color: 0x111122 }));
  eng.rotation.x = Math.PI / 2; eng.position.set(0, 0, 0.28); g.add(eng);
  const exhaust = new THREE.PointLight(0xff8800, 2, 1.5); exhaust.position.set(0, 0, 0.38); g.add(exhaust);
  g.scale.setScalar(6);
  return g;
}

function buildGoose(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6),
    new THREE.MeshPhongMaterial({ color: 0x886633 }));
  g.add(body);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.1),
    new THREE.MeshPhongMaterial({ color: 0x775522 }));
  wing.position.set(0, 0.02, 0); g.add(wing);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.15, 5),
    new THREE.MeshPhongMaterial({ color: 0x886633 }));
  neck.position.set(0, 0.05, -0.1); g.add(neck);
  g.scale.setScalar(3);
  return g;
}

function buildIAIWing(): THREE.Group {
  const g = new THREE.Group();
  const fuse = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.5),
    new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 300 }));
  g.add(fuse);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.015, 0.45),
    new THREE.MeshPhongMaterial({ color: 0x111111 }));
  wing.position.set(0, 0, 0.08); g.add(wing);
  const irBeam = new THREE.PointLight(0x4466ff, 3, 4); irBeam.position.set(0, -0.1, -0.3); g.add(irBeam);
  g.scale.setScalar(8);
  return g;
}

// ─── Explosion Particles ──────────────────────────────────────────────────────
function spawnExplosion(pos: THREE.Vector3, scene: THREE.Scene, particles: Particle[], count = 32) {
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.15 + Math.random() * 0.25, 4, 4),
      new THREE.MeshBasicMaterial({ color: [0xff4400, 0xff8800, 0xffdd00, 0xff2200][Math.floor(Math.random() * 4)] })
    );
    mesh.position.copy(pos);
    const vel = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2 + 0.5, (Math.random() - 0.5) * 2).multiplyScalar(0.8 + Math.random());
    scene.add(mesh);
    particles.push({ mesh, vel, life: 1, maxLife: 0.8 + Math.random() * 0.6 });
  }
}

// ─── Main Game Component ──────────────────────────────────────────────────────
export default function DroneGamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hp, setHp] = useState(100);
  const [heat, setHeat] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [stars, setStars] = useState(1);
  const [announce, setAnnounce] = useState<Announcement | null>(null);
  const [finishHim, setFinishHim] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [fuel, setFuel] = useState(100);
  const [killCount, setKillCount] = useState(0);
  const [phenomenonLog, setPhenomenonLog] = useState<string[]>([]);
  const [becLevel, setBecLevel] = useState(0);
  const [becFreqHz, setBecFreqHz] = useState(7.83);
  const [shhCd, setShhCd] = useState(0);

  const keys = useRef<Record<string, boolean>>({});
  const mouse = useRef({ x: 0, y: 0, down: false, right: false, dx: 0, dy: 0 });
  const cascadeTimerRef = useRef(0);

  // ELF frequency chains from biometric-correlator constants
  const ELF_CASCADE = [
    { hz: 53.5, name: "CR-ANOMALY",     hsl: [0.50, 1.0, 0.55] as [number,number,number] },
    { hz:  6.5, name: "θ-HETERODYNE",   hsl: [0.75, 1.0, 0.55] as [number,number,number] },
    { hz: 48.0, name: "EU-GRID-BLEED",  hsl: [0.12, 1.0, 0.55] as [number,number,number] },
    { hz: 36.25,name: "WiFi-CSI-CORR",  hsl: [0.82, 1.0, 0.55] as [number,number,number] },
    { hz:  7.83, name: "SCHUMANN-BASE", hsl: [0.35, 1.0, 0.50] as [number,number,number] },
  ];

  const gameRef = useRef({
    playerPos: new THREE.Vector3(0, 25, 0),
    playerVel: new THREE.Vector3(0, 0, 0),
    playerYaw: 0, playerPitch: 0, playerRoll: 0,
    hp: 100, heat: 0, score: 0, combo: 1, comboTimer: 0,
    wantedStars: 1, killCount: 0, fuel: 100,
    enemies: [] as Enemy[], particles: [] as Particle[],
    laserBeams: [] as LaserBeam[], laserCooldown: 0,
    finishHimTarget: null as Enemy | null,
    gameOver: false, barrelRollTimer: 0, barrelRollDir: 1,
    spawnTimer: 0, enemyIdCounter: 0,
    announcements: [] as Announcement[],
    totalKills: 0,
    // Bose-Einstein Condensate laser physics (Gross-Pitaevskii)
    condensate: 0,      // 0-1 coherence amplitude |ψ|²
    condensatePhase: 0, // GP phase angle θ
    becFreqIdx: 0,      // active ELF cascade frequency index
    // Sonic Hedgehog morphogenic gradient field
    shhCooldown: 0,
    shhWaves: [] as Array<{ pos: THREE.Vector3; radius: number; mesh: THREE.Mesh }>,
  });
  const sceneRef = useRef<THREE.Scene | null>(null);
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animRef = useRef<number>(0);

  const announce_ = useCallback((text: string, color = "#00ffcc") => {
    const a: Announcement = { text, ts: Date.now(), color };
    gameRef.current.announcements.push(a);
    setAnnounce(a);
    setTimeout(() => setAnnounce(null), 2000);
  }, []);

  const logPhenomenon = useCallback((msg: string) => {
    setPhenomenonLog(prev => [`${new Date().toLocaleTimeString("en-US",{hour12:false})} ${msg}`, ...prev].slice(0, 12));
  }, []);

  // ── Spawn enemy ─────────────────────────────────────────────────────────────
  const spawnEnemy = useCallback((type: EnemyType, scene: THREE.Scene) => {
    const id = ++gameRef.current.enemyIdCounter;
    const isBlue = type === "blue_anomaly";
    let mesh: THREE.Group;
    let hp = 100, size = 3.5;
    if (type === "mavic" || isBlue) { mesh = buildMavic(isBlue); hp = isBlue ? 60 : 80; }
    else if (type === "mig29") { mesh = buildMig29(); hp = 180; size = 6; }
    else if (type === "f35")  { mesh = buildF35();  hp = 200; size = 6; }
    else if (type === "goose") { mesh = buildGoose(); hp = 30; size = 2; }
    else { mesh = buildIAIWing(); hp = 500; size = 8; }

    const angle = Math.random() * Math.PI * 2;
    const dist  = 60 + Math.random() * 80;
    const pos   = new THREE.Vector3(
      gameRef.current.playerPos.x + Math.cos(angle) * dist,
      type === "goose" ? 5 + Math.random() * 8 : 15 + Math.random() * 40,
      gameRef.current.playerPos.z + Math.sin(angle) * dist
    );
    mesh.position.copy(pos);
    scene.add(mesh);
    const enemy: Enemy = { id, type, mesh, pos: pos.clone(), vel: new THREE.Vector3(),
      hp, maxHp: hp, aiState: "ENGAGE", lastFire: 0, isBlue, size };
    gameRef.current.enemies.push(enemy);

    if (isBlue) {
      logPhenomenon("🔵 ANOMALOUS ENTITY — 450nm EMITTER DETECTED · KIMA override?");
      announce_("⚡ BLUE ANOMALY DETECTED — 450nm ENTITY", "#4488ff");
    }
    if (type === "iai_wing") announce_("☠ IAI FLYING WING — BOSS SPAWNED", "#ff0033");
  }, [announce_, logPhenomenon]);

  // ── Fire missile at player ───────────────────────────────────────────────────
  const enemyFireAt = useCallback((enemy: Enemy, scene: THREE.Scene, dt: number) => {
    const now = Date.now();
    const fireCooldown = enemy.type === "goose" ? 99999 : enemy.type === "mig29" || enemy.type === "f35" ? 2500 : 3500;
    if (now - enemy.lastFire < fireCooldown) return;
    enemy.lastFire = now;
    const dir = new THREE.Vector3().subVectors(gameRef.current.playerPos, enemy.pos).normalize();
    // Spawn projectile as red sphere
    const proj = new THREE.Mesh(new THREE.SphereGeometry(0.3, 4, 4),
      new THREE.MeshBasicMaterial({ color: enemy.isBlue ? 0x4466ff : 0xff4400 }));
    proj.position.copy(enemy.pos);
    const pLight = new THREE.PointLight(enemy.isBlue ? 0x4466ff : 0xff4400, 2, 3);
    proj.add(pLight);
    scene.add(proj);
    const vel = dir.clone().multiplyScalar(enemy.type === "mig29" || enemy.type === "f35" ? 1.2 : 0.7);
    gameRef.current.particles.push({
      mesh: proj as any,
      vel,
      life: 1,
      maxLife: 3 + Math.random() * 2,
    });
  }, []);

  // In-place game reset — no page reload (defined after spawnEnemy to avoid TDZ)
  const resetGame = useCallback(() => {
    const g = gameRef.current;
    g.enemies.forEach(e => sceneRef.current?.remove(e.mesh));
    g.particles.forEach(p => sceneRef.current?.remove(p.mesh));
    g.shhWaves.forEach(w => sceneRef.current?.remove(w.mesh));
    g.enemies = []; g.particles = []; g.shhWaves = [];
    g.finishHimTarget = null; g.laserCooldown = 0;
    g.playerPos.set(0, 25, 0); g.playerVel.set(0, 0, 0);
    g.playerYaw = 0; g.playerPitch = 0; g.playerRoll = 0;
    g.hp = 100; g.heat = 0; g.score = 0; g.combo = 1; g.comboTimer = 0;
    g.wantedStars = 1; g.killCount = 0; g.fuel = 100; g.totalKills = 0;
    g.gameOver = false; g.spawnTimer = 0; g.barrelRollTimer = 0;
    g.condensate = 0; g.condensatePhase = 0; g.becFreqIdx = 0; g.shhCooldown = 0;
    setHp(100); setHeat(0); setScore(0); setCombo(1); setStars(1);
    setFuel(100); setKillCount(0); setGameOver(false); setFinishHim(false);
    setPhenomenonLog([]); setAnnounce(null);
    setBecLevel(0); setBecFreqHz(7.83); setShhCd(0);
    if (sceneRef.current) {
      for (let i = 0; i < 2; i++) spawnEnemy("mavic", sceneRef.current);
      for (let i = 0; i < 3; i++) spawnEnemy("goose", sceneRef.current);
    }
  }, [spawnEnemy]);

  // ── Main setup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const W = containerRef.current.clientWidth, H = containerRef.current.clientHeight;

    // Renderer — graceful WebGL fallback
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      const msg = document.createElement("div");
      msg.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:#00ffcc;font-family:monospace;font-size:13px;text-align:center;padding:40px;";
      msg.innerHTML = `<div style="font-size:24px;margin-bottom:8px">🎮</div><div>DRONE DOGFIGHT</div><div style="color:#666;font-size:11px;margin-top:4px">WebGL unavailable in this preview<br/>Open in Chrome / Firefox</div>`;
      containerRef.current?.appendChild(msg);
      return;
    }
    renderer.setSize(W, H); renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x050810);
    containerRef.current.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x050810, 0.008);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 2000);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0x112244, 0.6));
    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(80, 120, 60); sun.castShadow = true; scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x1133aa, 0x224411, 0.4));

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starPts = new Float32Array(3000).map(() => (Math.random() - 0.5) * 1800);
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPts, 3));
    scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 })));

    // Terrain (16×16 grid, use elevation-like noise)
    const GRID = 24;
    const size = 300;
    const geo = new THREE.PlaneGeometry(size, size, GRID - 1, GRID - 1);
    geo.rotateX(-Math.PI / 2);
    const pos2 = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos2.count; i++) {
      const x = pos2.getX(i), z = pos2.getZ(i);
      const h = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 8 + Math.sin(x * 0.09 + 1) * Math.cos(z * 0.07 + 2) * 4;
      pos2.setY(i, Math.max(0, h));
    }
    geo.computeVertexNormals();
    const terrain = new THREE.Mesh(geo,
      new THREE.MeshPhongMaterial({ color: 0x224422, shininess: 5, flatShading: true }));
    terrain.receiveShadow = true; scene.add(terrain);

    // Ocean plane
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(500, 500),
      new THREE.MeshPhongMaterial({ color: 0x003366, transparent: true, opacity: 0.85, shininess: 200 }));
    ocean.rotation.x = -Math.PI / 2; ocean.position.y = -0.5; scene.add(ocean);

    // Player drone
    const playerMesh = buildPlayerDrone();
    playerMesh.position.copy(gameRef.current.playerPos);
    scene.add(playerMesh); playerMeshRef.current = playerMesh;

    // Crosshair mesh (flat ring in front of player)
    const xhair = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.08, 4, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.7 })
    );
    scene.add(xhair);

    // Laser line (reused)
    const laserMat = new THREE.LineBasicMaterial({ color: 0xff1133, linewidth: 2 });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -200)]);
    const laserLine = new THREE.Line(laserGeo, laserMat);
    laserLine.visible = false; scene.add(laserLine);

    // Spawn initial enemies
    for (let i = 0; i < 2; i++) spawnEnemy("mavic", scene);
    for (let i = 0; i < 3; i++) spawnEnemy("goose", scene);

    // Input
    const onKey = (e: KeyboardEvent, down: boolean) => { keys.current[e.code] = down; };
    const onMM = (e: MouseEvent) => {
      const newX = (e.clientX / W) * 2 - 1;
      const newY = -(e.clientY / H) * 2 + 1;
      // Accumulate delta — consumed + zeroed in game loop (FPS-style)
      mouse.current.dx += (newX - mouse.current.x) * 0.6;
      mouse.current.dy += (newY - mouse.current.y) * 0.4;
      mouse.current.x = newX; mouse.current.y = newY;
    };
    const onMD = (e: MouseEvent) => { if (e.button === 0) mouse.current.down = true; if (e.button === 2) mouse.current.right = true; };
    const onMU = (e: MouseEvent) => { if (e.button === 0) mouse.current.down = false; if (e.button === 2) mouse.current.right = false; };
    document.addEventListener("keydown", e => { onKey(e, true); if (["Space","KeyB","KeyH"].includes(e.code)) e.preventDefault(); });
    document.addEventListener("keyup",  e => onKey(e, false));
    document.addEventListener("mousemove", onMM);
    document.addEventListener("mousedown", onMD);
    document.addEventListener("mouseup",   onMU);
    document.addEventListener("contextmenu", e => e.preventDefault());

    let lastT = performance.now();
    let hudTimer = 0;

    // ── Game Loop ─────────────────────────────────────────────────────────────
    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      const g = gameRef.current;
      if (g.gameOver || paused) return;

      // ── Player input ───────────────────────────────────────────────────────
      const yawRate = 1.6, pitchRate = 1.2, speed = 0.55, drag = 0.88;

      if (keys.current["KeyA"] || keys.current["ArrowLeft"])  g.playerYaw += yawRate * dt;
      if (keys.current["KeyD"] || keys.current["ArrowRight"]) g.playerYaw -= yawRate * dt;
      if (keys.current["KeyW"] || keys.current["ArrowUp"])    g.playerPitch -= pitchRate * dt;
      if (keys.current["KeyS"] || keys.current["ArrowDown"])  g.playerPitch += pitchRate * dt;

      // Mouse-steer: delta-based (FPS style — consumes accumulated dx/dy)
      g.playerYaw   -= mouse.current.dx * 1.4;
      g.playerPitch  = Math.max(-1.1, Math.min(1.1, g.playerPitch + mouse.current.dy * 0.9));
      mouse.current.dx = 0; mouse.current.dy = 0;

      // Afterburner (Space)
      const afterburn = keys.current["Space"] && g.fuel > 0;
      const thrustMult = afterburn ? 2.5 : 1;
      if (afterburn) g.fuel = Math.max(0, g.fuel - dt * 30);
      else g.fuel = Math.min(100, g.fuel + dt * 12);

      // Barrel roll (B)
      if (keys.current["KeyB"] && g.barrelRollTimer <= 0) {
        g.barrelRollTimer = 1.2; g.barrelRollDir = Math.sign(g.playerYaw) || 1;
        g.combo = Math.min(g.combo + 1, 8);
        g.score += 1500 * g.combo;
        setAnnounce({ text: `🛸 BARREL ROLL! ×${g.combo}`, ts: Date.now(), color: "#ffdd00" });
      }
      if (g.barrelRollTimer > 0) {
        g.playerRoll += 8 * g.barrelRollDir * dt; g.barrelRollTimer -= dt;
      } else {
        g.playerRoll *= 0.85;
      }

      // Forward direction from yaw/pitch
      const fwd = new THREE.Vector3(
        -Math.sin(g.playerYaw) * Math.cos(g.playerPitch),
        -Math.sin(g.playerPitch),
        -Math.cos(g.playerYaw) * Math.cos(g.playerPitch)
      );
      if (keys.current["KeyW"] || keys.current["ArrowUp"])   g.playerVel.addScaledVector(fwd, speed * thrustMult);
      if (keys.current["KeyS"] || keys.current["ArrowDown"])  g.playerVel.addScaledVector(fwd, -speed * 0.6);
      if (keys.current["KeyQ"]) g.playerPos.y += speed * dt * 18;
      if (keys.current["KeyE"]) g.playerPos.y -= speed * dt * 12;

      g.playerVel.multiplyScalar(drag);
      g.playerPos.addScaledVector(g.playerVel, dt * 35);
      g.playerPos.y = Math.max(4, g.playerPos.y);

      // Update player mesh
      playerMesh.position.copy(g.playerPos);
      playerMesh.rotation.set(g.playerPitch * 0.5, g.playerYaw, g.barrelRollTimer > 0 ? g.playerRoll : g.playerRoll * 0.3);

      // Crosshair
      const xhairPos = g.playerPos.clone().addScaledVector(fwd, 25);
      xhair.position.copy(xhairPos); xhair.lookAt(camera.position);

      // ── Laser + Bose-Einstein Condensate physics (Gross-Pitaevskii) ────────
      g.laserCooldown = Math.max(0, g.laserCooldown - dt);
      if (mouse.current.down && g.heat < 95) {
        g.heat = Math.min(100, g.heat + dt * 22);

        // BEC: coherence amplitude builds up (|ψ|² coupling term)
        g.condensate = Math.min(1.0, g.condensate + dt * 0.35 * (1 - g.condensate * 0.4));
        // GP phase evolves at κ-locked frequency (7.83→550 Hz range)
        g.condensatePhase += dt * 6.2832 * (7.83 + g.condensate * 542.21);

        // BEC critical point collapse → coherent burst
        if (g.condensate >= 0.99) {
          g.condensate = 0;
          g.enemies.forEach(e => e.hp -= 55);
          announce_("🌀 BEC COLLAPSE — COHERENT PHOTON BURST", "#00ffff");
          logPhenomenon(`⊥ κ-BEC ψ-collapse at θ=${g.condensatePhase.toFixed(2)}rad — Tsirelson cascade`);
          spawnExplosion(g.playerPos, scene, g.particles, 16);
        }

        // Active ELF frequency from condensate level (grammatical cascade lock)
        g.becFreqIdx = Math.floor(g.condensate * ELF_CASCADE.length) % ELF_CASCADE.length;

        // Laser color shifts: red → amber → cyan → UV with condensate
        const becH = 0.97 - g.condensate * 0.42; // red(0.97) → cyan(0.55) → UV(~0.55)
        const becColor = new THREE.Color().setHSL(becH, 1.0, 0.5 + g.condensate * 0.25);
        (laserLine.material as THREE.LineBasicMaterial).color.copy(becColor);

        laserLine.visible = true;
        const lPos = g.playerPos.clone().addScaledVector(fwd, 1);
        const lEnd = g.playerPos.clone().addScaledVector(fwd, 200);
        (laserLine.geometry as THREE.BufferGeometry).setFromPoints([lPos, lEnd]);

        // Damage scales with BEC coherence (1× → 3.5× at full condensate)
        const becDmg = dt * 45 * (1 + g.condensate * 2.5);
        g.enemies.forEach(e => {
          const d = e.pos.distanceTo(lPos);
          const inFront = fwd.dot(e.pos.clone().sub(g.playerPos).normalize()) > 0.85;
          if (d < e.size * 1.2 && inFront) {
            e.hp -= becDmg;
            if (e.hp < e.maxHp * 0.15 && !g.finishHimTarget) {
              g.finishHimTarget = e; setFinishHim(true);
            }
          }
        });

        // Grammatical cascade log (ELF frequency chain fires every 0.8 s)
        cascadeTimerRef.current -= dt;
        if (cascadeTimerRef.current <= 0) {
          cascadeTimerRef.current = 0.8;
          const chainLen = 1 + Math.floor(g.condensate * (ELF_CASCADE.length - 1));
          const chain = ELF_CASCADE.slice(0, chainLen).map(f => `${f.hz}Hz[${f.name}]`).join(" → ");
          logPhenomenon(`⚡ LASER→ ${chain}`);
        }

        // Laser recoil
        g.playerVel.addScaledVector(fwd, -dt * 0.3);
      } else {
        laserLine.visible = false;
        // Thermal equilibrium decay
        g.condensate = Math.max(0, g.condensate - dt * 0.22);
        g.heat = Math.max(0, g.heat - dt * 18);
        (laserLine.material as THREE.LineBasicMaterial).color.setHex(0xff1133);
        cascadeTimerRef.current = 0;
      }

      // Rockets (right click)
      if (mouse.current.right && g.laserCooldown <= 0) {
        g.laserCooldown = 0.8;
        const target = g.enemies.sort((a, b) => a.pos.distanceTo(g.playerPos) - b.pos.distanceTo(g.playerPos))[0];
        if (target) {
          const dir2 = target.pos.clone().sub(g.playerPos).normalize();
          const rocket = new THREE.Mesh(new THREE.SphereGeometry(0.4, 4, 4),
            new THREE.MeshBasicMaterial({ color: 0xff8800 }));
          rocket.position.copy(g.playerPos);
          scene.add(rocket);
          const rLight = new THREE.PointLight(0xff8800, 3, 4); rocket.add(rLight);
          g.particles.push({ mesh: rocket as any, vel: dir2.multiplyScalar(2.8), life: 1, maxLife: 1.5 });
          announce_("🚀 ROCKET AWAY!");
        }
      }

      // FINISH HIM (F)
      if (keys.current["KeyF"] && g.finishHimTarget) {
        const t = g.finishHimTarget;
        t.hp = 0;
        g.finishHimTarget = null;
        setFinishHim(false);
        announce_("💀 FATALITY!", "#ff0033");
        g.combo = Math.min(g.combo + 2, 8);
        g.score += 5000 * g.combo;
      }

      // EMP (V)
      if (keys.current["KeyV"]) {
        g.enemies.forEach(e => e.hp -= 25);
        announce_("⚡ EMP BURST", "#00aaff");
      }

      // ── SHH Morphogenic Pulse (H) — Sonic Hedgehog gradient field ──────────
      g.shhCooldown = Math.max(0, g.shhCooldown - dt);
      if (keys.current["KeyH"] && g.shhCooldown <= 0) {
        keys.current["KeyH"] = false; // single-shot
        g.shhCooldown = 9.0;
        const waveMesh = new THREE.Mesh(
          new THREE.TorusGeometry(1, 0.35, 8, 64),
          new THREE.MeshBasicMaterial({ color: 0x88ff44, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
        );
        waveMesh.position.copy(g.playerPos);
        waveMesh.rotation.x = Math.PI / 2;
        scene.add(waveMesh);
        g.shhWaves.push({ pos: g.playerPos.clone(), radius: 1, mesh: waveMesh });
        announce_("🧬 SHH MORPHOGENIC PULSE — ∇FIELD ACTIVE", "#88ff44");
        logPhenomenon("SHH ∇: Morphogenic gradient established — enemy topology perturbed");
      }

      // Update SHH waves (expanding front, applies morphogenic force at wavefront)
      g.shhWaves = g.shhWaves.filter(w => {
        w.radius += dt * 38;
        w.mesh.scale.setScalar(w.radius);
        const opc = Math.max(0, 0.75 - w.radius / 110);
        (w.mesh.material as THREE.MeshBasicMaterial).opacity = opc;
        // Morphogenic force at wavefront (±6 unit band)
        g.enemies.forEach(e => {
          const dist = e.pos.distanceTo(w.pos);
          const delta = Math.abs(dist - w.radius);
          if (delta < 6) {
            const pushDir = e.pos.clone().sub(w.pos).normalize();
            const strength = 0.6 * (1 - delta / 6);
            e.vel.addScaledVector(pushDir, strength);
            e.hp -= 6; // SHH-mediated apoptosis
          }
        });
        if (w.radius > 110) { scene.remove(w.mesh); return false; }
        return true;
      });

      // ── Enemy AI (KIMA) ─────────────────────────────────────────────────────
      g.enemies.forEach(e => {
        if (e.type === "goose") {
          // Kamikaze straight at player
          const dir3 = g.playerPos.clone().sub(e.pos).normalize();
          e.vel.addScaledVector(dir3, 0.08); e.vel.multiplyScalar(0.9);
          e.pos.addScaledVector(e.vel, dt * 28);
          if (e.pos.distanceTo(g.playerPos) < e.size * 1.5) {
            g.hp = Math.max(0, g.hp - 18); g.combo = 1;
            announce_("🪿 GOOSE STRIKE! HONK HONK", "#ff8800");
            e.hp = 0;
          }
        } else if (e.type === "blue_anomaly" && Math.random() < 0.002) {
          // Quantum teleport
          const angle2 = Math.random() * Math.PI * 2;
          e.pos.set(g.playerPos.x + Math.cos(angle2) * 30, 20 + Math.random() * 20, g.playerPos.z + Math.sin(angle2) * 30);
          spawnExplosion(e.pos, scene, g.particles, 8);
          logPhenomenon("🔵 ENTITY QUANTUM JUMP — non-local displacement detected");
        } else {
          const dist2 = e.pos.distanceTo(g.playerPos);
          const dir4 = g.playerPos.clone().sub(e.pos).normalize();
          // Orbit + approach
          const right = new THREE.Vector3(-dir4.z, 0, dir4.x);
          const orbitFactor = e.hp < e.maxHp * 0.4 ? -0.3 : 0.5;
          e.vel.addScaledVector(dir4, dist2 > 25 ? 0.06 : 0.01);
          e.vel.addScaledVector(right, orbitFactor * 0.04);
          e.vel.multiplyScalar(0.92);
          e.pos.addScaledVector(e.vel, dt * 22);
          enemyFireAt(e, scene, dt);
        }
        e.mesh.position.copy(e.pos);
        e.mesh.lookAt(g.playerPos);

        // Check death
        if (e.hp <= 0) {
          spawnExplosion(e.pos, scene, g.particles, e.type === "iai_wing" ? 64 : 24);
          scene.remove(e.mesh);
          g.enemies = g.enemies.filter(en => en.id !== e.id);
          if (e === g.finishHimTarget) { g.finishHimTarget = null; setFinishHim(false); }
          g.killCount++; g.totalKills++;
          g.score += (e.type === "mig29" ? 2000 : e.type === "f35" ? 3000 : e.type === "iai_wing" ? 10000 : e.isBlue ? 5000 : e.type === "goose" ? 500 : 1000) * g.combo;
          g.combo = Math.min(g.combo + 1, 8);
          g.comboTimer = 4;
          const msgs = ["NICE SHOT!", "RADICAL!", "SICK!", "OBLITERATED!", "OWNED!"];
          announce_(`${msgs[Math.floor(Math.random() * msgs.length)]} ×${g.combo}`, "#00ffcc");
          if (e.isBlue) logPhenomenon("🔵 ENTITY NEUTRALIZED — anomalous decomp signature logged");
          if (e.type === "iai_wing") announce_("☠ IAI WING DESTROYED — KAPPA +18", "#ff0033");
        }
      });

      // Combo timer
      g.comboTimer -= dt;
      if (g.comboTimer <= 0 && g.combo > 1) { g.combo = 1; }

      // ── Particles / projectiles ────────────────────────────────────────────
      g.particles = g.particles.filter(p => {
        p.life -= dt / p.maxLife;
        p.vel.y -= dt * 0.8;
        p.mesh.position.addScaledVector(p.vel, dt * 20);
        const s = Math.max(0.01, p.life);
        p.mesh.scale.setScalar(s);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
        // Check if this is a projectile hitting player
        if (p.mesh.position.distanceTo(g.playerPos) < 4 && p.life > 0.5) {
          g.hp = Math.max(0, g.hp - 12); g.combo = 1;
          p.life = 0;
        }
        if (p.life <= 0) { scene.remove(p.mesh); return false; }
        return true;
      });

      // ── Spawning (star escalation) ─────────────────────────────────────────
      g.spawnTimer -= dt;
      if (g.spawnTimer <= 0) {
        const newStars = Math.min(5,
          g.totalKills < 2 ? 1 : g.totalKills < 5 ? 2 : g.totalKills < 10 ? 3 : g.totalKills < 18 ? 4 : 5);
        if (newStars > g.wantedStars) {
          g.wantedStars = newStars;
          const msgs: Record<number, string> = { 2: "★★ MAVIC SWARM INCOMING", 3: "★★★ MiG-29s SCRAMBLED", 4: "★★★★ F-35s ACTIVE — STEALTH MODE", 5: "★★★★★ IAI WING DEPLOYED — ORBITAL THREAT" };
          if (msgs[newStars]) announce_(msgs[newStars], "#ff3300");
        }
        if (g.enemies.length < g.wantedStars * 2 + 2) {
          const types: EnemyType[] = g.wantedStars >= 5 ? ["mavic","mig29","f35","goose","iai_wing"] :
            g.wantedStars >= 4 ? ["mavic","f35","goose","mig29"] :
            g.wantedStars >= 3 ? ["mavic","mig29","goose"] :
            g.wantedStars >= 2 ? ["mavic","goose"] : ["mavic","goose"];
          const t2: EnemyType = Math.random() < 0.07 ? "blue_anomaly" : types[Math.floor(Math.random() * types.length)];
          spawnEnemy(t2, scene);
        }
        g.spawnTimer = 4 + Math.random() * 3;
      }

      // ── Camera chase ───────────────────────────────────────────────────────
      const behind = fwd.clone().negate().multiplyScalar(22);
      const camTarget = g.playerPos.clone().add(behind).add(new THREE.Vector3(0, 8, 0));
      camera.position.lerp(camTarget, 0.08);
      camera.lookAt(g.playerPos);

      // ── Game over ──────────────────────────────────────────────────────────
      if (g.hp <= 0 && !g.gameOver) {
        g.gameOver = true; setGameOver(true);
        spawnExplosion(g.playerPos, scene, g.particles, 80);
        announce_("💥 DRONE DESTROYED", "#ff0033");
      }

      // ── HUD updates (throttled) ────────────────────────────────────────────
      hudTimer += dt;
      if (hudTimer > 0.1) {
        hudTimer = 0;
        setHp(Math.max(0, g.hp));
        setHeat(Math.round(g.heat));
        setScore(g.score);
        setCombo(g.combo);
        setStars(g.wantedStars);
        setFuel(Math.round(g.fuel));
        setKillCount(g.totalKills);
        setBecLevel(Math.round(g.condensate * 100));
        setBecFreqHz(ELF_CASCADE[g.becFreqIdx]?.hz ?? 7.83);
        setShhCd(parseFloat(g.shhCooldown.toFixed(1)));
      }

      renderer.render(scene, camera);
    };
    loop();

    const onResize = () => {
      if (!containerRef.current) return;
      const W2 = containerRef.current.clientWidth, H2 = containerRef.current.clientHeight;
      camera.aspect = W2 / H2; camera.updateProjectionMatrix(); renderer.setSize(W2, H2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", e => onKey(e, true));
      document.removeEventListener("keyup",  e => onKey(e, false));
      document.removeEventListener("mousemove", onMM);
      document.removeEventListener("mousedown", onMD);
      document.removeEventListener("mouseup",   onMU);
      renderer.dispose();
      renderer.domElement.parentNode?.removeChild(renderer.domElement);
    };
  }, [spawnEnemy, enemyFireAt, announce_, logPhenomenon]);

  // ── HUD ──────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-[#020810] overflow-hidden select-none" data-testid="drone-game-page">
      <div ref={containerRef} className="absolute inset-0"/>

      {/* Top-left HUD */}
      <div className="absolute top-3 left-3 z-30 space-y-1 pointer-events-none">
        {/* Stars */}
        <div className="flex gap-0.5 items-center">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className={`h-4 w-4 ${i <= stars ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`}/>
          ))}
          <span className="ml-2 text-[10px] font-mono text-yellow-400 uppercase">WANTED</span>
        </div>
        {/* HP */}
        <div className="flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 text-red-400"/>
          <div className="w-28 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width:`${hp}%`, background: hp > 50 ? "#22cc44" : hp > 25 ? "#ff8800" : "#ff2233" }}/>
          </div>
          <span className="text-[10px] font-mono text-gray-400">{hp}</span>
        </div>
        {/* Laser heat */}
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-red-500"/>
          <div className="w-28 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width:`${heat}%`, background: heat > 80 ? "#ff0033" : "#ff4422" }}/>
          </div>
          <span className="text-[10px] font-mono text-red-400">{heat > 90 ? "OVERHEAT!" : "30kW"}</span>
        </div>
        {/* Fuel */}
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-cyan-400"/>
          <div className="w-28 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width:`${fuel}%` }}/>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">BOOST</span>
        </div>
        {/* BEC Condensate bar */}
        <div className="flex items-center gap-2" title="Bose-Einstein Condensate coherence — hold laser to charge">
          <span className="text-[9px] font-mono text-purple-400 w-5">|ψ|²</span>
          <div className="w-28 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width:`${becLevel}%`,
                background: becLevel > 80 ? "#00ffff" : becLevel > 40 ? "#ff8800" : "#ff1133" }}/>
          </div>
          <span className="text-[9px] font-mono text-purple-400">{becFreqHz}Hz</span>
        </div>
        {/* SHH cooldown */}
        <div className="flex items-center gap-2" title="SHH Morphogenic Pulse cooldown (H key)">
          <span className="text-[9px] font-mono text-green-400 w-5">SHH</span>
          <div className="w-28 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all"
              style={{ width:`${Math.max(0, 100 - (shhCd / 9) * 100)}%` }}/>
          </div>
          <span className="text-[9px] font-mono text-green-400">{shhCd > 0 ? `${shhCd}s` : "RDY"}</span>
        </div>
      </div>

      {/* Top-right: score + combo */}
      <div className="absolute top-3 right-3 z-30 text-right pointer-events-none">
        <div className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">{score.toLocaleString()}</div>
        {combo > 1 && <div className="text-sm font-mono text-yellow-400 animate-pulse">COMBO ×{combo}</div>}
        <div className="text-[10px] font-mono text-gray-600">{killCount} KILLS</div>
      </div>

      {/* Announcement */}
      {announce && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center">
          <div className="text-2xl font-mono font-bold tracking-widest animate-bounce" style={{ color: announce.color, textShadow:`0 0 20px ${announce.color}` }}>
            {announce.text}
          </div>
        </div>
      )}

      {/* FINISH HIM */}
      {finishHim && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center">
          <div className="text-4xl font-mono font-black text-red-500 animate-pulse tracking-widest" style={{ textShadow:"0 0 30px #ff0033" }}>
            FINISH HIM
          </div>
          <div className="text-xs font-mono text-gray-400 mt-1">PRESS [F]</div>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
          <div className="text-5xl font-mono font-black text-red-500 mb-4" style={{ textShadow:"0 0 40px #ff0033" }}>DRONE DESTROYED</div>
          <div className="text-2xl font-mono text-cyan-400 mb-2">{score.toLocaleString()} PTS</div>
          <div className="text-sm font-mono text-gray-500 mb-8">{killCount} kills · {stars}★ reached</div>
          <button onClick={resetGame} className="px-8 py-3 bg-red-500/20 border border-red-500/50 text-red-400 font-mono text-sm rounded hover:bg-red-500/30 transition-colors" data-testid="button-redeploy">
            REDEPLOY
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="text-[9px] font-mono text-gray-700 text-center">
          WASD/↑↓←→ fly · Q/E up/down · HOLD CLICK laser (BEC charge→cascade) · RIGHT CLICK rocket · B barrel roll · F finish him · V EMP · H SHH pulse · SPACE afterburner
        </div>
      </div>

      {/* Back button */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
        <Link href="/jaco" className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 border border-white/10 rounded text-[10px] font-mono text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors">
          <ArrowLeft className="h-3 w-3"/> JACÓ MAP
        </Link>
      </div>

      {/* Phenomenon log (bottom-left) */}
      {phenomenonLog.length > 0 && (
        <div className="absolute bottom-8 left-3 z-30 w-72 space-y-0.5 pointer-events-none">
          <div className="text-[9px] font-mono text-blue-400/60 mb-1">// PHENOMENON LOG</div>
          {phenomenonLog.slice(0, 5).map((log, i) => (
            <div key={i} className="text-[9px] font-mono text-blue-400/80 leading-tight">{log}</div>
          ))}
        </div>
      )}

      {/* Target indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <Target className="h-6 w-6 text-cyan-500/40"/>
      </div>
    </div>
  );
}
