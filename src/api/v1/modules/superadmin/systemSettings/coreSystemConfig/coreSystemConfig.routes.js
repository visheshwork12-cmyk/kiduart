// src/api/v1/modules/superadmin/systemSettings/coreSystemConfig/coreSystemConfig.routes.js
import express from 'express';
import validate from '@middleware/validate.middleware.js';
import checkPermission from '@middleware/role.middleware.js';
import coreSystemConfigController from './coreSystemConfig.controller.js';
import coreSystemConfigValidation from './coreSystemConfig.validations.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: CoreSystemConfig
 *     description: Core system configuration management endpoints
 */

/**
 * @swagger
 * /v1/superadmin/core-system-config:
 *   post:
 *     summary: Create core system configuration
 *     tags: [CoreSystemConfig]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - systemIdentifier
 *               - version
 *               - operationalMode
 *               - timeZone
 *               - cache
 *             properties:
 *               systemIdentifier:
 *                 type: string
 *               version:
 *                 type: string
 *               operationalMode:
 *                 type: string
 *                 enum: ['production', 'staging', 'development']
 *               sandboxMode:
 *                 type: boolean
 *               ntpServer:
 *                 type: string
 *               fallbackNtpServers:
 *                 type: array
 *                 items:
 *                   type: string
 *               syncInterval:
 *                 type: number
 *               timeZone:
 *                 type: string
 *               dateTimeFormat:
 *                 type: string
 *               locale:
 *                 type: string
 *               language:
 *                 type: string
 *               numberFormat:
 *                 type: object
 *                 properties:
 *                   decimalSeparator:
 *                     type: string
 *                   thousandsSeparator:
 *                     type: string
 *               addressFormat:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               cache:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   host:
 *                     type: string
 *                   port:
 *                     type: number
 *                   ttl:
 *                     type: number
 *               encryptionSettings:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   algorithm:
 *                     type: string
 *                     enum: ['AES-256', 'RSA']
 *                   keyRotationInterval:
 *                     type: number
 *     responses:
 *       201:
 *         description: Core configuration created successfully
 *       400:
 *         description: Core configuration already exists or invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  checkPermission('settings:write'),
  validate(coreSystemConfigValidation.createCoreSystemConfig),
  coreSystemConfigController.createCoreSystemConfig
);

/**
 * @swagger
 * /v1/superadmin/core-system-config:
 *   get:
 *     summary: Retrieve core system configuration
 *     tags: [CoreSystemConfig]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Core configuration retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Core configuration not found
 */
router.get(
  '/',
  checkPermission('settings:read'),
  validate(coreSystemConfigValidation.getCoreSystemConfig),
  coreSystemConfigController.getCoreSystemConfig
);

/**
 * @swagger
 * /v1/superadmin/core-system-config:
 *   patch:
 *     summary: Update core system configuration
 *     tags: [CoreSystemConfig]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               systemIdentifier:
 *                 type: string
 *               version:
 *                 type: string
 *               operationalMode:
 *                 type: string
 *                 enum: ['production', 'staging', 'development']
 *               sandboxMode:
 *                 type: boolean
 *               ntpServer:
 *                 type: string
 *               fallbackNtpServers:
 *                 type: array
 *                 items:
 *                   type: string
 *               syncInterval:
 *                 type: number
 *               timeZone:
 *                 type: string
 *               dateTimeFormat:
 *                 type: string
 *               locale:
 *                 type: string
 *               language:
 *                 type: string
 *               numberFormat:
 *                 type: object
 *                 properties:
 *                   decimalSeparator:
 *                     type: string
 *                   thousandsSeparator:
 *                     type: string
 *               addressFormat:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               cache:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   host:
 *                     type: string
 *                   port:
 *                     type: number
 *                   ttl:
 *                     type: number
 *               encryptionSettings:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   algorithm:
 *                     type: string
 *                     enum: ['AES-256', 'RSA']
 *                   keyRotationInterval:
 *                     type: number
 *     responses:
 *       200:
 *         description: Core configuration updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Core configuration not found
 */
router.patch(
  '/',
  checkPermission('settings:write'),
  validate(coreSystemConfigValidation.updateCoreSystemConfig),
  coreSystemConfigController.updateCoreSystemConfig
);

/**
 * @swagger
 * /v1/superadmin/core-system-config:
 *   delete:
 *     summary: Delete core system configuration (soft delete)
 *     tags: [CoreSystemConfig]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Core configuration deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Core configuration not found
 */
router.delete(
  '/',
  checkPermission('settings:write'),
  validate(coreSystemConfigValidation.deleteCoreSystemConfig),
  coreSystemConfigController.deleteCoreSystemConfig
);

/**
 * @swagger
 * /v1/superadmin/core-system-config/sync-ntp:
 *   post:
 *     summary: Synchronize system time with NTP server
 *     tags: [CoreSystemConfig]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: NTP synchronization successful
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: NTP synchronization failed
 */
router.post(
  '/sync-ntp',
  checkPermission('settings:write'),
  validate(coreSystemConfigValidation.syncWithNTPServer),
  coreSystemConfigController.syncWithNTPServer
);

/**
 * @swagger
 * /v1/superadmin/core-system-config/preview-datetime:
 *   post:
 *     summary: Preview date-time format
 *     tags: [CoreSystemConfig]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - format
 *             properties:
 *               format:
 *                 type: string
 *               locale:
 *                 type: string
 *     responses:
 *       200:
 *         description: Date-time format previewed successfully
 *       400:
 *         description: Invalid format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/preview-datetime',
  checkPermission('settings:read'),
  validate(coreSystemConfigValidation.previewDateTimeFormat),
  coreSystemConfigController.previewDateTimeFormat
);

/**
 * @swagger
 * /v1/superadmin/core-system-config/language/{language}:
 *   get:
 *     summary: Retrieve language pack
 *     tags: [CoreSystemConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: language
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Language pack retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Language pack not found
 */
router.get(
  '/language/:language',
  checkPermission('settings:read'),
  validate(coreSystemConfigValidation.getLanguagePack),
  coreSystemConfigController.getLanguagePack
);

/**
 * @swagger
 * /v1/superadmin/core-system-config/translate:
 *   post:
 *     summary: Translate text to target language
 *     tags: [CoreSystemConfig]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - targetLanguage
 *             properties:
 *               text:
 *                 type: string
 *               targetLanguage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Text translated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Translation failed
 */
router.post(
  '/translate',
  checkPermission('settings:read'),
  validate(coreSystemConfigValidation.translateText),
  coreSystemConfigController.translateText
);

/**
 * @swagger
 * /v1/superadmin/core-system-config/regional-defaults:
 *   get:
 *     summary: Retrieve regional defaults based on IP
 *     tags: [CoreSystemConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ipAddress
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Regional defaults retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/regional-defaults',
  checkPermission('settings:read'),
  validate(coreSystemConfigValidation.getRegionalDefaults),
  coreSystemConfigController.getRegionalDefaults
);

export default router;