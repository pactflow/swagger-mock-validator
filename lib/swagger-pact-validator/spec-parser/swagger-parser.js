'use strict';

const _ = require('lodash');

module.exports = {
    parse: (swaggerJson, swaggerPathOrUrl) => {
        const parsedPathsValue = _.map(swaggerJson.paths, (path, pathName) => {
            const parsedPath = {};

            const parsedPathNameSegmentValues = _.map(pathName.split('/'), (pathNameSegment) =>
                ({
                    isParameter: pathNameSegment[0] === '{' && pathNameSegment[pathNameSegment.length - 1] === '}',
                    rawValue: pathNameSegment
                }));

            const parsedOperationValues = _.reduce(path, (parsedOperations, operation, operationName) => {
                const parsedOperation = {
                    location: `[swaggerRoot].paths.${pathName}.${operationName}`,
                    parentPath: parsedPath,
                    rawValue: operation
                };

                const parsedParameters = _.map(operation.parameters, (parameter, parameterIndex) => ({
                    parsedValue: {
                        in: {rawValue: parameter.in},
                        required: {rawValue: parameter.required},
                        schema: {
                            parentOperation: parsedOperation,
                            parsedValue: {
                                get: (pathToGet) => ({
                                    location: `[swaggerRoot].paths.${pathName}.${operationName}` +
                                        `.parameters[${parameterIndex}].schema.${pathToGet}`,
                                    rawValue: _.get(parameter.schema, pathToGet)
                                })
                            },
                            rawValue: parameter.schema
                        }
                    },
                    rawValue: parameter
                }));

                parsedOperation.parsedValue = {
                    method: {rawValue: operationName},
                    parameters: parsedParameters,
                    pathName: {rawValue: pathName}
                };

                parsedOperation.parentOperation = parsedOperation;

                parsedOperations[operationName] = parsedOperation;

                return parsedOperations;
            }, {});

            parsedPath.parsedValue = {
                name: {rawValue: pathName},
                nameSegments: {parsedValue: parsedPathNameSegmentValues},
                operations: {parsedValue: parsedOperationValues}
            };

            parsedPath.location = `[swaggerRoot].paths.${pathName}`;

            parsedPath.rawValue = path;

            return parsedPath;
        });

        return {
            parsedValue: {
                pathOrUrl: {rawValue: swaggerPathOrUrl},
                paths: {
                    location: '[swaggerRoot].paths',
                    parsedValue: parsedPathsValue,
                    rawValue: swaggerJson.paths
                }
            },
            rawValue: swaggerJson
        };
    }
};
