import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Card } from '@/common/components/ui';
import { VehicleWithImages } from '@/vehicle/models/vehicle.model';
import { VehicleImageGallery } from '@/app/listing/[slug]/components/image-gallery';
import { ContactForm } from '@/app/listing/[slug]/components/contact-form';
import { SocialShare } from '@/app/listing/[slug]/components/social-share';
import { VehicleJsonLd } from '@/app/listing/[slug]/components/vehicle-json-ld';

interface VehicleListingPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getVehicleBySlug(slug: string): Promise<VehicleWithImages | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/vehicles/${slug}`,
      {
        next: { revalidate: 300 }, // Revalidate every 5 minutes
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch vehicle:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: VehicleListingPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const vehicle = await getVehicleBySlug(resolvedParams.slug);
  
  if (!vehicle) {
    return {
      title: 'Vehicle Not Found - AutoLensAI',
      description: 'The requested vehicle listing could not be found.',
    };
  }

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} - AutoLensAI`;
  const description = vehicle.description || 
    `${vehicle.year} ${vehicle.make} ${vehicle.model} for sale. ${vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles.` : ''} ${vehicle.price ? `Starting at $${vehicle.price.toLocaleString()}.` : ''} View details and contact seller.`;
  
  const primaryImage = vehicle.images.find(img => img.isPrimary) || vehicle.images[0];
  const imageUrl = primaryImage?.processedUrl || primaryImage?.originalUrl;

  return {
    title,
    description,
    keywords: [
      vehicle.make,
      vehicle.model,
      vehicle.year.toString(),
      'car for sale',
      'vehicle listing',
      'automotive',
      vehicle.location || '',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/listing/${resolvedParams.slug}`,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        }
      ] : [],
      siteName: 'AutoLensAI',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/listing/${resolvedParams.slug}`,
    },
  };
}

export default async function VehicleListingPage({
  params,
}: VehicleListingPageProps) {
  const resolvedParams = await params;
  const vehicle = await getVehicleBySlug(resolvedParams.slug);

  if (!vehicle || vehicle.status !== 'active') {
    notFound();
  }

  const primaryImage = vehicle.images.find(img => img.isPrimary) || vehicle.images[0];
  const formattedPrice = vehicle.price ? new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(vehicle.price) : 'Price on request';

  return (
    <>
      <VehicleJsonLd vehicle={vehicle} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                AutoLensAI
              </Link>
              <Button asChild>
                <Link href="/dashboard">Sell Your Car</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Vehicle Title */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-lg text-gray-600">
              {vehicle.mileage && (
                <span>{vehicle.mileage.toLocaleString()} miles</span>
              )}
              {vehicle.location && (
                <span>📍 {vehicle.location}</span>
              )}
              <span className="text-2xl font-bold text-blue-600">
                {formattedPrice}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images and Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Gallery */}
              <VehicleImageGallery images={vehicle.images} />

              {/* Vehicle Details */}
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Vehicle Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-600">Make:</span>
                    <span className="ml-2">{vehicle.make}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Model:</span>
                    <span className="ml-2">{vehicle.model}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Year:</span>
                    <span className="ml-2">{vehicle.year}</span>
                  </div>
                  {vehicle.mileage && (
                    <div>
                      <span className="font-medium text-gray-600">Mileage:</span>
                      <span className="ml-2">{vehicle.mileage.toLocaleString()} miles</span>
                    </div>
                  )}
                  {vehicle.condition && (
                    <div>
                      <span className="font-medium text-gray-600">Condition:</span>
                      <span className="ml-2 capitalize">{vehicle.condition}</span>
                    </div>
                  )}
                  {vehicle.transmission && (
                    <div>
                      <span className="font-medium text-gray-600">Transmission:</span>
                      <span className="ml-2 capitalize">{vehicle.transmission}</span>
                    </div>
                  )}
                  {vehicle.fuelType && (
                    <div>
                      <span className="font-medium text-gray-600">Fuel Type:</span>
                      <span className="ml-2 capitalize">{vehicle.fuelType.replace('_', ' ')}</span>
                    </div>
                  )}
                  {vehicle.exteriorColor && (
                    <div>
                      <span className="font-medium text-gray-600">Exterior Color:</span>
                      <span className="ml-2">{vehicle.exteriorColor}</span>
                    </div>
                  )}
                  {vehicle.interiorColor && (
                    <div>
                      <span className="font-medium text-gray-600">Interior Color:</span>
                      <span className="ml-2">{vehicle.interiorColor}</span>
                    </div>
                  )}
                  {vehicle.vin && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">VIN:</span>
                      <span className="ml-2 font-mono text-sm">{vehicle.vin}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Description */}
              {vehicle.description && (
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Description</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {vehicle.description}
                    </p>
                  </div>
                </Card>
              )}

              {/* Social Share */}
              <SocialShare vehicle={vehicle} />
            </div>

            {/* Right Column - Contact Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <ContactForm vehicle={vehicle} />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">AutoLensAI</h3>
              <p className="text-gray-400 mb-6">
                AI-powered car marketplace transforming how you buy and sell vehicles.
              </p>
              <div className="flex justify-center space-x-6">
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}