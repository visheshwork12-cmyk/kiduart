import cron from 'node-cron';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createClient } from 'redis-mock';
import emailService from '@services/email.service';
import logger from '@config/logger.js';
import { scheduleNotification } from '@jobs/notification.job';
import SubscriptionModel from '@models/superadmin/subscription.model';
import { getRedisClient } from '@lib/redis';

jest.mock('node-cron');
jest.mock('@services/email.service');
jest.mock('@config/logger.js');

let mongod;
let redisClient;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  redisClient = createClient();
  jest.spyOn({ getRedisClient }, 'getRedisClient').mockResolvedValue(redisClient);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  redisClient.quit();
});

describe('Notification Job Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should schedule notification job and send emails', async () => {
    const subscription = {
      _id: 'subscriptionId',
      schoolId: new mongoose.Types.ObjectId(),
      plan: 'basic',
      status: 'active',
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      school: { email: 'school@example.com' },
    };

    SubscriptionModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([subscription]),
    });

    emailService.sendSubscriptionReminderEmail = jest.fn().mockResolvedValue();
    cron.schedule = jest.fn().mockImplementation((_, callback) => {
      callback();
      return { destroy: jest.fn() };
    });

    await scheduleNotification();

    expect(cron.schedule).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
    expect(SubscriptionModel.find).toHaveBeenCalledWith({
      status: 'active',
      expiryDate: expect.any(Object),
    });
    expect(emailService.sendSubscriptionReminderEmail).toHaveBeenCalledWith(
      'school@example.com',
      subscription
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Subscription reminder sent to school@example.com for subscription ID subscriptionId')
    );
  });

  it('should mark subscription as expired if past expiry date', async () => {
    const subscription = {
      _id: 'subscriptionId',
      schoolId: new mongoose.Types.ObjectId(),
      plan: 'basic',
      status: 'active',
      expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      school: { email: 'school@example.com' },
      save: jest.fn().mockResolvedValue(),
    };

    SubscriptionModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue([subscription]),
    });

    cron.schedule = jest.fn().mockImplementation((_, callback) => {
      callback();
      return { destroy: jest.fn() };
    });

    await scheduleNotification();

    expect(subscription.save).toHaveBeenCalled();
    expect(subscription.status).toBe('expired');
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Subscription ID subscriptionId marked as expired')
    );
  });
});