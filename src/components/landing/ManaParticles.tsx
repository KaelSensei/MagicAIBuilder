"use client";
import { Sparkles } from "@react-three/drei";

/** Neutral mana particles rising from the spellbook */
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
