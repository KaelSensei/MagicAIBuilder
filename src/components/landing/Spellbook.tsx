"use client";

/** Ancient spellbook — warped parchment on scarred leather, heavy and tactile */
export function Spellbook() {
  return (
    <group position={[0, 0.76, 0]} rotation={[-0.3, 0, 0]}>
      {/* Spine — dark cracked leather */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.06, 1.4]} />
        <meshStandardMaterial color="#1a0f0a" roughness={1} metalness={0} />
      </mesh>

      {/* Left cover — scarred leather with age */}
      <mesh position={[-0.55, -0.01, 0]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[1, 0.04, 1.4]} />
        <meshStandardMaterial color="#2d1810" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Right cover */}
      <mesh position={[0.55, -0.01, 0]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[1, 0.04, 1.4]} />
        <meshStandardMaterial color="#2d1810" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Left page — warped parchment, high-segment plane for organic feel */}
      <mesh position={[-0.5, 0.04, 0]} rotation={[0, 0.05, 0.05]}>
        <planeGeometry args={[0.9, 1.3, 16, 16]} />
        <meshStandardMaterial
          color="#c2a278"
          roughness={1}
          metalness={0}
          side={2}
        />
      </mesh>

      {/* Right page */}
      <mesh position={[0.5, 0.04, 0]} rotation={[0, -0.05, -0.05]}>
        <planeGeometry args={[0.9, 1.3, 16, 16]} />
        <meshStandardMaterial
          color="#c2a278"
          roughness={1}
          metalness={0}
          side={2}
        />
      </mesh>

      {/* Inner page stack — visible edge of thick pages */}
      <mesh position={[-0.5, 0.02, 0]} rotation={[0, 0, 0.06]}>
        <boxGeometry args={[0.9, 0.03, 1.28]} />
        <meshStandardMaterial color="#a89070" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0.5, 0.02, 0]} rotation={[0, 0, -0.06]}>
        <boxGeometry args={[0.9, 0.03, 1.28]} />
        <meshStandardMaterial color="#a89070" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
