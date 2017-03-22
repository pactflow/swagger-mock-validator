import * as _ from 'lodash';
import result from '../result';
import {
    GetSwaggerValueResult,
    GetSwaggerValueSuccessResult,
    ParsedMockInteraction,
    ParsedMockValue,
    ParsedSpec,
    ParsedSpecOperation,
    ParsedSpecPathNameSegment,
    ValidationResult
} from '../types';
import validateMockValueAgainstSpec from './validate-mock-value-against-spec';

interface MatchResult {
    match: boolean;
    results: ValidationResult[];
}

interface TypeValidators {
    [name: string]: (
        parsedMockPathNameSegment: ParsedMockValue<string>,
        parsedSpecPathNameSegment: ParsedSpecPathNameSegment
    ) => MatchResult;
}

const typeValidators: TypeValidators = {
    equal: (
        parsedMockPathNameSegment: ParsedMockValue<string>,
        parsedSpecPathNameSegment: ParsedSpecPathNameSegment
    ) => {
        const match = parsedSpecPathNameSegment.value === parsedMockPathNameSegment.value;

        return {match, results: []};
    },
    jsonSchema: (
        parsedMockPathNameSegment: ParsedMockValue<string>,
        parsedSpecPathNameSegment: ParsedSpecPathNameSegment
    ) =>
        validateMockValueAgainstSpec(
            parsedSpecPathNameSegment.parameter,
            parsedMockPathNameSegment,
            parsedMockPathNameSegment.parentInteraction,
            'spv.request.path-or-method.unknown'
        )
};

const doInteractionAndOperationMatchPaths = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
): MatchResult => {
    const parsedSpecPathNameSegments = parsedSpecOperation.pathNameSegments;

    if (parsedMockInteraction.requestPathSegments.length !== parsedSpecPathNameSegments.length) {
        return {match: false, results: []};
    }

    const results = parsedSpecPathNameSegments.map((parsedSpecPathNameSegment, index) => {
        const parsedMockPathNameSegment = parsedMockInteraction.requestPathSegments[index];
        const validator = typeValidators[parsedSpecPathNameSegment.validatorType];

        return validator(parsedMockPathNameSegment, parsedSpecPathNameSegment);
    });

    return {
        match: _.every(results, 'match'),
        results: _.flatMap(results, (res) => res.results || [])
    };
};

const doInteractionAndOperationMatchMethods = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
): MatchResult => ({
    match: parsedMockInteraction.requestMethod.value === parsedSpecOperation.method,
    results: []
});

const doInteractionAndOperationMatch = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
): GetSwaggerValueResult<ParsedSpecOperation> => {
    const matchMethodResult = doInteractionAndOperationMatchMethods(parsedMockInteraction, parsedSpecOperation);

    if (!matchMethodResult.match) {
        return {
            found: false,
            results: matchMethodResult.results
        };
    }

    const matchPathsResult = doInteractionAndOperationMatchPaths(parsedMockInteraction, parsedSpecOperation);
    const results = _.concat(matchPathsResult.results, matchMethodResult.results);

    if (!matchPathsResult.match) {
        return {
            found: false,
            results
        };
    }

    return {
        found: true,
        results,
        value: parsedSpecOperation
    };
};

export default (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpec: ParsedSpec
): GetSwaggerValueResult<ParsedSpecOperation> => {
    const match = _(parsedSpec.operations)
        .map((parsedSpecOperation) => doInteractionAndOperationMatch(parsedMockInteraction, parsedSpecOperation))
        .find('found');

    if (!match) {
        return {
            found: false,
            results: [
                result.build({
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: ' +
                        `${parsedMockInteraction.requestMethod.value.toUpperCase()} ` +
                        `${parsedMockInteraction.requestPath.value}`,
                    mockSegment: parsedMockInteraction.requestPath,
                    source: 'spec-mock-validation',
                    specSegment: parsedSpec.paths
                })
            ]
        };
    }

    return {
        found: true,
        results: match.results,
        value: (match as GetSwaggerValueSuccessResult<ParsedSpecOperation>).value
    };
};
