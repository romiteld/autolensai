# AutoLensAI - Technical Requirements & Architecture

## Project Overview

AutoLensAI is an AI-powered car marketplace platform that enables private sellers to create professional vehicle listings with automated background removal, AI-generated descriptions, and promotional video content. The platform features a subscription-based model with automated cross-platform listing and YouTube Shorts integration.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: ShadCN UI v4
- **Language**: TypeScript
- **Animations**: Framer Motion + GSAP
- **Deployment**: Vercel

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **API**: Next.js API Routes

### AI & Processing Services
- **Content Generation**: OpenAI GPT-4
- **Image Processing**: Cloudinary AI
- **Video Generation**: FalAI (Kling 2.1)
- **Music Generation**: Sonauto
- **Agent Orchestration**: CrewAI
- **Video Processing**: FFmpeg

### Third-Party APIs
- **License Verification**: IDScan.net DMV API / AAMVA DLDV
- **Car Valuation**: KBB API / Edmunds API
- **YouTube Integration**: YouTube Data API v3
- **Payment Processing**: Stripe

## Core Features

### 1. Vehicle Listing System
- Multi-step car information form
- Photo upload with drag-and-drop
- Cloudinary AI processing:
  - Background removal
  - Image upscaling
  - Generative fill
  - Auto-cropping
- AI-generated vehicle descriptions
- Price suggestions based on zip code

### 2. Dynamic Landing Pages
- SEO-optimized single-page listings
- Contact forms with email notifications
- Test drive scheduling calendar
- Interactive photo galleries
- Share buttons and backlink generation
- Mobile-responsive design

### 3. Test Drive Management
- Calendar-based scheduling system
- Driver's license verification:
  - Photo capture (front/back)
  - File upload option
  - DMV API verification
- Automated confirmation emails
- Status tracking dashboard

### 4. AI Video Pipeline
**User Flow:**
1. User inputs video marketing idea
2. OpenAI generates 3 scene descriptions (10 seconds each)
3. User selects 3 vehicle images
4. Each image + scene prompt → FalAI Kling 2.1 → 10-second clip
5. FFmpeg merges 3 clips sequentially
6. Sonauto generates fitting background music
7. Final 30-second video with audio
8. Auto-upload to YouTube Shorts with call-to-action

### 5. Automated Listing Distribution
- CrewAI agents for cross-platform posting
- Social media automation
- Marketplace integration (Facebook, Craigslist, etc.)
- SEO-optimized content generation
- Backlink creation for search rankings

### 6. Subscription & Community
- Monthly billing until vehicle sold
- Stripe payment processing
- Community marketplace section
- User dashboard and analytics
- Subscription tier management

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  subscription_status subscription_status_enum DEFAULT 'inactive',
  subscription_tier VARCHAR DEFAULT 'basic',
  stripe_customer_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Vehicles Table
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  make VARCHAR NOT NULL,
  model VARCHAR NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER,
  price DECIMAL(10,2),
  description TEXT,
  condition vehicle_condition_enum,
  location VARCHAR,
  zip_code VARCHAR(10),
  status vehicle_status_enum DEFAULT 'active',
  featured BOOLEAN DEFAULT FALSE,
  vin VARCHAR(17),
  transmission VARCHAR,
  fuel_type VARCHAR,
  exterior_color VARCHAR,
  interior_color VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Vehicle Images Table
```sql
CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  original_url VARCHAR NOT NULL,
  processed_url VARCHAR,
  cloudinary_public_id VARCHAR,
  order_index INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  processing_status processing_status_enum DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Test Drives Table
```sql
CREATE TABLE test_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_name VARCHAR NOT NULL,
  customer_email VARCHAR NOT NULL,
  customer_phone VARCHAR,
  scheduled_date TIMESTAMP NOT NULL,
  status test_drive_status_enum DEFAULT 'pending',
  license_front_url VARCHAR,
  license_back_url VARCHAR,
  verification_status verification_status_enum DEFAULT 'pending',
  verification_data JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Landing Pages Table
```sql
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  slug VARCHAR UNIQUE NOT NULL,
  seo_title VARCHAR,
  seo_description TEXT,
  meta_keywords VARCHAR[],
  page_content JSONB,
  view_count INTEGER DEFAULT 0,
  last_viewed TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Videos Table
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  video_idea TEXT NOT NULL,
  scenes JSONB NOT NULL,
  selected_images VARCHAR[],
  video_clips_urls VARCHAR[],
  final_video_url VARCHAR,
  youtube_url VARCHAR,
  youtube_video_id VARCHAR,
  music_url VARCHAR,
  status video_status_enum DEFAULT 'processing',
  processing_logs JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR NOT NULL,
  status subscription_status_enum DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  stripe_subscription_id VARCHAR UNIQUE,
  stripe_price_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
OPENAI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FAL_AI_API_KEY=
SONAUTO_API_KEY=

# Third-party APIs
IDSCAN_DMV_API_KEY=
KBB_API_KEY=
EDMUNDS_API_KEY=
YOUTUBE_API_KEY=

# Payment
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Deployment
NEXT_PUBLIC_APP_URL=
VERCEL_URL=
```

## File Structure

```
autolensai/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   ├── vehicles/
│   │   ├── test-drives/
│   │   ├── videos/
│   │   └── subscription/
│   ├── listing/
│   │   └── [slug]/
│   ├── api/
│   │   ├── auth/
│   │   ├── vehicles/
│   │   ├── ai/
│   │   ├── test-drives/
│   │   ├── automation/
│   │   └── webhooks/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (ShadCN components)
│   ├── forms/
│   ├── dashboard/
│   ├── landing/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── ai/
│   ├── utils/
│   └── validations/
├── hooks/
├── types/
└── public/
```

## Key Implementation Notes

1. **Image Processing Pipeline**: Implement queue system for Cloudinary processing to handle batch uploads
2. **Video Generation**: Use job queue (Bull/BullMQ) for video processing pipeline
3. **Real-time Updates**: Leverage Supabase Realtime for live status updates
4. **SEO Optimization**: Implement dynamic sitemap generation and meta tag optimization
5. **Error Handling**: Comprehensive error boundaries and API error responses
6. **Rate Limiting**: Implement rate limiting for AI API calls and video generation
7. **Security**: Proper authentication middleware and data validation
8. **Performance**: Image optimization, lazy loading, and caching strategies

## Development Phases

### Phase 1: Core Platform (Weeks 1-4)
- User authentication and dashboard
- Vehicle listing creation
- Basic image upload and processing
- Landing page generation

### Phase 2: AI Integration (Weeks 5-8)
- Cloudinary AI processing
- OpenAI description generation
- Price valuation integration
- Test drive system

### Phase 3: Video Pipeline (Weeks 9-12)
- FalAI video generation
- Sonauto music integration
- FFmpeg processing
- YouTube automation

### Phase 4: Automation & Polish (Weeks 13-16)
- CrewAI listing automation
- Subscription system
- Community features
- Performance optimization

This technical specification provides the foundation for building AutoLensAI with proper architecture, scalability, and maintainability considerations.