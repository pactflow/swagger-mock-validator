import * as _ from 'lodash';
import {ParsedMockInteraction, ParsedMockValue} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {ParsedSpecBody, ParsedSpecOperation} from '../spec-parser/parsed-spec';
import {isMediaTypeSupported} from './content-negotiation';
import {validateJson} from './validate-json';

const validateRequestBodyAgainstSchema = (
    parsedMockRequestBody: ParsedMockValue<any>,
    parsedSpecRequestBody: ParsedSpecBody
) => {
    const validationErrors = validateJson(parsedSpecRequestBody.schema, parsedMockRequestBody.value);

    return _.map(validationErrors, (error) => result.build({
        code: 'request.body.incompatible',
        message:
            `Request body is incompatible with the request body schema in the spec file: ${error.message}`,
        mockSegment: parsedMockRequestBody.parentInteraction.getRequestBodyPath(error.dataPath),
        source: 'spec-mock-validation',
        specSegment: parsedSpecRequestBody.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
    }));
};

const isOptionalRequestBodyMissing = (
    parsedMockInteraction: ParsedMockInteraction, parsedSpecOperation: ParsedSpecOperation
) => parsedMockInteraction.requestBody.value === undefined &&
    !(parsedSpecOperation.requestBodyParameter && parsedSpecOperation.requestBodyParameter.required);

const specAndMockHaveNoBody = (parsedMockInteraction: ParsedMockInteraction,
                               parsedSpecOperation: ParsedSpecOperation) =>
    !parsedSpecOperation.requestBodyParameter && !parsedMockInteraction.requestBody.value;

const isNotSupportedMediaType = (parsedSpecOperation: ParsedSpecOperation) =>
    parsedSpecOperation.consumes.value.length > 0 &&
    !isMediaTypeSupported('application/json', parsedSpecOperation.consumes.value);

const shouldSkipValidation = (parsedMockInteraction: ParsedMockInteraction,
                              parsedSpecOperation: ParsedSpecOperation) =>
    isNotSupportedMediaType(parsedSpecOperation) ||
    specAndMockHaveNoBody(parsedMockInteraction, parsedSpecOperation) ||
    isOptionalRequestBodyMissing(parsedMockInteraction, parsedSpecOperation);

export const validateParsedMockRequestBody = (parsedMockInteraction: ParsedMockInteraction,
                                              parsedSpecOperation: ParsedSpecOperation) => {
    if (shouldSkipValidation(parsedMockInteraction, parsedSpecOperation)) {
        return [];
    }

    if (parsedSpecOperation.requestBodyParameter) {
        return validateRequestBodyAgainstSchema(
            parsedMockInteraction.requestBody,
            parsedSpecOperation.requestBodyParameter
        );
    }

    return [
        result.build({
            code: 'request.body.unknown',
            message: 'No schema found for request body',
            mockSegment: parsedMockInteraction.requestBody,
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })
    ];
};
