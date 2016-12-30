import {expectToReject, willResolve} from 'jasmine-promise-tools';
import customJasmineMatchers from './support/custom-jasmine-matchers';
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
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

describe('swagger-pact-validator keywords', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

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
        jasmine.addMatchers(customJasmineMatchers);
    });

    describe('enum', () => {
        const swaggerPathWithEnumBuilder = defaultSwaggerPathBuilder
            .withParameter(pathParameterBuilder.withStringEnumNamed('value', ['a']));

        it('should pass when the pact path contains an enum value', willResolve(() =>
            invokeValidatorWithPath(swaggerPathWithEnumBuilder, 'a').then((result) => {
                (expect(result) as any).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path does not contain an enum value', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithEnumBuilder, 'b');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /b',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/b'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
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
                (expect(error.details) as any).toContainErrors([{
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                        'should be equal to one of the allowed values',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        value: 'b'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
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
                (expect(result) as any).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value greater then maximum', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMaximumBuilder, '101');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /101',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/101'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
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
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /100',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/100'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
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
                (expect(error.details) as any).toContainErrors([{
                    message: 'Value is incompatible with the parameter defined in the swagger file: should be < 100',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        value: '100'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
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
                (expect(result) as any).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value less then minimum', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMinimumBuilder, '99');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /99',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/99'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
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
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /100',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/100'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
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
                (expect(error.details) as any).toContainErrors([{
                    message: 'Value is incompatible with the parameter defined in the swagger file: should be > 100',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        value: '100'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
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
                (expect(result) as any).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value length greater then maxLength', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMaxLengthBuilder, 'abcd');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /abcd',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/abcd'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
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
                (expect(error.details) as any).toContainErrors([{
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                        'should NOT be longer than 3 characters',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        value: 'abcd'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
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
                (expect(result) as any).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value length less then minLength', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMinLengthBuilder, 'ab');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /ab',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/ab'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
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
                (expect(error.details) as any).toContainErrors([{
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                    'should NOT be shorter than 3 characters',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        value: 'ab'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
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
                (expect(result) as any).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value that does not match the pattern', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithPatternBuilder, 'abcdefg');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /abcdefg',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/abcdefg'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
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
                (expect(error.details) as any).toContainErrors([{
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                    'should match pattern "^[a-f]+$"',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        value: 'abcdefg'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
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
                (expect(result) as any).toContainNoWarnings();
            })
        ));

        it('should fail when the pact path contains a value that is not a multiple', willResolve(() => {
            const result = invokeValidatorWithPath(swaggerPathWithMultipleOfBuilder, '7');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /7',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/7'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: {'/{value}': swaggerPathWithMultipleOfBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should fail when the pact header contains a value that is not a multiple', willResolve(() => {
            const responseHeaderWithPattern = responseHeaderBuilder.withNumberMultipleOf(3);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithPattern, '7');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                    'should be multiple of 3',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].response.headers.x-value',
                        value: '7'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./does/exist.get.responses.200.headers.x-value',
                        pathMethod: 'get',
                        pathName: '/does/exist',
                        value: responseHeaderWithPattern.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });
});
