"use client";
import { Sparkles } from "@react-three/drei";

/** Drifting embers and ash — slow, heavy, like a dying fire */
export function ManaParticles() {
  return (
    <>
      {/* Primary embers — deep blood orange, slow drift */}
      <Sparkles
        count={45}
        scale={[4, 5, 4]}
        position={[0, 2, 0]}
        size={1.8}
        speed={0.15}
        opacity={0.5}
        color="#d9381e"
      />
      {/* Secondary ash — faint, warm, scattered wider */}
      <Sparkles
        count={25}
        scale={[6, 6, 6]}
        position={[0, 3, 0]}
        size={1.2}
        speed={0.08}
        opacity={0.2}
        color="#ffaa44"
      />
    </>
  );
}
