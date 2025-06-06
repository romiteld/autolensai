import { Job } from 'bull';
import { queueService } from '../services/queue.service';
import { QUEUE_NAMES } from '../config/queue.config';
import { MarketingJobProcessor, MarketingJobData } from '../jobs/marketing.jobs';

export class MarketingQueueProcessor {
  private jobProcessor = new MarketingJobProcessor();

  constructor() {
    this.setupProcessors();
  }

  private setupProcessors() {
    const queue = queueService.getQueue(QUEUE_NAMES.MARKETING_AUTOMATION);
    
    if (!queue) {
      console.error('Marketing automation queue not found');
      return;
    }

    // Set up job processing with concurrency
    queue.process('*', 5, async (job: Job<MarketingJobData>) => {
      console.log(`Processing marketing job ${job.id} of type ${job.data.type}`);
      
      try {
        const result = await this.jobProcessor.process(job);
        
        console.log(`Marketing job ${job.id} completed successfully`);
        return result;
      } catch (error) {
        console.error(`Marketing job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Job event handlers
    queue.on('completed', (job: Job, result: any) => {
      console.log(`Marketing job ${job.id} completed:`, {
        type: job.data.type,
        duration: Date.now() - job.processedOn!,
        result: result ? 'success' : 'no result',
      });
    });

    queue.on('failed', (job: Job, error: Error) => {
      console.error(`Marketing job ${job.id} failed:`, {
        type: job.data.type,
        error: error.message,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      });

      // Handle specific failure scenarios
      this.handleJobFailure(job, error);
    });

    queue.on('stalled', (job: Job) => {
      console.warn(`Marketing job ${job.id} stalled:`, {
        type: job.data.type,
        processedOn: job.processedOn,
      });
    });

    queue.on('progress', (job: Job, progress: number) => {
      console.log(`Marketing job ${job.id} progress: ${progress}%`);
    });

    console.log('Marketing queue processors initialized');
  }

  private handleJobFailure(job: Job<MarketingJobData>, error: Error) {
    const { data } = job;
    
    // Determine if job should be retried or moved to dead letter queue
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      console.log(`Marketing job ${job.id} exhausted retry attempts, sending to dead letter queue`);
      
      // Log failure for monitoring
      this.logJobFailure(job, error);
      
      // Send notification if critical
      if (this.isCriticalJob(data)) {
        this.notifyJobFailure(job, error);
      }
    }
  }

  private logJobFailure(job: Job<MarketingJobData>, error: Error) {
    const failureLog = {
      jobId: job.id,
      type: job.data.type,
      vehicleId: job.data.vehicleId,
      campaignId: job.data.campaignId,
      error: error.message,
      stack: error.stack,
      attempts: job.attemptsMade,
      failedAt: new Date(),
      data: job.data,
    };
    
    // In production, this would be sent to a logging service
    console.error('Marketing job failure logged:', failureLog);
  }

  private isCriticalJob(data: MarketingJobData): boolean {
    // Define which job types are considered critical
    const criticalTypes = ['DEPLOY_CAMPAIGN', 'DEPLOY_LISTING'];
    return criticalTypes.includes(data.type);
  }

  private notifyJobFailure(job: Job<MarketingJobData>, error: Error) {
    // In production, this would send notifications via email, Slack, etc.
    console.warn(`CRITICAL: Marketing job ${job.id} failed - notification would be sent`);
  }

  // Public methods for queue management
  async addCampaignDeploymentJob(
    campaignId: string,
    vehicleId: string,
    platforms: string[],
    options: { priority?: number; delay?: number } = {}
  ) {
    const jobData: MarketingJobData = {
      type: 'DEPLOY_CAMPAIGN',
      campaignId,
      vehicleId,
      platforms,
    };

    return await queueService.addJob(QUEUE_NAMES.MARKETING_AUTOMATION, {
      id: `deploy_campaign_${campaignId}_${Date.now()}`,
      data: jobData,
      priority: options.priority || 10,
      delay: options.delay || 0,
    });
  }

  async addListingDeploymentJob(
    vehicleId: string,
    platforms: string[],
    template?: any,
    options: { priority?: number; delay?: number } = {}
  ) {
    const jobData: MarketingJobData = {
      type: 'DEPLOY_LISTING',
      vehicleId,
      platforms,
      template,
    };

    return await queueService.addJob(QUEUE_NAMES.MARKETING_AUTOMATION, {
      id: `deploy_listing_${vehicleId}_${Date.now()}`,
      data: jobData,
      priority: options.priority || 8,
      delay: options.delay || 0,
    });
  }

  async addOptimizationJob(
    campaignId: string,
    options: { priority?: number } = {}
  ) {
    const jobData: MarketingJobData = {
      type: 'OPTIMIZE_CAMPAIGN',
      campaignId,
    };

    return await queueService.addJob(QUEUE_NAMES.MARKETING_AUTOMATION, {
      id: `optimize_campaign_${campaignId}_${Date.now()}`,
      data: jobData,
      priority: options.priority || 5,
    });
  }

  async addAnalyticsCollectionJob(
    vehicleId: string,
    campaignId?: string,
    options: { priority?: number } = {}
  ) {
    const jobData: MarketingJobData = {
      type: 'COLLECT_ANALYTICS',
      vehicleId,
      campaignId,
    };

    return await queueService.addJob(QUEUE_NAMES.MARKETING_AUTOMATION, {
      id: `collect_analytics_${vehicleId}_${Date.now()}`,
      data: jobData,
      priority: options.priority || 3,
    });
  }

  async addDataRefreshJob(
    vehicleId: string,
    platforms: string[],
    options: { priority?: number } = {}
  ) {
    const jobData: MarketingJobData = {
      type: 'REFRESH_PLATFORM_DATA',
      vehicleId,
      platforms,
    };

    return await queueService.addJob(QUEUE_NAMES.MARKETING_AUTOMATION, {
      id: `refresh_data_${vehicleId}_${Date.now()}`,
      data: jobData,
      priority: options.priority || 2,
    });
  }

  // Batch operations
  async addBulkDeploymentJobs(
    vehicles: { id: string; platforms: string[] }[],
    options: { priority?: number; delay?: number } = {}
  ) {
    const jobs = vehicles.map(vehicle => ({
      id: `bulk_deploy_${vehicle.id}_${Date.now()}`,
      data: {
        type: 'DEPLOY_LISTING' as const,
        vehicleId: vehicle.id,
        platforms: vehicle.platforms,
      },
      priority: options.priority || 6,
      delay: options.delay || 0,
    }));

    return await queueService.addBulkJobs(QUEUE_NAMES.MARKETING_AUTOMATION, jobs);
  }

  async scheduleRecurringAnalyticsCollection() {
    // Schedule analytics collection every 6 hours for active campaigns
    const jobData: MarketingJobData = {
      type: 'COLLECT_ANALYTICS',
    };

    // In production, this would use a cron job or scheduled task
    setInterval(async () => {
      try {
        await queueService.addJob(QUEUE_NAMES.MARKETING_AUTOMATION, {
          id: `recurring_analytics_${Date.now()}`,
          data: jobData,
          priority: 1,
        });
        console.log('Scheduled recurring analytics collection');
      } catch (error) {
        console.error('Failed to schedule recurring analytics collection:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  // Queue monitoring and management
  async getQueueStats() {
    const counts = await queueService.getJobCounts(QUEUE_NAMES.MARKETING_AUTOMATION);
    return {
      queueName: QUEUE_NAMES.MARKETING_AUTOMATION,
      ...counts,
      timestamp: new Date(),
    };
  }

  async pauseQueue() {
    await queueService.pauseQueue(QUEUE_NAMES.MARKETING_AUTOMATION);
    console.log('Marketing automation queue paused');
  }

  async resumeQueue() {
    await queueService.resumeQueue(QUEUE_NAMES.MARKETING_AUTOMATION);
    console.log('Marketing automation queue resumed');
  }

  async cleanCompletedJobs(olderThanMs: number = 24 * 60 * 60 * 1000) {
    await queueService.cleanQueue(QUEUE_NAMES.MARKETING_AUTOMATION, olderThanMs);
    console.log(`Cleaned completed marketing jobs older than ${olderThanMs}ms`);
  }
}

// Create singleton instance
export const marketingProcessor = new MarketingQueueProcessor();