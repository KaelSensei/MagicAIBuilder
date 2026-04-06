"use client";
/**
 * SpellbookScene — dark fantasy 3D landing page.
 * Inspired by Paolo Parente, Brom, and 90s MTG/D&D art:
 * chiaroscuro lighting, creeping fog, drifting embers, warped parchment.
 */
import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Spellbook } from "./Spellbook";
import { ManaParticles } from "./ManaParticles";
import { Altar } from "./Altar";
import { CameraRig } from "./CameraRig";
import { GlyphSymbol } from "./GlyphSymbol";
import { PostEffects } from "./PostEffects";

export default function SpellbookScene() {
  const router = useRouter();
  const [zoomTarget, setZoomTarget] = useState<THREE.Vector3 | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleGlyphClick = useCallback(
    (path: string, target: THREE.Vector3) => {
      setRedirectPath(path);
      setZoomTarget(target);
    },
    []
  );

  const handleZoomComplete = useCallback(() => {
    if (redirectPath) {
      router.push(redirectPath);
    }
  }, [redirectPath, router]);

  return (
    <div className="h-screen w-screen bg-[#050505] relative">
      <Canvas
        camera={{ position: [0, 2, 5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        style={{ cursor: isHovering ? "pointer" : "default" }}
      >
        <Suspense fallback={null}>
          {/* The Abyss: pitch-black void with creeping mist */}
          <color attach="background" args={["#050505"]} />
          <fog attach="fog" args={["#050505", 5, 15]} />

          {/* The Torch: warm, flickering single source */}
          <pointLight
            position={[0, 2.5, 1]}
            intensity={1.5}
            color="#ffaa44"
            distance={10}
            decay={2}
          />

          {/* The Moonlight: cold rim light to catch edges */}
          <spotLight
            position={[5, 5, 5]}
            angle={0.15}
            penumbra={1}
            intensity={0.5}
            color="#4a5568"
          />

          {/* Faint fill so the scene isn't pure black */}
          <ambientLight intensity={0.04} />

          <CameraRig zoomTarget={zoomTarget} onZoomComplete={handleZoomComplete} />
          <Altar />
          <Spellbook />
          <ManaParticles />

          {/* Sign In glyph — left page */}
          <GlyphSymbol
            position={[-0.45, 0.85, 0.15]}
            label="ARCHITECT"
            color="#d9381e"
            onClick={() =>
              handleGlyphClick("/auth/signin", new THREE.Vector3(-0.45, 0.85, 0.15))
            }
            onHover={setIsHovering}
          />

          {/* Sign Up glyph — right page */}
          <GlyphSymbol
            position={[0.45, 0.85, 0.15]}
            label="RECRUIT"
            color="#b8860b"
            onClick={() =>
              handleGlyphClick("/auth/signup", new THREE.Vector3(0.45, 0.85, 0.15))
            }
            onHover={setIsHovering}
          />

          <PostEffects />
        </Suspense>
      </Canvas>

      {/* Bottom attribution — gothic feel */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <p className="text-xs text-amber-900/40 tracking-[0.3em] uppercase font-serif">
          MagicAIBuilder
        </p>
      </div>
    </div>
  );
}
