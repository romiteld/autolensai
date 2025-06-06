import { Metadata } from 'next';
import { VehicleWithImages } from '@/vehicle/models/vehicle.model';

interface SEOConfig {
  baseUrl: string;
  siteName: string;
  defaultImage: string;
  twitterHandle?: string;
  facebookAppId?: string;
}

const defaultConfig: SEOConfig = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://autolensai.com',
  siteName: 'AutoLensAI',
  defaultImage: '/og-image.jpg',
  twitterHandle: '@autolensai',
  facebookAppId: process.env.FACEBOOK_APP_ID,
};

export function generateVehicleMetadata(
  vehicle: VehicleWithImages,
  slug: string,
  config: Partial<SEOConfig> = {}
): Metadata {
  const seoConfig = { ...defaultConfig, ...config };
  
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} for Sale - ${seoConfig.siteName}`;
  const shortTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  
  const description = vehicle.description || 
    `${vehicle.year} ${vehicle.make} ${vehicle.model} for sale. ${
      vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles.` : ''
    } ${
      vehicle.price ? `Starting at $${vehicle.price.toLocaleString()}.` : ''
    } ${
      vehicle.location ? `Located in ${vehicle.location}.` : ''
    } View photos and contact seller on ${seoConfig.siteName}.`;

  const primaryImage = vehicle.images.find(img => img.isPrimary) || vehicle.images[0];
  const imageUrl = primaryImage?.processedUrl || primaryImage?.originalUrl || seoConfig.defaultImage;
  
  const canonicalUrl = `${seoConfig.baseUrl}/listing/${slug}`;

  // Generate rich keywords
  const keywords = [
    vehicle.make,
    vehicle.model,
    vehicle.year.toString(),
    'for sale',
    'car listing',
    'vehicle marketplace',
    'automotive',
    vehicle.condition && `${vehicle.condition} condition`,
    vehicle.fuelType && vehicle.fuelType.replace('_', ' '),
    vehicle.transmission,
    vehicle.location,
    vehicle.zipCode,
    'used car',
    'auto sales',
    seoConfig.siteName.toLowerCase(),
  ].filter(Boolean);

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: seoConfig.siteName }],
    robots: {
      index: vehicle.status === 'active',
      follow: true,
      googleBot: {
        index: vehicle.status === 'active',
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonicalUrl,
      title: shortTitle,
      description,
      siteName: seoConfig.siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          type: 'image/jpeg',
        },
        ...(vehicle.images
          .filter(img => img.processedUrl || img.originalUrl)
          .slice(0, 4)
          .map(img => ({
            url: img.processedUrl || img.originalUrl,
            width: 800,
            height: 600,
            alt: `${vehicle.year} ${vehicle.make} ${vehicle.model} - Interior/Exterior View`,
            type: 'image/jpeg',
          }))
        ),
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: seoConfig.twitterHandle,
      creator: seoConfig.twitterHandle,
      title: shortTitle,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      ...(seoConfig.facebookAppId && {
        'fb:app_id': seoConfig.facebookAppId,
      }),
      'price:amount': vehicle.price?.toString(),
      'price:currency': 'USD',
      'product:availability': vehicle.status === 'active' ? 'in stock' : 'out of stock',
      'product:condition': vehicle.condition || 'used',
      'vehicle:make': vehicle.make,
      'vehicle:model': vehicle.model,
      'vehicle:year': vehicle.year.toString(),
      ...(vehicle.mileage && {
        'vehicle:mileage': vehicle.mileage.toString(),
      }),
      ...(vehicle.vin && {
        'vehicle:vin': vehicle.vin,
      }),
    },
  };
}

export function generateVehicleStructuredData(vehicle: VehicleWithImages, slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://autolensai.com';
  const primaryImage = vehicle.images.find(img => img.isPrimary) || vehicle.images[0];
  const imageUrl = primaryImage?.processedUrl || primaryImage?.originalUrl;

  // Main vehicle structured data
  const vehicleData = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    '@id': `${baseUrl}/listing/${slug}#vehicle`,
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    description: vehicle.description,
    brand: {
      '@type': 'Brand',
      name: vehicle.make,
    },
    model: vehicle.model,
    productionDate: vehicle.year.toString(),
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl,
        width: 1200,
        height: 630,
      },
    }),
    ...(vehicle.vin && { vehicleIdentificationNumber: vehicle.vin }),
    ...(vehicle.mileage && { mileageFromOdometer: { '@type': 'QuantitativeValue', value: vehicle.mileage, unitCode: 'SMI' } }),
    ...(vehicle.condition && { vehicleCondition: `https://schema.org/${vehicle.condition.charAt(0).toUpperCase() + vehicle.condition.slice(1)}Condition` }),
    ...(vehicle.transmission && { vehicleTransmission: vehicle.transmission }),
    ...(vehicle.fuelType && { fuelType: vehicle.fuelType.replace('_', ' ') }),
    ...(vehicle.exteriorColor && { color: vehicle.exteriorColor }),
    offers: {
      '@type': 'Offer',
      '@id': `${baseUrl}/listing/${slug}#offer`,
      priceCurrency: 'USD',
      ...(vehicle.price && { price: vehicle.price }),
      availability: vehicle.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'AutoDealer',
        name: 'AutoLensAI',
        url: baseUrl,
      },
      url: `${baseUrl}/listing/${slug}`,
      validFrom: vehicle.createdAt.toISOString(),
    },
    ...(vehicle.location && {
      availableAtOrFrom: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: vehicle.location,
          ...(vehicle.zipCode && { postalCode: vehicle.zipCode }),
          addressCountry: 'US',
        },
      },
    }),
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
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Vehicles',
        item: `${baseUrl}/vehicles`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: vehicle.make,
        item: `${baseUrl}/vehicles?make=${encodeURIComponent(vehicle.make)}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        item: `${baseUrl}/listing/${slug}`,
      },
    ],
  };

  // Organization data
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': `${baseUrl}#organization`,
    name: 'AutoLensAI',
    description: 'AI-powered car marketplace transforming how you buy and sell vehicles',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 200,
      height: 60,
    },
    sameAs: [
      'https://www.facebook.com/autolensai',
      'https://www.twitter.com/autolensai',
      'https://www.linkedin.com/company/autolensai',
      'https://www.instagram.com/autolensai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@autolensai.com',
      availableLanguage: 'English',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
  };

  // FAQ structured data (common vehicle questions)
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How can I contact the seller?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can contact the seller by filling out the contact form on this page. They will receive your message and contact you directly.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I schedule a test drive?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, you can request a test drive by selecting "Schedule Test Drive" in the contact form. The seller will coordinate with you to set up a convenient time.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is financing available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Financing options may be available. Contact the seller to discuss financing terms and requirements.',
        },
      },
    ],
  };

  return {
    vehicle: vehicleData,
    breadcrumb: breadcrumbData,
    organization: organizationData,
    faq: faqData,
  };
}

export function generateSocialShareUrls(vehicle: VehicleWithImages, slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://autolensai.com';
  const shareUrl = `${baseUrl}/listing/${slug}`;
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} for Sale`;
  const description = vehicle.description || 
    `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} for sale on AutoLensAI.`;

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} - ${description}`)}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(`${title} - ${description}`)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${description}\n\n${shareUrl}`)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${shareUrl}`)}`,
    copy: shareUrl,
  };
}

export function generateRichSnippetTestingUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://autolensai.com';
  const pageUrl = `${baseUrl}/listing/${slug}`;
  return `https://search.google.com/test/rich-results?url=${encodeURIComponent(pageUrl)}`;
}