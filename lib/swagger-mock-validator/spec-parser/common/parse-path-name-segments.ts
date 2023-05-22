import _ from 'lodash';
import {ParsedSpecOperation, ParsedSpecParameter, ParsedSpecPathNameSegment} from '../parsed-spec';

const parseParameterSegment = (
    pathNameSegment: string,
    parsedOperation: ParsedSpecOperation,
    pathParameters: ParsedSpecParameter[]
): ParsedSpecPathNameSegment => {
    const pathNameSegmentValue = pathNameSegment.substring(1, pathNameSegment.length - 1);

    return {
        location: parsedOperation.location,
        parameter: _.find(pathParameters, {name: pathNameSegmentValue}) as ParsedSpecParameter,
        parentOperation: parsedOperation,
        validatorType: 'jsonSchema',
        value: pathNameSegmentValue
    };
};

const parseNonParameterSegment = (
    parsedOperation: ParsedSpecOperation,
    pathNameSegment: string
): ParsedSpecPathNameSegment => ({
    location: parsedOperation.location,
    parentOperation: parsedOperation,
    validatorType: 'equal',
    value: pathNameSegment
});

const isParameter = (pathNameSegment: string): boolean =>
    pathNameSegment[0] === '{' && pathNameSegment[pathNameSegment.length - 1] === '}';

const parsePathNameSegment = (pathNameSegment: string,
                              parsedOperation: ParsedSpecOperation,
                              pathParameters: ParsedSpecParameter[]): ParsedSpecPathNameSegment =>
    isParameter(pathNameSegment)
        ? parseParameterSegment(pathNameSegment, parsedOperation, pathParameters)
        : parseNonParameterSegment(parsedOperation, pathNameSegment);

const getFullPath = (pathName: string, basePath?: string): string =>
    basePath ? basePath + pathName : pathName;

export const parsePathNameSegments = (
    pathName: string,
    pathParameters: ParsedSpecParameter[],
    parsedOperation: ParsedSpecOperation,
    basePath?: string
) => {
    const path = getFullPath(pathName, basePath);

    return path.split('/')
        .filter((pathNameSegment) => pathNameSegment.length > 0)
        .map((pathNameSegment) => parsePathNameSegment(pathNameSegment, parsedOperation, pathParameters));
};
