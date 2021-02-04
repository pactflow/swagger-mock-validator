import {parsePathNameSegments} from '../../common/parse-path-name-segments';
import {ParsedSpecOperation, ParsedSpecResponse, ParsedSpecResponses, ParsedSpecValue} from '../../parsed-spec';
import {Openapi3Schema, Operation, ParameterOrReference} from '../openapi3';
import {parseParameters} from './parse-parameters';
import {getParsedRequestBodyValues} from './parse-request-body';
import {parseResponses} from './parse-responses';
import {parseSecurityRequirements} from './parse-security-requirements';

export interface ParseOperationOptions {
    operation: Operation;
    operationLocation: string;
    operationName: string;
    pathName: string;
    pathLocation: string;
    pathItemParameters: ParameterOrReference[] | undefined;
    spec: Openapi3Schema;
    specPathOrUrl: string;
}

const getAllProducedMimeTypes = (
    parentOperation: ParsedSpecOperation,
    responses: ParsedSpecResponses
): ParsedSpecValue<string[]> => {
    const value = Object.values(responses)
        .reduce((allMimeTypes: string[], response: ParsedSpecResponse) =>
            response.produces ? [...allMimeTypes,  ...response.produces.value] : allMimeTypes,
            []);

    return {value, location: parentOperation.location, parentOperation}
}

export const parseOperation = ({
    operation,
    operationName,
    pathName,
    pathItemParameters,
    operationLocation,
    spec,
    specPathOrUrl
}: ParseOperationOptions): ParsedSpecOperation => {
    // tslint:disable-next-line:no-object-literal-type-assertion
    const parsedOperation = {
        location: operationLocation,
        method: operationName,
        pathName,
        specFile: specPathOrUrl,
        value: operation
    } as ParsedSpecOperation;
    parsedOperation.parentOperation = parsedOperation;

    parsedOperation.securityRequirements = parseSecurityRequirements(
        spec.security, operation.security, parsedOperation, spec
    );

    const parsedParameters = parseParameters({
        operationParameters: operation.parameters,
        parentOperation: parsedOperation,
        pathItemParameters,
        spec
    });
    parsedOperation.requestQueryParameters = parsedParameters.query;
    parsedOperation.requestHeaderParameters = parsedParameters.header;

    const pathParameters = Object.keys(parsedParameters.path).map((key) => parsedParameters.path[key]);
    parsedOperation.pathNameSegments = parsePathNameSegments(pathName, pathParameters, parsedOperation);

    const parsedRequestBodyProperties = getParsedRequestBodyValues(parsedOperation, spec);
    parsedOperation.consumes = parsedRequestBodyProperties.consumes;
    parsedOperation.requestBodyParameter = parsedRequestBodyProperties.requestBodyParameter;

    parsedOperation.responses = parseResponses(operation, parsedOperation, spec);
    parsedOperation.produces = getAllProducedMimeTypes(parsedOperation, parsedOperation.responses)

    return parsedOperation;
};
