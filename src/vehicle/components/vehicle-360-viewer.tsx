'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, PresentationControls, Stage } from '@react-three/drei';
import { TextureLoader } from 'three';
import { Suspense, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/common/components/ui';
import { RotateCcw, Maximize2, Play, Pause } from 'lucide-react';

interface Vehicle360ViewerProps {
  images: string[];
  className?: string;
}

// 3D Vehicle Component
function Vehicle3D({ images }: { images: string[] }) {
  const meshRef = useRef<any>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const texture = useLoader(TextureLoader, images[currentImageIndex]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[4, 2, 8]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export default function Vehicle360Viewer({ images, className }: Vehicle360ViewerProps) {
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [currentView, setCurrentView] = useState(0);
  const controlsRef = useRef<any>();

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const views = [
    { name: 'Front', position: [0, 0, 5] },
    { name: 'Side', position: [5, 0, 0] },
    { name: 'Rear', position: [0, 0, -5] },
    { name: 'Top', position: [0, 5, 2] },
  ];

  return (
    <div className={`relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden ${className}`}>
      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        <motion.div
          className="bg-black/50 backdrop-blur-md rounded-lg p-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-blue-400"
              onClick={resetView}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-blue-400"
              onClick={() => setIsAutoRotate(!isAutoRotate)}
            >
              {isAutoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>

        {/* View Presets */}
        <motion.div
          className="bg-black/50 backdrop-blur-md rounded-lg p-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex flex-col space-y-1">
            {views.map((view, index) => (
              <Button
                key={view.name}
                size="sm"
                variant={currentView === index ? "default" : "ghost"}
                className={`text-xs w-full justify-start ${
                  currentView === index 
                    ? 'bg-blue-600 text-white' 
                    : 'text-white hover:text-blue-400'
                }`}
                onClick={() => setCurrentView(index)}
              >
                {view.name}
              </Button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Image Navigation */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <motion.div
          className="bg-black/50 backdrop-blur-md rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex space-x-2 overflow-x-auto">
            {images.map((image, index) => (
              <motion.div
                key={index}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden cursor-pointer border-2 ${
                  index === 0 ? 'border-blue-500' : 'border-transparent'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={image}
                  alt={`View ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-[600px]">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <Environment preset="studio" />
            
            <PresentationControls
              enabled={true}
              global={false}
              snap={false}
              speed={1}
              zoom={1}
              rotation={[0, 0, 0]}
              polar={[-Math.PI / 4, Math.PI / 4]}
              azimuth={[-Math.PI / 2, Math.PI / 2]}
            >
              <Stage environment="city" intensity={0.5}>
                <Vehicle3D images={images} />
              </Stage>
            </PresentationControls>

            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={isAutoRotate}
              autoRotateSpeed={2}
              maxPolarAngle={Math.PI / 2}
              minDistance={3}
              maxDistance={10}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Fallback for loading */}
      <div className="absolute inset-0 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    </div>
  );
}