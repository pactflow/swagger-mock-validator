'use strict';

const result = require('../result');

module.exports = (interaction, swaggerOperation) => {
    const interactionResponseStatus = interaction.parsedValue.responseStatus.rawValue;
    const response = swaggerOperation.responses[interactionResponseStatus];

    if (!response) {
        return result.error({
            message:
                `Response status code not defined in swagger file: ${interactionResponseStatus}`,
            pactSegment: interaction.parsedValue.responseStatus,
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation.responses
        });
    }

    return [];
};
