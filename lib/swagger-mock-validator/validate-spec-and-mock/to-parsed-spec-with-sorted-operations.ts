import {ParsedSpec, ParsedSpecOperation} from '../types';

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

export const toParsedSpecWithSortedOperations = (parsedSpec: ParsedSpec): ParsedSpec => {
    const sortedOperations = Array.from(parsedSpec.operations).sort(operationComparator);
    return {
        operations: sortedOperations,
        pathOrUrl: parsedSpec.pathOrUrl,
        paths: parsedSpec.paths
    };
};
