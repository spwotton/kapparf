/**
 * Quantum Quake: GOS Resurrection — Main Engine
 *
 * Three.js scene, FPS controls, level geometry, shader materials,
 * gene resonome, game loop. Everything wired through GOS constants.
 */

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

import { GOS, gosTwistAngle, gosBreathScale, psiCoherence, geneFreqToColor, clamp, lerp, degToRad }
    from './gos_math.js';
import {
    gosTwistVert, gosResonanceFrag,
    kleinVert, kleinFrag,
    voidVert, voidFrag,
    geneGlowVert, geneGlowFrag
} from './shaders.js';

// ═══════════════════════════════════════════════════════════════
//  GENE RESONOME DATA (subset inline — full 62 genes)
// ═══════════════════════════════════════════════════════════════
const GENES = [
    { name: "COL1A1", emoji: "🧱", cat: "structure", freq: 65.591, phase: 64.35, chr: "chr17", desc: "Type I collagen alpha-1" },
    { name: "COL1A2", emoji: "🧱", cat: "structure", freq: 48.773, phase: 121.04, chr: "chr7", desc: "Type I collagen alpha-2" },
    { name: "FBN1", emoji: "🕸️", cat: "structure", freq: 62.227, phase: 62.45, chr: "chr15", desc: "Fibrillin-1 (Marfan)" },
    { name: "ELN", emoji: "⛓️", cat: "structure", freq: 48.773, phase: 94.71, chr: "chr7", desc: "Elastin" },
    { name: "MSTN", emoji: "💪", cat: "structure", freq: 40.364, phase: 244.1, chr: "chr2", desc: "Myostatin" },
    { name: "FOXP2", emoji: "🗣️", cat: "language", freq: 139.978, phase: 146.29, chr: "chr7", desc: "Language transcription" },
    { name: "HTT", emoji: "🔁", cat: "neural", freq: 70.752, phase: 3.94, chr: "chr4", desc: "Huntingtin" },
    { name: "APOE", emoji: "💾", cat: "neural", freq: 111.571, phase: 57.58, chr: "chr19", desc: "Apolipoprotein E" },
    { name: "BDNF", emoji: "🧠", cat: "neural", freq: 89.801, phase: 35.49, chr: "chr11", desc: "Brain neurotrophic factor" },
    { name: "SCN1A", emoji: "⚡", cat: "neural", freq: 62.227, phase: 219.3, chr: "chr2", desc: "Sodium channel" },
    { name: "TP53", emoji: "🛡️", cat: "guardian", freq: 84.297, phase: 32.22, chr: "chr17", desc: "Tumor suppressor p53" },
    { name: "BRCA1", emoji: "🎀", cat: "guardian", freq: 139.978, phase: 29.16, chr: "chr17", desc: "Breast cancer 1" },
    { name: "BRCA2", emoji: "🎀", cat: "guardian", freq: 79.758, phase: 172.5, chr: "chr13", desc: "Breast cancer 2" },
    { name: "PTEN", emoji: "🛡️", cat: "guardian", freq: 84.297, phase: 99.91, chr: "chr10", desc: "Phosphatase tensin" },
    { name: "RB1", emoji: "🔒", cat: "guardian", freq: 111.571, phase: 185.2, chr: "chr13", desc: "Retinoblastoma" },
    { name: "DRD2", emoji: "🎭", cat: "dopamine", freq: 48.773, phase: 276.8, chr: "chr11", desc: "Dopamine receptor D2" },
    { name: "COMT", emoji: "⚖️", cat: "dopamine", freq: 62.227, phase: 154.1, chr: "chr22", desc: "Catechol-O-methyltransferase" },
    { name: "SLC6A3", emoji: "🚂", cat: "dopamine", freq: 70.752, phase: 198.7, chr: "chr5", desc: "Dopamine transporter" },
    { name: "MAOA", emoji: "🌋", cat: "dopamine", freq: 55.785, phase: 312.4, chr: "chrX", desc: "Monoamine oxidase A" },
    { name: "SLC6A4", emoji: "🌊", cat: "serotonin", freq: 65.591, phase: 88.63, chr: "chr17", desc: "Serotonin transporter" },
    { name: "HTR2A", emoji: "🌀", cat: "serotonin", freq: 89.801, phase: 241.7, chr: "chr13", desc: "Serotonin receptor 2A" },
    { name: "TPH2", emoji: "☀️", cat: "serotonin", freq: 55.785, phase: 111.0, chr: "chr12", desc: "Tryptophan hydroxylase 2" },
    { name: "CLOCK", emoji: "🕐", cat: "circadian", freq: 111.571, phase: 0.0, chr: "chr4", desc: "Circadian locomotor" },
    { name: "PER2", emoji: "⏰", cat: "circadian", freq: 48.773, phase: 180.0, chr: "chr2", desc: "Period 2" },
    { name: "CRY1", emoji: "🌙", cat: "circadian", freq: 55.785, phase: 270.0, chr: "chr12", desc: "Cryptochrome 1" },
    { name: "MTHFR", emoji: "🧬", cat: "metabolism", freq: 65.591, phase: 45.0, chr: "chr1", desc: "Methylenetetrahydrofolate" },
    { name: "VDR", emoji: "☀️", cat: "metabolism", freq: 84.297, phase: 90.0, chr: "chr12", desc: "Vitamin D receptor" },
    { name: "ACE", emoji: "💓", cat: "cardiac", freq: 70.752, phase: 135.0, chr: "chr17", desc: "Angiotensin-converting enzyme" },
    { name: "LMNA", emoji: "🏠", cat: "cardiac", freq: 62.227, phase: 225.0, chr: "chr1", desc: "Lamin A/C" },
    { name: "SCN5A", emoji: "⚡", cat: "cardiac", freq: 55.785, phase: 315.0, chr: "chr3", desc: "Cardiac sodium channel" },
    { name: "HBB", emoji: "🩸", cat: "blood", freq: 48.773, phase: 0.0, chr: "chr11", desc: "Hemoglobin beta" },
    { name: "HFE", emoji: "🩸", cat: "blood", freq: 40.364, phase: 60.0, chr: "chr6", desc: "Hemochromatosis" },
    { name: "CFTR", emoji: "💨", cat: "membrane", freq: 139.978, phase: 120.0, chr: "chr7", desc: "Cystic fibrosis transmembrane" },
    { name: "SRY", emoji: "♂️", cat: "sex", freq: 111.571, phase: 0.0, chr: "chrY", desc: "Sex-determining region Y" },
    { name: "AR", emoji: "♂️", cat: "sex", freq: 89.801, phase: 90.0, chr: "chrX", desc: "Androgen receptor" },
    { name: "TERT", emoji: "♾️", cat: "telomere", freq: 84.297, phase: 162.0, chr: "chr5", desc: "Telomerase reverse transcriptase" },
    { name: "TERC", emoji: "♾️", cat: "telomere", freq: 62.227, phase: 324.0, chr: "chr3", desc: "Telomerase RNA component" },
    { name: "FOXO3", emoji: "🐢", cat: "longevity", freq: 70.752, phase: 210.0, chr: "chr6", desc: "Forkhead box O3" },
    { name: "SIRT1", emoji: "🍷", cat: "longevity", freq: 89.801, phase: 30.0, chr: "chr10", desc: "Sirtuin 1" },
    { name: "GJB2", emoji: "🔇", cat: "sensory", freq: 48.773, phase: 240.0, chr: "chr13", desc: "Gap junction beta-2 (hearing)" },
    { name: "OPN1LW", emoji: "👁️", cat: "sensory", freq: 111.571, phase: 300.0, chr: "chrX", desc: "Red opsin" },
    { name: "OPN1MW", emoji: "👁️", cat: "sensory", freq: 111.571, phase: 120.0, chr: "chrX", desc: "Green opsin" },
    { name: "OCA2", emoji: "🎨", cat: "pigment", freq: 65.591, phase: 180.0, chr: "chr15", desc: "Oculocutaneous albinism 2" },
    { name: "MC1R", emoji: "🎨", cat: "pigment", freq: 55.785, phase: 90.0, chr: "chr16", desc: "Melanocortin 1 receptor" },
    { name: "TYR", emoji: "🎨", cat: "pigment", freq: 70.752, phase: 270.0, chr: "chr11", desc: "Tyrosinase" },
    { name: "SOD2", emoji: "🧹", cat: "repair", freq: 84.297, phase: 45.0, chr: "chr6", desc: "Superoxide dismutase 2" },
    { name: "CAT", emoji: "🧹", cat: "repair", freq: 55.785, phase: 225.0, chr: "chr11", desc: "Catalase" },
    { name: "XRCC1", emoji: "🔧", cat: "repair", freq: 62.227, phase: 315.0, chr: "chr19", desc: "DNA repair" },
    { name: "IL6", emoji: "🔥", cat: "immune", freq: 48.773, phase: 150.0, chr: "chr7", desc: "Interleukin-6" },
    { name: "TNF", emoji: "💥", cat: "immune", freq: 70.752, phase: 330.0, chr: "chr6", desc: "Tumor necrosis factor" },
    { name: "HLA-A", emoji: "🏷️", cat: "immune", freq: 139.978, phase: 60.0, chr: "chr6", desc: "Human leukocyte antigen A" },
    { name: "IFNG", emoji: "⚔️", cat: "immune", freq: 84.297, phase: 270.0, chr: "chr12", desc: "Interferon gamma" },
    { name: "APC", emoji: "🚪", cat: "tumor_sup", freq: 139.978, phase: 180.0, chr: "chr5", desc: "Adenomatous polyposis coli" },
    { name: "MLH1", emoji: "🔧", cat: "tumor_sup", freq: 65.591, phase: 300.0, chr: "chr3", desc: "MutL homolog 1" },
    { name: "VEGFA", emoji: "🌱", cat: "growth", freq: 89.801, phase: 150.0, chr: "chr6", desc: "Vascular endothelial growth" },
    { name: "IGF1", emoji: "📈", cat: "growth", freq: 70.752, phase: 60.0, chr: "chr12", desc: "Insulin-like growth factor 1" },
    { name: "GH1", emoji: "📈", cat: "growth", freq: 84.297, phase: 210.0, chr: "chr17", desc: "Growth hormone 1" },
    { name: "INS", emoji: "🍯", cat: "metabolic", freq: 48.773, phase: 330.0, chr: "chr11", desc: "Insulin" },
    { name: "LEP", emoji: "⚖️", cat: "metabolic", freq: 55.785, phase: 150.0, chr: "chr7", desc: "Leptin" },
    { name: "FTO", emoji: "🍔", cat: "metabolic", freq: 111.571, phase: 270.0, chr: "chr16", desc: "Fat mass & obesity" },
    { name: "OXTR", emoji: "💗", cat: "bonding", freq: 89.801, phase: 0.0, chr: "chr3", desc: "Oxytocin receptor" },
    { name: "AVPR1A", emoji: "💗", cat: "bonding", freq: 65.591, phase: 120.0, chr: "chr12", desc: "Vasopressin receptor 1A" },
];

