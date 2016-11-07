'use strict';

const result = require('../result');
const _ = require('lodash');

const swaggerParamPathSegmentToParamName = (swaggerParamPathSegment) =>
    swaggerParamPathSegment.replace('{', '').replace('}', '');

const getParameterDefinition = (interactionContext, pathSegmentContext) => {
    const swaggerJson = interactionContext.getSwaggerValue();
    const interaction = interactionContext.getPactValue();
    const interactionMethod = interaction.request.method.toLowerCase();
    const swaggerPathName = pathSegmentContext.getSwaggerPathName();

    const matchesName = (parameter) =>
        swaggerParamPathSegmentToParamName(pathSegmentContext.getSwaggerValue()) === parameter.name;
    const operationParameters =
        _.get(swaggerJson, `paths.${swaggerPathName}.${interactionMethod}.parameters`, []);

    const matchingOperationParameterIndex = _.findIndex(operationParameters, matchesName);

    if (matchingOperationParameterIndex > -1) {
        return pathSegmentContext
            .pushSwaggerLocation(interactionMethod)
            .pushSwaggerLocation('parameters')
            .pushSwaggerLocationArrayIndex(matchingOperationParameterIndex)
            .setSwaggerPathMethod(interactionMethod)
            .setSwaggerValue(operationParameters[matchingOperationParameterIndex]);
    }

    const pathParameters = _.get(swaggerJson, `paths.${swaggerPathName}.parameters`, []);
    const matchingPathParameterIndex = _.findIndex(pathParameters, matchesName);

    if (matchingPathParameterIndex > -1) {
        return pathSegmentContext
            .pushSwaggerLocation('parameters')
            .pushSwaggerLocationArrayIndex(matchingPathParameterIndex)
            .setSwaggerValue(pathParameters[matchingPathParameterIndex]);
    }

    return {getSwaggerValue: () => null};
};

const supportedTypes = ['boolean', 'integer', 'number', 'string'];

const typeValidators = {
    boolean: (pathSegmentContext) => {
        const lowerCasePathSegment = pathSegmentContext.getPactValue().toLowerCase();
        const match = lowerCasePathSegment === 'true' || lowerCasePathSegment === 'false';

        return {match};
    },
    equal: (pathSegmentContext) => {
        const match = pathSegmentContext.getSwaggerValue() === pathSegmentContext.getPactValue();

        return {match};
    },
    integer: (pathSegmentContext) => {
        const match =
            pathSegmentContext.getPactValue().length > 0 && _.isInteger(_.toNumber(pathSegmentContext.getPactValue()));

        return {match};
    },
    number: (pathSegmentContext) => {
        const match =
            pathSegmentContext.getPactValue().length > 0 && _.isFinite(_.toNumber(pathSegmentContext.getPactValue()));

        return {match};
    },
    string: (pathSegmentContext) => {
        const match = pathSegmentContext.getPactValue().length > 0;

        return {match};
    },
    unknown: (pathSegmentContext) => ({
        match: true,
        results: [
            result.warning(
                pathSegmentContext.setSwaggerValue(null),
                'No parameter definition found for ' +
                `"${swaggerParamPathSegmentToParamName(pathSegmentContext.getSwaggerValue())}"` +
                ', assuming value is valid'
            )
        ]
    }),
    unsupported: (pathSegmentContext, parameterDefinition, type) => ({
        match: true,
        results: [
            result.warning(
                parameterDefinition,
                `Validating parameters of type "${type}" are not supported, assuming value is valid`
            )
        ]
    })
};

const doPactAndSwaggerPathSegmentsMatch = (options) => {
    const interactionContext = options.interactionContext;
    const pathSegmentContext = options.pathSegmentContext;
    const parsedSwaggerPathNameSegment = options.parsedSwaggerPathNameSegment;

    let validator;

    if (parsedSwaggerPathNameSegment.isParameter) {
        const parameterDefinition = getParameterDefinition(interactionContext, pathSegmentContext);
        const typeFromDefinition = _.get(parameterDefinition.getSwaggerValue(), 'type');

        if (!typeFromDefinition) {
            validator = typeValidators.unknown;
        } else if (supportedTypes.indexOf(typeFromDefinition) > -1) {
            validator = typeValidators[typeFromDefinition];
        } else {
            validator = _.partial(typeValidators.unsupported, _, parameterDefinition, typeFromDefinition);
        }
    } else {
        validator = typeValidators.equal;
    }

    return validator(pathSegmentContext);
};

const emptySwaggerPathNameSegment = {isParam: false};

module.exports = (interactionContext, parsedPactInteraction, parsedSwagger) => {
    const requestPathContext = interactionContext
        .pushPactLocation('request.path')
        .setPactValue(parsedPactInteraction.rawValue.request.path)
        .pushSwaggerLocation('paths')
        .setSwaggerValue(parsedSwagger.rawValue.paths);

    const match = _(parsedSwagger.paths.value)
        .map((parsedSwaggerPath) => {
            const results = _(parsedSwaggerPath.nameSegments.value)
                .zipWith(parsedPactInteraction.requestPathSegments.value,
                    (parsedSwaggerPathNameSegment, parsedPactRequestPathSegment) => ({
                        parsedPactRequestPathSegment,
                        parsedSwaggerPathNameSegment: parsedSwaggerPathNameSegment || emptySwaggerPathNameSegment
                    })
                )
                .map((pathSegment) => doPactAndSwaggerPathSegmentsMatch({
                    interactionContext,
                    parsedPactRequestPathSegment: pathSegment.parsedPactRequestPathSegment,
                    parsedSwaggerPathNameSegment: pathSegment.parsedSwaggerPathNameSegment,
                    pathSegmentContext: requestPathContext
                        .setPactValue(pathSegment.parsedPactRequestPathSegment.value)
                        .pushSwaggerLocation(parsedSwaggerPath.name.value)
                        .setSwaggerValue(pathSegment.parsedSwaggerPathNameSegment.value)
                        .setSwaggerPathName(parsedSwaggerPath.name.value)
                }));

            return {
                match: results.every('match'),
                results: results.flatMap((res) => res.results || []).value()
            };
        })
        .find('match');

    if (!match) {
        return [
            result.error({
                context: requestPathContext.setSwaggerValue(null),
                message: `Path not defined in swagger file: ${parsedPactInteraction.requestPath.value}`,
                pactSegment: parsedPactInteraction.requestPath,
                source: 'swagger-pact-validation',
                swaggerSegment: parsedSwagger.paths
            })
        ];
    }

    return match.results;
};
