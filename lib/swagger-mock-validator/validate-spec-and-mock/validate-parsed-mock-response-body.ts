import * as Ajv from 'ajv';
import * as _ from 'lodash';
import {result} from '../result';
import {ParsedMockInteraction, ParsedSpecResponse} from '../types';
import {validateJson} from './validate-json';

export const validateParsedMockResponseBody = (parsedMockInteraction: ParsedMockInteraction,
                                               parsedSpecResponse: ParsedSpecResponse) => {
    if (!parsedMockInteraction.responseBody.value) {
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

    const validationErrors = validateJson(parsedSpecResponse.schema, parsedMockInteraction.responseBody.value);

    return _.map(validationErrors, (error) => {
        const message = error.keyword === 'additionalProperties'
            ? `${error.message} - ${(error.params as Ajv.AdditionalPropertiesParams).additionalProperty}`
            : error.message;

        return result.build({
            code: 'response.body.incompatible',
            message: `Response body is incompatible with the response body schema in the swagger file: ${message}`,
            mockSegment: parsedMockInteraction.getResponseBodyPath(error.dataPath),
            source: 'spec-mock-validation',
            specSegment: parsedSpecResponse.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
        });
    });
};
