'use strict';

const result = require('../result');

module.exports = (pactInteraction, swaggerOperation) => {
    const swaggerResposne = swaggerOperation.responses[pactInteraction.responseStatus.value];

    if (!swaggerResposne) {
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

    return {
        found: true,
        results: [],
        value: swaggerResposne
    };
};
