import express from 'express';
import catchAsync from '@utils/catchAsync.js';
import responseFormatter from '@utils/responseFormatter.js';
import httpStatus from 'http-status';
import CoreSystemConfig from '@models/superadmin/coreSystemConfig.model.js';
import VersionHistory from '@models/superadmin/versionHistory.model.js';
import { getRedisClient } from '@lib/redis.js';
import logger from '@config/logger.js';

// Dynamically import package.json
const packageJson = await import('../../../../../../../package.json', { with: { type: 'json' } }).then(module => module.default);

const router = express.Router();

/**
 * @swagger
 * /v1/version:
 *   get:
 *     summary: Get application version information
 *     tags: [System]
 *     parameters:
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *         description: Include version history
 *     responses:
 *       200:
 *         description: Version information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     packageVersion:
 *                       type: string
 *                     configVersion:
 *                       type: string
 *                     buildDate:
 *                       type: string
 *                     environment:
 *                       type: string
 *                     nodeVersion:
 *                       type: string
 *                     uptime:
 *                       type: number
 *                     commitHash:
 *                       type: string
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           version:
 *                             type: string
 *                           releaseDate:
 *                             type: string
 *                           releaseNotes:
 *                             type: string
 *                           commitHash:
 *                             type: string
 *                 message:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 */
const getVersion = catchAsync(async (req, res) => {
  const { includeHistory = false } = req.query;
  const cacheKey = req.tenantId ? `coreSystemConfig:version:${req.tenantId}` : 'coreSystemConfig:version';
  const versionInfo = {
    packageVersion: packageJson.version,
    buildDate: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: process.uptime(),
    commitHash: process.env.COMMIT_HASH || 'unknown',
  };

  try {
    const client = await getRedisClient();
    const cachedVersion = await client.get(cacheKey);
    if (cachedVersion) {
      versionInfo.configVersion = cachedVersion;
      logger.info('Cache hit for version');
    } else {
      const query = req.tenantId ? { tenantId: req.tenantId, isDeleted: false } : { isDeleted: false };
      const config = await CoreSystemConfig.findOne(query).select('version').lean().exec();
      versionInfo.configVersion = config?.version || 'Not set';
      await client.setEx(cacheKey, 3600, packageJson.version);
      logger.info(`Version ${packageJson.version} cached in Redis`);
    }

    if (includeHistory) {
      const historyQuery = req.tenantId ? { tenantId: req.tenantId, isDeleted: false } : { isDeleted: false };
      versionInfo.history = await VersionHistory.find(historyQuery)
        .select('version releaseDate releaseNotes commitHash')
        .lean()
        .exec();
    }

    // Add deprecation warning for older API versions
    const currentMajor = parseInt(packageJson.version.split('.')[0], 10);
    if (req.apiVersion && parseInt(req.apiVersion, 10) < currentMajor) {
      versionInfo.deprecationWarning = `API version ${req.apiVersion} is deprecated. Please upgrade to version ${currentMajor}.0`;
    }

    res.status(httpStatus.OK).json(
      responseFormatter(true, versionInfo, 'Version information retrieved successfully', httpStatus.OK)
    );
  } catch (error) {
    logger.warn(`Failed to retrieve version: ${error.message}`);
    versionInfo.configVersion = 'Error retrieving config version';
    res.status(httpStatus.OK).json(
      responseFormatter(true, versionInfo, 'Version information retrieved with errors', httpStatus.OK)
    );
  }
});

router.get('/', getVersion);

export default router;