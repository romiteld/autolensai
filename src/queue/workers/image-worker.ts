#!/usr/bin/env node

import { imageProcessingProcessor } from '@/queue/processors/image-processing.processor';

async function startImageWorker() {
  console.log('🚀 Starting AutoLensAI Image Processing Worker...');
  
  try {
    await imageProcessingProcessor.start();
    console.log('✅ Image processing worker started successfully');
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('📴 Received SIGTERM, shutting down gracefully...');
      await imageProcessingProcessor.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('📴 Received SIGINT, shutting down gracefully...');
      await imageProcessingProcessor.stop();
      process.exit(0);
    });

    // Keep the process running
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start image processing worker:', error);
    process.exit(1);
  }
}

// Start the worker if this file is run directly
if (require.main === module) {
  startImageWorker();
}

export { startImageWorker };