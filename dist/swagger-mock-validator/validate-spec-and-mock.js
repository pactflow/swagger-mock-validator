"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSpecAndMock = void 0;
const _ = require("lodash");
const get_parsed_spec_operation_1 = require("./validate-spec-and-mock/get-parsed-spec-operation");
const get_parsed_spec_response_1 = require("./validate-spec-and-mock/get-parsed-spec-response");
const to_normalized_parsed_mock_1 = require("./validate-spec-and-mock/to-normalized-parsed-mock");
const to_normalized_parsed_spec_1 = require("./validate-spec-and-mock/to-normalized-parsed-spec");
const validate_parsed_mock_request_body_1 = require("./validate-spec-and-mock/validate-parsed-mock-request-body");
const validate_parsed_mock_request_headers_1 = require("./validate-spec-and-mock/validate-parsed-mock-request-headers");
const validate_parsed_mock_request_query_1 = require("./validate-spec-and-mock/validate-parsed-mock-request-query");
const validate_parsed_mock_response_body_1 = require("./validate-spec-and-mock/validate-parsed-mock-response-body");
const validate_parsed_mock_response_headers_1 = require("./validate-spec-and-mock/validate-parsed-mock-response-headers");
const validate_parsed_spec_consumes_1 = require("./validate-spec-and-mock/validate-parsed-spec-consumes");
const validate_parsed_spec_produces_1 = require("./validate-spec-and-mock/validate-parsed-spec-produces");
const validate_parsed_spec_security_1 = require("./validate-spec-and-mock/validate-parsed-spec-security");
const validateMockInteractionRequest = (parsedMockInteraction, parsedSpecOperation) => _.concat((0, validate_parsed_spec_consumes_1.validateParsedSpecConsumes)(parsedMockInteraction, parsedSpecOperation), (0, validate_parsed_spec_produces_1.validateParsedSpecProduces)(parsedMockInteraction, parsedSpecOperation), (0, validate_parsed_spec_security_1.validateParsedSpecSecurity)(parsedMockInteraction, parsedSpecOperation), (0, validate_parsed_mock_request_body_1.validateParsedMockRequestBody)(parsedMockInteraction, parsedSpecOperation), (0, validate_parsed_mock_request_headers_1.validateParsedMockRequestHeaders)(parsedMockInteraction, parsedSpecOperation), (0, validate_parsed_mock_request_query_1.validateParsedMockRequestQuery)(parsedMockInteraction, parsedSpecOperation));
const validateMockInteractionResponse = (parsedMockInteraction, parsedSpecOperation, opts) => {
    const parsedSpecResponseResult = (0, get_parsed_spec_response_1.getParsedSpecResponse)(parsedMockInteraction, parsedSpecOperation);
    if (!parsedSpecResponseResult.found) {
        return parsedSpecResponseResult.results;
    }
    return _.concat(parsedSpecResponseResult.results, (0, validate_parsed_mock_response_body_1.validateParsedMockResponseBody)(parsedMockInteraction, parsedSpecResponseResult.value, opts), (0, validate_parsed_mock_response_headers_1.validateParsedMockResponseHeaders)(parsedMockInteraction, parsedSpecResponseResult.value));
};
const validateMockInteraction = (parsedMockInteraction, normalizedParsedSpec, opts) => {
    const getParsedSpecOperationResult = (0, get_parsed_spec_operation_1.getParsedSpecOperation)(parsedMockInteraction, normalizedParsedSpec);
    if (!getParsedSpecOperationResult.found) {
        return getParsedSpecOperationResult.results;
    }
    return _.concat(getParsedSpecOperationResult.results, validateMockInteractionRequest(parsedMockInteraction, getParsedSpecOperationResult.value), validateMockInteractionResponse(parsedMockInteraction, getParsedSpecOperationResult.value, opts));
};
const createValidationOutcome = (validationResults, mockPathOrUrl, specPathOrUrl) => {
    const errors = _.filter(validationResults, (res) => res.type === 'error');
    const warnings = _.filter(validationResults, (res) => res.type === 'warning');
    const success = errors.length === 0;
    const failureReason = success
        ? undefined
        : `Mock file "${mockPathOrUrl}" is not compatible with spec file "${specPathOrUrl}"`;
    return { errors, failureReason, success, warnings };
};
const validateSpecAndMock = (parsedMock, parsedSpec, opts) => {
    const normalizedParsedSpec = (0, to_normalized_parsed_spec_1.toNormalizedParsedSpec)(parsedSpec);
    const normalizedParsedMock = (0, to_normalized_parsed_mock_1.toNormalizedParsedMock)(parsedMock);
    const validationResults = _(normalizedParsedMock.interactions)
        .map((parsedMockInteraction) => validateMockInteraction(parsedMockInteraction, normalizedParsedSpec, opts))
        .flatten()
        .value();
    return Promise.resolve(createValidationOutcome(validationResults, parsedMock.pathOrUrl, parsedSpec.pathOrUrl));
};
exports.validateSpecAndMock = validateSpecAndMock;
