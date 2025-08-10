// tests/integration/featureFlag.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '@app.js';
import AdminModel from '@models/superadmin/admin.model.js';
import FeatureFlag from '@models/superadmin/featureFlag.model.js';
import tokenService from '@services/token.service.js';
import redis from '@lib/redis.js';
import CONSTANTS from '@constants/index.js';

let mongod;
let superadminToken;
let tenantId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const superadmin = await AdminModel.create({
    email: 'superadmin@xai.com',
    password: 'Password123!',
    role: 'superadmin',
    tenantId: new mongoose.Types.ObjectId(),
  });
  tenantId = superadmin.tenantId;
  superadminToken = tokenService.generateToken(superadmin._id, 'superadmin', tenantId);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  await redis.quit();
});

beforeEach(async () => {
  await FeatureFlag.deleteMany({});
  await redis.flushall();
});

const flagData = {
  name: 'multi_factor_auth',
  enabled: true,
};

describe('POST /v1/superadmin/feature-flag', () => {
  it('should create a feature flag', async () => {
    const response = await request(app)
      .post('/v1/superadmin/feature-flag')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(flagData)
      .expect(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.flags).toContainEqual(expect.objectContaining(flagData));
  });

  it('should return 400 if flag already exists', async () => {
    await FeatureFlag.create({ tenantId, flags: [flagData], isDeleted: false });
    const response = await request(app)
      .post('/v1/superadmin/feature-flag')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(flagData)
      .expect(400);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.FEATURE_FLAG_ALREADY_EXISTS);
  });
});

describe('POST /v1/superadmin/feature-flag/bulk', () => {
  it('should create multiple feature flags', async () => {
    const flags = [{ name: 'multi_factor_auth', enabled: true }, { name: 'compliance_reports', enabled: false }];
    const response = await request(app)
      .post('/v1/superadmin/feature-flag/bulk')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ flags })
      .expect(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.flags).toHaveLength(2);
  });

  it('should return 400 if all flags already exist', async () => {
    await FeatureFlag.create({ tenantId, flags: [flagData], isDeleted: false });
    const response = await request(app)
      .post('/v1/superadmin/feature-flag/bulk')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ flags: [flagData] })
      .expect(400);
    expect(response.body.message).toBe('All provided flags already exist');
  });
});

describe('GET /v1/superadmin/feature-flag', () => {
  it('should retrieve feature flags', async () => {
    await FeatureFlag.create({ tenantId, flags: [flagData], isDeleted: false });
    const response = await request(app)
      .get('/v1/superadmin/feature-flag')
      .set('Authorization', `Bearer ${superadminToken}`)
      .query({ page: 1, limit: 10 })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toContainEqual(expect.objectContaining(flagData));
    expect(response.body.total).toBe(1);
  });

  it('should return 429 for too many requests', async () => {
    await redis.set(`featureFlag:rate:${tenantId}`, 100, 'EX', 3600);
    const response = await request(app)
      .get('/v1/superadmin/feature-flag')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(429);
    expect(response.body.message).toBe('Too many feature flag requests');
  });
});

describe('PATCH /v1/superadmin/feature-flag/:name', () => {
  it('should update a feature flag', async () => {
    await FeatureFlag.create({ tenantId, flags: [flagData], isDeleted: false });
    const response = await request(app)
      .patch(`/v1/superadmin/feature-flag/${flagData.name}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ enabled: false })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.flags).toContainEqual(expect.objectContaining({ name: flagData.name, enabled: false }));
  });

  it('should return 404 if flag not found', async () => {
    const response = await request(app)
      .patch('/v1/superadmin/feature-flag/unknown_flag')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ enabled: false })
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.FEATURE_FLAG_NOT_FOUND);
  });
});

describe('PATCH /v1/superadmin/feature-flag/toggle/:name', () => {
  it('should toggle a feature flag', async () => {
    await FeatureFlag.create({ tenantId, flags: [flagData], isDeleted: false });
    const response = await request(app)
      .patch(`/v1/superadmin/feature-flag/toggle/${flagData.name}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.flags).toContainEqual(expect.objectContaining({ name: flagData.name, enabled: false }));
  });

  it('should return 404 if flag not found', async () => {
    const response = await request(app)
      .patch('/v1/superadmin/feature-flag/toggle/unknown_flag')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.FEATURE_FLAG_NOT_FOUND);
  });
});

describe('DELETE /v1/superadmin/feature-flag/:name', () => {
  it('should delete a feature flag', async () => {
    await FeatureFlag.create({ tenantId, flags: [flagData], isDeleted: false });
    const response = await request(app)
      .delete(`/v1/superadmin/feature-flag/${flagData.name}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    const flags = await FeatureFlag.findOne({ tenantId });
    expect(flags.flags.find(f => f.name === flagData.name).isDeleted).toBe(true);
  });

  it('should return 404 if flag not found', async () => {
    const response = await request(app)
      .delete('/v1/superadmin/feature-flag/unknown_flag')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.FEATURE_FLAG_NOT_FOUND);
  });
});

describe('POST /v1/superadmin/feature-flag/purge-cache', () => {
  it('should purge feature flag cache', async () => {
    await redis.set(`featureFlag:${tenantId}:1:10`, JSON.stringify({ data: [flagData], total: 1 }));
    const response = await request(app)
      .post('/v1/superadmin/feature-flag/purge-cache')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    const cached = await redis.get(`featureFlag:${tenantId}:1:10`);
    expect(cached).toBeNull();
  });
});