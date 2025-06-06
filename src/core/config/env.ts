import { envSchema } from './env.schema';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

class EnvConfig {
  private static instance: EnvConfig;
  private config: Record<string, string | undefined>;

  private constructor() {
    this.config = this.loadConfig();
    this.validate();
  }

  static getInstance(): EnvConfig {
    if (!EnvConfig.instance) {
      EnvConfig.instance = new EnvConfig();
    }
    return EnvConfig.instance;
  }

  private loadConfig(): Record<string, string | undefined> {
    return {
      // Database
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // AI Services
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      FAL_AI_API_KEY: process.env.FAL_AI_API_KEY,
      SONAUTO_API_KEY: process.env.SONAUTO_API_KEY,
      
      // Third-party APIs
      IDSCAN_DMV_API_KEY: process.env.IDSCAN_DMV_API_KEY,
      KBB_API_KEY: process.env.KBB_API_KEY,
      EDMUNDS_API_KEY: process.env.EDMUNDS_API_KEY,
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
      
      // Payment
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      
      // Deployment
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      
      // Redis
      REDIS_URL: process.env.REDIS_URL,
      
      // Node
      NODE_ENV: process.env.NODE_ENV,
    };
  }

  private validate() {
    try {
      const result = envSchema.safeParse(this.config);
      if (!result.success) {
        const missingVars = result.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`Invalid environment configuration: ${missingVars}`);
        }
        
        console.warn('⚠️  Environment validation warnings:');
        result.error.errors.forEach(err => {
          console.warn(`  - ${err.path.join('.')}: ${err.message}`);
        });
        console.warn('  Note: Some features may not work properly without proper configuration.');
      } else {
        console.log('✅ Environment configuration validated successfully');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Critical environment configuration error');
      }
      console.error('Environment validation error:', error);
    }
  }

  get<K extends keyof typeof envSchema.shape>(key: K): string {
    return this.config[key] || '';
  }

  getAll() {
    return this.config;
  }

  isConfigured(key: keyof typeof envSchema.shape): boolean {
    const value = this.config[key];
    return Boolean(value && value.trim().length > 0);
  }

  getServiceStatus() {
    return {
      database: this.isConfigured('NEXT_PUBLIC_SUPABASE_URL') && this.isConfigured('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      openai: this.isConfigured('OPENAI_API_KEY'),
      cloudinary: this.isConfigured('CLOUDINARY_CLOUD_NAME') && this.isConfigured('CLOUDINARY_API_KEY'),
      falai: this.isConfigured('FAL_AI_API_KEY'),
      sonauto: this.isConfigured('SONAUTO_API_KEY'),
      stripe: this.isConfigured('STRIPE_PUBLISHABLE_KEY') && this.isConfigured('STRIPE_SECRET_KEY'),
      redis: this.isConfigured('REDIS_URL'),
    };
  }
}

export const env = EnvConfig.getInstance();