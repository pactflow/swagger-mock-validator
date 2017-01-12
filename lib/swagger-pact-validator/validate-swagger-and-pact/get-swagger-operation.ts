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
    [name: string]:
        (pactPathSegment: ParsedMockValue<string>, swaggerPathSegment: ParsedSpecPathNameSegment) => MatchResult;
}

const typeValidators: TypeValidators = {
    equal: (pactPathSegment: ParsedMockValue<string>, swaggerPathNameSegment: ParsedSpecPathNameSegment) => {
        const match = swaggerPathNameSegment.value === pactPathSegment.value;

        return {match, results: []};
    },
    jsonSchema: (pactPathSegment: ParsedMockValue<string>, swaggerPathSegment: ParsedSpecPathNameSegment) =>
        validateMockValueAgainstSpec(
            swaggerPathSegment.parameter,
            pactPathSegment,
            pactPathSegment.parentInteraction
        )
};

const doInteractionAndOperationMatchPaths = (
    pactInteraction: ParsedMockInteraction,
    swaggerOperation: ParsedSpecOperation
): MatchResult => {
    const swaggerPathSegments = swaggerOperation.pathNameSegments;

    if (pactInteraction.requestPathSegments.length !== swaggerPathSegments.length) {
        return {match: false, results: []};
    }

    const results = swaggerPathSegments.map((swaggerPathSegment, index) => {
        const pactPathSegment = pactInteraction.requestPathSegments[index];
        const validator = typeValidators[swaggerPathSegment.validatorType];

        return validator(pactPathSegment, swaggerPathSegment);
    });

    return {
        match: _.every(results, 'match'),
        results: _.flatMap(results, (res) => res.results || [])
    };
};

const doInteractionAndOperationMatchMethods = (
    pactInteraction: ParsedMockInteraction,
    swaggerOperation: ParsedSpecOperation
): MatchResult => ({
    match: pactInteraction.requestMethod.value === swaggerOperation.method,
    results: []
});

const doInteractionAndOperationMatch = (
    pactInteraction: ParsedMockInteraction,
    swaggerOperation: ParsedSpecOperation
): GetSwaggerValueResult<ParsedSpecOperation> => {
    const matchMethodResult = doInteractionAndOperationMatchMethods(pactInteraction, swaggerOperation);

    if (!matchMethodResult.match) {
        return {
            found: false,
            results: matchMethodResult.results
        };
    }

    const matchPathsResult = doInteractionAndOperationMatchPaths(pactInteraction, swaggerOperation);
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
        value: swaggerOperation
    };
};

export default (
    pactInteraction: ParsedMockInteraction,
    swagger: ParsedSpec
): GetSwaggerValueResult<ParsedSpecOperation> => {
    const match = _(swagger.operations)
        .map((operation) => doInteractionAndOperationMatch(pactInteraction, operation))
        .find('found');

    if (!match) {
        return {
            found: false,
            results: [
                result.error({
                    message: 'Path or method not defined in swagger file: ' +
                        `${pactInteraction.requestMethod.value.toUpperCase()} ` +
                        `${pactInteraction.requestPath.value}`,
                    pactSegment: pactInteraction.requestPath,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swagger.paths
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
