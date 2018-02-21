import {ValidationOutcome} from '../../lib/api-types';
import {
    HttpClient,
    Pact,
    Swagger,
    SwaggerMockValidatorInternalOptions
} from '../../lib/swagger-mock-validator/types';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {pactBrokerBuilder} from './support/pact-broker-builder';
import {providerPactsBuilder} from './support/pact-broker-builder/provider-pacts-builder';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {swaggerBuilder} from './support/swagger-builder';
import {operationBuilder} from './support/swagger-builder/operation-builder';
import {pathBuilder} from './support/swagger-builder/path-builder';
import {
    MockFileSystemResponses,
    MockHttpClientResponses,
    MockMetadataResponses,
    MockUuidGeneratorResponses,
    swaggerMockValidatorLoader
} from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('analytics', () => {
    let mockFiles: MockFileSystemResponses;
    let mockHttpClient: HttpClient;
    let mockMetadataResponses: MockMetadataResponses;
    let mockUrls: MockHttpClientResponses;
    let mockUuids: MockUuidGeneratorResponses;
    const defaultPactBuilder = pactBuilder
        .withConsumer('a-default-consumer')
        .withProvider('a-default-provider')
        .withInteraction(interactionBuilder.withRequestPath('/does/exist'));
    const defaultSwaggerBuilder = swaggerBuilder
        .withPath('/does/exist', pathBuilder.withGetOperation(operationBuilder));

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);

        mockUrls = {};
        mockFiles = {};
        mockMetadataResponses = {};
        mockUuids = [];

        mockHttpClient = swaggerMockValidatorLoader.createMockHttpClient(mockUrls);
    });

    const invokeValidation = (options: SwaggerMockValidatorInternalOptions) => {
        mockUrls['http://analytics.com/event'] = Promise.resolve('');

        return swaggerMockValidatorLoader.invokeWithMocks({
            analyticsUrl: 'http://analytics.com/event',
            fileSystem: swaggerMockValidatorLoader.createMockFileSystem(mockFiles),
            httpClient: mockHttpClient,
            metadata: swaggerMockValidatorLoader.createMockMetadata(mockMetadataResponses),
            mockPathOrUrl: options.mockPathOrUrl,
            providerName: options.providerName,
            specPathOrUrl: options.specPathOrUrl,
            uuidGenerator: swaggerMockValidatorLoader.createMockUuidGenerator(mockUuids)
        });
    };

    const invokeValidationWithUrls = (pactFile?: Pact, swaggerFile?: Swagger): Promise<ValidationOutcome> => {
        mockUrls['http://domain.com/pact.json'] =
            Promise.resolve(JSON.stringify(pactFile || defaultPactBuilder.build()));
        mockUrls['http://domain.com/swagger.json'] =
            Promise.resolve(JSON.stringify(swaggerFile || defaultSwaggerBuilder.build()));

        return invokeValidation({
            mockPathOrUrl: 'http://domain.com/pact.json',
            specPathOrUrl: 'http://domain.com/swagger.json'
        });
    };

    const invokeValidationWithPaths = (pactFile?: Pact, swaggerFile?: Swagger): Promise<ValidationOutcome> => {
        mockFiles['pact.json'] = Promise.resolve(JSON.stringify(pactFile || defaultPactBuilder.build()));
        mockFiles['swagger.json'] = Promise.resolve(JSON.stringify(swaggerFile || defaultSwaggerBuilder.build()));

        return invokeValidation({
            mockPathOrUrl: 'pact.json',
            specPathOrUrl: 'swagger.json'
        });
    };

    const invokeValidationWithPactBroker = (consumer1PactFile?: Pact,
                                            consumer2PactFile?: Pact,
                                            swaggerFile?: Swagger): Promise<ValidationOutcome> => {
        mockUrls['http://pact-broker.com'] = Promise.resolve(JSON.stringify(
            pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/a-provider/pacts')
                .build()
        ));
        mockUrls['http://pact-broker.com/a-provider/pacts'] = Promise.resolve(JSON.stringify(
            providerPactsBuilder
                .withPact('http://pact-broker.com/a-provider/consumer-1/pact')
                .withPact('http://pact-broker.com/a-provider/consumer-2/pact')
                .build()
        ));
        mockUrls['http://pact-broker.com/a-provider/consumer-1/pact'] =
            Promise.resolve(JSON.stringify(consumer1PactFile || defaultPactBuilder.build()));
        mockUrls['http://pact-broker.com/a-provider/consumer-2/pact'] =
            Promise.resolve(JSON.stringify(consumer2PactFile || defaultPactBuilder.build()));
        mockUrls['http://domain.com/swagger.json'] =
            Promise.resolve(JSON.stringify(swaggerFile || defaultSwaggerBuilder.build()));

        return invokeValidation({
            mockPathOrUrl: 'http://pact-broker.com',
            providerName: 'a-provider',
            specPathOrUrl: 'http://domain.com/swagger.json'
        });
    };

    const getPostBody = (eventNumber?: number) =>
        (mockHttpClient.post as jasmine.Spy).calls.all()[eventNumber || 0].args[1];

    it('should make a post request to the analyticsUrl', async () => {
        await invokeValidationWithUrls();

        expect(mockHttpClient.post).toHaveBeenCalledWith('http://analytics.com/event', jasmine.any(Object));
    });

    it('should succeed when the validation is successful and the analytics has an error', async () => {
        (mockHttpClient.post as jasmine.Spy).and.returnValue(Promise.reject(new Error('an-error')));

        await invokeValidationWithUrls();
    });

    it('should return the original error when validation fails and analytics has an error', async () => {
        (mockHttpClient.post as jasmine.Spy).and.returnValue(Promise.reject(new Error('an-error')));

        const pactFile = defaultPactBuilder
            .withInteraction(interactionBuilder.withRequestPath('/does/not/exist'))
            .build();

        const result = await invokeValidationWithUrls(pactFile);

        expect(result.errors.length).toBe(1);
        expect(result.failureReason).toEqual(
            'Mock file "http://domain.com/pact.json" is not compatible ' +
            'with swagger file "http://domain.com/swagger.json"'
        );
    });

    it('should keep validating all mocks when analytics has an error', async () => {
        (mockHttpClient.post as jasmine.Spy).and.returnValue(Promise.reject(new Error('an-error')));
        const pactFile1 = defaultPactBuilder
            .withConsumer('consumer-1')
            .withInteraction(interactionBuilder.withRequestPath('/does/not/exist'))
            .build();
        const pactFile2 = defaultPactBuilder
            .withConsumer('consumer-2')
            .withInteraction(interactionBuilder.withRequestPath('/does/not/exist/either'))
            .build();
        const result = await invokeValidationWithPactBroker(pactFile1, pactFile2);

        expect(result.errors.length).toBe(2);
        expect(result.failureReason).toEqual(
            'Mock file "http://pact-broker.com/a-provider/consumer-1/pact" ' +
            'is not compatible with swagger file "http://domain.com/swagger.json", ' +
            'Mock file "http://pact-broker.com/a-provider/consumer-2/pact" ' +
            'is not compatible with swagger file "http://domain.com/swagger.json"'
        );
    });

    it('should send the consumer name', async () => {
        const pactFile = defaultPactBuilder
            .withConsumer('a-consumer')
            .build();

        await invokeValidationWithUrls(pactFile);

        expect(getPostBody().execution.consumer).toBe('a-consumer');
    });

    it('should send the mock format', async () => {
        await invokeValidationWithUrls();

        expect(getPostBody().execution.mockFormat).toBe('pact');
    });

    it('should send the mock path or url', async () => {
        await invokeValidationWithUrls();

        expect(getPostBody().execution.mockPathOrUrl).toBe('http://domain.com/pact.json');
    });

    it('should send the mock path when using the pact broker', async () => {
        await invokeValidationWithPactBroker();

        expect(getPostBody(0).execution.mockPathOrUrl).toBe('http://pact-broker.com/a-provider/consumer-1/pact');
        expect(getPostBody(1).execution.mockPathOrUrl).toBe('http://pact-broker.com/a-provider/consumer-2/pact');
    });

    it('should send the mock source as url when the source is a url', async () => {
        await invokeValidationWithUrls();

        expect(getPostBody().execution.mockSource).toBe('url');
    });

    it('should send the mock source as path when the source is a path', async () => {
        await invokeValidationWithPaths();

        expect(getPostBody().execution.mockSource).toBe('path');
    });

    it('should send the mock source as pactBroker when the source is a pact broker', async () => {
        await invokeValidationWithPactBroker();

        expect(getPostBody().execution.mockSource).toBe('pactBroker');
    });

    it('should send the provider name', async () => {
        const pactFile = defaultPactBuilder
            .withProvider('a-provider')
            .build();

        await invokeValidationWithUrls(pactFile);

        expect(getPostBody().execution.provider).toBe('a-provider');
    });

    it('should send the spec format', async () => {
        await invokeValidationWithUrls();

        expect(getPostBody().execution.specFormat).toBe('swagger');
    });

    it('should send the spec path or url', async () => {
        await invokeValidationWithUrls();

        expect(getPostBody().execution.specPathOrUrl).toBe('http://domain.com/swagger.json');
    });

    it('should send the spec source as url when the source is a url', async () => {
        await invokeValidationWithUrls();

        expect(getPostBody().execution.specSource).toBe('url');
    });

    it('should send the spec source as path when the source is a path', async () => {
        await invokeValidationWithPaths();

        expect(getPostBody().execution.specSource).toBe('path');
    });

    it('should send an id', async () => {
        mockUuids[0] = 'a-unique-parent-id';
        mockUuids[1] = 'a-unique-id';

        await invokeValidationWithUrls();

        expect(getPostBody().id).toBe('a-unique-id');
    });

    it('should send a unique id per analytic event', async () => {
        mockUuids[0] = 'a-unique-parent-id';
        mockUuids[1] = 'a-unique-id-1';
        mockUuids[2] = 'a-unique-id-2';

        await invokeValidationWithPactBroker();

        expect(getPostBody(0).id).toBe('a-unique-id-1');
        expect(getPostBody(1).id).toBe('a-unique-id-2');
    });

    it('should send the hostname', async () => {
        mockMetadataResponses.hostname = 'a-hostname';

        await invokeValidationWithUrls();

        expect(getPostBody().metadata.hostname).toBe('a-hostname');
    });

    it('should send the os version', async () => {
        mockMetadataResponses.osVersion = 'an-os-version';

        await invokeValidationWithUrls();

        expect(getPostBody().metadata.osVersion).toBe('an-os-version');
    });

    it('should send the tool version', async () => {
        mockMetadataResponses.toolVersion = 'a-tool-version';

        await invokeValidationWithUrls();

        expect(getPostBody().metadata.toolVersion).toBe('a-tool-version');
    });

    it('should send a parent id', async () => {
        mockUuids[0] = 'a-unique-parent-id';
        mockUuids[1] = 'a-unique-id-1';
        mockUuids[2] = 'a-unique-id-2';

        await invokeValidationWithPactBroker();

        expect(getPostBody(0).parentId).toBe('a-unique-parent-id');
        expect(getPostBody(1).parentId).toBe('a-unique-parent-id');
    });

    it('should send the duration in seconds', async () => {
        mockMetadataResponses.uptime = 1.234;

        await invokeValidationWithUrls();

        expect(getPostBody().result.duration).toBe(1.234);
    });

    it('should send the error count when there are no errors', async () => {
        await invokeValidationWithUrls();

        expect(getPostBody().result.errors).toEqual({count: 0});
    });

    it('should send the error count when there are errors', async () => {
        const pactFile = defaultPactBuilder
            .withInteraction(interactionBuilder.withRequestPath('/does/not/exist'))
            .build();

        await invokeValidationWithUrls(pactFile);

        expect(getPostBody().result.errors.count).toBe(1);
    });

    it('should send the count of each error type when there are errors', async () => {
        const pactFile = defaultPactBuilder
            .withInteraction(interactionBuilder.withRequestPath('/does/not/exist'))
            .withInteraction(interactionBuilder.withRequestPath('/also/does/not/exist'))
            .withInteraction(interactionBuilder.withRequestPath('/does/exist').withResponseStatus(201))
            .build();

        await invokeValidationWithUrls(pactFile);

        expect(getPostBody().result.errors['spv.request.path-or-method.unknown']).toBe(2);
        expect(getPostBody().result.errors['spv.response.status.unknown']).toBe(1);
    });

    it('should send the success of the validation when it is successful', async () => {
        await invokeValidationWithUrls();

        expect(getPostBody().result.success).toBe(true);
    });

    it('should send the success of the validation when it fails', async () => {
        const pactFile = defaultPactBuilder
            .withInteraction(interactionBuilder.withRequestPath('/does/not/exist'))
            .build();

        await invokeValidationWithUrls(pactFile);
        expect(getPostBody().result.success).toBe(false);
    });

    it('should send the warning count when there are no warnings', async () => {
        await invokeValidationWithUrls();

        expect(getPostBody().result.warnings).toEqual({count: 0});
    });

    it('should send the warning count when there are warnings', async () => {
        const pactFile = defaultPactBuilder
            .withInteraction(interactionBuilder
                .withRequestPath('/does/exist')
                .withRequestBody({not: 'in the spec'})
            )
            .build();

        await invokeValidationWithUrls(pactFile);

        expect(getPostBody().result.warnings.count).toBe(1);
    });

    it('should send the count of each warning type when there are warnings', async () => {
        const doesExistInteractionBuilder = interactionBuilder.withRequestPath('/does/exist');

        const pactFile = defaultPactBuilder
            .withInteraction(doesExistInteractionBuilder.withRequestBody({not: 'in the spec'}))
            .withInteraction(doesExistInteractionBuilder.withRequestBody({also: 'not in the spec'}))
            .withInteraction(doesExistInteractionBuilder.withRequestHeader('x-not-in-the', 'spec'))
            .build();

        await invokeValidationWithUrls(pactFile);

        expect(getPostBody().result.warnings['spv.request.body.unknown']).toBe(2);
        expect(getPostBody().result.warnings['spv.request.header.unknown']).toBe(1);
    });

    it('should send the source', async () => {
        await invokeValidationWithUrls();

        expect(getPostBody().source).toBe('swagger-mock-validator');
    });
});
