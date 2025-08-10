import Role from '@models/superadmin/role.model.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';
import CONSTANTS from '@shared/constants/index.js';

const checkPermission = (requiredPermission) => async (req, res, next) => {
  try {
    const role = await Role.findOne({ tenantId: req.user.tenantId, name: req.user.role });
    if (!role || !role.permissions.includes(requiredPermission)) {
      throw new ApiError(httpStatus.FORBIDDEN, CONSTANTS.MESSAGES.PERMISSION_DENIED);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default checkPermission;