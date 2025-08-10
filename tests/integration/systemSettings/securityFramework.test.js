// tests/integration/securityFramework.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '@app.js';
import AdminModel from '@models/superadmin/admin.model.js';
import SecurityFramework from '@models/superadmin/securityFramework.model.js';
import FeatureFlags from '@models/superadmin/featureFlag.model.js';
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
  await FeatureFlags.create({
    tenantId,
    flags: [
      { name: 'multi_factor_auth', enabled: true },
      { name: 'compliance_reports', enabled: true },
      { name: 'data_masking', enabled: true },
    ],
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  await redis.quit();
});

beforeEach(async () => {
  await SecurityFramework.deleteMany({});
  await redis.flushall();
});

const settingsData = {
  authenticationStack: {
    methods: ['Email OTP', 'SMS OTP'],
    email: { enabled: true, smtpServer: 'smtp.example.com', smtpPort: 587 },
    sms: { enabled: true, provider: 'Twilio' },
    appBased: { enabled: false },
  },
  encryption: { standard: 'AES-256', keyRotationFrequency: 90 },
  ipGeofencing: { enabled: true, whitelist: ['192.168.1.1'], blacklist: [], geoIpDatabase: 'GeoLite2' },
  sessionGovernance: { idleTimeout: 15, concurrentLimit: 5 },
  complianceSuite: {
    standards: ['ISO 27001', 'GDPR'],
    auditLogs: { enabled: true, retentionPeriod: 365 },
    reportGeneration: { enabled: true, format: 'PDF' },
  },
  dataMasking: { enabled: true, fields: ['Aadhaar', 'Phone', 'Email', 'Name'], policy: 'Partial' },
  tokenBlacklist: { enabled: true, maxTokens: 1000 },
  tenantId,
};

describe('POST /v1/superadmin/security-framework', () => {
  it('should create security framework config', async () => {
    const response = await request(app)
      .post('/v1/superadmin/security-framework')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(settingsData)
      .expect(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject(settingsData);
  });

  it('should fail if settings already exist', async () => {
    await SecurityFramework.create({ ...settingsData, tenantId });
    const response = await request(app)
      .post('/v1/superadmin/security-framework')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(settingsData)
      .expect(400);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_ALREADY_EXISTS);
  });
});

describe('GET /v1/superadmin/security-framework', () => {
  it('should retrieve security framework config', async () => {
    await SecurityFramework.create(settingsData);
    const response = await request(app)
      .get('/v1/superadmin/security-framework')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject(settingsData);
  });

  it('should return 404 if settings not found', async () => {
    const response = await request(app)
      .get('/v1/superadmin/security-framework')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  });
});

describe('PATCH /v1/superadmin/security-framework', () => {
  it('should update security framework config', async () => {
    await SecurityFramework.create(settingsData);
    const updateData = { encryption: { standard: 'RSA-2048' } };
    const response = await request(app)
      .patch('/v1/superadmin/security-framework')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(updateData)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ ...settingsData, ...updateData });
  });

  it('should return 404 if settings not found', async () => {
    const response = await request(app)
      .patch('/v1/superadmin/security-framework')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ encryption: { standard: 'RSA-2048' } })
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  });
});

describe('DELETE /v1/superadmin/security-framework', () => {
  it('should soft delete security framework config', async () => {
    await SecurityFramework.create(settingsData);
    const response = await request(app)
      .delete('/v1/superadmin/security-framework')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    const config = await SecurityFramework.findOne({ tenantId, isDeleted: true });
    expect(config).toBeTruthy();
  });

  it('should return 404 if settings not found', async () => {
    const response = await request(app)
      .delete('/v1/superadmin/security-framework')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  });
});

