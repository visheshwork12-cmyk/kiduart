import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { toJSON } from '@plugins/index.js';
import CONSTANTS from '@config/constants.js';

const adminSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      private: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [CONSTANTS.ROLES.SUPER_ADMIN, CONSTANTS.ROLES.SCHOOL_ADMIN],
      default: CONSTANTS.ROLES.SCHOOL_ADMIN,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    zipcode: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String,
      trim: true,
    },
    schoolId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'School',
      required: function () {
        return this.role === CONSTANTS.ROLES.SCHOOL_ADMIN;
      },
    },
    tenantId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: function () {
        return this.role === CONSTANTS.ROLES.SCHOOL_ADMIN;
      },
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

adminSchema.plugin(toJSON);

const AdminModel = mongoose.model('Admin', adminSchema);

export default AdminModel;