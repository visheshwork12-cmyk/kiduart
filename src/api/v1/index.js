import express from 'express';
import authRoutes from './auth/routes.js';
import superadminRoutes from './modules/superadmin/index.js';
// import adminRoutes from './modules/admin/index.js';
import docsRoutes from './docs.routes.js';
import healthRoutes from './health.routes.js';
import versionRoute from './modules/superadmin/systemSettings/version/version.routes.js';
// import { sendSubscriptionReminders } from '@jobs/subscriptionReminder.job.js';
// import { sendFeeReminders } from '@services/notification.job.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/superadmin', superadminRoutes);
// router.use('/admin', adminRoutes);
router.use('/docs', docsRoutes);
router.use('/health', healthRoutes);
router.use('/version', versionRoute);

// // Cron job endpoints
// router.get('/cron/subscription-reminder', async (req, res) => {
//   await sendSubscriptionReminders();
//   res.json({ success: true, message: 'Subscription reminders sent' });
// });
// router.get('/cron/fee-reminder', async (req, res) => {
//   await sendFeeReminders();
//   res.json({ success: true, message: 'Fee reminders sent' });
// });

export default router;