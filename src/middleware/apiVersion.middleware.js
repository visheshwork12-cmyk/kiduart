import httpStatus from 'http-status';
import ApiError from '@utils/apiError.js';

const apiVersionMiddleware = (supportedVersions = ['1']) => {
  return (req, res, next) => {
    let version = null;

    // Extract version from URL (e.g., /api/v1/users)
    const urlVersion = req.path.match(/^\/api\/v(\d+(?:\.\d+)?)/);
    if (urlVersion) {
      version = urlVersion[1];
    }

    // Extract version from header (e.g., Accept-Version: 1.0)
    const headerVersion = req.headers['accept-version'] || req.headers['api-version'];
    if (headerVersion) {
      version = headerVersion;
    }

    // Default to latest version if none specified
    if (!version) {
      version = Math.max(...supportedVersions.map(v => parseFloat(v))).toString();
    }

    // Validate version
    if (!supportedVersions.includes(version)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `API version ${version} is not supported. Supported versions: ${supportedVersions.join(', ')}`
      );
    }

    req.apiVersion = version;
    res.set('API-Version', version);
    next();
  };
};

export default apiVersionMiddleware;