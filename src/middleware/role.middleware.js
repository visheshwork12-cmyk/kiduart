import httpStatus from 'http-status';
import ApiError from '@utils/apiError.js';
import roles from '@config/roles.js';

const roleMiddleware = (requiredRole) => async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const availableRoles = await roles.getRoles();
    if (!availableRoles.includes(userRole)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Invalid user role');
    }
    if (userRole !== requiredRole) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default roleMiddleware;