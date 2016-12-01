'use strict';

const customJasmineMatchers = require('./support/custom-jasmine-matchers');
const expectToReject = require('jasmine-promise-tools').expectToReject;
const pactBuilder = require('./support/pact-builder');
const swaggerBuilder = require('./support/swagger-builder');
const invokeSwaggerPactValidator = require('./support/swagger-pact-validator-loader').invoke;
const willResolve = require('jasmine-promise-tools').willResolve;

describe('swagger-pact-validator response body', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

    beforeEach(() => {
        jasmine.addMatchers(customJasmineMatchers);
    });

    const validateResponseBody = (pactResponseBody, swaggerBodySchema) => {
        const pactFile = pactBuilder
            .withInteraction(pactBuilder.interaction
                .withDescription('interaction description')
                .withRequestPath('/does/exist')
                .withResponseBody(pactResponseBody)
            )
            .build();

        const swaggerResponseBuilder = swaggerBodySchema
            ? swaggerBuilder.response.withSchema(swaggerBodySchema)
            : swaggerBuilder.response;

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', swaggerBuilder.path
                .withGetOperation(swaggerBuilder.operation.withResponse(200, swaggerResponseBuilder))
            )
            .build();

        return invokeSwaggerPactValidator(swaggerFile, pactFile);
    };

    it('should pass when a pact calls a method that is defined in the swagger', willResolve(() => {
        const pactResponseBody = {id: 1};

        const swaggerBodySchema = swaggerBuilder.schema
            .withTypeObject()
            .withRequiredProperty('id', swaggerBuilder.schema.withTypeNumber());

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return the error when a pact response body is not compatible with the schema', willResolve(() => {
        const pactResponseBody = {id: 'not-a-number'};

        const swaggerBodySchema = swaggerBuilder.schema
            .withTypeObject()
            .withRequiredProperty('id', swaggerBuilder.schema.withTypeNumber());

        const result = validateResponseBody(pactResponseBody, swaggerBodySchema);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Response body is incompatible with the response body schema in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body.id',
                    value: 'not-a-number'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when a pact resposne body has invalid properties within an array', willResolve(() => {
        const pactResponseBody = [{
            customer: {
                first: 'Bob',
                last: 1
            }
        }];

        const swaggerBodySchema = swaggerBuilder.schema
            .withTypeArray(swaggerBuilder.schema
                .withTypeObject()
                .withRequiredProperty('customer', swaggerBuilder.schema
                    .withTypeObject()
                    .withRequiredProperty('first', swaggerBuilder.schema.withTypeString())
                    .withRequiredProperty('last', swaggerBuilder.schema.withTypeString())
                )
            );

        const result = validateResponseBody(pactResponseBody, swaggerBodySchema);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Response body is incompatible with the response body schema in the swagger file: should be string',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body[0].customer.last',
                    value: 1
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200' +
                        '.schema.items.properties.customer.properties.last.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: 'string'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when a pact resposne body has multiple invalid properties', willResolve(() => {
        const pactResponseBody = {
            value1: '1',
            value2: '2'
        };
        const swaggerBodySchema = swaggerBuilder.schema
            .withTypeObject()
            .withRequiredProperty('value1', swaggerBuilder.schema.withTypeNumber())
            .withRequiredProperty('value2', swaggerBuilder.schema.withTypeNumber());

        const result = validateResponseBody(pactResponseBody, swaggerBodySchema);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Response body is incompatible with the response body schema in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body.value1',
                    value: '1'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.value1.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: 'number'
                },
                type: 'error'
            }, {
                message:
                    'Response body is incompatible with the response body schema in the swagger file: should be number',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body.value2',
                    value: '2'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.value2.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when a pact response body is passed when there is no schema', willResolve(() => {
        const pactResponseBody = {id: 1};

        const result = validateResponseBody(pactResponseBody, null);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message: 'No schema found for response body',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body',
                    value: {id: 1}
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: {description: 'default-response'}
                },
                type: 'error'
            }]);
        });
    }));

    it('should pass when no pact response body and a schema ', willResolve(() => {
        const swaggerBodySchema = swaggerBuilder.schema
            .withTypeObject()
            .withRequiredProperty('id', swaggerBuilder.schema.withTypeNumber());

        return validateResponseBody(null, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should pass when a pact response body is missing a required property on the schema', willResolve(() => {
        const pactResposneBody = {property1: 'abc'};
        const swaggerBodySchema = swaggerBuilder.schema
            .withTypeObject()
            .withRequiredProperty('property1', swaggerBuilder.schema.withTypeString())
            .withRequiredProperty('property2', swaggerBuilder.schema.withTypeString());

        return validateResponseBody(pactResposneBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should pass when a pact response body is missing a nested required property on the schema', willResolve(() => {
        const pactResposneBody = {customer: {first: 'Bob'}};
        const swaggerBodySchema = swaggerBuilder.schema
            .withTypeObject()
            .withRequiredProperty('customer', swaggerBuilder.schema
                .withTypeObject()
                .withRequiredProperty('first', swaggerBuilder.schema.withTypeString())
                .withRequiredProperty('last', swaggerBuilder.schema.withTypeString())
            );

        return validateResponseBody(pactResposneBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should pass when a pact resposne body is missing a required property within an array', willResolve(() => {
        const pactResposneBody = [{customer: {first: 'Bob'}}];
        const swaggerBodySchema = swaggerBuilder.schema
            .withTypeArray(swaggerBuilder.schema
                .withTypeObject()
                .withRequiredProperty('customer', swaggerBuilder.schema
                    .withTypeObject()
                    .withRequiredProperty('first', swaggerBuilder.schema.withTypeString())
                    .withRequiredProperty('last', swaggerBuilder.schema.withTypeString())
                )
            );

        return validateResponseBody(pactResposneBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return the error when a pact response body has a property not defined in the schema', willResolve(() => {
        const pactResponseBody = {firstName: 'Bob'};

        const swaggerBodySchema = swaggerBuilder.schema
            .withTypeObject()
            .withOptionalProperty('first', swaggerBuilder.schema.withTypeString())
            .withOptionalProperty('last', swaggerBuilder.schema.withTypeString());

        const result = validateResponseBody(pactResponseBody, swaggerBodySchema);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should NOT have additional properties - firstName',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body',
                    value: {firstName: 'Bob'}
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.additionalProperties',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: undefined
                },
                type: 'error'
            }]);
        });
    }));

    it('should return error when pact response body has property not defined in schema of array', willResolve(() => {
        const pactResponseBody = [{customer: {firstName: 'Bob'}}];

        const swaggerBodySchema = swaggerBuilder.schema
            .withTypeArray(swaggerBuilder.schema
                .withTypeObject()
                .withOptionalProperty('customer', swaggerBuilder.schema
                    .withTypeObject()
                    .withOptionalProperty('first', swaggerBuilder.schema.withTypeString())
                )
            );

        const result = validateResponseBody(pactResponseBody, swaggerBodySchema);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message:
                    'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should NOT have additional properties - firstName',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body[0].customer',
                    value: {firstName: 'Bob'}
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200' +
                        '.schema.items.properties.customer.additionalProperties',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: undefined
                },
                type: 'error'
            }]);
        });
    }));
});