// ═══════════════════════════════════════════════════════════════
//  CATEGORY COLORS
// ═══════════════════════════════════════════════════════════════
const CAT_COLORS = {
    structure: new THREE.Color(0.8, 0.6, 0.2),
    language: new THREE.Color(0.2, 0.8, 0.2),
    neural: new THREE.Color(0.2, 0.4, 1.0),
    guardian: new THREE.Color(1.0, 0.2, 0.4),
    dopamine: new THREE.Color(1.0, 0.8, 0.0),
    serotonin: new THREE.Color(0.3, 0.7, 1.0),
    circadian: new THREE.Color(0.6, 0.0, 0.8),
    metabolism: new THREE.Color(0.0, 0.8, 0.6),
    cardiac: new THREE.Color(0.9, 0.1, 0.2),
    blood: new THREE.Color(0.8, 0.0, 0.0),
    membrane: new THREE.Color(0.4, 0.8, 0.4),
    sex: new THREE.Color(0.5, 0.5, 1.0),
    telomere: new THREE.Color(0.9, 0.9, 0.2),
    longevity: new THREE.Color(0.2, 0.9, 0.5),
    sensory: new THREE.Color(0.8, 0.4, 0.8),
    pigment: new THREE.Color(0.7, 0.5, 0.3),
    repair: new THREE.Color(0.5, 0.9, 0.9),
    immune: new THREE.Color(1.0, 0.5, 0.0),
    tumor_sup: new THREE.Color(0.9, 0.3, 0.6),
    growth: new THREE.Color(0.3, 1.0, 0.3),
    metabolic: new THREE.Color(0.6, 0.6, 0.2),
    bonding: new THREE.Color(1.0, 0.4, 0.6),
};

