"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParsedSpecResponse = void 0;
const result_1 = require("../result");
const getParsedSpecResponse = (parsedMockInteraction, parsedSpecOperation) => {
    const parsedSpecResponse = parsedSpecOperation.responses[parsedMockInteraction.responseStatus.value];
    const parsedSpecDefaultResponse = parsedSpecOperation.responses.default;
    if (!parsedSpecResponse && !parsedSpecDefaultResponse) {
        return {
            found: false,
            results: [
                result_1.result.build({
                    code: 'response.status.unknown',
                    message: 'Response status code not defined in spec file: ' +
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
                result_1.result.build({
                    code: 'response.status.default',
                    message: 'Response status code matched default response in spec file: ' +
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
exports.getParsedSpecResponse = getParsedSpecResponse;
