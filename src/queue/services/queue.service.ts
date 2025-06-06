import Bull, { Queue, Job } from 'bull';
import { QUEUE_CONFIG, QUEUE_NAMES, type QueueName } from '../config/queue.config';

export interface QueueJob<T = any> {
  id: string;
  data: T;
  priority?: number;
  delay?: number;
  attempts?: number;
}

export class QueueService {
  private static instance: QueueService;
  private queues: Map<QueueName, Queue> = new Map();

  private constructor() {
    this.initializeQueues();
  }

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  private initializeQueues() {
    Object.values(QUEUE_NAMES).forEach((queueName) => {
      const queue = new Bull(queueName, {
        redis: QUEUE_CONFIG.redis,
        defaultJobOptions: QUEUE_CONFIG.defaultJobOptions,
      });

      const queueConfig = QUEUE_CONFIG.queues[queueName];
      if (queueConfig.limiter) {
        queue.limiter = queueConfig.limiter;
      }

      this.queues.set(queueName, queue);
    });
  }

  async addJob<T>(queueName: QueueName, job: QueueJob<T>): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.add(job.data, {
      jobId: job.id,
      priority: job.priority,
      delay: job.delay,
      attempts: job.attempts,
    });
  }

  async addBulkJobs<T>(queueName: QueueName, jobs: QueueJob<T>[]): Promise<Job<T>[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const bulkJobs = jobs.map(job => ({
      data: job.data,
      opts: {
        jobId: job.id,
        priority: job.priority,
        delay: job.delay,
        attempts: job.attempts,
      },
    }));

    return queue.addBulk(bulkJobs);
  }

  async getJob<T>(queueName: QueueName, jobId: string): Promise<Job<T> | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.getJob(jobId);
  }

  async getJobCounts(queueName: QueueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getPausedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + completed + failed + delayed + paused,
    };
  }

  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
  }

  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
  }

  async cleanQueue(queueName: QueueName, grace: number = 0): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await Promise.all([
      queue.clean(grace, 'completed'),
      queue.clean(grace, 'failed'),
    ]);
  }

  getQueue(queueName: QueueName): Queue | undefined {
    return this.queues.get(queueName);
  }

  async closeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.queues.values()).map(queue => queue.close())
    );
  }
}

export const queueService = QueueService.getInstance();