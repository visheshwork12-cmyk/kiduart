// src/models/superadmin/role.model.js
import mongoose from 'mongoose';
import CONSTANTS from '@config/constants.js';

const roleSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: false, index: true },
  name: { type: String, required: true, trim: true },
  permissions: [{ type: String, enum: CONSTANTS.PERMISSIONS, required: true }],
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
});

roleSchema.index({ tenantId: 1, name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export default mongoose.model('Role', roleSchema);