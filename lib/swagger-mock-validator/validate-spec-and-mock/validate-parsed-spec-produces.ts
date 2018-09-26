import * as _ from 'lodash';
import {ValidationResult} from '../../api-types';
import {ParsedMockInteraction} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {ParsedSpecOperation, ParsedSpecValue} from '../spec-parser/parsed-spec';
import {isMediaTypeSupported} from './content-negotiation';

const acceptHeaderName = 'accept';
const contentTypeHeaderName = 'content-type';

const validateResponseContentType = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedMockResponseContentType: string,
    responseProduces: ParsedSpecValue<string[]>
) => {
    const areMediaTypesCompatible = isMediaTypeSupported(parsedMockResponseContentType, responseProduces.value);

    if (!areMediaTypesCompatible) {
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

const validateResponseContentTypeWhenNoProducesSection = (
    parsedMockInteraction: ParsedMockInteraction, parsedSpecOperation: ParsedSpecOperation
) => {
    return [result.build({
        code: 'response.content-type.unknown',
        message: 'Response Content-Type header is defined but the spec does not specify any mime-types to produce',
        mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
        source: 'spec-mock-validation',
        specSegment: parsedSpecOperation
    })];
};

const validateResponseContentTypeWhenUnavailable = () => [];

const validateParsedMockResponseContentType = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation,
    responseProduces: ParsedSpecValue<string[]>
) => {
    const parsedMockResponseContentType: string =
        _.get(parsedMockInteraction.responseHeaders[contentTypeHeaderName], 'value');

    if (!parsedMockResponseContentType) {
        return validateResponseContentTypeWhenUnavailable();
    }

    if (responseProduces.value.length === 0) {
        return validateResponseContentTypeWhenNoProducesSection(parsedMockInteraction, parsedSpecOperation);
    }

    return validateResponseContentType(parsedMockInteraction, parsedMockResponseContentType, responseProduces);
};

const checkAcceptsHeaderCompatibility = (
    parsedMockAcceptRequestHeaderValue: string,
    responseProduces: ParsedSpecValue<string[]>
) => {
    const acceptedMediaTypes = parsedMockAcceptRequestHeaderValue.split(',');

    return acceptedMediaTypes.some((acceptedMediaType) => {
        return isMediaTypeSupported(acceptedMediaType, responseProduces.value);
    });
};

const validateAcceptsHeader = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedMockAcceptRequestHeaderValue: string,
    responseProduces: ParsedSpecValue<string[]>
) => {
    const areMediaTypesCompatible =
        checkAcceptsHeaderCompatibility(parsedMockAcceptRequestHeaderValue, responseProduces);

    if (!areMediaTypesCompatible) {
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

const validateAcceptsHeaderWhenNoProducesSection = (
    parsedMockInteraction: ParsedMockInteraction, parsedSpecOperation: ParsedSpecOperation
) => {
    return [result.build({
        code: 'request.accept.unknown',
        message: 'Request Accept header is defined but the spec does not specify any mime-types to produce',
        mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
        source: 'spec-mock-validation',
        specSegment: parsedSpecOperation
    })];
};

const validateAcceptsHeaderWhenNoHeaderValue = () => [];

const validateParsedMockRequestAcceptsHeader = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation,
    responseProduces: ParsedSpecValue<string[]>
) => {
    const parsedMockAcceptRequestHeaderValue: string =
        _.get(parsedMockInteraction.requestHeaders[acceptHeaderName], 'value');

    if (!parsedMockAcceptRequestHeaderValue) {
        return validateAcceptsHeaderWhenNoHeaderValue();
    }

    if (responseProduces.value.length === 0) {
        return validateAcceptsHeaderWhenNoProducesSection(parsedMockInteraction, parsedSpecOperation);
    }

    return validateAcceptsHeader(parsedMockInteraction, parsedMockAcceptRequestHeaderValue, responseProduces);
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
        validateParsedMockResponseContentType(parsedMockInteraction, parsedSpecOperation, responseProduces)
    );
};
