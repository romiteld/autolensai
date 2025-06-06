```markdown
# AutoLensAI Social Media Integration Guide

## Cloudinary Social Card Implementation

### 1. Dynamic OG Image Generation
```
// components/SocialCard.tsx
import { getCldOgImageUrl } from 'next-cloudinary';

export const generateSocialCard = (vehicle: Vehicle) => {
  return getCldOgImageUrl({
    src: vehicle.cloudinaryId,
    overlays: [{
      width: 1200,
      crop: 'fit',
      text: {
        color: 'white',
        fontFamily: 'Montserrat',
        fontSize: 72,
        fontWeight: 'bold',
        text: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        effect: 'shadow:40'
      },
      position: { x: 50, y: 50 }
    }, {
      publicId: 'autolensai/watermark',
      width: 300,
      position: { x: -50, y: -50, gravity: 'south_east' }
    }],
    effects: [{
      background: 'gen_fill:prompt_showroom_floor'
    }]
  });
};
```

### 2. Before/After Slider Component
```
// components/ComparisonSlider.tsx
import ReactBeforeAfterSlider from 'react-before-after-slider-component';

export default function VehicleComparison({ before, after }) {
  return (
    
      
    
  );
}
```

## Social Card Optimization Strategies

### 1. AI-Enhanced Transformations
```
// utils/cloudinary.ts
export const enhanceSocialImage = (publicId: string) => {
  return cloudinary.url(publicId, {
    transformation: [
      { effect: 'gen_remove:prompt_car' },
      { effect: 'gen_replace:from_shadow;to_showroom_lighting' },
      { quality: 'auto', fetch_format: 'auto' },
      { width: 1200, height: 630, crop: 'fill' }
    ]
  });
};
```

### 2. Dynamic Content Injection
```
// pages/vehicles/[id].tsx
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

## Social Preview Workflow

### 1. Real-Time Preview System
```
// components/ImageEditor.tsx
'use client';
import { CldImage } from 'next-cloudinary';

export default function EditorPreview({ id }) {
  const [transformations, setTransformations] = useState([]);

  return (
    
      
       setTransformations([...t])}
      />
    
  );
}
```

### 2. Automated Social Posting
```
// lib/social.ts
export const postToSocials = async (vehicle: Vehicle) => {
  const imageUrl = generateSocialCard(vehicle);
  
  await Promise.all([
    facebookApi.post({ 
      message: vehicle.description,
      link: vehicle.url,
      image: imageUrl
    }),
    twitterApi.tweet({
      text: `New listing: ${vehicle.title}`,
      media: imageUrl
    })
  ]);
};
```

## Before/After Implementation Details

### 1. Cloudinary Transformation Pipeline
```
# Before image
https://res.cloudinary.com/autolensai/image/upload/v1/vehicles/abc123.jpg

# After processing
https://res.cloudinary.com/autolensai/image/upload/e_gen_remove:prompt_car,e_gen_fill:showroom_background/v1/vehicles/abc123.jpg
```

### 2. Supabase Storage Integration
```
-- vehicles table schema
create table vehicles (
  id uuid primary key,
  original_image text,
  processed_image text,
  social_card text,
  transformations jsonb
);
```

## Security & Optimization

### 1. Signed URL Generation
```
// pages/api/sign-upload.ts
export default async function handler(req, res) {
  const timestamp = Math.round(new Date().getTime()/1000);
  const signature = cloudinary.utils.api_sign_request({
    timestamp,
    upload_preset: 'auto_gen_vehicles'
  }, process.env.CLOUDINARY_API_SECRET);

  res.status(200).json({ signature, timestamp });
}
```

### 2. CDN Caching Strategy
```
# vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Editing Workflow

### 1. AI-Powered Regeneration
```
// pages/api/reprocess-image.ts
export async function POST(req) {
  const { id, prompt } = await req.json();
  
  const result = await cloudinary.uploader.explicit(id, {
    type: 'upload',
    transformation: [
      { effect: `gen_replace:${prompt}` },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });

  return NextResponse.json(result);
}
```

### 2. Version Control System
```
# Image URL pattern
https://res.cloudinary.com/autolensai/image/upload/v1.2.3-auto4/vehicles/abc123.jpg
```

This implementation combines Cloudinary's AI capabilities with Next.js 14's app router for optimized social card generation and before/after comparisons. The system leverages Supabase for version tracking and Vercel's edge network for global CDN distribution[1][8][14].

[1] https://cloudinary.com/documentation/nextjs_social_media_cards_tutorial
[2] https://tpiros.dev/blog/creating-an-automated-social-share-card-using-cloudinary-and-eleventy/
[3] https://hideoo.dev/notes/starlight-og-images-cloudinary-astro-sdk
[4] https://cloudinary.com/documentation/admin_api
[5] https://www.reddit.com/r/squarespace/comments/12jsiue/before_and_after_image_slider_in_71_no_plugins/
[6] https://www.w3schools.com/howto/howto_js_image_comparison.asp
[7] https://github.com/transitive-bullshit/react-before-after-slider
[8] https://next.cloudinary.dev/guides/social-media-card
[9] https://astro.cloudinary.dev/guides/social-media-card
[10] https://www.youtube.com/watch?v=cmjOKxB5jWQ
[11] https://stackoverflow.com/questions/59814326/how-to-center-the-whole-image-comparison-slider
[12] https://github.com/smeleshkin/react-before-after-slider-component
[13] https://cloudinary.com/documentation/social_media_profile_pictures
[14] https://cloudinary.com/blog/create-simple-slideshows-at-scale
[15] https://www.youtube.com/watch?v=SjFdwjxUfGw
[16] https://next.cloudinary.dev/templates/social-media-cards
[17] https://cloudinary.com/documentation/svelte_social_media_cards_tutorial
[18] https://cloudinary.com/guides/image-effects/enhancing-user-experience-with-a-responsive-image-slider
[19] https://cloudinary.com/guides/front-end-development/html-image-slider-do-it-yourself-and-1-step-image-gallery-widget
[20] https://cloudinary.com/documentation/video_effects_and_enhancements