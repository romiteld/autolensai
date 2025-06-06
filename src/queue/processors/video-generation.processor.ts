import { Queue } from 'bull';
import { queueService } from '../services/queue.service';
import { QUEUE_NAMES } from '../config/queue.config';
import VideoGenerationJob from '../jobs/video-generation.job';
import SceneGenerationJob from '../jobs/scene-generation.job';
import MusicGenerationJob from '../jobs/music-generation.job';
import VideoCompilationJob from '../jobs/video-compilation.job';

export class VideoGenerationProcessor {
  private queue: Queue;

  constructor() {
    this.queue = queueService.getQueue(QUEUE_NAMES.VIDEO_GENERATION)!;
    this.setupProcessors();
    this.setupEventHandlers();
  }

  private setupProcessors() {
    // Main video generation processor
    this.queue.process('video-generation', 1, async (job) => {
      console.log(`Processing video generation job ${job.id}`);
      return VideoGenerationJob.process(job);
    });

    // Scene generation processor
    this.queue.process('scene-generation', 3, async (job) => {
      console.log(`Processing scene generation job ${job.id}`);
      return SceneGenerationJob.process(job);
    });

    // Music generation processor
    this.queue.process('music-generation', 2, async (job) => {
      console.log(`Processing music generation job ${job.id}`);
      return MusicGenerationJob.process(job);
    });

    // Video compilation processor
    this.queue.process('video-compilation', 1, async (job) => {
      console.log(`Processing video compilation job ${job.id}`);
      return VideoCompilationJob.process(job);
    });
  }

  private setupEventHandlers() {
    // Job completed
    this.queue.on('completed', (job, result) => {
      console.log(`Video generation job ${job.id} completed successfully`);
      console.log('Result:', result);
      
      // Clean up job data after successful completion
      this.cleanupJobData(job.id);
    });

    // Job failed
    this.queue.on('failed', (job, error) => {
      console.error(`Video generation job ${job.id} failed:`, error.message);
      
      // Log failure details
      this.logJobFailure(job, error);
      
      // Attempt retry logic if applicable
      this.handleJobFailure(job, error);
    });

    // Job progress
    this.queue.on('progress', (job, progress) => {
      console.log(`Video generation job ${job.id} progress: ${progress}%`);
      
      // Update external systems about progress
      this.updateJobProgress(job.id, progress);
    });

    // Job stalled
    this.queue.on('stalled', (job) => {
      console.warn(`Video generation job ${job.id} stalled`);
      
      // Handle stalled jobs
      this.handleStalledJob(job);
    });

    // Queue ready
    this.queue.on('ready', () => {
      console.log('Video generation queue is ready');
    });

    // Queue error
    this.queue.on('error', (error) => {
      console.error('Video generation queue error:', error);
    });
  }

  private async cleanupJobData(jobId: string | number) {
    try {
      // Clean up temporary files and status data
      const statusKey = `video_generation:${jobId}`;
      
      // Remove from Redis after a delay to allow final status checks
      setTimeout(async () => {
        try {
          await this.queue.client.del(statusKey);
          console.log(`Cleaned up status data for job ${jobId}`);
        } catch (error) {
          console.error(`Failed to cleanup status data for job ${jobId}:`, error);
        }
      }, 60000); // 1 minute delay
    } catch (error) {
      console.error(`Failed to cleanup job ${jobId}:`, error);
    }
  }

  private async logJobFailure(job: any, error: Error) {
    try {
      // Log to external monitoring system
      const failureLog = {
        jobId: job.id,
        jobType: 'video-generation',
        error: error.message,
        stack: error.stack,
        jobData: job.data,
        attemptsMade: job.attemptsMade,
        timestamp: new Date().toISOString(),
      };

      console.error('Video generation job failure:', failureLog);
      
      // Here you could send to external logging service
      // await logFailureToExternalService(failureLog);
    } catch (logError) {
      console.error('Failed to log job failure:', logError);
    }
  }

  private async handleJobFailure(job: any, error: Error) {
    const maxRetries = 3;
    
    if (job.attemptsMade < maxRetries) {
      console.log(`Retrying job ${job.id}, attempt ${job.attemptsMade + 1}/${maxRetries}`);
      
      // Add delay before retry based on attempt number
      const delay = Math.pow(2, job.attemptsMade) * 1000; // Exponential backoff
      
      try {
        await job.retry({ delay });
      } catch (retryError) {
        console.error(`Failed to retry job ${job.id}:`, retryError);
      }
    } else {
      console.error(`Job ${job.id} exceeded max retries, marking as permanently failed`);
      
      // Update status in database
      try {
        await this.markJobAsPermanentlyFailed(job.id, error.message);
      } catch (updateError) {
        console.error(`Failed to mark job ${job.id} as permanently failed:`, updateError);
      }
    }
  }

