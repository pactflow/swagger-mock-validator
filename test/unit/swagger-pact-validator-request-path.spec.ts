import {expectToReject, willResolve} from 'jasmine-promise-tools';
import customJasmineMatchers from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {operationBuilder, parameterBuilder, pathBuilder, swaggerBuilder} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

describe('swagger-pact-validator request path', () => {
    const expectedFailedValidationError =
        new Error('Pact file "pact.json" is not compatible with swagger file "swagger.json"');

    const invokeSwaggerPactValidator = swaggerPactValidatorLoader.invoke;

    const userIdNumberPathParameterBuilder = parameterBuilder.withNumberInPathNamed('userId');

    const userIdIntegerPathParameterBuilder = parameterBuilder.withIntegerInPathNamed('userId');

    const userIdBooleanPathParameterBuilder = parameterBuilder.withBooleanInPathNamed('userId');

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

        return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
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

        const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

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
        it('should return the error when a pact path partialy matches a shorter swagger spec', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/almost/matches')
                )
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/almost', pathBuilder)
                .build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

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

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

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
                .withGetOperation(operationBuilder.withParameter(userIdNumberPathParameterBuilder));

            const swaggerFile = swaggerBuilder
                .withPath('/almost/matches/{userId}', swaggerPathBuilder)
                .build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

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
                    .withGetOperation(operationBuilder.withParameter(userIdNumberPathParameterBuilder))
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should pass when the parameter is defined on the operation object for a post', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder.withRequestPath('/users/1').withRequestMethodPost())
                .build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', pathBuilder
                    .withPostOperation(operationBuilder.withParameter(userIdNumberPathParameterBuilder))
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should pass when the parameter is defined on the path item object', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(interactionBuilder.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', pathBuilder
                    .withParameter(userIdNumberPathParameterBuilder)
                    .withGetOperation(operationBuilder)
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
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
                .withParameter('userId', userIdNumberPathParameterBuilder)
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should use the operation parameters when there are duplicate parameter definitions', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(interactionBuilder.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', pathBuilder
                    .withGetOperation(operationBuilder.withParameter(userIdNumberPathParameterBuilder))
                    .withParameter(userIdBooleanPathParameterBuilder)
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should use path parameters when operation parameters are defined on a different method', willResolve(() => {
            const pactFile = pactBuilder.withInteraction(interactionBuilder.withRequestPath('/users/1')).build();

            const swaggerFile = swaggerBuilder
                .withPath('/users/{userId}', pathBuilder
                    .withPostOperation(operationBuilder.withParameter(userIdBooleanPathParameterBuilder))
                    .withGetOperation(operationBuilder)
                    .withParameter(userIdNumberPathParameterBuilder)
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));
    });

    describe('number parameters', () => {
        const swaggerPathWithNumberParameterBuilder = pathBuilder
            .withParameter(userIdNumberPathParameterBuilder)
            .withGetOperation(operationBuilder);

        const swaggerWithNumberParameterInPathBuilder = swaggerBuilder
            .withPath('/api/{userId}/comments', swaggerPathWithNumberParameterBuilder);

        it('should pass when the pact path matches a number param defined in the swagger', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder.withRequestPath('/api/1.1/comments'))
                .build();

            const swaggerFile = swaggerWithNumberParameterInPathBuilder.build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should return the error when a pact path has an incorrect type as a number param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/api/foo/comments')
                )
                .build();

            const swaggerFile = swaggerWithNumberParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /api/foo/comments',
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
                        value: {'/api/{userId}/comments': swaggerPathWithNumberParameterBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path has no value as a number param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/api//comments')
                )
                .build();

            const swaggerFile = swaggerWithNumberParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /api//comments',
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
                        value: {'/api/{userId}/comments': swaggerPathWithNumberParameterBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('boolean parameters', () => {
        const swaggerPathWithBooleanParameterBuilder = pathBuilder
            .withParameter(parameterBuilder.withBooleanInPathNamed('enabled'))
            .withGetOperation(operationBuilder);

        const swaggerWithBooleanParameterInPathBuilder = swaggerBuilder
            .withPath('/jobs/renewal/enabled/{enabled}', swaggerPathWithBooleanParameterBuilder);

        it('should pass when the pact path matches a boolean param defined in the swagger', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder.withRequestPath('/jobs/renewal/enabled/true'))
                .build();

            const swaggerFile = swaggerWithBooleanParameterInPathBuilder.build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should return the error when a pact has an incorrect type as a boolean param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/jobs/renewal/enabled/on')
                )
                .build();

            const swaggerFile = swaggerWithBooleanParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /jobs/renewal/enabled/on',
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
                        value: {'/jobs/renewal/enabled/{enabled}': swaggerPathWithBooleanParameterBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('string parameters', () => {
        const swaggerPathWithStringParameterBuilder = pathBuilder
                .withParameter(parameterBuilder.withStringInPathNamed('productName'))
                .withGetOperation(operationBuilder);

        const swaggerWithStringParameterInPathBuilder = swaggerBuilder
            .withPath('/products/{productName}', swaggerPathWithStringParameterBuilder);

        it('should pass when the pact path matches a string param defined in the swagger', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder.withRequestPath('/products/jira'))
                .build();

            const swaggerFile = swaggerWithStringParameterInPathBuilder.build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should return the error when a pact path has no value as a string param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/products/')
                )
                .build();

            const swaggerFile = swaggerWithStringParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /products/',
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
                        value: {'/products/{productName}': swaggerPathWithStringParameterBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('integer parameters', () => {
        const swaggerPathWithIntegerParameterBuilder = pathBuilder
            .withParameter(userIdIntegerPathParameterBuilder)
            .withGetOperation(operationBuilder);

        const swaggerWithIntegerParameterInPathBuilder = swaggerBuilder
            .withPath('/api/{userId}/comments', swaggerPathWithIntegerParameterBuilder);

        it('should pass when the pact path matches a integer param defined in the swagger', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder.withRequestPath('/api/1/comments'))
                .build();

            const swaggerFile = swaggerWithIntegerParameterInPathBuilder.build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
                (expect(result) as any).toContainNoWarnings();
            });
        }));

        it('should return the error when a pact path has an incorrect type as a integer param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/api/1.1/comments')
                )
                .build();

            const swaggerFile = swaggerWithIntegerParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /api/1.1/comments',
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
                        value: {'/api/{userId}/comments': swaggerPathWithIntegerParameterBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the error when a pact path has no value as a integer param', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/api//comments')
                )
                .build();

            const swaggerFile = swaggerWithIntegerParameterInPathBuilder.build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

            return expectToReject(result).then((error) => {
                expect(error).toEqual(expectedFailedValidationError);
                (expect(error.details) as any).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /api//comments',
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
                        value: {'/api/{userId}/comments': swaggerPathWithIntegerParameterBuilder.build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });

    describe('unsupported types', () => {
        it('should return warnings for type parameters that are unsupported', willResolve(() => {
            const pactFile = pactBuilder
                .withInteraction(interactionBuilder
                    .withDescription('interaction description')
                    .withRequestPath('/api/1,2,3/comments'))
                .build();

            const userIdsParameter = parameterBuilder.withArrayOfNumberInPathNamed('userIds');

            const swaggerFile = swaggerBuilder
                .withPath('/api/{userIds}/comments', pathBuilder
                    .withParameter(userIdsParameter)
                    .withGetOperation(operationBuilder)
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
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

            const accountIdsParameter = parameterBuilder.withArrayOfNumberInPathNamed('accountIds');

            const userIdsParameter = parameterBuilder.withArrayOfNumberInPathNamed('userIds');

            const swaggerFile = swaggerBuilder
                .withPath('/{accountIds}/users/{userIds}', pathBuilder
                    .withParameter(accountIdsParameter)
                    .withParameter(userIdsParameter)
                    .withGetOperation(operationBuilder)
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
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

            const userIdsParameter = parameterBuilder.withArrayOfNumberInPathNamed('userIds');

            const swaggerFile = swaggerBuilder
                .withPath('/api/{userIds}/comments', pathBuilder
                    .withGetOperation(operationBuilder.withParameter(userIdsParameter))
                )
                .build();

            return invokeSwaggerPactValidator(swaggerFile, pactFile).then((result) => {
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

            const accountIdParameter = parameterBuilder.withNumberInPathNamed('accountId');
            const getUserIdPath = pathBuilder
                .withGetOperation(operationBuilder.withParameter(userIdNumberPathParameterBuilder))
                .withParameter(accountIdParameter);
            const swaggerFile = swaggerBuilder
                .withPath('/{accountId}/users/{userId}', getUserIdPath)
                .build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

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

            const accountIdParameter = parameterBuilder.withNumberInPathNamed('accountId');
            const getUserIdPath = pathBuilder
                .withGetOperation(operationBuilder.withParameter(userIdNumberPathParameterBuilder))
                .withParameter(accountIdParameter);
            const swaggerFile = swaggerBuilder
                .withPath('/{accountId}/users/{userId}', getUserIdPath)
                .build();

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

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

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

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

            const result = invokeSwaggerPactValidator(swaggerFile, pactFile);

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
