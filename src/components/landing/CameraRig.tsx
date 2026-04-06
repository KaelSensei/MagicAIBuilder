"use client";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";

interface CameraRigProps {
  readonly zoomTarget: THREE.Vector3 | null;
  readonly onZoomComplete?: () => void;
}

/** Idle camera sway + cinematic zoom on glyph click */
export function CameraRig({ zoomTarget, onZoomComplete }: CameraRigProps) {
  const { camera } = useThree();
  const isAnimating = useRef(false);
  const hasTriggered = useRef(false);

  // Idle orbital sway
  useFrame(({ clock }) => {
    if (isAnimating.current) return;
    const t = clock.getElapsedTime() * 0.15;
    camera.position.x = Math.sin(t) * 0.3;
    camera.position.y = 2 + Math.sin(t * 0.5) * 0.1;
    camera.position.z = 5;
    camera.lookAt(0, 0.8, 0);
  });

  // Cinematic zoom when glyph is clicked
  useFrame(() => {
    if (!zoomTarget || hasTriggered.current) return;
    hasTriggered.current = true;
    isAnimating.current = true;

    gsap.to(camera.position, {
      x: zoomTarget.x,
      y: zoomTarget.y + 0.5,
      z: zoomTarget.z + 0.8,
      duration: 2,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(zoomTarget),
      onComplete: () => onZoomComplete?.(),
    });
  });

  return null;
}
