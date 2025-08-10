import cron from 'node-cron';
import logger from '@config/logger.js';
import emailService from '@services/email.service.js';

const scheduleNotification = () => {
  // Example: Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running notification job');
      // TODO: Implement logic to fetch pending notifications and send them
      // Example: await emailService.sendNotification(email, details);
    } catch (error) {
      logger.error(`Notification job failed: ${error.message}`);
    }
  });
};

export default { scheduleNotification };