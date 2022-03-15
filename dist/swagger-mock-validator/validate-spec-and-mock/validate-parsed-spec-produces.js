"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParsedSpecProduces = void 0;
const result_1 = require("../result");
const content_negotiation_1 = require("./content-negotiation");
const acceptHeaderName = 'accept';
const contentTypeHeaderName = 'content-type';
const validateResponseContentType = (parsedMockInteraction, parsedMockResponseContentType, responseProduces) => {
    const areMediaTypesCompatible = content_negotiation_1.isMediaTypeSupported(parsedMockResponseContentType, responseProduces.value);
    if (!areMediaTypesCompatible) {
        return [result_1.result.build({
                code: 'response.content-type.incompatible',
                message: 'Response Content-Type header is incompatible with the mime-types the spec defines to produce',
                mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
                source: 'spec-mock-validation',
                specSegment: responseProduces
            })];
    }
    return [];
};
const validateResponseContentTypeWhenNoProducesSection = (parsedMockInteraction, parsedSpecOperation) => {
    return parsedSpecOperation.method === 'head'
        ? []
        : [result_1.result.build({
                code: 'response.content-type.unknown',
                message: 'Response Content-Type header is defined but the spec does not specify any mime-types to produce',
                mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation
            })];
};
const validateResponseContentTypeWhenUnavailable = () => [];
const validateResponseContentTypeWhenNoResponseFound = () => [];
const validateParsedMockResponseContentType = (parsedMockInteraction, parsedSpecOperation) => {
    var _a;
    const response = parsedSpecOperation.responses[parsedMockInteraction.responseStatus.value];
    if (!response) {
        return validateResponseContentTypeWhenNoResponseFound();
    }
    const parsedMockResponseContentType = (_a = parsedMockInteraction.responseHeaders[contentTypeHeaderName]) === null || _a === void 0 ? void 0 : _a.value;
    if (!parsedMockResponseContentType) {
        return validateResponseContentTypeWhenUnavailable();
    }
    if (response.produces.value.length === 0) {
        return validateResponseContentTypeWhenNoProducesSection(parsedMockInteraction, parsedSpecOperation);
    }
    return validateResponseContentType(parsedMockInteraction, parsedMockResponseContentType, response.produces);
};
const checkAcceptsHeaderCompatibility = (parsedMockAcceptRequestHeaderValue, responseProduces) => {
    const acceptedMediaTypes = parsedMockAcceptRequestHeaderValue.split(',');
    return acceptedMediaTypes.some((acceptedMediaType) => {
        return content_negotiation_1.isMediaTypeSupported(acceptedMediaType, responseProduces.value);
    });
};
const validateAcceptsHeader = (parsedMockInteraction, parsedMockAcceptRequestHeaderValue, responseProduces) => {
    const areMediaTypesCompatible = checkAcceptsHeaderCompatibility(parsedMockAcceptRequestHeaderValue, responseProduces);
    if (!areMediaTypesCompatible) {
        return [result_1.result.build({
                code: 'request.accept.incompatible',
                message: 'Request Accept header is incompatible with the mime-types the spec defines to produce',
                mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
                source: 'spec-mock-validation',
                specSegment: responseProduces
            })];
    }
    return [];
};
const validateAcceptsHeaderWhenNoProducesSection = (parsedMockInteraction, parsedSpecOperation) => {
    return [result_1.result.build({
            code: 'request.accept.unknown',
            message: 'Request Accept header is defined but the spec does not specify any mime-types to produce',
            mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })];
};
const validateAcceptsHeaderWhenNoHeaderValue = () => [];
const validateParsedMockRequestAcceptsHeader = (parsedMockInteraction, parsedSpecOperation) => {
    var _a;
    const parsedMockAcceptRequestHeaderValue = (_a = parsedMockInteraction.requestHeaders[acceptHeaderName]) === null || _a === void 0 ? void 0 : _a.value;
    if (!parsedMockAcceptRequestHeaderValue) {
        return validateAcceptsHeaderWhenNoHeaderValue();
    }
    if (parsedSpecOperation.produces.value.length === 0) {
        return validateAcceptsHeaderWhenNoProducesSection(parsedMockInteraction, parsedSpecOperation);
    }
    return validateAcceptsHeader(parsedMockInteraction, parsedMockAcceptRequestHeaderValue, parsedSpecOperation.produces);
};
const validateParsedSpecProduces = (parsedMockInteraction, parsedSpecOperation) => [
    ...validateParsedMockRequestAcceptsHeader(parsedMockInteraction, parsedSpecOperation),
    ...validateParsedMockResponseContentType(parsedMockInteraction, parsedSpecOperation)
];
exports.validateParsedSpecProduces = validateParsedSpecProduces;
