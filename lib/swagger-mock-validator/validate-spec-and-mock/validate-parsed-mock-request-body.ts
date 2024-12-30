import _ from 'lodash';
import querystring from 'node:querystring';
import { traverseJsonSchema } from '../common/traverse-json-schema';
import { ParsedMockInteraction } from '../mock-parser/parsed-mock';
import { result } from '../result';
import { ParsedSpecJsonSchema, ParsedSpecJsonSchemaValue, ParsedSpecBody, ParsedSpecOperation } from '../spec-parser/parsed-spec';
import { isTypesOfJson } from './content-negotiation';
import { validateJson } from './validate-json';

const transformSchema = (
    schema: ParsedSpecJsonSchema,
): ParsedSpecJsonSchema => {
    const modifiedSchema = _.cloneDeep(schema);

    // OpenAPI defines allOf to mean the union of all sub-schemas
    // JSON-Schema defines allOf to mean that *every* sub-schema needs to be satisfied
    // In draft 2019-09, JSON-Schema added "unevaluatedProperties" to support this behaviour
    traverseJsonSchema(modifiedSchema, (mutableSchema) => {
        if (mutableSchema.allOf) {
            mutableSchema.allOf.forEach((s) => {
                delete (s as ParsedSpecJsonSchemaValue).additionalProperties;
            });
            mutableSchema.unevaluatedProperties = false;
        }
    });

    // draft-06 onwards converts exclusiveMinimum and exclusiveMaximum to numbers
    traverseJsonSchema(modifiedSchema, (mutableSchema) => {
        mutableSchema.exclusiveMaximum = mutableSchema.exclusiveMaximum ? mutableSchema.maximum : undefined;
        mutableSchema.exclusiveMinimum = mutableSchema.exclusiveMinimum ? mutableSchema.minimum : undefined;
    });

    return modifiedSchema;
};

const isOptionalRequestBodyMissing = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) =>
    parsedMockInteraction.requestBody.value === undefined &&
    !(parsedSpecOperation.requestBodyParameter && parsedSpecOperation.requestBodyParameter.required);

const specAndMockHaveNoBody = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => !parsedSpecOperation.requestBodyParameter && !parsedMockInteraction.requestBody.value;

const isUnsupportedMediaType = (parsedSpecOperation: ParsedSpecOperation) =>
    parsedSpecOperation.consumes.value.length > 0 && !isTypesOfJson(parsedSpecOperation.consumes.value);

const isBadRequest = (parsedMockInteraction: ParsedMockInteraction) =>
    parsedMockInteraction.responseStatus.value >= 400;

const shouldSkipValidation = (parsedMockInteraction: ParsedMockInteraction, parsedSpecOperation: ParsedSpecOperation) =>
    isOptionalRequestBodyMissing(parsedMockInteraction, parsedSpecOperation) ||
    specAndMockHaveNoBody(parsedMockInteraction, parsedSpecOperation) ||
    isUnsupportedMediaType(parsedSpecOperation) ||
    isBadRequest(parsedMockInteraction);

export const validateParsedMockRequestBody = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => {
    if (shouldSkipValidation(parsedMockInteraction, parsedSpecOperation)) {
        return [];
    }

    const parsedSpecRequestBody = parsedSpecOperation.requestBodyParameter as ParsedSpecBody;
    const expectedMediaType = parsedMockInteraction.requestHeaders['content-type']?.value;
    const schemaForMediaType = parsedSpecRequestBody?.schemaByContentType(expectedMediaType);

    if (!schemaForMediaType) {
        return [
            result.build({
                code: 'request.body.unknown',
                message: 'No matching schema found for request body',
                mockSegment: parsedMockInteraction.requestBody,
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation,
            }),
        ];
    }

    const { schema, mediaType } = schemaForMediaType;
    const transformedSchema = transformSchema(schema);

    let transformedBody = parsedMockInteraction.requestBody.value;
    if (mediaType?.startsWith("application/x-www-form-urlencoded")) {
      transformedBody = querystring.parse(transformedBody);
    }

    const validationErrors = validateJson(transformedSchema, transformedBody);

    return _.map(validationErrors, (error) =>
        result.build({
            code: 'request.body.incompatible',
            message: `Request body is incompatible with the request body schema in the spec file: ${error.message}`,
            mockSegment: parsedMockInteraction.requestBody.parentInteraction.getRequestBodyPath(
                error.instancePath.replace(/\//g, '.')
            ),
            source: 'spec-mock-validation',
            specSegment: parsedSpecRequestBody.getFromSchema(
                error.schemaPath.replace(/\//g, '.').substring(2),
                transformedSchema,
                mediaType
            ),
        })
    );
};
