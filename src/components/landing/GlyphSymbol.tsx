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

/** Interactive glowing rune on a spellbook page */
export function GlyphSymbol({ position, label, color, onClick, onHover }: GlyphSymbolProps) {
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (!glowRef.current) return;
    const target = hovered ? 3 : 0.5;
    glowRef.current.intensity = THREE.MathUtils.lerp(
      glowRef.current.intensity,
      target,
      delta * 4
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
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <group position={position}>
        {/* Clickable circle */}
        <mesh
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onClick={onClick}
        >
          <circleGeometry args={[0.25, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 2 : 0.5}
            transparent
            opacity={hovered ? 0.9 : 0.6}
          />
        </mesh>

        {/* Label text */}
        <Text
          position={[0, -0.4, 0.01]}
          fontSize={0.08}
          color={color}
          anchorX="center"
          anchorY="middle"
          fillOpacity={hovered ? 1 : 0.5}
        >
          {label}
        </Text>

        {/* Glow light */}
        <pointLight
          ref={glowRef}
          color={color}
          intensity={0.5}
          distance={2}
          decay={2}
        />
      </group>
    </Float>
  );
}
