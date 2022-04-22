import * as _ from 'lodash';
import { ValidationOutcome, ValidationResult } from '../api-types';
import { ParsedMock, ParsedMockInteraction } from './mock-parser/parsed-mock';
import { ParsedSpec, ParsedSpecOperation } from './spec-parser/parsed-spec';
import { ValidateOptions } from './types';
import { getParsedSpecOperation } from './validate-spec-and-mock/get-parsed-spec-operation';
import { getParsedSpecResponse } from './validate-spec-and-mock/get-parsed-spec-response';
import { toNormalizedParsedMock } from './validate-spec-and-mock/to-normalized-parsed-mock';
import { toNormalizedParsedSpec } from './validate-spec-and-mock/to-normalized-parsed-spec';
import { validateParsedMockRequestBody } from './validate-spec-and-mock/validate-parsed-mock-request-body';
import { validateParsedMockRequestHeaders } from './validate-spec-and-mock/validate-parsed-mock-request-headers';
import { validateParsedMockRequestQuery } from './validate-spec-and-mock/validate-parsed-mock-request-query';
import { validateParsedMockResponseBody } from './validate-spec-and-mock/validate-parsed-mock-response-body';
import { validateParsedMockResponseHeaders } from './validate-spec-and-mock/validate-parsed-mock-response-headers';
import { validateParsedSpecConsumes } from './validate-spec-and-mock/validate-parsed-spec-consumes';
import { validateParsedSpecProduces } from './validate-spec-and-mock/validate-parsed-spec-produces';
import { validateParsedSpecSecurity } from './validate-spec-and-mock/validate-parsed-spec-security';

const validateMockInteractionRequest = (
  parsedMockInteraction: ParsedMockInteraction,
  parsedSpecOperation: ParsedSpecOperation
) =>
  _.concat(
    validateParsedSpecConsumes(parsedMockInteraction, parsedSpecOperation),
    validateParsedSpecProduces(parsedMockInteraction, parsedSpecOperation),
    validateParsedSpecSecurity(parsedMockInteraction, parsedSpecOperation),
    validateParsedMockRequestBody(parsedMockInteraction, parsedSpecOperation),
    validateParsedMockRequestHeaders(
      parsedMockInteraction,
      parsedSpecOperation
    ),
    validateParsedMockRequestQuery(parsedMockInteraction, parsedSpecOperation)
  );

const validateMockInteractionResponse = (
  parsedMockInteraction: ParsedMockInteraction,
  parsedSpecOperation: ParsedSpecOperation,
  opts: Pick<
    ValidateOptions,
    'additionalPropertiesInResponse' | 'requiredPropertiesInResponse'
  >
) => {
  const parsedSpecResponseResult = getParsedSpecResponse(
    parsedMockInteraction,
    parsedSpecOperation
  );

  if (!parsedSpecResponseResult.found) {
    return parsedSpecResponseResult.results;
  }

  return _.concat(
    parsedSpecResponseResult.results,
    validateParsedMockResponseBody(
      parsedMockInteraction,
      parsedSpecResponseResult.value,
      opts
    ),
    validateParsedMockResponseHeaders(
      parsedMockInteraction,
      parsedSpecResponseResult.value
    )
  );
};

const validateMockInteraction = (
  parsedMockInteraction: ParsedMockInteraction,
  normalizedParsedSpec: ParsedSpec,
  opts: Pick<
    ValidateOptions,
    'additionalPropertiesInResponse' | 'requiredPropertiesInResponse'
  >
): ValidationResult[] => {
  const getParsedSpecOperationResult = getParsedSpecOperation(
    parsedMockInteraction,
    normalizedParsedSpec
  );

  if (!getParsedSpecOperationResult.found) {
    return getParsedSpecOperationResult.results;
  }

  return _.concat(
    getParsedSpecOperationResult.results,
    validateMockInteractionRequest(
      parsedMockInteraction,
      getParsedSpecOperationResult.value
    ),
    validateMockInteractionResponse(
      parsedMockInteraction,
      getParsedSpecOperationResult.value,
      opts
    )
  );
};

const createValidationOutcome = (
  validationResults: ValidationResult[],
  mockPathOrUrl: string,
  specPathOrUrl: string
): ValidationOutcome => {
  const errors = _.filter(validationResults, (res) => res.type === 'error');
  const warnings = _.filter(validationResults, (res) => res.type === 'warning');
  const success = errors.length === 0;
  const failureReason = success
    ? undefined
    : `Mock file "${mockPathOrUrl}" is not compatible with spec file "${specPathOrUrl}"`;

  return { errors, failureReason, success, warnings };
};

export const validateSpecAndMock = (
  parsedMock: ParsedMock,
  parsedSpec: ParsedSpec,
  opts: Pick<
    ValidateOptions,
    'additionalPropertiesInResponse' | 'requiredPropertiesInResponse'
  >
): Promise<ValidationOutcome> => {
  const normalizedParsedSpec = toNormalizedParsedSpec(parsedSpec);
  const normalizedParsedMock = toNormalizedParsedMock(parsedMock);

  const validationResults = _(normalizedParsedMock.interactions)
    .map((parsedMockInteraction) =>
      validateMockInteraction(parsedMockInteraction, normalizedParsedSpec, opts)
    )
    .flatten()
    .value();

  return Promise.resolve(
    createValidationOutcome(
      validationResults,
      parsedMock.pathOrUrl,
      parsedSpec.pathOrUrl
    )
  );
};
