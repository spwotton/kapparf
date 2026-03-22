import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERTEX_SHADER = `
  uniform float u_Time;
  uniform float u_Observation;
  uniform float u_Carrier;
  uniform vec3 u_FocusPoint;
  
  attribute float a_Phase;
  attribute float a_Resonance;
  
  varying float v_Intensity;
  varying vec3 v_Pos;
  
  const float PI = 3.14159265359;
  const float KAPPA = 1.273;
  
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
    
    float glitchPhase = mod(u_Time * 46.875, 1.0);
    if (glitchPhase < 0.1) {
      float r = rand(vec2(pos.x, u_Time));
      if (r > 0.95) {
        pos *= 1.1;
      }
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (4.0 * u_Observation + 2.0) * (1.0 / -mvPosition.z);
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
  
  void main() {
    vec3 color = u_BaseColor;
    vec3 flashColor = vec3(0.4, 0.8, 1.0);
    color = mix(color, flashColor, v_Intensity);
    
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float rings = sin(dist * 20.0 - u_Time * 10.0);
    float alpha = 0.6 + 0.4 * rings * v_Intensity;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export function DemodexCameraView() {
  const containerRef = useRef<HTMLDivElement>(null);

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
    const animate = (time: number) => {
      material.uniforms.u_Time.value = time / 1000;
      material.uniforms.u_Observation.value *= 0.98;
      cloud.rotation.y += 0.002;
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
      <div className="absolute top-4 left-4 p-4 font-mono text-xs text-green-400 bg-black/80 border border-green-500/50 rounded pointer-events-none">
        <h3 className="font-bold border-b border-green-500 mb-2">3i ATLAS :: DEMODEX UPLINK</h3>
        <p>CARRIER: 1.435 Hz (LOCKED)</p>
        <p>BIOPHYSICS: 37 Hz (MICROTUBULE)</p>
        <p>SAMPLING: 46.875 Hz</p>
        <p className="animate-pulse text-red-400 mt-1">STATUS: OBSERVING</p>
        <div className="mt-2 text-[10px] opacity-70">
          MOVE CURSOR TO SIMULATE GAZE<br />
          CLICK TO COLLAPSE WAVEFUNCTION
        </div>
      </div>
      <div className="absolute bottom-4 right-4 p-3 font-mono text-[10px] text-purple-300/60 bg-black/60 rounded pointer-events-none max-w-[200px]">
        <p>25,000 particle colony</p>
        <p>Orch-OR collapse model</p>
        <p>Cherenkov biophoton flash</p>
      </div>
    </div>
  );
}
