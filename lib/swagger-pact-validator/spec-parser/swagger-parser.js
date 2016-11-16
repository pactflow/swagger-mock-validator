'use strict';

const _ = require('lodash');

module.exports = {
    parse: (swaggerJson, swaggerPathOrUrl) => {
        const parsedPathsValue = _.map(swaggerJson.paths, (path, pathName) => {
            const parsedPathNameSegmentValues = _.map(pathName.split('/'), (pathNameSegment) =>
                ({
                    isParameter: pathNameSegment[0] === '{' && pathNameSegment[pathNameSegment.length - 1] === '}',
                    rawValue: pathNameSegment
                }));

            const parsedOperationValues = _.reduce(path, (parsedOperations, operation, operationName) => {
                parsedOperations[operationName] = {};

                return parsedOperations;
            }, {});

            const parsedPath = {};

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
