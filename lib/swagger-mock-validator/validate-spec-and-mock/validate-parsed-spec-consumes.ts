import _ from 'lodash';
import {ParsedMockInteraction} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {ParsedSpecOperation} from '../spec-parser/parsed-spec';
import {isMediaTypeSupported} from './content-negotiation';

const contentTypeHeaderName = 'content-type';

const validateParsedMockContentTypeAgainstParsedSpecConsumes = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation,
    parsedMockContentTypeRequestHeaderValue: string
) => {
    const areMediaTypesCompatible = isMediaTypeSupported(
        parsedMockContentTypeRequestHeaderValue, parsedSpecOperation.consumes.value
    );

    if (!areMediaTypesCompatible) {
        return [result.build({
            code: 'request.content-type.incompatible',
            message:
                'Request Content-Type header is incompatible with the mime-types the spec accepts to consume',
            mockSegment: parsedMockInteraction.requestHeaders[contentTypeHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation.consumes
        })];
    }

    return [];
};

const validateHasNoContentTypeHeader = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => {
    return parsedMockInteraction.requestBody.value
        ? [result.build({
            code: 'request.content-type.missing',
            message: 'Request content type header is not defined but spec specifies mime-types to consume',
            mockSegment: parsedMockInteraction,
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation.consumes
        })]
        : [];
};

const validateHasNoConsumesValue = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation,
    parsedMockContentTypeRequestHeaderValue: string
) => {
    return parsedMockContentTypeRequestHeaderValue
        ? [result.build({
            code: 'request.content-type.unknown',
            message: 'Request content-type header is defined but the spec does not specify any mime-types to consume',
            mockSegment: parsedMockInteraction.requestHeaders[contentTypeHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })]
        : [];
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
