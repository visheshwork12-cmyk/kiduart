import mongoose from 'mongoose';
import { toJSON, paginate } from '@plugins/index.js';
import CONSTANTS from '@config/constants.js';

const systemSettingsSchema = mongoose.Schema(
  {
    systemIdentifier: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    releaseNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    operationalMode: {
      type: String,
      enum: ['production', 'staging', 'development'],
      required: true,
    },
    sandboxMode: {
      type: Boolean,
      default: false,
    },
    ntpServer: {
      type: String,
      trim: true,
      default: 'pool.ntp.org',
    },
    syncInterval: {
      type: Number,
      min: 1,
      max: 1440,
      default: 60,
    },
    timeZone: {
      type: String,
      trim: true,
      default: 'UTC',
    },
    dateTimeFormat: {
      type: String,
      trim: true,
      default: 'YYYY-MM-DD HH:mm:ss',
    },
    locale: {
      type: String,
      trim: true,
      default: 'en-US',
    },
    language: {
      type: String,
      trim: true,
      default: 'en',
    },
    numberFormat: {
      type: Object,
      properties: {
        decimalSeparator: { type: String, trim: true, default: '.' },
        thousandsSeparator: { type: String, trim: true, default: ',' },
      },
      default: { decimalSeparator: '.', thousandsSeparator: ',' },
    },
    addressFormat: {
      type: String,
      trim: true,
      default: '{street}, {city}, {state} {postalCode}, {country}',
    },
    cloudProviders: {
      type: [String],
      enum: CONSTANTS.CLOUD_PROVIDERS,
      default: ['AWS'],
    },
    dataCenterRegions: {
      type: [String],
      enum: CONSTANTS.DATA_CENTER_REGIONS,
      default: ['Mumbai'],
    },
    highAvailabilityCluster: {
      type: Object,
      properties: {
        enabled: { type: Boolean, default: false },
        nodeCount: { type: Number, min: 1, max: 100 },
        failoverStrategy: { type: String, enum: CONSTANTS.FAILOVER_STRATEGIES },
      },
      default: { enabled: false },
    },
    inMemoryComputing: {
      type: Object,
      properties: {
        enabled: { type: Boolean, default: false },
        engine: { type: String, enum: CONSTANTS.IN_MEMORY_ENGINES },
      },
      default: { enabled: false },
    },
    distributedDatabase: {
      type: Object,
      properties: {
        configuration: { type: String, enum: ['Sharded', 'Replicated'], required: true },
        databaseEngine: { type: String, enum: CONSTANTS.DATABASE_ENGINES, required: true },
      },
      required: true,
      default: { configuration: 'Replicated', databaseEngine: 'MongoDB' },
    },
    automatedBackup: {
      mode: { type: String, enum: ['Real-time', 'Incremental'], default: 'Incremental' },
      storageTypes: [{ type: String, enum: ['Local', 'Cloud', 'Tape'] }],
      offsite: { type: Boolean, default: true },
    },
    disasterRecovery: {
      rpo: { type: Number, min: 0, default: 5 },
      rto: { type: Number, min: 0, default: 15 },
      drSite: { type: String, default: 'AWS US-East-1' },
    },
    aiDrivenLoadBalancing: {
      enabled: { type: Boolean, default: false },
      predictiveScaling: {
        threshold: { type: Number, min: 0, max: 100, default: 75 },
        scaleFactor: { type: Number, min: 0, default: 20 },
      },
    },
  },
  {
    timestamps: true,
  }
);

systemSettingsSchema.plugin(toJSON);
systemSettingsSchema.plugin(paginate);

const SystemSettingsModel = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettingsModel;