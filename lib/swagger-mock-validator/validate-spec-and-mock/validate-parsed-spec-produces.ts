import * as _ from 'lodash';
import Negotiator = require('negotiator');
import {ValidationResult} from '../../api-types';
import {result} from '../result';
import {ParsedMockInteraction, ParsedSpecOperation} from '../types';

const acceptHeaderName = 'accept';
const contentTypeHeaderName = 'content-type';

const negotiateMediaType = (acceptableMediaTypes: string, availableMediaTypes: string[]) =>
    new Negotiator({headers: {accept: acceptableMediaTypes}}).mediaTypes(availableMediaTypes);

const validateParsedMockRequestAcceptsHeader = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => {
    const parsedMockAcceptRequestHeaderValue: string =
        _.get(parsedMockInteraction.requestHeaders[acceptHeaderName], 'value');

    if (!parsedMockAcceptRequestHeaderValue) {
        return [];
    }

    if (parsedSpecOperation.produces.value.length === 0) {
        return [result.build({
            code: 'request.accept.unknown',
            message: 'Request Accept header is defined but there is no produces definition in the spec',
            mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })];
    }

    const matchingMediaTypes =
        negotiateMediaType(parsedMockAcceptRequestHeaderValue, parsedSpecOperation.produces.value);

    if (matchingMediaTypes.length === 0) {
        return [result.build({
            code: 'request.accept.incompatible',
            message: 'Request Accept header is incompatible with the produces mime type defined in the swagger file',
            mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation.produces
        })];
    }

    return [];
};

const validateParsedMockResponseContentTypeAndBody = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => {
    const parsedMockResponseContentType: string =
        _.get(parsedMockInteraction.responseHeaders[contentTypeHeaderName], `value`);

    if (!parsedMockResponseContentType) {
        return [];
    }

    if (parsedSpecOperation.produces.value.length === 0) {
        return [result.build({
            code: 'response.content-type.unknown',
            message: 'Response Content-Type header is defined but there is no produces definition in the spec',
            mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })];
    }

    const matchingMediaTypes = negotiateMediaType(parsedMockResponseContentType, parsedSpecOperation.produces.value);

    if (matchingMediaTypes.length === 0) {
        return [result.build({
            code: 'response.content-type.incompatible',
            message: 'Response Content-Type header is incompatible with the produces mime ' +
            'type defined in the swagger file',
            mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation.produces
        })];
    }

    return [];
};

export const validateParsedSpecProduces = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
): ValidationResult[] => {
    return _.concat(
        validateParsedMockRequestAcceptsHeader(parsedMockInteraction, parsedSpecOperation),
        validateParsedMockResponseContentTypeAndBody(parsedMockInteraction, parsedSpecOperation)
    );
};
