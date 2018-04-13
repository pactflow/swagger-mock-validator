"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const result_1 = require("../result");
const validate_mock_value_against_spec_1 = require("./validate-mock-value-against-spec");
const equalsTypeValidator = (parsedMockPathNameSegment, parsedSpecPathNameSegment) => {
    const match = parsedSpecPathNameSegment.value === parsedMockPathNameSegment.value;
    return { match, results: [] };
};
const jsonSchemaTypeValidator = (parsedMockPathNameSegment, parsedSpecPathNameSegment) => validate_mock_value_against_spec_1.validateMockValueAgainstSpec(parsedSpecPathNameSegment.parameter, parsedMockPathNameSegment, parsedMockPathNameSegment.parentInteraction, 'spv.request.path-or-method.unknown');
const doInteractionAndOperationMatchPaths = (parsedMockInteraction, parsedSpecOperation) => {
    const parsedSpecPathNameSegments = parsedSpecOperation.pathNameSegments;
    if (parsedMockInteraction.requestPathSegments.length !== parsedSpecPathNameSegments.length) {
        return { match: false, results: [] };
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
const doInteractionAndOperationMatchMethods = (parsedMockInteraction, parsedSpecOperation) => ({
    match: parsedMockInteraction.requestMethod.value === parsedSpecOperation.method,
    results: []
});
const doInteractionAndOperationMatch = (parsedMockInteraction, parsedSpecOperation) => {
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
exports.getParsedSpecOperation = (parsedMockInteraction, parsedSpec) => {
    const match = _(parsedSpec.operations)
        .map((parsedSpecOperation) => doInteractionAndOperationMatch(parsedMockInteraction, parsedSpecOperation))
        .find('found');
    if (!match) {
        return {
            found: false,
            results: [
                result_1.result.build({
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
        value: match.value
    };
};
