# Feature: 3D Spellbook Landing Page (Three.js)

## Overview

Replace the current flat login page with an immersive 3D spellbook scene. When users arrive at the app, they see an ancient open spellbook on a dark altar, glowing with mana energy. Instead of traditional buttons, glowing symbols on the book's pages act as Sign In and Sign Up entry points, with cinematic camera animations on interaction.

---

## Tech Stack

| Library                       | Version  | Purpose                                                       |
| ----------------------------- | -------- | ------------------------------------------------------------- |
| `@react-three/fiber`          | ^9.x     | React renderer for Three.js                                   |
| `@react-three/drei`           | ^10.x    | Helpers (OrbitControls, Text3D, Environment, Float, Sparkles) |
| `@react-three/postprocessing` | ^3.x     | Bloom, vignette, depth of field                               |
| `three`                       | ^0.170.x | Core 3D engine                                                |
| `gsap`                        | ^3.12.x  | Camera animation timeline (cinematic zoom)                    |

### Installation

```bash
pnpm add three @react-three/fiber @react-three/drei @react-three/postprocessing gsap
pnpm add -D @types/three
```

---

## Architecture

```
src/
  app/
    auth/
      signin/page.tsx          ← existing auth page (NextAuth)
      signup/page.tsx           ← existing auth page
    page.tsx                    ← landing page (mounts the 3D scene)
  components/
    landing/
      SpellbookScene.tsx        ← R3F Canvas + scene composition
      Spellbook.tsx             ← Book model + page glow logic
      ManaParticles.tsx         ← Floating particle system
      GlyphSymbol.tsx           ← Interactive glowing rune (Sign In / Sign Up)
      CameraRig.tsx             ← Animated camera controller (idle + cinematic zoom)
      Altar.tsx                 ← Stone/wood altar base
      PostEffects.tsx           ← Bloom + vignette + DOF
```

### Client boundary

The entire 3D scene must be `"use client"` since Three.js requires the DOM. The landing `page.tsx` can remain a server component that lazy-loads the scene:

```typescript
// app/page.tsx (server component)
import dynamic from 'next/dynamic';

const SpellbookScene = dynamic(
  () => import('@/components/landing/SpellbookScene'),
  { ssr: false, loading: () => <LoadingScreen /> }
);

export default function LandingPage() {
  return <SpellbookScene />;
}
```

`ssr: false` is critical — Three.js cannot render server-side.

---

## Scene Composition

```typescript
// components/landing/SpellbookScene.tsx
"use client";

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Spellbook } from './Spellbook';
import { ManaParticles } from './ManaParticles';
import { Altar } from './Altar';
import { CameraRig } from './CameraRig';
import { PostEffects } from './PostEffects';

export default function SpellbookScene() {
  return (
    <div className="h-screen w-screen bg-black">
      <Canvas
        camera={{ position: [0, 2, 5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}  // cap pixel ratio for performance
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <pointLight position={[0, 3, 0]} intensity={0.8} color="#e8d5a3" />

          <CameraRig />
          <Altar />
          <Spellbook />
          <ManaParticles />
          <PostEffects />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

---

## The Spellbook Model

### Option A: GLTF model (recommended for quality)

Download or create a spellbook .glb model. Good free sources:

- Sketchfab (search "open spellbook", "magic book", filter by downloadable)
- Blender + free models from BlendSwap

Load with drei's `useGLTF`:

```typescript
import { useGLTF } from '@react-three/drei';

function Spellbook() {
  const { scene } = useGLTF('/models/spellbook.glb');
  return <primitive object={scene} scale={0.5} position={[0, 1, 0]} />;
}

useGLTF.preload('/models/spellbook.glb');
```

Place the .glb in `public/models/`.

### Option B: Procedural geometry (faster to prototype)

Build a simplified book from BoxGeometry planes:

```typescript
function ProceduralSpellbook() {
  return (
    <group position={[0, 1, 0]} rotation={[-0.3, 0, 0]}>
      {/* Spine */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.02, 1.4]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.9} />
      </mesh>

      {/* Left page */}
      <mesh position={[-0.55, 0.02, 0]} rotation={[0, 0, 0.05]}>
        <planeGeometry args={[1, 1.4]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.7} side={2} />
      </mesh>

      {/* Right page */}
      <mesh position={[0.55, 0.02, 0]} rotation={[0, 0, -0.05]}>
        <planeGeometry args={[1, 1.4]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.7} side={2} />
      </mesh>
    </group>
  );
}
```

This gives a basic open book shape. Can be enhanced with curved pages via custom BufferGeometry.

---

## Interactive Glyphs (Raycasting)

Each page has a glowing symbol that responds to hover and click:

```typescript
// components/landing/GlyphSymbol.tsx
"use client";

