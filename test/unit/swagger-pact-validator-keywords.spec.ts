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
            const responseHeaderWithEnumBuilder = responseHeaderBuilder.withStringEnum(['a']);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithEnumBuilder, 'b');

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
                        value: responseHeaderWithEnumBuilder.build()
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
            const responseHeaderWithEnumBuilder = responseHeaderBuilder.withNumberExclusiveMaximum(100);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithEnumBuilder, '100');

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
                        value: responseHeaderWithEnumBuilder.build()
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
            const swaggerPathWithExclusiveMaximum = defaultSwaggerPathBuilder
                .withParameter(pathParameterBuilder.withNumberExclusiveMinimumNamed('value', 100));
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

        it('should fail when the pact header contains a value equal to the exclusive minimum', willResolve(() => {
            const responseHeaderWithEnumBuilder = responseHeaderBuilder.withNumberExclusiveMinimum(100);
            const result = invokeValidatorWithResponseHeader(responseHeaderWithEnumBuilder, '100');

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
                        value: responseHeaderWithEnumBuilder.build()
                    },
                    type: 'error'
                }]);
            });
        }));
    });
});
