'use strict';

const customJasmineMatchers = require('./support/custom-jasmine-matchers');
const expectToReject = require('jasmine-promise-tools').expectToReject;
const q = require('q');
const pactBuilder = require('./support/pact-builder');
const swaggerBuilder = require('./support/swagger-builder');
const swaggerPactValidatorLoader = require('./support/swagger-pact-validator-loader');
const willResolve = require('jasmine-promise-tools').willResolve;

describe('swagger-pact-validator reading files', () => {
    let mockFiles;
    let mockFileSystem;
    let swaggerPactValidator;

    beforeEach(() => {
        jasmine.addMatchers(customJasmineMatchers);

        mockFiles = {};
        mockFileSystem = swaggerPactValidatorLoader.createMockFileSystem(mockFiles);
        const mockHttpClient = swaggerPactValidatorLoader.createMockHttpClient({});

        swaggerPactValidator = swaggerPactValidatorLoader.createInstance(mockFileSystem, mockHttpClient);
    });

    describe('reading the swagger file', () => {
        it('should read the swagger file from the file system', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));

            return swaggerPactValidator.validate('swagger.json', 'pact.json').then(() => {
                expect(mockFileSystem.readFile).toHaveBeenCalledWith('swagger.json');
            });
        }));

        it('should return the error when reading the swagger file fails', willResolve(() => {
            mockFiles['swagger.json'] = q.reject(new Error('error-message'));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('Unable to read "swagger.json": error-message'));
            });
        }));

        it('should return the error when the swagger file cannot be parsed as json', willResolve(() => {
            mockFiles['swagger.json'] = q('');
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(
                    new Error('Unable to parse "swagger.json" as json: Unexpected end of JSON input')
                );
            });
        }));

        it('should return the error when the swagger file is not valid', willResolve(() => {
            mockFiles['swagger.json'] = q('{}');
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('"swagger.json" is not a valid swagger file'));
                expect(error.details).toContainErrors([{
                    message: 'Missing required property: paths',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: '[none]',
                        location: '[pactRoot]',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot]',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'error'
                }, {
                    message: 'Missing required property: info',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: '[none]',
                        location: '[pactRoot]',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot]',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'error'
                }, {
                    message: 'Missing required property: swagger',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: '[none]',
                        location: '[pactRoot]',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot]',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should indicate the location where the validation error was found', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.withMissingInfoTitle().build()));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error.details).toContainErrors([{
                    message: 'Missing required property: title',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: '[none]',
                        location: '[pactRoot]',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].info',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the warning when the swagger file contains warnings', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(
                swaggerBuilder
                    .withParameter('userId', swaggerBuilder.parameter.withNumberInPathNamed('userId'))
                    .build()
            ));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));

            return swaggerPactValidator.validate('swagger.json', 'pact.json').then((result) => {
                expect(result).toContainWarnings([{
                    message: 'Parameter is defined but is not used: #/parameters/userId',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: '[none]',
                        location: '[pactRoot]',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].parameters.userId',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'warning'
                }]);
            });
        }));

        it('should return any warnings when the swagger file contains errors and warnings', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(
                swaggerBuilder
                    .withPath('/account/{accountId}', swaggerBuilder.path.withGetOperation(swaggerBuilder.operation))
                    .withParameter('userId', swaggerBuilder.parameter.withNumberInPathNamed('userId'))
                    .build()
            ));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error.details).toContainWarnings([{
                    message: 'Parameter is defined but is not used: #/parameters/userId',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: '[none]',
                        location: '[pactRoot]',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].parameters.userId',
                        pathMethod: null,
                        pathName: null,
                        value: null
                    },
                    type: 'warning'
                }]);
            });
        }));
    });

    describe('reading the pact file', () => {
        it('should read the pact file from the file system', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));

            return swaggerPactValidator.validate('swagger.json', 'pact.json').then(() => {
                expect(mockFileSystem.readFile).toHaveBeenCalledWith('pact.json');
            });
        }));

        it('should return the error when reading the pact file fails', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q.reject(new Error('error-message'));
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('Unable to read "pact.json": error-message'));
            });
        }));

        it('should return the error when the pact file cannot be parsed as json', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q('');
            const result = swaggerPactValidator.validate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('Unable to parse "pact.json" as json: Unexpected end of JSON input'));
            });
        }));
    });
});
