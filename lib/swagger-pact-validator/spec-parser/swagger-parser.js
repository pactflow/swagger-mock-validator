'use strict';

const _ = require('lodash');

const parseParameters = (parameters, parentLocation, parentOperation) => _.map(parameters,
    (parameter, parameterIndex) => {
        const parameterLocation = `${parentLocation}.parameters[${parameterIndex}]`;

        return {
            getFromSchema: (pathToGet) => ({
                location: `${parameterLocation}.schema.${pathToGet}`,
                parentOperation,
                value: _.get(parameter.schema, pathToGet)
            }),
            in: parameter.in,
            location: parameterLocation,
            name: parameter.name,
            parentOperation,
            required: parameter.required,
            schema: parameter.schema,
            type: parameter.type,
            value: parameter
        };
    }
);

const mergePathAndOperationParameters = (pathParameters, operationParameters) => {
    const mergedParameters = _.clone(pathParameters);

    _.each(operationParameters, (parameter) => {
        const duplicateIndex = _.findIndex(mergedParameters, {
            in: parameter.in,
            name: parameter.name
        });

        if (duplicateIndex > -1) {
            mergedParameters[duplicateIndex] = parameter;
        } else {
            mergedParameters.push(parameter);
        }
    });

    return mergedParameters;
};

const supportedTypes = ['boolean', 'integer', 'number', 'string'];

const findMatchingPathParameter = (pathParameters, pathNameSegmentValue) =>
    _.find(pathParameters, (pathParameter) => pathParameter.name === pathNameSegmentValue);

const getSwaggerPathNameSegmentType = (pathParameter) => {
    if (supportedTypes.indexOf(pathParameter.type) > -1) {
        return pathParameter.type;
    }

    return 'unsupported';
};

const parsePathNameSegments = (pathName, pathParameters, parsedOperation) => _(pathName.split('/'))
    .filter((pathNameSegment) => pathNameSegment.length > 0)
    .map((pathNameSegment) => {
        const isParameter = pathNameSegment[0] === '{' && pathNameSegment[pathNameSegment.length - 1] === '}';

        const parsedPathNameSegment = {parentOperation: parsedOperation};

        if (isParameter) {
            const pathNameSegmentValue = pathNameSegment.substring(1, pathNameSegment.length - 1);
            const matchingPathParameter = findMatchingPathParameter(pathParameters, pathNameSegmentValue);

            parsedPathNameSegment.parameter = matchingPathParameter;
            parsedPathNameSegment.type = _.get(matchingPathParameter, 'type');
            parsedPathNameSegment.validatorType = getSwaggerPathNameSegmentType(matchingPathParameter);
            parsedPathNameSegment.value = pathNameSegmentValue;
        } else {
            parsedPathNameSegment.validatorType = 'equal';
            parsedPathNameSegment.value = pathNameSegment;
        }

        return parsedPathNameSegment;
    })
    .value();

const parseResponses = (responses, parentOperation) => {
    const parsedResponses = {
        location: `${parentOperation.location}.responses`,
        parentOperation,
        value: responses
    };

    _.each(responses, (response, responseStatus) => {
        parsedResponses[responseStatus] = {};
    });

    return parsedResponses;
};

const parseOperationFromPath = (path, pathName) => _(path)
    .omit(['parameters'])
    .map((operation, operationName) => {
        const pathLocation = `[swaggerRoot].paths.${pathName}`;
        const operationLocation = `${pathLocation}.${operationName}`;

        const parsedOperation = {
            location: operationLocation,
            method: operationName,
            pathName,
            value: operation
        };

        const parsedPathParameters = parseParameters(path.parameters, pathLocation, parsedOperation);
        const parsedOperationParameters = parseParameters(operation.parameters, operationLocation, parsedOperation);
        const mergedParameters = mergePathAndOperationParameters(parsedPathParameters, parsedOperationParameters);
        const pathParameters = _.filter(mergedParameters, {in: 'path'});

        parsedOperation.pathNameSegments = parsePathNameSegments(pathName, pathParameters, parsedOperation);
        parsedOperation.requestBodyParameter = _.find(mergedParameters, {in: 'body'});
        parsedOperation.parentOperation = parsedOperation;

        parsedOperation.responses = parseResponses(operation.responses, parsedOperation);

        return parsedOperation;
    })
    .value();

const parseOperationsFromPaths = (paths) => _(paths)
    .map(parseOperationFromPath)
    .flatten()
    .value();

const parse = (swaggerJson, swaggerPathOrUrl) => ({
    operations: parseOperationsFromPaths(swaggerJson.paths),
    pathOrUrl: swaggerPathOrUrl,
    paths: {
        location: '[swaggerRoot].paths',
        parentOperation: {
            method: null,
            pathName: null
        },
        value: swaggerJson.paths
    }
});

module.exports = {parse: (swaggerJson, swaggerPathOrUrl) => parse(swaggerJson, swaggerPathOrUrl)};
