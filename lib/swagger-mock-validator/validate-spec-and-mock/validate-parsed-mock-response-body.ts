import _ from 'lodash';
import { traverseJsonSchema } from '../common/traverse-json-schema';
import { ParsedMockInteraction } from '../mock-parser/parsed-mock';
import { result } from '../result';
import {
  ParsedSpecJsonSchema,
  ParsedSpecJsonSchemaValue,
  ParsedSpecResponse
} from '../spec-parser/parsed-spec';
import { ValidateOptions } from '../types';
import { isTypesOfJson } from './content-negotiation';
import { validateJson } from './validate-json';

// a consumer may only use a subset of the provider *response*
// any field marked as required in OAS, should be considered optional for pact testing
const removeRequiredPropertiesFromSchema = (
  schema: ParsedSpecJsonSchema
): ParsedSpecJsonSchema => {
  const modifiedSchema = _.cloneDeep(schema);

  traverseJsonSchema(modifiedSchema, (mutableSchema) => {
    if (mutableSchema.oneOf) {
      return; // discriminator is required to be a valid schema
    }
    delete mutableSchema.required;
  });

  return modifiedSchema;
};

// a provider must provide a superset of what the consumer asks for
// additionalProperties expected in pact response are disallowed
const setAdditionalPropertiesToFalseInSchema = (
  schema: ParsedSpecJsonSchema
): ParsedSpecJsonSchema => {
  const modifiedSchema = _.cloneDeep(schema);

  traverseJsonSchema(modifiedSchema, (mutableSchema) => {
    if (typeof mutableSchema.additionalProperties === 'undefined' && mutableSchema.type && mutableSchema.type === "object") {
      mutableSchema.additionalProperties = false;
    }
  });

  return modifiedSchema;
};


// OpenAPI defines allOf to mean the union of all sub-schemas
// JSON-Schema defines allOf to mean that *every* sub-schema needs to be satisfied
// In draft 2019-09, JSON-Schema added "unevaluatedProperties" to support this behaviour
const convertAllOfDefinition = (
  schema: ParsedSpecJsonSchema
): ParsedSpecJsonSchema => {
  const modifiedSchema = _.cloneDeep(schema);

  traverseJsonSchema(modifiedSchema, (mutableSchema) => {
    if (mutableSchema.allOf) {
      mutableSchema.allOf.forEach(s => { delete (s as ParsedSpecJsonSchemaValue).additionalProperties; });
      mutableSchema.unevaluatedProperties = false;
    }
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

  const expectedMediaType = parsedMockInteraction.requestHeaders.accept?.value || "application/json";
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

  schema = convertAllOfDefinition(schema);

  const validationErrors = validateJson(
    schema,
    parsedMockInteraction.responseBody.value
  );

  return _.map(validationErrors, (error) => {
    const message =
      error.keyword === 'additionalProperties'
        ? `${error.message} - ${error.params.additionalProperty}`
        : error.message;

    return result.build({
      code: 'response.body.incompatible',
      message: `Response body is incompatible with the response body schema in the spec file: ${message}`,
      mockSegment: parsedMockInteraction.getResponseBodyPath(error.instancePath.replace(/\//g, '.')),
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
