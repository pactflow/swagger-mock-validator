'use strict';

const result = require('../result');

module.exports = (pactInteraction, swaggerOperation) => {
    if (!swaggerOperation.responses[pactInteraction.responseStatus.value]) {
        return result.error({
            message: `Response status code not defined in swagger file: ${pactInteraction.responseStatus.value}`,
            pactSegment: pactInteraction.responseStatus,
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation.responses
        });
    }

    return [];
};
