import Redis from 'ioredis';
import { REDIS_PASSWORD, REDIS_PORT, REDIS_HOST, REDIS_TTL } from '../secrets';
import logger from '../utils/loggers';



export const REDIS_CONFIG = {
  host: REDIS_HOST|| 'localhost',
  port: parseInt(REDIS_PORT || '6379'),
  password: REDIS_PASSWORD || '',
  ttl: REDIS_TTL || 1800,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true
};

// Initialize Redis client
const redisClient =  new Redis({
  ...REDIS_CONFIG,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

//
// Connection event handlers
redisClient.on('connect', () => {
  logger.info('Connected to Redis Cloud');
});

redisClient.on('error', (err) => {
  logger.info('Redis Cloud connection error:', err);
});


/**
 * Clears all Redis keys (flushes entire cache)
 */
export const clearRedisCache = async (): Promise<void> => {
  try {
    const keys = await redisClient.keys('*');

    if (keys.length === 0) {
      logger.info('No Redis keys found to clear.');
      return;
    }

    const pipeline = redisClient.pipeline();
    keys.forEach((key) => pipeline.del(key));
    await pipeline.exec();

    logger.info(`Successfully cleared ${keys.length} Redis cache key(s).`);
  } catch (error) {
    logger.error('Error clearing Redis cache:', error);
  }
}


export default redisClient;