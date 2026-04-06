"use client";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/** Post-processing: bloom for glow + vignette for dramatic framing */
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
