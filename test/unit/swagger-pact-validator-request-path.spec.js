'use strict';

const customJasmineMatchers = require('./support/custom-jasmine-matchers');
const expectToReject = require('jasmine-promise-tools').expectToReject;
const pactBuilder = require('./support/pact-builder');
const swaggerBuilder = require('./support/swagger-builder');
const invokeSwaggerPactValidator = require('./support/swagger-pact-validator-loader').invoke;
const willResolve = require('jasmine-promise-tools').willResolve;

describe('swagger-pact-validator request path', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

    beforeEach(() => {
        jasmine.addMatchers(customJasmineMatchers);
    });

    it('should pass when the pact path matches a path defined in the swagger', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(pactBuilder.interaction.withRequestPath('/does/exist'))
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/does/exist', swaggerBuilder.path.withGetOperation(swaggerBuilder.operation))
            .build();

        return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
            expect(result).toContainNoWarnings();
        });
    }));

    it('should return the error when a pact calls a path that is not defined in the swagger', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(pactBuilder.interaction
                .withDescription('interaction description')
                .withRequestPath('/does/not/exist')
            )
            .build();

        const swaggerFile = swaggerBuilder.build();

        const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message: 'Path not defined in swagger file: /does/not/exist',
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
                    value: null
                },
                type: 'error'
            }]);
        });
    }));

    it('should return the error when a pact partialy matches a swagger spec', willResolve(() => {
        const pactFile = pactBuilder
            .withInteraction(pactBuilder.interaction
                .withDescription('interaction description')
                .withRequestPath('/almost/matches')
            )
            .build();

        const swaggerFile = swaggerBuilder
            .withPath('/almost', swaggerBuilder.path)
            .build();

        const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(expectedFailedValidationError);
            expect(error.details).toContainErrors([{
                message: 'Path not defined in swagger file: /almost/matches',
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
                    value: null
                },
                type: 'error'
            }]);
        });
    }));

    describe('location of parameter definitions', () => {
        it('should pass when the parameter is defined on the operation object', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(pactBuilder.interaction.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', swaggerBuilder.path
                    .withGetOperation(swaggerBuilder.operation
                        .withParameter(swaggerBuilder.parameter
                            .withName('userId')
                            .withInPath()
                            .withTypeNumber()
                        )
                    )
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should pass when the parameter is defined on the operation object for a post', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction.withRequestPath('/users/1').withRequestMethodPost())
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', swaggerBuilder.path
                    .withPostOperation(swaggerBuilder.operation
                        .withParameter(swaggerBuilder.parameter
                            .withName('userId')
                            .withInPath()
                            .withTypeNumber()
                        )
                    )
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should pass when the parameter is defined on the path item object', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(pactBuilder.interaction.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', swaggerBuilder.path
                    .withParameter(swaggerBuilder.parameter
                        .withName('userId')
                        .withInPath()
                        .withTypeNumber()
                    )
                    .withGetOperation(swaggerBuilder.operation)
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should pass when the parameter is defined on the swagger object', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(pactBuilder.interaction.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', swaggerBuilder.path
                    .withParameterReference('userId')
                    .withGetOperation(swaggerBuilder.operation)
                )
                .withParameter('userId', swaggerBuilder.parameter
                    .withName('userId')
                    .withInPath()
                    .withTypeNumber()
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should use the operation parameters when there are duplicate parameter definitions', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(pactBuilder.interaction.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', swaggerBuilder.path
                    .withGetOperation(swaggerBuilder.operation
                        .withParameter(swaggerBuilder.parameter
                            .withName('userId')
                            .withInPath()
                            .withTypeNumber()
                        )
                    )
                    .withParameter(swaggerBuilder.parameter
                        .withName('userId')
                        .withInPath()
                        .withTypeBoolean()
                    )
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should use path parameters when operation parameters are defined on a different method', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(pactBuilder.interaction.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', swaggerBuilder.path
                    .withPostOperation(swaggerBuilder.operation
                        .withParameter(swaggerBuilder.parameter
                            .withName('userId')
                            .withInPath()
                            .withTypeBoolean()
                        )
                    )
                    .withGetOperation(swaggerBuilder.operation)
                    .withParameter(swaggerBuilder.parameter
                        .withName('userId')
                        .withInPath()
                        .withTypeNumber()
                    )
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should ignore path parameters that have no parameter definition', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withRequestPath('/users/1')
                    .withDescription('interaction description')
                )
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', swaggerBuilder.path)
                .build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error.details).toContainWarnings([{
                    message: 'No parameter definition found for "userId", assuming value is valid',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '1'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./users/{userId}',
                        pathMethod: null,
                        pathName: '/users/{userId}',
                        value: null
                    },
                    type: 'warning'
                }]);
            });
        }));
    });

    describe('number parameters', () => {
        const swaggerWithNumberParameterInPathBuilder = swaggerBuilder
            .withPath('/api/{userId}/comments', swaggerBuilder.path
                .withParameter(swaggerBuilder.parameter
                    .withName('userId')
                    .withInPath()
                    .withTypeNumber()
                )
                .withGetOperation(swaggerBuilder.operation)
            );

        it('should pass when the pact path matches a number param defined in the swagger', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction.withRequestPath('/api/1.1/comments'))
                .build();

            const swaggerFile = swaggerWithNumberParameterInPathBuilder.build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should return the error when a pact path has an incorrect type as a number param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/api/foo/comments')
                )
                .build();

            const swaggerFile = swaggerWithNumberParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    message: 'Path not defined in swagger file: /api/foo/comments',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/api/foo/comments'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path has no value as a number param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/api//comments')
                )
                .build();

            const swaggerFile = swaggerWithNumberParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    message: 'Path not defined in swagger file: /api//comments',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/api//comments'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('boolean parameters', () => {
        const swaggerWithBooleanParameterInPathBuilder = swaggerBuilder
            .withPath('/jobs/renewal/enabled/{enabled}', swaggerBuilder.path
                .withParameter(swaggerBuilder.parameter
                    .withName('enabled')
                    .withInPath()
                    .withTypeBoolean()
                )
                .withGetOperation(swaggerBuilder.operation)
            );

        it('should pass when the pact path matches a boolean param defined in the swagger', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction.withRequestPath('/jobs/renewal/enabled/true'))
                .build();

            const swaggerFile = swaggerWithBooleanParameterInPathBuilder.build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should return the error when a pact has an incorrect type as a boolean param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/jobs/renewal/enabled/on')
                )
                .build();

            const swaggerFile = swaggerWithBooleanParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    message: 'Path not defined in swagger file: /jobs/renewal/enabled/on',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/jobs/renewal/enabled/on'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('string parameters', () => {
        const swaggerWithStringParameterInPathBuilder = swaggerBuilder
            .withPath('/products/{productName}', swaggerBuilder.path
                .withParameter(swaggerBuilder.parameter
                    .withName('productName')
                    .withInPath()
                    .withTypeString()
                )
                .withGetOperation(swaggerBuilder.operation)
            );

        it('should pass when the pact path matches a string param defined in the swagger', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction.withRequestPath('/products/jira'))
                .build();

            const swaggerFile = swaggerWithStringParameterInPathBuilder.build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should return the error when a pact path has no value as a string param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/products/')
                )
                .build();

            const swaggerFile = swaggerWithStringParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    message: 'Path not defined in swagger file: /products/',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/products/'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('integer parameters', () => {
        const userIdParameter = swaggerBuilder.parameter
            .withName('userId')
            .withInPath()
            .withTypeInteger();

        const swaggerWithIntegerParameterInPathBuilder = swaggerBuilder
            .withPath('/api/{userId}/comments', swaggerBuilder.path
                .withParameter(userIdParameter)
                .withGetOperation(swaggerBuilder.operation)
            );

        it('should pass when the pact path matches a integer param defined in the swagger', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction.withRequestPath('/api/1/comments'))
                .build();

            const swaggerFile = swaggerWithIntegerParameterInPathBuilder.build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainNoWarnings();
            });
        }));

        it('should return the error when a pact path has an incorrect type as a integer param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/api/1.1/comments')
                )
                .build();

            const swaggerFile = swaggerWithIntegerParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    message: 'Path not defined in swagger file: /api/1.1/comments',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/api/1.1/comments'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path has no value as a integer param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/api//comments')
                )
                .build();

            const swaggerFile = swaggerWithIntegerParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    message: 'Path not defined in swagger file: /api//comments',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '/api//comments'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('unsupported types', () => {
        it('should return warnings for type parameters that are unsupported', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/api/1,2,3/comments'))
                .build();

            const userIdsParameter = swaggerBuilder.parameter
                .withName('userIds')
                .withInPath()
                .withTypeArrayOfNumber();

            const swaggerFile = swaggerBuilder
                .withPath('/api/{userIds}/comments', swaggerBuilder.path
                    .withParameter(userIdsParameter)
                    .withGetOperation(swaggerBuilder.operation)
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainWarnings([{
                    message: 'Validating parameters of type "array" are not supported, assuming value is valid',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '1,2,3'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./api/{userIds}/comments.parameters[0]',
                        pathMethod: null,
                        pathName: '/api/{userIds}/comments',
                        value: userIdsParameter.build()
                    },
                    type: 'warning'
                }]);
            });
        }));

        it('should return multiple warnings when multiple parameters have unsupported types', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/1,2,3/users/4,5,6'))
                .build();

            const accountIdsParameter = swaggerBuilder.parameter
                .withName('accountIds')
                .withInPath()
                .withTypeArrayOfNumber();

            const userIdsParameter = swaggerBuilder.parameter
                .withName('userIds')
                .withInPath()
                .withTypeArrayOfNumber();

            const swaggerFile = swaggerBuilder
                .withPath('/{accountIds}/users/{userIds}', swaggerBuilder.path
                    .withParameter(accountIdsParameter)
                    .withParameter(userIdsParameter)
                    .withGetOperation(swaggerBuilder.operation)
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainWarnings([{
                    message: 'Validating parameters of type "array" are not supported, assuming value is valid',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '1,2,3'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./{accountIds}/users/{userIds}.parameters[0]',
                        pathMethod: null,
                        pathName: '/{accountIds}/users/{userIds}',
                        value: accountIdsParameter.build()
                    },
                    type: 'warning'
                }, {
                    message: 'Validating parameters of type "array" are not supported, assuming value is valid',
                    pactDetails: {
                        interactionDescription: 'interaction description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        value: '4,5,6'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths./{accountIds}/users/{userIds}.parameters[1]',
                        pathMethod: null,
                        pathName: '/{accountIds}/users/{userIds}',
                        value: userIdsParameter.build()
                    },
                    type: 'warning'
                }]);
            });
        }));

        it('should return a warning for unsupported parameters that are defined on the operation', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/api/1,2,3/comments'))
                .build();

            const userIdsParameter = swaggerBuilder.parameter
                .withName('userIds')
                .withInPath()
                .withTypeArrayOfNumber();

            const swaggerFile = swaggerBuilder
                .withPath('/api/{userIds}/comments', swaggerBuilder.path
                    .withGetOperation(swaggerBuilder.operation.withParameter(userIdsParameter))
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                expect(result).toContainWarnings([{
                    message: 'Validating parameters of type "array" are not supported, assuming value is valid',
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
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/1/users/a')
                )
                .build();

            const userIdParameter = swaggerBuilder.parameter.withNumberInPathNamed('userId');
            const accountIdParameter = swaggerBuilder.parameter.withNumberInPathNamed('accountId');
            const swaggerFile = swaggerBuilder
                .withPath('/{accountId}/users/{userId}', swaggerBuilder.path
                    .withGetOperation(swaggerBuilder.operation.withParameter(userIdParameter))
                    .withParameter(accountIdParameter)
                )
                .build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    message: 'Path not defined in swagger file: /1/users/a',
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
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('multiple interactions', () => {
        it('should validate multiple interactions', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/1/users/a')
                )
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/a/users/1')
                )
                .build();

            const userIdParameter = swaggerBuilder.parameter.withNumberInPathNamed('userId');
            const accountIdParameter = swaggerBuilder.parameter.withNumberInPathNamed('accountId');
            const swaggerFile = swaggerBuilder
                .withPath('/{accountId}/users/{userId}', swaggerBuilder.path
                    .withGetOperation(swaggerBuilder.operation.withParameter(userIdParameter))
                    .withParameter(accountIdParameter)
                )
                .build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    message: 'Path not defined in swagger file: /1/users/a',
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
                        value: null
                    },
                    type: 'error'
                }, {
                    message: 'Path not defined in swagger file: /a/users/1',
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
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('malformed parameters', () => {
        it('should not treat a path segment starting with a { character as a parameters', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/users/1')
                )
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId', swaggerBuilder.path.withGetOperation(swaggerBuilder.operation))
                .build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    message: 'Path not defined in swagger file: /users/1',
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
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should not treat a path segment ending with a } character as a parameters', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(pactBuilder.interaction
                    .withDescription('interaction description')
                    .withRequestPath('/users/1')
                )
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/userId}', swaggerBuilder.path.withGetOperation(swaggerBuilder.operation))
                .build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                expect(error.details).toContainErrors([{
                    message: 'Path not defined in swagger file: /users/1',
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
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));
    });
});
