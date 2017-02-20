import result from '../result';
import {
    GetSwaggerValueResult, ParsedMockInteraction, ParsedSpecOperation, ParsedSpecResponse
} from '../types';

export default (
    pactInteraction: ParsedMockInteraction,
    swaggerOperation: ParsedSpecOperation
): GetSwaggerValueResult<ParsedSpecResponse> => {
    const swaggerResponse = swaggerOperation.responses[pactInteraction.responseStatus.value];
    const defaultSwaggerResponse = swaggerOperation.responses.default;

    if (!swaggerResponse && !defaultSwaggerResponse) {
        return {
            found: false,
            results: [
                result.build({
                    code: 'spv.response.status.unknown',
                    message: 'Response status code not defined in swagger file: ' +
                        `${pactInteraction.responseStatus.value}`,
                    pactSegment: pactInteraction.responseStatus,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerOperation.responses
                })
            ]
        };
    }

    if (!swaggerResponse) {
        return {
            found: true,
            results: [
                result.build({
                    code: 'spv.response.status.default',
                    message: 'Response status code matched default response in swagger file: ' +
                        `${pactInteraction.responseStatus.value}`,
                    pactSegment: pactInteraction.responseStatus,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerOperation.responses
                })
            ],
            value: defaultSwaggerResponse as ParsedSpecResponse
        };
    }

    return {
        found: true,
        results: [],
        value: swaggerResponse
    };
};