// ═══════════════════════════════════════════════════════════════
//  ENGINE STATE
// ═══════════════════════════════════════════════════════════════
let scene, camera, renderer, controls;
let clock, gameTime = 0;
let minimapCtx;

// Player state
const player = {
    health: 100,
    resonance: 0,
    maxResonance: 100,
    activeGene: null,
    activeGeneIdx: -1,
    speed: 12,
    sprintMul: 1.8,
    velocity: new THREE.Vector3(),
    onGround: true,
    jumpForce: 8,
    gravity: 20,
    height: 1.7,
    collectedGenes: new Set(),
};

// Input state
const keys = {};
const moveDir = new THREE.Vector3();

// Shader uniforms (shared references)
const sharedUniforms = {
    uTime: { value: 0 },
    uTwistAngle: { value: GOS.THETA },
    uDeltaKappa: { value: GOS.DELTA_KAPPA },
    uCarrier: { value: GOS.CARRIER },
    uBreathAmp: { value: 0.05 },
    uPsi: { value: 1.0 },
    uKappa: { value: GOS.KAPPA },
    uPhi: { value: GOS.PHI },
    uGeneColor: { value: new THREE.Color(0, 1, 1) },
    uResonance: { value: 0 },
};

// Level objects
let levelMeshes = [];
let geneCollectibles = [];
let kleinBottle = null;

