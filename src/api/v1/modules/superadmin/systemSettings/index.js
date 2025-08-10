import express from 'express';
import coreConfigRoutes from './coreSystemConfig/coreSystemConfig.routes.js';
import enterpriseInfraRoutes from './enterpriseInfra/enterpriseInfra.routes.js';
import securityFrameworkRoutes from './securityFramework/securityFramework.routes.js';
import featureFlagsRoutes from './featureFlags/featureFlag.routes.js';
import rbacRoutes from './rbac/role.routes.js';
import auditTrailRoutes from './auditLog/auditLog.routes.js';

const router = express.Router();

router.use('/core-config', coreConfigRoutes);
router.use('/enterprise-infra', enterpriseInfraRoutes);
router.use('/security-framework', securityFrameworkRoutes);
router.use('/feature-flags', featureFlagsRoutes);
router.use('/rbac', rbacRoutes);
router.use('/audit-trail', auditTrailRoutes);

export default router;