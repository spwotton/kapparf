/**
 * GLSL Shaders — GOS Quantum Quake
 * Vertex: 128.23° twist modulated by Δκ
 * Fragment: κ-scaled position coloring with resonance glow
 */

// ─── GOS Twist Vertex Shader ────────────────────────────────
export const gosTwistVert = /* glsl */`
uniform float uTime;
uniform float uTwistAngle;   // 128.23° in radians
uniform float uDeltaKappa;   // 0.161393
uniform float uCarrier;      // 8.392
uniform float uBreathAmp;    // 0.05
uniform float uPsi;          // coherence 0..1

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vTwist;

void main() {
    // GOS twist: θ modulated by sin(2π·Δκ·t)
    float twistPhase = sin(6.283185 * uDeltaKappa * uTime);
    float twist = uTwistAngle * twistPhase;

    // Apply twist based on Y position (like a tornado)
    float yNorm = position.y * 0.1;
    float c = cos(twist * yNorm);
    float s = sin(twist * yNorm);
    vec3 twisted = vec3(
        position.x * c - position.z * s,
        position.y,
        position.x * s + position.z * c
    );

    // κ-breath: gentle scale pulsation at carrier frequency
    float breath = 1.0 + uBreathAmp * sin(6.283185 * uCarrier * uTime);
    twisted *= breath;

    // Ψ-coherence warp: high coherence → stable geometry
    float warp = mix(0.02, 0.0, uPsi);
    twisted += normal * warp * sin(uTime * 3.0 + position.y * 2.0);

    vWorldPos = (modelMatrix * vec4(twisted, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    vTwist = twist * yNorm;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(twisted, 1.0);
}
`;