  private async handleStalledJob(job: any) {
    console.warn(`Handling stalled job ${job.id}`);
    
    try {
      // Check if job is actually stalled or just taking a long time
      const jobStatus = await job.getState();
      
      if (jobStatus === 'active') {
        // Job is still active, might just be taking long
        console.log(`Job ${job.id} is still active, monitoring...`);
        return;
      }
      
      // Job is truly stalled, restart it
      console.log(`Restarting stalled job ${job.id}`);
      await job.retry();
    } catch (error) {
      console.error(`Failed to handle stalled job ${job.id}:`, error);
    }
  }

  private async updateJobProgress(jobId: string | number, progress: number) {
    try {
      // Update progress in external systems
      const statusKey = `video_generation:${jobId}`;
      const currentStatus = await this.queue.client.get(statusKey);
      
      if (currentStatus) {
        const status = JSON.parse(currentStatus);
        status.progress = progress;
        status.lastUpdated = new Date().toISOString();
        
        await this.queue.client.setex(statusKey, 3600, JSON.stringify(status));
      }
    } catch (error) {
      console.error(`Failed to update progress for job ${jobId}:`, error);
    }
  }

  private async markJobAsPermanentlyFailed(jobId: string | number, errorMessage: string) {
    try {
      // Update status in Redis
      const statusKey = `video_generation:${jobId}`;
      const failedStatus = {
        id: jobId.toString(),
        status: 'permanently_failed',
        progress: 0,
        error: errorMessage,
        currentStep: 'Job permanently failed after max retries',
        failedAt: new Date().toISOString(),
      };
      
      await this.queue.client.setex(statusKey, 86400, JSON.stringify(failedStatus)); // 24 hour TTL
      
      // Update database status
      // This would depend on your database structure
      // await updateJobStatusInDatabase(jobId, 'permanently_failed', errorMessage);
    } catch (error) {
      console.error(`Failed to mark job ${jobId} as permanently failed:`, error);
    }
  }

  // Public methods for queue management
  async getQueueStats() {
    try {
      const stats = await queueService.getJobCounts(QUEUE_NAMES.VIDEO_GENERATION);
      
      return {
        ...stats,
        queueName: QUEUE_NAMES.VIDEO_GENERATION,
        isHealthy: stats.failed < 10, // Arbitrary health check
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }
  }

  async pauseQueue() {
    try {
      await queueService.pauseQueue(QUEUE_NAMES.VIDEO_GENERATION);
      console.log('Video generation queue paused');
    } catch (error) {
      console.error('Failed to pause video generation queue:', error);
      throw error;
    }
  }

  async resumeQueue() {
    try {
      await queueService.resumeQueue(QUEUE_NAMES.VIDEO_GENERATION);
      console.log('Video generation queue resumed');
    } catch (error) {
      console.error('Failed to resume video generation queue:', error);
      throw error;
    }
  }

  async cleanQueue(olderThanHours: number = 24) {
    try {
      const grace = olderThanHours * 60 * 60 * 1000; // Convert to milliseconds
      await queueService.cleanQueue(QUEUE_NAMES.VIDEO_GENERATION, grace);
      console.log(`Cleaned video generation queue of jobs older than ${olderThanHours} hours`);
    } catch (error) {
      console.error('Failed to clean video generation queue:', error);
      throw error;
    }
  }

  async getActiveJobs() {
    try {
      const queue = queueService.getQueue(QUEUE_NAMES.VIDEO_GENERATION);
      if (!queue) return [];
      
      const activeJobs = await queue.getActive();
      
      return activeJobs.map(job => ({
        id: job.id,
        data: job.data,
        progress: job.progress(),
        createdAt: new Date(job.timestamp),
        processedOn: job.processedOn ? new Date(job.processedOn) : null,
      }));
    } catch (error) {
      console.error('Failed to get active jobs:', error);
      return [];
    }
  }

  async getFailedJobs(limit: number = 10) {
    try {
      const queue = queueService.getQueue(QUEUE_NAMES.VIDEO_GENERATION);
      if (!queue) return [];
      
      const failedJobs = await queue.getFailed(0, limit - 1);
      
      return failedJobs.map(job => ({
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        createdAt: new Date(job.timestamp),
        failedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      }));
    } catch (error) {
      console.error('Failed to get failed jobs:', error);
      return [];
    }
  }
}

// Singleton instance
export const videoGenerationProcessor = new VideoGenerationProcessor();