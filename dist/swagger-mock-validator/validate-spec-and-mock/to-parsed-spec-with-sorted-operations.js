"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.toParsedSpecWithSortedOperations = (parsedSpec) => {
    const sortedOperations = Array.from(parsedSpec.operations).sort(operationComparator);
    return {
        operations: sortedOperations,
        pathOrUrl: parsedSpec.pathOrUrl,
        paths: parsedSpec.paths
    };
};
