/**
 * @typedef {Object} Admin
 * @property {string} _id
 * @property {string} email
 * @property {string} password
 * @property {string} name
 * @property {string} role
 * @property {string} [phone]
 * @property {string} [address]
 * @property {string} [state]
 * @property {string} [country]
 * @property {string} [city]
 * @property {string} [zipcode]
 * @property {string} [profilePhoto]
 * @property {string} [schoolId]
 */

/**
 * @typedef {Object} Subscription
 * @property {string} _id
 * @property {string} schoolId
 * @property {string} plan
 * @property {string} status
 * @property {Date} expiryDate
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} Token
 * @property {Object} access
 * @property {string} access.token
 * @property {Date} access.expires
 * @property {Object} refresh
 * @property {string} refresh.token
 * @property {Date} refresh.expires
 */

/**
 * @typedef {Object} AuditLog
 * @property {string} _id
 * @property {string} action
 * @property {string} performedBy
 * @property {string} target
 * @property {Object} details
 * @property {string} ipAddress
 * @property {string} schoolId
 * @property {Date} createdAt
 */

export {};