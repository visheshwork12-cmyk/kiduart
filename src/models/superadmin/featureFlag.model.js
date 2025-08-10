// src/models/featureFlag.model.js
import mongoose from 'mongoose';
import CONSTANTS from '@constants/index.js';

const featureFlagSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  flags: [{
    name: { type: String, enum: CONSTANTS.FEATURE_FLAGS, required: true },
    enabled: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
  }],
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
});

featureFlagSchema.index({ tenantId: 1, 'flags.name': 1 });

export default mongoose.model('FeatureFlag', featureFlagSchema);