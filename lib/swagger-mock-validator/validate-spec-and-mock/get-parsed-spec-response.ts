import {result} from '../result';
import {
    GetSwaggerValueResult, ParsedMockInteraction, ParsedSpecOperation, ParsedSpecResponse
} from '../types';

export const getParsedSpecResponse = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
): GetSwaggerValueResult<ParsedSpecResponse> => {
    const parsedSpecResponse = parsedSpecOperation.responses[parsedMockInteraction.responseStatus.value];
    const parsedSpecDefaultResponse = parsedSpecOperation.responses.default;

    if (!parsedSpecResponse && !parsedSpecDefaultResponse) {
        return {
            found: false,
            results: [
                result.build({
                    code: 'response.status.unknown',
                    message: 'Response status code not defined in swagger file: ' +
                        `${parsedMockInteraction.responseStatus.value}`,
                    mockSegment: parsedMockInteraction.responseStatus,
                    source: 'spec-mock-validation',
                    specSegment: parsedSpecOperation.responses
                })
            ]
        };
    }

    if (!parsedSpecResponse) {
        return {
            found: true,
            results: [
                result.build({
                    code: 'response.status.default',
                    message: 'Response status code matched default response in swagger file: ' +
                        `${parsedMockInteraction.responseStatus.value}`,
                    mockSegment: parsedMockInteraction.responseStatus,
                    source: 'spec-mock-validation',
                    specSegment: parsedSpecOperation.responses
                })
            ],
            value: parsedSpecDefaultResponse as ParsedSpecResponse
        };
    }

    return {
        found: true,
        results: [],
        value: parsedSpecResponse
    };
};
