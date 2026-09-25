import * as THREE from "three";
import { CHAPTER_COUNT } from "@/lib/scroll";

/**
 * The world is laid out as a winding road of "stations", one per chapter.
 * The camera flies between them on cubic béziers that swoop up and through
 * a glowing portal ring placed at the midpoint of each segment.
 */
export const GAP = 38;

export const stationPos = (i: number) =>
  new THREE.Vector3(Math.sin(i * 1.35) * 9, 0, -i * GAP);

/** Where the camera rests at a station. */
export const camRest = (i: number, narrow: boolean) => {
  const s = stationPos(i);
  return narrow ? s.add(new THREE.Vector3(0, 1.9, 8.6)) : s.add(new THREE.Vector3(0.6, 1.5, 6.4));
};

/** What the camera looks at while resting. Offsets frame the dish beside the copy. */
export const lookRest = (i: number, narrow: boolean) => {
  const s = stationPos(i);
  return narrow ? s.add(new THREE.Vector3(0, -0.15, 0)) : s.add(new THREE.Vector3(-1.9, 0.75, 0));
};

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c1 = new THREE.Vector3();
const _c2 = new THREE.Vector3();

/** Cubic bezier point on segment i → i+1 at t (0..1). */
export function segmentPoint(i: number, t: number, narrow: boolean, out = new THREE.Vector3()) {
  _a.copy(camRest(i, narrow));
  _b.copy(camRest(Math.min(i + 1, CHAPTER_COUNT - 1), narrow));
  const lift = 3.2;
  _c1.copy(_a).add(new THREE.Vector3(0, lift, -GAP * 0.38));
  _c2.copy(_b).add(new THREE.Vector3(0, lift, GAP * 0.38));
  const u = 1 - t;
  out
    .copy(_a)
    .multiplyScalar(u * u * u)
    .addScaledVector(_c1, 3 * u * u * t)
    .addScaledVector(_c2, 3 * u * t * t)
    .addScaledVector(_b, t * t * t);
  return out;
}

/** Hold the camera still near each chapter, travel in between. */
export const dwell = (t: number) => {
  const x = THREE.MathUtils.clamp((t - 0.2) / 0.6, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10); // smootherstep
};
