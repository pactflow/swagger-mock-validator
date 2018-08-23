"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Negotiator = require("negotiator");
const result_1 = require("../result");
const acceptHeaderName = 'accept';
const contentTypeHeaderName = 'content-type';
const negotiateMediaType = (acceptableMediaTypes, availableMediaTypes) => new Negotiator({ headers: { accept: acceptableMediaTypes } }).mediaTypes(availableMediaTypes);
const validateParsedMockRequestAcceptsHeader = (parsedMockInteraction, parsedSpecOperation, responseProduces) => {
    const parsedMockAcceptRequestHeaderValue = _.get(parsedMockInteraction.requestHeaders[acceptHeaderName], 'value');
    if (!parsedMockAcceptRequestHeaderValue) {
        return [];
    }
    if (responseProduces.value.length === 0) {
        return [result_1.result.build({
                code: 'request.accept.unknown',
                message: 'Request Accept header is defined but the spec does not specify any mime-types to produce',
                mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation
            })];
    }
    const matchingMediaTypes = negotiateMediaType(parsedMockAcceptRequestHeaderValue, responseProduces.value);
    if (matchingMediaTypes.length === 0) {
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
const validateParsedMockResponseContentTypeAndBody = (parsedMockInteraction, parsedSpecOperation, responseProduces) => {
    const parsedMockResponseContentType = _.get(parsedMockInteraction.responseHeaders[contentTypeHeaderName], 'value');
    if (!parsedMockResponseContentType) {
        return [];
    }
    if (responseProduces.value.length === 0) {
        return [result_1.result.build({
                code: 'response.content-type.unknown',
                message: 'Response Content-Type header is defined but the spec does not specify any mime-types to produce',
                mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation
            })];
    }
    const matchingMediaTypes = negotiateMediaType(parsedMockResponseContentType, responseProduces.value);
    if (matchingMediaTypes.length === 0) {
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
    return _.concat(validateParsedMockRequestAcceptsHeader(parsedMockInteraction, parsedSpecOperation, responseProduces), validateParsedMockResponseContentTypeAndBody(parsedMockInteraction, parsedSpecOperation, responseProduces));
};
