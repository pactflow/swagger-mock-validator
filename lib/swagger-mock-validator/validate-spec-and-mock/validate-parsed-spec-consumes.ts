import * as _ from 'lodash';
import Negotiator = require('negotiator');
import {result} from '../result';
import {ParsedMockInteraction, ParsedSpecOperation} from '../types';

const contentTypeHeaderName = 'content-type';

const validateHasNoConsumesValue = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation,
    parsedMockContentTypeRequestHeaderValue: string
) => {
    return parsedMockContentTypeRequestHeaderValue
        ? [result.build({
            code: 'request.content-type.unknown',
            message: 'Request content-type header is defined but there is no consumes definition in the spec',
            mockSegment: parsedMockInteraction.requestHeaders[contentTypeHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })]
        : [];
};

const validateHasNoContentTypeHeader = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => {
    return parsedMockInteraction.requestBody.value
        ? [result.build({
            code: 'request.content-type.missing',
            message: 'Request content type header is not defined but there is consumes definition in the spec',
            mockSegment: parsedMockInteraction,
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation.consumes
        })]
        : [];
};

const newNegotiator = (acceptHeaderValue: string) => {
    return new Negotiator({
        headers: {
            accept: acceptHeaderValue
        }
    });
};

const negotiateMediaTypes = (
    parsedMockContentTypeRequestHeaderValue: string, parsedSpecConsumesValues: string[]
): boolean => {
    return parsedSpecConsumesValues.some((consumesValue) => {
        const foundMatches = newNegotiator(consumesValue)
            .mediaTypes([parsedMockContentTypeRequestHeaderValue]);
        return foundMatches.length > 0;
    });
};

const validateParsedMockContentTypeAgainstParsedSpecConsumes = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation,
    parsedMockContentTypeRequestHeaderValue: string
) => {
    const foundMatches = negotiateMediaTypes(
        parsedMockContentTypeRequestHeaderValue, parsedSpecOperation.consumes.value
    );

    if (!foundMatches) {
        return [result.build({
            code: 'request.content-type.incompatible',
            message:
                'Request Content-Type header is incompatible with the consumes mime type defined in the swagger file',
            mockSegment: parsedMockInteraction.requestHeaders[contentTypeHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation.consumes
        })];
    }

    return [];
};

export const validateParsedSpecConsumes = (parsedMockInteraction: ParsedMockInteraction,
                                           parsedSpecOperation: ParsedSpecOperation) => {
    const parsedMockContentTypeRequestHeaderValue: string =
        _.get(parsedMockInteraction.requestHeaders[contentTypeHeaderName], 'value');
    const parsedSpecHasConsumesValue = parsedSpecOperation.consumes.value.length > 0;

    if (!parsedSpecHasConsumesValue) {
        return validateHasNoConsumesValue(
            parsedMockInteraction,
            parsedSpecOperation,
            parsedMockContentTypeRequestHeaderValue
        );
    }

    if (!parsedMockContentTypeRequestHeaderValue) {
        return validateHasNoContentTypeHeader(parsedMockInteraction, parsedSpecOperation);
    }

    return validateParsedMockContentTypeAgainstParsedSpecConsumes(
        parsedMockInteraction,
        parsedSpecOperation,
        parsedMockContentTypeRequestHeaderValue
    );
};
