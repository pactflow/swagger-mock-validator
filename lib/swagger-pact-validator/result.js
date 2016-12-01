'use strict';

const buildOldResult = (options) => {
    const interaction = options.pactSegment.parentInteraction.parsedValue;
    const operation = options.swaggerSegment.parentOperation;

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
            pathMethod: operation.method,
            pathName: operation.pathName,
            value: options.swaggerSegment.value
        },
        type: options.type
    };
};

const buildResult = (options) => {
    if (options.pactSegment.parentInteraction.parsedValue) {
        return buildOldResult(options);
    }

    const interaction = options.pactSegment.parentInteraction;
    const operation = options.swaggerSegment.parentOperation;

    return {
        message: options.message,
        pactDetails: {
            interactionDescription: interaction.description,
            interactionState: interaction.state,
            location: options.pactSegment.location,
            value: options.pactSegment.value
        },
        source: options.source,
        swaggerDetails: {
            location: options.swaggerSegment.location,
            pathMethod: operation.method,
            pathName: operation.pathName,
            value: options.swaggerSegment.value
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
