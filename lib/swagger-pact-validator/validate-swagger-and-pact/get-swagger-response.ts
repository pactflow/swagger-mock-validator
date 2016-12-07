import result from '../result';
import {ParsedMockInteraction, ParsedSpecOperation} from '../types';

export default (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation) => {
    const swaggerResponse = swaggerOperation.responses[pactInteraction.responseStatus.value];
    const defaultSwaggerResponse = swaggerOperation.responses.default;

    if (!swaggerResponse && !defaultSwaggerResponse) {
        return {
            found: false,
            results: [
                result.error({
                    message: 'Response status code not defined in swagger file: ' +
                        `${pactInteraction.responseStatus.value}`,
                    pactSegment: pactInteraction.responseStatus,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerOperation.responses
                })
            ],
            value: null
        };
    }

    if (!swaggerResponse) {
        return {
            found: true,
            results: [
                result.warning({
                    message: 'Response status code matched default response in swagger file: ' +
                        `${pactInteraction.responseStatus.value}`,
                    pactSegment: pactInteraction.responseStatus,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerOperation.responses
                })
            ],
            value: defaultSwaggerResponse
        };
    }

    return {
        found: true,
        results: [],
        value: swaggerResponse
    };
};
