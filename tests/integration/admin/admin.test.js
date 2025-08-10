import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createClient } from 'redis-mock';
import app from '@app';
import AdminModel from '@models/superadmin/admin.model';
import RoleModel from '@models/superadmin/role.model';
import tokenService from '@services/token.service';
import config from '@config';
import { getRedisClient } from '@lib/redis';

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
    permissions: ['manage_admins', 'manage_schools', 'manage_subscriptions'],
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

describe('Admin API Integration Tests', () => {
  describe('POST /v1/superadmin/admins', () => {
    it('should create a new admin with superadmin role', async () => {
      const adminData = {
        email: 'newadmin@example.com',
        name: 'New Admin',
        password: 'Password123!',
        role: 'admin',
      };

      const response = await request(app)
        .post('/v1/superadmin/admins')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send(adminData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(adminData.email);
      expect(response.body.data.role).toBe(adminData.role);
    });

    it('should fail if not authenticated', async () => {
      const response = await request(app)
        .post('/v1/superadmin/admins')
        .send({
          email: 'newadmin@example.com',
          name: 'New Admin',
          password: 'Password123!',
          role: 'admin',
        })
        .expect(401);

      expect(response.body.message).toBe('Please add authentication token');
    });
  });

  describe('GET /v1/superadmin/admins', () => {
    it('should retrieve paginated admins', async () => {
      const response = await request(app)
        .get('/v1/superadmin/admins?page=1&limit=10')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeInstanceOf(Array);
    });
  });
});