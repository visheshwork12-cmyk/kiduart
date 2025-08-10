import { createClient } from 'redis';
import { rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import logger from '@config/logger.js';
import config from '@config/index.js';

const isServerless = process.env.VERCEL || process.env.LAMBDA_TASK_ROOT;

class RedisManager {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.lastActivity = Date.now();
    this.idleTimeout = null;
  }

  // New: Warmup logic - pre-establish connection on startup
  async warmup() {
    try {
      logger.debug('Warming up Redis connection...');
      const client = await this.getClient();
      await client.ping(); // Test connection
      logger.debug('Redis warmup successful');
    } catch (error) {
      logger.warn('Redis warmup failed', { message: error.message });
    }
  }

  async initialize() {
    if (this.isInitialized && this.client?.isReady) {
      logger.debug('Reusing existing Redis client', { url: config.redis.url });
      return this.client;
    }
    if (this.isConnecting && this.connectionPromise) {
      logger.debug('Waiting for Redis connection', { url: config.redis.url });
      return this.connectionPromise;
    }
    return this.connect();
  }

  async connect() {
    if (this.isConnecting) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this._createConnection();

    try {
      this.client = await this.connectionPromise;
      this.isInitialized = true;
      this.lastActivity = Date.now();
      this._setupIdleTimeout(); // New: Setup idle timeout
      return this.client;
    } catch (error) {
      this.isConnecting = false;
      this.connectionPromise = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async _createConnection() {
    try {
      await this._cleanup();

      if (!config.redis?.url) {
        throw new Error('Redis URL not configured');
      }

      logger.info('Creating new Redis connection...');

      const client = createClient({
        url: config.redis.url,
        socket: {
          tls: config.redis.tls ?? (isServerless ? true : false),
          rejectUnauthorized: config.redis.rejectUnauthorized ?? false,
          connectTimeout: isServerless ? 5000 : 15000,
          lazyConnect: true,
          reconnectStrategy: isServerless ? false : (retries) => {
            if (retries > 5) {
              logger.error('Redis max retries exceeded');
              return false;
            }
            return Math.min(retries * 200, 2000);
          },
          keepAlive: isServerless ? false : true,
          family: 4,
        },
        pool: isServerless ? { min: 0, max: 1 } : { min: 1, max: 5 }, // Adjusted pooling for resource control
      });

      client.on('error', (err) => {
        logger.error('Redis Client Error', {
          message: err.message,
          code: err.code,
          url: config.redis.url,
          retryCount: client?.retryCount || 0,
        });
        this.isInitialized = false;
      });

      client.on('connect', () => {
        logger.info('Redis client connecting', { url: config.redis.url });
      });

      client.on('ready', () => {
        logger.info('Redis client ready', { url: config.redis.url });
      });

      client.on('end', () => {
        logger.warn('Redis connection ended', { url: config.redis.url });
        this.isInitialized = false;
        this.client = null;
      });

      client.on('reconnecting', () => {
        logger.info('Redis reconnecting...', { url: config.redis.url });
      });

      await Promise.race([
        client.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), isServerless ? 5000 : 15000)),
      ]);

      logger.info('Redis client connected successfully', { url: config.redis.url });
      return client;
    } catch (error) {
      logger.error('Failed to create Redis connection', {
        message: error.message,
        stack: error.stack,
        url: config.redis.url,
      });
      throw error;
    }
  }

  // New: Setup idle timeout to cleanup inactive connections
  _setupIdleTimeout() {
    if (this.idleTimeout) clearTimeout(this.idleTimeout);
    this.idleTimeout = setTimeout(async () => {
      if (Date.now() - this.lastActivity > 30000 && !isServerless) { // 30s idle in non-serverless
        await this.disconnect();
      } else {
        this._setupIdleTimeout();
      }
    }, 30000);
  }

  async _cleanup() {
    if (this.client) {
      try {
        if (this.client.isOpen) {
          await this.client.disconnect();
          logger.info('Redis client disconnected during cleanup');
        }
      } catch (error) {
        logger.warn('Error during Redis cleanup', { message: error.message });
      }
      this.client = null;
      this.isInitialized = false;
    }
  }

  async disconnect() {
    if (this.idleTimeout) clearTimeout(this.idleTimeout);
    await this._cleanup();
    this.isConnecting = false;
    this.connectionPromise = null;
    logger.info('Redis manager disconnected');
  }

  async getClient() {
    if (!this.isInitialized || !this.client || !this.client.isReady) {
      return this.initialize();
    }
    this.lastActivity = Date.now();
    return this.client;
  }

  async isHealthy() {
    try {
      if (!this.client || !this.client.isReady) {
        await this.initialize();
      }
      await this.client.ping();
      return true;
    } catch (error) {
      logger.warn('Redis health check failed', { message: error.message });
      return false;
    }
  }
}

