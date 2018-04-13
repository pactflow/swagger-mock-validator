"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePact = (pactJson, mockPathOrUrl) => {
    let errors = [];
    const warnings = [];
    if (!pactJson.interactions) {
        errors = [{
                code: 'pv.error',
                message: 'Missing required property: interactions',
                mockDetails: {
                    interactionDescription: null,
                    interactionState: null,
                    location: '[pactRoot]',
                    mockFile: mockPathOrUrl,
                    value: pactJson
                },
                source: 'pact-validation',
                type: 'error'
            }];
    }
    const success = errors.length === 0;
    const failureReason = success ? undefined : `"${mockPathOrUrl}" is not a valid pact file`;
    return { warnings, errors, failureReason, success };
};
