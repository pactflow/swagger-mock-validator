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
    boolean: (pactPathSegment: ParsedMockValue<string>) => {
        const lowerCasePathSegment = pactPathSegment.value.toLowerCase();
        const match = lowerCasePathSegment === 'true' || lowerCasePathSegment === 'false';

        return {match, results: []};
    },
    equal: (pactPathSegment: ParsedMockValue<string>, swaggerPathNameSegment: ParsedSpecPathNameSegment) => {
        const match = swaggerPathNameSegment.value === pactPathSegment.value;

        return {match, results: []};
    },
    integer: (pactPathSegment: ParsedMockValue<string>) => {
        const match =
            pactPathSegment.value.length > 0 && _.isInteger(_.toNumber(pactPathSegment.value));

        return {match, results: []};
    },
    number: (pactPathSegment: ParsedMockValue<string>) => {
        const match =
            pactPathSegment.value.length > 0 && _.isFinite(_.toNumber(pactPathSegment.value));

        return {match, results: []};
    },
    string: (pactPathSegment: ParsedMockValue<string>) => {
        const match = pactPathSegment.value.length > 0;

        return {match, results: []};
    },
    unsupported: (pactPathSegment: ParsedMockValue<string>, swaggerPathSegment: ParsedSpecPathNameSegment) => ({
        match: true,
        results: [
            result.warning({
                message: `Validating parameters of type "${swaggerPathSegment.parameter.type}" ` +
                    'are not supported, assuming value is valid',
                pactSegment: pactPathSegment,
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerPathSegment.parameter
            })
        ]
    })
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
