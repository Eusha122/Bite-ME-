"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chapters } from "@/config/chapters";
import { scrollState, chapterFloat, CHAPTER_COUNT } from "@/lib/scroll";
import { useStory } from "@/lib/story";
import { useDevice } from "@/lib/device";
import { segmentPoint, lookRest, dwell, stationPos } from "./path";

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _la = new THREE.Vector3();
const _lb = new THREE.Vector3();
const _c = new THREE.Color();
const _c2 = new THREE.Color();

/**
 * Drives the camera, the scene atmosphere (background + fog), and the global light rig
 * from the single scroll value. A fixed light count keeps shaders from recompiling
 * as chapters change.
 */
export default function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const scene = useThree((s) => s.scene);
  const narrow = useDevice((s) => s.isNarrow);
  const setChapter = useStory((s) => s.setChapter);
  const lastChapter = useRef(-1);
  const parallax = useRef(new THREE.Vector2());

  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const cursor = useRef<THREE.PointLight>(null);

  const palettes = useMemo(
    () =>
      chapters.map((c) => ({
        bg: new THREE.Color(c.palette.bg),
        key: new THREE.Color(c.palette.key),
        rim: new THREE.Color(c.palette.rim),
      })),
    [],
  );

  useMemo(() => {
    scene.background = new THREE.Color(chapters[0].palette.bg);
    scene.fog = new THREE.Fog(chapters[0].palette.bg, 16, 58);
  }, [scene]);

  useFrame((_, dt) => {
    const f = chapterFloat(scrollState.smooth);
    const i = Math.min(Math.floor(f), CHAPTER_COUNT - 2);
    const t = THREE.MathUtils.clamp(f - i, 0, 1);
    const e = dwell(t);

    // position on the swooping bezier, look target eases between stations
    segmentPoint(i, e, narrow, _pos);
    _la.copy(lookRest(i, narrow));
    _lb.copy(lookRest(i + 1, narrow));
    _look.lerpVectors(_la, _lb, e);

    // gentle pointer parallax (desktop), plus micro "handheld" drift
    parallax.current.lerp(new THREE.Vector2(scrollState.pointer.x, scrollState.pointer.y), 1 - Math.exp(-dt * 3));
    const time = performance.now() / 1000;
    _pos.x += parallax.current.x * 0.45 + Math.sin(time * 0.5) * 0.04;
    _pos.y += parallax.current.y * 0.25 + Math.cos(time * 0.37) * 0.03;

    camera.position.copy(_pos);
    camera.lookAt(_look);

    // bank into the turn and widen FOV mid-flight for a sense of speed
    const travel = Math.sin(e * Math.PI);
    const dir = Math.sign(stationPos(i + 1).x - stationPos(i).x) || 1;
    camera.rotateZ(-dir * travel * 0.07);
    const baseFov = narrow ? 52 : 38;
    camera.fov = baseFov + travel * 10;
    camera.updateProjectionMatrix();

    // atmosphere + light colours blend between chapter palettes
    const a = palettes[i];
    const b = palettes[i + 1];
    _c.copy(a.bg).lerp(b.bg, e);
    (scene.background as THREE.Color).copy(_c);
    (scene.fog as THREE.Fog).color.copy(_c);

    const near = Math.round(f);
    const st = stationPos(Math.min(near, CHAPTER_COUNT - 1));
    if (key.current) {
      key.current.color.copy(_c2.copy(a.key).lerp(b.key, e));
      key.current.position.set(st.x - 3.5, 6.5, st.z + 4.5);
      key.current.target.position.set(st.x, 0.5, st.z);
      key.current.target.updateMatrixWorld();
    }
    if (rim.current) {
      rim.current.color.copy(_c2.copy(a.rim).lerp(b.rim, e));
      rim.current.position.set(st.x + 2.5, 2.8, st.z - 2.8);
    }
    if (hemi.current) {
      hemi.current.color.copy(_c2.copy(a.key).lerp(b.key, e)).multiplyScalar(0.5);
    }
    if (cursor.current) {
      cursor.current.position.set(st.x + scrollState.pointer.x * 3, 1.6 + scrollState.pointer.y * 1.5, st.z + 2.5);
    }

    const ch = Math.min(near, CHAPTER_COUNT - 1);
    if (ch !== lastChapter.current) {
      lastChapter.current = ch;
      setChapter(ch);
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#ffd8a8", "#0a0604", 0.55]} />
      <spotLight ref={key} intensity={140} angle={0.55} penumbra={0.8} distance={30} decay={2} />
      <pointLight ref={rim} intensity={40} distance={14} decay={2} />
      <pointLight ref={cursor} color="#ffc27a" intensity={8} distance={7} decay={2} />
    </>
  );
}
