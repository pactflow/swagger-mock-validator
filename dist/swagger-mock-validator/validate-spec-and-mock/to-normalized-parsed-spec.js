"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNormalizedParsedSpec = void 0;
const to_map_with_lower_case_keys_1 = require("./to-map-with-lower-case-keys");
const operationHasPathParameters = (operation) => operation.pathNameSegments.findIndex((segment) => segment.validatorType === 'jsonSchema') > -1;
const operationComparator = (operationA, operationB) => {
    const operationAHasPathParameters = operationHasPathParameters(operationA);
    const operationBHasPathParameters = operationHasPathParameters(operationB);
    if (operationAHasPathParameters === operationBHasPathParameters) {
        return 0;
    }
    else if (operationAHasPathParameters) {
        return 1;
    }
    else {
        return -1;
    }
};
const toNormalizedSecurityRequirementsInHeaders = (securityRequirements) => securityRequirements.map((requirements) => requirements.map((requirement) => requirement.credentialLocation === 'header'
    ? Object.assign(Object.assign({}, requirement), { credentialKey: requirement.credentialKey.toLowerCase() }) : requirement));
const toResponsesWithNormalizedHeaders = (responses) => {
    const modifiedResponses = Object.assign({}, responses);
    Object.keys(modifiedResponses)
        .forEach((responsePropertyKey) => {
        const responseProperty = modifiedResponses[responsePropertyKey];
        modifiedResponses[responsePropertyKey] = responseProperty.headers
            ? Object.assign(Object.assign({}, responseProperty), { headers: to_map_with_lower_case_keys_1.toMapWithLowerCaseKeys(responseProperty.headers) }) : responseProperty;
    });
    return modifiedResponses;
};
const toNormalizedRequestHeaders = (requestHeaders) => to_map_with_lower_case_keys_1.toMapWithLowerCaseKeys(requestHeaders);
const toParsedSpecOperationWithNormalizedHeaders = (parsedSpecOperation) => (Object.assign(Object.assign({}, parsedSpecOperation), { requestHeaderParameters: toNormalizedRequestHeaders(parsedSpecOperation.requestHeaderParameters), responses: toResponsesWithNormalizedHeaders(parsedSpecOperation.responses), securityRequirements: toNormalizedSecurityRequirementsInHeaders(parsedSpecOperation.securityRequirements) }));
const toNormalizedParsedSpecOperations = (operations) => operations
    .map(toParsedSpecOperationWithNormalizedHeaders)
    .sort(operationComparator);
const toNormalizedParsedSpec = (parsedSpec) => (Object.assign(Object.assign({}, parsedSpec), { operations: toNormalizedParsedSpecOperations(parsedSpec.operations) }));
exports.toNormalizedParsedSpec = toNormalizedParsedSpec;
