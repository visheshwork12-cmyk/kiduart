import subscriptionService from '@services/systemSettings.service.js';
import subscriptionRepository from '@repositories/subscription.repository.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import CONSTANTS from '@constants/index.js';

jest.mock('@repositories/subscription.repository');

describe('Subscription Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      const subscriptionData = {
        schoolId: 'schoolId',
        plan: 'basic',
        expiryDate: new Date(),
      };
      subscriptionRepository.createSubscription.mockResolvedValue(subscriptionData);

      const result = await subscriptionService.createSubscription(subscriptionData, 'userId', '127.0.0.1');

      expect(subscriptionRepository.createSubscription).toHaveBeenCalledWith(subscriptionData);
      expect(result).toEqual(subscriptionData);
    });

    it('should throw error if subscription creation fails', async () => {
      subscriptionRepository.createSubscription.mockRejectedValue(new Error('Database error'));

      await expect(
        subscriptionService.createSubscription({ schoolId: 'schoolId', plan: 'basic' }, 'userId', '127.0.0.1')
      ).rejects.toThrow(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Database error'));
    });
  });

  describe('updateSubscription', () => {
    it('should update a subscription', async () => {
      const subscription = { _id: 'subscriptionId', plan: 'basic', save: jest.fn().mockResolvedValue() };
      subscriptionRepository.findSubscriptionById.mockResolvedValue(subscription);

      const updateBody = { plan: 'premium' };
      const result = await subscriptionService.updateSubscription('subscriptionId', updateBody, 'userId', '127.0.0.1');

      expect(subscriptionRepository.findSubscriptionById).toHaveBeenCalledWith('subscriptionId');
      expect(subscription.save).toHaveBeenCalled();
      expect(result.plan).toBe('premium');
    });

    it('should throw error if subscription not found', async () => {
      subscriptionRepository.findSubscriptionById.mockResolvedValue(null);

      await expect(
        subscriptionService.updateSubscription('subscriptionId', { plan: 'premium' }, 'userId', '127.0.0.1')
      ).rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, CONSTANTS.MESSAGES.SUBSCRIPTION_NOT_FOUND));
    });
  });
});