// ─── GOS Resonance Fragment Shader ──────────────────────────
export const gosResonanceFrag = /* glsl */`
uniform float uTime;
uniform float uKappa;        // 1.435
uniform float uPhi;          // 1.618
uniform float uPsi;          // coherence
uniform float uDeltaKappa;
uniform vec3  uGeneColor;    // active gene tint
uniform float uResonance;    // 0..1

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vTwist;

// φ-based golden gradient
vec3 goldenGradient(float t) {
    return vec3(
        0.5 + 0.5 * cos(6.283185 * (t + 0.0)),
        0.5 + 0.5 * cos(6.283185 * (t + 0.33)),
        0.5 + 0.5 * cos(6.283185 * (t + 0.67))
    );
}

void main() {
    // κ-scaled position coloring
    float kappaField = sin(vWorldPos.x * uKappa + uTime) *
                       cos(vWorldPos.z * uKappa - uTime * 0.7) *
                       sin(vWorldPos.y * uKappa * 0.5 + uTime * 0.3);

    // Base color: golden-ratio gradient mapped to position
    float gradParam = fract(length(vWorldPos.xz) * 0.05 / uPhi + uTime * uDeltaKappa);
    vec3 baseColor = goldenGradient(gradParam);

    // Twist coloring: more twisted → more cyan
    float twistColor = abs(vTwist) * 0.3;
    baseColor = mix(baseColor, vec3(0.0, 1.0, 1.0), clamp(twistColor, 0.0, 0.5));

    // κ-field interference pattern
    float interference = 0.5 + 0.5 * kappaField;
    baseColor *= 0.6 + 0.4 * interference;

    // Gene resonance glow
    vec3 geneGlow = uGeneColor * uResonance * (0.5 + 0.5 * sin(uTime * 4.0));
    baseColor += geneGlow * 0.3;

    // Ψ coherence: high Ψ → brighter, sharper
    baseColor *= 0.5 + 0.5 * uPsi;

    // Simple directional lighting
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.25;
    float diffuse = NdotL * 0.75;

    vec3 finalColor = baseColor * (ambient + diffuse);

    // Edge glow (rim lighting) — quantum boundary
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
    rim = pow(rim, 3.0);
    finalColor += vec3(0.0, 0.8, 1.0) * rim * 0.4 * uPsi;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

// ─── Klein Bottle Vertex Shader ─────────────────────────────
export const kleinVert = /* glsl */`
uniform float uTime;
uniform float uTwistAngle;
uniform float uDeltaKappa;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vUv = uv;
    // Gentle self-intersection twist
    float phase = sin(6.283185 * uDeltaKappa * uTime);
    float twist = uTwistAngle * 0.3 * phase;
    float c = cos(twist * uv.y);
    float s = sin(twist * uv.y);

    vec3 p = vec3(
        position.x * c - position.z * s,
        position.y,
        position.x * s + position.z * c
    );

    vWorldPos = (modelMatrix * vec4(p, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

// ─── Klein Bottle Fragment Shader ───────────────────────────
export const kleinFrag = /* glsl */`
uniform float uTime;
uniform float uPhi;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    // Self-intersection visualization
    float pattern = sin(vUv.x * 20.0 + uTime) * cos(vUv.y * 20.0 - uTime * 0.5);
    float grid = step(0.95, abs(pattern));

    vec3 baseColor = mix(
        vec3(0.05, 0.0, 0.15),   // deep purple
        vec3(0.0, 0.4, 0.8),     // electric blue
        0.5 + 0.5 * sin(vUv.x * uPhi * 10.0 + uTime)
    );

    // Wireframe-like grid overlay
    baseColor += vec3(0.0, 1.0, 0.5) * grid * 0.5;

    // Lighting
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    float NdotL = max(dot(vNormal, lightDir), 0.0);
    vec3 finalColor = baseColor * (0.3 + 0.7 * NdotL);

    // Transparency for self-intersection
    float alpha = 0.6 + 0.2 * sin(vUv.y * 6.283185 + uTime);
    gl_FragColor = vec4(finalColor, alpha);
}
`;

// ─── Skybox / Void Shader ───────────────────────────────────
export const voidFrag = /* glsl */`
uniform float uTime;
uniform float uDeltaKappa;

varying vec2 vUv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    // Starfield
    vec2 grid = floor(vUv * 200.0);
    float star = step(0.997, hash(grid));
    float twinkle = 0.5 + 0.5 * sin(uTime * 2.0 + hash(grid) * 6.283185);

    // Deep space nebula
    float nebula = 0.0;
    vec2 p = vUv * 3.0;
    for (int i = 0; i < 3; i++) {
        p = p * 1.5 + uTime * uDeltaKappa * 0.1;
        nebula += sin(p.x) * sin(p.y) * 0.5;
        p = vec2(p.y, -p.x);
    }
    nebula = abs(nebula) * 0.15;

    vec3 col = vec3(0.02, 0.0, 0.05);          // base void
    col += vec3(0.1, 0.0, 0.2) * nebula;        // nebula
    col += vec3(0.8, 0.9, 1.0) * star * twinkle; // stars

    gl_FragColor = vec4(col, 1.0);
}
`;

export const voidVert = /* glsl */`
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ─── Gene Collectible Glow Shader ───────────────────────────
export const geneGlowVert = /* glsl */`
uniform float uTime;
uniform float uFrequency;   // gene-specific frequency
uniform float uPhase;       // gene-specific phase

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
    // Pulsate at gene frequency (scaled down to visible range)
    float pulse = 1.0 + 0.15 * sin(6.283185 * uFrequency * 0.01 * uTime + uPhase);
    vec3 p = position * pulse;

    // Gentle rotation
    float angle = uTime * 0.5;
    float c = cos(angle), s = sin(angle);
    p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);

    vWorldPos = (modelMatrix * vec4(p, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

export const geneGlowFrag = /* glsl */`
uniform float uTime;
uniform vec3  uColor;
uniform float uFrequency;

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
    float pulse = 0.5 + 0.5 * sin(6.283185 * uFrequency * 0.01 * uTime);
    vec3 glow = uColor * (0.5 + 0.5 * pulse);

    // Rim glow
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
    rim = pow(rim, 2.0);
    glow += vec3(1.0) * rim * 0.5;

    gl_FragColor = vec4(glow, 0.8 + 0.2 * pulse);
}
`;
