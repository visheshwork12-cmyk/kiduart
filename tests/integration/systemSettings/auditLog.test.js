// tests/integration/auditLog.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '@app.js';
import AdminModel from '@models/superadmin/admin.model.js';
import SystemSettingsHistory from '@models/superadmin/systemSettingsHistory.model.js';
import SecurityFramework from '@models/superadmin/securityFramework.model.js';
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
  await SystemSettingsHistory.deleteMany({});
  await SecurityFramework.deleteMany({});
  await redis.flushall();
});

const auditLogData = {
  tenantId,
  module: 'securityFramework',
  action: 'create',
  previousValue: {},
  newValue: { encryption: { standard: 'AES-256' } },
  changedBy: new mongoose.Types.ObjectId(),
  ipAddress: '127.0.0.1',
};

describe('GET /v1/superadmin/audit-log', () => {
  it('should retrieve audit logs', async () => {
    await SystemSettingsHistory.create(auditLogData);
    const response = await request(app)
      .get('/v1/superadmin/audit-log')
      .set('Authorization', `Bearer ${superadminToken}`)
      .query({ module: 'securityFramework', page: 1, limit: 10 })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0]).toMatchObject({
      module: 'securityFramework',
      action: 'create',
    });
  });

  it('should return 429 for too many requests', async () => {
    await redis.set(`auditLog:rate:${tenantId}`, 100, 'EX', 3600);
    const response = await request(app)
      .get('/v1/superadmin/audit-log')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(429);
    expect(response.body.message).toBe('Too many audit log requests');
  });
});

describe('POST /v1/superadmin/audit-log/rollback/:historyId', () => {
  it('should rollback settings', async () => {
    await SecurityFramework.create({ tenantId, encryption: { standard: 'RSA-2048' }, isDeleted: false });
    const history = await SystemSettingsHistory.create(auditLogData);
    const response = await request(app)
      .post(`/v1/superadmin/audit-log/rollback/${history._id}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.encryption.standard).toBe('AES-256');
  });

  it('should return 404 if history not found', async () => {
    const response = await request(app)
      .post(`/v1/superadmin/audit-log/rollback/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe('Audit log entry not found');
  });
});

describe('DELETE /v1/superadmin/audit-log/delete', () => {
  it('should delete audit logs', async () => {
    await SystemSettingsHistory.create(auditLogData);
    const response = await request(app)
      .delete('/v1/superadmin/audit-log/delete')
      .set('Authorization', `Bearer ${superadminToken}`)
      .query({ module: 'securityFramework' })
      .expect(200);
    expect(response.body.success).toBe(true);
    const logs = await SystemSettingsHistory.find({ tenantId, module: 'securityFramework' });
    expect(logs).toHaveLength(0);
  });

  it('should return 404 if no logs found', async () => {
    const response = await request(app)
      .delete('/v1/superadmin/audit-log/delete')
      .set('Authorization', `Bearer ${superadminToken}`)
      .query({ module: 'securityFramework' })
      .expect(404);
    expect(response.body.message).toBe('No audit logs found to delete');
  });
});

describe('GET /v1/superadmin/audit-log/stats', () => {
  it('should retrieve audit log stats', async () => {
    await SystemSettingsHistory.create(auditLogData);
    const response = await request(app)
      .get('/v1/superadmin/audit-log/stats')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          module: 'securityFramework',
          action: 'create',
          count: 1,
          userCount: 1,
        }),
      ])
    );
  });

  it('should return 429 for too many requests', async () => {
    await redis.set(`auditLog:stats:rate:${tenantId}`, 50, 'EX', 3600);
    const response = await request(app)
      .get('/v1/superadmin/audit-log/stats')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(429);
    expect(response.body.message).toBe('Too many audit log stats requests');
  });
});

describe('POST /v1/superadmin/audit-log/purge-cache', () => {
  it('should purge audit log cache', async () => {
    await redis.set(`auditLog:${tenantId}:test`, 'test');
    const response = await request(app)
      .post('/v1/superadmin/audit-log/purge-cache')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    const cached = await redis.get(`auditLog:${tenantId}:test`);
    expect(cached).toBeNull();
  });
});