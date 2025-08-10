import logger from '@config/logger.js';

const testRedis = async () => {


  client.on('error', (err) => {
    logger.error('Redis Client Error', { message: err.message, stack: err.stack });
  });

  try {
    await client.connect();
    logger.info('Connected to Redis');
    await client.set('test', 'Redis is working');
    const value = await client.get('test');
    logger.info(`Test value: ${value}`);
    await client.disconnect();
  } catch (err) {
    logger.error('Redis connection error', { message: err.message, stack: err.stack });
  }
};

testRedis();