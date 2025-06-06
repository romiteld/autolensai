#!/usr/bin/env node

// Load environment variables for Node.js context
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local file
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { env } from './env';

function checkEnvironment() {
  console.log('🔍 AutoLensAI Environment Configuration Check\n');
  
  const status = env.getServiceStatus();
  
  console.log('Core Services:');
  console.log(`  Database (Supabase): ${status.database ? '✅' : '❌'}`);
  console.log(`  OpenAI API: ${status.openai ? '✅' : '❌'}`);
  console.log(`  Cloudinary: ${status.cloudinary ? '✅' : '❌'}`);
  
  console.log('\nAI Video Services:');
  console.log(`  Fal.AI: ${status.falai ? '✅' : '❌'}`);
  console.log(`  Sonauto: ${status.sonauto ? '✅' : '❌'}`);
  
  console.log('\nPayment & Infrastructure:');
  console.log(`  Stripe: ${status.stripe ? '✅' : '❌'}`);
  console.log(`  Redis Queue: ${status.redis ? '✅' : '⚠️  Optional'}`);
  
  console.log('\nEnvironment Details:');
  console.log(`  NODE_ENV: ${env.get('NODE_ENV')}`);
  console.log(`  App URL: ${env.get('NEXT_PUBLIC_APP_URL')}`);
  
  const allCoreServicesReady = status.database && status.openai && status.cloudinary && status.falai && status.sonauto && status.stripe;
  
  console.log('\n' + '='.repeat(50));
  
  if (allCoreServicesReady) {
    console.log('🎉 All core services are properly configured!');
    console.log('🚀 Application should start without issues.');
  } else {
    console.log('⚠️  Some services need configuration.');
    console.log('   Check the missing services above.');
  }
  
  if (!status.redis) {
    console.log('\n💡 Redis is optional for development but required for production queue processing.');
  }
}

if (require.main === module) {
  checkEnvironment();
}

export { checkEnvironment };