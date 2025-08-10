import mongoose from 'mongoose';
import CONSTANTS from '@constants/index.js';

const enterpriseInfraSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  cloudProviders: { type: [String], enum: CONSTANTS.CLOUD_PROVIDERS, default: ['AWS'] },
  dataCenterRegions: { type: [String], enum: CONSTANTS.DATA_CENTER_REGIONS, default: ['Mumbai'] },
  highAvailabilityCluster: {
    enabled: { type: Boolean, default: false },
    nodeCount: { type: Number, min: 1, max: 100 },
    failoverStrategy: { type: String, enum: CONSTANTS.FAILOVER_STRATEGIES, default: 'Manual' },
  },
  distributedDatabase: {
    inMemoryEngine: { type: String, enum: CONSTANTS.IN_MEMORY_ENGINES },
    engine: { type: String, enum: CONSTANTS.DATABASE_ENGINES },
    configuration: { type: String, enum: CONSTANTS.DATABASE_CONFIGURATIONS },
  },
  automatedBackup: {
    mode: { type: String, enum: CONSTANTS.BACKUP_MODES },
    storageTypes: { type: [String], enum: CONSTANTS.STORAGE_TYPES },
    drSite: { type: String, enum: CONSTANTS.DR_SITES },
    offsite: { type: Boolean, default: false },
  },
  disasterRecovery: {
    rpo: { type: Number, min: 0 },
    rto: { type: Number, min: 0 },
    drSite: { type: String, enum: CONSTANTS.DR_SITES },
  },
  aiDrivenLoadBalancing: {
    enabled: { type: Boolean, default: false },
    predictiveScaling: {
      threshold: { type: Number, min: 0 },
      scaleFactor: { type: Number, min: 0 },
    },
  },
  securitySettings: {
    encryptionAtRest: { type: Boolean, default: false },
    firewallEnabled: { type: Boolean, default: true },
    wafRules: { type: [String], default: [] },
  },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

enterpriseInfraSchema.index({ tenantId: 1, isDeleted: 1 });

enterpriseInfraSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('EnterpriseInfra', enterpriseInfraSchema);