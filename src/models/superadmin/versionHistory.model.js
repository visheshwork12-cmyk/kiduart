import mongoose from 'mongoose';

const versionHistorySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: false, index: true },
  version: { type: String, required: true, trim: true },
  releaseDate: { type: Date, required: true, default: Date.now },
  releaseNotes: { type: String, trim: true },
  commitHash: { type: String, trim: true, default: 'unknown' },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

versionHistorySchema.index({ tenantId: 1, version: 1, isDeleted: 1 });

versionHistorySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('VersionHistory', versionHistorySchema);