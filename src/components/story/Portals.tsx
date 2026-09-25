"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { chapters } from "@/config/chapters";
import { scrollState, chapterFloat } from "@/lib/scroll";
import { useDevice } from "@/lib/device";
import { segmentPoint } from "./path";

/**
 * A plate-rim portal at the midpoint of every flight. The camera threads through it;
 * as it approaches, the ring flares and spins, and inner rings bloom in the next
 * chapter's colour.
 */
function Portal({ i, narrow }: { i: number; narrow: boolean }) {
  const g = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const color = chapters[i + 1].palette.key;
  const color2 = chapters[i + 1].palette.rim;

  const { pos, quat } = useMemo(() => {
    const p = segmentPoint(i, 0.5, narrow);
    const ahead = segmentPoint(i, 0.52, narrow);
    const m = new THREE.Matrix4().lookAt(p, ahead, new THREE.Vector3(0, 1, 0));
    return { pos: p, quat: new THREE.Quaternion().setFromRotationMatrix(m) };
  }, [i, narrow]);

  useFrame((_, dt) => {
    if (!g.current) return;
    const d = Math.abs(chapterFloat(scrollState.smooth) - (i + 0.5));
    g.current.visible = d < 0.7;
    if (!g.current.visible) return;
    const near = 1 - THREE.MathUtils.clamp(d / 0.35, 0, 1);
    g.current.rotation.z += dt * (0.3 + near * 2.5);
    g.current.scale.setScalar(1 + near * 0.25);
    if (inner.current) (inner.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + near * 0.75;
  });

  return (
    <group position={pos} quaternion={quat}>
      <group ref={g}>
        <mesh>
          <torusGeometry args={[3.2, 0.035, 12, 160]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh ref={inner} rotation-z={0.4}>
          <torusGeometry args={[2.85, 0.012, 8, 160, Math.PI * 1.6]} />
          <meshBasicMaterial color={color2} toneMapped={false} transparent />
        </mesh>
        <mesh rotation-z={2.2}>
          <torusGeometry args={[3.55, 0.008, 8, 160, Math.PI * 0.9]} />
          <meshBasicMaterial color={color2} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export default function Portals() {
  const narrow = useDevice((s) => s.isNarrow);
  return (
    <>
      {chapters.slice(0, -1).map((_, i) => (
        <Portal key={i} i={i} narrow={narrow} />
      ))}
    </>
  );
}