const redisManager = new RedisManager();

// Warmup on startup in non-serverless
if (!isServerless) {
  redisManager.warmup();
}

const getRedisClient = async () => {
  return redisManager.getClient();
};

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max: isServerless ? max * 5 : max, // Higher limits for serverless
    message: { code: 429, message },
    store: new RedisStore({
      sendCommand: async (...args) => {
        try {
          const client = await redisManager.getClient();
          return await client.sendCommand(args);
        } catch (error) {
          logger.error('RedisStore sendCommand error', { message: error.message, stack: error.stack, args });
          throw error;
        }
      },
    }),
    skip: () => !redisManager.isInitialized, // Skip if Redis unavailable
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  20,
  'Too many requests, please try again later.'
);

const loginLimiter = createRateLimiter(
  5 * 60 * 1000,
  5,
  'Too many login attempts, please try again after 5 minutes.'
);

const redis = {
  async get(key) {
    try {
      const client = await redisManager.getClient();
      return await client.get(key);
    } catch (error) {
      logger.warn('Redis GET error', { key, message: error.message });
      return null;
    }
  },
  async set(key, value, ...args) {
    try {
      const client = await redisManager.getClient();
      return await client.set(key, value, ...args);
    } catch (error) {
      logger.warn('Redis SET error', { key, message: error.message });
      return null;
    }
  },
  async setEx(key, seconds, value) {
    try {
      const client = await redisManager.getClient();
      return await client.setEx(key, seconds, value);
    } catch (error) {
      logger.warn('Redis SETEX error', { key, message: error.message });
      return null;
    }
  },
  async del(key) {
    try {
      const client = await redisManager.getClient();
      return await client.del(key);
    } catch (error) {
      logger.warn('Redis DEL error', { key, message: error.message });
      return null;
    }
  },
  async publish(channel, message) {
    try {
      const client = await redisManager.getClient();
      return await client.publish(channel, message);
    } catch (error) {
      logger.warn('Redis PUBLISH error', { channel, message: error.message });
      return null;
    }
  },
  async incr(key) {
    try {
      const client = await redisManager.getClient();
      return await client.incr(key);
    } catch (error) {
      logger.warn('Redis INCR error', { key, message: error.message });
      return null;
    }
  },
  async expire(key, seconds) {
    try {
      const client = await redisManager.getClient();
      return await client.expire(key, seconds);
    } catch (error) {
      logger.warn('Redis EXPIRE error', { key, message: error.message });
      return null;
    }
  },
  async flushAll() {
    try {
      const client = await redisManager.getClient();
      return await client.flushAll();
    } catch (error) {
      logger.warn('Redis FLUSHALL error', { message: error.message });
      return null;
    }
  },
  async quit() {
    return redisManager.disconnect();
  },
  async disconnect() {
    return redisManager.disconnect();
  },
  async isHealthy() {
    return redisManager.isHealthy();
  },
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing Redis connection');
  await redisManager.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing Redis connection');
  await redisManager.disconnect();
  process.exit(0);
});

if (process.env.NODE_ENV === 'development') {
  process.on('SIGUSR2', async () => {
    logger.info('Nodemon restart - cleaning up Redis');
    await redisManager.disconnect();
    process.kill(process.pid, 'SIGUSR2');
  });
}

export { getRedisClient, authLimiter, loginLimiter, redisManager };
export default redis;