"use client";

/** Stone altar base for the spellbook */
export function Altar() {
  return (
    <group position={[0, 0, 0]}>
      {/* Top slab */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.2, 0.15, 1.6]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.95} metalness={0.1} />
      </mesh>
      {/* Left pillar */}
      <mesh position={[-0.8, 0.3, 0]}>
        <boxGeometry args={[0.3, 0.6, 1.2]} />
        <meshStandardMaterial color="#3d3d3d" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[0.8, 0.3, 0]}>
        <boxGeometry args={[0.3, 0.6, 1.2]} />
        <meshStandardMaterial color="#3d3d3d" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}
