"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const parseParameterSegment = (pathNameSegment, parsedOperation, pathParameters) => {
    const pathNameSegmentValue = pathNameSegment.substring(1, pathNameSegment.length - 1);
    return {
        location: parsedOperation.location,
        parameter: _.find(pathParameters, { name: pathNameSegmentValue }),
        parentOperation: parsedOperation,
        validatorType: 'jsonSchema',
        value: pathNameSegmentValue
    };
};
const parseNonParameterSegment = (parsedOperation, pathNameSegment) => ({
    location: parsedOperation.location,
    parentOperation: parsedOperation,
    validatorType: 'equal',
    value: pathNameSegment
});
const isParameter = (pathNameSegment) => pathNameSegment[0] === '{' && pathNameSegment[pathNameSegment.length - 1] === '}';
const parsePathNameSegment = (pathNameSegment, parsedOperation, pathParameters) => isParameter(pathNameSegment)
    ? parseParameterSegment(pathNameSegment, parsedOperation, pathParameters)
    : parseNonParameterSegment(parsedOperation, pathNameSegment);
const getFullPath = (pathName, basePath) => basePath ? basePath + pathName : pathName;
exports.parsePathNameSegments = (pathName, pathParameters, parsedOperation, basePath) => {
    const path = getFullPath(pathName, basePath);
    return path.split('/')
        .filter((pathNameSegment) => pathNameSegment.length > 0)
        .map((pathNameSegment) => parsePathNameSegment(pathNameSegment, parsedOperation, pathParameters));
};
