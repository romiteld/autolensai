'use client';

import { useState, useEffect } from 'react';
import { CloudinaryClientService } from '@/ai/services/cloudinary-client.service';
import { ComparisonSlider, AdvancedComparison } from './comparison-slider';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/common/components/ui';
import { 
  Download, 
  Share2, 
  Wand2, 
  Palette, 
  Type, 
  Image as ImageIcon,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface ImageProcessingPreviewProps {
  publicId: string;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    price: string;
  };
  className?: string;
}

export default function ImageProcessingPreview({ 
  publicId, 
  vehicleInfo, 
  className = "" 
}: ImageProcessingPreviewProps) {
  const [selectedEffect, setSelectedEffect] = useState<string>('original');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [socialCardUrl, setSocialCardUrl] = useState<string>('');
  
  const cloudinaryService = new CloudinaryService();

  const effectOptions = [
    { 
      id: 'original', 
      label: 'Original', 
      icon: ImageIcon,
      description: 'No processing applied'
    },
    { 
      id: 'background-removal', 
      label: 'Background Removal', 
      icon: Wand2,
      description: 'AI-powered background removal'
    },
    { 
      id: 'enhanced', 
      label: 'Enhanced', 
      icon: Sparkles,
      description: 'Complete automotive enhancement'
    },
    { 
      id: 'showroom-background', 
      label: 'Showroom Background', 
      icon: Palette,
      description: 'Luxury showroom environment'
    },
    { 
      id: 'with-pricing', 
      label: 'With Pricing', 
      icon: Type,
      description: 'Price overlay included'
    },
    { 
      id: 'branded', 
      label: 'Branded', 
      icon: RefreshCw,
      description: 'AutoLensAI watermark applied'
    }
  ];

  useEffect(() => {
    const generatePreviews = async () => {
      setLoading(true);
      try {
        const urls: Record<string, string> = {};

        // Original
        urls.original = cloudinaryService.generateOptimizedUrl(publicId);

        // Background removal
        urls['background-removal'] = await cloudinaryService.removeBackgroundWithAI(publicId);

        // Enhanced with AI
        urls.enhanced = await cloudinaryService.enhanceVehicleWithAI(publicId, true);

        // Showroom background only
        urls['showroom-background'] = await cloudinaryService.generativeFillBackground(publicId, {
          prompt: 'luxury car showroom background',
          width: 1200,
          height: 800
        });

        // With pricing overlay
        if (vehicleInfo?.price) {
          urls['with-pricing'] = await cloudinaryService.generatePricingOverlay(publicId, vehicleInfo.price);
        }

        // Branded with watermark
        urls.branded = await cloudinaryService.applyBrandOverlay(publicId);

        setPreviewUrls(urls);

        // Generate social card if vehicle info is available
        if (vehicleInfo) {
          const socialUrl = await cloudinaryService.generateSocialCard(publicId, vehicleInfo);
          setSocialCardUrl(socialUrl);
        }

      } catch (error) {
        console.error('Failed to generate preview URLs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (publicId) {
      generatePreviews();
    }
  }, [publicId, vehicleInfo]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: vehicleInfo ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}` : 'Vehicle Image',
          url: url
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        alert('URL copied to clipboard!');
      } catch (error) {
        console.error('Copy to clipboard failed:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentUrl = previewUrls[selectedEffect] || previewUrls.original;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Image Processing Preview
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => handleDownload(currentUrl, `${selectedEffect}-${publicId}.jpg`)}
                size="sm"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => handleShare(currentUrl)}
                size="sm"
                variant="outline"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <img
              src={currentUrl}
              alt={`${selectedEffect} preview`}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded">
              {effectOptions.find(opt => opt.id === selectedEffect)?.label || 'Preview'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Effect Options */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {effectOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedEffect === option.id;
              const url = previewUrls[option.id];
              
              if (!url && option.id !== 'original') return null;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedEffect(option.id)}
                  className={`relative group overflow-hidden rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video">
                    <img
                      src={url}
                      alt={option.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-70 text-white">
                      <div className="flex items-center gap-1">
                        <IconComponent className="h-3 w-3" />
                        <span className="text-xs font-medium">{option.label}</span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Before/After Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Before & After Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ComparisonSlider 
            publicId={publicId}
            beforeLabel="Original"
            afterLabel="AI Enhanced"
          />
        </CardContent>
      </Card>

      {/* Advanced Processing Options */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedComparison
            publicId={publicId}
            processingOptions={[
              {
                label: 'Background Removal Only',
                transformations: [
                  { effect: 'gen_remove:prompt_car background,hint_automotive' },
                  { quality: 'auto', fetch_format: 'auto' }
                ]
              },
              {
                label: 'Enhanced Details',
                transformations: [
                  { effect: 'improve:outline' },
                  { effect: 'auto_contrast' },
                  { effect: 'sharpen:100' },
                  { quality: 'auto', fetch_format: 'auto' }
                ]
              },
              {
                label: 'Complete AI Processing',
                transformations: [
                  { effect: 'gen_remove:prompt_car background,hint_automotive' },
                  { effect: 'gen_fill:prompt_luxury showroom background' },
                  { effect: 'improve:outline' },
                  { effect: 'auto_contrast' },
                  { quality: 'auto', fetch_format: 'auto' }
                ]
              }
            ]}
          />
        </CardContent>
      </Card>

      {/* Social Media Card Preview */}
      {socialCardUrl && vehicleInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Social Media Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <img
                src={socialCardUrl}
                alt="Social media card"
                className="w-full max-w-2xl rounded-lg shadow-lg"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(socialCardUrl, `social-card-${publicId}.jpg`)}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Social Card
                </Button>
                <Button
                  onClick={() => handleShare(socialCardUrl)}
                  size="sm"
                  variant="outline"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">AI Features Used:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Generative background removal (gen_remove)</li>
                  <li>• Generative fill for new backgrounds (gen_fill)</li>
                  <li>• Image enhancement and sharpening</li>
                  <li>• Automatic contrast optimization</li>
                  <li>• Dynamic text and brand overlays</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Optimization:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Auto quality and format selection</li>
                  <li>• Responsive breakpoints generated</li>
                  <li>• WebP/AVIF format when supported</li>
                  <li>• CDN delivery optimization</li>
                  <li>• Progressive JPEG loading</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}