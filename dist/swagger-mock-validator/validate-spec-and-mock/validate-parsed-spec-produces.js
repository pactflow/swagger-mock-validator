"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Negotiator = require("negotiator");
const result_1 = require("../result");
const acceptHeaderName = 'accept';
const contentTypeHeaderName = 'content-type';
const negotiateMediaType = (acceptableMediaTypes, availableMediaTypes) => new Negotiator({ headers: { accept: acceptableMediaTypes } }).mediaTypes(availableMediaTypes);
const validateParsedMockRequestAcceptsHeader = (parsedMockInteraction, parsedSpecOperation) => {
    const parsedMockAcceptRequestHeaderValue = _.get(parsedMockInteraction.requestHeaders[acceptHeaderName], 'value');
    if (!parsedMockAcceptRequestHeaderValue) {
        return [];
    }
    if (parsedSpecOperation.produces.value.length === 0) {
        return [result_1.default.build({
                code: 'spv.request.accept.unknown',
                message: 'Request Accept header is defined but there is no produces definition in the spec',
                mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation
            })];
    }
    const matchingMediaTypes = negotiateMediaType(parsedMockAcceptRequestHeaderValue, parsedSpecOperation.produces.value);
    if (matchingMediaTypes.length === 0) {
        return [result_1.default.build({
                code: 'spv.request.accept.incompatible',
                message: 'Request Accept header is incompatible with the produces mime type defined in the swagger file',
                mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation.produces
            })];
    }
    return [];
};
const validateParsedMockResponseContentTypeAndBody = (parsedMockInteraction, parsedSpecOperation) => {
    const parsedMockResponseContentType = _.get(parsedMockInteraction.responseHeaders[contentTypeHeaderName], `value`);
    if (!parsedMockResponseContentType) {
        return [];
    }
    if (parsedSpecOperation.produces.value.length === 0) {
        return [result_1.default.build({
                code: 'spv.response.content-type.unknown',
                message: 'Response Content-Type header is defined but there is no produces definition in the spec',
                mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation
            })];
    }
    const matchingMediaTypes = negotiateMediaType(parsedMockResponseContentType, parsedSpecOperation.produces.value);
    if (matchingMediaTypes.length === 0) {
        return [result_1.default.build({
                code: 'spv.response.content-type.incompatible',
                message: 'Response Content-Type header is incompatible with the produces mime ' +
                    'type defined in the swagger file',
                mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation.produces
            })];
    }
    return [];
};
exports.default = (parsedMockInteraction, parsedSpecOperation) => {
    return _.concat(validateParsedMockRequestAcceptsHeader(parsedMockInteraction, parsedSpecOperation), validateParsedMockResponseContentTypeAndBody(parsedMockInteraction, parsedSpecOperation));
};
