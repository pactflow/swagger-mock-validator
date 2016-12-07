import * as Ajv from 'ajv';
import * as _ from 'lodash';
import result from '../result';
import {JsonSchema, ParsedMockInteraction, ParsedMockValue, ParsedSpecOperation, ParsedSpecParameter} from '../types';

const validateJson = (jsonSchema: JsonSchema, json: any) => {
    const ajv = new Ajv({
        allErrors: true,
        verbose: true
    });

    ajv.validate(jsonSchema, json);

    return ajv.errors;
};

const validateRequestBodyAgainstSchema = (
    pactRequestBody: ParsedMockValue<any>,
    requestBodyParameter: ParsedSpecParameter
) => {
    const validationErrors = validateJson(requestBodyParameter.schema, pactRequestBody.value);

    return _.map(validationErrors, (error) => result.error({
        message:
            `Request body is incompatible with the request body schema in the swagger file: ${error.message}`,
        pactSegment: pactRequestBody.parentInteraction.getRequestBodyPath(error.dataPath),
        source: 'swagger-pact-validation',
        swaggerSegment: requestBodyParameter.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
    }));
};

const isOptionalRequestBodyMissing = (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation) =>
    !pactInteraction.requestBody.value && !swaggerOperation.requestBodyParameter.required;

export default (pactInteraction: ParsedMockInteraction, swaggerOperation: ParsedSpecOperation) => {
    const pactRequestHasBody = Boolean(pactInteraction.requestBody.value);

    if (!swaggerOperation.requestBodyParameter) {
        if (pactRequestHasBody) {
            return [
                result.warning({
                    message: 'No schema found for request body',
                    pactSegment: pactInteraction.requestBody,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerOperation
                })
            ];
        }

        return [];
    }

    if (isOptionalRequestBodyMissing(pactInteraction, swaggerOperation)) {
        return [];
    }

    return validateRequestBodyAgainstSchema(pactInteraction.requestBody, swaggerOperation.requestBodyParameter);
};
