import { Queue } from 'bullmq';
import { redis, isRedisAvailable } from '../config/redis';
import { GenerationJobData } from '../types';

let generationQueue: Queue<GenerationJobData> | null = null;

export function getGenerationQueue(): Queue<GenerationJobData> | null {
  if (!generationQueue && isRedisAvailable() && redis) {
    try {
      generationQueue = new Queue<GenerationJobData>('question-generation', {
        connection: redis as any,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });
      console.log('📋 BullMQ generation queue initialized');
    } catch (err) {
      console.warn('⚠️ Could not create BullMQ queue:', (err as Error).message);
    }
  }
  return generationQueue;
}
