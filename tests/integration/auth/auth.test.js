import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createClient } from 'redis-mock';
import app from '@app';
import AdminModel from '@models/superadmin/admin.model';
import tokenService from '@services/token.service';
import config from '@config';
import { getRedisClient } from '@lib/redis';
import bcrypt from 'bcryptjs';

let mongod;
let redisClient;
let adminToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  redisClient = createClient();
  jest.spyOn({ getRedisClient }, 'getRedisClient').mockResolvedValue(redisClient);

  const admin = await AdminModel.create({
    email: 'admin@example.com',
    password: await bcrypt.hash('Password123!', 10),
    name: 'Test Admin',
    role: 'admin',
  });

  adminToken = (await tokenService.generateAuthTokens(admin)).access.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  redisClient.quit();
});

describe('Auth API Integration Tests', () => {
  describe('POST /v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.access).toBeDefined();
      expect(response.body.data.admin.email).toBe('admin@example.com');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials, please try again');
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const tokens = await tokenService.generateAuthTokens(
        await AdminModel.findOne({ email: 'admin@example.com' })
      );

      const response = await request(app)
        .post('/v1/auth/logout')
        .send({ refreshToken: tokens.refresh.token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});