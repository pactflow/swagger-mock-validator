import {expectToReject, willResolve} from 'jasmine-promise-tools';
import customJasmineMatchers from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    PathBuilder,
    pathBuilder,
    pathParameterBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

describe('swagger-pact-validator request path', () => {
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

    beforeEach(() => {
        jasmine.addMatchers(customJasmineMatchers);
    });

    it('should pass when the pact path matches a path defined in the swagger', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder.withRequestPath('/does/exist'))
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder))
            .build();

        return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
            (expect(result) as any).toContainNoWarnings();
        });
    }));

    it('should return the error when a pact calls a path that is not defined in the swagger', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(interactionBuilder
                .withDescription('interaction description')
                .withRequestPath('/does/not/exist')
            )
            .build();

        const swaggerFile = swaggerBuilder.build();

        const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            (expect(error.details) as any).toContainErrors([{
                message: 'Path or method not defined in swagger file: GET /does/not/exist',
                pactDetails: {
                    interactionDescription: 'interaction description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.path',
                    value: '/does/not/exist'
                },
                source: 'swagger-pact-validation',
                swaggerDetails: {
                    location: '[swaggerRoot].paths',
                    pathMethod: null,
                    pathName: null,
                    value: {}
                },
                type: 'error'
            }]);
        });
    }));

    describe('partial matching', () => {
        it('should return the error when a pact path partially matches a shorter swagger spec', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/almost/matches')
                )
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/almost', pathBuilder)
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /almost/matches',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/almost/matches'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: {'/almost': {}}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path partially matches a longer swagger spec', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/almost')
                )
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/almost/matches', pathBuilder)
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /almost',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/almost'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: {'/almost/matches': {}}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact partially matches a swagger spec with params', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/almost')
                )
                .build();

            const swaggerPathBuilder = pathBuilder
                .withGetOperation(operationBuilder.withParameter(pathParameterBuilder.withNumberNamed('userId')));

            const swaggerFile = swaggerBuilder
                .withPath('/almost/matches/{userId}', swaggerPathBuilder)
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /almost',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/almost'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: {'/almost/matches/{userId}': swaggerPathBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('location of parameter definitions', () => {
        it('should pass when the parameter is defined on the operation object', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(interactionBuilder.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', pathBuilder
                    .withGetOperation(operationBuilder.withParameter(pathParameterBuilder.withNumberNamed('userId')))
                )
                .build();

            return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should pass when the parameter is defined on the operation object for a post', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder.withRequestPath('/users/1').withRequestMethodPost())
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', pathBuilder
                    .withPostOperation(operationBuilder.withParameter(pathParameterBuilder.withNumberNamed('userId')))
                )
                .build();

            return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should pass when the parameter is defined on the path item object', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(interactionBuilder.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', pathBuilder
                    .withParameter(pathParameterBuilder.withNumberNamed('userId'))
                    .withGetOperation(operationBuilder)
                )
                .build();

            return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should pass when the parameter is defined on the swagger object', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(interactionBuilder.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', pathBuilder
                    .withParameterReference('userId')
                    .withGetOperation(operationBuilder)
                )
                .withParameter('userId', pathParameterBuilder.withNumberNamed('userId'))
                .build();

            return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should use the operation parameters when there are duplicate parameter definitions', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(interactionBuilder.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', pathBuilder
                    .withGetOperation(operationBuilder.withParameter(pathParameterBuilder.withNumberNamed('userId')))
                    .withParameter(pathParameterBuilder.withBooleanNamed('userId'))
                )
                .build();

            return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should use path parameters when operation parameters are defined on a different method', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(interactionBuilder.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', pathBuilder
                    .withPostOperation(operationBuilder.withParameter(pathParameterBuilder.withBooleanNamed('userId')))
                    .withGetOperation(operationBuilder)
                    .withParameter(pathParameterBuilder.withNumberNamed('userId'))
                )
                .build();

            return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));
    });

    describe('parameter types', () => {
        describe('number parameters', () => {
            const swaggerPathWithNumberParameterBuilder = defaultSwaggerPathBuilder
                .withParameter(pathParameterBuilder.withNumberNamed('value'));

            it('should pass when the pact path matches a number param defined in the swagger', willResolve(() =>
                invokeValidatorWithPath(swaggerPathWithNumberParameterBuilder, '1.1').then((result) => {
                    (expect(result) as any).toContainNoWarnings();
                })
            ));

            it('should return the error when a pact path has an incorrect type as a number param', willResolve(() => {
                const result = invokeValidatorWithPath(swaggerPathWithNumberParameterBuilder, 'foo');

                return expectToReject(result).then((error) => {
                    expect(error).toEqual(expectedFailedValidationError);
                    (expect(error.details) as any).toContainErrors([{
                        message: 'Path or method not defined in swagger file: GET /foo',
                        pactDetails: {
                            interactionDescription: 'interaction description',
                            interactionState: '[none]',
                            location: '[pactRoot].interactions[0].request.path',
                            value: '/foo'
                        },
                        source: 'swagger-pact-validation',
                        swaggerDetails: {
                            location: '[swaggerRoot].paths',
                            pathMethod: null,
                            pathName: null,
                            value: {'/{value}': swaggerPathWithNumberParameterBuilder.build()}
                        },
                        type: 'error'
                    }]);
                });
            }));

            it('should return the error when a pact path has no value as a number param', willResolve(() => {
                const result = invokeValidatorWithPath(swaggerPathWithNumberParameterBuilder, '');

                return expectToReject(result).then((error) => {
                    expect(error).toEqual(expectedFailedValidationError);
                    (expect(error.details) as any).toContainErrors([{
                        message: 'Path or method not defined in swagger file: GET /',
                        pactDetails: {
                            interactionDescription: 'interaction description',
                            interactionState: '[none]',
                            location: '[pactRoot].interactions[0].request.path',
                            value: '/'
                        },
                        source: 'swagger-pact-validation',
                        swaggerDetails: {
                            location: '[swaggerRoot].paths',
                            pathMethod: null,
                            pathName: null,
                            value: {'/{value}': swaggerPathWithNumberParameterBuilder.build()}
                        },
                        type: 'error'
                    }]);
                });
            }));
        });

        describe('boolean parameters', () => {
            const swaggerPathWithBooleanParameterBuilder = defaultSwaggerPathBuilder
                .withParameter(pathParameterBuilder.withBooleanNamed('value'));

            it('should pass when the pact path matches a boolean param defined in the swagger', willResolve(() =>
                invokeValidatorWithPath(swaggerPathWithBooleanParameterBuilder, 'true').then((result) => {
                    (expect(result) as any).toContainNoWarnings();
                })
            ));

            it('should return the error when a pact has an incorrect type as a boolean param', willResolve(() => {
                const result = invokeValidatorWithPath(swaggerPathWithBooleanParameterBuilder, 'on');

                return expectToReject(result).then((error) => {
                    expect(error).toEqual(expectedFailedValidationError);
                    (expect(error.details) as any).toContainErrors([{
                        message: 'Path or method not defined in swagger file: GET /on',
                        pactDetails: {
                            interactionDescription: 'interaction description',
                            interactionState: '[none]',
                            location: '[pactRoot].interactions[0].request.path',
                            value: '/on'
                        },
                        source: 'swagger-pact-validation',
                        swaggerDetails: {
                            location: '[swaggerRoot].paths',
                            pathMethod: null,
                            pathName: null,
                            value: {'/{value}': swaggerPathWithBooleanParameterBuilder.build()}
                        },
                        type: 'error'
                    }]);
                });
            }));
        });

        describe('string parameters', () => {
            const swaggerPathWithStringParameterBuilder = defaultSwaggerPathBuilder
                .withParameter(pathParameterBuilder.withStringNamed('value'));

            it('should pass when the pact path matches a string param defined in the swagger', willResolve(() =>
                invokeValidatorWithPath(swaggerPathWithStringParameterBuilder, 'jira').then((result) => {
                    (expect(result) as any).toContainNoWarnings();
                })
            ));

            it('should return the error when a pact path has no value as a string param', willResolve(() => {
                const result = invokeValidatorWithPath(swaggerPathWithStringParameterBuilder, '');

                return expectToReject(result).then((error) => {
                    expect(error).toEqual(expectedFailedValidationError);
                    (expect(error.details) as any).toContainErrors([{
                        message: 'Path or method not defined in swagger file: GET /',
                        pactDetails: {
                            interactionDescription: 'interaction description',
                            interactionState: '[none]',
                            location: '[pactRoot].interactions[0].request.path',
                            value: '/'
                        },
                        source: 'swagger-pact-validation',
                        swaggerDetails: {
                            location: '[swaggerRoot].paths',
                            pathMethod: null,
                            pathName: null,
                            value: {'/{value}': swaggerPathWithStringParameterBuilder.build()}
                        },
                        type: 'error'
                    }]);
                });
            }));
        });

        describe('integer parameters', () => {
            const swaggerPathWithIntegerParameterBuilder = defaultSwaggerPathBuilder
                .withParameter(pathParameterBuilder.withIntegerNamed('value'));

            it('should pass when the pact path matches a integer param defined in the swagger', willResolve(() =>
                invokeValidatorWithPath(swaggerPathWithIntegerParameterBuilder, '1').then((result) => {
                    (expect(result) as any).toContainNoWarnings();
                })
            ));

            it('should return the error when a pact path has an incorrect type as a integer param', willResolve(() => {
                const result = invokeValidatorWithPath(swaggerPathWithIntegerParameterBuilder, '1.1');

                return expectToReject(result).then((error) => {
                    expect(error).toEqual(expectedFailedValidationError);
                    (expect(error.details) as any).toContainErrors([{
                        message: 'Path or method not defined in swagger file: GET /1.1',
                        pactDetails: {
                            interactionDescription: 'interaction description',
                            interactionState: '[none]',
                            location: '[pactRoot].interactions[0].request.path',
                            value: '/1.1'
                        },
                        source: 'swagger-pact-validation',
                        swaggerDetails: {
                            location: '[swaggerRoot].paths',
                            pathMethod: null,
                            pathName: null,
                            value: {'/{value}': swaggerPathWithIntegerParameterBuilder.build()}
                        },
                        type: 'error'
                    }]);
                });
            }));

            it('should return the error when a pact path has no value as a integer param', willResolve(() => {
                const result = invokeValidatorWithPath(swaggerPathWithIntegerParameterBuilder, '');

                return expectToReject(result).then((error) => {
                    expect(error).toEqual(expectedFailedValidationError);
                    (expect(error.details) as any).toContainErrors([{
                        message: 'Path or method not defined in swagger file: GET /',
                        pactDetails: {
                            interactionDescription: 'interaction description',
                            interactionState: '[none]',
                            location: '[pactRoot].interactions[0].request.path',
                            value: '/'
                        },
                        source: 'swagger-pact-validation',
                        swaggerDetails: {
                            location: '[swaggerRoot].paths',
                            pathMethod: null,
                            pathName: null,
                            value: {'/{value}': swaggerPathWithIntegerParameterBuilder.build()}
                        },
                        type: 'error'
                    }]);
                });
            }));
        });
    });

    describe('unsupported types', () => {
        it('should return warnings for type parameters that are unsupported', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/api/1,2,3/comments'))
                .build();

            const userIdsParameter = pathParameterBuilder.withArrayOfNumberNamed('userIds');

            const swaggerFile = swaggerBuilder
                .withPath('/api/{userIds}/comments', pathBuilder
                    .withParameter(userIdsParameter)
                    .withGetOperation(operationBuilder)
                )
                .build();

            return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainWarnings([{
                    message:
                        'Validating parameters of type "array" are not supported, assuming value is valid: userIds',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '1,2,3'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./api/{userIds}/comments.parameters[0]',
                        pathMethod: 'get',
                        pathName: '/api/{userIds}/comments',
                        value: userIdsParameter.build()
                    },
                    type: 'warning'
                }]);
            });
        }));

        it('should return multiple warnings when multiple parameters have unsupported types', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/1,2,3/users/4,5,6'))
                .build();

            const accountIdsParameter = pathParameterBuilder.withArrayOfNumberNamed('accountIds');

            const userIdsParameter = pathParameterBuilder.withArrayOfNumberNamed('userIds');

            const swaggerFile = swaggerBuilder
                .withPath('/{accountIds}/users/{userIds}', pathBuilder
                    .withParameter(accountIdsParameter)
                    .withParameter(userIdsParameter)
                    .withGetOperation(operationBuilder)
                )
                .build();

            return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainWarnings([{
                    message:
                        'Validating parameters of type "array" are not supported, assuming value is valid: accountIds',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '1,2,3'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./{accountIds}/users/{userIds}.parameters[0]',
                        pathMethod: 'get',
                        pathName: '/{accountIds}/users/{userIds}',
                        value: accountIdsParameter.build()
                    },
                    type: 'warning'
                }, {
                    message:
                        'Validating parameters of type "array" are not supported, assuming value is valid: userIds',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '4,5,6'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./{accountIds}/users/{userIds}.parameters[1]',
                        pathMethod: 'get',
                        pathName: '/{accountIds}/users/{userIds}',
                        value: userIdsParameter.build()
                    },
                    type: 'warning'
                }]);
            });
        }));

        it('should return a warning for unsupported parameters that are defined on the operation', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/api/1,2,3/comments'))
                .build();

            const userIdsParameter = pathParameterBuilder.withArrayOfNumberNamed('userIds');

            const swaggerFile = swaggerBuilder
                .withPath('/api/{userIds}/comments', pathBuilder
                    .withGetOperation(operationBuilder.withParameter(userIdsParameter))
                )
                .build();

            return swaggerPactValidatorLoader.invoke(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainWarnings([{
                    message:
                        'Validating parameters of type "array" are not supported, assuming value is valid: userIds',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '1,2,3'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./api/{userIds}/comments.get.parameters[0]',
                        pathMethod: 'get',
                        pathName: '/api/{userIds}/comments',
                        value: userIdsParameter.build()
                    },
                    type: 'warning'
                }]);
            });
        }));
    });

    describe('multiple parameters', () => {
        it('should validate multiple parameters', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/1/users/a')
                )
                .build();

            const accountIdParameter = pathParameterBuilder.withNumberNamed('accountId');
            const getUserIdPath = pathBuilder
                .withGetOperation(operationBuilder.withParameter(pathParameterBuilder.withNumberNamed('userId')))
                .withParameter(accountIdParameter);
            const swaggerFile = swaggerBuilder
                .withPath('/{accountId}/users/{userId}', getUserIdPath)
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /1/users/a',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/1/users/a'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: {'/{accountId}/users/{userId}': getUserIdPath.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('multiple interactions', () => {
        it('should validate multiple interactions', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/1/users/a')
                )
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/a/users/1')
                )
                .build();

            const accountIdParameter = pathParameterBuilder.withNumberNamed('accountId');
            const getUserIdPath = pathBuilder
                .withGetOperation(operationBuilder.withParameter(pathParameterBuilder.withNumberNamed('userId')))
                .withParameter(accountIdParameter);
            const swaggerFile = swaggerBuilder
                .withPath('/{accountId}/users/{userId}', getUserIdPath)
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /1/users/a',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/1/users/a'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: {'/{accountId}/users/{userId}': getUserIdPath.build()}
                    },
                    type: 'error'
                }, {
                    message: 'Path or method not defined in swagger file: GET /a/users/1',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[1].request.path',
                        value: '/a/users/1'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: {'/{accountId}/users/{userId}': getUserIdPath.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('malformed parameters', () => {
        it('should not treat a path segment starting with a { character as a parameters', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/users/1')
                )
                .build();

            const getUserPath = pathBuilder.withGetOperation(operationBuilder);

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId', getUserPath)
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /users/1',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/users/1'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: {'/users/{userId': getUserPath.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should not treat a path segment ending with a } character as a parameters', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/users/1')
                )
                .build();

            const getUserPath = pathBuilder.withGetOperation(operationBuilder);

            const swaggerFile = swaggerBuilder
                .withPath('/users/userId}', getUserPath)
                .build();

            const result = swaggerPactValidatorLoader.invoke(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /users/1',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/users/1'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: {'/users/userId}': getUserPath.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });
});
