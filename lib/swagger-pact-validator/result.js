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
    error: (context, message) => buildResult(context, 'error', message),
    warning: (context, message) => buildResult(context, 'warning', message)
};
