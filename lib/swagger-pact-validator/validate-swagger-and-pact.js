'use strict';

const q = require('q');
const validatePactRequestMethod = require('./validate-swagger-and-pact/validate-pact-request-method');
const validatePactRequestPath = require('./validate-swagger-and-pact/validate-pact-request-path');
const _ = require('lodash');

const validatePactInteraction = (interactionContext, interaction, swagger) =>
    _.concat(
        validatePactRequestPath(interactionContext, interaction, swagger),
        validatePactRequestMethod(interactionContext, interaction, swagger)
    );

module.exports = (context, pact, swagger) => {
    const validationResults = _(pact.parsedValue.interactions.parsedValue)
        .map((interaction, index) => validatePactInteraction(
            context
                .setSource('swagger-pact-validation')
                .pushPactLocation('interactions')
                .pushPactLocationArrayIndex(index)
                .setPactValue(interaction.rawValue)
                .setPactInteractionDescription(interaction.rawValue.description)
                .setPactInteractionState(interaction.rawValue.state),
            interaction,
            swagger
        ));

    const results = {
        errors: validationResults
            .flatten()
            .filter((res) => res.type === 'error')
            .value(),
        warnings: validationResults
            .flatten()
            .value()
    };

    if (results.errors.length > 0) {
        const error = new Error(
            `Pact file "${pact.parsedValue.pathOrUrl.rawValue}" is not compatible ` +
            `with swagger file "${swagger.parsedValue.pathOrUrl.rawValue}"`
        );

        error.details = {errors: results.errors};

        return q.reject(error);
    }

    return q({warnings: results.warnings});
};
