'use strict';

const q = require('q');
const validatePactRequestPath = require('./validate-swagger-and-pact/validate-pact-request-path');
const _ = require('lodash');

const validatePactInteraction = (interactionContext) => validatePactRequestPath(interactionContext);

module.exports = (context) => {
    const validationResults = _(context.getPactValue().interactions)
        .map((interaction, index) => validatePactInteraction(
            context
                .setSource('swagger-pact-validation')
                .pushPactLocation('interactions')
                .pushPactLocationArrayIndex(index)
                .setPactValue(interaction)
                .setPactInteractionDescription(interaction.description)
                .setPactInteractionState(interaction.state)
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
            `Pact file "${context.getPactFileName()}" is not compatible ` +
            `with swagger file "${context.getSwaggerFileName()}"`
        );

        error.details = {errors: results.errors};

        return q.reject(error);
    }

    return q({warnings: results.warnings});
};
