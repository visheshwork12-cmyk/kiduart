import mongoose from 'mongoose';
import { toJSON } from '@plugins/index.js';

const schoolSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

schoolSchema.plugin(toJSON);

const SchoolModel = mongoose.model('School', schoolSchema);

export default SchoolModel;