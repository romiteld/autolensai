'use client';

import { useState } from 'react';
import Image from 'next/image';
import { VehicleImage } from '@/vehicle/models/vehicle.model';
import { Button, Card } from '@/common/components/ui';

interface VehicleImageGalleryProps {
  images: VehicleImage[];
}

export function VehicleImageGallery({ images }: VehicleImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-500">No images available</span>
        </div>
      </Card>
    );
  }

  const sortedImages = images
    .filter(img => img.processingStatus === 'completed')
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });

  const selectedImage = sortedImages[selectedImageIndex];
  const imageUrl = selectedImage?.processedUrl || selectedImage?.originalUrl;

  return (
    <>
      <Card className="overflow-hidden">
        {/* Main Image */}
        <div className="relative aspect-video bg-gray-100">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={`Vehicle image ${selectedImageIndex + 1}`}
              fill
              className="object-cover cursor-pointer transition-transform hover:scale-105"
              onClick={() => setIsFullscreen(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 67vw, 800px"
              priority={selectedImageIndex === 0}
            />
          )}
          
          {/* Navigation Arrows */}
          {sortedImages.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={() => setSelectedImageIndex(
                  selectedImageIndex === 0 ? sortedImages.length - 1 : selectedImageIndex - 1
                )}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={() => setSelectedImageIndex(
                  selectedImageIndex === sortedImages.length - 1 ? 0 : selectedImageIndex + 1
                )}
              >
                →
              </Button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
            {selectedImageIndex + 1} / {sortedImages.length}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {sortedImages.length > 1 && (
          <div className="p-4">
            <div className="flex gap-2 overflow-x-auto">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id}
                  className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex
                      ? 'border-blue-500 scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image
                    src={image.processedUrl || image.originalUrl}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-6xl max-h-full w-full h-full flex items-center justify-center">
            <Image
              src={imageUrl || ''}
              alt={`Vehicle image ${selectedImageIndex + 1}`}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close Button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-white/80 hover:bg-white"
              onClick={() => setIsFullscreen(false)}
            >
              ✕
            </Button>

            {/* Navigation in Fullscreen */}
            {sortedImages.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={() => setSelectedImageIndex(
                    selectedImageIndex === 0 ? sortedImages.length - 1 : selectedImageIndex - 1
                  )}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={() => setSelectedImageIndex(
                    selectedImageIndex === sortedImages.length - 1 ? 0 : selectedImageIndex + 1
                  )}
                >
                  →
                </Button>
              </>
            )}

            {/* Image Counter in Fullscreen */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-2 rounded">
              {selectedImageIndex + 1} / {sortedImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}