'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { noise, automotiveLavaNoise } from '@/common/utils/noise';

interface MeshAnimProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  grid?: {
    width: number;
    height: number;
    sep: number;
  };
  zOfFXYT?: (x: number, y: number, t: number) => number;
  colorOfFXYZT?: (x: number, y: number, z: number, t: number) => { r: number; g: number; b: number };
  anim?: {
    init: number;
    update: (t: number) => number;
  };
}

export const MeshAnim = ({
  position = [0, 0, 0],
  rotation = [-Math.PI / 2, 0, 0],
  grid = { width: 100, height: 100, sep: 0.2 },
  zOfFXYT = (x: number, y: number, t: number) => {
    // Use the sophisticated automotive lava noise function
    const primaryDisplacement = automotiveLavaNoise(noise, x, y, t, {
      flowSpeed: 0.3,
      turbulence: 0.8,
      smoothness: 0.6
    }) * 4;
    
    // Add secondary layer with different parameters for complexity
    const secondaryDisplacement = automotiveLavaNoise(noise, x * 0.5, y * 0.5, t * 1.5, {
      flowSpeed: 0.15,
      turbulence: 0.4,
      smoothness: 1.2
    }) * 2;
    
    // Add tertiary layer for fine details
    const detailNoise = noise.perlin3(x * 0.3, y * 0.3, t * 0.8) * 1;
    
    // Combine all layers
    return primaryDisplacement + secondaryDisplacement + detailNoise;
  },
  colorOfFXYZT = (x: number, y: number, z: number, t: number) => {
    // Dynamic color based on height and automotive lava noise
    const heightNorm = Math.max(0, Math.min(1, (z + 4) / 8)); // Normalize height to 0-1
    
    // Use automotive lava noise for color variation
    const colorNoise = automotiveLavaNoise(noise, x * 0.2, y * 0.2, t * 0.5, {
      flowSpeed: 0.2,
      turbulence: 0.6,
      smoothness: 0.8
    });
    
    const normalizedColorNoise = (colorNoise + 1) / 2; // Normalize to 0-1
    
    // Automotive-inspired lava color palette
    const baseRed = 0.9 + heightNorm * 0.1;
    const baseGreen = Math.max(0, heightNorm * 0.5 - 0.15 + normalizedColorNoise * 0.2);
    const baseBlue = Math.max(0, (heightNorm - 0.6) * 0.3 + normalizedColorNoise * 0.1);
    
    // Add temperature-based color shifts
    const temperature = heightNorm + normalizedColorNoise * 0.3;
    const r = Math.min(1, baseRed + temperature * 0.1);
    const g = Math.min(1, baseGreen + (1 - temperature) * 0.1);
    const b = Math.min(1, baseBlue + Math.sin(t * 0.5) * 0.05);
    
    return { r, g, b };
  },
  anim = {
    init: 0,
    update: (t: number) => t + 0.002
  }
}: MeshAnimProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(anim.init);
  
  // Create geometry with vertices, colors, normals, and indices
  const { geometry, positionAttribute, colorAttribute } = useMemo(() => {
    const { width, height, sep } = grid;
    const vertexCount = width * height;
    const indexCount = (width - 1) * (height - 1) * 6; // 2 triangles per quad
    
    // Create buffer arrays
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const indices = new Uint32Array(indexCount);
    
    // Generate vertices
    let vertexIndex = 0;
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const x = (i - width / 2) * sep;
        const y = (j - height / 2) * sep;
        const z = zOfFXYT(x, y, 0);
        
        // Position
        positions[vertexIndex * 3] = x;
        positions[vertexIndex * 3 + 1] = y;
        positions[vertexIndex * 3 + 2] = z;
        
        // Color
        const color = colorOfFXYZT(x, y, z, 0);
        colors[vertexIndex * 3] = color.r;
        colors[vertexIndex * 3 + 1] = color.g;
        colors[vertexIndex * 3 + 2] = color.b;
        
        // Normal (will be calculated properly later)
        normals[vertexIndex * 3] = 0;
        normals[vertexIndex * 3 + 1] = 0;
        normals[vertexIndex * 3 + 2] = 1;
        
        vertexIndex++;
      }
    }
    
    // Generate indices for triangles
    let indexIndex = 0;
    for (let j = 0; j < height - 1; j++) {
      for (let i = 0; i < width - 1; i++) {
        const a = i + j * width;
        const b = i + 1 + j * width;
        const c = i + (j + 1) * width;
        const d = i + 1 + (j + 1) * width;
        
        // First triangle
        indices[indexIndex++] = a;
        indices[indexIndex++] = b;
        indices[indexIndex++] = c;
        
        // Second triangle
        indices[indexIndex++] = b;
        indices[indexIndex++] = d;
        indices[indexIndex++] = c;
      }
    }
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.BufferAttribute(positions, 3);
    const colorAttribute = new THREE.BufferAttribute(colors, 3);
    const normalAttribute = new THREE.BufferAttribute(normals, 3);
    const indexAttribute = new THREE.BufferAttribute(indices, 1);
    
    geometry.setAttribute('position', positionAttribute);
    geometry.setAttribute('color', colorAttribute);
    geometry.setAttribute('normal', normalAttribute);
    geometry.setIndex(indexAttribute);
    
    return { geometry, positionAttribute, colorAttribute };
  }, [grid, zOfFXYT, colorOfFXYZT]);
  
  // Animation loop
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Update time
    tRef.current = anim.update(tRef.current);
    const t = tRef.current;
    
    const { width, height, sep } = grid;
    const positions = positionAttribute.array as Float32Array;
    const colors = colorAttribute.array as Float32Array;
    
    // Update all vertices
    let vertexIndex = 0;
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const x = (i - width / 2) * sep;
        const y = (j - height / 2) * sep;
        const z = zOfFXYT(x, y, t);
        
        // Update position (only z changes)
        positions[vertexIndex * 3 + 2] = z;
        
        // Update color
        const color = colorOfFXYZT(x, y, z, t);
        colors[vertexIndex * 3] = color.r;
        colors[vertexIndex * 3 + 1] = color.g;
        colors[vertexIndex * 3 + 2] = color.b;
        
        vertexIndex++;
      }
    }
    
    // Mark attributes as needing update
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    
    // Recompute normals for proper lighting
    geometry.computeVertexNormals();
  });
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      geometry={geometry}
    >
      <meshPhongMaterial
        vertexColors
        side={THREE.DoubleSide}
        transparent
        opacity={0.8}
        shininess={30}
        specular="#ffffff"
      />
    </mesh>
  );
};

