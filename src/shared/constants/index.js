const HTTP_STATUS = {
  SUCCESSFUL: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const MESSAGES = {
  PLEASE_AUTHENTICATE: 'Please add authentication token',
  UNAUTHORIZED: 'Invalid credentials, please use correct email & password combination',
  OLD_PASSWORD: 'Please enter a valid old password',
  REGISTER: 'Registered successfully',
  LOGIN: 'Logged in successfully',
  LOGOUT: 'Logged out successfully',
  NOT_FOUND: 'Not found',
  ADMIN_NOT_FOUND: 'Admin not found',
  ADMIN_EMAIL_ALREADY_EXISTS: 'Email already exists',
  SETTINGS_NOT_FOUND: 'Settings not found',
  SETTINGS_ALREADY_EXISTS: 'Settings already exist',
  SETTINGS_CREATED: 'Settings created successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
  SETTINGS_RETRIEVED: 'Settings retrieved successfully',
  INVALID_OTP: 'Invalid OTP provided',
  COMPLIANCE_REPORT_GENERATED: 'Compliance report generated successfully',
  FEATURE_FLAG_NOT_FOUND: 'Feature flag not found',
  ROLE_NOT_FOUND: 'Role not found',
  PERMISSION_DENIED: 'Permission denied',
  AUDIT_TRAIL_RETRIEVED: 'Audit trail retrieved successfully',
  ROLLBACK_SUCCESS: 'Settings rolled back successfully',
  INVALID_CONFIGURATION: 'Invalid configuration provided',
};

const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
};

const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

const SUBSCRIPTION_PLANS = {
  BASIC: 'basic',
  PREMIUM: 'premium',
};

const OPERATIONAL_MODES = ['production', 'staging', 'development'];
const FEATURE_FLAGS = ['multi_factor_auth', 'data_masking', 'compliance_reports'];
const PERMISSIONS = [
  'settings:read',
  'settings:write',
  'flags:read',
  'flags:write',
  'roles:read',
  'roles:write',
  'audit:read',
  'audit:rollback',
  'manageAdmins', // Added
  'getAdmins',   // Added
  'updateProfile', // Added
  'changePassword', // Added
  'manageRoles',  // Added
];

const TIME_ZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Kolkata',
  'Europe/London',
];

const CLOUD_PROVIDERS = ['AWS', 'Azure', 'Google Cloud', 'Hybrid'];
const DATA_CENTER_REGIONS = ['Mumbai', 'Singapore', 'Frankfurt', 'US-East-1', 'Sydney', 'Tokyo', 'London', 'Sao Paulo'];
const FAILOVER_STRATEGIES = ['Manual', 'Automatic', 'Custom'];
const IN_MEMORY_ENGINES = ['SAP HANA', 'Redis Enterprise'];
const DATABASE_ENGINES = ['Cassandra', 'PostgreSQL', 'MongoDB'];
const DATABASE_CONFIGURATIONS = ['Sharded', 'Replicated'];
const BACKUP_MODES = ['Real-time', 'Incremental'];
const STORAGE_TYPES = ['Local', 'Cloud', 'Tape'];
const DR_SITES = ['AWS US-East-1', 'AWS Mumbai', 'Azure Singapore', 'Google Cloud Tokyo'];
const AUTH_METHODS = ['Email OTP', 'SMS OTP', 'App-based'];
const SMS_PROVIDERS = ['Twilio', 'Nexmo', 'AWS SNS'];
const ENCRYPTION_STANDARDS = ['AES-256', 'RSA-2048'];
const GEOIP_DATABASES = ['GeoLite2', 'MaxMind'];
const COMPLIANCE_STANDARDS = ['ISO 27001', 'CBSE', 'GDPR', 'HIPAA'];
const REPORT_FORMATS = ['PDF', 'CSV'];
const MASKABLE_FIELDS = ['Aadhaar', 'Phone', 'Email', 'Name'];
const MASKING_POLICIES = ['Partial', 'Full'];

export default {
  HTTP_STATUS,
  MESSAGES,
  OPERATIONAL_MODES,
  TIME_ZONES,
  CLOUD_PROVIDERS,
  DATA_CENTER_REGIONS,
  FAILOVER_STRATEGIES,
  IN_MEMORY_ENGINES,
  DATABASE_ENGINES,
  DATABASE_CONFIGURATIONS,
  BACKUP_MODES,
  STORAGE_TYPES,
  DR_SITES,
  ROLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_PLANS,
  DR_SITES,
  AUTH_METHODS,
  SMS_PROVIDERS,
  ENCRYPTION_STANDARDS,
  GEOIP_DATABASES,
  COMPLIANCE_STANDARDS,
  REPORT_FORMATS,
  MASKABLE_FIELDS,
  MASKING_POLICIES,
  FEATURE_FLAGS,
  PERMISSIONS
};