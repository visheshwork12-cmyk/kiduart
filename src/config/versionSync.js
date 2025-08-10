import CoreSystemConfig from '@models/superadmin/coreSystemConfig.model.js';
import VersionHistory from '@models/superadmin/versionHistory.model.js';
import logger from '@config/logger.js';
import { getRedisClient } from '@lib/redis.js';

// Dynamically import package.json
const packageJson = await import('../../package.json', { with: { type: 'json' } }).then(module => module.default);

const syncVersion = async (tenantId = null, releaseNotes = '', commitHash = 'unknown') => {
  try {
    const { version } = packageJson;
    const query = tenantId ? { tenantId, isDeleted: false } : { isDeleted: false };
    const existingConfig = await CoreSystemConfig.findOne(query).exec();

    if (existingConfig) {
      if (existingConfig.version !== version) {
        existingConfig.version = version;
        await existingConfig.save();
        logger.info(`CoreSystemConfig version updated to ${version} for tenant ${tenantId || 'global'}`);
      } else {
        logger.info(`CoreSystemConfig version already up-to-date: ${version} for tenant ${tenantId || 'global'}`);
      }
    } else {
      await CoreSystemConfig.create({
        tenantId,
        systemIdentifier: 'xAI EduCore',
        version,
        operationalMode: 'production',
        sandboxMode: false,
        ntpServer: 'pool.ntp.org',
        fallbackNtpServers: ['time.google.com', 'time.windows.com'],
        syncInterval: 60,
        timeZone: 'UTC',
        dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
        locale: 'en-US',
        language: 'en',
        numberFormat: { decimalSeparator: '.', thousandsSeparator: ',' },
        addressFormat: { street: '', city: '', state: '', postalCode: '', country: '' },
        cache: { enabled: true, host: 'localhost', port: 6379, ttl: 300 },
        encryptionSettings: { enabled: false, algorithm: 'AES-256', keyRotationInterval: 30 },
        isDeleted: false,
      });
      logger.info(`CoreSystemConfig created with version ${version} for tenant ${tenantId || 'global'}`);
    }

    // Store version history
    const existingHistory = await VersionHistory.findOne({ version, tenantId, isDeleted: false }).exec();
    if (!existingHistory) {
      await VersionHistory.create({
        tenantId,
        version,
        releaseDate: new Date(),
        releaseNotes,
        commitHash,
        isDeleted: false,
      });
      logger.info(`Version history recorded: ${version} for tenant ${tenantId || 'global'}`);
    }

    const cacheKey = tenantId ? `coreSystemConfig:version:${tenantId}` : 'coreSystemConfig:version';
    const client = await getRedisClient();
    try {
      await client.setEx(cacheKey, 3600, version);
      logger.info(`Version ${version} cached in Redis for tenant ${tenantId || 'global'}`);
    } catch (cacheError) {
      logger.warn(`Failed to cache version: ${cacheError.message}`);
    }
  } catch (error) {
    logger.error(`Failed to sync version: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

export default { syncVersion };