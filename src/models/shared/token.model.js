import mongoose from 'mongoose';
import { toJSON } from '@plugins/index.js';

const tokenSchema = mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['access', 'refresh', 'resetPassword'],
      required: true,
    },
    expires: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

tokenSchema.plugin(toJSON);
tokenSchema.index({ user: 1, type: 1 });
tokenSchema.index({ token: 1, type: 1 });

const Token = mongoose.model('Token', tokenSchema);

export default Token;