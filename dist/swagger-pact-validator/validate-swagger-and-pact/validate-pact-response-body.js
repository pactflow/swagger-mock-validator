"use strict";
const _ = require("lodash");
const result_1 = require("../result");
const validate_json_1 = require("./validate-json");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swaggerResponse) => {
    if (!pactInteraction.responseBody.value) {
        return [];
    }
    if (!swaggerResponse.schema) {
        return [
            result_1.default.build({
                code: 'spv.response.body.unknown',
                message: 'No schema found for response body',
                pactSegment: pactInteraction.responseBody,
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerResponse
            })
        ];
    }
    const validationErrors = validate_json_1.default(swaggerResponse.schema, pactInteraction.responseBody.value);
    return _.map(validationErrors, (error) => {
        const message = error.keyword === 'additionalProperties'
            ? `${error.message} - ${error.params.additionalProperty}`
            : error.message;
        return result_1.default.build({
            code: 'spv.response.body.incompatible',
            message: `Response body is incompatible with the response body schema in the swagger file: ${message}`,
            pactSegment: pactInteraction.getResponseBodyPath(error.dataPath),
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerResponse.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
        });
    });
};
