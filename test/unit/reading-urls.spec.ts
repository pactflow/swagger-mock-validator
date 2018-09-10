import {ValidationOutcome} from '../../lib/api-types';
import {HttpClient} from '../../lib/swagger-mock-validator/clients/http-client';
import {SwaggerMockValidatorErrorImpl} from '../../lib/swagger-mock-validator/swagger-mock-validator-error-impl';
import {expectToFail} from '../support/expect-to-fail';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {pactBrokerBuilder, providerPactsBuilder} from './support/pact-broker-builder';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {MockHttpClientResponses, swaggerMockValidatorLoader} from './support/swagger-mock-validator-loader';
import {swagger2Builder} from './support/swagger2-builder';
import {operationBuilder} from './support/swagger2-builder/operation-builder';
import {pathBuilder} from './support/swagger2-builder/path-builder';

declare function expect<T>(actual: T): CustomMatchers<T>;

interface InvokeValidateOptions {
    specPathOrUrl: string;
    mockPathOrUrl: string;
    providerName?: string;
    tag?: string;
}

describe('reading urls', () => {
    let mockHttpClient: HttpClient;
    let mockUrls: MockHttpClientResponses;

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);

        mockUrls = {};
        mockHttpClient = swaggerMockValidatorLoader.createMockHttpClient(mockUrls);
    });

    const invokeValidate = (invokeValidateOptions: InvokeValidateOptions): Promise<ValidationOutcome> =>
        swaggerMockValidatorLoader.invokeWithMocks({...invokeValidateOptions, httpClient: mockHttpClient});

    describe('reading the swagger file', () => {
        it('should make a request for a http swagger url', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swagger2Builder.build()));
            mockUrls['http://domain.com/pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            await invokeValidate({
                mockPathOrUrl: 'http://domain.com/pact.json',
                specPathOrUrl: 'http://domain.com/swagger.json'
            });

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://domain.com/swagger.json');
        });

        it('should make a request for a https swagger url', async () => {
            mockUrls['https://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swagger2Builder.build()));
            mockUrls['http://domain.com/pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            await invokeValidate({
                mockPathOrUrl: 'http://domain.com/pact.json',
                specPathOrUrl: 'https://domain.com/swagger.json'
            });

            expect(mockHttpClient.get).toHaveBeenCalledWith('https://domain.com/swagger.json');
        });

        it('should fail when making the request fails', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.reject(new Error('error-message'));
            mockUrls['http://domain.com/pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            const error = await expectToFail(invokeValidate({
                mockPathOrUrl: 'http://domain.com/pact.json',
                specPathOrUrl: 'http://domain.com/swagger.json'
            }));

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                'Unable to read "http://domain.com/swagger.json": error-message'
            ));
        });

        it('should fail when the swagger file cannot be parsed as json', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve('');
            mockUrls['http://domain.com/pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            const error = await expectToFail(invokeValidate({
                mockPathOrUrl: 'http://domain.com/pact.json',
                specPathOrUrl: 'http://domain.com/swagger.json'
            })) as SwaggerMockValidatorErrorImpl;

            expect(error.code).toEqual('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR');
            expect(error.message).toEqual(jasmine.stringMatching('Unable to parse "http://domain.com/swagger.json":'));
        });
    });

    describe('reading the pact file', () => {
        it('should make a request for a http pact url', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swagger2Builder.build()));
            mockUrls['http://domain.com/pact.json'] = Promise.resolve(JSON.stringify(pactBuilder.build()));

            await invokeValidate({
                mockPathOrUrl: 'http://domain.com/pact.json',
                specPathOrUrl: 'http://domain.com/swagger.json'
            });

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://domain.com/pact.json');
        });

        it('should fail when reading the pact file fails', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swagger2Builder.build()));
            mockUrls['http://domain.com/pact.json'] = Promise.reject(new Error('error-message'));

            const error = await expectToFail(invokeValidate({
                mockPathOrUrl: 'http://domain.com/pact.json',
                specPathOrUrl: 'http://domain.com/swagger.json'
            }));

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                'Unable to read "http://domain.com/pact.json": error-message'
            ));
        });

        it('should fail when the pact file cannot be parsed as json', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swagger2Builder.build()));
            mockUrls['http://domain.com/pact.json'] = Promise.resolve('');

            const error = await expectToFail(invokeValidate({
                mockPathOrUrl: 'http://domain.com/pact.json',
                specPathOrUrl: 'http://domain.com/swagger.json'
            })) as SwaggerMockValidatorErrorImpl;

            expect(error.code).toEqual('SWAGGER_MOCK_VALIDATOR_PARSE_ERROR');
            expect(error.message).toEqual(jasmine.stringMatching('Unable to parse "http://domain.com/pact.json":'));
        });
    });

    describe('reading from the pact broker', () => {
        beforeEach(() => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swagger2Builder.build()));
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
            return invokeValidate({
                mockPathOrUrl: pactBrokerUrl,
                providerName,
                specPathOrUrl: 'http://domain.com/swagger.json'
            });
        };

        it('should make a request to the root of the pact broker', async () => {
            await invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name');

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://pact-broker.com');
        });

        it('should fail when the request to the root of the pact broker fails', async () => {
            mockUrls['http://pact-broker.com'] = Promise.reject(new Error('error-message'));

            const error = await expectToFail(invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name'));

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                'Unable to read "http://pact-broker.com": error-message'
            ));
        });

        it('should fail when no url for latest pact files is in the pact root response', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withNoLatestProviderPactsLink()
                .build()
            ));

            const error = await expectToFail(invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name'));

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                'Unable to read "http://pact-broker.com": No latest pact file url found'
            ));
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

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                'Unable to read "http://pact-broker.com/provider-name/pacts": error-message'
            ));
        });

        it('should pass but display a warning when there are no provider pact files', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/pacts'] =
                Promise.resolve(JSON.stringify(providerPactsBuilder.build()));

            const result = await invokeValidateWithPactBroker('http://pact-broker.com', 'provider-name');

            expect(result).toContainNoErrors();
            expect(result).toContainWarnings([{
                code: 'pact-broker.no-pacts-found',
                message: 'No consumer pacts found in Pact Broker',
                source: 'pact-broker',
                type: 'warning'
            }]);
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

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                'Unable to read "http://pact-broker.com/provider-name/consumer-2/pact": error-message'
            ));
        });

        it('should return all errors when the pact files are not compatible with the swagger spec', async () => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swagger2Builder
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

            const result = await invokeValidate({
                mockPathOrUrl: 'http://pact-broker.com',
                providerName: 'provider-name',
                specPathOrUrl: 'http://domain.com/swagger.json'
            });

            expect(result.failureReason).toEqual(
                'Mock file "http://pact-broker.com/provider-name/consumer-2/pact" ' +
                'is not compatible with spec file "http://domain.com/swagger.json", ' +
                'Mock file "http://pact-broker.com/provider-name/consumer-3/pact" ' +
                'is not compatible with spec file "http://domain.com/swagger.json"'
            );
            expect(result).toContainErrors([{
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: GET /does/not/exist',
                mockDetails: {
                    interactionDescription: 'default-description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'http://pact-broker.com/provider-name/consumer-2/pact',
                    value: '/does/not/exist'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'http://domain.com/swagger.json',
                    value: {'/does/exist': pathBuilder.withGetOperation(operationBuilder).build()}
                },
                type: 'error'
            }, {
                code: 'request.path-or-method.unknown',
                message: 'Path or method not defined in spec file: GET /doesnt/exist',
                mockDetails: {
                    interactionDescription: 'default-description',
                    interactionState: '[none]',
                    location: '[root].interactions[0].request.path',
                    mockFile: 'http://pact-broker.com/provider-name/consumer-3/pact',
                    value: '/doesnt/exist'
                },
                source: 'spec-mock-validation',
                specDetails: {
                    location: '[root].paths',
                    pathMethod: null,
                    pathName: null,
                    specFile: 'http://domain.com/swagger.json',
                    value: {'/does/exist': pathBuilder.withGetOperation(operationBuilder).build()}
                },
                type: 'error'
            }]);
        });

        it('should not report on the same validation error twice', async () => {
            mockUrls['http://url.com/swagger.json'] = Promise.resolve('{"swagger": "invalid"}');
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

            const error = await expectToFail(invokeValidate({
                mockPathOrUrl: 'http://pact-broker.com',
                providerName: 'provider-name',
                specPathOrUrl: 'http://url.com/swagger.json'
            }));

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_PARSE_ERROR',
                'Unable to parse "http://url.com/swagger.json": [object Object] is not a valid Swagger API definition'
            ));
        });

        it('should encode the provider name when constructing the URL', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/{provider}/pacts')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider%2Fname/pacts'] =
                Promise.resolve(JSON.stringify(providerPactsBuilder.build()));

            await invokeValidateWithPactBroker('http://pact-broker.com', 'provider/name');

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://pact-broker.com/provider%2Fname/pacts');
        });
    });

    describe('reading from the pact broker with tag', () => {
        beforeEach(() => {
            mockUrls['http://domain.com/swagger.json'] = Promise.resolve(JSON.stringify(swagger2Builder.build()));
        });

        const invokeValidateWithPactBrokerAndTag = (pactBrokerUrl: string, providerName: string, tag: string) => {
            return invokeValidate({
                mockPathOrUrl: pactBrokerUrl,
                providerName,
                specPathOrUrl: 'http://domain.com/swagger.json',
                tag
            });
        };

        it('should fail when no url for latest pact files with tag is in the pact root response', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withNoLatestProviderPactsWithTagLink()
                .build()
            ));

            const error = await expectToFail(
                invokeValidateWithPactBrokerAndTag('http://pact-broker.com', 'provider-name', 'tag')
            );

            expect(error).toEqual(new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                'Unable to read "http://pact-broker.com": No latest pact file url found for tag'
            ));
        });

        it('should make a request for the latest pact files for the given provider and tag', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsWithTagLink('http://pact-broker.com/{provider}/latest/{tag}')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/latest/sample-tag'] =
                Promise.resolve(JSON.stringify(providerPactsBuilder.build()));

            await invokeValidateWithPactBrokerAndTag('http://pact-broker.com', 'provider-name', 'sample-tag');

            expect(mockHttpClient.get).toHaveBeenCalledWith('http://pact-broker.com/provider-name/latest/sample-tag');
        });

        it('should pass but display a warning when there are no provider pact files for the given tag', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsWithTagLink('http://pact-broker.com/{provider}/latest/{tag}')
                .build()
            ));

            mockUrls['http://pact-broker.com/provider-name/latest/unknown-tag'] =
                Promise.resolve(JSON.stringify(providerPactsBuilder.build()));

            const result = await invokeValidateWithPactBrokerAndTag(
                'http://pact-broker.com',
                'provider-name',
                'unknown-tag'
            );

            expect(result).toContainNoErrors();
            expect(result).toContainWarnings([{
                code: 'pact-broker.no-pacts-found',
                message: 'No consumer pacts found in Pact Broker',
                source: 'pact-broker',
                type: 'warning'
            }]);
        });

        it('should encode the tag when constructing the URL', async () => {
            mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(pactBrokerBuilder
                .withLatestProviderPactsWithTagLink('http://pact-broker.com/{provider}/latest/{tag}')
                .build()
            ));
            mockUrls['http://pact-broker.com/provider-name/latest/sample%2Ftag'] =
                Promise.resolve(JSON.stringify(providerPactsBuilder.build()));

            await invokeValidateWithPactBrokerAndTag('http://pact-broker.com', 'provider-name', 'sample/tag');

            expect(mockHttpClient.get)
                .toHaveBeenCalledWith('http://pact-broker.com/provider-name/latest/sample%2Ftag');
        });
    });
});
