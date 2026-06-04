const Joi = require('joi');
const ENUM_CONFIG = require('../configs/enums.config');

const createMonitorValidator = data => {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(''),
        type: Joi.string().valid(ENUM_CONFIG.MONITOR_TYPES_ENUM.ALL).required(),
        target: Joi.string().required(),
        intervalSeconds: Joi.number().integer().min(30).required(),
        timeoutMs: Joi.number().integer().max(30000).required(),
        active: Joi.boolean().default(true),
        isPaused: Joi.boolean().default(false),
        maintenanceMode: Joi.boolean().default(false),
        consecutiveFailuresToAlert: Joi.number().integer().default(3),
        isPublic: Joi.boolean().default(false),
        publicDisplayName: Joi.string().when('isPublic', { is: true, then: Joi.required(), otherwise: Joi.optional() }),
        http_options: Joi.object().when('type', { is: Joi.valid('HTTP', 'HTTPS'), then: Joi.required(), otherwise: Joi.optional() }),
        sslOptions: Joi.object().when('type', { is: 'SSL', then: Joi.required(), otherwise: Joi.optional() }),
        groups: Joi.string().allow(''),
    });
    return schema.validate(data);
}

module.exports = {
    createMonitorValidator
}