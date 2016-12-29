"use strict";
const _ = require("lodash");
const result_1 = require("../result");
const validate_json_1 = require("./validate-json");
const toJsonSchema = (parameter) => {
    const schema = {
        properties: {
            value: {
                format: parameter.format,
                type: parameter.type
            }
        },
        type: 'object'
    };
    if (parameter.required) {
        schema.required = ['value'];
    }
    return schema;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (name, swaggerValue, pactHeader, pactInteraction) => {
    if (swaggerValue.type === 'array') {
        return {
            match: true,
            results: [result_1.default.warning({
                    message: `Validating parameters of type "${swaggerValue.type}" are not supported, ` +
                        `assuming value is valid: ${name}`,
                    pactSegment: pactHeader,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerValue
                })]
        };
    }
    const swaggerHeaderSchema = toJsonSchema(swaggerValue);
    const errors = validate_json_1.default(swaggerHeaderSchema, { value: (pactHeader || { value: undefined }).value }, true);
    return {
        match: errors.length === 0,
        results: _.map(errors, (error) => result_1.default.error({
            message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                error.message,
            pactSegment: pactHeader || pactInteraction,
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerValue
        }))
    };
};
