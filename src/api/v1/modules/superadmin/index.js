import express from 'express';
import subscriptionRoutes from './subscription/routes.js';
import adminRoutes from './admin/routes.js';
import systemSettingsRoutes from './systemSettings/index.js';

const router = express.Router();

router.use('/subscriptions', subscriptionRoutes);
router.use('/admins', adminRoutes);
router.use('/system-settings', systemSettingsRoutes);

export default router;