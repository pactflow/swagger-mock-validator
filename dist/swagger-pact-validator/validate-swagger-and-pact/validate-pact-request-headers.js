"use strict";
const Ajv = require("ajv");
const _ = require("lodash");
const result_1 = require("../result");
const standardHttpRequestHeaders = [
    'Accept',
    'Accept-Charset',
    'Accept-Datetime',
    'Accept-Encoding',
    'Accept-Language',
    'Authorization',
    'Cache-Control',
    'Connection',
    'Content-Length',
    'Content-MD5',
    'Content-Type',
    'Cookie',
    'Date',
    'Expect',
    'Forwarded',
    'From',
    'Host',
    'If-Match',
    'If-Modified-Since',
    'If-None-Match',
    'If-Range',
    'If-Unmodified-Since',
    'Max-Forwards',
    'Origin',
    'Pragma',
    'Proxy-Authorization',
    'Range',
    'Referer',
    'TE',
    'Upgrade',
    'User-Agent',
    'Via',
    'Warning'
];
const getWarningForUndefinedHeaderOrNone = (headerName, pactHeader, swaggerOperation) => {
    if (standardHttpRequestHeaders.indexOf(headerName) > -1) {
        return [];
    }
    return [result_1.default.warning({
            message: `Request header is not defined in the swagger file: ${headerName}`,
            pactSegment: pactHeader,
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation
        })];
};
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
    return ajv.errors;
};
const validateMockHeaderAgainstSpec = (headerName, swaggerHeader, pactHeader, pactInteraction) => {
    if (swaggerHeader.type === 'array') {
        return [result_1.default.warning({
                message: `Validating headers of type "${swaggerHeader.type}" are not supported, ` +
                    `assuming value is valid: ${headerName}`,
                pactSegment: pactHeader,
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerHeader
            })];
    }
    const swaggerHeaderSchema = toJsonSchema(swaggerHeader);
    const errors = validateJson(swaggerHeaderSchema, { value: (pactHeader || { value: undefined }).value });
    return _.map(errors, (error) => result_1.default.error({
        message: 'Request header is incompatible with the header parameter defined in the swagger file: ' +
            error.message,
        pactSegment: pactHeader || pactInteraction,
        source: 'swagger-pact-validation',
        swaggerSegment: swaggerHeader
    }));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swaggerOperation) => {
    const allHeaders = _.union(_.keys(pactInteraction.requestHeaders), _.keys(swaggerOperation.headerParameters));
    const validationErrors = _.map(allHeaders, (headerName) => {
        const pactHeader = pactInteraction.requestHeaders[headerName];
        const swaggerHeader = swaggerOperation.headerParameters[headerName];
        if (!swaggerHeader && pactHeader) {
            return getWarningForUndefinedHeaderOrNone(headerName, pactHeader, swaggerOperation);
        }
        return validateMockHeaderAgainstSpec(headerName, swaggerHeader, pactHeader, pactInteraction);
    });
    return _.flatten(validationErrors);
};
