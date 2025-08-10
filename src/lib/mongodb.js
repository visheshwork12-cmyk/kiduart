import mongoose from 'mongoose';
import logger from '@config/logger.js';
import config from '@config/index.js';

const isServerless = process.env.VERCEL || process.env.LAMBDA_TASK_ROOT;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Modified: Export warmupMongo function to be used in server.js
export async function warmupMongo() {
  try {
    logger.debug('Warming up MongoDB connection...');
    const conn = await connectToDatabase();
    await conn.connection.db.admin().ping(); // Test connection
    logger.debug('MongoDB warmup successful');
  } catch (error) {
    logger.warn('MongoDB warmup failed', { message: error.message });
  }
}

// Call warmup on startup in non-serverless environments
if (!isServerless) {
  warmupMongo();
}

export async function connectToDatabase() {
  if (cached.conn && cached.conn.readyState === 1) {
    logger.debug('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      ...config.mongoose.options,
      maxPoolSize: isServerless ? 2 : 5, // Reduced pool for serverless to avoid resource exhaustion
      minPoolSize: isServerless ? 0 : 1,
      maxIdleTimeMS: isServerless ? 10000 : 30000, // Shorter idle time in serverless to free resources
      serverSelectionTimeoutMS: isServerless ? 3000 : 5000,
      socketTimeoutMS: isServerless ? 10000 : 45000,
      bufferCommands: !isServerless,
      bufferMaxEntries: isServerless ? 0 : -1,
      autoIndex: !isServerless, // Disable autoIndex in serverless to reduce startup time
      keepAlive: !isServerless, // Disable keepAlive in serverless to prevent long-lived connections
      family: 4, // Force IPv4 to avoid DNS resolution issues in some environments
    };

    cached.promise = mongoose.connect(config.mongoose.url, opts);
  }

  try {
    cached.conn = await cached.promise;
    logger.info('MongoDB connected successfully', { url: config.mongoose.url });
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    logger.error('MongoDB connection failed', {
      message: error.message || 'Unknown error',
      code: error.code || 'N/A',
      name: error.name || 'N/A',
      stack: error.stack || 'N/A',
      reason: error.reason || 'N/A',
      errors: error.errors || 'N/A',
      url: config.mongoose.url,
    });
    throw error;
  }
}

// New: Lifecycle cleanup - disconnect idle connections
export async function disconnect() {
  if (cached.conn && cached.conn.readyState === 1) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    logger.info('MongoDB disconnected');
  }
}

// Modified: Include warmupMongo in default export
export default { connectToDatabase, disconnect, warmupMongo };