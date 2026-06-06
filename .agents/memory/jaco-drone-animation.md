---
name: Jaco 3D drone animation patterns
description: Critical patterns for the Three.js drone model animation in jaco-map.tsx — hover bob, belly light, aircraft lerp
---

## Hover Bob — must NOT accumulate

The drone hover bob **must** use a fixed base altitude, not `+=`:

```js
// WRONG — accumulates every frame, drone flies to infinity
drone.position.y += Math.sin(t*2.3)*0.35;

// CORRECT — oscillates around fixed base
drone.position.y = droneBaseY + Math.sin(t*2.3)*0.35;
```

`droneBaseY` must be declared after `buildDrone(scene)` and set inside `updateAircraft` when `drone.position.set(dx, dAlt, dz)` is called.

**Why:** Three.js animate loop runs 60fps. Any `+=` on position with a non-zero RMS value drifts without bound.

## Belly Light — pitch is out of scope at traverse

Inside `scene.traverse(obj => { ... })`, `pitch` is not defined. Use a time-based sine instead:

```js
// WRONG — ReferenceError every frame
if((obj as any)._isBellyLight) light.intensity = 1.2 + Math.abs(pitch)*4 + ...;

// CORRECT — autonomous pulsation
if((obj as any)._isBellyLight) light.intensity = 1.2 + Math.abs(Math.sin(t*1.4))*0.8 + Math.sin(t*8)*0.15;
```

## Aircraft Position Lerp — _tgt / _posInit pattern

OpenSky polls every 30s. To avoid teleporting meshes, store target positions and lerp in the animate loop:

```js
// In updateAircraft:
const tY = acY(ac.baroAltitude ?? ac.geoAltitude);
if (!(mesh as any)._posInit) { mesh.position.set(ax, tY, az); (mesh as any)._posInit = true; }
(mesh as any)._tgt = [ax, tY, az];

// In animate loop (before renderer.render):
for (const [,m] of acMeshes.entries()) {
  const tgt = (m as any)._tgt;
  if (tgt) { m.position.x += (tgt[0]-m.position.x)*0.05; ... }
}
```

## GOS Breath Scale on Drone

Carrier freq 8.392 Hz is too fast to see at 60fps; scale down to ~0.08392 Hz visual:

```js
const breathScale = 1.0 + 0.018 * Math.sin(6.28318 * 0.08392 * t);
drone.scale.setScalar(breathScale);
```

## snapToTrack

The scene object exposes `snapToTrack()` that centers camera on drone when visible:

```js
snapToTrack: () => { if(drone.visible){ camTarget.set(drone.position.x, drone.position.y, drone.position.z); camDist=35; camElev=0.55; } }
```

The fallback stub (WebGL unavailable path) must also include this method or TypeScript will complain.
