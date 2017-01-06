import {expectToReject, willResolve} from 'jasmine-promise-tools';
import * as q from 'q';
import {FileSystem, HttpClient, SwaggerPactValidator, ValidationSuccess} from '../../lib/swagger-pact-validator/types';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {pactBrokerBuilder, providerPactsBuilder} from './support/pact-broker-builder';
import {pactBuilder} from './support/pact-builder';
import {interactionBuilder} from './support/pact-builder/interaction-builder';
import {operationBuilder, pathBuilder, swaggerBuilder} from './support/swagger-builder';
import swaggerPactValidatorLoader from './support/swagger-pact-validator-loader';

declare function expect(actual: any): CustomMatchers;

describe('swagger-pact-validator reading urls', () => {
    let mockFileSystem: FileSystem;
    let mockHttpClient: HttpClient;
    let mockUrls: {[url: string]: q.Promise<string>};
    let swaggerPactValidator: SwaggerPactValidator;

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);

        mockUrls = {};
        mockHttpClient = swaggerPactValidatorLoader.createMockHttpClient(mockUrls);
        mockFileSystem = swaggerPactValidatorLoader.createMockFileSystem({});

        swaggerPactValidator = swaggerPactValidatorLoader.createInstance();
    });

    const invokeValidate = (
        swaggerPathOrUrl: string,
        pactPathOrUrl: string,
        providerName?: string
    ): Promise<ValidationSuccess> =>
        swaggerPactValidator.validate({
            fileSystem: mockFileSystem,
            httpClient: mockHttpClient,
            pactPathOrUrl,
            providerName,
            swaggerPathOrUrl
        }) as any;

    describe('reading the swagger file', () => {
        it('should make a request for a http swagger url', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return result.then(() => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('http://domain.com/swagger.json');
            });
        }));

        it('should make a request for a https swagger url', willResolve(() => {
            mockUrls['https://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = invokeValidate(
                'https://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return result.then(() => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('https://domain.com/swagger.json');
            });
        }));

        it('should return the error when making the request fails', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q.reject<string>(new Error('error-message'));
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return expectToReject(result).then((error) =>
                expect(error).toEqual(new Error('Unable to read "http://domain.com/swagger.json": error-message'))
            );
        }));

        it('should return the error when the swagger file cannot be parsed as json', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q('');
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return expectToReject(result).then((error) => {
                expect(error.message).toEqual(jasmine.stringMatching(
                    'Unable to parse "http://domain.com/swagger.json" as json: Unexpected end'
                ));
            });
        }));
    });

    describe('reading the pact file', () => {
        it('should make a request for a http pact url', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactBuilder.build()));

            const result = invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return result.then(() => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('http://domain.com/pact.json');
            });
        }));

        it('should return the error when reading the pact file fails', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q.reject<string>(new Error('error-message'));

            const result = invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return expectToReject(result).then((error) =>
                expect(error).toEqual(new Error('Unable to read "http://domain.com/pact.json": error-message'))
            );
        }));

        it('should return the error when the pact file cannot be parsed as json', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = q('');

            const result = invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            return expectToReject(result).then((error) => {
                expect(error.message).toEqual(jasmine.stringMatching(
                    'Unable to parse "http://domain.com/pact.json" as json: Unexpected end'
                ));
            });
        }));
    });

    describe('reading from the pact broker', () => {
        beforeEach(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://pact-broker.com'] = q(JSON.stringify(pactBrokerBuilder.build()));
            mockUrls['http://default-pact-broker.com/provider-name/pacts'] = q(JSON.stringify(
                providerPactsBuilder
                    .withPact('http://default-pact-broker.com/provider-name/default-consumer/pact')
                    .build()
            ));
            mockUrls['http://default-pact-broker.com/provider-name/default-consumer/pact'] =
                q(JSON.stringify(pactBuilder.build()));
        });

        const invokeValidateWithPactBroker = (pactBrokerUrl: string, providerName: string) => {
            return invokeValidate('http://domain.com/swagger.json', pactBrokerUrl, providerName);
        };

        it('should make a request to the root of the pact broker', willResolve(() =>
            invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name').then(() => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('http://pact-broker.com');
            })
        ));

        it('should return the error when the request to the root of the pact broker fails', willResolve(() => {
            mockUrls['http://pact-broker.com'] = q.reject<string>(new Error('error-message'));

            const result = invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('Unable to read "http://pact-broker.com": error-message'));
            });
        }));

        it('should return the error when no url for latest pact files is in the pact root response', willResolve(() => {
            mockUrls['http://pact-broker.com'] = q(JSON.stringify(pactBrokerBuilder
                .withNoLatestProviderPactsLink()
                .build()
            ));

            const result = invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error('No latest pact file url found at "http://pact-broker.com"'));
            });
        }));

        it('should make a request for the latest pact files for the provider', () => {
            mockUrls['http://pact-broker.com'] = q(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] = q(JSON.stringify(providerPactsBuilder.build()));

            return invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name').then(() => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('http://pact-broker.com/provider-name/pacts');
            });
        });

        it('should return the error when the request for the latest pact files fails', () => {
            mockUrls['http://pact-broker.com'] = q(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] = q.reject<string>(new Error('error-message'));

            const result = invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error(
                    'Unable to read "http://pact-broker.com/provider-name/pacts": error-message'
                ));
            });
        });

        it('should return the error when there are no provider pact files', willResolve(() => {
            mockUrls['http://pact-broker.com'] = q(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] = q(JSON.stringify(providerPactsBuilder.build()));

            const result = invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error(
                    'Empty pact file list found at "http://pact-broker.com/provider-name/pacts"'
                ));
            });
        }));

        it('should make a request for all the provider pact files', willResolve(() => {
            mockUrls['http://pact-broker.com'] = q(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] = q(JSON.stringify(providerPactsBuilder
                .withPact('http://pact-broker.com/provider-name/consumer-1/pact')
                .withPact('http://pact-broker.com/provider-name/consumer-2/pact')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/consumer-1/pact'] = q(JSON.stringify(pactBuilder.build()));
            mockUrls['http://pact-broker.com/provider-name/consumer-2/pact'] = q(JSON.stringify(pactBuilder.build()));

            return invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name').then(() => {
                expect(mockHttpClient.get).toHaveBeenCalledWith('http://pact-broker.com/provider-name/consumer-1/pact');
                expect(mockHttpClient.get).toHaveBeenCalledWith('http://pact-broker.com/provider-name/consumer-2/pact');
            });
        }));

        it('should return the error when the request for one of the provider pact files fails', willResolve(() => {
            mockUrls['http://pact-broker.com'] = q(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] = q(JSON.stringify(providerPactsBuilder
                .withPact('http://pact-broker.com/provider-name/consumer-1/pact')
                .withPact('http://pact-broker.com/provider-name/consumer-2/pact')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/consumer-1/pact'] = q(JSON.stringify(pactBuilder.build()));
            mockUrls['http://pact-broker.com/provider-name/consumer-2/pact'] =
                q.reject<string>(new Error('error-message'));

            const result = invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error(
                    'Unable to read "http://pact-broker.com/provider-name/consumer-2/pact": error-message'
                ));
            });
        }));

        it('should return all errors when the pact files is not compatible with the swagger spec', willResolve(() => {
            mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerBuilder
                .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder))
                .build()
            ));
            mockUrls['http://pact-broker.com'] = q(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] = q(JSON.stringify(providerPactsBuilder
                .withPact('http://pact-broker.com/provider-name/consumer-1/pact')
                .withPact('http://pact-broker.com/provider-name/consumer-2/pact')
                .withPact('http://pact-broker.com/provider-name/consumer-3/pact')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/consumer-1/pact'] = q(JSON.stringify(pactBuilder
                .withInteraction(interactionBuilder.withRequestPath('/does/exist').withResponseStatus(200))
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/consumer-2/pact'] = q(JSON.stringify(pactBuilder
                .withInteraction(interactionBuilder.withRequestPath('/does/not/exist').withResponseStatus(200))
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/consumer-3/pact'] = q(JSON.stringify(pactBuilder
                .withInteraction(interactionBuilder.withRequestPath('/doesnt/exist').withResponseStatus(200))
                .build()
            ));

            const result = invokeValidate('http://domain.com/swagger.json', 'http://pact-broker.com', 'provider-name');

            return expectToReject(result).then((error) => {
                expect(error).toEqual(new Error(
                    'Pact file "http://pact-broker.com/provider-name/consumer-2/pact" ' +
                    'is not compatible with swagger file "http://domain.com/swagger.json", ' +
                    'Pact file "http://pact-broker.com/provider-name/consumer-3/pact" ' +
                    'is not compatible with swagger file "http://domain.com/swagger.json"'
                ));
                expect(error.details).toContainErrors([{
                    message: 'Path or method not defined in swagger file: GET /does/not/exist',
                    pactDetails: {
                        interactionDescription: 'default-description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        pactFile: 'http://pact-broker.com/provider-name/consumer-2/pact',
                        value: '/does/not/exist'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        swaggerFile: 'http://domain.com/swagger.json',
                        value: {'/does/exist': pathBuilder.withGetOperation(operationBuilder).build()}
                    },
                    type: 'error'
                }, {
                    message: 'Path or method not defined in swagger file: GET /doesnt/exist',
                    pactDetails: {
                        interactionDescription: 'default-description',
                        interactionState: '[none]',
                        location: '[pactRoot].interactions[0].request.path',
                        pactFile: 'http://pact-broker.com/provider-name/consumer-3/pact',
                        value: '/doesnt/exist'
                    },
                    source: 'swagger-pact-validation',
                    swaggerDetails: {
                        location: '[swaggerRoot].paths',
                        pathMethod: null,
                        pathName: null,
                        swaggerFile: 'http://domain.com/swagger.json',
                        value: {'/does/exist': pathBuilder.withGetOperation(operationBuilder).build()}
                    },
                    type: 'error'
                }]);
            });
        }));
    });
});
