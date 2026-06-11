const Joi = require('joi');
const ENUM_CONFIG = require('../configs/enums.config');

const createMonitorValidator = data => {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(''),
        type: Joi.string().required(),
        intervalSeconds: Joi.number().integer().min(30).required(),
        endpoint: Joi.string().uri().required(),
    });
    return schema.validate(data);
}

module.exports = {
    createMonitorValidator
}