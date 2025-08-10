import httpStatus from 'http-status';
import config from '@config/index.js';
import ApiError from '@utils/apiError.js';

const basicAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Basic authentication required');
  }
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  if (
    username !== config.auth.basicAuthUsername ||
    password !== config.auth.basicAuthPassword
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }
  next();
};

export default basicAuthMiddleware;