'use strict';

const result = require('../result');
const _ = require('lodash');

const getParameterDefinition = (pactRequestPathSegment, swaggerPathNameSegment) => {
    const interactionMethod = pactRequestPathSegment.parentInteraction.parsedValue.requestMethod.rawValue;

    const matchesName = (parameter) => swaggerPathNameSegment.name === parameter.parsedValue.name.rawValue;
    const operationParameters = _.get(
        swaggerPathNameSegment.parentPath.parsedValue.operations.parsedValue,
        `${interactionMethod}.parsedValue.parameters`,
        []
    );
    const matchingOperationParameterIndex = _.findIndex(operationParameters, matchesName);

    if (matchingOperationParameterIndex > -1) {
        return operationParameters[matchingOperationParameterIndex];
    }

    const pathParameters = swaggerPathNameSegment.parentPath.parsedValue.parameters;
    const pathParametersWithInPath = _.filter(pathParameters, (pathParameter) =>
        pathParameter.parsedValue.in.rawValue === 'path');
    const matchingPathParameterIndex = _.findIndex(pathParametersWithInPath, matchesName);

    if (matchingPathParameterIndex > -1) {
        return pathParametersWithInPath[matchingPathParameterIndex];
    }

    return null;
};

const supportedTypes = ['boolean', 'integer', 'number', 'string'];

const typeValidators = {
    boolean: (pactRequestPathSegment) => {
        const lowerCasePathSegment = pactRequestPathSegment.rawValue.toLowerCase();
        const match = lowerCasePathSegment === 'true' || lowerCasePathSegment === 'false';

        return {match};
    },
    equal: (pactRequestPathSegment, swaggerPathNameSegment) => {
        const match = swaggerPathNameSegment.rawValue === pactRequestPathSegment.rawValue;

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
    unknown: (pactRequestPathSegment, swaggerPathNameSegment) => ({
        match: true,
        results: [
            result.warning({
                message: `No parameter definition found for "${swaggerPathNameSegment.name}"` +
                    ', assuming value is valid',
                pactSegment: pactRequestPathSegment,
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerPathNameSegment
            })
        ]
    }),
    unsupported: (pactRequestPathSegment, swaggerPathNameSegment, type) => ({
        match: true,
        results: [
            result.warning({
                message: `Validating parameters of type "${type}" are not supported, assuming value is valid`,
                pactSegment: pactRequestPathSegment,
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerPathNameSegment
            })
        ]
    })
};

const getValidator = (pactRequestPathSegment, swaggerPathNameSegment) => {
    if (!swaggerPathNameSegment.isParameter) {
        return typeValidators.equal;
    }

    const parameterDefinition = getParameterDefinition(pactRequestPathSegment, swaggerPathNameSegment);

    if (!parameterDefinition) {
        return typeValidators.unknown;
    }

    const typeFromDefinition = parameterDefinition.parsedValue.type.rawValue;

    if (supportedTypes.indexOf(typeFromDefinition) > -1) {
        return typeValidators[typeFromDefinition];
    }

    return () => typeValidators.unsupported(pactRequestPathSegment, parameterDefinition, typeFromDefinition);
};

const doPactAndSwaggerPathSegmentsMatch = (pactRequestPathSegment, swaggerPathNameSegment) => {
    const validator = getValidator(pactRequestPathSegment, swaggerPathNameSegment);

    return validator(pactRequestPathSegment, swaggerPathNameSegment);
};

module.exports = (pactInteraction, swagger) => {
    const match = _(swagger.parsedValue.paths.parsedValue)
        .map((swaggerPath) => {
            const swaggerPathNameSegments = swaggerPath.parsedValue.nameSegments.parsedValue;
            const pactRequestPathSegments = pactInteraction.parsedValue.requestPathSegments.parsedValue;

            if (swaggerPathNameSegments.length !== pactRequestPathSegments.length) {
                return {
                    match: false,
                    results: [],
                    swaggerPath
                };
            }

            const results = _(swaggerPathNameSegments)
                .zipWith(pactRequestPathSegments, (swaggerPathNameSegment, pactRequestPathSegment) => ({
                    pactRequestPathSegment,
                    swaggerPathNameSegment
                }))
                .map((pathSegment) => doPactAndSwaggerPathSegmentsMatch(
                    pathSegment.pactRequestPathSegment,
                    pathSegment.swaggerPathNameSegment
                ));

            return {
                match: results.every('match'),
                results: results.flatMap((res) => res.results || []).value(),
                swaggerPath
            };
        })
        .find('match');

    if (!match) {
        return {
            found: false,
            results: [
                result.error({
                    message: `Path not defined in swagger file: ${pactInteraction.parsedValue.requestPath.rawValue}`,
                    pactSegment: pactInteraction.parsedValue.requestPath,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swagger.parsedValue.paths
                })
            ],
            value: null
        };
    }

    return {
        found: true,
        results: match.results,
        value: match.swaggerPath
    };
};
