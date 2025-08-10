// tests/integration/systemSettings/enterpriseInfra.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '@app.js';
import AdminModel from '@models/superadmin/admin.model.js';
import EnterpriseInfra from '@models/superadmin/enterpriseInfra.model.js';
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
  await EnterpriseInfra.deleteMany({});
});

describe('POST /v1/superadmin/enterprise-infra', () => {
  it('should create enterprise infra config', async () => {
    const settingsData = {
      cloudProviders: ['AWS'],
      dataCenterRegions: ['Mumbai'],
      highAvailabilityCluster: { enabled: true, nodeCount: 5, failoverStrategy: 'Automatic' },
      distributedDatabase: { engine: 'MongoDB', configuration: 'Replicated' },
      automatedBackup: { mode: 'Incremental', storageTypes: ['Cloud'], drSite: 'AWS US-East-1', offsite: true },
      disasterRecovery: { rpo: 5, rto: 15, drSite: 'AWS US-East-1' },
      aiDrivenLoadBalancing: { enabled: true, predictiveScaling: { threshold: 75, scaleFactor: 20 } },
      securitySettings: { encryptionAtRest: true, firewallEnabled: true, wafRules: ['SQLi', 'XSS'] },
    };
    const response = await request(app)
      .post('/v1/superadmin/enterprise-infra')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(settingsData)
      .expect(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ ...settingsData, tenantId: tenantId.toString() });
  });

  it('should fail if settings already exist', async () => {
    await EnterpriseInfra.create({ ...settingsData, tenantId });
    const response = await request(app)
      .post('/v1/superadmin/enterprise-infra')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(settingsData)
      .expect(400);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_ALREADY_EXISTS);
  });
});

describe('GET /v1/superadmin/enterprise-infra', () => {
  const settingsData = {
    cloudProviders: ['AWS'],
    dataCenterRegions: ['Mumbai'],
    highAvailabilityCluster: { enabled: true, nodeCount: 5, failoverStrategy: 'Automatic' },
    distributedDatabase: { engine: 'MongoDB', configuration: 'Replicated' },
    automatedBackup: { mode: 'Incremental', storageTypes: ['Cloud'], drSite: 'AWS US-East-1', offsite: true },
    disasterRecovery: { rpo: 5, rto: 15, drSite: 'AWS US-East-1' },
    aiDrivenLoadBalancing: { enabled: true, predictiveScaling: { threshold: 75, scaleFactor: 20 } },
    securitySettings: { encryptionAtRest: true, firewallEnabled: true, wafRules: ['SQLi', 'XSS'] },
    tenantId,
  };

  it('should retrieve enterprise infra config', async () => {
    await EnterpriseInfra.create(settingsData);
    const response = await request(app)
      .get('/v1/superadmin/enterprise-infra')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject(settingsData);
  });

  it('should return 404 if settings not found', async () => {
    const response = await request(app)
      .get('/v1/superadmin/enterprise-infra')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  });
});

describe('PATCH /v1/superadmin/enterprise-infra', () => {
  const settingsData = {
    cloudProviders: ['AWS'],
    dataCenterRegions: ['Mumbai'],
    highAvailabilityCluster: { enabled: true, nodeCount: 5, failoverStrategy: 'Automatic' },
    distributedDatabase: { engine: 'MongoDB', configuration: 'Replicated' },
    automatedBackup: { mode: 'Incremental', storageTypes: ['Cloud'], drSite: 'AWS US-East-1', offsite: true },
    disasterRecovery: { rpo: 5, rto: 15, drSite: 'AWS US-East-1' },
    aiDrivenLoadBalancing: { enabled: true, predictiveScaling: { threshold: 75, scaleFactor: 20 } },
    securitySettings: { encryptionAtRest: true, firewallEnabled: true, wafRules: ['SQLi', 'XSS'] },
    tenantId,
  };

  it('should update enterprise infra config', async () => {
    await EnterpriseInfra.create(settingsData);
    const updateData = { cloudProviders: ['Azure'] };
    const response = await request(app)
      .patch('/v1/superadmin/enterprise-infra')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(updateData)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ ...settingsData, ...updateData });
  });

  it('should return 404 if settings not found', async () => {
    const response = await request(app)
      .patch('/v1/superadmin/enterprise-infra')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ cloudProviders: ['Azure'] })
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  });
});

describe('DELETE /v1/superadmin/enterprise-infra', () => {
  const settingsData = {
    cloudProviders: ['AWS'],
    dataCenterRegions: ['Mumbai'],
    highAvailabilityCluster: { enabled: true, nodeCount: 5, failoverStrategy: 'Automatic' },
    distributedDatabase: { engine: 'MongoDB', configuration: 'Replicated' },
    automatedBackup: { mode: 'Incremental', storageTypes: ['Cloud'], drSite: 'AWS US-East-1', offsite: true },
    disasterRecovery: { rpo: 5, rto: 15, drSite: 'AWS US-East-1' },
    aiDrivenLoadBalancing: { enabled: true, predictiveScaling: { threshold: 75, scaleFactor: 20 } },
    securitySettings: { encryptionAtRest: true, firewallEnabled: true, wafRules: ['SQLi', 'XSS'] },
    tenantId,
  };

  it('should soft delete enterprise infra config', async () => {
    await EnterpriseInfra.create(settingsData);
    const response = await request(app)
      .delete('/v1/superadmin/enterprise-infra')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    const config = await EnterpriseInfra.findOne({ tenantId, isDeleted: true });
    expect(config).toBeTruthy();
  });

  it('should return 404 if settings not found', async () => {
    const response = await request(app)
      .delete('/v1/superadmin/enterprise-infra')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  });
});

describe('POST /v1/superadmin/enterprise-infra/validate', () => {
  it('should validate infrastructure config', async () => {
    const configData = { cloudProviders: ['AWS'], dataCenterRegions: ['Mumbai'] };
    const response = await request(app)
      .post('/v1/superadmin/enterprise-infra/validate')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(configData)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({ valid: true, issues: [] });
  });

  it('should return 400 for invalid config', async () => {
    const configData = { cloudProviders: ['Invalid'], dataCenterRegions: ['Mumbai'] };
    const response = await request(app)
      .post('/v1/superadmin/enterprise-infra/validate')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(configData)
      .expect(400);
    expect(response.body.success).toBe(false);
  });
});

describe('GET /v1/superadmin/enterprise-infra/status', () => {
  const settingsData = {
    cloudProviders: ['AWS'],
    dataCenterRegions: ['Mumbai'],
    highAvailabilityCluster: { enabled: true, nodeCount: 5, failoverStrategy: 'Automatic' },
    distributedDatabase: { engine: 'MongoDB', configuration: 'Replicated' },
    automatedBackup: { mode: 'Incremental', storageTypes: ['Cloud'], drSite: 'AWS US-East-1', offsite: true },
    tenantId,
  };

  it('should retrieve infrastructure status', async () => {
    await EnterpriseInfra.create(settingsData);
    const response = await request(app)
      .get('/v1/superadmin/enterprise-infra/status')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      cloudProviders: settingsData.cloudProviders,
      regions: settingsData.dataCenterRegions,
      status: 'Operational',
    });
  });

  it('should return 404 if settings not found', async () => {
    const response = await request(app)
      .get('/v1/superadmin/enterprise-infra/status')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  });
});