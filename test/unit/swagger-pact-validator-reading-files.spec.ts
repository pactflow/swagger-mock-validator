import {expectToReject, willResolve} from 'jasmine-promise-tools';
import * as yaml from 'js-yaml';
import * as q from 'q';
import {FileSystem, HttpClient, SwaggerPactValidator, ValidationSuccess} from '../../lib/swagger-pact-validator/types';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {pactBuilder} from './support/pact-builder';
import {operationBuilder, parameterBuilder, pathBuilder, swaggerBuilder} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

declare function expect(actual: any): CustomMatchers;

describe('swagger-pact-validator reading files', () => {
    let mockFiles: {[fileName: string]: q.Promise<string>};
    let mockFileSystem: FileSystem;
    let mockHttpClient: HttpClient;
    let swaggerPactValidator: SwaggerPactValidator;

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);

        mockFiles = {};
        mockFileSystem = swaggerPactValidatorLoader.createMockFileSystem(mockFiles);
        mockHttpClient = swaggerPactValidatorLoader.createMockHttpClient({});
        swaggerPactValidator = swaggerPactValidatorLoader.createInstance();
    });

    const invokeValidate = (swaggerPathOrUrl: string, pactPathOrUrl: string): Promise<ValidationSuccess> =>
        swaggerPactValidator.validate({
            fileSystem: mockFileSystem,
            httpClient: mockHttpClient,
            pactPathOrUrl,
            swaggerPathOrUrl
        }) as any;

    describe('reading the swagger file', () => {
        it('should read the json swagger file from the file system', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));

            return invokeValidate('swagger.json', 'pact.json').then(() => {
                expect(mockFileSystem.readFile).toHaveBeenCalledWith('swagger.json');
            });
        }));

        it('should read the yaml swagger file from the file system', willResolve(() => {
            mockFiles['swagger.yaml'] = q(yaml.safeDump(swaggerBuilder.build()));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));

            return invokeValidate('swagger.yaml', 'pact.json').then(() => {
                expect(mockFileSystem.readFile).toHaveBeenCalledWith('swagger.yaml');
            });
        }));

        it('should return the error when reading the swagger file fails', willResolve(() => {
            mockFiles['swagger.json'] = q.reject<string>(new Error('error-message'));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = invokeValidate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('Unable to read "swagger.json": error-message'));
            });
        }));

        it('should return the error when the swagger file cannot be parsed', willResolve(() => {
            mockFiles['swagger.json'] = q('');
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = invokeValidate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error.message).toEqual(jasmine.stringMatching(
                    'Unable to parse "swagger.json": Unexpected end'
                ));
            });
        }));

        it('should return the error when the swagger file is not valid', willResolve(() => {
            mockFiles['swagger.json'] = q('{}');
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = invokeValidate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('"swagger.json" is not a valid swagger file'));
                expect(error.details).toContainErrors([{
                    message: 'Missing required property: paths',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: null,
                        location: '[pactRoot]',
                        pactFile: 'pact.json',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot]',
                        pathMethod: null,
                        pathName: null,
                        swaggerFile: 'swagger.json',
                        value: null
                    },
                    type: 'error'
                }, {
                    message: 'Missing required property: info',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: null,
                        location: '[pactRoot]',
                        pactFile: 'pact.json',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot]',
                        pathMethod: null,
                        pathName: null,
                        swaggerFile: 'swagger.json',
                        value: null
                    },
                    type: 'error'
                }, {
                    message: 'Missing required property: swagger',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: null,
                        location: '[pactRoot]',
                        pactFile: 'pact.json',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot]',
                        pathMethod: null,
                        pathName: null,
                        swaggerFile: 'swagger.json',
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should indicate the location where the validation error was found', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.withMissingInfoTitle().build()));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));
            const result = invokeValidate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error.details).toContainErrors([{
                    message: 'Missing required property: title',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: null,
                        location: '[pactRoot]',
                        pactFile: 'pact.json',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].info',
                        pathMethod: null,
                        pathName: null,
                        swaggerFile: 'swagger.json',
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));

        it('should return the warning when the swagger file contains warnings', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(
                swaggerBuilder
                    .withParameter('userId', parameterBuilder.withNumberInPathNamed('userId'))
                    .build()
            ));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));

            return invokeValidate('swagger.json', 'pact.json').then((result) => {
                expect(result).toContainWarnings([{
                    message: 'Parameter is defined but is not used: #/parameters/userId',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: null,
                        location: '[pactRoot]',
                        pactFile: 'pact.json',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].parameters.userId',
                        pathMethod: null,
                        pathName: null,
                        swaggerFile: 'swagger.json',
                        value: null
                    },
                    type: 'warning'
                }]);
            });
        }));

        it('should return any warnings when the swagger file contains errors and warnings', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(
                swaggerBuilder
                    .withPath('/account/{accountId}', pathBuilder.withGetOperation(operationBuilder))
                    .withParameter('userId', parameterBuilder.withNumberInPathNamed('userId'))
                    .build()
            ));
            mockFiles['pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = invokeValidate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error.details).toContainWarnings([{
                    message: 'Parameter is defined but is not used: #/parameters/userId',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: null,
                        location: '[pactRoot]',
                        pactFile: 'pact.json',
                        value: null
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].parameters.userId',
                        pathMethod: null,
                        pathName: null,
                        swaggerFile: 'swagger.json',
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

            return invokeValidate('swagger.json', 'pact.json').then(() => {
                expect(mockFileSystem.readFile).toHaveBeenCalledWith('pact.json');
            });
        }));

        it('should return the error when reading the pact file fails', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q.reject<string>(new Error('error-message'));
            const result = invokeValidate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('Unable to read "pact.json": error-message'));
            });
        }));

        it('should return the error when the pact file cannot be parsed as json', willResolve(() => {
            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q('');
            const result = invokeValidate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error.message).toEqual(jasmine.stringMatching(
                    'Unable to parse "pact.json": Unexpected end'
                ));
            });
        }));

        it('should return the error when the pact file is not valid', willResolve(() => {
            const pact = pactBuilder.withMissingInteractions();

            mockFiles['swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockFiles['pact.json'] = q(JSON.stringify(pact.build()));
            const result = invokeValidate('swagger.json', 'pact.json');

            return expectToReject(result).then((error) => {
                expect(error.message).toBe('"pact.json" is not a valid pact file');
                expect(error.details).toContainErrors([{
                    message: 'Missing required property: interactions',
                    pactDetails: {
                        interactionDescription: null,
                        interactionState: null,
                        location: '[pactRoot]',
                        pactFile: 'pact.json',
                        value: pact.build()
                    },
                    source: 'swagger-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot]',
                        pathMethod: null,
                        pathName: null,
                        swaggerFile: 'swagger.json',
                        value: null
                    },
                    type: 'error'
                }]);
            });
        }));
    });
});
