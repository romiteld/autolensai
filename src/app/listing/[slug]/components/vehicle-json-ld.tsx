import { VehicleWithImages } from '@/vehicle/models/vehicle.model';

interface VehicleJsonLdProps {
  vehicle: VehicleWithImages;
}

export function VehicleJsonLd({ vehicle }: VehicleJsonLdProps) {
  const primaryImage = vehicle.images.find(img => img.isPrimary) || vehicle.images[0];
  const imageUrl = primaryImage?.processedUrl || primaryImage?.originalUrl;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    brand: {
      '@type': 'Brand',
      name: vehicle.make,
    },
    model: vehicle.model,
    productionDate: vehicle.year.toString(),
    ...(vehicle.description && { description: vehicle.description }),
    ...(imageUrl && {
      image: imageUrl,
    }),
    ...(vehicle.vin && { vehicleIdentificationNumber: vehicle.vin }),
    ...(vehicle.mileage && { mileageFromOdometer: vehicle.mileage }),
    ...(vehicle.condition && { vehicleCondition: vehicle.condition }),
    ...(vehicle.transmission && { vehicleTransmission: vehicle.transmission }),
    ...(vehicle.fuelType && { fuelType: vehicle.fuelType }),
    ...(vehicle.exteriorColor && { color: vehicle.exteriorColor }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      ...(vehicle.price && { price: vehicle.price }),
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'AutoLensAI',
        url: process.env.NEXT_PUBLIC_BASE_URL,
      },
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/listing/${vehicle.id}`,
    },
    ...(vehicle.location && {
      availableAtOrFrom: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: vehicle.location,
          ...(vehicle.zipCode && { postalCode: vehicle.zipCode }),
        },
      },
    }),
  };

  // Additional structured data for the organization
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'AutoLensAI',
    description: 'AI-powered car marketplace transforming how you buy and sell vehicles',
    url: process.env.NEXT_PUBLIC_BASE_URL,
    logo: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
    sameAs: [
      'https://www.facebook.com/autolensai',
      'https://www.twitter.com/autolensai',
      'https://www.linkedin.com/company/autolensai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+1-555-AUTOLENS',
      email: 'support@autolensai.com',
    },
  };

  // Breadcrumb structured data
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: process.env.NEXT_PUBLIC_BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Vehicles',
        item: `${process.env.NEXT_PUBLIC_BASE_URL}/vehicles`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: vehicle.make,
        item: `${process.env.NEXT_PUBLIC_BASE_URL}/vehicles?make=${vehicle.make}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        item: `${process.env.NEXT_PUBLIC_BASE_URL}/listing/${vehicle.id}`,
      },
    ],
  };

  // Product review aggregate (if we have reviews in the future)
  const aggregateRatingData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: '1',
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
    </>
  );
}