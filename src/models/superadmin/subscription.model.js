import mongoose from 'mongoose';
import { toJSON } from '@plugins/index.js';
import CONSTANTS from '@config/constants.js';

const subscriptionSchema = mongoose.Schema(
  {
    schoolId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'School',
      required: true,
    },
    plan: {
      type: String,
      enum: Object.values(CONSTANTS.SUBSCRIPTION_PLANS),
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CONSTANTS.SUBSCRIPTION_STATUS),
      default: CONSTANTS.SUBSCRIPTION_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.plugin(toJSON);

const SubscriptionModel = mongoose.model('Subscription', subscriptionSchema);

export default SubscriptionModel;