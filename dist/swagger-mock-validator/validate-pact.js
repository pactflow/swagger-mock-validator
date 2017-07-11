"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const q = require("q");
exports.default = (pactJson, mockPathOrUrl) => {
    if (!pactJson.interactions) {
        const error = new Error(`"${mockPathOrUrl}" is not a valid pact file`);
        error.details = {
            errors: [{
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
                }],
            warnings: []
        };
        return q.reject(error);
    }
    return q({ warnings: [] });
};
