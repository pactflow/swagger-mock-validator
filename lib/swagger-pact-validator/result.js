'use strict';

const buildResult = (options) => {
    const interaction = options.pactSegment.parentInteraction.parsedValue;
    const operation = options.swaggerSegment.parentOperation.parsedValue;

    return {
        message: options.message,
        pactDetails: {
            interactionDescription: interaction.description.rawValue,
            interactionState: interaction.state.rawValue,
            location: options.pactSegment.location,
            value: options.pactSegment.rawValue
        },
        source: options.source,
        swaggerDetails: {
            location: options.swaggerSegment.location,
            pathMethod: operation.method.rawValue,
            pathName: operation.pathName.rawValue,
            value: options.swaggerSegment.rawValue
        },
        type: options.type
    };
};

module.exports = {
    error: (options) => buildResult({
        message: options.message,
        pactSegment: options.pactSegment,
        source: options.source,
        swaggerSegment: options.swaggerSegment,
        type: 'error'
    }),
    warning: (options) => buildResult({
        message: options.message,
        pactSegment: options.pactSegment,
        source: options.source,
        swaggerSegment: options.swaggerSegment,
        type: 'warning'
    })
};
