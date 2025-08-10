// tests/integration/role.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '@app.js';
import AdminModel from '@models/superadmin/admin.model.js';
import Role from '@models/superadmin/role.model.js';
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
  await Role.deleteMany({});
  await redis.flushall();
});

const roleData = {
  name: 'admin',
  permissions: ['roles:read', 'roles:write'],
};

describe('POST /v1/superadmin/role', () => {
  it('should create a role', async () => {
    const response = await request(app)
      .post('/v1/superadmin/role')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(roleData)
      .expect(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject(roleData);
  });

  it('should return 400 if role already exists', async () => {
    await Role.create({ ...roleData, tenantId, isDeleted: false });
    const response = await request(app)
      .post('/v1/superadmin/role')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(roleData)
      .expect(400);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.ROLE_ALREADY_EXISTS);
  });
});

describe('POST /v1/superadmin/role/bulk', () => {
  it('should create multiple roles', async () => {
    const roles = [roleData, { name: 'editor', permissions: ['roles:read'] }];
    const response = await request(app)
      .post('/v1/superadmin/role/bulk')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ roles })
      .expect(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
  });

  it('should return 400 if all roles already exist', async () => {
    await Role.create({ ...roleData, tenantId, isDeleted: false });
    const response = await request(app)
      .post('/v1/superadmin/role/bulk')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ roles: [roleData] })
      .expect(400);
    expect(response.body.message).toBe('All provided roles already exist');
  });
});

describe('GET /v1/superadmin/role', () => {
  it('should retrieve roles', async () => {
    await Role.create({ ...roleData, tenantId, isDeleted: false });
    const response = await request(app)
      .get('/v1/superadmin/role')
      .set('Authorization', `Bearer ${superadminToken}`)
      .query({ page: 1, limit: 10 })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toContainEqual(expect.objectContaining(roleData));
    expect(response.body.total).toBe(1);
  });

  it('should return 429 for too many requests', async () => {
    await redis.set(`role:rate:${tenantId}`, 100, 'EX', 3600);
    const response = await request(app)
      .get('/v1/superadmin/role')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(429);
    expect(response.body.message).toBe('Too many role requests');
  });
});

describe('GET /v1/superadmin/role/:id', () => {
  it('should retrieve a role by ID', async () => {
    const role = await Role.create({ ...roleData, tenantId, isDeleted: false });
    const response = await request(app)
      .get(`/v1/superadmin/role/${role._id}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject(roleData);
  });

  it('should return 404 if role not found', async () => {
    const response = await request(app)
      .get(`/v1/superadmin/role/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.ROLE_NOT_FOUND);
  });
});

describe('PATCH /v1/superadmin/role/:id', () => {
  it('should update a role', async () => {
    const role = await Role.create({ ...roleData, tenantId, isDeleted: false });
    const response = await request(app)
      .patch(`/v1/superadmin/role/${role._id}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ permissions: ['roles:read'] })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.permissions).toEqual(['roles:read']);
  });

  it('should return 404 if role not found', async () => {
    const response = await request(app)
      .patch(`/v1/superadmin/role/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ permissions: ['roles:read'] })
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.ROLE_NOT_FOUND);
  });
});

describe('DELETE /v1/superadmin/role/:id', () => {
  it('should delete a role', async () => {
    const role = await Role.create({ ...roleData, tenantId, isDeleted: false });
    const response = await request(app)
      .delete(`/v1/superadmin/role/${role._id}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    const updatedRole = await Role.findOne({ _id: role._id, tenantId });
    expect(updatedRole.isDeleted).toBe(true);
  });

  it('should return 404 if role not found', async () => {
    const response = await request(app)
      .delete(`/v1/superadmin/role/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.ROLE_NOT_FOUND);
  });
});

describe('GET /v1/superadmin/role/:id/permissions', () => {
  it('should retrieve role permissions', async () => {
    const role = await Role.create({ ...roleData, tenantId, isDeleted: false });
    const response = await request(app)
      .get(`/v1/superadmin/role/${role._id}/permissions`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(roleData.permissions);
  });

  it('should return 404 if role not found', async () => {
    const response = await request(app)
      .get(`/v1/superadmin/role/${new mongoose.Types.ObjectId()}/permissions`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.ROLE_NOT_FOUND);
  });
});

describe('POST /v1/superadmin/role/purge-cache', () => {
  it('should purge role cache', async () => {
    await redis.set(`role:${tenantId}:1:10`, JSON.stringify({ data: [roleData], total: 1 }));
    const response = await request(app)
      .post('/v1/superadmin/role/purge-cache')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    const cached = await redis.get(`role:${tenantId}:1:10`);
    expect(cached).toBeNull();
  });
});