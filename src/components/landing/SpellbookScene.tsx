"use client";
/**
 * SpellbookScene — immersive 3D landing page for unauthenticated users.
 * Renders an ancient open spellbook on a dark altar with glowing runes
 * for Sign In ("ARCHITECT") and Sign Up ("RECRUIT").
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
    <div className="h-screen w-screen bg-black relative">
      <Canvas
        camera={{ position: [0, 2, 5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        style={{ cursor: isHovering ? "pointer" : "default" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <pointLight position={[0, 3, 0]} intensity={0.8} color="#e8d5a3" />
          <pointLight position={[-2, 2, 2]} intensity={0.3} color="#6366f1" />
          <pointLight position={[2, 2, 2]} intensity={0.3} color="#22c55e" />

          <CameraRig zoomTarget={zoomTarget} onZoomComplete={handleZoomComplete} />
          <Altar />
          <Spellbook />
          <ManaParticles />

          {/* Sign In glyph — left page */}
          <GlyphSymbol
            position={[-0.45, 0.85, 0.15]}
            label="ARCHITECT"
            color="#6366f1"
            onClick={() =>
              handleGlyphClick("/auth/signin", new THREE.Vector3(-0.45, 0.85, 0.15))
            }
            onHover={setIsHovering}
          />

          {/* Sign Up glyph — right page */}
          <GlyphSymbol
            position={[0.45, 0.85, 0.15]}
            label="RECRUIT"
            color="#22c55e"
            onClick={() =>
              handleGlyphClick("/auth/signup", new THREE.Vector3(0.45, 0.85, 0.15))
            }
            onHover={setIsHovering}
          />

          <PostEffects />
        </Suspense>
      </Canvas>

      {/* Bottom attribution */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <p className="text-xs text-white/30">MagicAIBuilder</p>
      </div>
    </div>
  );
}
