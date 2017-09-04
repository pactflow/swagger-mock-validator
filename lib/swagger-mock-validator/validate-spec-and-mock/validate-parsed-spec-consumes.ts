import * as _ from 'lodash';
import Negotiator = require('negotiator');
import result from '../result';
import {ParsedMockInteraction, ParsedSpecOperation} from '../types';

const contentTypeHeaderName = 'content-type';

const validateHasNoConsumesValue = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation,
    parsedMockContentTypeRequestHeaderValue: string
) => {
    return parsedMockContentTypeRequestHeaderValue
        ? [result.build({
            code: 'spv.request.content-type.unknown',
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
            code: 'spv.request.content-type.missing',
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

const validateParedMockContentTypeAgainstParsedSpecConsumes = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation,
    parsedMockContentTypeRequestHeaderValue: string
) => {
    const foundMatches = newNegotiator(parsedMockContentTypeRequestHeaderValue)
        .mediaTypes(parsedSpecOperation.consumes.value);

    if (foundMatches.length === 0) {
        return [result.build({
            code: 'spv.request.content-type.incompatible',
            message:
                'Request Content-Type header is incompatible with the consumes mime type defined in the swagger file',
            mockSegment: parsedMockInteraction.requestHeaders[contentTypeHeaderName],
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation.consumes
        })];
    }

    return [];
};

export default (parsedMockInteraction: ParsedMockInteraction, parsedSpecOperation: ParsedSpecOperation) => {
    const parsedMockContentTypeRequestHeaderValue =
        _.get<string>(parsedMockInteraction.requestHeaders[contentTypeHeaderName], 'value');
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

    return validateParedMockContentTypeAgainstParsedSpecConsumes(
        parsedMockInteraction,
        parsedSpecOperation,
        parsedMockContentTypeRequestHeaderValue
    );
};
