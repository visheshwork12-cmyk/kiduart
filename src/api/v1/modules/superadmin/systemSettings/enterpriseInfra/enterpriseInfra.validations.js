import Joi from 'joi';
import CONSTANTS from '@constants/index.js';

const createEnterpriseInfra = {
  body: Joi.object().keys({
    cloudProviders: Joi.array().items(Joi.string().valid(...CONSTANTS.CLOUD_PROVIDERS)).required().messages({
      'array.base': 'Cloud providers must be an array',
      'any.required': 'Cloud providers are required',
    }),
    dataCenterRegions: Joi.array().items(Joi.string().valid(...CONSTANTS.DATA_CENTER_REGIONS)).required().messages({
      'array.base': 'Data center regions must be an array',
      'any.required': 'Data center regions are required',
    }),
    highAvailabilityCluster: Joi.object({
      enabled: Joi.boolean().optional(),
      nodeCount: Joi.number().min(1).max(100).when('enabled', { is: true, then: Joi.required() }),
      failoverStrategy: Joi.string().valid(...CONSTANTS.FAILOVER_STRATEGIES).when('enabled', { is: true, then: Joi.required() }),
    }).optional(),
    distributedDatabase: Joi.object({
      inMemoryEngine: Joi.string().valid(...CONSTANTS.IN_MEMORY_ENGINES).optional(),
      engine: Joi.string().valid(...CONSTANTS.DATABASE_ENGINES).required(),
      configuration: Joi.string().valid(...CONSTANTS.DATABASE_CONFIGURATIONS).required(),
    }).required(),
    automatedBackup: Joi.object({
      mode: Joi.string().valid(...CONSTANTS.BACKUP_MODES).required(),
      storageTypes: Joi.array().items(Joi.string().valid(...CONSTANTS.STORAGE_TYPES)).required(),
      drSite: Joi.string().valid(...CONSTANTS.DR_SITES).required(),
      offsite: Joi.boolean().required(),
    }).required(),
    disasterRecovery: Joi.object({
      rpo: Joi.number().min(0).required(),
      rto: Joi.number().min(0).required(),
      drSite: Joi.string().valid(...CONSTANTS.DR_SITES).required(),
    }).optional(),
    aiDrivenLoadBalancing: Joi.object({
      enabled: Joi.boolean().optional(),
      predictiveScaling: Joi.object({
        threshold: Joi.number().min(0).when('..enabled', { is: true, then: Joi.required() }),
        scaleFactor: Joi.number().min(0).when('..enabled', { is: true, then: Joi.required() }),
      }).when('enabled', { is: true, then: Joi.required() }),
    }).optional(),
    securitySettings: Joi.object({
      encryptionAtRest: Joi.boolean().optional(),
      firewallEnabled: Joi.boolean().optional(),
      wafRules: Joi.array().items(Joi.string()).optional(),
    }).optional(),
  }),
};

const getEnterpriseInfra = {
  query: Joi.object().keys({}),
};

const updateEnterpriseInfra = {
  body: Joi.object().keys({
    cloudProviders: Joi.array().items(Joi.string().valid(...CONSTANTS.CLOUD_PROVIDERS)).optional().messages({
      'array.base': 'Cloud providers must be an array',
    }),
    dataCenterRegions: Joi.array().items(Joi.string().valid(...CONSTANTS.DATA_CENTER_REGIONS)).optional().messages({
      'array.base': 'Data center regions must be an array',
    }),
    highAvailabilityCluster: Joi.object({
      enabled: Joi.boolean().optional(),
      nodeCount: Joi.number().min(1).max(100).when('enabled', { is: true, then: Joi.required() }),
      failoverStrategy: Joi.string().valid(...CONSTANTS.FAILOVER_STRATEGIES).when('enabled', { is: true, then: Joi.required() }),
    }).optional(),
    distributedDatabase: Joi.object({
      inMemoryEngine: Joi.string().valid(...CONSTANTS.IN_MEMORY_ENGINES).optional(),
      engine: Joi.string().valid(...CONSTANTS.DATABASE_ENGINES).optional(),
      configuration: Joi.string().valid(...CONSTANTS.DATABASE_CONFIGURATIONS).optional(),
    }).optional(),
    automatedBackup: Joi.object({
      mode: Joi.string().valid(...CONSTANTS.BACKUP_MODES).optional(),
      storageTypes: Joi.array().items(Joi.string().valid(...CONSTANTS.STORAGE_TYPES)).optional(),
      drSite: Joi.string().valid(...CONSTANTS.DR_SITES).optional(),
      offsite: Joi.boolean().optional(),
    }).optional(),
    disasterRecovery: Joi.object({
      rpo: Joi.number().min(0).optional(),
      rto: Joi.number().min(0).optional(),
      drSite: Joi.string().valid(...CONSTANTS.DR_SITES).optional(),
    }).optional(),
    aiDrivenLoadBalancing: Joi.object({
      enabled: Joi.boolean().optional(),
      predictiveScaling: Joi.object({
        threshold: Joi.number().min(0).when('..enabled', { is: true, then: Joi.required() }),
        scaleFactor: Joi.number().min(0).when('..enabled', { is: true, then: Joi.required() }),
      }).when('enabled', { is: true, then: Joi.required() }),
    }).optional(),
    securitySettings: Joi.object({
      encryptionAtRest: Joi.boolean().optional(),
      firewallEnabled: Joi.boolean().optional(),
      wafRules: Joi.array().items(Joi.string()).optional(),
    }).optional(),
  }).min(1),
};

const deleteEnterpriseInfra = {
  query: Joi.object().keys({}),
};

const validateInfrastructure = {
  body: Joi.object().keys({
    cloudProviders: Joi.array().items(Joi.string().valid(...CONSTANTS.CLOUD_PROVIDERS)).required().messages({
      'array.base': 'Cloud providers must be an array',
      'any.required': 'Cloud providers are required',
    }),
    dataCenterRegions: Joi.array().items(Joi.string().valid(...CONSTANTS.DATA_CENTER_REGIONS)).required().messages({
      'array.base': 'Data center regions must be an array',
      'any.required': 'Data center regions are required',
    }),
  }),
};

const getInfrastructureStatus = {
  query: Joi.object().keys({}),
};

export default {
  createEnterpriseInfra,
  getEnterpriseInfra,
  updateEnterpriseInfra,
  deleteEnterpriseInfra,
  validateInfrastructure,
  getInfrastructureStatus,
};