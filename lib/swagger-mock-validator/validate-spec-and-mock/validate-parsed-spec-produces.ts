import { ValidationResult } from '../../api-types';
import { ParsedMockInteraction } from '../mock-parser/parsed-mock';
import { result } from '../result';
import { ParsedSpecOperation, ParsedSpecValue } from '../spec-parser/parsed-spec';
import { findMatchingType } from './content-negotiation';

const acceptHeaderName = 'accept';
const contentTypeHeaderName = 'content-type';

const validateResponseContentType = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedMockResponseContentType: string,
    responseProduces: ParsedSpecValue<string[]>
) => {
    const type = findMatchingType(parsedMockResponseContentType, responseProduces.value);

    if (!type) {
        return [
            result.build({
                code: 'response.content-type.incompatible',
                message: 'Response Content-Type header is incompatible with the mime-types the spec defines to produce',
                mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
                source: 'spec-mock-validation',
                specSegment: responseProduces,
            }),
        ];
    }

    return [];
};

const validateResponseContentTypeWhenNoProducesSection = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => {
    return parsedSpecOperation.method === 'head'
        ? []
        : [
              result.build({
                  code: 'response.content-type.unknown',
                  message:
                      'Response Content-Type header is defined but the spec does not specify any mime-types to produce',
                  mockSegment: parsedMockInteraction.responseHeaders[contentTypeHeaderName],
                  source: 'spec-mock-validation',
                  specSegment: parsedSpecOperation,
              }),
          ];
};

const validateResponseContentTypeWhenUnavailable = () => [];

const validateResponseContentTypeWhenNoResponseFound = () => [];

const validateParsedMockResponseContentType = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => {
    const response = parsedSpecOperation.responses[parsedMockInteraction.responseStatus.value];
    if (!response) {
        return validateResponseContentTypeWhenNoResponseFound();
    }

    const parsedMockResponseContentType = parsedMockInteraction.responseHeaders[contentTypeHeaderName]?.value;
    if (!parsedMockResponseContentType) {
        return validateResponseContentTypeWhenUnavailable();
    }

    if (response.produces.value.length === 0) {
        return validateResponseContentTypeWhenNoProducesSection(parsedMockInteraction, parsedSpecOperation);
    }

    return validateResponseContentType(parsedMockInteraction, parsedMockResponseContentType, response.produces);
};

const checkAcceptsHeaderCompatibility = (
    parsedMockAcceptRequestHeaderValue: string,
    responseProduces: ParsedSpecValue<string[]>
) => {
    const acceptedMediaTypes = parsedMockAcceptRequestHeaderValue.split(',');

    return acceptedMediaTypes.some((acceptedMediaType) => {
        return !!findMatchingType(acceptedMediaType, responseProduces.value);
    });
};

const validateAcceptsHeader = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedMockAcceptRequestHeaderValue: string,
    responseProduces: ParsedSpecValue<string[]>
) => {
    const areMediaTypesCompatible = checkAcceptsHeaderCompatibility(
        parsedMockAcceptRequestHeaderValue,
        responseProduces
    );

    if (!areMediaTypesCompatible) {
        return [
            result.build({
                code: 'request.accept.incompatible',
                message: 'Request Accept header is incompatible with the mime-types the spec defines to produce',
                mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
                source: 'spec-mock-validation',
                specSegment: responseProduces,
            }),
        ];
    }

    return [];
};

const validateAcceptsHeaderWhenNoProducesSection = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => {
    return [
        result.build({
            code: 'request.accept.unknown',
            message: 'Request Accept header is defined but the spec does not specify any mime-types to produce',
            mockSegment: parsedMockInteraction.requestHeaders[acceptHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation,
        }),
    ];
};

const validateAcceptsHeaderWhenNoHeaderValue = () => [];

const validateParsedMockRequestAcceptsHeader = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => {
    const parsedMockAcceptRequestHeaderValue = parsedMockInteraction.requestHeaders[acceptHeaderName]?.value;

    if (!parsedMockAcceptRequestHeaderValue) {
        return validateAcceptsHeaderWhenNoHeaderValue();
    }

    if (parsedSpecOperation.produces.value.length === 0) {
        return validateAcceptsHeaderWhenNoProducesSection(parsedMockInteraction, parsedSpecOperation);
    }

    return validateAcceptsHeader(
        parsedMockInteraction,
        parsedMockAcceptRequestHeaderValue,
        parsedSpecOperation.produces
    );
};

export const validateParsedSpecProduces = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
): ValidationResult[] => [
    ...validateParsedMockRequestAcceptsHeader(parsedMockInteraction, parsedSpecOperation),
    ...validateParsedMockResponseContentType(parsedMockInteraction, parsedSpecOperation),
];
