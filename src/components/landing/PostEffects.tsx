"use client";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";

/** Post-processing: gritty illustrated Parente texture + deep shadows */
export function PostEffects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.6}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      {/* Film grain — gritty, hand-drawn texture */}
      <Noise opacity={0.06} />
      {/* Heavy vignette — crushing dark edges */}
      <Vignette offset={0.15} darkness={0.85} />
    </EffectComposer>
  );
}