// ═══════════════════════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════════════════════
function init() {
    // Clock
    clock = new THREE.Clock();

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050010, 0.012);

    // Camera  
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, player.height, 5);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050010);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    // Pointer lock controls
    controls = new PointerLockControls(camera, renderer.domElement);

    // Minimap
    const minimapCanvas = document.getElementById('minimap');
    minimapCanvas.width = 160;
    minimapCanvas.height = 160;
    minimapCtx = minimapCanvas.getContext('2d');

    // Lighting
    setupLights();

    // Skybox
    createSkybox();

    // Level geometry
    buildLevel();

    // Klein bottle centerpiece
    createKleinBottle();

    // Gene collectibles
    spawnGeneCollectibles();

    // Populate HUD gene panel
    populateGenePanel();

    // Input
    setupInput();

    // Resize
    window.addEventListener('resize', onResize);

    // Start loop
    animate();
}

// ═══════════════════════════════════════════════════════════════
//  LIGHTING
// ═══════════════════════════════════════════════════════════════
function setupLights() {
    // Ambient — quantum void glow
    const ambient = new THREE.AmbientLight(0x1a0a2e, 0.6);
    scene.add(ambient);

    // Main directional — the "coherence sun"
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(30, 50, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    scene.add(sun);

    // Point lights at cardinal positions — κ-resonance nodes
    const nodePositions = [
        [20, 5, 0], [-20, 5, 0], [0, 5, 20], [0, 5, -20],
        [14, 5, 14], [-14, 5, 14], [14, 5, -14], [-14, 5, -14]
    ];
    for (const pos of nodePositions) {
        const light = new THREE.PointLight(0x00ffcc, 0.4, 30);
        light.position.set(...pos);
        scene.add(light);
    }
}

// ═══════════════════════════════════════════════════════════════
//  SKYBOX (void shader on inverted sphere)
// ═══════════════════════════════════════════════════════════════
function createSkybox() {
    const geo = new THREE.SphereGeometry(200, 32, 32);
    const mat = new THREE.ShaderMaterial({
        vertexShader: voidVert,
        fragmentShader: voidFrag,
        uniforms: {
            uTime: sharedUniforms.uTime,
            uDeltaKappa: sharedUniforms.uDeltaKappa,
        },
        side: THREE.BackSide,
        depthWrite: false,
    });
    const sky = new THREE.Mesh(geo, mat);
    scene.add(sky);
}

// ═══════════════════════════════════════════════════════════════
//  GOS SHADER MATERIAL FACTORY
// ═══════════════════════════════════════════════════════════════
function makeGOSMaterial(color) {
    return new THREE.ShaderMaterial({
        vertexShader: gosTwistVert,
        fragmentShader: gosResonanceFrag,
        uniforms: {
            uTime: sharedUniforms.uTime,
            uTwistAngle: sharedUniforms.uTwistAngle,
            uDeltaKappa: sharedUniforms.uDeltaKappa,
            uCarrier: sharedUniforms.uCarrier,
            uBreathAmp: sharedUniforms.uBreathAmp,
            uPsi: sharedUniforms.uPsi,
            uKappa: sharedUniforms.uKappa,
            uPhi: sharedUniforms.uPhi,
            uGeneColor: { value: color || new THREE.Color(0, 1, 1) },
            uResonance: sharedUniforms.uResonance,
        },
    });
}

// ═══════════════════════════════════════════════════════════════
//  LEVEL GEOMETRY — GOS Architecture
// ═══════════════════════════════════════════════════════════════
function buildLevel() {
    // ─── Floor: vast pentagonal grid ───
    const floorGeo = new THREE.PlaneGeometry(100, 100, 50, 50);
    const floorMat = makeGOSMaterial(new THREE.Color(0.1, 0.3, 0.2));
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    levelMeshes.push(floor);

    // ─── Dodecahedral Pillars (12 around the arena) ───
    const pillarAngles = 12;
    const pillarRadius = 25;
    for (let i = 0; i < pillarAngles; i++) {
        const angle = (i / pillarAngles) * Math.PI * 2;
        const x = Math.cos(angle) * pillarRadius;
        const z = Math.sin(angle) * pillarRadius;

        // Dodecahedral column
        const pillarGeo = new THREE.DodecahedronGeometry(1.5, 0);
        const pillarMat = makeGOSMaterial(
            new THREE.Color().setHSL(i / pillarAngles, 0.7, 0.5)
        );
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(x, 3, z);
        pillar.scale.set(1, 3, 1);
        pillar.castShadow = true;
        scene.add(pillar);
        levelMeshes.push(pillar);

        // Glow sphere on top
        const sphereGeo = new THREE.IcosahedronGeometry(0.6, 1);
        const sphereMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(i / pillarAngles, 1.0, 0.6),
            emissive: new THREE.Color().setHSL(i / pillarAngles, 1.0, 0.3),
            emissiveIntensity: 2,
            metalness: 0.8,
            roughness: 0.2,
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.set(x, 7, z);
        scene.add(sphere);
    }

    // ─── Inner Ring: Icosahedron Totems ───
    const innerCount = 5;
    const innerRadius = 10;
    for (let i = 0; i < innerCount; i++) {
        const angle = (i / innerCount) * Math.PI * 2 + Math.PI / 10;
        const x = Math.cos(angle) * innerRadius;
        const z = Math.sin(angle) * innerRadius;

        const totemGeo = new THREE.IcosahedronGeometry(2, 0);
        const totemMat = makeGOSMaterial(
            new THREE.Color().setHSL(0.7 + i * 0.05, 0.9, 0.55)
        );
        const totem = new THREE.Mesh(totemGeo, totemMat);
        totem.position.set(x, 2, z);
        totem.castShadow = true;
        scene.add(totem);
        levelMeshes.push(totem);
    }

    // ─── Outer Walls: Segmented arcs ───
    const wallRadius = 40;
    const wallSegments = 20;
    for (let i = 0; i < wallSegments; i++) {
        const angle = (i / wallSegments) * Math.PI * 2;
        const x = Math.cos(angle) * wallRadius;
        const z = Math.sin(angle) * wallRadius;

        const wallGeo = new THREE.BoxGeometry(4, 8, 0.5);
        const wallMat = makeGOSMaterial(new THREE.Color(0.15, 0.05, 0.25));
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(x, 4, z);
        wall.rotation.y = -angle + Math.PI / 2;
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
        levelMeshes.push(wall);
    }

    // ─── Floating Platforms (φ-spaced heights) ───
    const platformHeights = [3, 3 * GOS.PHI, 3 * GOS.PHI * GOS.PHI];
    for (let h = 0; h < platformHeights.length; h++) {
        const y = platformHeights[h];
        const count = 3 + h * 2;
        const radius = 15 - h * 3;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const platformGeo = new THREE.CylinderGeometry(2, 2, 0.3, 6);
            const platformMat = makeGOSMaterial(
                new THREE.Color().setHSL(0.55, 0.7, 0.4 + h * 0.1)
            );
            const platform = new THREE.Mesh(platformGeo, platformMat);
            platform.position.set(x, y, z);
            platform.castShadow = true;
            platform.receiveShadow = true;
            platform.userData.isPlatform = true;
            scene.add(platform);
            levelMeshes.push(platform);
        }
    }

    // ─── Central Altar ───
    const altarGeo = new THREE.OctahedronGeometry(3, 1);
    const altarMat = makeGOSMaterial(new THREE.Color(0.8, 0.0, 1.0));
    const altar = new THREE.Mesh(altarGeo, altarMat);
    altar.position.set(0, 1.5, 0);
    altar.castShadow = true;
    altar.userData.isAltar = true;
    scene.add(altar);
    levelMeshes.push(altar);
}

