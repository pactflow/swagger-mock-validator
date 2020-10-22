import {SwaggerMockValidatorErrorImpl} from '../../../lib/swagger-mock-validator/swagger-mock-validator-error-impl';
import {expectToFail} from '../../support/expect-to-fail';
import {CustomMatchers, customMatchers} from '../support/custom-jasmine-matchers';
import {openApi3Builder} from '../support/openapi3-builder';
import {openApi3ContentBuilder} from '../support/openapi3-builder/openapi3-content-builder';
import {openApi3OperationBuilder} from '../support/openapi3-builder/openapi3-operation-builder';
import {
    openApi3HeaderParameterBuilder,
    openApi3PathParameterBuilder,
    openApi3QueryParameterBuilder
} from '../support/openapi3-builder/openapi3-parameter-builder';
import {openApi3PathItemBuilder} from '../support/openapi3-builder/openapi3-path-item-builder';
import {openApi3RequestBodyBuilder} from '../support/openapi3-builder/openapi3-request-body-builder';
import {openApi3ResponseBuilder} from '../support/openapi3-builder/openapi3-response-builder';
import {openApi3ResponseHeaderBuilder} from '../support/openapi3-builder/openapi3-response-header-builder';
import {OpenApi3SchemaBuilder, openApi3SchemaBuilder} from '../support/openapi3-builder/openapi3-schema-builder';
import {openApi3SecuritySchemeBuilder} from '../support/openapi3-builder/openapi3-security-scheme-builder';
import {interactionBuilder, pactBuilder} from '../support/pact-builder';
import {swaggerMockValidatorLoader} from '../support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('openapi3/parser', () => {

    const defaultPath = '/does/exist';
    const defaultInteractionDescription = 'interaction description';
    const defaultInteractionBuilder = interactionBuilder
        .withDescription(defaultInteractionDescription)
        .withRequestMethodGet()
        .withRequestPath(defaultPath)
        .withResponseStatus(200);

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    describe('general', () => {
        it('should return a failure reason when errors are found', async () => {
            const pactFile = pactBuilder.withInteraction(interactionBuilder.withRequestPath('/does/not/exist')).build();
            const specFile = openApi3Builder.build();
            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            const expectedFailureReason = 'Mock file "pact.json" is not compatible with spec file "spec.json"';

            expect(result.failureReason).toEqual(expectedFailureReason);
        });

        it('should throw an error if the spec can not be parsed due to circular references in components', async () => {
            const pactFile = pactBuilder.build();

            const reference = '#/components/requestBodies/aRequestBody';
            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withRequestBodyRef(reference)))
                .withRequestBodyComponentRef('aRequestBody', reference)
                .build();

            const error = await expectToFail(swaggerMockValidatorLoader.invoke(specFile, pactFile));

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR',
                `Unable to resolve circular reference "${reference}"`
            ));
        });

        it('should support the nullable schema keyword in an object property', async () => {
            const pactRequestBody = {
                name: null
            };

            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('Content-Type', 'application/json')
                    .withRequestBody(pactRequestBody))
                .build();

            const operationBuilder = openApi3OperationBuilder
                .withRequestBody(openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder
                        .withJsonContent(openApi3SchemaBuilder
                            .withTypeObject()
                            .withOptionalProperty('name', openApi3SchemaBuilder
                                .withTypeNumber()
                                .withNullable(true))))
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should fail with a null request body when nullable is explicitly set to false', async () => {
            const pactRequestBody = {
                name: null
            };

            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('Content-Type', 'application/json')
                    .withRequestBody(pactRequestBody))
                .build();

            const operationBuilder = openApi3OperationBuilder
                .withRequestBody(openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder
                        .withJsonContent(openApi3SchemaBuilder
                            .withTypeObject()
                            .withOptionalProperty('name', openApi3SchemaBuilder
                                .withTypeNumber()
                                .withNullable(false))))
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.body.incompatible',
                message: 'Request body is incompatible with the request body schema in the spec file: ' +
                    'should be number',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.body.name',
                    mockFile: 'pact.json',
                    value: null
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.requestBody.content.application/` +
                        'json.schema.properties.name.type',
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });

        it('should support the nullable schema keyword in an object property without type', async () => {
            const pactRequestBody = {
                name: null
            };

            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('Content-Type', 'application/json')
                    .withRequestBody(pactRequestBody))
                .build();

            const operationBuilder = openApi3OperationBuilder
                .withRequestBody(openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder
                        .withJsonContent(openApi3SchemaBuilder
                            .withTypeObject()
                            .withOptionalProperty('name', openApi3SchemaBuilder
                                .withNullable(true))))
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        describe('nullable and schemas with swagger custom formats', async () => {
            const whenValidatingNullMockPropertyAgainstSpecPropertySchema = (
                specPropertySchema: OpenApi3SchemaBuilder
            ) => {
                const pactRequestBody = {
                    name: null
                };

                const pactFile = pactBuilder
                    .withInteraction(defaultInteractionBuilder
                        .withRequestHeader('Content-Type', 'application/json')
                        .withRequestBody(pactRequestBody))
                    .build();

                const operationBuilder = openApi3OperationBuilder
                    .withRequestBody(openApi3RequestBodyBuilder
                        .withContent(openApi3ContentBuilder
                            .withJsonContent(openApi3SchemaBuilder
                                .withTypeObject()
                                .withOptionalProperty('name', specPropertySchema)))
                    );

                const specFile = openApi3Builder
                    .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                    .build();

                return  swaggerMockValidatorLoader.invoke(specFile, pactFile);
            };

            it('should support nullable for an integer schema with int32 format', async () => {
                const result = await whenValidatingNullMockPropertyAgainstSpecPropertySchema(
                    openApi3SchemaBuilder
                        .withFormatInt32()
                        .withTypeInteger()
                        .withNullable(true)
                );

                expect(result).toContainNoWarningsOrErrors();
            });

            it('should support nullable for an integer schema with int64 format', async () => {
                const result = await whenValidatingNullMockPropertyAgainstSpecPropertySchema(
                    openApi3SchemaBuilder
                        .withFormatInt64()
                        .withTypeInteger()
                        .withNullable(true)
                );

                expect(result).toContainNoWarningsOrErrors();
            });

            it('should support nullable for an number schema with float format', async () => {
                const result = await whenValidatingNullMockPropertyAgainstSpecPropertySchema(
                    openApi3SchemaBuilder
                        .withFormatFloat()
                        .withTypeNumber()
                        .withNullable(true)
                );

                expect(result).toContainNoWarningsOrErrors();
            });

            it('should support nullable for an number schema with double format', async () => {
                const result = await whenValidatingNullMockPropertyAgainstSpecPropertySchema(
                    openApi3SchemaBuilder
                        .withFormatDouble()
                        .withTypeNumber()
                        .withNullable(true)
                );

                expect(result).toContainNoWarningsOrErrors();
            });
        });
    });

    describe('paths', () => {
        it('should return an error when the pact request path does not match an openapi3 path', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestPath('/does/not/exist'))
                .build();

            const specFile = openApi3Builder
                .withPath('/does/exist', openApi3PathItemBuilder)
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: GET /does/not/exist',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: '/does/not/exist'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {
                        '/does/exist': openApi3PathItemBuilder.build()
                    }
                },
                type: 'error'
            }]);
        });
    });

    describe('operations', () => {
        it('should return an error when the pact request method does not match an openapi3 method', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestMethodPost())
                .build();

            const pathItem = openApi3PathItemBuilder.withGetOperation(openApi3OperationBuilder);

            const specFile = openApi3Builder
                .withPath(defaultPath, pathItem)
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: `Path or method not defined in spec file: POST ${defaultPath}`,
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: defaultPath
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {
                        '/does/exist': pathItem.build()
                    }
                },
                type: 'error'
            }]);
        });

        it('should not try to parse non-method properties as operations', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestMethodGet())
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder)
                    .withDescription('description is not a method'))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });
    });

    describe('consumes', () => {
        it('should return error when request content-type does not comply with request body media type', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('Content-Type', 'application/json'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withRequestBody(openApi3RequestBodyBuilder
                            .withContent(openApi3ContentBuilder
                                .withMimeTypeContent('image/png', openApi3SchemaBuilder)
                                .withMimeTypeContent('text/html', openApi3SchemaBuilder))
                        )
                    )
                )
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.content-type.incompatible',
                message: 'Request Content-Type header is incompatible with the mime-types the spec accepts to consume',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.headers.Content-Type',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.requestBody.content`,
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: ['image/png', 'text/html']
                },
                type: 'error'
            }]);
        });

        it('should return warning when request content-type is defined and openapi3 requestBody is not', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('Content-Type', 'application/json'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoErrors();
            expect(result).toContainWarnings([{
                code: 'request.content-type.unknown',
                message: 'Request content-type header is defined but the spec does not specify any mime-types ' +
                    'to consume',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.headers.Content-Type',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get`,
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: openApi3OperationBuilder.build()
                },
                type: 'warning'
            }]);
        });
    });

    describe('request body', () => {
        it('should return an error when the pact request body does not match the openapi3 request body', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestBody('not-a-number'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withRequestBody(openApi3RequestBodyBuilder
                            .withContent(openApi3ContentBuilder
                                .withJsonContent(openApi3SchemaBuilder.withTypeNumber()))
                        )
                    )
                )
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.body.incompatible',
                message: 'Request body is incompatible with the request body schema in the spec file: ' +
                    'should be number',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.body',
                    mockFile: 'pact.json',
                    value: 'not-a-number'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.requestBody.content.application/json.schema.type`,
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });

        it('should pass when request body has an unsupported mimetype (unsupported feature)', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('Content-Type', 'application/xml')
                    .withRequestBody(1))
                .build();

            const operationBuilder = openApi3OperationBuilder
                .withRequestBody(openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder.withXmlContent(openApi3SchemaBuilder.withTypeNumber()))
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return error if pact not compatible with application/json request with charset', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('content-type', 'application/json; charset=UTF-8')
                    .withRequestBody(true))
                .build();

            const operationBuilder = openApi3OperationBuilder
                .withRequestBody(openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder
                        .withMimeTypeContent('application/json;charset=utf-8', openApi3SchemaBuilder.withTypeNumber())))
                .withResponse(200, openApi3ResponseBuilder);

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.body.incompatible',
                message: 'Request body is incompatible with the request body schema in the spec file: ' +
                    'should be number',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.body',
                    mockFile: 'pact.json',
                    value: true
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.requestBody.content.` +
                        'application/json;charset=utf-8.schema.type',
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });

        it('should return an error when pact has no request body but an openapi3 requires a body', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder)
                .build();

            const operationBuilder = openApi3OperationBuilder
                .withRequestBody(openApi3RequestBodyBuilder
                    .withRequiredBody()
                    .withContent(openApi3ContentBuilder
                        .withJsonContent(openApi3SchemaBuilder.withTypeNumber()))
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.body.incompatible',
                message: 'Request body is incompatible with the request body schema in the spec file: ' +
                    'should be number',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.body',
                    mockFile: 'pact.json',
                    value: undefined
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.requestBody.content.application/json.schema.type`,
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });

        it('should pass when there is no pact request body and an optional schema', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder)
                .build();

            const operationBuilder = openApi3OperationBuilder
                .withRequestBody(openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder
                        .withJsonContent(openApi3SchemaBuilder.withTypeNumber()))
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return error when request body is not compatible with spec with circular references', async () => {
            const pactRequestBody = {
                child: {id: 'not-a-number'},
                id: 1
            };

            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestBody(pactRequestBody))
                .build();

            const specFile = openApi3Builder
                .withRequestBodyComponent('aRequestBody', openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder
                        .withJsonContent(openApi3SchemaBuilder.withReference('#/components/schemas/circles'))))
                .withSchemaComponent('circles', openApi3SchemaBuilder
                    .withTypeObject()
                    .withOptionalProperty('id', openApi3SchemaBuilder.withTypeNumber())
                    .withOptionalProperty('child', openApi3SchemaBuilder.withReference('#/components/schemas/circles'))
                )
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(
                    openApi3OperationBuilder.withRequestBodyRef('#/components/requestBodies/aRequestBody')))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.body.incompatible',
                message:
                    'Request body is incompatible with the request body schema in the spec file: should be number',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.body.child.id',
                    mockFile: 'pact.json',
                    value: 'not-a-number'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.requestBody.content.` +
                        'application/json.schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: undefined
                },
                type: 'error'
            }]);

        });

        it('should pass when pact request body matches oneOf request bodies in openapi3', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('Content-Type', 'application/json')
                    .withRequestBody(1))
                .build();

            const operationBuilder = openApi3OperationBuilder
                .withRequestBody(openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder
                        .withJsonContent(openApi3SchemaBuilder
                            .withOneOf([
                                openApi3SchemaBuilder.withTypeNumber(),
                                openApi3SchemaBuilder.withTypeObject()
                            ]))
                    )
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should support de-referencing an object containing a reference pointing to another reference', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('content-type', 'application/json')
                    .withRequestBody({aNumber: 1}))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withRequestBodyRef('#/components/requestBodies/aRequestBody')))
                .withRequestBodyComponentRef('aRequestBody', '#/components/requestBodies/anotherRequestBody')
                .withRequestBodyComponent('anotherRequestBody', openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder.withJsonContentRef('#/components/schemas/anSchema')))
                .withSchemaComponent('anSchema', openApi3SchemaBuilder
                    .withTypeObject()
                    .withOptionalProperty('aNumber', openApi3SchemaBuilder.withTypeNumber())
                    .withOptionalProperty('circle', openApi3SchemaBuilder
                        .withReference('#/components/schemas/anSchema')))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });
    });

    describe('path parameters', () => {
        it('should not fail when the pact file matches a parameter defined at the path-item level', async () => {
            const pactFile = pactBuilder.withInteraction(interactionBuilder.withRequestPath('/users/1')).build();

            const specFile = openApi3Builder
                .withPath('/users/{userId}', openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder)
                    .withParameter(openApi3PathParameterBuilder
                        .withName('userId')
                        .withSchema(openApi3SchemaBuilder.withTypeNumber())))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should use the operation parameters when there are duplicate parameter definitions', async () => {
            const pactFile = pactBuilder.withInteraction(interactionBuilder.withRequestPath('/users/1')).build();

            const specFile = openApi3Builder
                .withPath('/users/{userId}', openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withParameter(openApi3PathParameterBuilder
                            .withName('userId')
                            .withSchema(openApi3SchemaBuilder.withTypeNumber())))
                    .withParameter(openApi3PathParameterBuilder
                        .withName('userId')
                        .withSchema(openApi3SchemaBuilder.withTypeBoolean())))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return error if pact path segment value does not match the spec path parameter schema', async () => {
            const pactFile = pactBuilder
                .withInteraction(
                    defaultInteractionBuilder
                        .withRequestPath('/user/not-a-number/info'))
                .build();

            const specPathItem = openApi3PathItemBuilder
                .withGetOperation(openApi3OperationBuilder
                    .withParameter(openApi3PathParameterBuilder
                        .withName('userId')
                        .withSchema(openApi3SchemaBuilder.withTypeNumber())));

            const specFile = openApi3Builder
                .withPath('/user/{userId}/info', specPathItem)
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: GET /user/not-a-number/info',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'pact.json',
                    value: '/user/not-a-number/info'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'spec.json',
                    value: {'/user/{userId}/info': specPathItem.build()}
                },
                type: 'error'
            }]);
        });
    });

    describe('request query', () => {
        it('should pass when the pact file matches a parameter defined at the path-item level', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestQuery('id=1'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder)
                    .withParameter(openApi3QueryParameterBuilder
                        .withName('id')
                        .withSchema(openApi3SchemaBuilder.withTypeNumber())))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when the pact request query does not match the spec', async () => {
            const pactFile = pactBuilder
                .withInteraction(
                    defaultInteractionBuilder
                        .withRequestQuery('name=not-a-number'))
                .build();

            const queryParameter = openApi3QueryParameterBuilder
                .withSchemaRef('#/components/schemas/queryParamSchema')
                .withName('name')
                .withRequired();
            const operation = openApi3OperationBuilder.withParameterRef('#/components/parameters/name');

            const specFile = openApi3Builder
                .withSchemaComponent('queryParamSchema', openApi3SchemaBuilder.withTypeNumber())
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(operation))
                .withParameterComponent(queryParameter)
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.query.incompatible',
                message: 'Value is incompatible with the parameter defined in the spec file: should be number',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.query.name',
                    mockFile: 'pact.json',
                    value: 'not-a-number'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.parameters[0]`,
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: {in: 'query', name: 'name', required: true, schema: {type: 'number'}}
                },
                type: 'error'
            }]);
        });

        it('should pass when the spec defines a parameter with a content property (unsupported feature)', async () => {
            const pactFile = pactBuilder
                .withInteraction(
                    defaultInteractionBuilder
                        .withRequestQuery('name=not-a-number'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(
                    openApi3OperationBuilder.withParameter(
                        openApi3QueryParameterBuilder
                            .withName('name')
                            .withRequired()
                            .withContent(openApi3ContentBuilder.withJsonContent(openApi3SchemaBuilder.withTypeObject()))
                    )))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact request query is missing but parameter is not required', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder)
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(
                    openApi3OperationBuilder.withParameter(
                        openApi3QueryParameterBuilder
                            .withName('name')
                    )))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact query does not match a schema of type object (unsupported feature)', async () => {
            const pactFile = pactBuilder
                .withInteraction(
                    defaultInteractionBuilder
                        .withRequestQuery('name=not-an-object'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(
                    openApi3OperationBuilder.withParameter(
                        openApi3QueryParameterBuilder
                            .withName('name')
                            .withRequired()
                            .withSchema(openApi3SchemaBuilder
                                .withTypeObject())
                    )
                ))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact query does not match a schema of type array (unsupported feature)', async () => {
            const pactFile = pactBuilder
                .withInteraction(
                    defaultInteractionBuilder
                        .withRequestQuery('name=not-an-array'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(
                    openApi3OperationBuilder.withParameter(
                        openApi3QueryParameterBuilder
                            .withName('name')
                            .withRequired()
                            .withSchema(openApi3SchemaBuilder
                                .withTypeArray()
                                .withItems(openApi3SchemaBuilder.withTypeBoolean())
                            )
                    )
                ))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should not fail when the pact query does not match a parameter of different "in" value', async () => {
            const pactFile = pactBuilder
                .withInteraction(
                    defaultInteractionBuilder
                        .withRequestQuery('name=not-a-number')
                )
                .build();

            const headerParameter = openApi3HeaderParameterBuilder
                .withName('name')
                .withSchema(openApi3SchemaBuilder.withTypeNumber());

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(
                    openApi3OperationBuilder.withParameter(headerParameter)))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoErrors();
        });
    });

    describe('request headers', () => {
        it('should not fail when the pact file matches a parameter defined at the path-item level', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('x-number-required', '1'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder)
                    .withParameter(openApi3HeaderParameterBuilder
                        .withName('x-number-required')
                        .withSchema(openApi3SchemaBuilder.withTypeNumber())))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return the error when the pact request header does not match the spec header', async () => {
            const pactFile = pactBuilder
                .withInteraction(
                    defaultInteractionBuilder
                        .withRequestHeader('header-name', 'not-a-number')
                )
                .build();

            const headerParameter = openApi3HeaderParameterBuilder
                .withName('header-name')
                .withSchema(openApi3SchemaBuilder.withTypeNumber());

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withParameter(headerParameter)))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.header.incompatible',
                message: 'Value is incompatible with the parameter defined in the spec file: should be number',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.headers.header-name',
                    mockFile: 'pact.json',
                    value: 'not-a-number'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.parameters[0]`,
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: headerParameter.build()
                },
                type: 'error'
            }]);
        });
    });

    describe('response status', () => {
        it('should return error when pact mocks response status is not defined in openapi3', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withResponseStatus(202))
                .build();

            const operation = openApi3OperationBuilder
                .withResponseRef(200, '#/components/responses/aResponse');
            const specFile = openApi3Builder
                .withResponseComponent('aResponse', openApi3ResponseBuilder)
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operation))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'response.status.unknown',
                message: 'Response status code not defined in spec file: 202',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.status',
                    mockFile: 'pact.json',
                    value: 202
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.responses`,
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: {200: openApi3ResponseBuilder.build()}
                },
                type: 'error'
            }]);
        });
    });

    describe('produces', () => {
        it('should return the error when the pact request accept header does not match the spec', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('Accept', 'application/json'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withResponse(200, openApi3ResponseBuilder
                            .withContent(openApi3ContentBuilder.withXmlContent(openApi3SchemaBuilder)))
                    )
                )
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.accept.incompatible',
                message: 'Request Accept header is incompatible with the mime-types the spec defines to produce',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.headers.Accept',
                    mockFile: 'pact.json',
                    value: 'application/json'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.responses.200.content`,
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: ['application/xml']
                },
                type: 'error'
            }]);
        });
    });

    describe('response bodies', () => {
        it('should return error when the pact response body does not match the openapi3 response body', async () => {
            const pactResponseBody = {
                child: {id: 'not-a-number'},
                id: 1
            };
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withResponseBody(pactResponseBody))
                .build();

            const specFile = openApi3Builder
                .withResponseComponent('aResponse', openApi3ResponseBuilder
                    .withContent(
                        openApi3ContentBuilder
                            .withJsonContent(
                                openApi3SchemaBuilder.withReference('#/components/schemas/circles'))))
                .withSchemaComponent('circles', openApi3SchemaBuilder
                    .withTypeObject()
                    .withOptionalProperty('id', openApi3SchemaBuilder.withTypeNumber())
                    .withOptionalProperty('child', openApi3SchemaBuilder.withReference('#/components/schemas/circles'))
                )
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(
                    openApi3OperationBuilder.withResponseRef(200, '#/components/responses/aResponse')))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                    'should be number',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body.child.id',
                    mockFile: 'pact.json',
                    value: 'not-a-number'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location:
                        `[root].paths.${defaultPath}.get.responses.200.content.` +
                        'application/json.schema.properties.id.type',
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: undefined
                },
                type: 'error'
            }]);
        });

        it('should pass when response body has an unsupported mime type (unsupported feature)', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withResponseHeader('Content-Type', 'application/xml')
                    .withResponseBody(1))
                .build();

            const operationBuilder = openApi3OperationBuilder
                .withResponse(200, openApi3ResponseBuilder
                    .withContent(
                        openApi3ContentBuilder.withXmlContent(openApi3SchemaBuilder.withTypeNumber()))
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should return error if pact not compatible with application/json response with charset', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('accept', 'application/json; charset=UTF-8')
                    .withResponseBody(true))
                .build();

            const operationBuilder = openApi3OperationBuilder
                .withResponse(200, openApi3ResponseBuilder
                    .withContent(openApi3ContentBuilder
                        .withMimeTypeContent('application/json;charset=utf-8', openApi3SchemaBuilder.withTypeNumber()))
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'response.body.incompatible',
                message: 'Response body is incompatible with the response body schema in the spec file: ' +
                    'should be number',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.body',
                    mockFile: 'pact.json',
                    value: true
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location:
                        `[root].paths.${defaultPath}.get.responses.200.content.` +
                        'application/json;charset=utf-8.schema.type',
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: 'number'
                },
                type: 'error'
            }]);
        });
    });

    describe('response headers', () => {
        it('should return the error when the pact response header does not match the spec', async () => {
            const pactFile = pactBuilder
                .withInteraction(
                    defaultInteractionBuilder
                        .withResponseHeader('x-custom-header', 'not-a-number'))
                .build();

            const specFile = openApi3Builder
                .withSchemaComponent('aResponseHeader', openApi3SchemaBuilder
                    .withTypeNumber())
                .withHeaderComponent('aHeaderComponent', openApi3ResponseHeaderBuilder
                    .withSchemaRef('#/components/schemas/aResponseHeader'))
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withResponse(200, openApi3ResponseBuilder
                            .withHeaderRef('x-custom-header', '#/components/headers/aHeaderComponent'))))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'response.header.incompatible',
                message: 'Value is incompatible with the parameter defined in the spec file: should be number',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0].response.headers.x-custom-header',
                    mockFile: 'pact.json',
                    value: 'not-a-number'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.responses.200.headers.x-custom-header`,
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: {schema: {type: 'number'}}
                },
                type: 'error'
            }]);
        });

        it('should pass when the pact header does not match a schema of type array (unsupported feature)', async () => {
            const pactFile = pactBuilder
                .withInteraction(
                    defaultInteractionBuilder
                        .withResponseHeader('x-custom-header', 'not-an-array'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withResponse(200, openApi3ResponseBuilder
                            .withHeader('x-custom-header', openApi3ResponseHeaderBuilder
                                .withSchema(openApi3SchemaBuilder
                                    .withTypeArray()
                                    .withItems(openApi3SchemaBuilder.withTypeBoolean()))))))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });
    });

    describe('security definitions', () => {
        it('should fail when the pact request does not match a global apiKey header security requirement', async () => {
            const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

            const specFile = openApi3Builder
                .withSecuritySchemeComponent('securityRequirement', openApi3SecuritySchemeBuilder
                    .withTypeApiKeyInHeader('x-custom-auth'))
                .withSecurityRequirementNamed('securityRequirement')
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withResponse(200, openApi3ResponseBuilder)))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.authorization.missing',
                message: 'Request Authorization header is missing but is required by the spec file',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0]',
                    mockFile: 'pact.json',
                    value: defaultInteractionBuilder.build()
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].security[0].securityRequirement',
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: []
                },
                type: 'error'
            }]);
        });

        it('should fail when the pact request does not match an operation query security requirement', async () => {
            const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

            const specFile = openApi3Builder
                .withSecuritySchemeComponent('securityRequirement',
                    openApi3SecuritySchemeBuilder.withTypeApiKeyInQuery('queryParam'))

                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withSecurityRequirementNamed('securityRequirement')))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.authorization.missing',
                message: 'Request Authorization query is missing but is required by the spec file',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0]',
                    mockFile: 'pact.json',
                    value: defaultInteractionBuilder.build()
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.security[0].securityRequirement`,
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: []
                },
                type: 'error'
            }]);
        });

        it('should pass when the pact request has the required apiKey auth header', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('x-api-token', 'Bearer a-token'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder.withSecurityRequirementNamed('apiKey')))
                .withSecuritySchemeComponent('apiKey', openApi3SecuritySchemeBuilder
                    .withTypeApiKeyInHeader('x-api-token'))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact request has the required apiKey auth query', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestQuery('secretToken=123'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder.withSecurityRequirementNamed('apiKey')))
                .withSecuritySchemeComponent('apiKey', openApi3SecuritySchemeBuilder
                    .withTypeApiKeyInQuery('secretToken'))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass when the pact request has the required http auth header', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestHeader('Authorization', 'Basic user:pwd'))
                .build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder.withSecurityRequirementNamed('basicAuth')))
                .withSecuritySchemeComponent('basicAuth', openApi3SecuritySchemeBuilder
                    .withTypeBasic())
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should ignore unsupported security definition types', async () => {
            const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withSecurityRequirementNamed('oauth')))
                .withSecuritySchemeComponent('oauth', openApi3SecuritySchemeBuilder.withTypeOAuth2())
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should ignore apiKey security definition for cookies', async () => {
            const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withSecurityRequirementNamed('cookieRequirement')))
                .withSecuritySchemeComponent('cookieRequirement', openApi3SecuritySchemeBuilder
                    .withTypeApiKeyInCookie('cookie-name'))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass if pact doesnt match supported requirements but spec contains an unsupported one', async () => {
            const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withSecurityRequirementNamed('oauth')
                        .withSecurityRequirementNamed('basicAuth')
                    ))
                .withSecuritySchemeComponent('oauth', openApi3SecuritySchemeBuilder.withTypeOAuth2())
                .withSecuritySchemeComponent('basicAuth', openApi3SecuritySchemeBuilder.withTypeBasic())
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should pass if pact does not have auth but the spec contains an empty security requirement', async () => {
            const pactFile = pactBuilder.withInteraction(defaultInteractionBuilder).build();

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withEmptySecurityRequirement()
                        .withSecurityRequirementNamed('basicAuth')
                    ))
                .withSecuritySchemeComponent('basicAuth', openApi3SecuritySchemeBuilder.withTypeBasic())
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should use operation security definitions over globally defined ones', async () => {
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder)
                .build();

            const specFile = openApi3Builder
                .withSecurityRequirementNamed('queryToken')
                .withPath(defaultPath, openApi3PathItemBuilder
                    .withGetOperation(openApi3OperationBuilder
                        .withSecurityRequirementNamed('headerToken')))
                .withSecuritySchemeComponent('queryToken', openApi3SecuritySchemeBuilder
                    .withTypeApiKeyInQuery('token'))
                .withSecuritySchemeComponent('headerToken', openApi3SecuritySchemeBuilder
                    .withTypeApiKeyInHeader('x-secret-token'))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([{
                code: 'request.authorization.missing',
                message: 'Request Authorization header is missing but is required by the spec file',
                mockDetails: {
                    interactionDescription: defaultInteractionDescription,
                    interactionState: '[none]',
                    location: '[root].interactions[0]',
                    mockFile: 'pact.json',
                    value: defaultInteractionBuilder.build()
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: `[root].paths.${defaultPath}.get.security[0].headerToken`,
                    pathMethod: 'get',
                    pathName: defaultPath,
                    specFile: 'spec.json',
                    value: []
                },
                type: 'error'
            }]);
        });
    });

    describe('formats in sub schemas', () => {
        it('should return an error when pact request does not match int32 format inside oneOf', async () => {
            const maxInt32PlusOne = 2147483648;
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestBody(maxInt32PlusOne))
                .build();

            const int32Schema = openApi3SchemaBuilder.withTypeInteger().withFormatInt32();
            const operationBuilder = openApi3OperationBuilder
                .withRequestBody(openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder
                        .withJsonContent(
                            openApi3SchemaBuilder.withOneOf([int32Schema])))
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([
                {
                    code: 'request.body.incompatible',
                    message:
                        'Request body is incompatible with the request body schema in the spec file: '
                        + 'should pass "formatInt32" keyword validation',
                    mockDetails: {
                        interactionDescription: defaultInteractionDescription,
                        interactionState: '[none]',
                        location: '[root].interactions[0].request.body',
                        mockFile: 'pact.json',
                        value: maxInt32PlusOne
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location:
                            `[root].paths.${defaultPath}.get.requestBody.content.application/` +
                            'json.schema.oneOf.0.formatInt32',
                        pathMethod: 'get',
                        pathName: defaultPath,
                        specFile: 'spec.json',
                        value: undefined
                    },
                    type: 'error'
                },
                {
                    code: 'request.body.incompatible',
                    message: 'Request body is incompatible with the request body schema in the spec file: ' +
                        'should match exactly one schema in oneOf',
                    mockDetails: {
                        interactionDescription: defaultInteractionDescription,
                        interactionState: '[none]',
                        location: '[root].interactions[0].request.body',
                        mockFile: 'pact.json',
                        value: maxInt32PlusOne
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: `[root].paths.${defaultPath}.get.requestBody.content.application/json.schema.oneOf`,
                        pathMethod: 'get',
                        pathName: defaultPath,
                        specFile: 'spec.json',
                        value: [int32Schema.build()]
                    },
                    type: 'error'
                }
            ]);
        });

        it('should return an error when pact request does not match int32 format inside anyOf', async () => {
            const maxInt32PlusOne = 2147483648;
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestBody(maxInt32PlusOne))
                .build();

            const int32Schema = openApi3SchemaBuilder.withTypeInteger().withFormatInt32();
            const operationBuilder = openApi3OperationBuilder
                .withRequestBody(openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder
                        .withJsonContent(
                            openApi3SchemaBuilder.withAnyOf([int32Schema])))
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([
                {
                    code: 'request.body.incompatible',
                    message:
                        'Request body is incompatible with the request body schema in the spec file: '
                        + 'should pass "formatInt32" keyword validation',
                    mockDetails: {
                        interactionDescription: defaultInteractionDescription,
                        interactionState: '[none]',
                        location: '[root].interactions[0].request.body',
                        mockFile: 'pact.json',
                        value: maxInt32PlusOne
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location:
                            `[root].paths.${defaultPath}.get.requestBody.content.application/` +
                            'json.schema.anyOf.0.formatInt32',
                        pathMethod: 'get',
                        pathName: defaultPath,
                        specFile: 'spec.json',
                        value: undefined
                    },
                    type: 'error'
                },
                {
                    code: 'request.body.incompatible',
                    message: 'Request body is incompatible with the request body schema in the spec file: ' +
                        'should match some schema in anyOf',
                    mockDetails: {
                        interactionDescription: defaultInteractionDescription,
                        interactionState: '[none]',
                        location: '[root].interactions[0].request.body',
                        mockFile: 'pact.json',
                        value: maxInt32PlusOne
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: `[root].paths.${defaultPath}.get.requestBody.content.application/json.schema.anyOf`,
                        pathMethod: 'get',
                        pathName: defaultPath,
                        specFile: 'spec.json',
                        value: [int32Schema.build()]
                    },
                    type: 'error'
                }
            ]);
        });

        it('should return an error when pact request does not match int32 format inside a not', async () => {
            const validInt32 = 10;
            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestBody(validInt32))
                .build();

            const int32Schema = openApi3SchemaBuilder.withTypeInteger().withFormatInt32();
            const operationBuilder = openApi3OperationBuilder
                .withRequestBody(openApi3RequestBodyBuilder
                    .withContent(openApi3ContentBuilder
                        .withJsonContent(
                            openApi3SchemaBuilder.withNot(int32Schema)))
                );

            const specFile = openApi3Builder
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(operationBuilder))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);
            expect(result).toContainErrors([
                {
                    code: 'request.body.incompatible',
                    message:
                        'Request body is incompatible with the request body schema in the spec file: '
                        + 'should NOT be valid',
                    mockDetails: {
                        interactionDescription: defaultInteractionDescription,
                        interactionState: '[none]',
                        location: '[root].interactions[0].request.body',
                        mockFile: 'pact.json',
                        value: validInt32
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location:
                            `[root].paths.${defaultPath}.get.requestBody.content.application/` +
                            'json.schema.not',
                        pathMethod: 'get',
                        pathName: defaultPath,
                        specFile: 'spec.json',
                        value: int32Schema.build()
                    },
                    type: 'error'
                }
            ]);
        });

        it('should return an error when pact request does not match int32 format in components.schemas', async () => {
            const maxInt32PlusOne = 2147483648;
            const pactRequestBody = {id: maxInt32PlusOne};

            const pactFile = pactBuilder
                .withInteraction(defaultInteractionBuilder
                    .withRequestBody(pactRequestBody))
                .build();

            const schemaReference = '#/components/schemas/int32Schema';
            const specFile = openApi3Builder
                .withSchemaComponent('int32Schema', openApi3SchemaBuilder
                    .withTypeObject()
                    .withOptionalProperty('id', openApi3SchemaBuilder.withTypeInteger().withFormatInt32())
                    .withOptionalProperty('circle', openApi3SchemaBuilder.withReference(schemaReference)))
                .withPath(defaultPath, openApi3PathItemBuilder.withGetOperation(
                    openApi3OperationBuilder
                        .withRequestBody(openApi3RequestBodyBuilder
                            .withContent(openApi3ContentBuilder.withJsonContentRef(schemaReference)))))
                .build();

            const result = await swaggerMockValidatorLoader.invoke(specFile, pactFile);

            expect(result).toContainErrors([
                {
                    code: 'request.body.incompatible',
                    message:
                        'Request body is incompatible with the request body schema in the spec file: '
                        + 'should pass "formatInt32" keyword validation',
                    mockDetails: {
                        interactionDescription: defaultInteractionDescription,
                        interactionState: '[none]',
                        location: '[root].interactions[0].request.body.id',
                        mockFile: 'pact.json',
                        value: maxInt32PlusOne
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: `[root].paths.${defaultPath}.get.requestBody.content.application/json` +
                            '.schema.properties.id.formatInt32',
                        pathMethod: 'get',
                        pathName: defaultPath,
                        specFile: 'spec.json',
                        value: undefined
                    },
                    type: 'error'
                }
            ]);
        });
    });
});
