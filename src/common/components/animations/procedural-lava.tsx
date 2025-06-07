'use client';

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vPosition;
  varying float vDistortion;
  uniform float time;
  uniform float surgeTime;
  
  // Improved noise function
  float noise(vec2 p) {
    return sin(p.x * 15.0 + time) * sin(p.y * 15.0 + time) * 0.5 +
           sin(p.x * 7.0 - time * 0.5) * sin(p.y * 7.0 - time * 0.5) * 0.25 +
           sin(p.x * 3.0 + time * 0.3) * sin(p.y * 3.0 + time * 0.3) * 0.125;
  }
  
  // 3D noise for more complex distortion
  float noise3D(vec3 p) {
    return sin(p.x * 4.0) * sin(p.y * 4.0) * sin(p.z * 4.0);
  }
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    
    // Create layered waves with increasing complexity
    float elevation = 0.0;
    
    // Layer 1: Large, slow oceanic waves
    elevation += sin(pos.x * 0.15 + time * 0.25) * cos(pos.y * 0.15 + time * 0.2) * 4.0;
    elevation += cos(pos.x * 0.1 - time * 0.15) * sin(pos.y * 0.1 + time * 0.1) * 3.0;
    
    // Layer 2: Medium frequency waves
    elevation += sin(pos.x * 0.3 + time * 0.4) * cos(pos.y * 0.3 - time * 0.35) * 2.0;
    elevation += sin(pos.x * 0.35 - time * 0.45) * sin(pos.y * 0.35 + time * 0.4) * 1.5;
    
    // Layer 3: High frequency ripples
    elevation += sin(pos.x * 0.7 - time * 0.7) * cos(pos.y * 0.7 + time * 0.65) * 0.8;
    elevation += cos(pos.x * 1.0 + time) * sin(pos.y * 1.0 - time * 0.9) * 0.5;
    
    // Layer 4: Turbulent noise
    elevation += noise(pos.xy * 0.1) * 2.5;
    elevation += noise(pos.xy * 0.2 + 100.0) * 1.0;
    
    // Radial surge waves
    float distanceFromCenter = length(pos.xy);
    float surge1 = sin(distanceFromCenter * 0.3 - surgeTime * 2.0) * 2.5;
    float surge2 = cos(distanceFromCenter * 0.2 - surgeTime * 3.0 + 3.14) * 1.5;
    elevation += (surge1 + surge2) * (sin(surgeTime) * 0.3 + 0.7);
    
    // Diagonal wave patterns
    float diagonal1 = sin((pos.x + pos.y) * 0.2 + time * 0.5) * 1.5;
    float diagonal2 = cos((pos.x - pos.y) * 0.25 - time * 0.4) * 1.2;
    elevation += diagonal1 + diagonal2;
    
    // Random energy spikes
    float spike = sin(pos.x * 2.0 + time * 8.0) * sin(pos.y * 2.0 - time * 6.0);
    spike = max(0.0, spike - 0.5) * 4.0;
    elevation += spike;
    
    // 3D distortion for more organic movement
    float distortion = noise3D(vec3(pos.xy * 0.1, time * 0.2));
    elevation += distortion * 1.5;
    vDistortion = distortion;
    
    pos.z += elevation;
    vElevation = elevation;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform vec3 colorC;
  uniform float time;
  uniform float surgeTime;
  
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vPosition;
  varying float vDistortion;
  
  // Energy bolt function with glow
  float energyBolt(vec2 p, float speed, float offset, float width) {
    float wave = sin((p.x + p.y) * 3.0 + time * speed + offset);
    float bolt = 1.0 / (1.0 + pow(abs(wave), width));
    return bolt * bolt;
  }
  
  // Plasma effect
  vec3 plasma(vec2 p, float t) {
    float px = sin(p.x * 8.0 + t * 2.0) * cos(p.y * 8.0 - t * 1.5);
    float py = cos(p.x * 6.0 - t * 1.8) * sin(p.y * 6.0 + t * 2.2);
    float pz = sin((p.x + p.y) * 4.0 + t * 3.0);
    
    return vec3(
      0.5 + 0.5 * sin(px * 3.14),
      0.5 + 0.5 * cos(py * 3.14 + 2.0),
      0.5 + 0.5 * sin(pz * 3.14 + 4.0)
    );
  }
  
  void main() {
    // Base color from elevation
    float normalizedElevation = (vElevation + 8.0) / 16.0;
    
    // Enhanced gradient with more color stops
    vec3 color;
    if (normalizedElevation < 0.25) {
      color = mix(vec3(1.0, 0.2, 0.0), colorB, normalizedElevation * 4.0); // Deep red to orange
    } else if (normalizedElevation < 0.5) {
      color = mix(colorB, colorA, (normalizedElevation - 0.25) * 4.0); // Orange to pink
    } else if (normalizedElevation < 0.75) {
      color = mix(colorA, colorC, (normalizedElevation - 0.5) * 4.0); // Pink to purple
    } else {
      color = mix(colorC, vec3(0.8, 0.4, 1.0), (normalizedElevation - 0.75) * 4.0); // Purple to light purple
    }
    
    // Add distortion-based color variation
    color = mix(color, vec3(1.0, 0.5, 0.8), abs(vDistortion) * 0.3);
    
    // Animated shimmer with multiple frequencies
    float shimmer1 = sin(vUv.x * 30.0 + time * 4.0) * sin(vUv.y * 30.0 - time * 3.0) * 0.1;
    float shimmer2 = cos(vUv.x * 15.0 - time * 2.0) * cos(vUv.y * 15.0 + time * 2.5) * 0.05;
    color *= (1.0 + shimmer1 + shimmer2);
    
    // Multiple energy bolts with different characteristics
    float bolt1 = energyBolt(vPosition.xy, 5.0, 0.0, 6.0);
    float bolt2 = energyBolt(vPosition.xy, -4.0, 3.14, 8.0);
    float bolt3 = energyBolt(vPosition.yx, 6.0, 1.57, 7.0);
    float bolt4 = energyBolt(vPosition.xy * 0.5, 3.0, 0.78, 10.0);
    
    // Plasma effects
    vec3 plasmaColor = plasma(vPosition.xy * 0.05, time * 0.3);
    
    // Energy surge patterns
    float surge = sin(surgeTime * 4.0) * 0.5 + 0.5;
    float radialSurge = sin(length(vPosition.xy) * 0.3 - surgeTime * 5.0);
    radialSurge = max(0.0, radialSurge) * surge;
    
    // Wave interference patterns
    float interference = sin(vPosition.x * 0.5 + surgeTime * 2.0) * 
                        sin(vPosition.y * 0.5 - surgeTime * 2.5);
    interference = pow(max(0.0, interference), 2.0);
    
    // Combine all energy effects
    vec3 energyColor = vec3(1.2, 0.8, 1.4);
    vec3 boltColor = vec3(1.0, 0.6, 1.2);
    
    // Apply energy bolts
    color += boltColor * bolt1 * 1.2;
    color += energyColor * bolt2 * 0.9;
    color += vec3(1.0, 0.3, 0.8) * bolt3 * 0.8;
    color += vec3(0.8, 0.4, 1.0) * bolt4 * 0.7;
    
    // Apply plasma and surges
    color = mix(color, color * plasmaColor, 0.2);
    color += energyColor * radialSurge * 0.4;
    color += vec3(1.0, 0.5, 0.9) * interference * 0.3;
    
    // Peak highlights with glow
    float peakGlow = smoothstep(3.0, 6.0, vElevation);
    color += vec3(0.5, 0.2, 0.6) * peakGlow;
    
    // Valley shadows
    float valleyShadow = smoothstep(-3.0, 0.0, vElevation);
    color *= (0.7 + 0.3 * valleyShadow);
    
    // Final brightness and saturation boost
    color = pow(color, vec3(0.85)); // Slight gamma correction
    color *= 1.3;
    
    // Add subtle noise for texture
    float noise = fract(sin(dot(vUv * 1000.0, vec2(12.9898, 78.233))) * 43758.5453);
    color += vec3(noise) * 0.02;
    
    gl_FragColor = vec4(color, 0.88);
  }