describe('POST /v1/superadmin/security-framework/send-otp', () => {
  it('should send email OTP', async () => {
    await SecurityFramework.create(settingsData);
    const response = await request(app)
      .post('/v1/superadmin/security-framework/send-otp')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ email: 'test@xai.com' })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('otp_sent_email');
  });

  it('should send SMS OTP', async () => {
    await SecurityFramework.create(settingsData);
    const response = await request(app)
      .post('/v1/superadmin/security-framework/send-otp')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ phone: '+1234567890' })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('otp_sent_phone');
  });

  it('should return 429 for too many OTP requests', async () => {
    await SecurityFramework.create(settingsData);
    await redis.set(`otp:rate:${tenantId}:${mongoose.Types.ObjectId()}`, 3, 'EX', 3600);
    const response = await request(app)
      .post('/v1/superadmin/security-framework/send-otp')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ email: 'test@xai.com' })
      .expect(429);
    expect(response.body.message).toBe('Too many OTP requests');
  });
});

describe('POST /v1/superadmin/security-framework/verify-otp', () => {
  it('should verify OTP', async () => {
    await SecurityFramework.create(settingsData);
    await redis.set(`otp:${tenantId}:${mongoose.Types.ObjectId()}`, '123456', 'EX', 300);
    const response = await request(app)
      .post('/v1/superadmin/security-framework/verify-otp')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ otp: '123456', userId: mongoose.Types.ObjectId() })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('otp_verified');
  });

  it('should return 400 for invalid OTP', async () => {
    await SecurityFramework.create(settingsData);
    await redis.set(`otp:${tenantId}:${mongoose.Types.ObjectId()}`, '123456', 'EX', 300);
    const response = await request(app)
      .post('/v1/superadmin/security-framework/verify-otp')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ otp: '654321', userId: mongoose.Types.ObjectId() })
      .expect(400);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.INVALID_OTP);
  });
});

describe('POST /v1/superadmin/security-framework/encrypt', () => {
  it('should encrypt data', async () => {
    await SecurityFramework.create(settingsData);
    const response = await request(app)
      .post('/v1/superadmin/security-framework/encrypt')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ data: 'test data' })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('encryptedData');
    expect(response.body.data).toHaveProperty('iv');
    expect(response.body.data).toHaveProperty('key');
  });
});

describe('POST /v1/superadmin/security-framework/decrypt', () => {
  it('should decrypt data', async () => {
    await SecurityFramework.create(settingsData);
    const { body } = await request(app)
      .post('/v1/superadmin/security-framework/encrypt')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ data: 'test data' })
      .expect(200);
    const response = await request(app)
      .post('/v1/superadmin/security-framework/decrypt')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ encryptedData: body.data.encryptedData, iv: body.data.iv, key: body.data.key })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBe('test data');
  });
});

describe('POST /v1/superadmin/security-framework/check-ip', () => {
  it('should allow whitelisted IP', async () => {
    await SecurityFramework.create(settingsData);
    const response = await request(app)
      .post('/v1/superadmin/security-framework/check-ip')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ ip: '192.168.1.1' })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.allowed).toBe(true);
  });
});

describe('POST /v1/superadmin/security-framework/compliance-report', () => {
  it('should generate compliance report', async () => {
    await SecurityFramework.create(settingsData);
    const response = await request(app)
      .post('/v1/superadmin/security-framework/compliance-report')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.report).toMatchObject({
      standards: ['ISO 27001', 'GDPR'],
      auditLogs: 'Logs retained for 365 days',
      encryption: 'AES-256',
    });
  });
});

describe('POST /v1/superadmin/security-framework/mask-data', () => {
  it('should mask Aadhaar data', async () => {
    await SecurityFramework.create(settingsData);
    const response = await request(app)
      .post('/v1/superadmin/security-framework/mask-data')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ data: '1234-5678-9012', field: 'Aadhaar' })
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBe('XXXX-XXXX-9012');
  });
});

describe('GET /v1/superadmin/security-framework/status', () => {
  it('should retrieve security status', async () => {
    await SecurityFramework.create(settingsData);
    const response = await request(app)
      .get('/v1/superadmin/security-framework/status')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      authentication: 'Configured',
      encryption: 'Active',
      ipGeofencing: 'Enabled',
      compliance: 'Compliant',
      dataMasking: 'Enabled',
    });
  });
});

describe('POST /v1/superadmin/security-framework/rotate-key', () => {
  it('should rotate encryption key', async () => {
    await SecurityFramework.create(settingsData);
    const response = await request(app)
      .post('/v1/superadmin/security-framework/rotate-key')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('key_rotated');
  });
});