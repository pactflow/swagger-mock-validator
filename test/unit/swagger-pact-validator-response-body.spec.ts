import {expectToReject, willResolve} from 'jasmine-promise-tools';
import customJasmineMatchers from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    pathBuilder,
    responseBuilder,
    schemaBuilder,
    SchemaBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

describe('swagger-pact-validator response body', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

    beforeEach(() => {
        jasmine.addMatchers(customJasmineMatchers);
    });

    const validateResponseBody = (pactResponseBody: any, swaggerBodySchema: SchemaBuilder) => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder
                .withDescription('interaction description')
                .withRequestPath('/does/exist')
                .withResponseBody(pactResponseBody)
            )
            .build();

        const swaggerResponseBuilder = swaggerBodySchema
            ? responseBuilder.withSchema(swaggerBodySchema)
            : responseBuilder;

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withResponse(200, swaggerResponseBuilder))
            )
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);
    };

    it('should pass when a pact calls a method that is defined in the swagger', willResolve(() => {
        const pactResponseBody = {id: 1};

        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber());

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should return the error when a pact response body is not compatible with the schema', willResolve(() => {
        const pactResponseBody = {id: 'not-a-number'};

        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber());

        const result = validateResponseBody(pactResponseBody, swaggerBodySchema);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
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

        const swaggerBodySchema = schemaBuilder
            .withTypeArray(schemaBuilder
                .withTypeObject()
                .withRequiredProperty('customer', schemaBuilder
                    .withTypeObject()
                    .withRequiredProperty('first', schemaBuilder.withTypeString())
                    .withRequiredProperty('last', schemaBuilder.withTypeString())
                )
            );

        const result = validateResponseBody(pactResponseBody, swaggerBodySchema);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
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
        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('value1', schemaBuilder.withTypeNumber())
            .withRequiredProperty('value2', schemaBuilder.withTypeNumber());

        const result = validateResponseBody(pactResponseBody, swaggerBodySchema);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
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
            (expect(error.details) as any).toContainErrors([{
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
        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber());

        return validateResponseBody(null, swaggerBodySchema).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should pass when a pact response body is missing a required property on the schema', willResolve(() => {
        const pactResponseBody = {property1: 'abc'};
        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('property1', schemaBuilder.withTypeString())
            .withRequiredProperty('property2', schemaBuilder.withTypeString());

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should pass when a pact response body is missing a nested required property on the schema', willResolve(() => {
        const pactResposneBody = {customer: {first: 'Bob'}};
        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('customer', schemaBuilder
                .withTypeObject()
                .withRequiredProperty('first', schemaBuilder.withTypeString())
                .withRequiredProperty('last', schemaBuilder.withTypeString())
            );

        return validateResponseBody(pactResposneBody, swaggerBodySchema).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should pass when a pact resposne body is missing a required property within an array', willResolve(() => {
        const pactResponseBody = [{customer: {first: 'Bob'}}];
        const swaggerBodySchema = schemaBuilder
            .withTypeArray(schemaBuilder
                .withTypeObject()
                .withRequiredProperty('customer', schemaBuilder
                    .withTypeObject()
                    .withRequiredProperty('first', schemaBuilder.withTypeString())
                    .withRequiredProperty('last', schemaBuilder.withTypeString())
                )
            );

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should return the error when a pact response body has a property not defined in the schema', willResolve(() => {
        const pactResponseBody = {firstName: 'Bob'};

        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withOptionalProperty('first', schemaBuilder.withTypeString())
            .withOptionalProperty('last', schemaBuilder.withTypeString());

        const result = validateResponseBody(pactResponseBody, swaggerBodySchema);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
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

        const swaggerBodySchema = schemaBuilder
            .withTypeArray(schemaBuilder
                .withTypeObject()
                .withOptionalProperty('customer', schemaBuilder
                    .withTypeObject()
                    .withOptionalProperty('first', schemaBuilder.withTypeString())
                )
            );

        const result = validateResponseBody(pactResponseBody, swaggerBodySchema);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
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

    it('should pass when a pact resposne body matches a default schema', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder
                .withDescription('interaction description')
                .withRequestPath('/does/exist')
                .withResponseStatus(202)
                .withResponseBody({value: 1})
            )
            .build();

        const operation = operationBuilder
            .withDefaultResponse(responseBuilder
                .withSchema(schemaBuilder
                    .withTypeObject()
                    .withRequiredProperty('value', schemaBuilder.withTypeNumber())
                )
            );

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operation))
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
            (expect(result) as any).toContainWarnings([{
                message: 'Response status code matched default response in swagger file: 202',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.status',
                    value: 202
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    value: operation.build().responses
                },
                type: 'warning'
            }]);
        });
    }));
});
