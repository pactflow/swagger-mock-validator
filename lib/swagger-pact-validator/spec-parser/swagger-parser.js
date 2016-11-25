'use strict';

const _ = require('lodash');

const getParsedPathNameSegments = (pathName, parsedPath) =>
    _.map(pathName.split('/'), (pathNameSegment) => ({
        isParameter: pathNameSegment[0] === '{' && pathNameSegment[pathNameSegment.length - 1] === '}',
        location: `[swaggerRoot].paths.${pathName}`,
        name: pathNameSegment.replace('{', '').replace('}', ''),
        parentOperation: parsedPath.parentOperation,
        parentPath: parsedPath,
        rawValue: pathNameSegment
    }));

const getParsedParameter = (parameter, location, parsedOperation) => ({
    location,
    parentOperation: parsedOperation,
    parsedValue: {
        in: {rawValue: parameter.in},
        name: {rawValue: parameter.name},
        required: {rawValue: parameter.required},
        schema: {
            parentOperation: parsedOperation,
            parsedValue: {
                get: (pathToGet) => ({
                    location: `${location}.schema.${pathToGet}`,
                    parentOperation: parsedOperation,
                    rawValue: _.get(parameter.schema, pathToGet)
                })
            },
            rawValue: parameter.schema
        },
        type: {rawValue: parameter.type}
    },
    rawValue: parameter
});

module.exports = {
    parse: (swaggerJson, swaggerPathOrUrl) => {
        const parsedPathsValue = _.map(swaggerJson.paths, (path, pathName) => {
            const parsedPath = {
                location: `[swaggerRoot].paths.${pathName}`,
                parentOperation: {
                    parsedValue: {
                        method: {rawValue: null},
                        pathName: {rawValue: pathName}
                    }
                },
                rawValue: path
            };

            const parsedOperationValues = _.reduce(path, (parsedOperations, operation, operationName) => {
                const parsedOperation = {
                    location: `[swaggerRoot].paths.${pathName}.${operationName}`,
                    parentPath: parsedPath,
                    rawValue: operation
                };

                const parsedParameters = _.map(operation.parameters, (parameter, parameterIndex) =>
                    getParsedParameter(
                        parameter,
                        `[swaggerRoot].paths.${pathName}.${operationName}.parameters[${parameterIndex}]`,
                        parsedOperation
                    )
                );

                parsedOperation.parsedValue = {
                    method: {rawValue: operationName},
                    parameters: parsedParameters,
                    pathName: {rawValue: pathName}
                };

                parsedOperation.parentOperation = parsedOperation;

                parsedOperations[operationName] = parsedOperation;

                return parsedOperations;
            }, {});

            const parsedParametersOnPath = _.map(path.parameters, (parameter, parameterIndex) =>
                getParsedParameter(
                    parameter,
                    `[swaggerRoot].paths.${pathName}.parameters[${parameterIndex}]`,
                    parsedPath.parentOperation
                )
            );

            parsedPath.parsedValue = {
                name: {rawValue: pathName},
                nameSegments: {parsedValue: getParsedPathNameSegments(pathName, parsedPath)},
                operations: {parsedValue: parsedOperationValues},
                parameters: parsedParametersOnPath
            };

            return parsedPath;
        });

        return {
            parsedValue: {
                pathOrUrl: {rawValue: swaggerPathOrUrl},
                paths: {
                    location: '[swaggerRoot].paths',
                    parentOperation: {
                        parsedValue: {
                            method: {rawValue: null},
                            pathName: {rawValue: null}
                        }
                    },
                    parsedValue: parsedPathsValue,
                    rawValue: swaggerJson.paths
                }
            },
            rawValue: swaggerJson
        };
    }
};
