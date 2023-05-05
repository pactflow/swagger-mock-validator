import * as _ from 'lodash';
import {ParsedMockInteraction} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {ParsedSpecBody, ParsedSpecOperation} from '../spec-parser/parsed-spec';
import {isMediaTypeSupported} from './content-negotiation';
import {validateJson} from './validate-json';

const validateRequestBodyAgainstSchema = (
    parsedMockInteraction: ParsedMockInteraction,
    parsedSpecOperation: ParsedSpecOperation
) => {
    const parsedMockRequestBody = parsedMockInteraction.requestBody;
    const parsedSpecRequestBody = parsedSpecOperation.requestBodyParameter as ParsedSpecBody;

    // start with a default schema
    let schema = parsedSpecRequestBody.schema

    // switch schema based on content-type
    const contentType = parsedMockInteraction.requestHeaders['content-type']?.value;
    if (contentType && parsedSpecRequestBody.schemasByContentType && parsedSpecRequestBody.schemasByContentType[contentType]) {
      schema = parsedSpecRequestBody.schemasByContentType[contentType]
    }

    const validationErrors = validateJson(schema, parsedMockRequestBody.value);

    return _.map(validationErrors, (error) => result.build({
        code: 'request.body.incompatible',
        message:
            `Request body is incompatible with the request body schema in the spec file: ${error.message}`,
        mockSegment: parsedMockRequestBody.parentInteraction.getRequestBodyPath(error.dataPath),
        source: 'spec-mock-validation',
        specSegment: parsedSpecRequestBody.getFromSchema(
            error.schemaPath.replace(/\//g, '.').substring(2),
            contentType
        )
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
        // this is temporary code to identify passing validations that should've failed
        // tslint:disable:cyclomatic-complexity
        if (process.env.DEBUG_CONTENT_TYPE_ISSUE && isNotSupportedMediaType(parsedSpecOperation)) {
            const debugValidation = (validation: any) => {
                console.error(
                    JSON.stringify({
                        message: 'Passing validation that should\'ve failed due to unsupported media type',
                        pact_request: {
                          'content-type': parsedMockInteraction.requestHeaders['content-type']?.value
                        },
                        oas_consumes: {
                          'content-type': parsedSpecOperation.consumes.value
                        },
                        validation
                    })
                );
            };
            if (parsedSpecOperation.requestBodyParameter) {
                debugValidation(
                    validateRequestBodyAgainstSchema(
                        parsedMockInteraction,
                        parsedSpecOperation
                    )
                );
            } else {
                debugValidation([
                    result.build({
                        code: 'request.body.unknown',
                        message: 'No schema found for request body',
                        mockSegment: parsedMockInteraction.requestBody,
                        source: 'spec-mock-validation',
                        specSegment: parsedSpecOperation
                    })
                ]);
            }
        }
        // tslint:enable:cyclomatic-complexity

        return [];
    }

    if (parsedSpecOperation.requestBodyParameter) {
        return validateRequestBodyAgainstSchema(
            parsedMockInteraction,
            parsedSpecOperation
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
