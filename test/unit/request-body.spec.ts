import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {swaggerMockValidatorLoader} from './support/swagger-mock-validator-loader';
import {swagger2Builder} from './support/swagger2-builder';
import {definitionsBuilder, DefinitionsBuilder} from './support/swagger2-builder/definitions-builder';
import {operationBuilder} from './support/swagger2-builder/operation-builder';
import {ParameterBuilder} from './support/swagger2-builder/parameter-builder';
import {bodyParameterBuilder} from './support/swagger2-builder/parameter-builder/body-parameter-builder';
import {pathBuilder} from './support/swagger2-builder/path-builder';
import {schemaBuilder} from './support/swagger2-builder/schema-builder';
import {responseBuilder} from './support/swagger2-builder/response-builder';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('request body', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with spec file "spec.json"';

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist');

    const validateRequestBody = (pactRequestBody?: any,
                                 swaggerBodyParameter?: ParameterBuilder,
                                 swaggerDefinitions?: DefinitionsBuilder) => {
        const interactionWithRequestBodyBuilder = pactRequestBody !== undefined
            ? defaultInteractionBuilder.withRequestBody(pactRequestBody)
            : defaultInteractionBuilder;

        const pactFile = pactBuilder.withInteraction(interactionWithRequestBodyBuilder).build();

        const operation = swaggerBodyParameter
            ? operationBuilder.withParameter(swaggerBodyParameter)
            : operationBuilder;

        let swaggerWithOperationBuilder = swagger2Builder
            .withPath('/does/exist', pathBuilder.withGetOperation(operation));

        if (swaggerDefinitions) {
            swaggerWithOperationBuilder = swaggerWithOperationBuilder.withDefinitions(swaggerDefinitions);
        }

        return swaggerMockValidatorLoader.invoke(swaggerWithOperationBuilder.build(), pactFile);
    };

    it('should pass for failure cases, ignoring body', async () => {
        const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder.withResponseStatus(400)).build();

        const swaggerFile = swagger2Builder
            .withPath(
                '/does/exist',
                pathBuilder.withGetOperation(
                    operationBuilder
                        .withResponse(400, responseBuilder)
                        .withParameter(
                            bodyParameterBuilder.withRequiredSchema(
                                schemaBuilder
                                    .withTypeObject()
                                    .withRequiredProperty('id', schemaBuilder.withTypeNumber())
                            )
                        )
                )
            )
            .build();

        const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should pass when a pact request body is compatible with the swagger schema', async () => {
        const pactRequestBody = {id: 1};
        const swaggerBodyParameter = bodyParameterBuilder.withRequiredSchema(schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber())
        );

        const result = await validateRequestBody(pactRequestBody, swaggerBodyParameter);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should return the error when a pact request body is not compatible with the swagger schema', async () => {
        const pactRequestBody = {id: 'not-a-number'};
        const swaggerBodyParameter = bodyParameterBuilder.withRequiredSchema(schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber())
        );

        const result = await validateRequestBody(pactRequestBody, swaggerBodyParameter);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.body.incompatible',
            message: 'Request body is incompatible with the request body schema in the spec file: ' +
                'should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.body.id',
                mockFile: 'pact.json',
                value: 'not-a-number'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0].schema.properties.id.type',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: 'number'
            },
            type: 'error'
        }]);
    });

    it('should return the error when pact request body is not compatible with the schema reference', async () => {
        const pactRequestBody = {id: 'not-a-number'};
        const swaggerBodyParameter = bodyParameterBuilder.withRequiredSchemaReference('#/definitions/Request');
        const definitions = definitionsBuilder.withDefinition('Request', schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber())
        );

        const result = await validateRequestBody(pactRequestBody, swaggerBodyParameter, definitions);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.body.incompatible',
            message: 'Request body is incompatible with the request body schema in the spec file: should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.body.id',
                mockFile: 'pact.json',
                value: 'not-a-number'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0].schema.properties.id.type',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: 'number'
            },
            type: 'error'
        }]);
    });

    it('should return the error when request body not compatible with circular schema reference', async () => {
        const pactRequestBody = {
            child: {id: 'not-a-number'},
            id: 1
        };
        const swaggerBodyParameter = bodyParameterBuilder.withRequiredSchemaReference('#/definitions/Request');
        const definitions = definitionsBuilder.withDefinition('Request', schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber())
            .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Request'))
        );

        const result = await validateRequestBody(pactRequestBody, swaggerBodyParameter, definitions);
        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.body.incompatible',
            message: 'Request body is incompatible with the request body schema in the spec file: should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.body.child.id',
                mockFile: 'pact.json',
                value: 'not-a-number'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0].schema.properties.id.type',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: undefined
            },
            type: 'error'
        }]);
    });

    it('should return the error when a pact request body has multiple invalid properties', async () => {
        const pactRequestBody = {
            value1: '1',
            value2: '2'
        };
        const swaggerBodyParameter = bodyParameterBuilder.withRequiredSchema(schemaBuilder
            .withTypeObject()
            .withRequiredProperty('value1', schemaBuilder.withTypeNumber())
            .withRequiredProperty('value2', schemaBuilder.withTypeNumber())
        );

        const result = await validateRequestBody(pactRequestBody, swaggerBodyParameter);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.body.incompatible',
            message: 'Request body is incompatible with the request body schema in the spec file: ' +
                'should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.body.value1',
                mockFile: 'pact.json',
                value: '1'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0].schema.properties.value1.type',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: 'number'
            },
            type: 'error'
        }, {
            code: 'request.body.incompatible',
            message: 'Request body is incompatible with the request body schema in the spec file: ' +
                'should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.body.value2',
                mockFile: 'pact.json',
                value: '2'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0].schema.properties.value2.type',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: 'number'
            },
            type: 'error'
        }]);
    });

    it('should return a warning when a pact request body is passed when there is no schema', async () => {
        const pactRequestBody = {id: 1};

        const result = await validateRequestBody(pactRequestBody);

        expect(result).toContainNoErrors();
        expect(result).toContainWarnings([{
            code: 'request.body.unknown',
            message: 'No schema found for request body',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.body',
                mockFile: 'pact.json',
                value: {id: 1}
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: operationBuilder.build()
            },
            type: 'warning'
        }]);
    });

    it('should return the error when no pact request body and a schema with required fields', async () => {
        const swaggerBodyParameter = bodyParameterBuilder.withRequiredSchema(schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber())
        );

        const result = await validateRequestBody(undefined, swaggerBodyParameter);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.body.incompatible',
            message: 'Request body is incompatible with the request body schema in the spec file: ' +
                'should be object',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.body',
                mockFile: 'pact.json',
                value: undefined
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0].schema.type',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: 'object'
            },
            type: 'error'
        }]);
    });

    it('should pass when there is no pact request body and an optional schema', async () => {
        const swaggerBodyParameter = bodyParameterBuilder.withOptionalSchema(schemaBuilder
            .withTypeObject()
            .withOptionalProperty('id', schemaBuilder.withTypeNumber())
        );

        const result = await validateRequestBody(undefined, swaggerBodyParameter);

        expect(result).toContainNoWarningsOrErrors();
    });

    it('should return the error when the pact request body is a string when an object is expected', async () => {
        const pactRequestBody = 'a-string';

        const swaggerBodyParameter = bodyParameterBuilder.withOptionalSchema(
            schemaBuilder.withTypeObject()
        );

        const result = await validateRequestBody(pactRequestBody, swaggerBodyParameter);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.body.incompatible',
            message: 'Request body is incompatible with the request body schema in the spec file: ' +
                'should be object',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.body',
                mockFile: 'pact.json',
                value: 'a-string'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0].schema.type',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: 'object'
            },
            type: 'error'
        }]);
    });

    it('should return error when pact request body has additional properties when none are allowed', async () => {
        const pactRequestBody = {a: 1};

        const swaggerBodyParameter = bodyParameterBuilder.withRequiredSchema(schemaBuilder
            .withTypeObject()
            .withAdditionalPropertiesBoolean(false)
        );

        const result = await validateRequestBody(pactRequestBody, swaggerBodyParameter);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.body.incompatible',
            message: 'Request body is incompatible with the request body schema in the spec file: ' +
                'should NOT have additional properties',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.body',
                mockFile: 'pact.json',
                value: {a: 1}
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0].schema.additionalProperties',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: false
            },
            type: 'error'
        }]);
    });

    it('should return error when pact request body has additional properties not matching schema', async () => {
        const pactRequestBody = {a: '1'};

        const swaggerBodyParameter = bodyParameterBuilder.withRequiredSchema(schemaBuilder
            .withTypeObject()
            .withAdditionalPropertiesSchema(schemaBuilder.withTypeNumber())
        );

        const result = await validateRequestBody(pactRequestBody, swaggerBodyParameter);

        expect(result.failureReason).toEqual(expectedFailedValidationError);
        expect(result).toContainErrors([{
            code: 'request.body.incompatible',
            message: 'Request body is incompatible with the request body schema in the spec file: should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.body[\'a\']',
                mockFile: 'pact.json',
                value: '1'
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0].schema.additionalProperties.type',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: 'number'
            },
            type: 'error'
        }]);
    });

    it('should return the error when pact request body is a JSON null value and not matching the schema', async () => {
        const pactRequestBody = null;

        const swaggerBodyParameter = bodyParameterBuilder.withOptionalSchema(schemaBuilder.withTypeNumber());

        const result = await validateRequestBody(pactRequestBody, swaggerBodyParameter);
        expect(result.failureReason).toEqual(expectedFailedValidationError);

        expect(result).toContainErrors([{
            code: 'request.body.incompatible',
            message: 'Request body is incompatible with the request body schema in the spec file: should be number',
            mockDetails: {
                interactionDescription: 'interaction description',
                interactionState: '[none]',
                location: '[root].interactions[0].request.body',
                mockFile: 'pact.json',
                value: null
            },
            source: 'spec-mock-validation',
            specDetails: {
                location: '[root].paths./does/exist.get.parameters[0].schema.type',
                pathMethod: 'get',
                pathName: '/does/exist',
                specFile: 'spec.json',
                value: 'number'
            },
            type: 'error'
        }]);
    });
});