// ═══════════════════════════════════════════════════════════════
//  KLEIN BOTTLE
// ═══════════════════════════════════════════════════════════════
function createKleinBottle() {
    // Parametric Klein bottle surface
    function kleinSurface(u, v, target) {
        u *= Math.PI * 2;
        v *= Math.PI * 2;
        const r = 4;

        let x, y, z;
        if (u < Math.PI) {
            x = 3 * Math.cos(u) * (1 + Math.sin(u)) +
                r * (1 - Math.cos(u) / 2) * Math.cos(u) * Math.cos(v);
            z = -8 * Math.sin(u) -
                r * Math.sin(u) * Math.cos(v) * (1 - Math.cos(u) / 2);
        } else {
            x = 3 * Math.cos(u) * (1 + Math.sin(u)) +
                r * (1 - Math.cos(u) / 2) * Math.cos(v + Math.PI);
            z = -8 * Math.sin(u);
        }
        y = -r * Math.sin(v) * (1 - Math.cos(u) / 2);

        // Scale down
        target.set(x * 0.25, y * 0.25 + 12, z * 0.25);
    }

    const kleinGeo = new ParametricGeometry(kleinSurface, 64, 32);
    const kleinMat = new THREE.ShaderMaterial({
        vertexShader: kleinVert,
        fragmentShader: kleinFrag,
        uniforms: {
            uTime: sharedUniforms.uTime,
            uTwistAngle: sharedUniforms.uTwistAngle,
            uDeltaKappa: sharedUniforms.uDeltaKappa,
            uPhi: sharedUniforms.uPhi,
        },
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
    });

    kleinBottle = new THREE.Mesh(kleinGeo, kleinMat);
    kleinBottle.position.set(0, 0, 0);
    scene.add(kleinBottle);
}

