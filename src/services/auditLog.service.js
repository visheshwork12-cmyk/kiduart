import AuditLogModel from '@models/superadmin/auditLog.model.js';
import logger from '@config/logger.js';

const logAction = async (action, performedBy, target, details, ipAddress, schoolId) => {
  try {
    await AuditLogModel.create({
      action,
      performedBy,
      target,
      details,
      ipAddress,
      schoolId,
    });
    logger.info(`Audit log created for action: ${action}`);
  } catch (error) {
    logger.error(`Failed to log audit action: ${error.message}`);
    throw error;
  }
};

const getLastAction = async (action) => {
  try {
    const lastAction = await AuditLogModel.findOne({ action }).sort({ createdAt: -1 });
    return lastAction;
  } catch (error) {
    logger.error(`Failed to retrieve last audit action: ${error.message}`);
    return null;
  }
};

export default {
  logAction,
  getLastAction,
};