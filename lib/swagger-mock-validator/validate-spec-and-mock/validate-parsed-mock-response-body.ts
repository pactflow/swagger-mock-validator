import * as Ajv from 'ajv';
import * as _ from 'lodash';
import {traverseJsonSchema} from '../common/traverse-json-schema';
import {ParsedMockInteraction} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {ParsedSpecJsonSchema, ParsedSpecResponse} from '../spec-parser/parsed-spec';
import {isMediaTypeSupported} from './content-negotiation';
import {validateJson} from './validate-json';

const removeRequiredPropertiesFromSchema = (schema: ParsedSpecJsonSchema): ParsedSpecJsonSchema => {
    const modifiedSchema = _.cloneDeep(schema);

    traverseJsonSchema(modifiedSchema, (mutableSchema) => {
        delete mutableSchema.required;
    });

    return modifiedSchema;
};

const isMockInteractionWithoutResponseBody = (parsedMockInteraction: ParsedMockInteraction) =>
    !parsedMockInteraction.responseBody.value;

const isNotSupportedMediaType = (parsedSpecResponse: ParsedSpecResponse) =>
    parsedSpecResponse.produces.value.length > 0 &&
    !isMediaTypeSupported('application/json', parsedSpecResponse.produces.value);

const shouldSkipValidation = (parsedMockInteraction: ParsedMockInteraction, parsedSpecResponse: ParsedSpecResponse) =>
    isMockInteractionWithoutResponseBody(parsedMockInteraction) || isNotSupportedMediaType(parsedSpecResponse);

export const validateParsedMockResponseBody = (parsedMockInteraction: ParsedMockInteraction,
                                               parsedSpecResponse: ParsedSpecResponse) => {
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

    const responseBodyWithoutRequiredProperties = removeRequiredPropertiesFromSchema(parsedSpecResponse.schema);

    const validationErrors = validateJson(
        responseBodyWithoutRequiredProperties,
        parsedMockInteraction.responseBody.value
    );

    return _.map(validationErrors, (error) => {
        const message = error.keyword === 'additionalProperties'
            ? `${error.message} - ${(error.params as Ajv.AdditionalPropertiesParams).additionalProperty}`
            : error.message;

        return result.build({
            code: 'response.body.incompatible',
            message: `Response body is incompatible with the response body schema in the spec file: ${message}`,
            mockSegment: parsedMockInteraction.getResponseBodyPath(error.dataPath),
            source: 'spec-mock-validation',
            specSegment: parsedSpecResponse.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
        });
    });
};
