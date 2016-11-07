'use strict';

const _ = require('lodash');

module.exports = {
    parse: (swaggerJson, swaggerPathOrUrl) => {
        const parsedPathsValue = _.map(swaggerJson.paths, (path, pathName) => {
            const parsedPathNameSegmentValues = _.map(pathName.split('/'), (pathNameSegment) =>
                ({
                    isParameter: pathNameSegment[0] === '{' && pathNameSegment[pathNameSegment.length - 1] === '}',
                    value: pathNameSegment
                }));

            const parsedPath = {};

            parsedPath.name = {
                path: parsedPath,
                value: pathName
            };

            parsedPath.nameSegments = {value: parsedPathNameSegmentValues};

            return parsedPath;
        });

        return {
            pathOrUrl: {value: swaggerPathOrUrl},
            paths: {
                location: '[swaggerRoot].paths',
                value: parsedPathsValue
            },
            rawValue: swaggerJson
        };
    }
};
