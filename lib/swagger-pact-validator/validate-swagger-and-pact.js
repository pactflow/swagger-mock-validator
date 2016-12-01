'use strict';

const getSwaggerOperation = require('./validate-swagger-and-pact/get-swagger-operation');
const getSwaggerResponse = require('./validate-swagger-and-pact/get-swagger-response');
const q = require('q');
const validatePactRequestBody = require('./validate-swagger-and-pact/validate-pact-request-body');
const validatePactResponseBody = require('./validate-swagger-and-pact/validate-pact-response-body');
const _ = require('lodash');

const validatePactInteractionRequest = (pactInteraction, swaggerOperation) =>
    validatePactRequestBody(pactInteraction, swaggerOperation);

const validatePactInteractionResponse = (pactInteraction, swaggerOperation) => {
    const swaggerResponseSearchResult = getSwaggerResponse(pactInteraction, swaggerOperation);

    if (!swaggerResponseSearchResult.found) {
        return swaggerResponseSearchResult.results;
    }

    return _.concat(
        swaggerResponseSearchResult.results,
        validatePactResponseBody(pactInteraction, swaggerResponseSearchResult.value)
    );
};

const validatePactInteraction = (pactInteraction, swagger) => {
    const swaggerOperationSearchResult = getSwaggerOperation(pactInteraction, swagger);

    if (!swaggerOperationSearchResult.found) {
        return swaggerOperationSearchResult.results;
    }

    return _.concat(
        swaggerOperationSearchResult.results,
        validatePactInteractionRequest(pactInteraction, swaggerOperationSearchResult.value),
        validatePactInteractionResponse(pactInteraction, swaggerOperationSearchResult.value)
    );
};

module.exports = (pact, swagger) => {
    const validationResults = _(pact.interactions)
        .map((pactInteraction) => validatePactInteraction(pactInteraction, swagger))
        .flatten()
        .value();

    const results = {
        errors: _.filter(validationResults, (res) => res.type === 'error'),
        warnings: _.filter(validationResults, (res) => res.type === 'warning')
    };

    if (results.errors.length > 0) {
        const error = new Error(
            `Pact file "${pact.pathOrUrl}" is not compatible ` +
            `with swagger file "${swagger.pathOrUrl}"`
        );

        error.details = {
            errors: results.errors,
            warnings: results.warnings
        };

        return q.reject(error);
    }

    return q({warnings: results.warnings});
};
