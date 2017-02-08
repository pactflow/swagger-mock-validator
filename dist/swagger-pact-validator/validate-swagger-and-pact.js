"use strict";
const _ = require("lodash");
const q = require("q");
const get_swagger_operation_1 = require("./validate-swagger-and-pact/get-swagger-operation");
const get_swagger_response_1 = require("./validate-swagger-and-pact/get-swagger-response");
const validate_pact_request_body_1 = require("./validate-swagger-and-pact/validate-pact-request-body");
const validate_pact_request_headers_1 = require("./validate-swagger-and-pact/validate-pact-request-headers");
const validate_pact_request_query_1 = require("./validate-swagger-and-pact/validate-pact-request-query");
const validate_pact_response_body_1 = require("./validate-swagger-and-pact/validate-pact-response-body");
const validate_pact_response_headers_1 = require("./validate-swagger-and-pact/validate-pact-response-headers");
const validate_swagger_consumes_1 = require("./validate-swagger-and-pact/validate-swagger-consumes");
const validate_swagger_produces_1 = require("./validate-swagger-and-pact/validate-swagger-produces");
const validate_swagger_security_1 = require("./validate-swagger-and-pact/validate-swagger-security");
const validatePactInteractionRequest = (pactInteraction, swaggerOperation) => _.concat(validate_swagger_consumes_1.default(pactInteraction, swaggerOperation), validate_swagger_produces_1.default(pactInteraction, swaggerOperation), validate_swagger_security_1.default(pactInteraction, swaggerOperation), validate_pact_request_body_1.default(pactInteraction, swaggerOperation), validate_pact_request_headers_1.default(pactInteraction, swaggerOperation), validate_pact_request_query_1.default(pactInteraction, swaggerOperation));
const validatePactInteractionResponse = (pactInteraction, swaggerOperation) => {
    const swaggerResponseSearchResult = get_swagger_response_1.default(pactInteraction, swaggerOperation);
    if (!swaggerResponseSearchResult.found) {
        return swaggerResponseSearchResult.results;
    }
    return _.concat(swaggerResponseSearchResult.results, validate_pact_response_body_1.default(pactInteraction, swaggerResponseSearchResult.value), validate_pact_response_headers_1.default(pactInteraction, swaggerResponseSearchResult.value));
};
const validatePactInteraction = (pactInteraction, swagger) => {
    const swaggerOperationSearchResult = get_swagger_operation_1.default(pactInteraction, swagger);
    if (!swaggerOperationSearchResult.found) {
        return swaggerOperationSearchResult.results;
    }
    return _.concat(swaggerOperationSearchResult.results, validatePactInteractionRequest(pactInteraction, swaggerOperationSearchResult.value), validatePactInteractionResponse(pactInteraction, swaggerOperationSearchResult.value));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pact, swagger) => {
    const validationResults = _(pact.interactions)
        .map((pactInteraction) => validatePactInteraction(pactInteraction, swagger))
        .flatten()
        .value();
    const results = {
        errors: _.filter(validationResults, (res) => res.type === 'error'),
        warnings: _.filter(validationResults, (res) => res.type === 'warning')
    };
    if (results.errors.length > 0) {
        const error = new Error(`Pact file "${pact.pathOrUrl}" is not compatible ` +
            `with swagger file "${swagger.pathOrUrl}"`);
        error.details = {
            errors: results.errors,
            warnings: results.warnings
        };
        return q.reject(error);
    }
    return q({ warnings: results.warnings });
};
