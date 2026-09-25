"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export type ParticleMode = "rain" | "rise" | "fall" | "float" | "steam";

const MODE_ID: Record<ParticleMode, number> = { rain: 0, rise: 1, fall: 2, float: 3, steam: 4 };

type Props = {
  mode: ParticleMode;
  count: number;
  color: string;
  size?: number;
  area?: [number, number, number];
  speed?: number;
  opacity?: number;
  additive?: boolean;
  position?: [number, number, number];
};

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uSpeed;
  uniform float uMode;
  uniform float uPixelRatio;
  uniform vec3 uArea;
  attribute vec4 aSeed;
  varying float vAlpha;
  varying float vMode;

  void main() {
    vec3 p = vec3((aSeed.x - 0.5) * uArea.x, 0.0, (aSeed.z - 0.5) * uArea.z);
    float spd = uSpeed * (0.55 + aSeed.w * 0.9);
    float h = 0.0;

    if (uMode < 0.5) {            // rain: fast, straight down
      h = 1.0 - fract(aSeed.y + uTime * spd * 0.9);
    } else if (uMode < 1.5) {     // rise: embers / sparks
      h = fract(aSeed.y + uTime * spd * 0.12);
      p.x += sin(uTime * 1.3 + aSeed.w * 40.0) * 0.35 * h;
      p.z += cos(uTime * 1.1 + aSeed.x * 40.0) * 0.25 * h;
    } else if (uMode < 2.5) {     // fall: petals / flour
      h = 1.0 - fract(aSeed.y + uTime * spd * 0.06);
      p.x += sin(uTime * 0.9 + aSeed.w * 30.0) * 0.8;
      p.z += cos(uTime * 0.7 + aSeed.z * 30.0) * 0.4;
    } else if (uMode < 3.5) {     // float: dust motes
      h = aSeed.y + sin(uTime * 0.25 * spd + aSeed.w * 20.0) * 0.06;
      p.x += sin(uTime * 0.2 + aSeed.z * 10.0) * 0.4;
    } else {                      // steam: slow, widening column
      h = fract(aSeed.y + uTime * spd * 0.1);
      p.xz *= 0.25 + h * 1.2;
      p.x += sin(uTime * 0.8 + h * 5.0 + aSeed.w * 6.0) * 0.25 * h;
    }

    p.y = h * uArea.y;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float grow = uMode > 3.5 ? (0.6 + h * 2.2) : 1.0;
    gl_PointSize = uSize * grow * uPixelRatio * (0.6 + aSeed.w * 0.8) * (10.0 / -mv.z);

    float edge = smoothstep(0.0, 0.12, h) * smoothstep(1.0, 0.7, h);
    if (uMode > 3.5) edge *= (1.0 - h);
    vAlpha = edge;
    vMode = uMode;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vMode;

  void main() {
    vec2 pc = gl_PointCoord - 0.5;
    float a;
    if (vMode < 0.5) {
      // thin vertical streak
      a = (1.0 - smoothstep(0.0, 0.05, abs(pc.x))) * (1.0 - smoothstep(0.2, 0.5, abs(pc.y)));
    } else if (vMode > 3.5) {
      a = smoothstep(0.5, 0.0, length(pc)) * 0.35;
    } else {
      float d = length(pc);
      a = smoothstep(0.5, 0.1, d) + smoothstep(0.18, 0.0, d) * 0.6;
    }
    a *= vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

export default function Particles({
  mode,
  count,
  color,
  size = 1,
  area = [12, 8, 8],
  speed = 1,
  opacity = 1,
  additive = true,
  position = [0, 0, 0],
}: Props) {
  const ref = useRef<THREE.Points>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    // positions are computed in the shader; a dummy attribute keeps three happy
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, area[1] / 2, 0), Math.max(...area));
    return g;
  }, [count, area]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms: {
          uTime: { value: Math.random() * 100 },
          uSize: { value: size },
          uSpeed: { value: speed },
          uMode: { value: MODE_ID[mode] },
          uPixelRatio: { value: dpr },
          uArea: { value: new THREE.Vector3(...area) },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, additive],
  );

  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts || !pts.parent?.visible) return;
    material.uniforms.uTime.value += Math.min(dt, 0.05);
    material.uniforms.uPixelRatio.value = dpr;
    material.uniforms.uSize.value = size;
    material.uniforms.uOpacity.value = opacity;
    (material.uniforms.uColor.value as THREE.Color).set(color);
  });

  return <points ref={ref} geometry={geometry} material={material} position={position} frustumCulled={false} />;
}
