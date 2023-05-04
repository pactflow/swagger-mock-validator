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
import { isMediaTypeSupported } from './content-negotiation';
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
  !isMediaTypeSupported('application/json', parsedSpecResponse.produces.value);

const shouldSkipValidation = (
  parsedMockInteraction: ParsedMockInteraction,
  parsedSpecResponse: ParsedSpecResponse
) =>
  isMockInteractionWithoutResponseBody(parsedMockInteraction) ||
  isNotSupportedMediaType(parsedSpecResponse);

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

  if (!parsedSpecResponse.schema) {
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

  // start with a default schema
  let responseBodyToValidate: ParsedSpecJsonSchema = parsedSpecResponse.schema;

  // switch schema based on content-type
  const contentType = parsedMockInteraction.responseHeaders['content-type']?.value;
  if (contentType && parsedSpecResponse.schemasByContentType && parsedSpecResponse.schemasByContentType[contentType]) {
    responseBodyToValidate = parsedSpecResponse.schemasByContentType[contentType];
  }

  if (!opts.additionalPropertiesInResponse) {
    responseBodyToValidate = setAdditionalPropertiesToFalseInSchema(
      responseBodyToValidate
    );
  }
  if (!opts.requiredPropertiesInResponse) {
    responseBodyToValidate = removeRequiredPropertiesFromSchema(
      responseBodyToValidate
    );
  }

  const validationErrors = validateJson(
    responseBodyToValidate,
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
        contentType
      )
    });
  });
};
