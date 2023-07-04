import { customMatchers, CustomMatchers } from './support/custom-jasmine-matchers';
import { interactionBuilder, pactBuilder } from './support/pact-builder';
import { swaggerMockValidatorLoader } from './support/swagger-mock-validator-loader';
import { swagger2Builder } from './support/swagger2-builder';
import { definitionsBuilder, DefinitionsBuilder } from './support/swagger2-builder/definitions-builder';
import { operationBuilder } from './support/swagger2-builder/operation-builder';
import { pathBuilder } from './support/swagger2-builder/path-builder';
import { responseBuilder } from './support/swagger2-builder/response-builder';
import { schemaBuilder, SchemaBuilder } from './support/swagger2-builder/schema-builder';

declare function expect<T>(actual: T): CustomMatchers<T>;

[200, 401, 404].forEach((statusCode) => {
    describe(`response body with status ${statusCode}`, () => {
        const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with spec file "spec.json"';

        beforeEach(() => {
            jasmine.addMatchers(customMatchers);
        });

        const validateResponseBody = (
            pactResponseBody: any,
            swaggerBodySchema?: SchemaBuilder,
            swaggerDefinitions?: DefinitionsBuilder
        ) => {
            const pactFile = pactBuilder
                .withInteraction(
                    interactionBuilder
                        .withDescription('interaction description')
                        .withRequestPath('/does/exist')
                        .withResponseStatus(statusCode)
                        .withResponseBody(pactResponseBody)
                )
                .build();

            const swaggerResponseBuilder = swaggerBodySchema
                ? responseBuilder.withSchema(swaggerBodySchema)
                : responseBuilder;

            let swaggerWithBodySchemaBuilder = swagger2Builder.withPath(
                '/does/exist',
                pathBuilder.withGetOperation(operationBuilder.withResponse(statusCode, swaggerResponseBuilder))
            );

            if (swaggerDefinitions) {
                swaggerWithBodySchemaBuilder = swaggerWithBodySchemaBuilder.withDefinitions(swaggerDefinitions);
            }

            return swaggerMockValidatorLoader.invoke(swaggerWithBodySchemaBuilder.build(), pactFile);
        };

        it('should pass when a pact calls a method that is defined in the swagger', async () => {
            const pactResponseBody = { id: 1 };

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber());

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when a pact response body is not compatible with the schema', async () => {
            const pactResponseBody = { id: 'not-a-number' };

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber());

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([
                {
                    code: 'response.body.incompatible',
                    message:
                        'Response body is incompatible with the response body schema in the spec file: must be number',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[root].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: 'not-a-number',
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: `[root].paths./does/exist.get.responses.${statusCode}.schema.properties.id.type`,
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'spec.json',
                        value: 'number',
                    },
                    type: 'error',
                },
            ]);
        });

        it('should return the error when pact response body is not compatible with a schema reference', async () => {
            const pactResponseBody = { id: 'not-a-number' };

            const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');

            const definitions = definitionsBuilder.withDefinition(
                'Response',
                schemaBuilder.withTypeObject().withRequiredProperty('id', schemaBuilder.withTypeNumber())
            );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema, definitions);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([
                {
                    code: 'response.body.incompatible',
                    message:
                        'Response body is incompatible with the response body schema in the spec file: must be number',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[root].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: 'not-a-number',
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: `[root].paths./does/exist.get.responses.${statusCode}.schema.properties.id.type`,
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'spec.json',
                        value: 'number',
                    },
                    type: 'error',
                },
            ]);
        });

        it('should return error when response body is not compatible with a circular schema', async () => {
            const pactResponseBody = {
                child: { id: 'not-a-number' },
                id: 1,
            };

            const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');

            const definitions = definitionsBuilder.withDefinition(
                'Response',
                schemaBuilder
                    .withTypeObject()
                    .withRequiredProperty('id', schemaBuilder.withTypeNumber())
                    .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
            );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema, definitions);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([
                {
                    code: 'response.body.incompatible',
                    message:
                        'Response body is incompatible with the response body schema in the spec file: must be number',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[root].interactions[0].response.body.child.id',
                        mockFile: 'pact.json',
                        value: 'not-a-number',
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: `[root].paths./does/exist.get.responses.${statusCode}.schema.properties.id.type`,
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'spec.json',
                        value: undefined,
                    },
                    type: 'error',
                },
            ]);
        });

        it('should return error when response is not compatible with a self referencing schema array', async () => {
            const pactResponseBody = {
                children: [{ id: 'not-a-number' }],
                id: 1,
            };

            const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');

            const definitions = definitionsBuilder.withDefinition(
                'Response',
                schemaBuilder
                    .withTypeObject()
                    .withRequiredProperty('id', schemaBuilder.withTypeNumber())
                    .withOptionalProperty(
                        'children',
                        schemaBuilder.withTypeArray(schemaBuilder.withReference('#/definitions/Response'))
                    )
            );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema, definitions);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([
                {
                    code: 'response.body.incompatible',
                    message:
                        'Response body is incompatible with the response body schema in the spec file: must be number',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[root].interactions[0].response.body.children.0.id',
                        mockFile: 'pact.json',
                        value: 'not-a-number',
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: `[root].paths./does/exist.get.responses.${statusCode}.schema.properties.id.type`,
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'spec.json',
                        value: undefined,
                    },
                    type: 'error',
                },
            ]);
        });

        it('should return the error when a pact response body has invalid properties within an array', async () => {
            const pactResponseBody = [
                {
                    customer: {
                        first: 'Bob',
                        last: 1,
                    },
                },
            ];

            const swaggerBodySchema = schemaBuilder.withTypeArray(
                schemaBuilder
                    .withTypeObject()
                    .withRequiredProperty(
                        'customer',
                        schemaBuilder
                            .withTypeObject()
                            .withRequiredProperty('first', schemaBuilder.withTypeString())
                            .withRequiredProperty('last', schemaBuilder.withTypeString())
                    )
            );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([
                {
                    code: 'response.body.incompatible',
                    message:
                        'Response body is incompatible with the response body schema in the spec file: must be string',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[root].interactions[0].response.body.0.customer.last',
                        mockFile: 'pact.json',
                        value: 1,
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location:
                            `[root].paths./does/exist.get.responses.${statusCode}` +
                            '.schema.items.properties.customer.properties.last.type',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'spec.json',
                        value: 'string',
                    },
                    type: 'error',
                },
            ]);
        });

        it('should return the error when a pact response body has multiple invalid properties', async () => {
            const pactResponseBody = {
                value1: '1',
                value2: '2',
            };
            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('value1', schemaBuilder.withTypeNumber())
                .withRequiredProperty('value2', schemaBuilder.withTypeNumber());

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([
                {
                    code: 'response.body.incompatible',
                    message:
                        'Response body is incompatible with the response body schema in the spec file: must be number',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[root].interactions[0].response.body.value1',
                        mockFile: 'pact.json',
                        value: '1',
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: `[root].paths./does/exist.get.responses.${statusCode}.schema.properties.value1.type`,
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'spec.json',
                        value: 'number',
                    },
                    type: 'error',
                },
                {
                    code: 'response.body.incompatible',
                    message:
                        'Response body is incompatible with the response body schema in the spec file: must be number',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[root].interactions[0].response.body.value2',
                        mockFile: 'pact.json',
                        value: '2',
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: `[root].paths./does/exist.get.responses.${statusCode}.schema.properties.value2.type`,
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'spec.json',
                        value: 'number',
                    },
                    type: 'error',
                },
            ]);
        });

        it('should return the error when a pact response body is passed when there is no schema', async () => {
            const pactResponseBody = { id: 1 };

            const result = await validateResponseBody(pactResponseBody);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([
                {
                    code: 'response.body.unknown',
                    message: 'No matching schema found for response body',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[root].interactions[0].response.body',
                        mockFile: 'pact.json',
                        value: { id: 1 },
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: `[root].paths./does/exist.get.responses.${statusCode}`,
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'spec.json',
                        value: { description: 'default-response' },
                    },
                    type: 'error',
                },
            ]);
        });

        it('should pass when no pact response body is specified and swagger defines a response body schema', async () => {
            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber());

            const result = await validateResponseBody(null, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when a pact response body is missing a required property on the schema', async () => {
            const pactResponseBody = { property1: 'abc' };
            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('property1', schemaBuilder.withTypeString())
                .withRequiredProperty('property2', schemaBuilder.withTypeString());

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when a pact response body is missing a nested required property on the schema', async () => {
            const pactResponseBody = { customer: { first: 'Bob' } };
            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty(
                    'customer',
                    schemaBuilder
                        .withTypeObject()
                        .withRequiredProperty('first', schemaBuilder.withTypeString())
                        .withRequiredProperty('last', schemaBuilder.withTypeString())
                );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        xit('should pass when response body is missing a nested required property on an allOf schema', async () => {
            const pactResponseBody = { customer: { first: 'Bob' } };
            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty(
                    'customer',
                    schemaBuilder.withAllOf([
                        schemaBuilder.withTypeObject().withRequiredProperty('first', schemaBuilder.withTypeString()),
                        schemaBuilder.withTypeObject().withRequiredProperty('last', schemaBuilder.withTypeString()),
                    ])
                );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when a pact response body is missing a required property on a circular schema', async () => {
            const pactResponseBody = { child: { id: 1 } };
            const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');
            const definitions = definitionsBuilder.withDefinition(
                'Response',
                schemaBuilder
                    .withTypeObject()
                    .withRequiredProperty('id', schemaBuilder.withTypeInteger())
                    .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
            );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema, definitions);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when a pact response body is missing a required property within an array', async () => {
            const pactResponseBody = [{ customer: { first: 'Bob' } }];
            const swaggerBodySchema = schemaBuilder.withTypeArray(
                schemaBuilder
                    .withTypeObject()
                    .withRequiredProperty(
                        'customer',
                        schemaBuilder
                            .withTypeObject()
                            .withRequiredProperty('first', schemaBuilder.withTypeString())
                            .withRequiredProperty('last', schemaBuilder.withTypeString())
                    )
            );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when a response missing required property within an array on a circular schema', async () => {
            const pactResponseBody = [{ customer: { first: 'Bob' } }];
            const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');
            const definitions = definitionsBuilder.withDefinition(
                'Response',
                schemaBuilder.withTypeArray(
                    schemaBuilder
                        .withTypeObject()
                        .withRequiredProperty(
                            'customer',
                            schemaBuilder
                                .withTypeObject()
                                .withRequiredProperty('first', schemaBuilder.withTypeString())
                                .withRequiredProperty('last', schemaBuilder.withTypeString())
                                .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
                        )
                )
            );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema, definitions);

            expect(result).toContainNoWarningsOrErrors();
        });

        xit('should pass when a pact response body has a property not defined in the schema', async () => {
            const pactResponseBody = { firstName: 'Bob' };

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withOptionalProperty('first', schemaBuilder.withTypeString())
                .withOptionalProperty('last', schemaBuilder.withTypeString());

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        xit('should pass when pact response body has a property not defined in the allOf schema', async () => {
            const pactResponseBody = { a: 1 };

            const swaggerBodySchema = schemaBuilder.withAllOf([
                schemaBuilder.withTypeObject().withOptionalProperty('first', schemaBuilder.withTypeString()),
                schemaBuilder.withTypeObject().withOptionalProperty('last', schemaBuilder.withTypeString()),
            ]);

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when a pact response body has an invalid additional property', async () => {
            const pactResponseBody = { a: 1, b: '2' };

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withAdditionalPropertiesSchema(schemaBuilder.withTypeNumber());

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([
                {
                    code: 'response.body.incompatible',
                    message:
                        'Response body is incompatible with the response body schema in the spec file: must be number',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: "[root].interactions[0].response.body.b",
                        mockFile: 'pact.json',
                        value: '2',
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: `[root].paths./does/exist.get.responses.${statusCode}.schema.additionalProperties.type`,
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'spec.json',
                        value: 'number',
                    },
                    type: 'error',
                },
            ]);
        });

        it('should pass when a pact response body has an additional property', async () => {
            const pactResponseBody = { a: 1 };

            const swaggerBodySchema = schemaBuilder.withTypeObject().withAdditionalPropertiesBoolean(true);

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        xit('should pass when response body has additional property in circular schema reference', async () => {
            const pactResponseBody = {
                a: 1,
                id: 1,
            };

            const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');

            const definitions = definitionsBuilder.withDefinition(
                'Response',
                schemaBuilder
                    .withTypeObject()
                    .withRequiredProperty('id', schemaBuilder.withTypeInteger())
                    .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
            );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema, definitions);

            expect(result).toContainNoWarningsOrErrors();
        });

        xit('should pass when pact response body has property not defined in schema of array', async () => {
            const pactResponseBody = [{ customer: { firstName: 'Bob' } }];

            const swaggerBodySchema = schemaBuilder.withTypeArray(
                schemaBuilder
                    .withTypeObject()
                    .withOptionalProperty(
                        'customer',
                        schemaBuilder.withTypeObject().withOptionalProperty('first', schemaBuilder.withTypeString())
                    )
            );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result).toContainNoWarningsOrErrors();
        });

        xit('should pass when response body has property not defined in circular schema array', async () => {
            const pactResponseBody = [
                {
                    item: {
                        child: [{ items: { id: 2 } }],
                        id: 1,
                    },
                },
            ];
            const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');
            const definitions = definitionsBuilder.withDefinition(
                'Response',
                schemaBuilder.withTypeArray(
                    schemaBuilder
                        .withTypeObject()
                        .withOptionalProperty(
                            'item',
                            schemaBuilder
                                .withTypeObject()
                                .withOptionalProperty('id', schemaBuilder.withTypeInteger())
                                .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
                        )
                )
            );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema, definitions);

            expect(result).toContainNoWarningsOrErrors();
        });

        xit('should return error when pact response body has property matching a schema using allOf', async () => {
            const pactResponseBody = { value: { a: 1, b: 2 } };

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty(
                    'value',
                    schemaBuilder.withAllOf([
                        schemaBuilder.withTypeObject().withRequiredProperty('a', schemaBuilder.withTypeNumber()),
                        schemaBuilder.withTypeObject().withRequiredProperty('b', schemaBuilder.withTypeString()),
                    ])
                );

            const result = await validateResponseBody(pactResponseBody, swaggerBodySchema);

            expect(result.failureReason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([
                {
                    code: 'response.body.incompatible',
                    message:
                        'Response body is incompatible with the response body schema in the spec file: should be string',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[root].interactions[0].response.body.value.b',
                        mockFile: 'pact.json',
                        value: 2,
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location:
                            `[root].paths./does/exist.get.responses.${statusCode}.` +
                            'schema.properties.value.allOf.1.properties.b.type',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'spec.json',
                        value: 'string',
                    },
                    type: 'error',
                },
            ]);
        });

        it('should pass when a pact response body matches a default schema', async () => {
            const pactFile = pactBuilder
                .withInteraction(
                    interactionBuilder
                        .withDescription('interaction description')
                        .withRequestPath('/does/exist')
                        .withResponseStatus(202)
                        .withResponseBody({ value: 1 })
                )
                .build();

            const operation = operationBuilder.withDefaultResponse(
                responseBuilder.withSchema(
                    schemaBuilder.withTypeObject().withRequiredProperty('value', schemaBuilder.withTypeNumber())
                )
            );

            const swaggerFile = swagger2Builder
                .withPath('/does/exist', pathBuilder.withGetOperation(operation))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(swaggerFile, pactFile);

            expect(result).toContainNoErrors();
            expect(result).toContainWarnings([
                {
                    code: 'response.status.default',
                    message: 'Response status code matched default response in spec file: 202',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[root].interactions[0].response.status',
                        mockFile: 'pact.json',
                        value: 202,
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[root].paths./does/exist.get.responses',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'spec.json',
                        value: operation.build().responses,
                    },
                    type: 'warning',
                },
            ]);
        });
    });
});
