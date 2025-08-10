import versionController from '@api/v1/modules/system/version/version.routes.js';
import CoreSystemConfig from '@models/superadmin/coreSystemConfig.model.js';
import VersionHistory from '@models/superadmin/versionHistory.model.js';
import { getRedisClient } from '@lib/redis.js';
import responseFormatter from '@utils/responseFormatter.js';
import httpStatus from 'http-status';
import packageJson from '@root/package.json' assert { type: 'json' };

jest.mock('@models/superadmin/coreSystemConfig.model.js');
jest.mock('@models/superadmin/versionHistory.model.js');
jest.mock('@lib/redis.js');
jest.mock('@utils/responseFormatter.js');

describe('Version Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { tenantId: null, query: { includeHistory: false }, apiVersion: '1' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return version from cache', async () => {
    const mockClient = { get: jest.fn().mockResolvedValue(packageJson.version), setEx: jest.fn() };
    getRedisClient.mockResolvedValue(mockClient);
    responseFormatter.mockReturnValue({
      success: true,
      data: {
        packageVersion: packageJson.version,
        configVersion: packageJson.version,
        buildDate: expect.any(String),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        uptime: expect.any(Number),
        commitHash: expect.any(String),
      },
      message: 'Version information retrieved successfully',
      statusCode: httpStatus.OK,
    });

    await versionController.getVersion(req, res);

    expect(getRedisClient).toHaveBeenCalled();
    expect(mockClient.get).toHaveBeenCalledWith('coreSystemConfig:version');
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.json).toHaveBeenCalled();
  });

  it('should return version with history', async () => {
    req.query.includeHistory = true;
    const mockClient = { get: jest.fn().mockResolvedValue(null), setEx: jest.fn() };
    getRedisClient.mockResolvedValue(mockClient);
    CoreSystemConfig.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ version: '0.0.0-development' }),
        }),
      }),
    });
    VersionHistory.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            { version: '0.0.0-development', releaseDate: new Date(), releaseNotes: 'Initial release', commitHash: 'unknown' },
          ]),
        }),
      }),
    });
    responseFormatter.mockReturnValue({
      success: true,
      data: {
        packageVersion: packageJson.version,
        configVersion: '0.0.0-development',
        buildDate: expect.any(String),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        uptime: expect.any(Number),
        commitHash: expect.any(String),
        history: expect.any(Array),
      },
      message: 'Version information retrieved successfully',
      statusCode: httpStatus.OK,
    });

    await versionController.getVersion(req, res);

    expect(CoreSystemConfig.findOne).toHaveBeenCalledWith({ isDeleted: false, tenantId: null });
    expect(VersionHistory.find).toHaveBeenCalled();
    expect(mockClient.setEx).toHaveBeenCalledWith('coreSystemConfig:version', 3600, packageJson.version);
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.json).toHaveBeenCalled();
  });
});