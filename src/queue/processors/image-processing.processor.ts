import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';
import { processImageJob, type ImageProcessingJobData } from '@/queue/jobs/image-processing.job';

export class ImageProcessingProcessor {
  private static instance: ImageProcessingProcessor;
  private isProcessing = false;

  private constructor() {}

  static getInstance(): ImageProcessingProcessor {
    if (!ImageProcessingProcessor.instance) {
      ImageProcessingProcessor.instance = new ImageProcessingProcessor();
    }
    return ImageProcessingProcessor.instance;
  }

  async start() {
    if (this.isProcessing) {
      console.log('Image processing processor already running');
      return;
    }

    console.log('Starting image processing processor...');
    this.isProcessing = true;

    const queue = queueService.getQueue(QUEUE_NAMES.IMAGE_PROCESSING);
    if (!queue) {
      throw new Error('Image processing queue not found');
    }

    // Register the job processor with concurrency of 5
    queue.process(5, async (job) => {
      try {
        return await processImageJob(job);
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Add event listeners
    queue.on('completed', (job, result) => {
      console.log(`✅ Image processing job ${job.id} completed for image ${job.data.imageId}`);
      if (job.data.isBulkOperation) {
        console.log(`📦 Bulk operation: ${job.data.bulkJobId}`);
      }
    });

    queue.on('failed', (job, err) => {
      console.error(`❌ Image processing job ${job.id} failed for image ${job.data.imageId}:`, err.message);
      if (job.data.isBulkOperation) {
        console.error(`📦 Bulk operation: ${job.data.bulkJobId}`);
      }
    });

    queue.on('progress', (job, progress) => {
      console.log(`🔄 Image processing job ${job.id} progress: ${progress}% (Image: ${job.data.imageId})`);
    });

    queue.on('stalled', (job) => {
      console.warn(`⚠️ Image processing job ${job.id} stalled (Image: ${job.data.imageId})`);
    });

    queue.on('waiting', (jobId) => {
      console.log(`⏳ Image processing job ${jobId} waiting`);
    });

    queue.on('active', (job) => {
      console.log(`🚀 Image processing job ${job.id} started (Image: ${job.data.imageId}, Operation: ${job.data.operation})`);
    });

    console.log('Image processing processor started successfully');
  }

  async stop() {
    if (!this.isProcessing) {
      console.log('Image processing processor not running');
      return;
    }

    console.log('Stopping image processing processor...');
    
    const queue = queueService.getQueue(QUEUE_NAMES.IMAGE_PROCESSING);
    if (queue) {
      await queue.close();
    }

    this.isProcessing = false;
    console.log('Image processing processor stopped');
  }

  async getStats() {
    const queue = queueService.getQueue(QUEUE_NAMES.IMAGE_PROCESSING);
    if (!queue) {
      throw new Error('Image processing queue not found');
    }

    return await queueService.getJobCounts(QUEUE_NAMES.IMAGE_PROCESSING);
  }

  async pauseProcessing() {
    const queue = queueService.getQueue(QUEUE_NAMES.IMAGE_PROCESSING);
    if (queue) {
      await queue.pause();
      console.log('Image processing paused');
    }
  }

  async resumeProcessing() {
    const queue = queueService.getQueue(QUEUE_NAMES.IMAGE_PROCESSING);
    if (queue) {
      await queue.resume();
      console.log('Image processing resumed');
    }
  }

  async cleanCompletedJobs(olderThan: number = 24 * 60 * 60 * 1000) {
    const queue = queueService.getQueue(QUEUE_NAMES.IMAGE_PROCESSING);
    if (queue) {
      await queue.clean(olderThan, 'completed');
      console.log(`Cleaned completed jobs older than ${olderThan}ms`);
    }
  }

  async cleanFailedJobs(olderThan: number = 7 * 24 * 60 * 60 * 1000) {
    const queue = queueService.getQueue(QUEUE_NAMES.IMAGE_PROCESSING);
    if (queue) {
      await queue.clean(olderThan, 'failed');
      console.log(`Cleaned failed jobs older than ${olderThan}ms`);
    }
  }
}

export const imageProcessingProcessor = ImageProcessingProcessor.getInstance();