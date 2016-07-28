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
        pathName: context.getSwaggerPathName(),
        pathMethod: context.getSwaggerPathMethod(),
        location: context.getSwaggerLocation(),
        value: context.getSwaggerValue()
    },
    type
});

module.exports = {
    error: (context, message) => buildResult(context, 'error', message),
    warning: (context, message) => buildResult(context, 'warning', message)
};
