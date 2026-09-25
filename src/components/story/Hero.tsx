"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { dishImage } from "@/lib/dishImage";

type Props = {
  item: string;
  model?: string;
  /** Largest dimension in world units. */
  size?: number;
  spin?: number;
  float?: boolean;
};

function Model({ url, size }: { url: string; size: number }) {
  const { scene } = useGLTF(url, false, true);
  const obj = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const dim = box.getSize(new THREE.Vector3());
    const s = size / Math.max(dim.x, dim.y, dim.z);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    clone.scale.setScalar(s);
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 1.2;
      }
    });
    return clone;
  }, [scene, size]);
  return <primitive object={obj} />;
}

function Cutout({ item, size }: { item: string; size: number }) {
  const tex = useTexture(dishImage(item));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return (
    <Billboard lockX lockZ position={[0, size * 0.42, 0]}>
      <mesh>
        <planeGeometry args={[size * 1.15, size * 1.15]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} alphaTest={0.02} depthWrite={false} />
      </mesh>
    </Billboard>
  );
}

export default function Hero({ item, model, size = 2.4, spin = 0.18, float = true }: Props) {
  const g = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    if (!g.current || !g.current.parent?.visible) return;
    if (model) g.current.rotation.y += dt * spin;
    if (float) g.current.position.y = 0.12 + Math.sin(state.clock.elapsedTime * 1.1) * 0.05;
  });
  return (
    <group ref={g}>
      {model ? <Model url={model} size={size} /> : <Cutout item={item} size={size} />}
    </group>
  );
}
