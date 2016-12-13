import * as Ajv from 'ajv';
import * as _ from 'lodash';
import result from '../result';
import {JsonSchema, ParsedMockInteraction, ParsedSpecResponse} from '../types';

const validateJson = (jsonSchema: JsonSchema, json: any) => {
    const ajv = new Ajv({
        allErrors: true,
        verbose: true
    });

    ajv.validate(jsonSchema, json);

    return ajv.errors;
};

export default (pactInteraction: ParsedMockInteraction, swaggerResponse: ParsedSpecResponse) => {
    if (!pactInteraction.responseBody.value) {
        return [];
    }

    if (!swaggerResponse.schema) {
        return [
            result.error({
                message: 'No schema found for response body',
                pactSegment: pactInteraction.responseBody,
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerResponse
            })
        ];
    }

    const validationErrors = validateJson(swaggerResponse.schema, pactInteraction.responseBody.value);

    return _.map(validationErrors, (error) => {
        const message = error.keyword === 'additionalProperties'
            ? `${error.message} - ${(error.params as Ajv.AdditionalPropertiesParams).additionalProperty}`
            : error.message;

        return result.error({
            message: `Response body is incompatible with the response body schema in the swagger file: ${message}`,
            pactSegment: pactInteraction.getResponseBodyPath(error.dataPath),
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerResponse.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
        });
    });
};
