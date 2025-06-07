'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CloudinaryClientService } from '@/ai/services/cloudinary-client.service';

interface ComparisonSliderProps {
  publicId: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export default function ComparisonSlider({ 
  publicId, 
  beforeLabel = "Before", 
  afterLabel = "After",
  className = ""
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [beforeUrl, setBeforeUrl] = useState<string>('');
  const [afterUrl, setAfterUrl] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const cloudinaryService = new CloudinaryClientService();

  // Initialize URLs
  React.useEffect(() => {
    const initializeUrls = async () => {
      try {
        const urls = await cloudinaryService.generateBeforeAfterUrls(publicId);
        setBeforeUrl(urls.before);
        setAfterUrl(urls.after);
      } catch (error) {
        console.error('Failed to generate comparison URLs:', error);
      }
    };

    if (publicId) {
      initializeUrls();
    }
  }, [publicId]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse listeners
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMouseMove(e);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!beforeUrl || !afterUrl) {
    return (
      <div className={`relative w-full h-96 bg-gray-200 animate-pulse rounded-lg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">Loading comparison...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-96 overflow-hidden rounded-lg shadow-lg ${className}`}>
      {/* Container for images */}
      <div 
        ref={containerRef}
        className="relative w-full h-full cursor-ew-resize select-none"
        onMouseMove={handleMouseMove}
      >
        {/* Before image (always visible) */}
        <div className="absolute inset-0">
          <img
            src={beforeUrl}
            alt="Before processing"
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm font-medium">
            {beforeLabel}
          </div>
        </div>

        {/* After image (clipped by slider position) */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={afterUrl}
            alt="After processing"
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm font-medium">
            {afterLabel}
          </div>
        </div>

        {/* Slider handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown}
        >
          {/* Slider handle circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center">
            <div className="w-1 h-4 bg-gray-400 rounded"></div>
            <div className="w-1 h-4 bg-gray-400 rounded ml-1"></div>
          </div>
        </div>

        {/* Hover instruction */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-xs opacity-70">
          Drag to compare
        </div>
      </div>
    </div>
  );
}

// Advanced comparison with multiple processing options
interface AdvancedComparisonProps {
  publicId: string;
  processingOptions: Array<{
    label: string;
    transformations: any[];
  }>;
  className?: string;
}

export function AdvancedComparison({ 
  publicId, 
  processingOptions, 
  className = "" 
}: AdvancedComparisonProps) {
  const [selectedOption, setSelectedOption] = useState(0);
  const [urls, setUrls] = useState<string[]>([]);
  const cloudinaryService = new CloudinaryClientService();

  React.useEffect(() => {
    const generateUrls = async () => {
      try {
        const generatedUrls = await Promise.all(
          processingOptions.map(option => {
            return cloudinaryService.generateOptimizedUrl(publicId, {
              transformation: option.transformations
            } as any);
          })
        );
        setUrls(generatedUrls);
      } catch (error) {
        console.error('Failed to generate processing URLs:', error);
      }
    };

    if (publicId && processingOptions.length > 0) {
      generateUrls();
    }
  }, [publicId, processingOptions]);

  if (urls.length === 0) {
    return (
      <div className={`relative w-full h-96 bg-gray-200 animate-pulse rounded-lg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">Loading processing options...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Processing options selector */}
      <div className="flex flex-wrap gap-2">
        {processingOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedOption(index)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedOption === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Comparison view */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <div className="relative">
          <img
            src={cloudinaryService.generateOptimizedUrl(publicId)}
            alt="Original"
            className="w-full h-64 object-cover rounded-lg"
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
            Original
          </div>
        </div>

        {/* Processed */}
        <div className="relative">
          <img
            src={urls[selectedOption]}
            alt={processingOptions[selectedOption].label}
            className="w-full h-64 object-cover rounded-lg"
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
            {processingOptions[selectedOption].label}
          </div>
        </div>
      </div>
    </div>
  );
}