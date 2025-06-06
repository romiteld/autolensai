# Environment Configuration Guide

## Overview

This document outlines the environment configuration setup for AutoLensAI and the fixes that were implemented to ensure proper validation and application startup.

## Issues Fixed

### 1. Variable Name Mismatch
- **Issue**: Environment file had `FAL_API_KEY` but schema expected `FAL_AI_API_KEY`
- **Fix**: Updated `.env.local` to use `FAL_AI_API_KEY` to match the schema

### 2. Missing Environment Variables
- **Issue**: Several required environment variables were missing from `.env.local`
- **Fix**: Added the following variables:
  ```bash
  REDIS_URL=redis://localhost:6379
  NODE_ENV=development
  ```

### 3. Environment Validation Errors
- **Issue**: Environment validation was failing silently in development
- **Fix**: Enhanced validation with:
  - Better error reporting showing specific missing variables
  - Clear distinction between warnings (development) and errors (production)
  - Service status checking functionality

### 4. Environment Loading Issues
- **Issue**: Environment variables not being loaded properly in Node.js context
- **Fix**: 
  - Added explicit `dotenv.config()` calls
  - Installed missing `dotenv` package
  - Created environment checking utilities

## Environment Variables

### Required Core Services
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=sk-proj-...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FAL_AI_API_KEY=your_fal_ai_key
SONAUTO_API_KEY=your_sonauto_key

# Payment
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Optional Services
```bash
# Queue Management (Redis)
REDIS_URL=redis://localhost:6379

# Third-party APIs
IDSCAN_DMV_API_KEY=your_dmv_key
KBB_API_KEY=your_kbb_key
EDMUNDS_API_KEY=your_edmunds_key
YOUTUBE_API_KEY=your_youtube_key

# Deployment
VERCEL_URL=your_vercel_url
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Verification Commands

### Check Environment Status
```bash
npm run env:check
```

### Health Check API
Visit `http://localhost:3000/api/health` when the app is running to see service status.

### Manual Verification
```bash
# Test environment loading
node -e "require('dotenv').config({ path: './.env.local' }); console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Found' : 'Missing');"
```

## Configuration Files

### Enhanced Environment Schema (`/src/core/config/env.schema.ts`)
- Validates all required environment variables
- Provides clear error messages for missing variables
- Distinguishes between required and optional variables

### Environment Configuration (`/src/core/config/env.ts`)
- Singleton pattern for environment access
- Built-in validation and error handling
- Service status checking functionality
- Improved error reporting for development vs production

### Environment Checker (`/src/core/config/env-check.ts`)
- Standalone utility to verify environment configuration
- Visual status indicators for each service
- Available as npm script: `npm run env:check`

## Next Steps

1. **Redis Setup**: For production queue processing, ensure Redis is properly configured
2. **Service Monitoring**: Use the health check endpoint for monitoring
3. **Security**: Review API keys and rotate them regularly
4. **Deployment**: Update environment variables in your deployment platform

## Troubleshooting

### Application Won't Start
1. Run `npm run env:check` to identify missing variables
2. Check that `.env.local` exists and contains all required variables
3. Verify variable names match exactly (case-sensitive)

### Validation Errors
1. Check the console output for specific missing variables
2. Ensure all required services have valid API keys
3. Verify URL formats are correct (must include protocol)

### Service-Specific Issues
- **Database**: Verify Supabase URL and keys are correct
- **AI Services**: Check API key formats and quotas
- **Payment**: Ensure Stripe keys match your account
- **Queue**: Redis is optional for development but required for production