"use client";

/** Procedural open spellbook — two angled pages on a leather spine */
export function Spellbook() {
  return (
    <group position={[0, 0.76, 0]} rotation={[-0.3, 0, 0]}>
      {/* Spine */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.04, 1.4]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.9} />
      </mesh>

      {/* Left cover */}
      <mesh position={[-0.55, -0.01, 0]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[1, 0.03, 1.4]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} />
      </mesh>

      {/* Right cover */}
      <mesh position={[0.55, -0.01, 0]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[1, 0.03, 1.4]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} />
      </mesh>

      {/* Left page */}
      <mesh position={[-0.5, 0.03, 0]} rotation={[0, 0, 0.05]}>
        <planeGeometry args={[0.9, 1.3]} />
        <meshStandardMaterial
          color="#f5e6c8"
          roughness={0.7}
          side={2}
        />
      </mesh>

      {/* Right page */}
      <mesh position={[0.5, 0.03, 0]} rotation={[0, 0, -0.05]}>
        <planeGeometry args={[0.9, 1.3]} />
        <meshStandardMaterial
          color="#f5e6c8"
          roughness={0.7}
          side={2}
        />
      </mesh>
    </group>
  );
}
