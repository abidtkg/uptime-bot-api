const Joi = require('joi');

const createGroupValidator = data => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(30).required()
    });
    return schema.validate(data);
}

module.exports = {
    createGroupValidator

}