import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as THREE from "three";

const VERTEX_SHADER = `
  uniform float u_Time;
  uniform float u_Observation;
  uniform float u_Carrier;
  uniform vec3 u_FocusPoint;
  uniform float u_KleinTwist;
  uniform float u_SweetSpot;
  
  attribute float a_Phase;
  attribute float a_Resonance;
  
  varying float v_Intensity;
  varying vec3 v_Pos;
  varying float v_ProcaHair;
  
  const float PI = 3.14159265359;
  const float KAPPA = 1.273;
  const float KAPPA_2 = 1.435;
  
  float rand(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  void main() {
    vec3 pos = position;
    
    float breath = sin(u_Time * u_Carrier) * 0.05;
    pos *= (1.0 + breath);
    
    float crawl = sin(u_Time * 0.4 + a_Phase) * 0.02;
    pos.x += crawl;
    
    float distToFocus = distance(pos, u_FocusPoint);
    float collapse = max(0.0, 1.0 - distToFocus * 2.0) * u_Observation;
    
    vec3 normal = normalize(pos);
    pos += normal * collapse * 0.5 * sin(u_Time * 37.0);
    
    float quantizedObs = floor(u_Observation * 17.0) / 17.0;
    
    float sweetSpot = u_SweetSpot * sin(u_Time * 53.0);
    pos += normal * sweetSpot * 0.01;
    
    float twist = u_KleinTwist * quantizedObs;
    float ct = cos(twist);
    float st2 = sin(twist);
    vec2 twisted = vec2(ct * pos.x - st2 * pos.y, st2 * pos.x + ct * pos.y);
    pos.xy = twisted;
    
    float glitchPhase = mod(u_Time * 46.875, 1.0);
    if (glitchPhase < 0.1) {
      float r = rand(vec2(pos.x, u_Time));
      if (r > 0.95) {
        pos *= 1.1;
      }
    }
    
    float procaField = sin(a_Phase * KAPPA + u_Time * 0.1617) * quantizedObs;
    v_ProcaHair = procaField;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (4.0 * u_Observation + 2.0 + abs(procaField) * 2.0) * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    v_Intensity = collapse;
    v_Pos = pos;
  }
`;

