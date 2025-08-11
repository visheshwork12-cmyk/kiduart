import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createClient } from 'redis-mock';
import app from '@app';
import AdminModel from '@models/superadmin/admin.model.js';
import RoleModel from '@models/superadmin/role.model.js';
import SchoolModel from '@models/superadmin/school.model.js';
import tokenService from '@services/token.service.js';
import bcrypt from 'bcryptjs';
import { getRedisClient } from '@lib/redis.js';

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
    permissions: ['manage_schools'],
  });

  const superadmin = await AdminModel.create({
    email: 'superadmin@example.com',
    password: await bcrypt.hash('Password123!', 10),
    name: 'Super Admin',
    role: 'superadmin',
  });

  superadminToken = (await tokenService.generateAuthTokens(superadmin)).access.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  redisClient.quit();
});

describe('School API Integration Tests', () => {
  describe('POST /v1/superadmin/schools', () => {
    it('should create a new school', async () => {
      const schoolData = {
        name: 'Test School',
        email: 'school@example.com',
        phone: '1234567890',
        address: '123 School St',
      };

      const response = await request(app)
        .post('/v1/superadmin/schools')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(schoolData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(schoolData.name);
      expect(response.body.data.email).toBe(schoolData.email);
    });

    it('should fail if not authenticated', async () => {
      const response = await request(app)
        .post('/v1/superadmin/schools')
        .send({
          name: 'Test School',
          email: 'school@example.com',
          phone: '1234567890',
          address: '123 School St',
        })
        .expect(401);

      expect(response.body.message).toBe('Please add authentication token');
    });
  });

  describe('GET /v1/superadmin/schools', () => {
    it('should retrieve paginated schools', async () => {
      await SchoolModel.create({
        name: 'Test School',
        email: 'school@example.com',
        phone: '1234567890',
        address: '123 School St',
      });

      const response = await request(app)
        .get('/v1/superadmin/schools?page=1&limit=10')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeInstanceOf(Array);
      expect(response.body.data.results[0].name).toBe('Test School');
    });
  });
});