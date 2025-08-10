import cron from 'node-cron';
import systemSettingsService from '@services/systemSettings.service.js';
import logger from '@config/logger.js';
import auditLogService from '@services/auditLog.service.js';

const scheduleNTPSync = () => {
  cron.schedule('*/1 * * * *', async () => {
    try {
      const settings = await systemSettingsService.getSystemSettings();
      const { syncInterval } = settings;

      // Only run sync if it's time based on the interval
      const lastSync = await auditLogService.getLastAction('SYNC_NTP');
      const now = new Date();
      if (lastSync && (now - lastSync.createdAt) < syncInterval * 60 * 1000) {
        return;
      }

      const result = await systemSettingsService.syncWithNTPServer();
      await auditLogService.logAction('SYNC_NTP', 'system', 'SystemSettings', { time: result.time }, '127.0.0.1', null);
      logger.info('Scheduled NTP sync completed');
    } catch (error) {
      logger.error(`Scheduled NTP sync failed: ${error.message}`);
    }
  });
};

export default scheduleNTPSync;