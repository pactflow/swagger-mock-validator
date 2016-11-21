'use strict';

const buildResult = (context, type, message) => ({
    message,
    pactDetails: {
        interactionDescription: context.getPactInteractionDescription(),
        interactionState: context.getPactInteractionState(),
        location: context.getPactLocation(),
        value: context.getPactValue()
    },
    source: context.getSource(),
    swaggerDetails: {
        location: context.getSwaggerLocation(),
        pathMethod: context.getSwaggerPathMethod(),
        pathName: context.getSwaggerPathName(),
        value: context.getSwaggerValue()
    },
    type
});

module.exports = {
    error: (options) => {
        const interaction = options.pactSegment.parentInteraction.parsedValue;

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
                pathMethod: options.context.getSwaggerPathMethod(),
                pathName: options.context.getSwaggerPathName(),
                value: options.context.getSwaggerValue()
            },
            type: 'error'
        };
    },
    legacyError: (context, message) => buildResult(context, 'error', message),
    legacyWarning: (context, message) => buildResult(context, 'warning', message),
    warning: (options) => {
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
            type: 'warning'
        };
    }
};