// ═══════════════════════════════════════════════════════════════
//  GENE COLLECTIBLES
// ═══════════════════════════════════════════════════════════════
function spawnGeneCollectibles() {
    const spawnRadius = 30;
    for (let i = 0; i < GENES.length; i++) {
        const gene = GENES[i];
        const catColor = CAT_COLORS[gene.cat] || new THREE.Color(1, 1, 1);

        // Position: spiral layout
        const angle = (i / GENES.length) * Math.PI * 2 * 3; // 3 turns
        const radius = 5 + (i / GENES.length) * spawnRadius;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = 1.5 + Math.sin(i * 0.5) * 1.5;

        const geo = new THREE.OctahedronGeometry(0.5, 0);
        const mat = new THREE.ShaderMaterial({
            vertexShader: geneGlowVert,
            fragmentShader: geneGlowFrag,
            uniforms: {
                uTime: sharedUniforms.uTime,
                uFrequency: { value: gene.freq },
                uPhase: { value: degToRad(gene.phase) },
                uColor: { value: catColor },
            },
            transparent: true,
            depthWrite: false,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.userData.geneIndex = i;
        mesh.userData.gene = gene;
        scene.add(mesh);
        geneCollectibles.push(mesh);
    }
}

// ═══════════════════════════════════════════════════════════════
//  GENE PANEL (HUD)
// ═══════════════════════════════════════════════════════════════
function populateGenePanel() {
    const list = document.getElementById('gene-list');
    if (!list) return;
    list.innerHTML = '';
    for (const g of GENES) {
        const row = document.createElement('div');
        row.className = 'gene-entry';
        row.innerHTML = `<span>${g.emoji} ${g.name}</span><span class="freq">${g.freq.toFixed(1)}</span>`;
        list.appendChild(row);
    }
}

// ═══════════════════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════════════════
function setupInput() {
    document.addEventListener('keydown', e => {
        keys[e.code] = true;

        // Gene power selection (1-4)
        if (e.code >= 'Digit1' && e.code <= 'Digit4') {
            selectGenePower(parseInt(e.code.slice(5)) - 1);
        }
        // Q — Klein twist blast
        if (e.code === 'KeyQ') { triggerKleinTwist(); }
        // F — resonance pulse
        if (e.code === 'KeyF') { triggerResonancePulse(); }
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });

    // Pointer lock events
    controls.addEventListener('lock', () => {
        document.getElementById('instructions')?.classList.add('hidden');
    });
    controls.addEventListener('unlock', () => {
        document.getElementById('instructions')?.classList.remove('hidden');
    });
}

function selectGenePower(slotIndex) {
    // Collect genes into resonance slots
    const collected = Array.from(player.collectedGenes);
    if (slotIndex < collected.length) {
        player.activeGeneIdx = collected[slotIndex];
        player.activeGene = GENES[player.activeGeneIdx];
        const color = CAT_COLORS[player.activeGene.cat] || new THREE.Color(1, 1, 1);
        sharedUniforms.uGeneColor.value.copy(color);
    }
}

function triggerKleinTwist() {
    // Visual burst: temporarily max the twist
    sharedUniforms.uTwistAngle.value = GOS.THETA * 3;
    setTimeout(() => {
        sharedUniforms.uTwistAngle.value = GOS.THETA;
    }, 500);
}

function triggerResonancePulse() {
    player.resonance = Math.min(player.resonance + 15, player.maxResonance);
}

// ═══════════════════════════════════════════════════════════════
//  PLAYER PHYSICS
// ═══════════════════════════════════════════════════════════════
function updatePlayer(dt) {
    // Movement direction from keys
    moveDir.set(0, 0, 0);
    if (keys['KeyW'] || keys['ArrowUp']) moveDir.z -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveDir.z += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveDir.x -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveDir.x += 1;
    moveDir.normalize();

    // Sprint
    const speed = player.speed * (keys['ShiftLeft'] ? player.sprintMul : 1);

    // Apply movement in camera-relative space
    if (moveDir.length() > 0) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        player.velocity.x = (forward.x * -moveDir.z + right.x * moveDir.x) * speed;
        player.velocity.z = (forward.z * -moveDir.z + right.z * moveDir.x) * speed;
    } else {
        player.velocity.x *= 0.85; // friction
        player.velocity.z *= 0.85;
    }

    // Jump
    if (keys['Space'] && player.onGround) {
        player.velocity.y = player.jumpForce;
        player.onGround = false;
    }

    // Gravity
    if (!player.onGround) {
        player.velocity.y -= player.gravity * dt;
    }

    // Apply velocity
    camera.position.x += player.velocity.x * dt;
    camera.position.z += player.velocity.z * dt;
    camera.position.y += player.velocity.y * dt;

    // Ground collision
    if (camera.position.y <= player.height) {
        camera.position.y = player.height;
        player.velocity.y = 0;
        player.onGround = true;
    }

    // Platform collision (simplified — check nearby platforms)
    for (const mesh of levelMeshes) {
        if (!mesh.userData.isPlatform) continue;
        const dx = camera.position.x - mesh.position.x;
        const dz = camera.position.z - mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 2.2 &&
            camera.position.y >= mesh.position.y &&
            camera.position.y <= mesh.position.y + 1.5 &&
            player.velocity.y <= 0) {
            camera.position.y = mesh.position.y + player.height * 0.5;
            player.velocity.y = 0;
            player.onGround = true;
        }
    }

    // Arena boundary
    const maxDist = 42;
    const px = camera.position.x, pz = camera.position.z;
    const dist = Math.sqrt(px * px + pz * pz);
    if (dist > maxDist) {
        camera.position.x *= maxDist / dist;
        camera.position.z *= maxDist / dist;
    }

    // Gene collection (proximity check)
    for (let i = geneCollectibles.length - 1; i >= 0; i--) {
        const gm = geneCollectibles[i];
        const dx = camera.position.x - gm.position.x;
        const dy = camera.position.y - gm.position.y;
        const dz = camera.position.z - gm.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.5) {
            // Collect gene
            player.collectedGenes.add(gm.userData.geneIndex);
            player.resonance = Math.min(player.resonance + 5, player.maxResonance);
            scene.remove(gm);
            geneCollectibles.splice(i, 1);

            // Flash screen briefly
            renderer.setClearColor(0x004040);
            setTimeout(() => renderer.setClearColor(0x050010), 100);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
//  HUD UPDATE
// ═══════════════════════════════════════════════════════════════
let frameCount = 0, fpsTimer = 0, currentFPS = 0;

function updateHUD(dt) {
    // FPS counter
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
        currentFPS = Math.round(frameCount / fpsTimer);
        fpsTimer = 0;
        frameCount = 0;
    }

    const psi = psiCoherence(player.resonance, player.maxResonance);
    sharedUniforms.uPsi.value = psi;
    sharedUniforms.uResonance.value = player.resonance / player.maxResonance;

    // Top HUD
    const dKappa = document.getElementById('d-kappa');
    const dPsi = document.getElementById('d-psi');
    const dTheta = document.getElementById('d-theta');
    const dTime = document.getElementById('d-time');
    const dFps = document.getElementById('d-fps');

    if (dKappa) dKappa.textContent = GOS.KAPPA.toFixed(3);
    if (dPsi) dPsi.textContent = psi.toFixed(3);
    if (dTheta) dTheta.textContent = GOS.THETA_DEG.toFixed(2) + '°';
    if (dTime) dTime.textContent = gameTime.toFixed(1);
    if (dFps) dFps.textContent = currentFPS;

    // Bottom HUD
    const dHealth = document.getElementById('d-health');
    const dRes = document.getElementById('d-resonance');
    const dGene = document.getElementById('d-gene');
    const dCarrier = document.getElementById('d-carrier');

    if (dHealth) dHealth.textContent = player.health;
    if (dRes) dRes.textContent = Math.round(player.resonance) + '%';
    if (dGene) dGene.textContent = player.activeGene ? `${player.activeGene.emoji} ${player.activeGene.name}` : '—';
    if (dCarrier) dCarrier.textContent = GOS.CARRIER.toFixed(3);
}

// ═══════════════════════════════════════════════════════════════
//  MINIMAP
// ═══════════════════════════════════════════════════════════════
function updateMinimap() {
    if (!minimapCtx) return;

    const ctx = minimapCtx;
    const w = 160, h = 160;
    const scale = 1.8; // world units per pixel

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 10, 20, 0.8)';
    ctx.fillRect(0, 0, w, h);

    // Arena boundary circle
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 42 / scale, 0, Math.PI * 2);
    ctx.stroke();

    // Pillar dots
    ctx.fillStyle = 'rgba(0, 200, 255, 0.5)';
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const x = w / 2 + Math.cos(angle) * 25 / scale;
        const y = h / 2 + Math.sin(angle) * 25 / scale;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Gene collectibles
    ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
    for (const gc of geneCollectibles) {
        const x = w / 2 + gc.position.x / scale;
        const y = h / 2 + gc.position.z / scale;
        ctx.fillRect(x - 1, y - 1, 2, 2);
    }

    // Player
    const px = w / 2 + camera.position.x / scale;
    const py = h / 2 + camera.position.z / scale;

    // Direction indicator
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + dir.x * 8, py + dir.z * 8);
    ctx.stroke();

    // Player dot
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
}

