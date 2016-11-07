'use strict';

const q = require('q');
const validatePactRequestPath = require('./validate-swagger-and-pact/validate-pact-request-path');
const _ = require('lodash');

const validatePactInteraction = (interactionContext, interaction, parsedSwagger) =>
    validatePactRequestPath(interactionContext, interaction, parsedSwagger);

module.exports = (context, parsedPact, parsedSwagger) => {
    const validationResults = _(parsedPact.interactions.value)
        .map((interaction, index) => validatePactInteraction(
            context
                .setSource('swagger-pact-validation')
                .pushPactLocation('interactions')
                .pushPactLocationArrayIndex(index)
                .setPactValue(interaction.rawValue)
                .setPactInteractionDescription(interaction.rawValue.description)
                .setPactInteractionState(interaction.rawValue.state),
            interaction,
            parsedSwagger
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
            `Pact file "${parsedPact.pathOrUrl.value}" is not compatible ` +
            `with swagger file "${parsedSwagger.pathOrUrl.value}"`
        );

        error.details = {errors: results.errors};

        return q.reject(error);
    }

    return q({warnings: results.warnings});
};
