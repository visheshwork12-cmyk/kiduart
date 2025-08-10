import { createTransport } from 'nodemailer';
// import FeeModel from '@models/admin/fee.model.js';
// import StudentModel from '@models/admin/student.model.js';
import config from '@config/index.js';
import logger from '@config/logger.js';
import CONSTANTS from '@config/constants.js';

const transporter = createTransport({
  host: config?.smtp?.host,
  port: config?.smtp?.port,
  auth: {
    user: config?.smtp?.username,
    pass: config?.smtp?.password,
  },
});

const sendFeeReminders = async () => {
  try {
    const today = new Date();
    const fees = await FeeModel.find({
      status: { $in: ['pending', 'overdue'] },
      dueDate: { $lte: today },
    }).populate('studentId', 'name email');

    for (const fee of fees) {
      const student = fee.studentId;
      if (!student.email) {
        logger.warn(`No email found for student ${student.name} (ID: ${student._id})`);
        continue;
      }

      const mailOptions = {
        from: config.email.from,
        to: student.email,
        subject: `Fee Reminder: Payment Due for ${fee.description || 'School Fee'}`,
        text: `
          Dear ${student.name},
          
          This is a reminder that your fee payment of ${fee.amount} is due on ${fee.dueDate.toDateString()}.
          Please ensure the payment is made at the earliest to avoid any penalties.
          
          Fee Details:
          - Amount: ${fee.amount}
          - Due Date: ${fee.dueDate.toDateString()}
          - Description: ${fee.description || 'N/A'}
          - Status: ${fee.status}
          
          Thank you,
          School ERP Team
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Fee reminder sent to ${student.email} for fee ID ${fee._id}`);

      // Update fee status to overdue if past due date
      if (fee.status === 'pending' && fee.dueDate < today) {
        fee.status = 'overdue';
        await fee.save();
        logger.info(`Fee ID ${fee._id} marked as overdue`);
      }
    }

    logger.info(`Fee reminder job completed. Processed ${fees.length} fees.`);
  } catch (error) {
    logger.error(`Error in sendFeeReminders: ${error.message}`);
    throw new Error(`Failed to send fee reminders: ${error.message}`);
  }
};

export { sendFeeReminders };