"use strict";
const _ = require("lodash");
const result_1 = require("../result");
const validate_mock_value_against_spec_1 = require("./validate-mock-value-against-spec");
const typeValidators = {
    equal: (pactPathSegment, swaggerPathNameSegment) => {
        const match = swaggerPathNameSegment.value === pactPathSegment.value;
        return { match, results: [] };
    },
    jsonSchema: (pactPathSegment, swaggerPathSegment) => validate_mock_value_against_spec_1.default(swaggerPathSegment.parameter.name, swaggerPathSegment.parameter, pactPathSegment, pactPathSegment.parentInteraction)
};
const doInteractionAndOperationMatchPaths = (pactInteraction, swaggerOperation) => {
    const swaggerPathSegments = swaggerOperation.pathNameSegments;
    if (pactInteraction.requestPathSegments.length !== swaggerPathSegments.length) {
        return { match: false, results: [] };
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
const doInteractionAndOperationMatchMethods = (pactInteraction, swaggerOperation) => ({
    match: pactInteraction.requestMethod.value === swaggerOperation.method,
    results: []
});
const doInteractionAndOperationMatch = (pactInteraction, swaggerOperation) => {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swagger) => {
    const match = _(swagger.operations)
        .map((operation) => doInteractionAndOperationMatch(pactInteraction, operation))
        .find('match');
    if (!match) {
        return {
            found: false,
            results: [
                result_1.default.error({
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