// 3D Background with procedural lava mesh for hero section
export const ProceduralLavaBackground = ({ 
  className,
  intensity = 'medium',
  showMultipleLayers = true 
}: { 
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  showMultipleLayers?: boolean;
}) => {
  // Adjust grid complexity based on intensity
  const getGridConfig = (intensity: string) => {
    switch (intensity) {
      case 'low':
        return { width: 50, height: 50, sep: 0.3 };
      case 'high':
        return { width: 150, height: 150, sep: 0.15 };
      default: // medium
        return { width: 100, height: 100, sep: 0.2 };
    }
  };

  const mainGrid = getGridConfig(intensity);
  const secondaryGrid = { width: Math.floor(mainGrid.width * 0.4), height: Math.floor(mainGrid.height * 0.4), sep: mainGrid.sep * 0.8 };
  const tertiaryGrid = { width: Math.floor(mainGrid.width * 0.3), height: Math.floor(mainGrid.height * 0.3), sep: mainGrid.sep * 0.9 };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <Canvas 
        camera={{ position: [0, 8, 0], fov: 60 }}
        style={{ background: 'transparent' }}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          {/* Lighting setup for automotive lava effect */}
          <ambientLight intensity={0.25} color="#ff4500" />
          <pointLight position={[10, 10, 10]} intensity={0.6} color="#ff6600" />
          <pointLight position={[-10, 10, -10]} intensity={0.4} color="#ff3300" />
          <directionalLight position={[0, 15, 0]} intensity={0.3} color="#ffffff" />
          
          {/* Main procedural lava mesh */}
          <MeshAnim
            position={[0, -3, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            grid={mainGrid}
          />
          
          {/* Additional lava layers for depth - only render if performance allows */}
          {showMultipleLayers && (
            <>
              <MeshAnim
                position={[12, -2.5, 4]}
                rotation={[-Math.PI / 2, 0, Math.PI / 6]}
                grid={secondaryGrid}
                anim={{ init: 1, update: (t) => t + 0.003 }}
              />
              
              <MeshAnim
                position={[-10, -2.8, -6]}
                rotation={[-Math.PI / 2, 0, -Math.PI / 8]}
                grid={tertiaryGrid}
                anim={{ init: 2, update: (t) => t + 0.0015 }}
              />
            </>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

// Export both components
export const ProceduralLava = ProceduralLavaBackground;

export default ProceduralLava;