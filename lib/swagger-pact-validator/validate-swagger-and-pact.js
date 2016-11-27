'use strict';

const getSwaggerOperation = require('./validate-swagger-and-pact/get-swagger-operation');
const q = require('q');
const validatePactRequestBody = require('./validate-swagger-and-pact/validate-pact-request-body');
const _ = require('lodash');

const validatePactInteraction = (interaction, swagger) => {
    const swaggerOperationSearchResult = getSwaggerOperation(interaction, swagger);

    if (!swaggerOperationSearchResult.found) {
        return swaggerOperationSearchResult.results;
    }

    return _.concat(
        swaggerOperationSearchResult.results,
        validatePactRequestBody(interaction, swaggerOperationSearchResult.value)
    );
};

module.exports = (pact, swagger) => {
    const validationResults = _(pact.parsedValue.interactions.parsedValue)
        .map((interaction) => validatePactInteraction(interaction, swagger))
        .flatten()
        .value();

    const results = {
        errors: _.filter(validationResults, (res) => res.type === 'error'),
        warnings: _.filter(validationResults, (res) => res.type === 'warning')
    };

    if (results.errors.length > 0) {
        const error = new Error(
            `Pact file "${pact.parsedValue.pathOrUrl.rawValue}" is not compatible ` +
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
