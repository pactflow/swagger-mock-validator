import Ajv from 'ajv';
import _ from 'lodash';
import { traverseJsonSchema } from '../common/traverse-json-schema';
import { ParsedMockInteraction } from '../mock-parser/parsed-mock';
import { result } from '../result';
import {
  ParsedSpecJsonSchema,
  ParsedSpecResponse
} from '../spec-parser/parsed-spec';
import { ValidateOptions } from '../types';
import { isTypesOfJson } from './content-negotiation';
import { validateJson } from './validate-json';

const removeRequiredPropertiesFromSchema = (
  schema: ParsedSpecJsonSchema
): ParsedSpecJsonSchema => {
  const modifiedSchema = _.cloneDeep(schema);

  traverseJsonSchema(modifiedSchema, (mutableSchema) => {
    delete mutableSchema.required;

    return modifiedSchema;
  });

  return modifiedSchema;
};

const setAdditionalPropertiesToFalseInSchema = (
  schema: ParsedSpecJsonSchema
): ParsedSpecJsonSchema => {
  const modifiedSchema = _.cloneDeep(schema);

  traverseJsonSchema(modifiedSchema, (mutableSchema) => {
    if (typeof mutableSchema.additionalProperties === 'undefined') {
      mutableSchema.additionalProperties = false;
    }
    return modifiedSchema;
  });

  return modifiedSchema;
};

const isMockInteractionWithoutResponseBody = (
  parsedMockInteraction: ParsedMockInteraction
) => !parsedMockInteraction.responseBody.value;

const isNotSupportedMediaType = (parsedSpecResponse: ParsedSpecResponse) =>
  parsedSpecResponse.produces.value.length > 0 &&
  !isTypesOfJson(parsedSpecResponse.produces.value);

const shouldSkipValidation = (
  parsedMockInteraction: ParsedMockInteraction,
  parsedSpecResponse: ParsedSpecResponse
) =>
  isMockInteractionWithoutResponseBody(parsedMockInteraction) ||
  isNotSupportedMediaType(parsedSpecResponse);

// tslint:disable:cyclomatic-complexity
export const validateParsedMockResponseBody = (
  parsedMockInteraction: ParsedMockInteraction,
  parsedSpecResponse: ParsedSpecResponse,
  opts: Pick<
    ValidateOptions,
    'additionalPropertiesInResponse' | 'requiredPropertiesInResponse'
  >
) => {
  if (shouldSkipValidation(parsedMockInteraction, parsedSpecResponse)) {
    return [];
  }

  const expectedMediaType = parsedMockInteraction.requestHeaders.accept?.value;
  const schemaForMediaType = parsedSpecResponse.schemaByContentType(expectedMediaType);

  if (!schemaForMediaType) {
    return [
      result.build({
        code: 'response.body.unknown',
        message: 'No schema found for response body',
        mockSegment: parsedMockInteraction.responseBody,
        source: 'spec-mock-validation',
        specSegment: parsedSpecResponse
      })
    ];
  }

  let schema = schemaForMediaType.schema;
  const mediaType = schemaForMediaType.mediaType;

  if (!opts.additionalPropertiesInResponse) {
    schema = setAdditionalPropertiesToFalseInSchema(schema);
  }
  if (!opts.requiredPropertiesInResponse) {
    schema = removeRequiredPropertiesFromSchema(schema);
  }

  const validationErrors = validateJson(
    schema,
    parsedMockInteraction.responseBody.value
  );

  return _.map(validationErrors, (error) => {
    const message =
      error.keyword === 'additionalProperties'
        ? `${error.message} - ${
            (error.params as Ajv.AdditionalPropertiesParams).additionalProperty
          }`
        : error.message;

    return result.build({
      code: 'response.body.incompatible',
      message: `Response body is incompatible with the response body schema in the spec file: ${message}`,
      mockSegment: parsedMockInteraction.getResponseBodyPath(error.dataPath),
      source: 'spec-mock-validation',
      specSegment: parsedSpecResponse.getFromSchema(
        error.schemaPath.replace(/\//g, '.').substring(2),
        schema,
        mediaType
      )
    });
  });
};
// tslint:enable:cyclomatic-complexity
