"use strict";
const buildResult = (type, options) => {
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
        type
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    error: (options) => buildResult('error', options),
    warning: (options) => buildResult('warning', options)
};
