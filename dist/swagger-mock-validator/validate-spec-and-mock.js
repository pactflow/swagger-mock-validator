"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const get_parsed_spec_operation_1 = require("./validate-spec-and-mock/get-parsed-spec-operation");
const get_parsed_spec_response_1 = require("./validate-spec-and-mock/get-parsed-spec-response");
const validate_parsed_mock_request_body_1 = require("./validate-spec-and-mock/validate-parsed-mock-request-body");
const validate_parsed_mock_request_headers_1 = require("./validate-spec-and-mock/validate-parsed-mock-request-headers");
const validate_parsed_mock_request_query_1 = require("./validate-spec-and-mock/validate-parsed-mock-request-query");
const validate_parsed_mock_response_body_1 = require("./validate-spec-and-mock/validate-parsed-mock-response-body");
const validate_parsed_mock_response_headers_1 = require("./validate-spec-and-mock/validate-parsed-mock-response-headers");
const validate_parsed_spec_consumes_1 = require("./validate-spec-and-mock/validate-parsed-spec-consumes");
const validate_parsed_spec_produces_1 = require("./validate-spec-and-mock/validate-parsed-spec-produces");
const validate_parsed_spec_security_1 = require("./validate-spec-and-mock/validate-parsed-spec-security");
const validateMockInteractionRequest = (parsedMockInteraction, parsedSpecOperation) => _.concat(validate_parsed_spec_consumes_1.validateParsedSpecConsumes(parsedMockInteraction, parsedSpecOperation), validate_parsed_spec_produces_1.validateParsedSpecProduces(parsedMockInteraction, parsedSpecOperation), validate_parsed_spec_security_1.validateParsedSpecSecurity(parsedMockInteraction, parsedSpecOperation), validate_parsed_mock_request_body_1.validateParsedMockRequestBody(parsedMockInteraction, parsedSpecOperation), validate_parsed_mock_request_headers_1.validateParsedMockRequestHeaders(parsedMockInteraction, parsedSpecOperation), validate_parsed_mock_request_query_1.validateParsedMockRequestQuery(parsedMockInteraction, parsedSpecOperation));
const validateMockInteractionResponse = (parsedMockInteraction, parsedSpecOperation) => {
    const parsedSpecResponseResult = get_parsed_spec_response_1.getParsedSpecResponse(parsedMockInteraction, parsedSpecOperation);
    if (!parsedSpecResponseResult.found) {
        return parsedSpecResponseResult.results;
    }
    return _.concat(parsedSpecResponseResult.results, validate_parsed_mock_response_body_1.validateParsedMockResponseBody(parsedMockInteraction, parsedSpecResponseResult.value), validate_parsed_mock_response_headers_1.validateParsedMockResponseHeaders(parsedMockInteraction, parsedSpecResponseResult.value));
};
const validateMockInteraction = (parsedMockInteraction, parsedSpec) => {
    const getParsedSpecOperationResult = get_parsed_spec_operation_1.getParsedSpecOperation(parsedMockInteraction, parsedSpec);
    if (!getParsedSpecOperationResult.found) {
        return getParsedSpecOperationResult.results;
    }
    return _.concat(getParsedSpecOperationResult.results, validateMockInteractionRequest(parsedMockInteraction, getParsedSpecOperationResult.value), validateMockInteractionResponse(parsedMockInteraction, getParsedSpecOperationResult.value));
};
exports.validateSpecAndMock = (parsedMock, parsedSpec) => {
    const validationResults = _(parsedMock.interactions)
        .map((parsedMockInteraction) => validateMockInteraction(parsedMockInteraction, parsedSpec))
        .flatten()
        .value();
    const errors = _.filter(validationResults, (res) => res.type === 'error');
    const warnings = _.filter(validationResults, (res) => res.type === 'warning');
    const success = errors.length === 0;
    const failureReason = success ? undefined : `Mock file "${parsedMock.pathOrUrl}" is not compatible ` +
        `with swagger file "${parsedSpec.pathOrUrl}"`;
    return Promise.resolve({ errors, failureReason, success, warnings });
};
