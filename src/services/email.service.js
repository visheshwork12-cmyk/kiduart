import nodemailer from 'nodemailer';
import config from '@config/index.js';
import logger from '@config/logger.js';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import SubscriptionModel from '@models/superadmin/subscription.model.js';
import SchoolModel from '@models/superadmin/school.model.js';
import CONSTANTS from '@config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: config.env === 'production',
  auth: {
    user: config.email.smtp.auth.user,
    pass: config.email.smtp.auth.pass,
  },
});

const sendResetPasswordEmail = async (to, token) => {
  const resetPasswordUrl = `${config.vercelUrl}/reset-password?token=${token}`;
  const html = await ejs.renderFile(path.join(__dirname, '@templates/resetPassword.ejs'), {
    user: to,
    resetPasswordUrl,
  });
  await transporter.sendMail({
    from: config.email.from,
    to,
    subject: 'Reset Your School ERP Password',
    html,
  });
  logger.info(`Reset password email sent to ${to}`);
};

const sendNewAdminEmail = async (to, name, password) => {
  const loginUrl = `${config.vercelUrl}/login`;
  const html = await ejs.renderFile(path.join(__dirname, '@templates/newAdmin.ejs'), {
    name,
    email: to,
    password,
    loginUrl,
  });
  await transporter.sendMail({
    from: config.email.from,
    to,
    subject: 'Welcome to School ERP - Your Admin Account',
    html,
  });
  logger.info(`New admin email sent to ${to}`);
};

const sendNotification = async (to, message) => {
  const html = await ejs.renderFile(path.join(__dirname, '@templates/notification.ejs'), {
    user: to,
    message,
  });
  await transporter.sendMail({
    from: config.email.from,
    to,
    subject: 'School ERP Notification',
    html,
  });
  logger.info(`Notification email sent to ${to}`);
};

const sendSubscriptionReminder = async () => {
  try {
    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setDate(today.getDate() + 7);

    const subscriptions = await SubscriptionModel.find({
      status: CONSTANTS.SUBSCRIPTION_STATUS.ACTIVE,
      expiryDate: { $lte: reminderDate },
    }).populate('schoolId', 'name email');

    for (const subscription of subscriptions) {
      const school = subscription.schoolId;
      if (!school.email) {
        logger.warn(`No email found for school ${school.name} (ID: ${school._id})`);
        continue;
      }

      const html = await ejs.renderFile(path.join(__dirname, '@templates/notification.ejs'), {
        user: school.email,
        message: `Your ${subscription.plan} subscription will expire on ${subscription.expiryDate.toDateString()}. Please renew to continue using our services.`,
      });

      await transporter.sendMail({
        from: config.email.from,
        to: school.email,
        subject: `Subscription Reminder: ${subscription.plan} Plan Expiring Soon`,
        html,
      });
      logger.info(`Subscription reminder sent to ${school.email} for subscription ID ${subscription._id}`);

      if (subscription.expiryDate < today && subscription.status === CONSTANTS.SUBSCRIPTION_STATUS.ACTIVE) {
        subscription.status = CONSTANTS.SUBSCRIPTION_STATUS.EXPIRED;
        await subscription.save();
        logger.info(`Subscription ID ${subscription._id} marked as expired`);
      }
    }

    logger.info(`Subscription reminder job completed. Processed ${subscriptions.length} subscriptions.`);
  } catch (error) {
    logger.error(`Error in sendSubscriptionReminders: ${error.message}`);
    throw new Error(`Failed to send subscription reminders: ${error.message}`);
  }
};

export default {
  sendResetPasswordEmail,
  sendNewAdminEmail,
  sendNotification,
  sendSubscriptionReminder,
};