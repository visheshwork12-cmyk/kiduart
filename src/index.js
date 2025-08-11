import mongoose from 'mongoose';
import logger from '@config/logger.js';
import config from '@config/index.js';
import RoleModel from '@models/superadmin/role.model.js';
import redis from '@lib/redis.js';
import scheduleNTPSync from '@jobs/ntpSync.job.js';
import versionSync from '@config/versionSync.js';

let isInitialized = false;
let dbConnected = false;
let mongooseConnection = null;

const isServerless = process.env.VERCEL || process.env.LAMBDA_TASK_ROOT;

export const connectDB = async (retries = 5, delay = 5000) => {
  if (dbConnected && mongooseConnection?.readyState === 1) {
    logger.debug('Reusing MongoDB connection');
    return mongooseConnection;
  }

  try {
    if (mongooseConnection?.readyState !== 0) {
      await mongoose.disconnect();
    }

    mongooseConnection = await mongoose.connect(config.mongoose.url, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      ssl: true,
      maxPoolSize: isServerless ? 2 : 5,
      minPoolSize: isServerless ? 0 : 1,
      maxIdleTimeMS: isServerless ? 10000 : 30000,
    });

    dbConnected = true;
    logger.info('MongoDB Connected', { url: config.mongoose.url });
    return mongooseConnection;
  } catch (error) {
    logger.error('MongoDB connection failed', {
      message: error.message || 'Unknown error',
      code: error.code || 'N/A',
      name: error.name || 'N/A',
      stack: error.stack || 'N/A',
      reason: error.reason || 'N/A',
      errors: error.errors || 'N/A',
      url: config.mongoose.url,
    });
    if (retries > 0) {
      logger.info(`Retrying MongoDB connection (${retries} attempts left)...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectDB(retries - 1, Math.min(delay * 1.5, 30000));
    }
    throw error;
  }
};

const initRoles = async () => {
  try {
    const count = await RoleModel.countDocuments();
    logger.info(`Found ${count} roles in MongoDB`);
    if (count === 0) {
      await RoleModel.create([
        {
          name: 'superadmin',
          permissions: ['manageAdmins', 'getAdmins', 'updateProfile', 'changePassword', 'manageRoles'],
        },
        {
          name: 'admin',
          permissions: ['updateProfile', 'changePassword'],
        },
      ]);
      logger.info('Default roles initialized');
    }
  } catch (error) {
    logger.warn('Failed to initialize roles', { message: error.message, stack: error.stack });
  }
};

export const initializeServices = async () => {
  if (isInitialized) {
    logger.debug('Services already initialized');
    return;
  }

  try {
    logger.info('Initializing services...');

    await connectDB();

    try {
      const isRedisHealthy = await redis.isHealthy();
      if (isRedisHealthy) {
        logger.info('Redis service initialized successfully');
      } else {
        logger.warn('Redis service not available - continuing with degraded functionality');
      }
    } catch (error) {
      logger.warn('Redis initialization failed - continuing without Redis', {
        message: error.message,
        stack: error.stack,
      });
    }


    await initRoles();


    try {
      await versionSync.syncVersion(null, 'System initialization', process.env.COMMIT_HASH || 'unknown');
      logger.info('Version sync completed');
    } catch (error) {
      logger.warn('Version sync failed', { message: error.message, stack: error.stack });
    }

    if (!isServerless) {
      try {
        scheduleNTPSync();
        logger.info('NTP sync job scheduled');
      } catch (error) {
        logger.warn('NTP sync scheduling failed', { message: error.message, stack: error.stack });
      }
    }

    isInitialized = true;
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Service initialization failed', { message: error.message, stack: error.stack });
  }
};

export const cleanup = async () => {
  try {
    if (mongooseConnection?.readyState === 1) {
      await mongoose.disconnect();
      dbConnected = false;
      mongooseConnection = null;
      logger.info('MongoDB disconnected');
    }

    await redis.disconnect();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Cleanup failed', { message: error.message, stack: error.stack });
  }
};

// Prevent direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  logger.warn('Running index.js directly - use server.js for local/serverless execution');
}