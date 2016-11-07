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
        const interaction = options.pactSegment.interaction;

        return {
            message: options.message,
            pactDetails: {
                interactionDescription: interaction.description.value,
                interactionState: interaction.state.value,
                location: options.pactSegment.location,
                value: options.pactSegment.value
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
    warning: (context, message) => buildResult(context, 'warning', message)
};
