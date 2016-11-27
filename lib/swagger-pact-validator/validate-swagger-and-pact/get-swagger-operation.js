'use strict';

const result = require('../result');
const _ = require('lodash');

const typeValidators = {
    boolean: (pactRequestPathSegment) => {
        const lowerCasePathSegment = pactRequestPathSegment.rawValue.toLowerCase();
        const match = lowerCasePathSegment === 'true' || lowerCasePathSegment === 'false';

        return {match};
    },
    equal: (pactRequestPathSegment, swaggerPathNameSegment) => {
        const match = swaggerPathNameSegment.value === pactRequestPathSegment.rawValue;

        return {match};
    },
    integer: (pactRequestPathSegment) => {
        const match =
            pactRequestPathSegment.rawValue.length > 0 && _.isInteger(_.toNumber(pactRequestPathSegment.rawValue));

        return {match};
    },
    number: (pactRequestPathSegment) => {
        const match =
            pactRequestPathSegment.rawValue.length > 0 && _.isFinite(_.toNumber(pactRequestPathSegment.rawValue));

        return {match};
    },
    string: (pactRequestPathSegment) => {
        const match = pactRequestPathSegment.rawValue.length > 0;

        return {match};
    },
    unsupported: (pactPathSegment, swaggerParameter) => ({
        match: true,
        results: [
            result.warning({
                message: `Validating parameters of type "${swaggerParameter.type}" ` +
                    'are not supported, assuming value is valid',
                pactSegment: pactPathSegment,
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerParameter
            })
        ]
    })
};

const doPactAndSwaggerPathSegmentsMatch = (pactPathSegment, swaggerPathSegment) => {
    if (swaggerPathSegment.validatorType === 'unsupported') {
        return typeValidators.unsupported(pactPathSegment, swaggerPathSegment.parameter);
    }

    const validator = typeValidators[swaggerPathSegment.validatorType];

    return validator(pactPathSegment, swaggerPathSegment);
};

const doInteractionAndOperationMatchPaths = (interaction, operation) => {
    const pactPathSegments = interaction.parsedValue.requestPathSegments.parsedValue.slice(1);
    const swaggerPathSegments = operation.pathNameSegments;

    if (pactPathSegments.length !== swaggerPathSegments.length) {
        return {match: false};
    }

    const results = _(swaggerPathSegments)
        .zip(pactPathSegments)
        .map((pathSegments) => {
            const [swaggerPathSegment, pactPathSegment] = pathSegments;

            return doPactAndSwaggerPathSegmentsMatch(pactPathSegment, swaggerPathSegment);
        })
        .value();

    return {
        match: _.every(results, 'match'),
        results: _.flatMap(results, (res) => res.results || [])
    };
};

const doInteractionAndOperationMatchMethods = (interaction, operation) => ({
    match: interaction.parsedValue.requestMethod.rawValue === operation.method,
    results: []
});

const doInteractionAndOperationMatch = (interaction, operation) => {
    const matchMethodResult = doInteractionAndOperationMatchMethods(interaction, operation);

    if (!matchMethodResult.match) {
        return matchMethodResult;
    }

    const matchPathsResult = doInteractionAndOperationMatchPaths(interaction, operation);

    return {
        match: matchPathsResult.match,
        results: _.concat(matchPathsResult.results, matchMethodResult.results),
        value: operation
    };
};

module.exports = (pactInteraction, swagger) => {
    const match = _(swagger.operations)
        .map((operation) => doInteractionAndOperationMatch(pactInteraction, operation))
        .find('match');

    if (!match) {
        return {
            found: false,
            results: [
                result.error({
                    message: 'Path or method not defined in swagger file: ' +
                        `${pactInteraction.parsedValue.requestMethod.rawValue.toUpperCase()} ` +
                        `${pactInteraction.parsedValue.requestPath.rawValue}`,
                    pactSegment: pactInteraction.parsedValue.requestPath,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swagger.paths
                })
            ],
            value: null
        };
    }

    return {
        found: true,
        results: match.results,
        value: match.value
    };
};
