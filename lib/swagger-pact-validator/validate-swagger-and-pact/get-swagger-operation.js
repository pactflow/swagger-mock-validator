'use strict';

const getSwaggerPath = require('./get-swagger-path');
const result = require('../result');

module.exports = (interactionContext, pactInteraction, swagger) => {
    const searchResult = getSwaggerPath(interactionContext, pactInteraction, swagger);

    if (!searchResult.found) {
        return {
            found: false,
            results: [],
            value: null
        };
    }

    const pactRequestMethod = pactInteraction.parsedValue.requestMethod;
    const swaggerPath = searchResult.value;
    const operation = swaggerPath.parsedValue.operations.parsedValue[pactRequestMethod.rawValue];

    if (!operation) {
        return {
            found: false,
            results: [
                result.error({
                    context: interactionContext
                        .setSwaggerLocation(swaggerPath.location)
                        .setSwaggerPathName(swaggerPath.parsedValue.name.rawValue)
                        .setSwaggerValue(swaggerPath.rawValue),
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
