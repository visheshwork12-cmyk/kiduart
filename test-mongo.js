import mongoose from 'mongoose';
import logger from '@config/logger.js';

const MONGODB_URL = 'mongodb+srv://SchoolERPUser:SecurePass123@schoolerpcluster.vknsfa8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testMongo() {
  try {
    await mongoose.connect(MONGODB_URL, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      ssl: true,
    });
    logger.info('MongoDB connected successfully');
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB connection failed', {
      message: error.message || 'Unknown error',
      code: error.code || 'N/A',
      name: error.name || 'N/A',
      stack: error.stack || 'N/A',
      reason: error.reason || 'N/A',
      errors: error.errors || 'N/A',
    });
  }
}

testMongo();