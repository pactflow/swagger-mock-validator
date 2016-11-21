'use strict';

const customJasmineMatchers = require('./support/custom-jasmine-matchers');
const expectToReject = require('jasmine-promise-tools').expectToReject;
const pactBuilder = require('./support/pact-builder');
const swaggerBuilder = require('./support/swagger-builder');
const invokeSwaggerPactValidator = require('./support/swagger-pact-validator-loader').invoke;
const willResolve = require('jasmine-promise-tools').willResolve;

describe('swagger-pact-validator request body', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

    beforeEach(() => {
        jasmine.addMatchers(customJasmineMatchers);
    });

    const defaultInteractionBuilder = pactBuilder.interaction
        .withDescription('interaction description')
        .withRequestPath('/does/exist');

    const validateRequestBody = (requestBody, bodyParameter) => {
        const interactionBuilder = requestBody
            ? defaultInteractionBuilder.withRequestBody(requestBody)
            : defaultInteractionBuilder;

        const pactFile = pactBuilder.withInteraction(interactionBuilder).build();

        const operationBuilder = bodyParameter
            ? swaggerBuilder.operation.withParameter(bodyParameter)
            : swaggerBuilder.operation;

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', swaggerBuilder.path.withGetOperation(operationBuilder))
            .build();

        return invokeSwaggerPactValidator(swaggerFile, pactFile);
    };

    it('should pass when a pact calls a method that is defined in the swagger', willResolve(() => {
        const requestBody = {id: 1};
        const bodyParameter = swaggerBuilder.parameter.withRequiredSchemaInBody(swaggerBuilder.schema
            .withTypeObject()
            .withRequiredProperty('id', swaggerBuilder.schema.withTypeNumber())
        );

        return validateRequestBody(requestBody, bodyParameter).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return the error when a pact request body is not compatible with the swagger schema', willResolve(() => {
        const requestBody = {id: 'not-a-number'};
        const bodyParameter = swaggerBuilder.parameter.withRequiredSchemaInBody(swaggerBuilder.schema
            .withTypeObject()
            .withRequiredProperty('id', swaggerBuilder.schema.withTypeNumber())
        );

        const result = validateRequestBody(requestBody, bodyParameter);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Request body is incompatible with the request body schema in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body.id',
                    value: 'not-a-number'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when a pact request body has multiple invalid properties', willResolve(() => {
        const requestBody = {
            value1: '1',
            value2: '2'
        };
        const bodyParameter = swaggerBuilder.parameter.withRequiredSchemaInBody(swaggerBuilder.schema
            .withTypeObject()
            .withRequiredProperty('value1', swaggerBuilder.schema.withTypeNumber())
            .withRequiredProperty('value2', swaggerBuilder.schema.withTypeNumber())
        );

        const result = validateRequestBody(requestBody, bodyParameter);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Request body is incompatible with the request body schema in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body.value1',
                    value: '1'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.properties.value1.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
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
                    value: '2'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.properties.value2.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return a warning when a pact request body is passed when there is no schema', willResolve(() => {
        const requestBody = {id: 1};

        return validateRequestBody(requestBody, null).then((result) => {
            expect(result).toContainWarnings([{
                message: 'No schema found for request body',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body',
                    value: {id: 1}
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: swaggerBuilder.operation.build()
                },
                type: 'warning'
            }]);
        });
    }));

    it('should return the error when no pact request body and a schema with required fields', willResolve(() => {
        const bodyParameter = swaggerBuilder.parameter.withRequiredSchemaInBody(swaggerBuilder.schema
            .withTypeObject()
            .withRequiredProperty('id', swaggerBuilder.schema.withTypeNumber())
        );

        const result = validateRequestBody(null, bodyParameter);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Request body is incompatible with the request body schema in the swagger file: should be object',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body',
                    value: undefined
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: 'object'
                },
                type: 'error'
            }]);
        });
    }));

    it('should pass when there is no pact request body and an optional schema', willResolve(() => {
        const bodyParameter = swaggerBuilder.parameter.withOptionalSchemaInBody(swaggerBuilder.schema
            .withTypeObject()
            .withOptionalProperty('id', swaggerBuilder.schema.withTypeNumber())
        );

        return validateRequestBody(null, bodyParameter).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return the error when the pact request body is a string when an object is expected', willResolve(() => {
        const requestBody = 'a-string';

        const bodyParameter = swaggerBuilder.parameter.withOptionalSchemaInBody(swaggerBuilder.schema.withTypeObject());

        const result = validateRequestBody(requestBody, bodyParameter);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Request body is incompatible with the request body schema in the swagger file: should be object',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.body',
                    value: 'a-string'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.parameters[0].schema.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: 'object'
                },
                type: 'error'
            }]);
        });
    }));
});