// ═══════════════════════════════════════════════════════════════
//  ANIMATION LOOP
// ═══════════════════════════════════════════════════════════════
function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1); // max 100ms step
    gameTime += dt;

    // Update shared time uniform
    sharedUniforms.uTime.value = gameTime;

    // Player movement (only when pointer locked)
    if (controls.isLocked) {
        updatePlayer(dt);
    }

    // Klein bottle rotation
    if (kleinBottle) {
        kleinBottle.rotation.y += dt * GOS.DELTA_KAPPA * Math.PI * 2;
        kleinBottle.rotation.x = Math.sin(gameTime * 0.3) * 0.2;
    }

    // Animate gene collectibles: gentle float
    for (const gc of geneCollectibles) {
        gc.position.y += Math.sin(gameTime * 2 + gc.userData.geneIndex) * 0.003;
        gc.rotation.y += dt * 1.5;
        gc.rotation.x += dt * 0.7;
    }

    // Update HUD
    updateHUD(dt);

    // Update minimap every 3rd frame
    if (frameCount % 3 === 0) {
        updateMinimap();
    }

    // Render
    renderer.render(scene, camera);
}

// ═══════════════════════════════════════════════════════════════
//  RESIZE
// ═══════════════════════════════════════════════════════════════
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ═══════════════════════════════════════════════════════════════
//  START GAME (called from HTML onclick)
// ═══════════════════════════════════════════════════════════════
window.startGame = function () {
    controls.lock();
};

// ═══════════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════════
init();

console.log('%c QUANTUM QUAKE: GOS Resurrection ', 'background:#0a0a2e;color:#0ff;font-size:16px;padding:8px;');
console.log(`κ=${GOS.KAPPA.toFixed(4)} φ=${GOS.PHI.toFixed(4)} θ=${GOS.THETA_DEG}° Δκ=${GOS.DELTA_KAPPA} f₀=${GOS.F0}Hz`);
console.log(`Genes loaded: ${GENES.length}`);
