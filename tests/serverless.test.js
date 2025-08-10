import mongoose from 'mongoose';
import { createClient } from 'redis';
import supertest from 'supertest';
import app from '../src/server.js';  // Import app for testing

describe('Serverless DB/Cache Handling', () => {
  let redisClient;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URL_TEST);  // Use test DB
    redisClient = createClient({ url: process.env.REDIS_URL_TEST });
    await redisClient.connect();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await redisClient.disconnect();
  });

  test('MongoDB connection pooling works', async () => {
    const conn = mongoose.connection;
    expect(conn.readyState).toBe(1);  // Connected state
  });

  test('Redis caching works', async () => {
    await redisClient.set('test_key', 'test_value');
    const value = await redisClient.get('test_key');
    expect(value).toBe('test_value');
  });

  test('Version endpoint returns correctly', async () => {
    const response = await supertest(app).get('/api/version');
    expect(response.status).toBe(200);
    expect(response.body.version).toBeDefined();
  });
});