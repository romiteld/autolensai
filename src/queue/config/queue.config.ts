import { env } from '@/core/config/env';

export const QUEUE_NAMES = {
  IMAGE_PROCESSING: 'image-processing',
  VIDEO_GENERATION: 'video-generation',
  MARKETING_AUTOMATION: 'marketing-automation',
  EMAIL_NOTIFICATIONS: 'email-notifications',
  ANALYTICS: 'analytics',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

export const QUEUE_CONFIG = {
  redis: {
    host: env.get('REDIS_URL') || 'localhost',
    port: 6379,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
  queues: {
    [QUEUE_NAMES.IMAGE_PROCESSING]: {
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    },
    [QUEUE_NAMES.VIDEO_GENERATION]: {
      concurrency: 2,
      limiter: {
        max: 5,
        duration: 60000,
      },
    },
    [QUEUE_NAMES.MARKETING_AUTOMATION]: {
      concurrency: 10,
      limiter: {
        max: 50,
        duration: 60000,
      },
    },
    [QUEUE_NAMES.EMAIL_NOTIFICATIONS]: {
      concurrency: 20,
      limiter: {
        max: 100,
        duration: 60000,
      },
    },
    [QUEUE_NAMES.ANALYTICS]: {
      concurrency: 3,
      limiter: {
        max: 10,
        duration: 60000,
      },
    },
  },
} as const;