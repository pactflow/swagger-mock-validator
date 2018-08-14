import * as _ from 'lodash';
import Negotiator = require('negotiator');
import {ValidationResult} from '../../api-types';
import {ParsedMockInteraction} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {ParsedSpecOperation, ParsedSpecValue} from '../spec-parser/parsed-spec';

const acceptHeaderName = 'accept';
const contentTypeHeaderName = 'content-type';

const negotiateMediaType = (acceptableMediaTypes: string, availableMediaTypes: string[]) =>
    new Negotiator({headers: {accept: acceptableMediaTypes}}).mediaTypes(availableMediaTypes);

const validateParsedMockRequestAcceptsHeader = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation,
    responseProduces: ParsedSpecValue<string[]>
) => {
    const parsedMockAcceptRequestHeaderValue: string =
        _.get(parsedMockInteraction.requestHeaders[acceptHeaderName], 'value');

    if (!parsedMockAcceptRequestHeaderValue) {
        return [];
    }

    if (responseProduces.value.length === 0) {
        return [result.build({
            code: 'request.accept.unknown',
            message: 'Request Accept header is defined but the spec does not specify any mime-types to produce',
            mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })];
    }

    const matchingMediaTypes =
        negotiateMediaType(parsedMockAcceptRequestHeaderValue, responseProduces.value);

    if (matchingMediaTypes.length === 0) {
        return [result.build({
            code: 'request.accept.incompatible',
            message: 'Request Accept header is incompatible with the mime-types the spec defines to produce',
            mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
            source: 'spec-mock-validation',
            specSegment: responseProduces
        })];
    }

    return [];
};

const validateParsedMockResponseContentTypeAndBody = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation,
    responseProduces: ParsedSpecValue<string[]>
) => {
    const parsedMockResponseContentType: string =
        _.get(parsedMockInteraction.responseHeaders[contentTypeHeaderName], 'value');

    if (!parsedMockResponseContentType) {
        return [];
    }

    if (responseProduces.value.length === 0) {
        return [result.build({
            code: 'response.content-type.unknown',
            message: 'Response Content-Type header is defined but the spec does not specify any mime-types to produce',
            mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })];
    }

    const matchingMediaTypes = negotiateMediaType(parsedMockResponseContentType, responseProduces.value);

    if (matchingMediaTypes.length === 0) {
        return [result.build({
            code: 'response.content-type.incompatible',
            message: 'Response Content-Type header is incompatible with the mime-types the spec defines to produce',
            mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
            source: 'spec-mock-validation',
            specSegment: responseProduces
        })];
    }

    return [];
};

const getResponseProduceMimeTypes = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
): ParsedSpecValue<string[]> | undefined => {
    const response = parsedSpecOperation.responses[parsedMockInteraction.responseStatus.value];
    return response
        ? response.produces
        : undefined;
};

export const validateParsedSpecProduces = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
): ValidationResult[] => {
    const responseProduces = getResponseProduceMimeTypes(parsedMockInteraction, parsedSpecOperation);
    if (!responseProduces) {
        return [];
    }
    return _.concat(
        validateParsedMockRequestAcceptsHeader(parsedMockInteraction, parsedSpecOperation, responseProduces),
        validateParsedMockResponseContentTypeAndBody(parsedMockInteraction, parsedSpecOperation, responseProduces)
    );
};
