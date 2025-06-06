import { z } from 'zod';

export const envSchema = z.object({
  // Database
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // AI Services
  OPENAI_API_KEY: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  FAL_AI_API_KEY: z.string().min(1),
  SONAUTO_API_KEY: z.string().min(1),
  
  // Third-party APIs
  IDSCAN_DMV_API_KEY: z.string().optional(),
  KBB_API_KEY: z.string().optional(),
  EDMUNDS_API_KEY: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  
  // Payment
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Deployment
  NEXT_PUBLIC_APP_URL: z.string().url(),
  VERCEL_URL: z.string().optional(),
  
  // Queue Management
  REDIS_URL: z.string().url().optional(),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;