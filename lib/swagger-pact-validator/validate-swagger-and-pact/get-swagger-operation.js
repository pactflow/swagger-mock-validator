'use strict';

const result = require('../result');

module.exports = (pactInteraction, swagger, swaggerPath) => {
    const pactRequestMethod = pactInteraction.parsedValue.requestMethod;
    const operation = swaggerPath.parsedValue.operations.parsedValue[pactRequestMethod.rawValue];

    if (!operation) {
        return {
            found: false,
            results: [
                result.error({
                    message: `Method not defined in swagger file: ${pactRequestMethod.rawValue}`,
                    pactSegment: pactRequestMethod,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerPath
                })
            ],
            value: null
        };
    }

    return {
        found: true,
        results: [],
        value: operation
    };
};
