"use strict";
const _ = require("lodash");
const Negotiator = require("negotiator");
const result_1 = require("../result");
const contentTypeHeaderName = 'content-type';
const validateSwaggerHasNoConsumesValue = (pactInteraction, swaggerOperation, pactContentTypeHeaderValue) => {
    return pactContentTypeHeaderValue
        ? [result_1.default.build({
                code: 'spv.request.content-type.unknown',
                message: 'Request content-type header is defined but there is no consumes definition in the spec',
                pactSegment: pactInteraction.requestHeaders[contentTypeHeaderName],
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerOperation
            })]
        : [];
};
const validatePactHasNoContentTypeHeader = (pactInteraction, swaggerOperation) => {
    return pactInteraction.requestBody.value
        ? [result_1.default.build({
                code: 'spv.request.content-type.missing',
                message: 'Request content type header is not defined but there is consumes definition in the spec',
                pactSegment: pactInteraction,
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerOperation.consumes
            })]
        : [];
};
const newNegotiator = (acceptHeaderValue) => {
    return new Negotiator({
        headers: {
            accept: acceptHeaderValue
        }
    });
};
const validatePactContentTypeAgainstSwaggerConsumes = (pactInteraction, swaggerOperation, pactContentTypeHeaderValue) => {
    const foundMatches = newNegotiator(pactContentTypeHeaderValue).mediaTypes(swaggerOperation.consumes.value);
    if (foundMatches.length === 0) {
        return [result_1.default.build({
                code: 'spv.request.content-type.incompatible',
                message: 'Request Content-Type header is incompatible with the consumes mime type defined in the swagger file',
                pactSegment: pactInteraction.requestHeaders[contentTypeHeaderName],
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerOperation.consumes
            })];
    }
    return [];
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swaggerOperation) => {
    const pactContentTypeHeaderValue = _.get(pactInteraction.requestHeaders[contentTypeHeaderName], 'value');
    const swaggerHasConsumesValue = swaggerOperation.consumes.value.length > 0;
    if (!swaggerHasConsumesValue) {
        return validateSwaggerHasNoConsumesValue(pactInteraction, swaggerOperation, pactContentTypeHeaderValue);
    }
    if (!pactContentTypeHeaderValue) {
        return validatePactHasNoContentTypeHeader(pactInteraction, swaggerOperation);
    }
    return validatePactContentTypeAgainstSwaggerConsumes(pactInteraction, swaggerOperation, pactContentTypeHeaderValue);
};
