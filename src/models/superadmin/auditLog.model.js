// src/models/superadmin/auditLog.model.js
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: false, index: true }, // Optional for system actions
  userId: { type: mongoose.Schema.Types.ObjectId, required: false, index: true }, // Optional for system actions
  action: { type: String, required: true, trim: true },
  module: { type: String, required: true, trim: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

auditLogSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);