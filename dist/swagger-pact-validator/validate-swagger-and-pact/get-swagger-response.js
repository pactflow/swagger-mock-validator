"use strict";
const result_1 = require("../result");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swaggerOperation) => {
    const swaggerResponse = swaggerOperation.responses[pactInteraction.responseStatus.value];
    const defaultSwaggerResponse = swaggerOperation.responses.default;
    if (!swaggerResponse && !defaultSwaggerResponse) {
        return {
            found: false,
            results: [
                result_1.default.build({
                    code: 'spv.response.status.unknown',
                    message: 'Response status code not defined in swagger file: ' +
                        `${pactInteraction.responseStatus.value}`,
                    pactSegment: pactInteraction.responseStatus,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerOperation.responses
                })
            ]
        };
    }
    if (!swaggerResponse) {
        return {
            found: true,
            results: [
                result_1.default.build({
                    code: 'spv.response.status.default',
                    message: 'Response status code matched default response in swagger file: ' +
                        `${pactInteraction.responseStatus.value}`,
                    pactSegment: pactInteraction.responseStatus,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerOperation.responses
                })
            ],
            value: defaultSwaggerResponse
        };
    }
    return {
        found: true,
        results: [],
        value: swaggerResponse
    };
};
