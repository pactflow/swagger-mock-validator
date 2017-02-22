"use strict";
const q = require("q");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactJson, pactPathOrUrl, swaggerPathOrUrl) => {
    if (!pactJson.interactions) {
        const error = new Error(`"${pactPathOrUrl}" is not a valid pact file`);
        error.details = {
            errors: [{
                    code: 'pv.error',
                    message: 'Missing required property: interactions',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: null,
                        location: '[pactRoot]',
                        pactFile: pactPathOrUrl,
                        value: pactJson
                    },
                    source: 'pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot]',
                        pathMethod: null,
                        pathName: null,
                        swaggerFile: swaggerPathOrUrl,
                        value: null
                    },
                    type: 'error'
                }],
            warnings: []
        };
        return q.reject(error);
    }
    return q({ warnings: [] });
};
