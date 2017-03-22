import * as _ from 'lodash';
import * as q from 'q';
import {
    ParsedMock,
    ParsedMockInteraction,
    ParsedSpec,
    ParsedSpecOperation,
    ValidationFailureError,
    ValidationResult
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

export default (parsedMock: ParsedMock, parsedSpec: ParsedSpec) => {
    const validationResults = _(parsedMock.interactions)
        .map((parsedMockInteraction) => validateMockInteraction(parsedMockInteraction, parsedSpec))
        .flatten<ValidationResult>()
        .value();

    const results = {
        errors: _.filter(validationResults, (res) => res.type === 'error'),
        warnings: _.filter(validationResults, (res) => res.type === 'warning')
    };

    if (results.errors.length > 0) {
        const error = new Error(
            `Mock file "${parsedMock.pathOrUrl}" is not compatible ` +
            `with swagger file "${parsedSpec.pathOrUrl}"`
        ) as ValidationFailureError;

        error.details = {
            errors: results.errors,
            warnings: results.warnings
        };

        return q.reject(error);
    }

    return q({warnings: results.warnings});
};
