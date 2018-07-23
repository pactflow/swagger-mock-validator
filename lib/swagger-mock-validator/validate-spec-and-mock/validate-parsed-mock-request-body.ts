import * as _ from 'lodash';
import {result} from '../result';
import {ParsedMockInteraction, ParsedMockValue, ParsedSpecBody, ParsedSpecOperation} from '../types';
import {validateJson} from './validate-json';

const validateRequestBodyAgainstSchema = (
    parsedMockRequestBody: ParsedMockValue<any>,
    parsedSpecRequestBody: ParsedSpecBody
) => {
    const validationErrors = validateJson(parsedSpecRequestBody.schema, parsedMockRequestBody.value);

    return _.map(validationErrors, (error) => result.build({
        code: 'request.body.incompatible',
        message:
            `Request body is incompatible with the request body schema in the swagger file: ${error.message}`,
        mockSegment: parsedMockRequestBody.parentInteraction.getRequestBodyPath(error.dataPath),
        source: 'spec-mock-validation',
        specSegment: parsedSpecRequestBody.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
    }));
};

const isOptionalRequestBodyMissing = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => !parsedMockInteraction.requestBody.value && !(parsedSpecOperation.requestBodyParameter as ParsedSpecBody).required;

export const validateParsedMockRequestBody = (parsedMockInteraction: ParsedMockInteraction,
                                              parsedSpecOperation: ParsedSpecOperation) => {
    const parsedMockInteractionHasBody = Boolean(parsedMockInteraction.requestBody.value);

    if (!parsedSpecOperation.requestBodyParameter) {
        if (parsedMockInteractionHasBody) {
            return [
                result.build({
                    code: 'request.body.unknown',
                    message: 'No schema found for request body',
                    mockSegment: parsedMockInteraction.requestBody,
                    source: 'spec-mock-validation',
                    specSegment: parsedSpecOperation
                })
            ];
        }

        return [];
    }

    if (isOptionalRequestBodyMissing(parsedMockInteraction, parsedSpecOperation)) {
        return [];
    }

    return validateRequestBodyAgainstSchema(
        parsedMockInteraction.requestBody,
        parsedSpecOperation.requestBodyParameter
    );
};
