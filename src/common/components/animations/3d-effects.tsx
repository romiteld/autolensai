'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, Text3D, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useRef, Suspense, useState } from 'react';
import { Mesh, Group } from 'three';

// 3D Vehicle Model Component
const VehicleModel = ({ position = [0, 0, 0], color = '#3b82f6' }: {
  position?: [number, number, number];
  color?: string;
}) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        {/* Car Body */}
        <mesh
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={hovered ? 1.1 : 1}
        >
          <boxGeometry args={[2, 0.5, 1]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Car Roof */}
        <mesh position={[0, 0.5, 0]} scale={hovered ? 1.1 : 1}>
          <boxGeometry args={[1.5, 0.4, 0.8]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Wheels */}
        {[-0.7, 0.7].map((x, i) => (
          <group key={i}>
            <mesh position={[x, -0.3, 0.4]}>
              <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[x, -0.3, -0.4]}>
              <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </group>
        ))}
      </group>
    </Float>
  );
};

// Floating 3D Logo
const FloatingLogo = () => {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <Text3D
        font="/fonts/helvetiker_regular.typeface.json"
        size={0.5}
        height={0.1}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
      >
        AutoLens
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </Text3D>
    </group>
  );
};

// Particle System
const ParticleSystem = ({ count = 100 }: { count?: number }) => {
  const points = useRef<any>(null);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.x = state.clock.elapsedTime * 0.05;
      points.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const particles = new Array(count).fill(null).map(() => ({
    position: [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
    ],
  }));

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(particles.flatMap(p => p.position))}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#3b82f6" transparent opacity={0.6} />
    </points>
  );
};

export const Vehicle3DShowcase = ({ className }: { className?: string }) => {
  return (
    <motion.div
      className={`h-96 w-full ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          
          <VehicleModel position={[0, 0, 0]} color="#3b82f6" />
          <VehicleModel position={[3, 0, -1]} color="#8b5cf6" />
          <VehicleModel position={[-3, 0, -1]} color="#06b6d4" />
          
          <ParticleSystem count={150} />
          
          <Environment preset="sunset" />
          <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2} far={4} />
          
          <OrbitControls 
            enablePan={false} 
            enableZoom={false} 
            maxPolarAngle={Math.PI / 2} 
            autoRotate 
            autoRotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </motion.div>
  );
};

export const HeroBackground3D = ({ className }: { className?: string }) => {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          
          {/* Floating geometric shapes */}
          {Array.from({ length: 20 }, (_, i) => (
            <Float
              key={i}
              speed={1 + Math.random()}
              rotationIntensity={0.5}
              floatIntensity={0.5}
            >
              <Sphere
                position={[
                  (Math.random() - 0.5) * 20,
                  (Math.random() - 0.5) * 20,
                  (Math.random() - 0.5) * 10,
                ]}
                scale={0.1 + Math.random() * 0.3}
              >
                <meshStandardMaterial
                  color={Math.random() > 0.5 ? "#3b82f6" : "#8b5cf6"}
                  transparent
                  opacity={0.6}
                  metalness={0.8}
                  roughness={0.2}
                />
              </Sphere>
            </Float>
          ))}
          
          <ParticleSystem count={200} />
          
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export const InteractiveCarCard = ({ 
  title, 
  description, 
  price, 
  className 
}: { 
  title: string; 
  description: string; 
  price: string; 
  className?: string; 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative group cursor-pointer ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-64 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black">
        <Canvas camera={{ position: [0, 0, 3] }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} />
            
            <VehicleModel 
              position={[0, 0, 0]} 
              color={isHovered ? "#8b5cf6" : "#3b82f6"} 
            />
            
            <Environment preset="city" />
            <ContactShadows position={[0, -1, 0]} opacity={0.3} scale={5} blur={2} />
          </Suspense>
        </Canvas>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-xl" />
      
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-sm text-gray-300 mb-2">{description}</p>
        <p className="text-xl font-bold text-blue-400">{price}</p>
      </div>
    </motion.div>
  );
};

export default { Vehicle3DShowcase, HeroBackground3D, InteractiveCarCard };