# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Environment validation
npm run env:check

# Testing (when implemented)
# npm run test        # Run all tests
# npm run test:unit   # Run unit tests only
# npm run test:e2e    # Run end-to-end tests
```

## Architecture Overview

AutoLensAI is an AI-powered automotive marketplace built with Next.js 15 App Router. The system uses a service-oriented architecture with clear separation of concerns.

### Core Architecture Patterns

**Service Layer Pattern**: All business logic is encapsulated in service classes under `/src/{domain}/services/`. Each service handles a specific domain (vehicles, payments, images, etc.) and provides a clean interface for data operations.

**Environment Configuration**: Centralized environment management using Zod validation in `/src/core/config/env.schema.ts`. All environment variables are validated at startup and accessed through a singleton pattern.

**Queue-Based Processing**: Background jobs are managed through Bull/Redis queues configured in `/src/queue/config/queue.config.ts`. Five distinct queues handle different workloads with specific concurrency and rate limiting.

**Authentication & Authorization**: Supabase-based authentication with middleware-enforced route protection. Row Level Security (RLS) policies ensure data isolation between users.

### Database Architecture

The system uses Supabase PostgreSQL with a well-defined schema:
- **Core Tables**: `users`, `vehicles`, `vehicle_images`, `videos`, `subscriptions`, `test_drives`, `landing_pages`
- **RLS Policies**: All tables implement user-based access control
- **Type Safety**: Database types are auto-generated and imported from `@/common/types/database.types`

### AI Services Integration

**Multi-Provider AI Stack**:
- **OpenAI GPT-4**: Vehicle descriptions, scene generation, content creation
- **Cloudinary AI**: Image processing, background removal, enhancement
- **FalAI Kling 2.1**: Image-to-video generation
- **Sonauto**: AI music generation for videos

**Service Pattern**: All AI services follow a consistent interface pattern with error handling, rate limiting, and cost optimization.

### Queue System Architecture

Five specialized queues with different performance characteristics:
- `image-processing`: 5 concurrent, 10/sec limit
- `video-generation`: 2 concurrent, 5/min limit  
- `marketing-automation`: 10 concurrent, 50/min limit
- `email-notifications`: 20 concurrent, 100/min limit
- `analytics`: 3 concurrent, 10/min limit

Jobs are defined in `/src/queue/jobs/` and processed by workers in `/src/queue/processors/`.

### API Structure

**Middleware Stack**: All API routes use a consistent middleware stack for authentication, validation, rate limiting, and error handling. See `/src/api/middleware/` for reusable middleware functions.

**Route Patterns**: API routes follow RESTful conventions with proper HTTP methods and status codes. Each route includes:
- Authentication validation
- Input validation using Zod schemas
- Proper error handling with structured responses
- Rate limiting based on endpoint sensitivity

### Payment & Subscription System

**Stripe Integration**: Complete subscription management with three tiers (Basic $29, Premium $99, Enterprise $299). The system includes:
- Checkout session creation
- Customer portal access
- Usage tracking and limits
- Webhook handling for subscription events

**Subscription-Based Access Control**: Features are gated based on subscription tiers using middleware and service-level checks.

### Frontend Architecture

**Component Structure**: Uses ShadCN/UI components with custom enhancements for premium UX. Components are organized by domain in `/src/common/components/`.

**Animation System**: Advanced animations using Framer Motion and GSAP with performance optimization:
- GSAP ScrollTrigger for scroll-based animations
- Framer Motion for micro-interactions
- 60fps performance monitoring and optimization

**State Management**: Zustand for client state, React Query for server state, and Supabase real-time subscriptions for live updates.

### CrewAI Marketing Automation

**Multi-Agent System**: Six specialized AI agents handle different marketing platforms:
- Facebook Marketplace Specialist
- Instagram Content Creator  
- Craigslist Optimization Expert
- YouTube Shorts Specialist
- SEO Specialist
- Analytics Coordinator

**Agent Configuration**: Agents are configured in `/src/marketing/crewai-agents/config/agents.config.ts` with specific tools, goals, and iteration limits.

## Key Development Patterns

### Service Integration
When creating new services, follow the established pattern:
1. Define the service class in `/src/{domain}/services/`
2. Add environment variables to `env.schema.ts`
3. Create corresponding types in the domain's models folder
4. Add queue jobs if background processing is needed

### API Route Development
All API routes should:
1. Use the middleware stack from `/src/api/middleware/`
2. Validate inputs with Zod schemas
3. Include proper authentication checks
4. Return structured error responses
5. Follow RESTful conventions

### Database Operations
Database operations should:
1. Use the service layer pattern, not direct Supabase calls in components
2. Leverage RLS policies for security
3. Include proper error handling
4. Use transactions for multi-table operations

### Queue Job Creation
Background jobs should:
1. Be defined in `/src/queue/jobs/`
2. Include progress tracking
3. Have proper error handling and retry logic
4. Clean up resources on completion or failure

### Environment Management
Environment variables are validated using Zod schemas in `/src/core/config/env.schema.ts`. Required variables will cause startup failures, while optional variables log warnings. Use `npm run env:check` to validate configuration.

**Critical Environment Variables**:
- Supabase (auth/database): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- AI Services: `OPENAI_API_KEY`, `CLOUDINARY_*`, `FAL_AI_API_KEY`, `SONAUTO_API_KEY`
- Payments: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`
- Queue System: `REDIS_URL` (optional, defaults to memory)

