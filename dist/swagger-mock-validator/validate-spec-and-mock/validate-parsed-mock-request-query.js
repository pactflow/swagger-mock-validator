"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParsedMockRequestQuery = void 0;
const _ = require("lodash");
const result_1 = require("../result");
const validate_mock_value_against_spec_1 = require("./validate-mock-value-against-spec");
const queryUsedForSecurity = (queryName, parsedSpecOperation) => _.some(parsedSpecOperation.securityRequirements, (securityRequirement) => _.some(securityRequirement, (requirement) => requirement.credentialLocation === 'query' && requirement.credentialKey === queryName));
const getWarningForUndefinedQueryParameter = (queryName, parsedMockRequestQuery, parsedSpecOperation) => {
    if (queryUsedForSecurity(queryName, parsedSpecOperation)) {
        return [];
    }
    return [result_1.result.build({
            code: 'request.query.unknown',
            message: `Query parameter is not defined in the spec file: ${queryName}`,
            mockSegment: parsedMockRequestQuery,
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })];
};
exports.validateParsedMockRequestQuery = (parsedMockInteraction, parsedSpecOperation) => {
    return _(_.keys(parsedMockInteraction.requestQuery))
        .union(_.keys(parsedSpecOperation.requestQueryParameters))
        .map((queryName) => {
        const parsedMockRequestQuery = parsedMockInteraction.requestQuery[queryName];
        const parsedSpecRequestQuery = parsedSpecOperation.requestQueryParameters[queryName];
        if (!parsedSpecRequestQuery && parsedMockRequestQuery) {
            return getWarningForUndefinedQueryParameter(queryName, parsedMockRequestQuery, parsedSpecOperation);
        }
        const validationResult = validate_mock_value_against_spec_1.validateMockValueAgainstSpec(parsedSpecRequestQuery, parsedMockRequestQuery, parsedMockInteraction, 'request.query.incompatible');
        return validationResult.results;
    })
        .flatten()
        .value();
};
