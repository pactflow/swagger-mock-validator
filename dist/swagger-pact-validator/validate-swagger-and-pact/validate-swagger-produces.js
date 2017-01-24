"use strict";
const _ = require("lodash");
const Negotiator = require("negotiator");
const result_1 = require("../result");
const acceptHeaderName = 'accept';
const contentTypeHeaderName = 'content-type';
const negotiateMediaType = (acceptableMediaTypes, availableMediaTypes) => new Negotiator({ headers: { accept: acceptableMediaTypes } }).mediaTypes(availableMediaTypes);
const validatePactRequestAcceptsHeader = (pactInteraction, swaggerOperation) => {
    const acceptHeaderValue = _.get(pactInteraction.requestHeaders[acceptHeaderName], 'value');
    if (!acceptHeaderValue) {
        return [];
    }
    if (swaggerOperation.produces.value.length === 0) {
        return [result_1.default.warning({
                message: 'Request Accept header is defined but there is no produces definition in the spec',
                pactSegment: pactInteraction.requestHeaders[acceptHeaderName],
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerOperation
            })];
    }
    const matchingMediaTypes = negotiateMediaType(acceptHeaderValue, swaggerOperation.produces.value);
    if (matchingMediaTypes.length === 0) {
        return [result_1.default.error({
                message: 'Request Accept header is incompatible with the produces mime type defined in the swagger file',
                pactSegment: pactInteraction.requestHeaders[acceptHeaderName],
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerOperation.produces
            })];
    }
    return [];
};
const validatePactResponseContentTypeAndBody = (pactInteraction, swaggerOperation) => {
    const contentType = _.get(pactInteraction.responseHeaders[contentTypeHeaderName], `value`);
    if (!contentType) {
        return [];
    }
    if (swaggerOperation.produces.value.length === 0) {
        return [result_1.default.warning({
                message: 'Response Content-Type header is defined but there is no produces definition in the spec',
                pactSegment: pactInteraction.responseHeaders[contentTypeHeaderName],
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerOperation
            })];
    }
    const matchingMediaTypes = negotiateMediaType(contentType, swaggerOperation.produces.value);
    if (matchingMediaTypes.length === 0) {
        return [result_1.default.error({
                message: 'Response Content-Type header is incompatible with the produces mime ' +
                    'type defined in the swagger file',
                pactSegment: pactInteraction.responseHeaders[contentTypeHeaderName],
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerOperation.produces
            })];
    }
    return [];
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swaggerOperation) => {
    return _.concat(validatePactRequestAcceptsHeader(pactInteraction, swaggerOperation), validatePactResponseContentTypeAndBody(pactInteraction, swaggerOperation));
};