## Video Generation Pipeline

The system implements a 6-step video generation process:
1. User input validation (vehicle selection, marketing concept)
2. OpenAI scene generation (3 detailed scenes)
3. FalAI video generation (parallel processing)
4. Sonauto music generation (synchronized background audio)
5. FFmpeg video compilation (professional assembly)
6. Upload and storage (Supabase storage with public URLs)

This pipeline is queue-based with real-time progress tracking and takes 6-9 minutes to complete.

## Subscription Tiers & Limits

- **Free**: 5 vehicles, 10 images each, 2 videos/month
- **Basic ($29/month)**: 25 vehicles, 20 images each, 10 videos/month, marketing automation
- **Premium ($99/month)**: 100 vehicles, 50 images each, 50 videos/month, advanced features
- **Enterprise ($299/month)**: Unlimited usage, white-label options, API access

Feature access is controlled at both the API and service levels using subscription middleware.

## Performance Optimizations

**Animation System**: Performance monitoring is temporarily disabled due to SSR compatibility issues. The system uses:
- Framer Motion for React component animations
- GSAP with ScrollTrigger for advanced scroll-based effects
- 60fps performance targets with automatic quality adjustment
- Client-side only initialization to prevent SSR conflicts

**Image Processing**: Multi-format support (WebP, AVIF, PNG, JPG) with automatic optimization and responsive variants generation.

## Frontend Architecture Details

**Dashboard Design**: Premium dark theme with glass morphism effects, gradient backgrounds, and sophisticated animations. Uses a Command Center approach with:
- 80px sidebar with quick actions and navigation
- Real-time status indicators and AI system monitoring
- Interactive cards with hover effects and micro-interactions
- Performance metrics with animated progress bars

**Component Organization**:
- `/src/common/components/ui/` - Reusable UI components (buttons, cards, inputs)
- `/src/common/components/sections/` - Page sections (hero, features, testimonials)
- `/src/common/components/animations/` - Animation utilities and effects
- `/src/{domain}/components/` - Domain-specific components (vehicle, payment, etc.)

## Authentication Flow

The system uses Supabase Auth with:
- Email/password registration with validation
- Google OAuth integration
- Automatic profile creation via callback handler
- Middleware-based route protection
- RLS policies for data isolation
- Session management with HTTP-only cookies

## Testing Structure

Test directories are organized by type:
- `/src/tests/unit/` - Unit tests for individual functions/components
- `/src/tests/integration/` - Integration tests for service interactions
- `/src/tests/e2e/` - End-to-end user flow tests
- `/src/tests/fixtures/` - Test data and mock responses
- `/src/tests/mocks/` - Service mocks and test utilities