`;

interface AnimatedMeshProps {
  position?: [number, number, number];
  scale?: [number, number, number];
}

const AnimatedMesh = ({ position = [0, 0, 0], scale = [1, 1, 1] }: AnimatedMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const surgeTimeRef = useRef(0);
  
  useFrame((state) => {
    if (materialRef.current) {
      // Update main time
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime();
      
      // Update surge time with a different speed for more dynamic effects
      surgeTimeRef.current += 0.03;
      materialRef.current.uniforms.surgeTime.value = surgeTimeRef.current;
    }
  });
  
  return (
    <mesh ref={meshRef} position={position} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[45, 45, 220, 220]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          time: { value: 0 },
          surgeTime: { value: 0 },
          colorA: { value: new THREE.Color('#ff006e') }, // Pink
          colorB: { value: new THREE.Color('#ff8c00') }, // Orange  
          colorC: { value: new THREE.Color('#9400d3') }, // Purple
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.DoubleSide}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={true}
      />
    </mesh>
  );
};

export const ProceduralLavaBackground = ({ 
  className = '',
  intensity = 'medium',
  showMultipleLayers = false 
}: { 
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  showMultipleLayers?: boolean;
}) => {
  return (
    <div className={`absolute inset-0 ${className}`} style={{ pointerEvents: 'none' }}>
      <Canvas 
        camera={{ 
          position: [0, 20, 20], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent' 
        }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 20, 10]} intensity={1.0} color="#ffffff" />
          <pointLight position={[-15, 10, -15]} intensity={1.2} color="#ff00ff" />
          <pointLight position={[15, 10, 15]} intensity={1.2} color="#ff8c00" />
          <pointLight position={[0, 8, 0]} intensity={0.8} color="#ff006e" />
          <pointLight position={[-10, 5, 10]} intensity={0.6} color="#00ffff" />
          <pointLight position={[10, 5, -10]} intensity={0.6} color="#ffff00" />
          
          {/* Main animated mesh */}
          <AnimatedMesh position={[0, -5, 0]} scale={[2.2, 2.2, 1]} />
          
          {/* Optional secondary layer for more depth */}
          {showMultipleLayers && (
            <AnimatedMesh position={[8, -3.5, -3]} scale={[1.5, 1.5, 0.8]} />
          )}
          
          {/* Fog for depth */}
          <fog attach="fog" args={['#000000', 35, 100]} />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Export aliases for compatibility
export const ProceduralLava = ProceduralLavaBackground;
export const MeshAnim = AnimatedMesh;

export default ProceduralLavaBackground;