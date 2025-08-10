import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '@app.js';
import AdminModel from '@models/superadmin/admin.model.js';
import CoreSystemConfig from '@models/superadmin/coreSystemConfig.model.js';
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
  await CoreSystemConfig.deleteMany({});
});

describe('POST /v1/superadmin/core-system-config', () => {
  it('should create core system config', async () => {
    const settingsData = {
      systemIdentifier: 'xAI EduCore v3.0',
      version: '3.0.1',
      operationalMode: 'production',
      sandboxMode: false,
      ntpServer: 'pool.ntp.org',
      syncInterval: 60,
      timeZone: 'UTC',
      dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      locale: 'en-US',
      language: 'en',
      numberFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
      addressFormat: { street: '', city: '', state: '', postalCode: '', country: '' },
      cache: { enabled: true, host: 'localhost', port: 6379, ttl: 300 },
      encryptionSettings: { enabled: false },
    };
    const response = await request(app)
      .post('/v1/superadmin/core-system-config')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(settingsData)
      .expect(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ ...settingsData, tenantId: tenantId.toString() });
  });

  it('should fail if settings already exist', async () => {
    await CoreSystemConfig.create({ ...settingsData, tenantId });
    const response = await request(app)
      .post('/v1/superadmin/core-system-config')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(settingsData)
      .expect(400);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_ALREADY_EXISTS);
  });
});

describe('GET /v1/superadmin/core-system-config', () => {
  const settingsData = {
    systemIdentifier: 'xAI EduCore v3.0',
    version: '3.0.1',
    operationalMode: 'production',
    sandboxMode: false,
    ntpServer: 'pool.ntp.org',
    syncInterval: 60,
    timeZone: 'UTC',
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
    locale: 'en-US',
    language: 'en',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
    addressFormat: { street: '', city: '', state: '', postalCode: '', country: '' },
    cache: { enabled: true, host: 'localhost', port: 6379, ttl: 300 },
    encryptionSettings: { enabled: false },
    tenantId,
  };

  it('should retrieve core system config', async () => {
    await CoreSystemConfig.create(settingsData);
    const response = await request(app)
      .get('/v1/superadmin/core-system-config')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject(settingsData);
  });

  it('should return 404 if settings not found', async () => {
    const response = await request(app)
      .get('/v1/superadmin/core-system-config')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  });
});

describe('PATCH /v1/superadmin/core-system-config', () => {
  const settingsData = {
    systemIdentifier: 'xAI EduCore v3.0',
    version: '3.0.1',
    operationalMode: 'production',
    sandboxMode: false,
    ntpServer: 'pool.ntp.org',
    syncInterval: 60,
    timeZone: 'UTC',
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
    locale: 'en-US',
    language: 'en',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
    addressFormat: { street: '', city: '', state: '', postalCode: '', country: '' },
    cache: { enabled: true, host: 'localhost', port: 6379, ttl: 300 },
    encryptionSettings: { enabled: false },
    tenantId,
  };

  it('should update core system config', async () => {
    await CoreSystemConfig.create(settingsData);
    const updateData = { language: 'hi' };
    const response = await request(app)
      .patch('/v1/superadmin/core-system-config')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(updateData)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ ...settingsData, ...updateData });
  });

  it('should return 404 if settings not found', async () => {
    const response = await request(app)
      .patch('/v1/superadmin/core-system-config')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ language: 'hi' })
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  });
});

describe('DELETE /v1/superadmin/core-system-config', () => {
  const settingsData = {
    systemIdentifier: 'xAI EduCore v3.0',
    version: '3.0.1',
    operationalMode: 'production',
    sandboxMode: false,
    ntpServer: 'pool.ntp.org',
    syncInterval: 60,
    timeZone: 'UTC',
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
    locale: 'en-US',
    language: 'en',
    numberFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
    addressFormat: { street: '', city: '', state: '', postalCode: '', country: '' },
    cache: { enabled: true, host: 'localhost', port: 6379, ttl: 300 },
    encryptionSettings: { enabled: false },
    tenantId,
  };

  it('should soft delete core system config', async () => {
    await CoreSystemConfig.create(settingsData);
    const response = await request(app)
      .delete('/v1/superadmin/core-system-config')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    const config = await CoreSystemConfig.findOne({ tenantId, isDeleted: true });
    expect(config).toBeTruthy();
  });

  it('should return 404 if settings not found', async () => {
    const response = await request(app)
      .delete('/v1/superadmin/core-system-config')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(404);
    expect(response.body.message).toBe(CONSTANTS.MESSAGES.SETTINGS_NOT_FOUND);
  });
});

describe('POST /v1/superadmin/core-system-config/sync-ntp', () => {
  it('should synchronize with NTP server', async () => {
    await CoreSystemConfig.create({
      systemIdentifier: 'xAI EduCore v3.0',
      version: '3.0.1',
      operationalMode: 'production',
      ntpServer: 'pool.ntp.org',
      syncInterval: 60,
      timeZone: 'UTC',
      tenantId,
    });
    const response = await request(app)
      .post('/v1/superadmin/core-system-config/sync-ntp')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.time).toBeDefined();
  });
});

describe('POST /v1/superadmin/core-system-config/preview-datetime', () => {
  it('should preview date-time format', async () => {
    const previewData = { format: 'YYYY-MM-DD HH:mm:ss', locale: 'en-US' };
    const response = await request(app)
      .post('/v1/superadmin/core-system-config/preview-datetime')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(previewData)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.formatted).toBeDefined();
  });

  it('should return 400 for invalid format', async () => {
    const previewData = { format: 'Invalid', locale: 'en-US' };
    await request(app)
      .post('/v1/superadmin/core-system-config/preview-datetime')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(previewData)
      .expect(400);
  });
});

describe('GET /v1/superadmin/core-system-config/language/:language', () => {
  it('should retrieve language pack', async () => {
    const response = await request(app)
      .get('/v1/superadmin/core-system-config/language/en')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('welcome_message');
  });
});

describe('POST /v1/superadmin/core-system-config/translate', () => {
  it('should translate text', async () => {
    const translateData = { text: 'Welcome to the System', targetLanguage: 'hi' };
    const response = await request(app)
      .post('/v1/superadmin/core-system-config/translate')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send(translateData)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });
});

describe('GET /v1/superadmin/core-system-config/regional-defaults', () => {
  it('should retrieve regional defaults', async () => {
    const response = await request(app)
      .get('/v1/superadmin/core-system-config/regional-defaults')
      .set('Authorization', `Bearer ${superadminToken}`)
      .expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('timeZone');
    expect(response.body.data).toHaveProperty('dateTimeFormat');
    expect(response.body.data).toHaveProperty('locale');
  });
});