import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Float } from '@react-three/drei';
import * as THREE from 'three';

interface GlyphSymbolProps {
  position: [number, number, number];
  label: string;           // "ARCHITECT" or "RECRUIT"
  color: string;           // "#3b82f6" (blue) or "#22c55e" (green)
  onClick: () => void;
}

export function GlyphSymbol({ position, label, color, onClick }: GlyphSymbolProps) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  // Animate glow intensity on hover
  useFrame((_, delta) => {
    if (glowRef.current) {
      const target = hovered ? 3 : 0.5;
      glowRef.current.intensity = THREE.MathUtils.lerp(
        glowRef.current.intensity,
        target,
        delta * 4
      );
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <group position={position}>
        {/* Clickable area */}
        <mesh
          ref={meshRef}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={onClick}
        >
          <circleGeometry args={[0.3, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 2 : 0.5}
            transparent
            opacity={hovered ? 0.9 : 0.6}
          />
        </mesh>

        {/* Glow light */}
        <pointLight
          ref={glowRef}
          color={color}
          intensity={0.5}
          distance={2}
          decay={2}
        />
      </group>
    </Float>
  );
}
```

### Cursor change on hover

```typescript
// In SpellbookScene, set cursor style based on hover state
<Canvas style={{ cursor: isHovering ? 'pointer' : 'default' }}>
```

---

## Mana Particles

Neutral white/grey particles rising gently from the book:

```typescript
// components/landing/ManaParticles.tsx
"use client";

import { Sparkles } from '@react-three/drei';

export function ManaParticles() {
  return (
    <Sparkles
      count={80}
      scale={[3, 4, 3]}
      position={[0, 2, 0]}
      size={2}
      speed={0.3}
      opacity={0.4}
      color="#e8d5a3"
    />
  );
}
```

For colored mana embers on hover (WUBRG), add a second Sparkles component that changes color based on which glyph is hovered.

---

## Camera Rig (Idle + Cinematic Zoom)

```typescript
// components/landing/CameraRig.tsx
"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";

interface CameraRigProps {
  zoomTarget: THREE.Vector3 | null; // null = idle, Vector3 = zoom destination
  onZoomComplete?: () => void;
}

export function CameraRig({ zoomTarget, onZoomComplete }: CameraRigProps) {
  const { camera } = useThree();
  const isAnimating = useRef(false);

  // Idle: gentle orbital sway
  useFrame(({ clock }) => {
    if (isAnimating.current) return;

    const t = clock.getElapsedTime() * 0.15;
    camera.position.x = Math.sin(t) * 0.3;
    camera.position.y = 2 + Math.sin(t * 0.5) * 0.1;
    camera.lookAt(0, 1, 0);
  });

  // Cinematic zoom when a glyph is clicked
  useFrame(() => {
    if (zoomTarget && !isAnimating.current) {
      isAnimating.current = true;

      gsap.to(camera.position, {
        x: zoomTarget.x,
        y: zoomTarget.y + 0.5,
        z: zoomTarget.z + 0.8,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => camera.lookAt(zoomTarget),
        onComplete: () => {
          onZoomComplete?.();
        },
      });
    }
  });

  return null;
}
```

---

## Post-Processing Effects

```typescript
// components/landing/PostEffects.tsx
"use client";

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export function PostEffects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette offset={0.3} darkness={0.7} />
    </EffectComposer>
  );
}
```

Bloom makes the glowing glyphs and particles look magical. Vignette darkens the edges for a dramatic frame.

---

## Interaction Flow

```
1. Page loads → black screen → Canvas mounts → scene fades in
2. IDLE STATE:
   - Camera gently sways
   - Spellbook sits open on altar
   - Neutral particles rise from pages
   - Two glyphs glow softly (blue-left, green-right)

3. USER HOVERS left glyph ("ARCHITECT" / Sign In):
   - Left page glows blue/red intensely
   - Particles shift to blue/red
   - Rune text appears: "ARCHITECT"
   - Cursor becomes pointer

4. USER HOVERS right glyph ("RECRUIT" / Sign Up):
   - Right page glows green/white intensely
   - Particles shift to green/white
   - Rune text appears: "RECRUIT"

