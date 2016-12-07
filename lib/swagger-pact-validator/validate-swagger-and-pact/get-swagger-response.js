'use strict';

const result = require('../result');

module.exports = (pactInteraction, swaggerOperation) => {
    const swaggerResposne = swaggerOperation.responses[pactInteraction.responseStatus.value];
    const defaultSwaggerResponse = swaggerOperation.responses.default;

    if (!swaggerResposne && !defaultSwaggerResponse) {
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

    if (!swaggerResposne) {
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
        value: swaggerResposne
    };
};
