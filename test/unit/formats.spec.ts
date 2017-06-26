import {expectToReject, willResolve} from 'jasmine-promise-tools';
import * as _ from 'lodash';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    definitionsBuilder,
    operationBuilder,
    PathBuilder,
    pathBuilder,
    pathParameterBuilder,
    responseBuilder,
    responseHeaderBuilder,
    schemaBuilder,
    SchemaBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('formats', () => {
    const expectedFailedValidationError =
        new Error('Mock file "pact.json" is not compatible with swagger file "swagger.json"');

    const defaultSwaggerPathBuilder = pathBuilder.withGetOperation(operationBuilder);

    const invokeValidatorWithPath = (swaggerPath: PathBuilder, pactValue: string) => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder
                .withDescription('interaction description')
                .withRequestPath(`/${pactValue}`)
            )
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/{value}', swaggerPath)
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);
    };

    const invokeValidatorWithResponseBody = (pactResponseBody: any, swaggerBodySchema: SchemaBuilder) => {
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

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    describe('date parameters', () => {
        const swaggerPathWithDateBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withDateNamed('value'));

        it('should pass when the pact path matches a date param defined in the swagger', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithDateBuilder, '2016-12-01').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should return the error when a pact has an incorrect type as a date param', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithDateBuilder, '2016');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /2016',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/2016'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithDateBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('date-time parameters', () => {
        const swaggerPathWithDateTimeBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withDateTimeNamed('value'));

        it('should pass when the pact path matches a datetime param defined in the swagger', willResolve(() => {
            const whenResult = invokeValidatorWithPath(swaggerPathWithDateTimeBuilder, '2016-12-01T01:30:00Z');

            return whenResult.then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should return the error when a pact has an incorrect type as a datetime param', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithDateTimeBuilder, '2016-12-01T');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /2016-12-01T',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/2016-12-01T'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithDateTimeBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('int32 parameters', () => {
        const swaggerPathWithInt32Builder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withInt32Named('value'));

        const minimumInt32Allowed = '-2147483648';
        const minimumInt32AllowedMinusOne = '-2147483649';
        const maximumInt32Allowed = '2147483647';
        const maximumInt32AllowedPlusOne = '2147483648';

        it('should pass when the pact path contains the minimum int32 value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithInt32Builder, minimumInt32Allowed).then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when the pact path contains the maximum int32 value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithInt32Builder, maximumInt32Allowed).then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should return the error when a pact path contains smaller then the min int32 value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithInt32Builder, minimumInt32AllowedMinusOne);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: `Path or method not defined in swagger file: GET /${minimumInt32AllowedMinusOne}`,
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: `/${minimumInt32AllowedMinusOne}`
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithInt32Builder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path contains bigger then the max int32 value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithInt32Builder, maximumInt32AllowedPlusOne);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: `Path or method not defined in swagger file: GET /${maximumInt32AllowedPlusOne}`,
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: `/${maximumInt32AllowedPlusOne}`
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithInt32Builder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path contains non-integer int32 value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithInt32Builder, '1.1');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: `Path or method not defined in swagger file: GET /1.1`,
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: `/1.1`
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithInt32Builder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path contains blank int32 value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithInt32Builder, ' ').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when the pact response body contains the a valid int32 value', willResolve(() => {
            const pactResponseBody = {id: 1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt32());

            return invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should return the error when the pact response body contains a decimal int32 value', willResolve(() => {
            const pactResponseBody = {id: 1.1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt32());

            const result = invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.body.incompatible',
                    message: 'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should be integer',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: 1.1
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.type',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: 'integer'
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when the pact response body contains a too large int32 value', willResolve(() => {
            const numberThatIsTooLarge = parseInt(maximumInt32AllowedPlusOne, 10);
            const pactResponseBody = {id: numberThatIsTooLarge};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt32());

            const result = invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.body.incompatible',
                    message: 'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should pass "formatInt32" keyword validation',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: numberThatIsTooLarge
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.formatInt32',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: undefined
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('int64 parameters', () => {
        const swaggerPathWithInt64Parameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withInt64Named('value'));

        // loss of precision due to javascript 64bit floating point number format
        // https://en.wikipedia.org/wiki/Double-precision_floating-point_format

        const minimumInt64Allowed = '-9223372036854776000';
        const minimumInt64AllowedMinusOneThousand = '-9223372036854777000';
        const maximumInt64Allowed = '9223372036854776000';
        const maximumInt64AllowedPlusOneThousand = '9223372036854777000';

        it('should pass when the pact path contains the minimum int64 value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithInt64Parameter, minimumInt64Allowed).then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when the pact path contains the maximum int64 value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithInt64Parameter, maximumInt64Allowed).then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should return the error when a pact path contains smaller then the min int64 value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithInt64Parameter, minimumInt64AllowedMinusOneThousand);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: `Path or method not defined in swagger file: GET /${minimumInt64AllowedMinusOneThousand}`,
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: `/${minimumInt64AllowedMinusOneThousand}`
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithInt64Parameter.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path contains bigger then the max int64 value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithInt64Parameter, maximumInt64AllowedPlusOneThousand);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: `Path or method not defined in swagger file: GET /${maximumInt64AllowedPlusOneThousand}`,
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: `/${maximumInt64AllowedPlusOneThousand}`
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithInt64Parameter.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path contains non-integer int64 value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithInt64Parameter, '1.1');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: `Path or method not defined in swagger file: GET /1.1`,
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: `/1.1`
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithInt64Parameter.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should pass when a pact path contains blank int64 value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithInt64Parameter, ' ').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when the pact response body contains the a valid int64 value', willResolve(() => {
            const pactResponseBody = {id: 1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt64());

            return invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should return the error when the pact response body contains a decimal int64 value', willResolve(() => {
            const pactResponseBody = {id: 1.1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt64());

            const result = invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.body.incompatible',
                    message: 'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should be integer',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: 1.1
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.type',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: 'integer'
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when the pact response body contains a too large int64 value', willResolve(() => {
            const pactResponseBody = {id: 12345678901234567890};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt64());

            const result = invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.body.incompatible',
                    message: 'Response body is incompatible with the response body schema in the swagger file: ' +
                        'should pass "formatInt64" keyword validation',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: 12345678901234567000
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.formatInt64',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: undefined
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('float parameters', () => {
        const swaggerPathWithFloatParameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withFloatNamed('value'));

        it('should pass when the pact path contains a value with 5 significant digits', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithFloatParameter, '12345').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when the pact path contains a value with 6 significant digits', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithFloatParameter, '123456').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when pact path contains a value with 6 sig digits involving decimals', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithFloatParameter, '00123.45600').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should return the error when pact path contains a value with 7 significant digits', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithFloatParameter, '1234567');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /1234567',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/1234567'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithFloatParameter.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path contains non-numeric float value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithFloatParameter, 'a');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: `Path or method not defined in swagger file: GET /a`,
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: `/a`
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithFloatParameter.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should pass when a pact path contains blank float value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithFloatParameter, ' ').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when the pact response body contains the a valid float value', willResolve(() => {
            const pactResponseBody = {id: 1.1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatFloat());

            return invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should return the error when the pact response body contains a string float value', willResolve(() => {
            const pactResponseBody = {id: 'abc'};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatFloat());

            const result = invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.body.incompatible',
                    message: 'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should be number',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: 'abc'
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

        it('should return the error when the pact response body contains a too large float value', willResolve(() => {
            const pactResponseBody = {id: 123.4567};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatFloat());

            const result = invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.body.incompatible',
                    message: 'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should pass "formatFloat" keyword validation',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: 123.4567
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.formatFloat',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: undefined
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('double parameters', () => {
        const swaggerPathWithDoubleParameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withDoubleNamed('value'));

        it('should pass when the pact path contains a value with 14 significant digits', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithDoubleParameter, '12345678901234').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when the pact path contains a value with 15 significant digits', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithDoubleParameter, '123456789012345').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when pact path contains a value with 15 sig digits involving decimals', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithDoubleParameter, '001234567.8901234500').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should return the error when pact path contains a value with 16 significant digits', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithDoubleParameter, '1234567890123456');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /1234567890123456',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/1234567890123456'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithDoubleParameter.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path contains non-numeric double value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithDoubleParameter, 'a');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: `Path or method not defined in swagger file: GET /a`,
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: `/a`
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithDoubleParameter.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should pass when a pact path contains blank double value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithDoubleParameter, ' ').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when the pact response body contains the a valid double value', willResolve(() => {
            const pactResponseBody = {id: 1.1};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatDouble());

            return invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should return the error when the pact response body contains a string double value', willResolve(() => {
            const pactResponseBody = {id: 'abc'};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatDouble());

            const result = invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.body.incompatible',
                    message: 'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should be number',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: 'abc'
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

        it('should return the error when the pact response body contains a too large double value', willResolve(() => {
            const pactResponseBody = {id: 123456789.0123456789};

            const swaggerBodySchema = schemaBuilder
                .withTypeObject()
                .withRequiredProperty('id', schemaBuilder.withTypeNumber().withFormatDouble());

            const result = invokeValidatorWithResponseBody(pactResponseBody, swaggerBodySchema);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.body.incompatible',
                    message: 'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should pass "formatDouble" keyword validation',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: 123456789.01234567
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.formatDouble',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: undefined
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('byte parameters', () => {
        const swaggerPathWithByteParameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withByteNamed('value'));

        it('should pass when the pact path contains a value with base64 encoded data', willResolve(() => {
            const value = new Buffer('base-64-encoded').toString('base64');

            return invokeValidatorWithPath(swaggerPathWithByteParameter, value).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should return the error when pact path contains a value with 16 significant digits', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithByteParameter, 'not-base-64-encoded');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /not-base-64-encoded',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/not-base-64-encoded'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithByteParameter.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('binary parameters', () => {
        const swaggerPathWithBinaryParameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withBinaryNamed('value'));

        it('should pass when the pact path contains a value with any sequence of octets', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithBinaryParameter, '123').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when the pact path contains a value with only spaces', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithBinaryParameter, ' ').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should return the error when pact path contains a blank value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithBinaryParameter, '');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithBinaryParameter.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('password parameters', () => {
        const swaggerPathWithPasswordParameter = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withPasswordNamed('value'));

        it('should pass when the pact path contains any value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithPasswordParameter, '123').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should pass when the pact path contains a value with only spaces', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithPasswordParameter, ' ').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should return the error when pact path contains a blank value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithPasswordParameter, '');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithPasswordParameter.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('unvalidated formats', () => {
        const formats = {
            'email': 'not-an-email',
            'hostname': '!not-a-hostname',
            'ipv4': 'not-an-ipv4-address',
            'ipv6': 'not-an-ipv6-address',
            'json-pointer': 'not-a-json-pointer',
            'regex': '(not-a-regex',
            'relative-json-pointer': 'not-a-relative-json-pointer',
            'time': 'not-a-time',
            'uri': 'not-a-uri',
            'uuid': 'not-a-uuid'
        };

        _.each(formats, (pactValue, formatName) => {
            it(`should pass when the pact path contains any value for ${formatName} parameters`, willResolve(() => {
                const swaggerPathWithFormatParameter = defaultSwaggerPathBuilder
                    .withParameter(pathParameterBuilder.withUnknownStringFormatNamed(formatName as string, 'value'));

                return invokeValidatorWithPath(swaggerPathWithFormatParameter, pactValue).then((result) => {
                    expect(result).toContainNoWarnings();
                });
            }));
        });
    });

    describe('location', () => {
        it('should validate headers with formats', willResolve(() => {
            const tooBigInteger = (Math.pow(2, 31) + 1).toString();

            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/does/exist')
                    .withResponseStatus(200)
                    .withResponseHeader('x-custom-header', tooBigInteger)
                )
                .build();

            const responseHeaderSpec = responseHeaderBuilder.withInt32();

            const swaggerFile = swaggerBuilder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder
                        .withResponse(200, responseBuilder.withHeader('x-custom-header', responseHeaderSpec))
                    )
                )
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.header.incompatible',
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                    'should pass "formatInt32" keyword validation',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-custom-header',
                        mockFile: 'pact.json',
                        value: tooBigInteger
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-custom-header',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: responseHeaderSpec.build()
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should validate additional property schemas with formats', willResolve(() => {
            const tooBigInteger = Math.pow(2, 31) + 1;

            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/does/exist')
                    .withResponseStatus(200)
                    .withResponseBody({value: tooBigInteger})
                )
                .build();

            const responseBodySchema = schemaBuilder
                .withTypeObject()
                .withAdditionalPropertiesSchema(schemaBuilder.withTypeInteger().withFormatInt32());

            const swaggerFile = swaggerBuilder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder
                        .withResponse(200, responseBuilder.withSchema(responseBodySchema))
                    )
                )
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.body.incompatible',
                    message: 'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should pass "formatInt32" keyword validation',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.body[\'value\']',
                        mockFile: 'pact.json',
                        value: tooBigInteger
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location:
                            '[swaggerRoot].paths./does/exist.get.responses.200.schema.additionalProperties.formatInt32',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: undefined
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should validate circular referenced schemas with formats', willResolve(() => {
            const tooBigInteger = Math.pow(2, 31) + 1;

            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/does/exist')
                    .withResponseStatus(200)
                    .withResponseBody({id: tooBigInteger})
                )
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder
                        .withResponse(200, responseBuilder.withSchema(
                            schemaBuilder.withReference('#/definitions/Response'))
                        )
                    )
                )
                .withDefinitions(definitionsBuilder
                    .withDefinition('Response', schemaBuilder
                        .withTypeObject()
                        .withRequiredProperty('id', schemaBuilder.withTypeInteger().withFormatInt32())
                        .withOptionalProperty('child', schemaBuilder.withReference('#/definitions/Response'))
                    )
                )
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.body.incompatible',
                    message: 'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should pass "formatInt32" keyword validation',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: tooBigInteger
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location:
                            '[swaggerRoot].paths./does/exist.get.responses.200.schema.properties.id.formatInt32',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: undefined
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should validate allOf schemas with formats', willResolve(() => {
            const tooBigInteger = Math.pow(2, 31) + 1;

            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/does/exist')
                    .withResponseStatus(200)
                    .withResponseBody({id: tooBigInteger})
                )
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/does/exist', pathBuilder
                    .withGetOperation(operationBuilder.withResponse(200, responseBuilder.withSchema(schemaBuilder
                        .withAllOf([
                            schemaBuilder
                                .withTypeObject()
                                .withOptionalProperty('id', schemaBuilder
                                    .withTypeInteger()
                                    .withFormatInt32()
                                )
                        ])
                    )))
                )
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.body.incompatible',
                    message: 'Response body is incompatible with the response body schema in the swagger file: ' +
                    'should pass "formatInt32" keyword validation',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.body.id',
                        mockFile: 'pact.json',
                        value: tooBigInteger
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.' +
                            'schema.allOf.0.properties.id.formatInt32',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: undefined
                    },
                    type: 'error'
                }]);
            });
        }));
    });
});
