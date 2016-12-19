"use strict";
const Ajv = require("ajv");
const _ = require("lodash");
const result_1 = require("../result");
const toJsonSchema = (parameter) => {
    const schema = {
        properties: {
            value: {
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
const validateJson = (jsonSchema, json) => {
    const ajv = new Ajv({
        allErrors: true,
        coerceTypes: true,
        verbose: true
    });
    ajv.validate(jsonSchema, json);
    return ajv.errors || [];
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
    const errors = validateJson(swaggerHeaderSchema, { value: (pactHeader || { value: undefined }).value });
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
