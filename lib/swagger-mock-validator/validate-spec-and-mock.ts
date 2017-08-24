import * as _ from 'lodash';
import {ValidationOutcome, ValidationResult} from '../api-types';
import {
    ParsedMock,
    ParsedMockInteraction,
    ParsedSpec,
    ParsedSpecOperation
} from './types';
import getParsedSpecOperation from './validate-spec-and-mock/get-parsed-spec-operation';
import getParsedSpecResponse from './validate-spec-and-mock/get-parsed-spec-response';
import validateParsedMockRequestBody from './validate-spec-and-mock/validate-parsed-mock-request-body';
import validateParsedMockRequestHeaders from './validate-spec-and-mock/validate-parsed-mock-request-headers';
import validateParsedMockRequestQuery from './validate-spec-and-mock/validate-parsed-mock-request-query';
import validateParsedMockResponseBody from './validate-spec-and-mock/validate-parsed-mock-response-body';
import validateParsedMockResponseHeaders from './validate-spec-and-mock/validate-parsed-mock-response-headers';
import validateParsedSpecConsumes from './validate-spec-and-mock/validate-parsed-spec-consumes';
import validateParsedSpecProduces from './validate-spec-and-mock/validate-parsed-spec-produces';
import validateParsedSpecSecurity from './validate-spec-and-mock/validate-parsed-spec-security';

const validateMockInteractionRequest = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => _.concat(
    validateParsedSpecConsumes(parsedMockInteraction, parsedSpecOperation),
    validateParsedSpecProduces(parsedMockInteraction, parsedSpecOperation),
    validateParsedSpecSecurity(parsedMockInteraction, parsedSpecOperation),
    validateParsedMockRequestBody(parsedMockInteraction, parsedSpecOperation),
    validateParsedMockRequestHeaders(parsedMockInteraction, parsedSpecOperation),
    validateParsedMockRequestQuery(parsedMockInteraction, parsedSpecOperation)
);

const validateMockInteractionResponse = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => {
    const parsedSpecResponseResult = getParsedSpecResponse(parsedMockInteraction, parsedSpecOperation);

    if (!parsedSpecResponseResult.found) {
        return parsedSpecResponseResult.results;
    }

    return _.concat(
        parsedSpecResponseResult.results,
        validateParsedMockResponseBody(parsedMockInteraction, parsedSpecResponseResult.value),
        validateParsedMockResponseHeaders(parsedMockInteraction, parsedSpecResponseResult.value)
    );
};

const validateMockInteraction = (parsedMockInteraction: ParsedMockInteraction, parsedSpec: ParsedSpec) => {
    const getParsedSpecOperationResult = getParsedSpecOperation(parsedMockInteraction, parsedSpec);

    if (!getParsedSpecOperationResult.found) {
        return getParsedSpecOperationResult.results;
    }

    return _.concat(
        getParsedSpecOperationResult.results,
        validateMockInteractionRequest(parsedMockInteraction, getParsedSpecOperationResult.value),
        validateMockInteractionResponse(parsedMockInteraction, getParsedSpecOperationResult.value)
    );
};

export default (parsedMock: ParsedMock, parsedSpec: ParsedSpec): Promise<ValidationOutcome> => {
    const validationResults = _(parsedMock.interactions)
        .map((parsedMockInteraction) => validateMockInteraction(parsedMockInteraction, parsedSpec))
        .flatten<ValidationResult>()
        .value();

    const errors = _.filter(validationResults, (res) => res.type === 'error');
    const warnings = _.filter(validationResults, (res) => res.type === 'warning');
    const success = errors.length === 0;
    const failureReason = success ? undefined : `Mock file "${parsedMock.pathOrUrl}" is not compatible ` +
        `with swagger file "${parsedSpec.pathOrUrl}"`;

    return Promise.resolve({errors, failureReason, success, warnings});
};
