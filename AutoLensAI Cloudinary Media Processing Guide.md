```markdown
# AutoLensAI Cloudinary Media Processing Guide

## Dynamic Branding Implementation

### 1. Watermark Overlay System
```
// utils/cloudinary.ts
export const applyBrandOverlay = (publicId: string) => {
  return cloudinary.url(publicId, {
    transformation: [
      {
        overlay: {
          public_id: 'autolensai/watermark',
          type: 'private'
        },
        width: 300,
        gravity: 'south_east',
        x: 20,
        y: 20,
        opacity: 70
      },
      { effect: 'shadow:40' }
    ]
  });
};
```

### 2. Dynamic Color Scheme Matching
```
// components/BrandedImage.tsx
import { CldImage } from 'next-cloudinary';

export default function BrandedImage({ src }) {
  return (
    
  );
}
```

## Text Overlay Implementation

### 1. Vehicle-Specific Text Injection
```
// utils/social.ts
export const generatePricingOverlay = (price: string) => {
  return cloudinary.url('sample_car', {
    transformation: [
      {
        overlay: {
          font_family: 'Montserrat',
          font_size: 72,
          font_weight: 'bold',
          text: `$${price}`,
          text_align: 'left'
        },
        color: '#ffffff',
        background: 'rgba(0,0,0,0.5)',
        gravity: 'north_west',
        x: 50,
        y: 50,
        width: 400,
        crop: 'fit'
      }
    ]
  });
};
```

### 2. Dynamic Text Positioning
```
// lib/cloudinary.ts
export const createTextLayer = (text: string, position: TextPosition) => {
  return new cloudinary.Transformation()
    .overlay(
      new cloudinary.TextLayer()
        .fontFamily('Arial')
        .fontSize(40)
        .fontWeight('bold')
        .text(text)
    )
    .gravity(position.gravity)
    .x(position.x)
    .y(position.y)
    .chain();
};
```

## Image Effects Pipeline

### 1. Automotive-Specific Enhancements
```
// utils/image-effects.ts
export const enhanceVehicleImage = (publicId: string) => {
  return cloudinary.url(publicId, {
    transformation: [
      { effect: 'gen_remove:prompt_car' },
      { effect: 'improve:outline' },
      { effect: 'auto_contrast' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
};
```

### 2. Real-Time Effect Preview
```
// components/EffectPreview.tsx
'use client';
import { CldImage } from 'next-cloudinary';

export default function EffectPreview({ id }) {
  const [effects, setEffects] = useState([]);

  return (
    
      
      
    
  );
}
```

## Social Media Integration

### 1. Dynamic OG Image Generation
```
// app/vehicles/[id]/page.tsx
export async function generateMetadata({ params }) {
  const vehicle = await getVehicle(params.id);
  
  return {
    openGraph: {
      images: [{
        url: generateSocialCard(vehicle),
        width: 1200,
        height: 630
      }]
    },
    twitter: {
      card: 'summary_large_image',
      images: [generateSocialCard(vehicle)]
    }
  };
}
```

### 2. Before/After Comparison System
```
// components/ComparisonSlider.tsx
import ReactBeforeAfterSlider from 'react-before-after-slider-component';

export default function VehicleComparison({ before, after }) {
  return (
    
      
    
  );
}
```

## Security & Optimization

### 1. Signed Upload Workflow
```
// pages/api/sign-upload.ts
export default async function handler(req, res) {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({
    timestamp,
    upload_preset: 'auto_gen_vehicles'
  }, process.env.CLOUDINARY_API_SECRET);

  res.status(200).json({ signature, timestamp });
}
```

### 2. Transformation Versioning
```
// utils/versioning.ts
export const getVersionedTransform = (version: string) => {
  return cloudinary.url('sample_car', {
    transformation: [
      { effect: `v${version}/auto_bg_remove` },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
};
```

## Cost Optimization Strategies

### 1. Auto Format & Quality
```
// utils/optimization.ts
export const optimizeDelivery = (publicId: string) => {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 'auto', crop: 'scale' }
    ]
  });
};
```

### 2. Responsive Image Breakpoints
```
// components/ResponsiveImage.tsx
import { CldImage } from 'next-cloudinary';

export default function ResponsiveImage({ src }) {
  return (
    
  );
}
```

This implementation combines Cloudinary's advanced transformation capabilities with Next.js 14's App Router for optimal performance[1][8]. The system leverages TypeScript for type safety and Supabase for secure storage[6][14]. All transformations are version-controlled and optimized for automotive use cases while maintaining brand consistency across platforms.

[1] https://cloudinary.com/documentation/image_transformations
[2] https://support.cloudinary.com/hc/en-us/articles/202521442-How-to-Add-Text-Overlays-to-Images
[3] https://cloudinary.com/documentation/video_layers
[4] https://cloudinary.com/guides/image-effects/how-to-overlay-pictures
[5] https://cloudinary-build-url.netlify.app/transformations/image
[6] https://cloudinary.com/documentation/layers
[7] https://stackoverflow.com/questions/78029312/how-to-center-rotate-an-overlay-image-in-a-complex-cloudinary-url-transformation
[8] https://cloudinary.com/documentation/effects_and_artistic_enhancements
[9] https://next.cloudinary.dev/guides/image-underlays
[10] https://www.youtube.com/watch?v=7qujZvoaxS4
[11] https://cloudinary.com/product_updates/overlay_and_underlay_a_fetched_image
[12] https://cloudinary-build-url.netlify.app/transformations/basic
[13] https://www.youtube.com/watch?v=UL07rxFK3_U
[14] https://www.youtube.com/watch?v=3iqoLjMHIvU
[15] https://cloudinary.com/documentation/transformation_reference
[16] https://www.youtube.com/watch?v=2X4jdcPS5X8
[17] https://thedigitalprojectmanager.com/tools/cloudinary-pricing/
[18] https://air.tableforums.com/t/resolved-cloudinary-image-background-removal-and-image-improvement-make-com-and-airtable/1330
[19] https://cloudinary.com/documentation/upload_images