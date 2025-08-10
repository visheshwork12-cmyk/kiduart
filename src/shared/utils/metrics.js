import promClient from 'prom-client';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const settingsUpdateCounter = new promClient.Counter({
  name: 'settings_updates_total',
  help: 'Total number of settings updates',
  labelNames: ['module', 'tenantId'],
  registers: [register],
});

const complianceHealthGauge = new promClient.Gauge({
  name: 'compliance_health',
  help: 'Compliance health status (0 = non-compliant, 1 = compliant)',
  labelNames: ['tenantId'],
  registers: [register],
});

const configDriftCounter = new promClient.Counter({
  name: 'config_drift_total',
  help: 'Total number of config drift events',
  labelNames: ['module', 'tenantId'],
  registers: [register],
});

export { settingsUpdateCounter, complianceHealthGauge, configDriftCounter, register };