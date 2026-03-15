"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float sideRibbon(vec2 sideUv) {
    float edge = sideUv.x;
    float depth = pow(1.0 - clamp(edge, 0.0, 1.0), 1.45);

    float waveA = sin(sideUv.y * 3.4 - uTime * 0.72 + edge * 7.0) * (0.48 - edge * 0.28);
    float waveB = sin(sideUv.y * 6.2 + uTime * 0.43 + edge * 10.0) * (0.22 - edge * 0.12);
    float waveC = cos(sideUv.y * 2.1 - uTime * 0.31 + edge * 4.4) * (0.62 - edge * 0.38);

    float bandA = smoothstep(0.28, 0.02, abs(sideUv.y + waveA));
    float bandB = smoothstep(0.22, 0.01, abs(sideUv.y - 0.45 + waveB));
    float bandC = smoothstep(0.22, 0.01, abs(sideUv.y + 0.62 + waveC));
    float bandD = smoothstep(0.25, 0.015, abs(sideUv.y - 0.9 + waveA * 0.65));

    return max(max(bandA, bandB), max(bandC, bandD)) * depth;
  }

  vec3 palette(float signal, float glow) {
    vec3 ember = vec3(0.21, 0.08, 0.02);
    vec3 copper = vec3(0.66, 0.29, 0.08);
    vec3 gold = vec3(0.98, 0.79, 0.34);
    vec3 sand = vec3(0.93, 0.83, 0.63);

    vec3 ramp = mix(ember, copper, smoothstep(0.08, 0.46, signal));
    ramp = mix(ramp, gold, smoothstep(0.42, 0.82, signal));
    ramp = mix(ramp, sand, smoothstep(0.82, 1.0, glow));
    return ramp;
  }

  void main() {
    vec2 cells = vec2(max(uResolution.x / 7.0, 120.0), max(uResolution.y / 7.0, 90.0));
    vec2 gridUv = (floor(vUv * cells) + 0.5) / cells;
    vec2 local = vec2(gridUv.x, (gridUv.y - 0.5) * 2.0);

    vec2 leftUv = vec2(gridUv.x * 2.0, local.y);
    vec2 rightUv = vec2((1.0 - gridUv.x) * 2.0, local.y);

    float left = sideRibbon(leftUv);
    float right = sideRibbon(rightUv);
    float signal = max(left, right);

    float edgeFade = smoothstep(0.22, 0.5, abs(gridUv.x - 0.5));
    float verticalFade = smoothstep(1.15, 0.18, abs(local.y));
    float centralVoid = smoothstep(0.18, 0.34, abs(gridUv.x - 0.5));
    float noise = hash(floor(vUv * cells) + floor(uTime * 8.0));

    float glow = clamp(signal * edgeFade * verticalFade * centralVoid, 0.0, 1.0);
    glow *= 0.92 + noise * 0.18;

    vec3 color = palette(signal, glow) * glow;

    vec2 cell = fract(vUv * cells);
    float gridLine = max(step(0.93, cell.x), step(0.93, cell.y));
    color *= 1.0 - gridLine * 0.72;

    float vignette = 1.0 - smoothstep(0.78, 1.18, length((vUv - 0.5) * vec2(1.2, 1.0)));
    color *= 0.75 + vignette * 0.25;

    gl_FragColor = vec4(color, clamp(glow * 0.96, 0.0, 1.0));
  }
`;

function HeroField() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock, size }) => {
    const material = materialRef.current;

    if (!material) {
      return;
    }

    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        fragmentShader={fragmentShader}
        transparent
        uniforms={{
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(1, 1) },
        }}
        vertexShader={vertexShader}
      />
    </mesh>
  );
}

export function RevenantHeroCanvas() {
  return (
    <div className="absolute inset-0">
      <Canvas
        className="h-full w-full"
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        orthographic
      >
        <HeroField />
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,15,15,0)_0%,rgba(15,15,15,0)_28%,rgba(15,15,15,0.54)_62%,rgba(15,15,15,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,15,15,0.14)_0%,rgba(15,15,15,0)_22%,rgba(15,15,15,0)_78%,rgba(15,15,15,0.14)_100%)]" />
    </div>
  );
}
