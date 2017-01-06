import {expectToReject, willResolve} from 'jasmine-promise-tools';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    parameterBuilder,
    ParameterBuilder,
    pathBuilder,
    schemaBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

declare function expect(actual: any): CustomMatchers;

describe('swagger-pact-validator request body', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    const defaultInteractionBuilder = interactionBuilder
        .withDescription('interaction description')
        .withRequestPath('/does/exist');

    const validateRequestBody = (pactRequestBody?: any, swaggerBodyParameter?: ParameterBuilder) => {
        const interactionBuilder = pactRequestBody
            ? defaultInteractionBuilder.withRequestBody(pactRequestBody)
            : defaultInteractionBuilder;

        const pactFile = pactBuilder.withInteraction(interactionBuilder).build();

        const operation = swaggerBodyParameter
            ? operationBuilder.withParameter(swaggerBodyParameter)
            : operationBuilder;

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operation))
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when a pact request body is compatible with the swagger schema', willResolve(() => {
        const pactRequestBody = {id: 1};
        const swaggerBodyParameter = parameterBuilder.withRequiredSchemaInBody(schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber())
        );

        return validateRequestBody(pactRequestBody, swaggerBodyParameter).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return the error when a pact request body is not compatible with the swagger schema', willResolve(() => {
        const pactRequestBody = {id: 'not-a-number'};
        const swaggerBodyParameter = parameterBuilder.withRequiredSchemaInBody(schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber())
        );

        const result = validateRequestBody(pactRequestBody, swaggerBodyParameter);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Request body is incompatible with the request body schema in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body.id',
                    pactFile: 'pact.json',
                    value: 'not-a-number'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when a pact request body has multiple invalid properties', willResolve(() => {
        const pactRequestBody = {
            value1: '1',
            value2: '2'
        };
        const swaggerBodyParameter = parameterBuilder.withRequiredSchemaInBody(schemaBuilder
            .withTypeObject()
            .withRequiredProperty('value1', schemaBuilder.withTypeNumber())
            .withRequiredProperty('value2', schemaBuilder.withTypeNumber())
        );

        const result = validateRequestBody(pactRequestBody, swaggerBodyParameter);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Request body is incompatible with the request body schema in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body.value1',
                    pactFile: 'pact.json',
                    value: '1'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.properties.value1.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: 'number'
                },
                type: 'error'
            }, {
                message:
                    'Request body is incompatible with the request body schema in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body.value2',
                    pactFile: 'pact.json',
                    value: '2'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.properties.value2.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return a warning when a pact request body is passed when there is no schema', willResolve(() => {
        const pactRequestBody = {id: 1};

        return validateRequestBody(pactRequestBody, null).then((result) => {
            expect(result).toContainWarnings([{
                message: 'No schema found for request body',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body',
                    pactFile: 'pact.json',
                    value: {id: 1}
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: operationBuilder.build()
                },
                type: 'warning'
            }]);
        });
    }));

    it('should return the error when no pact request body and a schema with required fields', willResolve(() => {
        const swaggerBodyParameter = parameterBuilder.withRequiredSchemaInBody(schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber())
        );

        const result = validateRequestBody(null, swaggerBodyParameter);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Request body is incompatible with the request body schema in the swagger file: should be object',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body',
                    pactFile: 'pact.json',
                    value: undefined
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: 'object'
                },
                type: 'error'
            }]);
        });
    }));

    it('should pass when there is no pact request body and an optional schema', willResolve(() => {
        const swaggerBodyParameter = parameterBuilder.withOptionalSchemaInBody(schemaBuilder
            .withTypeObject()
            .withOptionalProperty('id', schemaBuilder.withTypeNumber())
        );

        return validateRequestBody(null, swaggerBodyParameter).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return the error when the pact request body is a string when an object is expected', willResolve(() => {
        const pactRequestBody = 'a-string';

        const swaggerBodyParameter = parameterBuilder.withOptionalSchemaInBody(
            schemaBuilder.withTypeObject()
        );

        const result = validateRequestBody(pactRequestBody, swaggerBodyParameter);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Request body is incompatible with the request body schema in the swagger file: should be object',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body',
                    pactFile: 'pact.json',
                    value: 'a-string'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: 'object'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return error when pact request body has additional properties when none are allowed', willResolve(() => {
        const pactRequestBody = {a: 1};

        const swaggerBodyParameter = parameterBuilder.withRequiredSchemaInBody(schemaBuilder
            .withTypeObject()
            .withAdditionalPropertiesBoolean(false)
        );

        const result = validateRequestBody(pactRequestBody, swaggerBodyParameter);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Request body is incompatible with the request body schema in the swagger file: ' +
                    'should NOT have additional properties',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body',
                    pactFile: 'pact.json',
                    value: {a: 1}
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.additionalProperties',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: false
                },
                type: 'error'
            }]);
        });
    }));

    it('should return error when pact request body has additional properties not matching schema', willResolve(() => {
        const pactRequestBody = {a: '1'};

        const swaggerBodyParameter = parameterBuilder.withRequiredSchemaInBody(schemaBuilder
            .withTypeObject()
            .withAdditionalPropertiesSchema(schemaBuilder.withTypeNumber())
        );

        const result = validateRequestBody(pactRequestBody, swaggerBodyParameter);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                'Request body is incompatible with the request body schema in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body[\'a\']',
                    pactFile: 'pact.json',
                    value: '1'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.additionalProperties.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    swaggerFile: 'swagger.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    }));
});
