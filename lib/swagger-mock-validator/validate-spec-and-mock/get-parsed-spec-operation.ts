import _ from 'lodash';
import {ValidationResult} from '../../api-types';
import {ParsedMockInteraction, ParsedMockValue} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {
    ParsedSpec,
    ParsedSpecOperation,
    ParsedSpecPathNameSegmentEqual,
    ParsedSpecPathNameSegmentJsonSchema
} from '../spec-parser/parsed-spec';
import {
    GetSwaggerValueResult,
    GetSwaggerValueSuccessResult
} from '../types';
import {validateMockValueAgainstSpec} from './validate-mock-value-against-spec';

interface MatchResult {
    match: boolean;
    results: ValidationResult[];
}

const equalsTypeValidator = (
    parsedMockPathNameSegment: ParsedMockValue<string>,
    parsedSpecPathNameSegment: ParsedSpecPathNameSegmentEqual
) => {
    const match = parsedSpecPathNameSegment.value === parsedMockPathNameSegment.value;

    return {match, results: []};
};

const jsonSchemaTypeValidator = (
    parsedMockPathNameSegment: ParsedMockValue<string>,
    parsedSpecPathNameSegment: ParsedSpecPathNameSegmentJsonSchema
) =>
    validateMockValueAgainstSpec(
        parsedSpecPathNameSegment.parameter,
        parsedMockPathNameSegment,
        parsedMockPathNameSegment.parentInteraction,
        'request.path-or-method.unknown'
    );

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
        switch (parsedSpecPathNameSegment.validatorType) {
            case 'jsonSchema': return jsonSchemaTypeValidator(parsedMockPathNameSegment, parsedSpecPathNameSegment);
            case 'equal': return equalsTypeValidator(parsedMockPathNameSegment, parsedSpecPathNameSegment);
        }
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

const isGetSwaggerValueSuccessResult = <T>(res: GetSwaggerValueResult<T>): res is GetSwaggerValueSuccessResult<T> =>
    res.found;

export const getParsedSpecOperation = (
    parsedMockInteraction: ParsedMockInteraction,
    normalizedParsedSpec: ParsedSpec
): GetSwaggerValueResult<ParsedSpecOperation> => {
    const match = normalizedParsedSpec.operations
        .map((parsedSpecOperation) => doInteractionAndOperationMatch(parsedMockInteraction, parsedSpecOperation))
        .find(isGetSwaggerValueSuccessResult);

    if (!match) {
        return {
            found: false,
            results: [
                result.build({
                    code: 'request.path-or-method.unknown',
                    message: 'Path or method not defined in spec file: ' +
                        `${parsedMockInteraction.requestMethod.value.toUpperCase()} ` +
                        `${parsedMockInteraction.requestPath.value}`,
                    mockSegment: parsedMockInteraction.requestPath,
                    source: 'spec-mock-validation',
                    specSegment: normalizedParsedSpec.paths
                })
            ]
        };
    }

    return {
        found: true,
        results: match.results,
        value: match.value
    };
};
