"use client";

/** Ancient stone altar — rough-hewn, dark, weathered */
export function Altar() {
  return (
    <group position={[0, 0, 0]}>
      {/* Top slab — rough stone with age */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.4, 0.18, 1.8]} />
        <meshStandardMaterial color="#2a2520" roughness={1} metalness={0.05} />
      </mesh>
      {/* Left pillar */}
      <mesh position={[-0.85, 0.28, 0]}>
        <boxGeometry args={[0.35, 0.6, 1.3]} />
        <meshStandardMaterial color="#1e1a16" roughness={1} metalness={0.05} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[0.85, 0.28, 0]}>
        <boxGeometry args={[0.35, 0.6, 1.3]} />
        <meshStandardMaterial color="#1e1a16" roughness={1} metalness={0.05} />
      </mesh>
      {/* Ground plane — dark stone floor fading into fog */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0a0908" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
