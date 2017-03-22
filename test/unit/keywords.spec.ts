import {expectToReject, willResolve} from 'jasmine-promise-tools';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    PathBuilder,
    pathBuilder,
    pathParameterBuilder,
    responseBuilder,
    ResponseHeaderBuilder,
    responseHeaderBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('keywords', () => {
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

    const invokeValidatorWithResponseHeader = (
        swaggerResponseHeader: ResponseHeaderBuilder,
        pactHeaderValue: string
    ) => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder
                .withDescription('interaction description')
                .withRequestPath('/does/exist')
                .withResponseStatus(200)
                .withResponseHeader('x-value', pactHeaderValue)
            )
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder
                .withGetOperation(operationBuilder
                    .withResponse(200, responseBuilder
                        .withHeader('x-value', swaggerResponseHeader)
                    )
                )
            )
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);
    };

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
    });

    describe('enum', () => {
        const swaggerPathWithEnumBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withStringEnumNamed('value', ['a']));

        it('should pass when the pact path contains an enum value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithEnumBuilder, 'a').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path does not contain an enum value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithEnumBuilder, 'b');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /b',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/b'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithEnumBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header does not contain an enum value', willResolve(() => {
            const responseHeaderWithEnum = responseHeaderBuilder.withStringEnum(['a']);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithEnum, 'b');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.header.incompatible',
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                        'should be equal to one of the allowed values',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        mockFile: 'pact.json',
                        value: 'b'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: responseHeaderWithEnum.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('maximum and exclusiveMaximum', () => {
        const swaggerPathWithMaximumBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withNumberMaximumNamed('value', 100));

        it('should pass when the pact path contains an value equal to maximum', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithMaximumBuilder, '100').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value greater then maximum', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMaximumBuilder, '101');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /101',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/101'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithMaximumBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact path contains a value equal to the exclusive maximum', willResolve(() => {
            const swaggerPathWithExclusiveMaximum = defaultSwaggerPathBuilder
                .withParameter(pathParameterBuilder.withNumberExclusiveMaximumNamed('value', 100));
            const result = invokeValidatorWithPath(swaggerPathWithExclusiveMaximum, '100');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /100',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/100'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithExclusiveMaximum.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header contains a value equal to the exclusive maximum', willResolve(() => {
            const responseHeaderWithExclusiveMaximum = responseHeaderBuilder.withNumberExclusiveMaximum(100);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithExclusiveMaximum, '100');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.header.incompatible',
                    message: 'Value is incompatible with the parameter defined in the swagger file: should be < 100',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        mockFile: 'pact.json',
                        value: '100'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: responseHeaderWithExclusiveMaximum.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('minimum and exclusiveMinimum', () => {
        const swaggerPathWithMinimumBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withNumberMinimumNamed('value', 100));

        it('should pass when the pact path contains an value equal to minimum', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithMinimumBuilder, '100').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value less then minimum', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMinimumBuilder, '99');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /99',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/99'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithMinimumBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact path contains a value equal to the exclusive minimum', willResolve(() => {
            const swaggerPathWithExclusiveMinimum = defaultSwaggerPathBuilder
                .withParameter(pathParameterBuilder.withNumberExclusiveMinimumNamed('value', 100));
            const result = invokeValidatorWithPath(swaggerPathWithExclusiveMinimum, '100');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /100',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/100'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithExclusiveMinimum.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header contains a value equal to the exclusive minimum', willResolve(() => {
            const responseHeaderWithExclusiveMinimum = responseHeaderBuilder.withNumberExclusiveMinimum(100);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithExclusiveMinimum, '100');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.header.incompatible',
                    message: 'Value is incompatible with the parameter defined in the swagger file: should be > 100',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        mockFile: 'pact.json',
                        value: '100'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: responseHeaderWithExclusiveMinimum.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('maxLength', () => {
        const swaggerPathWithMaxLengthBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withStringMaxLengthNamed('value', 3));

        it('should pass when the pact path contains an value length equal to maxLength', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithMaxLengthBuilder, 'abc').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value length greater then maxLength', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMaxLengthBuilder, 'abcd');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /abcd',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/abcd'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithMaxLengthBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header contains a value length greater then maxLength', willResolve(() => {
            const responseHeaderWithMaxLength = responseHeaderBuilder.withStringMaxLength(3);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithMaxLength, 'abcd');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.header.incompatible',
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                        'should NOT be longer than 3 characters',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        mockFile: 'pact.json',
                        value: 'abcd'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: responseHeaderWithMaxLength.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('minLength', () => {
        const swaggerPathWithMinLengthBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withStringMinLengthNamed('value', 3));

        it('should pass when the pact path contains an value length equal to minLength', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithMinLengthBuilder, 'abc').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value length less then minLength', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMinLengthBuilder, 'ab');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /ab',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/ab'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithMinLengthBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header contains a value length less then minLength', willResolve(() => {
            const responseHeaderWithMinLength = responseHeaderBuilder.withStringMinLength(3);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithMinLength, 'ab');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.header.incompatible',
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                    'should NOT be shorter than 3 characters',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        mockFile: 'pact.json',
                        value: 'ab'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: responseHeaderWithMinLength.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('pattern', () => {
        const swaggerPathWithPatternBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withStringPatternNamed('value', '^[a-f]+$'));

        it('should pass when the pact path contains an value that matches the pattern', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithPatternBuilder, 'abcdef').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value that does not match the pattern', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithPatternBuilder, 'abcdefg');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /abcdefg',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/abcdefg'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithPatternBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header contains a value that does not match the pattern', willResolve(() => {
            const responseHeaderWithPattern = responseHeaderBuilder.withStringPattern('^[a-f]+$');
            const result = invokeValidatorWithResponseHeader(responseHeaderWithPattern, 'abcdefg');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.header.incompatible',
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                    'should match pattern "^[a-f]+$"',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        mockFile: 'pact.json',
                        value: 'abcdefg'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: responseHeaderWithPattern.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('multipleOf', () => {
        const swaggerPathWithMultipleOfBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withNumberMultipleOfNamed('value', 3));

        it('should pass when the pact path contains an value that is a multiple', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithMultipleOfBuilder, '6').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value that is not a multiple', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMultipleOfBuilder, '7');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /7',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/7'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithMultipleOfBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header contains a value that is not a multiple', willResolve(() => {
            const responseHeaderWithMultipleOf = responseHeaderBuilder.withNumberMultipleOf(3);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithMultipleOf, '7');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.header.incompatible',
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                    'should be multiple of 3',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        mockFile: 'pact.json',
                        value: '7'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: responseHeaderWithMultipleOf.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('maxItems', () => {
        const swaggerPathWithMaxItemsBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withArrayOfNumberMaxItemsNamed('value', 3));

        it('should pass when the pact path contains an value that has the max items', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithMaxItemsBuilder, '1,2,3').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value that exceeds max items', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMaxItemsBuilder, '1,2,3,4');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /1,2,3,4',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/1,2,3,4'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithMaxItemsBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header contains a value that exceeds max items', willResolve(() => {
            const responseHeaderWithMaxItems = responseHeaderBuilder.withArrayOfNumberMaxItems(3);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithMaxItems, '1,2,3,4');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.header.incompatible',
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                    'should NOT have more than 3 items',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        mockFile: 'pact.json',
                        value: '1,2,3,4'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: responseHeaderWithMaxItems.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('minItems', () => {
        const swaggerPathWithMinItemsBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withArrayOfNumberMinItemsNamed('value', 3));

        it('should pass when the pact path contains an value that has the min items', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithMinItemsBuilder, '1,2,3').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value that has less then min items', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMinItemsBuilder, '1,2');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /1,2',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/1,2'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithMinItemsBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header contains a value that has less then min items', willResolve(() => {
            const responseHeaderWithMinItems = responseHeaderBuilder.withArrayOfNumberMinItems(3);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithMinItems, '1,2');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.header.incompatible',
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                    'should NOT have less than 3 items',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        mockFile: 'pact.json',
                        value: '1,2'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: responseHeaderWithMinItems.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('uniqueItems', () => {
        const swaggerPathWithUniqueItemsBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withArrayOfNumberUniqueItemsNamed('value'));

        it('should pass when the pact path contains an value that has unique items', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithUniqueItemsBuilder, '1,2').then((result) => {
                expect(result).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value that does not have unique items', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithUniqueItemsBuilder, '1,1');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.request.path-or-method.unknown',
                    message: 'Path or method not defined in swagger file: GET /1,1',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        mockFile: 'pact.json',
                        value: '/1,1'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        specFile: 'swagger.json',
                        value: {'/{value}': swaggerPathWithUniqueItemsBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header contains a value that does not have unique items', willResolve(() => {
            const responseHeaderWithUniqueItems = responseHeaderBuilder.withArrayOfNumberUniqueItems();
            const result = invokeValidatorWithResponseHeader(responseHeaderWithUniqueItems, '1,1');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    code: 'spv.response.header.incompatible',
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                    'should NOT have duplicate items (items ## 0 and 1 are identical)',
                    mockDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        mockFile: 'pact.json',
                        value: '1,1'
                    },
                    source: 'spec-mock-validation',
                    specDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        specFile: 'swagger.json',
                        value: responseHeaderWithUniqueItems.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });
});
