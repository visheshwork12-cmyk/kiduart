import mongoose from 'mongoose';
import CONSTANTS from '@config/constants.js';


const coreSystemConfigSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: false, index: true },
  systemIdentifier: { type: String, required: true, trim: true, default: 'xAI EduCore' },
  version: { type: String, required: true, trim: true, default: '0.0.0-development' },
  operationalMode: { type: String, enum: Object.values(CONSTANTS.OPERATIONAL_MODES), default: 'production' },
  sandboxMode: { type: Boolean, default: false },
  ntpServer: { type: String, trim: true, default: 'pool.ntp.org' },
  fallbackNtpServers: { type: [String], default: ['time.google.com', 'time.windows.com'] },
  syncInterval: { type: Number, min: 1, default: 60 },
  timeZone: { type: String, enum: CONSTANTS.TIME_ZONES, default: 'UTC' },
  dateTimeFormat: { type: String, trim: true, default: 'YYYY-MM-DD HH:mm:ss' },
  locale: { type: String, trim: true, default: 'en-US' },
  language: { type: String, trim: true, default: 'en' },
  numberFormat: {
    decimalSeparator: { type: String, trim: true, default: '.' },
    thousandsSeparator: { type: String, trim: true, default: ',' },
  },
  addressFormat: {
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
  },
  cache: {
    enabled: { type: Boolean, default: true },
    host: { type: String, default: 'localhost' },
    port: { type: Number, default: 6379 },
    ttl: { type: Number, min: 60, default: 300 },
  },
  encryptionSettings: {
    enabled: { type: Boolean, default: false },
    algorithm: { type: String, enum: ['AES-256', 'RSA'], default: 'AES-256' },
    keyRotationInterval: { type: Number, min: 1, default: 30 },
  },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

coreSystemConfigSchema.index({ tenantId: 1, isDeleted: 1 });

coreSystemConfigSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('CoreSystemConfig', coreSystemConfigSchema);