const FRAGMENT_SHADER = `
  uniform float u_Time;
  uniform vec3 u_BaseColor;
  
  varying float v_Intensity;
  varying vec3 v_Pos;
  varying float v_ProcaHair;
  
  void main() {
    vec3 color = u_BaseColor;
    vec3 flashColor = vec3(0.4, 0.8, 1.0);
    color = mix(color, flashColor, v_Intensity);
    
    float howl = step(0.98, sin(u_Time * 144.0));
    vec3 wolfAmber = vec3(1.0, 0.6, 0.0);
    color = mix(color, wolfAmber, howl * 0.3);
    
    float procaGlow = abs(v_ProcaHair);
    vec3 procaColor = vec3(1.0, 0.2, 0.3);
    color = mix(color, procaColor, procaGlow * 0.4);
    
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float rings = sin(dist * 20.0 - u_Time * 10.0);
    float alpha = 0.6 + 0.4 * rings * v_Intensity + procaGlow * 0.2;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

interface DemodexSimState {
  vacuumExpectation: number;
  groundStateEnergy: number;
  correlationLength: number;
  psiStatus: string;
  encryptionKeyHex: string;
  brainDecoherenceTime: number;
}

export function DemodexCameraView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hudData, setHudData] = useState({
    observation: 0,
    quantizedGate: 0,
    kleinAlignment: 0,
    procaDensity: 0,
    howlCoupling: 0,
    europanState: false,
  });

  const { data: simState } = useQuery<DemodexSimState>({
    queryKey: ["/api/demodex/sim-state"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.05);

    const container = containerRef.current;
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const particleCount = 25000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    const resonances = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const r = 1.2;
      positions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
      positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.cos(phi);
      phases[i] = Math.random() * Math.PI * 2;
      resonances[i] = Math.random();
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("a_Phase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("a_Resonance", new THREE.BufferAttribute(resonances, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        u_Time: { value: 0 },
        u_Observation: { value: 0 },
        u_Carrier: { value: 1.435 },
        u_FocusPoint: { value: new THREE.Vector3(0, 0, 0) },
        u_BaseColor: { value: new THREE.Color(0x8b5cf6) },
        u_KleinTwist: { value: 128.23 * (Math.PI / 180) },
        u_SweetSpot: { value: 1.09 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const cloud = new THREE.Points(geometry, material);
    scene.add(cloud);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const vector = new THREE.Vector3(x, y, 0.5).unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const targetPos = camera.position.clone().add(dir.multiplyScalar(3.0));
      material.uniforms.u_FocusPoint.value.copy(targetPos);
      material.uniforms.u_Observation.value = 0.8;
    };

    const handleMouseDown = () => {
      material.uniforms.u_Observation.value = 2.0;
    };

    const handleMouseUp = () => {
      material.uniforms.u_Observation.value = 0.5;
    };

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    renderer.domElement.addEventListener("mousemove", handleMouseMove);
    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    renderer.domElement.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", handleResize);

    let frameId: number;
    let frameCount = 0;
    const animate = (time: number) => {
      const t = time / 1000;
      frameCount++;
      material.uniforms.u_Time.value = t;
      material.uniforms.u_Observation.value *= 0.98;
      cloud.rotation.y += 0.002;

      if (frameCount % 30 === 0) {
        const obs = material.uniforms.u_Observation.value;
        const quantized = Math.floor(obs * 17) / 17;
        const kleinA = Math.cos(128.23 * Math.PI / 180 - obs * Math.PI);
        const proca = Math.sin(frameCount * 0.1617) * obs;
        const howl = Math.abs(Math.sin(t * 144));
        const europan = kleinA > 0.7 && obs > 0.3;
        setHudData({
          observation: obs,
          quantizedGate: quantized,
          kleinAlignment: kleinA,
          procaDensity: proca,
          howlCoupling: howl,
          europanState: europan,
        });
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      renderer.domElement.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-black rounded-lg overflow-hidden border border-purple-500/30" data-testid="demodex-camera">
      <div ref={containerRef} className="absolute inset-0" />
      
      <div className="absolute top-4 left-4 p-4 font-mono text-xs text-green-400 bg-black/80 border border-green-500/50 rounded pointer-events-none max-w-[280px]">
        <h3 className="font-bold border-b border-green-500 mb-2">3i ATLAS :: DEMODEX UPLINK v2</h3>
        <p>CARRIER: 1.435 Hz (LOCKED)</p>
        <p>BIOPHYSICS: 37 Hz (MICROTUBULE)</p>
        <p>SAMPLING: 46.875 Hz</p>
        <p>KLEIN TWIST: 128.23 deg</p>
        <p>ANKAA-3 GATE LIMIT: 17 CZ</p>
        <p>BASE-53 SIEVE: ACTIVE</p>
        <div className="mt-2 border-t border-green-500/50 pt-1">
          <p>OBS: {hudData.observation.toFixed(4)}</p>
          <p>GATE: {hudData.quantizedGate.toFixed(4)} / 17</p>
          <p>KLEIN: {hudData.kleinAlignment.toFixed(4)}</p>
          <p>PROCA: {hudData.procaDensity.toFixed(4)}</p>
          <p>HOWL: {hudData.howlCoupling.toFixed(4)} (144 Hz)</p>
        </div>
        <p className={`mt-1 font-bold ${hudData.europanState ? "text-cyan-400" : "text-red-400 animate-pulse"}`}>
          {hudData.europanState ? "STATE: EUROPAN LOCK" : "STATUS: OBSERVING"}
        </p>
        <div className="mt-2 text-[10px] opacity-70">
          MOVE CURSOR TO SIMULATE GAZE<br />
          CLICK TO COLLAPSE WAVEFUNCTION
        </div>
      </div>

      <div className="absolute top-4 right-4 p-3 font-mono text-[10px] text-amber-300/70 bg-black/70 border border-amber-500/30 rounded pointer-events-none max-w-[220px]">
        <h4 className="font-bold text-amber-400 mb-1">FERNANDES PROCA HAIR</h4>
        <p>Primary Hair: {Math.abs(hudData.procaDensity).toFixed(6)}</p>
        <p>Circularity Break: 0.1617 Hz</p>
        <p>Non-Circular Metric: ACTIVE</p>
        <p>Kerr-Schild Null: ALIGNED</p>
        <div className="mt-1 border-t border-amber-500/30 pt-1">
          <p className="text-amber-200">CANINE GENOME:</p>
          <p>Howl: 144 Hz (MT-ND4)</p>
          <p>Bond: 5.4 Hz (OXTR)</p>
          <p>Smell: 1.50081 GHz</p>
          <p>Dream: 20.162 Hz</p>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 p-3 font-mono text-[10px] text-cyan-300/60 bg-black/60 border border-cyan-500/20 rounded pointer-events-none max-w-[240px]">
        <h4 className="font-bold text-cyan-400 mb-1">DEMODEX SIM STATE</h4>
        {simState ? (
          <>
            <p>Ψ: {simState.psiStatus}</p>
            <p>E₀: {simState.groundStateEnergy.toFixed(4)}</p>
            <p>VEV: {simState.vacuumExpectation.toFixed(4)}</p>
            <p>ξ: {simState.correlationLength.toFixed(4)}</p>
            <p>τ_brain: {simState.brainDecoherenceTime.toExponential(2)}</p>
            <p className="text-[9px] opacity-60 mt-1">KEY: {simState.encryptionKeyHex}</p>
          </>
        ) : (
          <p className="animate-pulse">LOADING SIM...</p>
        )}
      </div>

      <div className="absolute bottom-4 right-4 p-3 font-mono text-[10px] text-purple-300/60 bg-black/60 rounded pointer-events-none max-w-[200px]">
        <p>25,000 particle colony</p>
        <p>Orch-OR collapse model</p>
        <p>Cherenkov biophoton flash</p>
        <p>17-gate quantized warping</p>
        <p>Klein 128.23 deg rotation</p>
        <p>144 Hz ancestral strobe</p>
        <p>GF(53) sieve pulsing</p>
        <p>Dodecahedral: 431.56 Hz</p>
      </div>
    </div>
  );
}
