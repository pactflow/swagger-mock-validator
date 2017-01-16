"use strict";
const _ = require("lodash");
const result_1 = require("../result");
const validate_mock_value_against_spec_1 = require("./validate-mock-value-against-spec");
const getWarningForUndefinedQueryParameter = (queryParameterName, queryParameter, swaggerOperation) => {
    return [result_1.default.warning({
            message: `Query parameter is not defined in the swagger file: ${queryParameterName}`,
            pactSegment: queryParameter,
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerOperation
        })];
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swaggerOperation) => {
    return _(_.keys(pactInteraction.requestQuery))
        .union(_.keys(swaggerOperation.requestQueryParameters))
        .map((name) => {
        const queryParameter = pactInteraction.requestQuery[name];
        const queryParameterDefinition = swaggerOperation.requestQueryParameters[name];
        if (!queryParameterDefinition && queryParameter) {
            return getWarningForUndefinedQueryParameter(name, queryParameter, swaggerOperation);
        }
        return validate_mock_value_against_spec_1.default(queryParameterDefinition, queryParameter, pactInteraction).results;
    })
        .flatten()
        .value();
};
