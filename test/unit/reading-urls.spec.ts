import {ValidationOutcome} from '../../lib/api-types';
import {HttpClient} from '../../lib/swagger-mock-validator/types';
import {expectToFail} from '../support/expect-to-fail';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {pactBrokerBuilder, providerPactsBuilder} from './support/pact-broker-builder';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {operationBuilder, pathBuilder, swaggerBuilder} from './support/swagger-builder';
import {pathParameterBuilder} from './support/swagger-builder/parameter-builder/path-parameter-builder';
import {default as swaggerPactValidatorLoader, MockHttpClientResponses} from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('reading urls', () => {
    let mockHttpClient: HttpClient;
    let mockUrls: MockHttpClientResponses;

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);

        mockUrls = {};
        mockHttpClient = swaggerPactValidatorLoader.createMockHttpClient(mockUrls);
    });

    const invokeValidate = (specPathOrUrl: string,
                            mockPathOrUrl: string,
                            providerName?: string): Promise<ValidationOutcome> =>
        swaggerPactValidatorLoader.invokeWithMocks({
            httpClient: mockHttpClient,
            mockPathOrUrl,
            providerName,
            specPathOrUrl
        });

    describe('reading the swagger file', () => {
        it('should make a request for a http swagger url', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            await invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://domain.com/swagger.json');
        });

        it('should make a request for a https swagger url', async () => {
            mockUrls['https://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            await invokeValidate(
                'https://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            expect(mockHttpClient.get).toHaveBeenCalledWith('https://domain.com/swagger.json');
        });

        it('should fail when making the request fails', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.reject(new Error('error-message'));
            mockUrls['http://domain.com/pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            const error = await expectToFail(invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            ));

            expect(error).toEqual(new Error('Unable to read "http://domain.com/swagger.json": error-message'));
        });

        it('should fail when the swagger file cannot be parsed as json', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve('');
            mockUrls['http://domain.com/pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            const error = await expectToFail(invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            ));

            expect(error.message).toEqual(jasmine.stringMatching(
                'Unable to parse "http://domain.com/swagger.json": Unexpected end'
            ));
        });
    });

    describe('reading the pact file', () => {
        it('should make a request for a http pact url', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            await invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            );

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://domain.com/pact.json');
        });

        it('should fail when reading the pact file fails', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = Promise.reject(new Error('error-message'));

            const error = await expectToFail(invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            ));

            expect(error).toEqual(new Error('Unable to read "http://domain.com/pact.json": error-message'));
        });

        it('should fail when the pact file cannot be parsed as json', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://domain.com/pact.json'] = Promise.resolve('');

            const error = await expectToFail(invokeValidate(
                'http://domain.com/swagger.json',
                'http://domain.com/pact.json'
            ));

            expect(error.message).toEqual(jasmine.stringMatching(
                'Unable to parse "http://domain.com/pact.json": Unexpected end'
            ));
        });
    });

    describe('reading from the pact broker', () => {
        beforeEach(() => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder.build()));
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder.build()));
            mockUrls['http://default-pact-broker.com/provider-name/pacts'] = Promise.resolve(JSON.stringify(
                providerPactsBuilder
                    .withPact('http://default-pact-broker.com/provider-name/default-consumer/pact')
                    .build()
            ));
            mockUrls['http://default-pact-broker.com/provider-name/default-consumer/pact'] =
                Promise.resolve(JSON.stringify(pactBuilder.build()));
        });

        const invokeValidateWithPactBroker = (pactBrokerUrl: string, providerName: string) => {
            return invokeValidate('http://domain.com/swagger.json', pactBrokerUrl, providerName);
        };

        it('should make a request to the root of the pact broker', async () => {
            await invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name');

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://pact-broker.com');
        });

        it('should fail when the request to the root of the pact broker fails', async () => {
            mockUrls['http://pact-broker.com'] = Promise.reject(new Error('error-message'));

            const error = await expectToFail(invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name'));

            expect(error).toEqual(new Error('Unable to read "http://pact-broker.com": error-message'));
        });

        it('should fail when no url for latest pact files is in the pact root response', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withNoLatestProviderPactsLink()
                .build()
            ));

            const error = await expectToFail(invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name'));

            expect(error).toEqual(new Error('No latest pact file url found at "http://pact-broker.com"'));
        });

        it('should make a request for the latest pact files for the provider', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] =
                Promise.resolve(JSON.stringify(providerPactsBuilder.build()));

            await invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name');

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://pact-broker.com/provider-name/pacts');
        });

        it('should fail when the request for the latest pact files fails', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] = Promise.reject(new Error('error-message'));

            const error = await expectToFail(invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name'));

            expect(error).toEqual(new Error(
                'Unable to read "http://pact-broker.com/provider-name/pacts": error-message'
            ));
        });

        it('should pass when there are no provider pact files', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] =
                Promise.resolve(JSON.stringify(providerPactsBuilder.build()));

            const result = await invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name');

            expect(result).toContainNoWarningsOrErrors();
        });

        it('should make a request for all the provider pact files', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] = Promise.resolve(JSON.stringify(providerPactsBuilder
                .withPact('http://pact-broker.com/provider-name/consumer-1/pact')
                .withPact('http://pact-broker.com/provider-name/consumer-2/pact')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/consumer-1/pact'] =
                Promise.resolve(JSON.stringify(pactBuilder.build()));
            mockUrls['http://pact-broker.com/provider-name/consumer-2/pact'] =
                Promise.resolve(JSON.stringify(pactBuilder.build()));

            await invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name');

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://pact-broker.com/provider-name/consumer-1/pact');
            expect(mockHttpClient.get).toHaveBeenCalledWith('http://pact-broker.com/provider-name/consumer-2/pact');
        });

        it('should fail when the request for one of the provider pact files fails', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] = Promise.resolve(JSON.stringify(providerPactsBuilder
                .withPact('http://pact-broker.com/provider-name/consumer-1/pact')
                .withPact('http://pact-broker.com/provider-name/consumer-2/pact')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/consumer-1/pact'] =
                Promise.resolve(JSON.stringify(pactBuilder.build()));
            mockUrls['http://pact-broker.com/provider-name/consumer-2/pact'] =
                Promise.reject(new Error('error-message'));

            const error = await expectToFail(invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name'));

            expect(error).toEqual(new Error(
                'Unable to read "http://pact-broker.com/provider-name/consumer-2/pact": error-message'
            ));
        });

        it('should return all errors when the pact files are not compatible with the swagger spec', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder
                .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder))
                .build()
            ));
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] = Promise.resolve(JSON.stringify(providerPactsBuilder
                .withPact('http://pact-broker.com/provider-name/consumer-1/pact')
                .withPact('http://pact-broker.com/provider-name/consumer-2/pact')
                .withPact('http://pact-broker.com/provider-name/consumer-3/pact')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/consumer-1/pact'] = Promise.resolve(JSON.stringify(
                pactBuilder
                    .withInteraction(interactionBuilder.withRequestPath('/does/exist').withResponseStatus(200))
                    .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/consumer-2/pact'] = Promise.resolve(JSON.stringify(
                pactBuilder
                    .withInteraction(interactionBuilder.withRequestPath('/does/not/exist').withResponseStatus(200))
                    .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/consumer-3/pact'] = Promise.resolve(JSON.stringify(
                pactBuilder
                    .withInteraction(interactionBuilder.withRequestPath('/doesnt/exist').withResponseStatus(200))
                    .build()
            ));

            const result = await invokeValidate('http://domain.com/swagger.json',
                'http://pact-broker.com',
                'provider-name');

            expect(result.failureReason).toEqual(
                'Mock file "http://pact-broker.com/provider-name/consumer-2/pact" ' +
                'is not compatible with swagger file "http://domain.com/swagger.json", ' +
                'Mock file "http://pact-broker.com/provider-name/consumer-3/pact" ' +
                'is not compatible with swagger file "http://domain.com/swagger.json"'
            );
            expect(result).toContainErrors([{
                code: 'spv.request.path-or-method.unknown',
                message: 'Path or method not defined in swagger file: GET /does/not/exist',
                mockDetails: {
                    interactionDescription: 'default-description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.path',
                    mockFile: 'http://pact-broker.com/provider-name/consumer-2/pact',
                    value: '/does/not/exist'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'http://domain.com/swagger.json',
                    value: {'/does/exist': pathBuilder.withGetOperation(operationBuilder).build()}
                },
                type: 'error'
            }, {
                code: 'spv.request.path-or-method.unknown',
                message: 'Path or method not defined in swagger file: GET /doesnt/exist',
                mockDetails: {
                    interactionDescription: 'default-description',
                    interactionState: '[none]',
                    location: '[pactRoot].interactions[0].request.path',
                    mockFile: 'http://pact-broker.com/provider-name/consumer-3/pact',
                    value: '/doesnt/exist'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[swaggerRoot].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'http://domain.com/swagger.json',
                    value: {'/does/exist': pathBuilder.withGetOperation(operationBuilder).build()}
                },
                type: 'error'
            }]);
        });

        it('should not report on the same validation error twice', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swaggerBuilder
                .withParameter('userId', pathParameterBuilder.withNumberNamed('userId'))
                .build()
            ));
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] = Promise.resolve(JSON.stringify(providerPactsBuilder
                .withPact('http://pact-broker.com/provider-name/consumer-1/pact')
                .withPact('http://pact-broker.com/provider-name/consumer-2/pact')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/consumer-1/pact'] =
                Promise.resolve(JSON.stringify(pactBuilder.build()));
            mockUrls['http://pact-broker.com/provider-name/consumer-2/pact'] =
                Promise.resolve(JSON.stringify(pactBuilder.build()));

            const result = await invokeValidate('http://domain.com/swagger.json',
                'http://pact-broker.com',
                'provider-name');

            expect(result).toContainNoErrors();
            expect(result).toContainWarnings([{
                code: 'sv.warning',
                message: 'Parameter is defined but is not used: #/parameters/userId',
                source: 'swagger-validation',
                specDetails: {
                    location: '[swaggerRoot].parameters.userId',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'swagger.json',
                    value: null
                },
                type: 'warning'
            }]);
        });
    });
});
