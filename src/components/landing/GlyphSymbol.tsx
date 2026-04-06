"use client";
import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import * as THREE from "three";

interface GlyphSymbolProps {
  readonly position: [number, number, number];
  readonly label: string;
  readonly color: string;
  readonly onClick: () => void;
  readonly onHover: (hovered: boolean) => void;
}

/** Glowing rune on a spellbook page — gothic, ember-lit */
export function GlyphSymbol({ position, label, color, onClick, onHover }: GlyphSymbolProps) {
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (!glowRef.current) return;
    const target = hovered ? 4 : 0.8;
    glowRef.current.intensity = THREE.MathUtils.lerp(
      glowRef.current.intensity,
      target,
      delta * 3
    );
  });

  const handlePointerEnter = () => {
    setHovered(true);
    onHover(true);
  };
  const handlePointerLeave = () => {
    setHovered(false);
    onHover(false);
  };

  return (
    <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        {/* Rune circle — rough-edged, ember-lit */}
        <mesh
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onClick={onClick}
        >
          <circleGeometry args={[0.22, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 3 : 0.8}
            transparent
            opacity={hovered ? 0.95 : 0.5}
            roughness={0.8}
          />
        </mesh>

        {/* Label — gothic uppercase, faint until hovered */}
        <Text
          position={[0, -0.38, 0.01]}
          fontSize={0.065}
          color={color}
          anchorX="center"
          anchorY="middle"
          fillOpacity={hovered ? 1 : 0.35}
          letterSpacing={0.15}
        >
          {label}
        </Text>

        {/* Rune glow — warm, close-range */}
        <pointLight
          ref={glowRef}
          color={color}
          intensity={0.8}
          distance={1.5}
          decay={2}
        />
      </group>
    </Float>
  );
}
