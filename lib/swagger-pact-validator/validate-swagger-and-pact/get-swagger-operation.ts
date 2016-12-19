import * as _ from 'lodash';
import result from '../result';
import {
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
    value?: ParsedSpecOperation;
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
            swaggerPathSegment.parameter.name,
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
) => {
    const matchMethodResult = doInteractionAndOperationMatchMethods(pactInteraction, swaggerOperation);

    if (!matchMethodResult.match) {
        return matchMethodResult;
    }

    const matchPathsResult = doInteractionAndOperationMatchPaths(pactInteraction, swaggerOperation);

    return {
        match: matchPathsResult.match,
        results: _.concat(matchPathsResult.results, matchMethodResult.results),
        value: swaggerOperation
    };
};

export default (pactInteraction: ParsedMockInteraction, swagger: ParsedSpec) => {
    const match = _(swagger.operations)
        .map((operation) => doInteractionAndOperationMatch(pactInteraction, operation))
        .find('match');

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
            ],
            value: null
        };
    }

    return {
        found: true,
        results: match.results,
        value: match.value
    };
};
