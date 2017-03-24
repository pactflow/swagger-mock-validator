"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const result_1 = require("../result");
exports.default = (parsedMockInteraction, parsedSpecOperation) => {
    const parsedSpecResponse = parsedSpecOperation.responses[parsedMockInteraction.responseStatus.value];
    const parsedSpecDefaultResponse = parsedSpecOperation.responses.default;
    if (!parsedSpecResponse && !parsedSpecDefaultResponse) {
        return {
            found: false,
            results: [
                result_1.default.build({
                    code: 'spv.response.status.unknown',
                    message: 'Response status code not defined in swagger file: ' +
                        `${parsedMockInteraction.responseStatus.value}`,
                    mockSegment: parsedMockInteraction.responseStatus,
                    source: 'spec-mock-validation',
                    specSegment: parsedSpecOperation.responses
                })
            ]
        };
    }
    if (!parsedSpecResponse) {
        return {
            found: true,
            results: [
                result_1.default.build({
                    code: 'spv.response.status.default',
                    message: 'Response status code matched default response in swagger file: ' +
                        `${parsedMockInteraction.responseStatus.value}`,
                    mockSegment: parsedMockInteraction.responseStatus,
                    source: 'spec-mock-validation',
                    specSegment: parsedSpecOperation.responses
                })
            ],
            value: parsedSpecDefaultResponse
        };
    }
    return {
        found: true,
        results: [],
        value: parsedSpecResponse
    };
};
