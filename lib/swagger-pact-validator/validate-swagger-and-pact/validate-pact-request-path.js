'use strict';

const result = require('../result');
const _ = require('lodash');

const isSwaggerPathSegementAParam = (swaggerPathSegment) =>
    swaggerPathSegment && swaggerPathSegment[0] === '{' && swaggerPathSegment[swaggerPathSegment.length - 1] === '}';
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

const doPactAndSwaggerPathSegmentsMatch = (interactionContext, pathSegmentContext) => {
    let validator;

    if (isSwaggerPathSegementAParam(pathSegmentContext.getSwaggerValue())) {
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

module.exports = (interactionContext) => {
    const requestPathContext = interactionContext
        .pushPactLocation('request.path')
        .setPactValue(interactionContext.getPactValue().request.path)
        .pushSwaggerLocation('paths')
        .setSwaggerValue(interactionContext.getSwaggerValue().paths);

    const match = _(requestPathContext.getSwaggerValue())
        .map((swaggerPath, swaggerPathName) => {
            const swaggerPathSegments = swaggerPathName.split('/');
            const pactPathSegments = requestPathContext.getPactValue().split('/');

            const results = _(swaggerPathSegments)
                .zipWith(pactPathSegments, (swaggerPathSegment, pactPathSegment) => ({
                    swagger: swaggerPathSegment,
                    pact: pactPathSegment
                }))
                .map((pathSegment) => doPactAndSwaggerPathSegmentsMatch(
                    interactionContext,
                    requestPathContext
                        .setPactValue(pathSegment.pact)
                        .pushSwaggerLocation(swaggerPathName)
                        .setSwaggerValue(pathSegment.swagger)
                        .setSwaggerPathName(swaggerPathName))
                );

            return {
                match: results.every('match'),
                results: results.flatMap((res) => res.results || []).value()
            };
        })
        .find('match');

    if (!match) {
        return [
            result.error(
                requestPathContext.setSwaggerValue(null),
                `Path not defined in swagger file: ${requestPathContext.getPactValue()}`
            )
        ];
    }

    return match.results;
};
