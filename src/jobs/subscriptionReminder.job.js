import cron from 'node-cron';
import logger from '@config/logger.js';
import emailService from '@services/email.service.js';

const scheduleSubscriptionReminder = () => {
  cron.schedule('0 8 * * *', async () => {
    try {
      logger.info('Running subscription reminder job');
      await emailService.sendSubscriptionReminder();
    } catch (error) {
      logger.error(`Subscription reminder job failed: ${error.message}`);
    }
  });
};

export default { scheduleSubscriptionReminder };