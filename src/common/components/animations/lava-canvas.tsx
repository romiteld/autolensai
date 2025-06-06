'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { Mesh, PlaneGeometry, MeshStandardMaterial } from 'three';
import { sampleNoise } from '@/common/utils/perlin-noise';

/**
 * MeshAnim component that creates a procedural deforming mesh surface
 * This creates a true 3D deforming mesh surface using displacement, not particles
 */
function MeshAnim() {
  const meshRef = useRef<Mesh>(null);
  const timeRef = useRef(0);
  
  // Create detailed geometry for smooth deformation - true 3D mesh surface
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(20, 20, 64, 64);
    geo.rotateX(-Math.PI / 2); // Make it horizontal like lava surface
    return geo;
  }, []);

  // Z displacement function as specified
  const zOfFXYT = (x: number, y: number, t: number) => 
    sampleNoise(x * 0.05, y * 0.05, t * 0.05) * 5;

  // Color function for automotive lava effect  
  const colorOfFXYZT = (x: number, y: number, z: number, t: number) => {
    const r = Math.max(0, Math.min(1, z / 5 + 0.5 + Math.random() * 0.1));
    const g = Math.max(0, Math.min(1, z / 5 - 0.2 + Math.random() * 0.1));  
    const b = Math.max(0, Math.min(1, Math.sqrt(x * x + y * y) / 75 + Math.random() * 0.1));
    return { r, g, b };
  };

  // Animate the mesh deformation
  useFrame((state) => {
    if (!meshRef.current) return;
    
    timeRef.current = state.clock.elapsedTime;
    const mesh = meshRef.current;
    const geo = mesh.geometry as PlaneGeometry;
    
    // Get position attribute for vertex manipulation
    const positionAttribute = geo.attributes.position;
    const positions = positionAttribute.array as Float32Array;
    
    // Deform each vertex based on noise function - true procedural mesh deformation
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const originalZ = positions[i + 2];
      
      // Apply displacement using the specified function
      const displacement = zOfFXYT(x, y, timeRef.current);
      positions[i + 2] = displacement; // Set Z coordinate for deformation
    }
    
    // Mark the attribute as needing update
    positionAttribute.needsUpdate = true;
    
    // Recompute normals for proper lighting
    geo.computeVertexNormals();
  });

  // Create material with automotive lava colors
  const material = useMemo(() => {
    return new MeshStandardMaterial({
      color: 0xff4500, // Base automotive orange-red
      emissive: 0x220000, // Subtle glow
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.6,
      transparent: true,
      opacity: 0.8
    });
  }, []);

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      material={material}
      position={[0, -3, 0]}
      castShadow
      receiveShadow
    />
  );
}

/**
 * Main Anim component that renders the procedural mesh as specified
 */
export function Anim() {
  return <MeshAnim />;
}

/**
 * AnimationCanvas component that returns Canvas from @react-three/fiber
 * Camera: { position: [0, 2, 10], fov: 75 }
 * Includes ambientLight component
 * Renders the Anim component (procedural mesh)
 */
export function AnimationCanvas() {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        backgroundColor: 'black',
        pointerEvents: 'none'
      }}
    >
      <Canvas
        camera={{ position: [0, 2, 10], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <Anim />
      </Canvas>
    </div>
  );
}

export default AnimationCanvas;