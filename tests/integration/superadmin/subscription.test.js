import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createClient } from 'redis-mock';
import app from '@app';
import AdminModel from '@models/superadmin/admin.model.js';
import RoleModel from '@models/superadmin/role.model.js';
import SubscriptionModel from '@models/superadmin/subscription.model.js';
import tokenService from '@services/token.service.js';
import config from '@config';
import { getRedisClient } from '@lib/redis.js';
import bcrypt from 'bcryptjs';

let mongod;
let redisClient;
let superadminToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  redisClient = createClient();
  jest.spyOn({ getRedisClient }, 'getRedisClient').mockResolvedValue(redisClient);

  await RoleModel.create({
    name: 'superadmin',
    permissions: ['manage_subscriptions'],
  });

  const superadmin = await AdminModel.create({
    email: 'superadmin@example.com',
    password: await bcrypt.hash('Password123!', 10),
    name: 'Super Admin',
    role: 'superadmin',
  });

  superadminToken = (await tokenService.generateAuthTokens(superadmin)).access.token;

  await SubscriptionModel.create({
    schoolId: new mongoose.Types.ObjectId(),
    plan: 'basic',
    status: 'active',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  redisClient.quit();
});

describe('Subscription API Integration Tests', () => {
  describe('POST /v1/superadmin/subscriptions', () => {
    it('should create a new subscription', async () => {
      const subscriptionData = {
        schoolId: new mongoose.Types.ObjectId().toString(),
        plan: 'premium',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post('/v1/superadmin/subscriptions')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(subscriptionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.plan).toBe(subscriptionData.plan);
    });
  });

  describe('GET /v1/superadmin/subscriptions', () => {
    it('should retrieve paginated subscriptions', async () => {
      const response = await request(app)
        .get('/v1/superadmin/subscriptions?page=1&limit=10')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeInstanceOf(Array);
    });
  });
});