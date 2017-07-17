import {willResolve} from 'jasmine-promise-tools';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    definitionsBuilder,
    DefinitionsBuilder,
    operationBuilder,
    pathBuilder,
    responseBuilder,
    schemaBuilder,
    SchemaBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('response body', () => {
    const expectedFailedValidationError = 'Mock file "pact.json" is not compatible with swagger file "swagger.json"';

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    const validateResponseBody = (
        pactResponseBody: any,
        swaggerBodySchema?: SchemaBuilder,
        swaggerDefinitions?: DefinitionsBuilder
    ) => {
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

        let swaggerWithBodySchemaBuilder = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder.withResponse(200, swaggerResponseBuilder))
            );

        if (swaggerDefinitions) {
            swaggerWithBodySchemaBuilder = swaggerWithBodySchemaBuilder.withDefinitions(swaggerDefinitions);
        }

        return swaggerPactValidatorLoader.invoke(swaggerWithBodySchemaBuilder.build(), pactFile);
    };

    it('should pass when a pact calls a method that is defined in the swagger', willResolve(() => {
        const pactResponseBody = {id: 1};

        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber());

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should return the error when a pact response body is not compatible with the schema', willResolve(() => {
        const pactResponseBody = {id: 'not-a-number'};

        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber());

        return validateResponseBody(pactResponseBody, swaggerBodySchema)
        .then((result) => {
            expect(result.reason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.response.body.incompatible',
                message:
                    'Response body is incompatible with the response body schema in the swagger file: should be number',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body.id',
                    mockFile: 'pact.json',
                    value: 'not-a-number'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when pact response body is not compatible with a schema reference', willResolve(() => {
        const pactResponseBody = {id: 'not-a-number'};

        const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');

        const definitions = definitionsBuilder.withDefinition('Response', schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber())
        );

        return validateResponseBody(pactResponseBody, swaggerBodySchema, definitions).then((result) => {
            expect(result.reason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.response.body.incompatible',
                message:
                    'Response body is incompatible with the response body schema in the swagger file: should be number',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body.id',
                    mockFile: 'pact.json',
                    value: 'not-a-number'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return error when response body is not compatible with a circular schema', willResolve(() => {
        const pactResponseBody = {
            child: {id: 'not-a-number'},
            id: 1
        };

        const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');

        const definitions = definitionsBuilder.withDefinition('Response', schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber())
            .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
        );

        return validateResponseBody(pactResponseBody, swaggerBodySchema, definitions).then((result) => {
            expect(result.reason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.response.body.incompatible',
                message:
                    'Response body is incompatible with the response body schema in the swagger file: should be number',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body.child.id',
                    mockFile: 'pact.json',
                    value: 'not-a-number'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location:
                        '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: undefined
                },
                type: 'error'
            }]);
        });
    }));

    it('should return error when response is not compatible with a self referencing schema array', willResolve(() => {
        const pactResponseBody = {
            children: [{id: 'not-a-number'}],
            id: 1
        };

        const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');

        const definitions = definitionsBuilder.withDefinition('Response', schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeNumber())
            .withOptionalProperty('children', schemaBuilder.withTypeArray(
                schemaBuilder.withReference('#/definitions/Response')
            ))
        );

        return validateResponseBody(pactResponseBody, swaggerBodySchema, definitions).then((result) => {
            expect(result.reason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.response.body.incompatible',
                message:
                    'Response body is incompatible with the response body schema in the swagger file: should be number',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body.children[0].id',
                    mockFile: 'pact.json',
                    value: 'not-a-number'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location:
                        '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: undefined
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when a pact response body has invalid properties within an array', willResolve(() => {
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

        return validateResponseBody(pactResponseBody, swaggerBodySchema)
        .then((result) => {
            expect(result.reason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.response.body.incompatible',
                message:
                    'Response body is incompatible with the response body schema in the swagger file: should be string',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body[0].customer.last',
                    mockFile: 'pact.json',
                    value: 1
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200' +
                        '.schema.items.properties.customer.properties.last.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: 'string'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when a pact response body has multiple invalid properties', willResolve(() => {
        const pactResponseBody = {
            value1: '1',
            value2: '2'
        };
        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('value1', schemaBuilder.withTypeNumber())
            .withRequiredProperty('value2', schemaBuilder.withTypeNumber());

        return validateResponseBody(pactResponseBody, swaggerBodySchema)
        .then((result) => {
            expect(result.reason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.response.body.incompatible',
                message:
                    'Response body is incompatible with the response body schema in the swagger file: should be number',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body.value1',
                    mockFile: 'pact.json',
                    value: '1'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.value1.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: 'number'
                },
                type: 'error'
            }, {
                code: 'spv.response.body.incompatible',
                message:
                    'Response body is incompatible with the response body schema in the swagger file: should be number',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body.value2',
                    mockFile: 'pact.json',
                    value: '2'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.value2.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when a pact response body is passed when there is no schema', willResolve(() => {
        const pactResponseBody = {id: 1};

        return validateResponseBody(pactResponseBody)
        .then((result) => {
            expect(result.reason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.response.body.unknown',
                message: 'No schema found for response body',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body',
                    mockFile: 'pact.json',
                    value: {id: 1}
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
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
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should pass when a pact response body is missing a required property on the schema', willResolve(() => {
        const pactResponseBody = {property1: 'abc'};
        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('property1', schemaBuilder.withTypeString())
            .withRequiredProperty('property2', schemaBuilder.withTypeString());

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should pass when a pact response body is missing a nested required property on the schema', willResolve(() => {
        const pactResponseBody = {customer: {first: 'Bob'}};
        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('customer', schemaBuilder
                .withTypeObject()
                .withRequiredProperty('first', schemaBuilder.withTypeString())
                .withRequiredProperty('last', schemaBuilder.withTypeString())
            );

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should pass when response body is missing a nested required property on an allOf schema', willResolve(() => {
        const pactResponseBody = {customer: {first: 'Bob'}};
        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('customer', schemaBuilder
                .withAllOf([
                    schemaBuilder
                        .withTypeObject()
                        .withRequiredProperty('first', schemaBuilder.withTypeString()),
                    schemaBuilder
                        .withTypeObject()
                        .withRequiredProperty('last', schemaBuilder.withTypeString())
                ])
            );

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should pass when a pact response body is missing a required property on a circular schema', willResolve(() => {
        const pactResponseBody = {child: {id: 1}};
        const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');
        const definitions = definitionsBuilder.withDefinition('Response', schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeInteger())
            .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
        );

        return validateResponseBody(pactResponseBody, swaggerBodySchema, definitions).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should pass when a pact response body is missing a required property within an array', willResolve(() => {
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
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should pass when a response missing required property within an array on a circular schema', willResolve(() => {
        const pactResponseBody = [{customer: {first: 'Bob'}}];
        const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');
        const definitions = definitionsBuilder.withDefinition('Response', schemaBuilder
            .withTypeArray(schemaBuilder
                .withTypeObject()
                .withRequiredProperty('customer', schemaBuilder
                    .withTypeObject()
                    .withRequiredProperty('first', schemaBuilder.withTypeString())
                    .withRequiredProperty('last', schemaBuilder.withTypeString())
                    .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
                )
            )
        );

        return validateResponseBody(pactResponseBody, swaggerBodySchema, definitions).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should pass when a pact response body has a property not defined in the schema', willResolve(() => {
        const pactResponseBody = {firstName: 'Bob'};

        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withOptionalProperty('first', schemaBuilder.withTypeString())
            .withOptionalProperty('last', schemaBuilder.withTypeString());

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should pass when pact response body has a property not defined in the allOf schema', willResolve(() => {
        const pactResponseBody = {a: 1};

        const swaggerBodySchema = schemaBuilder
            .withAllOf([
                schemaBuilder
                    .withTypeObject()
                    .withOptionalProperty('first', schemaBuilder.withTypeString()),
                schemaBuilder
                    .withTypeObject()
                    .withOptionalProperty('last', schemaBuilder.withTypeString())
            ]);

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should return the error when a pact response body has an invalid additional property', willResolve(() => {
        const pactResponseBody = {a: 1, b: '2'};

        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withAdditionalPropertiesSchema(schemaBuilder.withTypeNumber());

        return validateResponseBody(pactResponseBody, swaggerBodySchema)
        .then((result) => {
            expect(result.reason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.response.body.incompatible',
                message:
                'Response body is incompatible with the response body schema in the swagger file: should be number',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body[\'b\']',
                    mockFile: 'pact.json',
                    value: '2'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.additionalProperties.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    }));

    it('should pass when a pact response body has an additional property', willResolve(() => {
        const pactResponseBody = {a: 1};

        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withAdditionalPropertiesBoolean(true);

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should pass when response body has additional property in circular schema reference', willResolve(() => {
        const pactResponseBody = {
            a: 1,
            id: 1
        };

        const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');

        const definitions = definitionsBuilder.withDefinition('Response', schemaBuilder
            .withTypeObject()
            .withRequiredProperty('id', schemaBuilder.withTypeInteger())
            .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
        );

        return validateResponseBody(pactResponseBody, swaggerBodySchema, definitions).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should pass when pact response body has property not defined in schema of array', willResolve(() => {
        const pactResponseBody = [{customer: {firstName: 'Bob'}}];

        const swaggerBodySchema = schemaBuilder
            .withTypeArray(schemaBuilder
                .withTypeObject()
                .withOptionalProperty('customer', schemaBuilder
                    .withTypeObject()
                    .withOptionalProperty('first', schemaBuilder.withTypeString())
                )
            );

        return validateResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should pass when response body has property not defined in circular schema array', willResolve(() => {
        const pactResponseBody = [{
            item: {
                child: [
                    {items: {id: 2}}
                ],
                id: 1
            }
        }];
        const swaggerBodySchema = schemaBuilder.withReference('#/definitions/Response');
        const definitions = definitionsBuilder.withDefinition('Response', schemaBuilder
            .withTypeArray(schemaBuilder
                .withTypeObject()
                .withOptionalProperty('item', schemaBuilder
                    .withTypeObject()
                    .withOptionalProperty('id', schemaBuilder.withTypeInteger())
                    .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
                )
            )
        );

        return validateResponseBody(pactResponseBody, swaggerBodySchema, definitions).then((result) => {
            expect(result).toContainNoWarningsOrErrors();
        });
    }));

    it('should return error when pact response body has property matching a schema using allOf', willResolve(() => {
        const pactResponseBody = {value: {a: 1, b: 2}};

        const swaggerBodySchema = schemaBuilder
            .withTypeObject()
            .withRequiredProperty('value', schemaBuilder
                .withAllOf([
                    schemaBuilder
                        .withTypeObject()
                        .withRequiredProperty('a', schemaBuilder.withTypeNumber()),
                    schemaBuilder
                        .withTypeObject()
                        .withRequiredProperty('b', schemaBuilder.withTypeString())
                ])
            );

        return validateResponseBody(pactResponseBody, swaggerBodySchema)
        .then((result) => {
            expect(result.reason).toEqual(expectedFailedValidationError);
            expect(result).toContainErrors([{
                code: 'spv.response.body.incompatible',
                message:
                'Response body is incompatible with the response body schema in the swagger file: should be string',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.body.value.b',
                    mockFile: 'pact.json',
                    value: 2
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses.200.' +
                    'schema.properties.value.allOf.1.properties.b.type',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: 'string'
                },
                type: 'error'
            }]);
        });
    }));

    it('should pass when a pact response body matches a default schema', willResolve(() => {
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
            expect(result).toContainNoErrors();
            expect(result).toContainWarnings([{
                code: 'spv.response.status.default',
                message: 'Response status code matched default response in swagger file: 202',
                mockDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].response.status',
                    mockFile: 'pact.json',
                    value: 202
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths./does/exist.get.responses',
                    pathMethod: 'get',
                    pathName: '/does/exist',
                    specFile: 'swagger.json',
                    value: operation.build().responses
                },
                type: 'warning'
            }]);
        });
    }));
});
