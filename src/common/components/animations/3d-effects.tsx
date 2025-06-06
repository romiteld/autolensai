'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, Text3D, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useRef, Suspense, useState } from 'react';
import { Mesh, Group } from 'three';

// Enhanced 3D Vehicle Model Component with Realistic Details
const VehicleModel = ({ position = [0, 0, 0], color = '#0ea5e9', variant = 'sedan' }: {
  position?: [number, number, number];
  color?: string;
  variant?: 'sedan' | 'suv' | 'sports';
}) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    }
  });

  // Variant-specific dimensions
  const dimensions = {
    sedan: { body: [2.2, 0.5, 1], roof: [1.6, 0.4, 0.8], height: 0 },
    suv: { body: [2.0, 0.7, 1.1], roof: [1.8, 0.5, 0.9], height: 0.1 },
    sports: { body: [2.4, 0.4, 1], roof: [1.4, 0.3, 0.7], height: -0.05 }
  };

  const config = dimensions[variant];

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
      <group position={[position[0], position[1] + config.height, position[2]]}>
        {/* Car Body - Main Hull */}
        <mesh
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={hovered ? 1.05 : 1}
          castShadow
          receiveShadow
        >
          <boxGeometry args={config.body} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.9} 
            roughness={0.1} 
            envMapIntensity={1.5}
          />
        </mesh>
        
        {/* Car Roof/Cabin */}
        <mesh position={[0, config.body[1] * 0.7, 0]} scale={hovered ? 1.05 : 1} castShadow>
          <boxGeometry args={config.roof} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.9} 
            roughness={0.1}
            envMapIntensity={1.5}
          />
        </mesh>
        
        {/* Front and Rear Bumpers */}
        <mesh position={[config.body[0] * 0.6, -config.body[1] * 0.3, 0]} scale={hovered ? 1.05 : 1}>
          <boxGeometry args={[0.2, 0.2, config.body[2] * 0.8]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-config.body[0] * 0.6, -config.body[1] * 0.3, 0]} scale={hovered ? 1.05 : 1}>
          <boxGeometry args={[0.2, 0.2, config.body[2] * 0.8]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
        </mesh>
        
        {/* Wheels with Enhanced Detail */}
        {[-0.8, 0.8].map((x, i) => (
          <group key={i}>
            {/* Front and Rear Wheels */}
            {[0.5, -0.5].map((z, j) => (
              <group key={j}>
                {/* Tire */}
                <mesh position={[x, -config.body[1] * 0.8, z]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
                </mesh>
                {/* Rim */}
                <mesh position={[x, -config.body[1] * 0.8, z]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
                  <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Brake Disc */}
                <mesh position={[x, -config.body[1] * 0.8, z]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
                  <meshStandardMaterial color="#8a8a8a" metalness={0.8} roughness={0.2} />
                </mesh>
              </group>
            ))}
          </group>
        ))}
        
        {/* Headlights */}
        <mesh position={[config.body[0] * 0.48, 0, config.body[2] * 0.35]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[config.body[0] * 0.48, 0, -config.body[2] * 0.35]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
        
        {/* Taillights */}
        <mesh position={[-config.body[0] * 0.48, 0, config.body[2] * 0.35]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[-config.body[0] * 0.48, 0, -config.body[2] * 0.35]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.2} />
        </mesh>
        
        {/* Windows - Transparent Glass Effect */}
        <mesh position={[0, config.body[1] * 0.7, 0]} scale={[0.95, 0.95, 0.95]}>
          <boxGeometry args={[config.roof[0] * 0.9, config.roof[1] * 0.9, config.roof[2] * 0.9]} />
          <meshStandardMaterial 
            color="#87CEEB" 
            transparent 
            opacity={0.3} 
            metalness={0.1} 
            roughness={0.1}
          />
        </mesh>
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
        <meshStandardMaterial color="#0ea5e9" metalness={0.8} roughness={0.2} />
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
      <pointsMaterial size={0.05} color="#0ea5e9" transparent opacity={0.6} />
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
      <Canvas camera={{ position: [0, 2, 6], fov: 75 }} shadows>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <spotLight 
            position={[10, 15, 10]} 
            angle={0.3} 
            penumbra={1} 
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.3} />
          <directionalLight position={[0, 10, 5]} intensity={0.5} />
          
          {/* Showcase Different Vehicle Types */}
          <VehicleModel position={[0, 0, 0]} color="#0ea5e9" variant="sedan" />
          <VehicleModel position={[4, 0, -1]} color="#ef4444" variant="sports" />
          <VehicleModel position={[-4, 0, -1]} color="#10b981" variant="suv" />
          
          <ParticleSystem count={80} />
          
          <Environment preset="city" />
          <ContactShadows 
            position={[0, -1.5, 0]} 
            opacity={0.6} 
            scale={15} 
            blur={2.5} 
            far={6} 
            resolution={512}
          />
          
          <OrbitControls 
            enablePan={false} 
            enableZoom={true}
            minDistance={4}
            maxDistance={12}
            maxPolarAngle={Math.PI / 2.2} 
            autoRotate 
            autoRotateSpeed={0.8}
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
                  color={Math.random() > 0.5 ? "#0ea5e9" : "#64748b"}
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
  className,
  variant = 'sedan' 
}: { 
  title: string; 
  description: string; 
  price: string; 
  className?: string;
  variant?: 'sedan' | 'suv' | 'sports';
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine car color and variant based on title
  const getCarProps = (title: string) => {
    if (title.toLowerCase().includes('tesla')) return { color: '#ef4444', variant: 'sedan' as const };
    if (title.toLowerCase().includes('bmw')) return { color: '#0ea5e9', variant: 'sports' as const };
    if (title.toLowerCase().includes('audi')) return { color: '#10b981', variant: 'suv' as const };
    return { color: '#6366f1', variant: 'sedan' as const };
  };

  const carProps = getCarProps(title);

  return (
    <motion.div
      className={`relative group cursor-pointer ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-64 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-black border border-white/10">
        <Canvas camera={{ position: [0, 1, 4] }} shadows>
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <spotLight 
              position={[5, 8, 5]} 
              angle={0.4} 
              penumbra={1} 
              intensity={1.2}
              castShadow
            />
            <pointLight position={[-3, 3, 3]} intensity={0.3} color="#ffffff" />
            
            <VehicleModel 
              position={[0, 0, 0]} 
              color={isHovered ? "#fbbf24" : carProps.color} 
              variant={carProps.variant}
            />
            
            <Environment preset="studio" />
            <ContactShadows 
              position={[0, -1.2, 0]} 
              opacity={0.5} 
              scale={6} 
              blur={2.5}
              far={3}
            />
          </Suspense>
        </Canvas>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent rounded-xl" />
      
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <motion.h3 
          className="font-bold text-lg mb-1"
          animate={{ color: isHovered ? "#fbbf24" : "#ffffff" }}
        >
          {title}
        </motion.h3>
        <p className="text-sm text-gray-300 mb-2">{description}</p>
        <motion.p 
          className="text-xl font-bold"
          animate={{ color: isHovered ? "#fbbf24" : "#3b82f6" }}
        >
          {price}
        </motion.p>
      </div>
      
      {/* Interactive Hover Indicator */}
      <motion.div
        className="absolute top-4 right-4 w-2 h-2 rounded-full bg-green-400"
        animate={{ 
          scale: isHovered ? [1, 1.5, 1] : 1,
          opacity: isHovered ? [0.5, 1, 0.5] : 0.6
        }}
        transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0 }}
      />
    </motion.div>
  );
};

export default { Vehicle3DShowcase, HeroBackground3D, InteractiveCarCard };