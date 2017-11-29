"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Negotiator = require("negotiator");
const result_1 = require("../result");
const contentTypeHeaderName = 'content-type';
const validateHasNoConsumesValue = (parsedMockInteraction, parsedSpecOperation, parsedMockContentTypeRequestHeaderValue) => {
    return parsedMockContentTypeRequestHeaderValue
        ? [result_1.default.build({
                code: 'spv.request.content-type.unknown',
                message: 'Request content-type header is defined but there is no consumes definition in the spec',
                mockSegment: parsedMockInteraction.requestHeaders[contentTypeHeaderName],
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation
            })]
        : [];
};
const validateHasNoContentTypeHeader = (parsedMockInteraction, parsedSpecOperation) => {
    return parsedMockInteraction.requestBody.value
        ? [result_1.default.build({
                code: 'spv.request.content-type.missing',
                message: 'Request content type header is not defined but there is consumes definition in the spec',
                mockSegment: parsedMockInteraction,
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation.consumes
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
const negotiateMediaTypes = (parsedMockContentTypeRequestHeaderValue, parsedSpecConsumesValues) => {
    return parsedSpecConsumesValues.some((consumesValue) => {
        const foundMatches = newNegotiator(consumesValue)
            .mediaTypes([parsedMockContentTypeRequestHeaderValue]);
        return foundMatches.length > 0;
    });
};
const validateParsedMockContentTypeAgainstParsedSpecConsumes = (parsedMockInteraction, parsedSpecOperation, parsedMockContentTypeRequestHeaderValue) => {
    const foundMatches = negotiateMediaTypes(parsedMockContentTypeRequestHeaderValue, parsedSpecOperation.consumes.value);
    if (!foundMatches) {
        return [result_1.default.build({
                code: 'spv.request.content-type.incompatible',
                message: 'Request Content-Type header is incompatible with the consumes mime type defined in the swagger file',
                mockSegment: parsedMockInteraction.requestHeaders[contentTypeHeaderName],
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation.consumes
            })];
    }
    return [];
};
exports.default = (parsedMockInteraction, parsedSpecOperation) => {
    const parsedMockContentTypeRequestHeaderValue = _.get(parsedMockInteraction.requestHeaders[contentTypeHeaderName], 'value');
    const parsedSpecHasConsumesValue = parsedSpecOperation.consumes.value.length > 0;
    if (!parsedSpecHasConsumesValue) {
        return validateHasNoConsumesValue(parsedMockInteraction, parsedSpecOperation, parsedMockContentTypeRequestHeaderValue);
    }
    if (!parsedMockContentTypeRequestHeaderValue) {
        return validateHasNoContentTypeHeader(parsedMockInteraction, parsedSpecOperation);
    }
    return validateParsedMockContentTypeAgainstParsedSpecConsumes(parsedMockInteraction, parsedSpecOperation, parsedMockContentTypeRequestHeaderValue);
};
