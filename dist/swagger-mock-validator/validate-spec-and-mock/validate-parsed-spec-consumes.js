"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParsedSpecConsumes = void 0;
const _ = require("lodash");
const result_1 = require("../result");
const content_negotiation_1 = require("./content-negotiation");
const contentTypeHeaderName = 'content-type';
const validateParsedMockContentTypeAgainstParsedSpecConsumes = (parsedMockInteraction, parsedSpecOperation, parsedMockContentTypeRequestHeaderValue) => {
    const areMediaTypesCompatible = content_negotiation_1.isMediaTypeSupported(parsedMockContentTypeRequestHeaderValue, parsedSpecOperation.consumes.value);
    if (!areMediaTypesCompatible) {
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
