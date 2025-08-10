import mongoose from 'mongoose';
import CONSTANTS from '@constants/index.js';

const securityFrameworkSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  authenticationStack: {
    methods: [{ type: String, enum: CONSTANTS.AUTH_METHODS }],
    email: {
      enabled: { type: Boolean, default: false },
      smtpServer: { type: String },
      smtpPort: { type: Number },
    },
    sms: {
      enabled: { type: Boolean, default: false },
      provider: { type: String, enum: CONSTANTS.SMS_PROVIDERS },
    },
    appBased: {
      enabled: { type: Boolean, default: false },
      secretLength: { type: Number, min: 16 },
    },
  },
  encryption: {
    standard: { type: String, enum: CONSTANTS.ENCRYPTION_STANDARDS },
    keyRotationFrequency: { type: Number, min: 1 },
    currentKeyId: { type: String, default: () => crypto.randomUUID() },
  },
  ipGeofencing: {
    enabled: { type: Boolean, default: false },
    whitelist: [{ type: String }],
    blacklist: [{ type: String }],
    geoIpDatabase: { type: String, enum: CONSTANTS.GEOIP_DATABASES },
  },
  sessionGovernance: {
    idleTimeout: { type: Number, min: 1 },
    concurrentLimit: { type: Number, min: 1 },
  },
  complianceSuite: {
    standards: [{ type: String, enum: CONSTANTS.COMPLIANCE_STANDARDS }],
    auditLogs: {
      enabled: { type: Boolean, default: true },
      retentionPeriod: { type: Number, min: 1 },
    },
    reportGeneration: {
      enabled: { type: Boolean, default: true },
      format: { type: String, enum: CONSTANTS.REPORT_FORMATS },
    },
  },
  dataMasking: {
    enabled: { type: Boolean, default: true },
    fields: [{ type: String, enum: CONSTANTS.MASKABLE_FIELDS }],
    policy: { type: String, enum: CONSTANTS.MASKING_POLICIES },
  },
  tokenBlacklist: {
    enabled: { type: Boolean, default: true },
    maxTokens: { type: Number, min: 1, default: 1000 },
  },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

securityFrameworkSchema.index({ tenantId: 1, isDeleted: 1 });

securityFrameworkSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('SecurityFramework', securityFrameworkSchema);