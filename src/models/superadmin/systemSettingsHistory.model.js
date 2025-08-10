import mongoose from 'mongoose';

const systemSettingsHistorySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  module: { type: String, required: true },
  action: { type: String, enum: ['create', 'update', 'rollback'], required: true },
  previousValue: { type: Object },
  newValue: { type: Object },
  changedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
});

systemSettingsHistorySchema.index({ tenantId: 1, module: 1, createdAt: -1 });

export default mongoose.model('SystemSettingsHistory', systemSettingsHistorySchema);