5. USER CLICKS a glyph:
   - Bloom burst (short flash)
   - Camera zooms cinematically into the glyph (2s gsap timeline)
   - Scene fades to white/black
   - router.push('/auth/signin') or router.push('/auth/signup')
```

### Redirect implementation

```typescript
"use client";

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import * as THREE from 'three';

export default function SpellbookScene() {
  const router = useRouter();
  const [zoomTarget, setZoomTarget] = useState<THREE.Vector3 | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  const handleGlyphClick = useCallback((path: string, target: THREE.Vector3) => {
    setRedirectPath(path);
    setZoomTarget(target);
  }, []);

  const handleZoomComplete = useCallback(() => {
    if (redirectPath) {
      router.push(redirectPath);
    }
  }, [redirectPath, router]);

  return (
    <Canvas>
      <CameraRig zoomTarget={zoomTarget} onZoomComplete={handleZoomComplete} />
      <GlyphSymbol
        position={[-0.5, 1.1, 0.2]}
        label="ARCHITECT"
        color="#3b82f6"
        onClick={() => handleGlyphClick('/auth/signin', new THREE.Vector3(-0.5, 1.1, 0.2))}
      />
      <GlyphSymbol
        position={[0.5, 1.1, 0.2]}
        label="RECRUIT"
        color="#22c55e"
        onClick={() => handleGlyphClick('/auth/signup', new THREE.Vector3(0.5, 1.1, 0.2))}
      />
      {/* ... rest of scene */}
    </Canvas>
  );
}
```

---

## Performance Considerations

### Bundle size

R3F + drei + postprocessing adds roughly 500-700KB to the client bundle. Mitigation:

- `dynamic(() => import(...), { ssr: false })` — only loaded on the landing page, not on the deck builder
- Tree-shaking: import only needed drei helpers, not the entire library
- The auth pages (`/auth/signin`, `/auth/signup`) do NOT load any Three.js code

### Rendering budget

Target: 60fps on mid-range hardware (GTX 1060 / M1 MacBook Air).

- Cap `dpr` at 1.5 (`dpr={[1, 1.5]}`)
- Limit particle count (80-120 sparkles, not thousands)
- Use `mipmapBlur` on Bloom for GPU-friendly glow
- Dispose textures and geometries on unmount (R3F handles this automatically)
- No shadow maps (too expensive for a login page)

### Mobile

Three.js on mobile is heavier. Options:

- Detect mobile via user agent → serve a simpler 2D animated version (CSS particles + gradient)
- Or: reduce particle count, disable postprocessing, lower dpr to 1

```typescript
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

<Canvas dpr={isMobile ? 1 : [1, 1.5]}>
  {!isMobile && <PostEffects />}
  <ManaParticles count={isMobile ? 30 : 80} />
</Canvas>
```

---

## Spellbook 3D Model Sources

Free models to start with (check licenses):

- [Sketchfab: "Open Magic Book"](https://sketchfab.com/search?q=open+magic+book&type=models) — filter by "Downloadable" + CC license
- [Poly Pizza](https://poly.pizza/) — low-poly stylized models
- [Turbosquid free section](https://www.turbosquid.com/Search/3D-Models/free/spell-book)

Export as .glb (binary GLTF). Optimize with `gltf-transform` or `gltfjsx` to generate a typed React component:

```bash
npx gltfjsx public/models/spellbook.glb --types --transform
```

This generates a `Spellbook.tsx` with proper TypeScript types and optimized geometry.

---

## Accessibility Fallback

For users with `prefers-reduced-motion`, screen readers, or very old hardware:

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  return <StaticLandingPage />;  // 2D fallback with same design language
}
```

The fallback page should have the same dark theme, book imagery (static PNG), and standard Sign In / Sign Up buttons.

---

## Implementation Priority

1. **Scene scaffold** — Canvas + camera + lights + placeholder box for the book
2. **Spellbook model** — Find/create .glb, load with useGLTF
3. **Glyph interaction** — Raycasting, hover glow, emissive materials
4. **Particles** — Sparkles from drei, neutral then colored on hover
5. **Camera animation** — Idle sway + gsap cinematic zoom on click
6. **Post-processing** — Bloom + vignette
7. **Redirect flow** — router.push after zoom completes
8. **Mobile detection** — Simplified scene or 2D fallback
9. **Accessibility** — prefers-reduced-motion fallback
10. **Polish** — Fade transitions, loading screen, sound effects (optional)
