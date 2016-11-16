'use strict';

const getSwaggerPath = require('./get-swagger-path');
const result = require('../result');

module.exports = (interactionContext, pactInteraction, swagger) => {
    const searchResult = getSwaggerPath(interactionContext, pactInteraction, swagger);

    if (!searchResult.found) {
        return [];
    }

    const pactRequestMethod = pactInteraction.parsedValue.requestMethod;
    const swaggerPath = searchResult.value;

    if (!swaggerPath.parsedValue.operations.parsedValue[pactRequestMethod.rawValue]) {
        return [
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
        ];
    }

    return [];
};
