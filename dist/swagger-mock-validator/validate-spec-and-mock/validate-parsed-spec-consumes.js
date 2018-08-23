"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Negotiator = require("negotiator");
const result_1 = require("../result");
const contentTypeHeaderName = 'content-type';
const validateHasNoConsumesValue = (parsedMockInteraction, parsedSpecOperation, parsedMockContentTypeRequestHeaderValue) => {
    return parsedMockContentTypeRequestHeaderValue
        ? [result_1.result.build({
                code: 'request.content-type.unknown',
                message: 'Request content-type header is defined but the spec does not specify any mime-types to consume',
                mockSegment: parsedMockInteraction.requestHeaders[contentTypeHeaderName],
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation
            })]
        : [];
};
const validateHasNoContentTypeHeader = (parsedMockInteraction, parsedSpecOperation) => {
    return parsedMockInteraction.requestBody.value
        ? [result_1.result.build({
                code: 'request.content-type.missing',
                message: 'Request content type header is not defined but spec specifies mime-types to consume',
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
        return [result_1.result.build({
                code: 'request.content-type.incompatible',
                message: 'Request Content-Type header is incompatible with the mime-types the spec accepts to consume',
                mockSegment: parsedMockInteraction.requestHeaders[contentTypeHeaderName],
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation.consumes
            })];
    }
    return [];
};
exports.validateParsedSpecConsumes = (parsedMockInteraction, parsedSpecOperation) => {
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
