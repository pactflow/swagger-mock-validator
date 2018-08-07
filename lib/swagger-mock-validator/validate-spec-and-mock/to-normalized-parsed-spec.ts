import {
    ParsedSpec,
    ParsedSpecOperation,
    ParsedSpecParameterCollection,
    ParsedSpecResponses,
    ParsedSpecSecurityRequirements
} from '../types';
import {toMapWithLowerCaseKeys} from './to-map-with-lower-case-keys';

const operationHasPathParameters = (operation: ParsedSpecOperation): boolean =>
    operation.pathNameSegments.findIndex((segment) => segment.validatorType === 'jsonSchema') > -1;

const operationComparator = (operationA: ParsedSpecOperation, operationB: ParsedSpecOperation): number => {
    const operationAHasPathParameters = operationHasPathParameters(operationA);
    const operationBHasPathParameters = operationHasPathParameters(operationB);

    if (operationAHasPathParameters === operationBHasPathParameters) {
        return 0;
    } else if (operationAHasPathParameters) {
        return 1;
    } else {
        return -1;
    }
};

const toNormalizedSecurityRequirementsInHeaders = (
    securityRequirements: ParsedSpecSecurityRequirements[]
): ParsedSpecSecurityRequirements[] =>
    securityRequirements.map((requirements) =>
        requirements.map((requirement) =>
            requirement.credentialLocation === 'header'
                ? {...requirement, credentialKey: requirement.credentialKey.toLowerCase()}
                : requirement
            )
    );

const toResponsesWithNormalizedHeaders = (responses: ParsedSpecResponses): ParsedSpecResponses => {
    const modifiedResponses = {...responses};
    Object.keys(modifiedResponses)
        .forEach((responsePropertyKey: any) => {
            const responseProperty = modifiedResponses[responsePropertyKey];
            modifiedResponses[responsePropertyKey] = responseProperty.headers
                ? {...responseProperty, headers: toMapWithLowerCaseKeys(responseProperty.headers)}
                : responseProperty;
        });
    return modifiedResponses;
};

const toNormalizedRequestHeaders = (requestHeaders: ParsedSpecParameterCollection): ParsedSpecParameterCollection =>
    toMapWithLowerCaseKeys(requestHeaders);

const toParsedSpecOperationWithNormalizedHeaders = (
    parsedSpecOperation: ParsedSpecOperation
): ParsedSpecOperation => ({
    ...parsedSpecOperation,
    requestHeaderParameters: toNormalizedRequestHeaders(parsedSpecOperation.requestHeaderParameters),
    responses: toResponsesWithNormalizedHeaders(parsedSpecOperation.responses),
    securityRequirements: toNormalizedSecurityRequirementsInHeaders(parsedSpecOperation.securityRequirements)
});

const toNormalizedParsedSpecOperations = (operations: ParsedSpecOperation[]): ParsedSpecOperation[] =>
    operations
        .map(toParsedSpecOperationWithNormalizedHeaders)
        .sort(operationComparator);

export const toNormalizedParsedSpec = (parsedSpec: ParsedSpec): ParsedSpec => ({
    ...parsedSpec,
    operations: toNormalizedParsedSpecOperations(parsedSpec.operations)
});
