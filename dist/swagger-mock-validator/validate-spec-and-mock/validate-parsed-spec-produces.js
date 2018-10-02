"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
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
    return [result_1.result.build({
            code: 'response.content-type.unknown',
            message: 'Response Content-Type header is defined but the spec does not specify any mime-types to produce',
            mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })];
};
const validateResponseContentTypeWhenUnavailable = () => [];
const validateParsedMockResponseContentType = (parsedMockInteraction, parsedSpecOperation, responseProduces) => {
    const parsedMockResponseContentType = _.get(parsedMockInteraction.responseHeaders[contentTypeHeaderName], 'value');
    if (!parsedMockResponseContentType) {
        return validateResponseContentTypeWhenUnavailable();
    }
    if (responseProduces.value.length === 0) {
        return validateResponseContentTypeWhenNoProducesSection(parsedMockInteraction, parsedSpecOperation);
    }
    return validateResponseContentType(parsedMockInteraction, parsedMockResponseContentType, responseProduces);
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
const validateParsedMockRequestAcceptsHeader = (parsedMockInteraction, parsedSpecOperation, responseProduces) => {
    const parsedMockAcceptRequestHeaderValue = _.get(parsedMockInteraction.requestHeaders[acceptHeaderName], 'value');
    if (!parsedMockAcceptRequestHeaderValue) {
        return validateAcceptsHeaderWhenNoHeaderValue();
    }
    if (responseProduces.value.length === 0) {
        return validateAcceptsHeaderWhenNoProducesSection(parsedMockInteraction, parsedSpecOperation);
    }
    return validateAcceptsHeader(parsedMockInteraction, parsedMockAcceptRequestHeaderValue, responseProduces);
};
const getResponseProduceMimeTypes = (parsedMockInteraction, parsedSpecOperation) => {
    const response = parsedSpecOperation.responses[parsedMockInteraction.responseStatus.value];
    return response
        ? response.produces
        : undefined;
};
exports.validateParsedSpecProduces = (parsedMockInteraction, parsedSpecOperation) => {
    const responseProduces = getResponseProduceMimeTypes(parsedMockInteraction, parsedSpecOperation);
    if (!responseProduces) {
        return [];
    }
    return _.concat(validateParsedMockRequestAcceptsHeader(parsedMockInteraction, parsedSpecOperation, responseProduces), validateParsedMockResponseContentType(parsedMockInteraction, parsedSpecOperation, responseProduces));
};
