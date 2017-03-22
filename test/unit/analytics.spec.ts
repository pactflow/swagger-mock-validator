import {expectToReject, willResolve} from 'jasmine-promise-tools';
import * as q from 'q';
import {
    HttpClient,
    Pact,
    Swagger,
    SwaggerMockValidatorOptions,
    ValidationSuccess
} from '../../lib/swagger-mock-validator/types';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {pactBrokerBuilder} from './support/pact-broker-builder';
import {providerPactsBuilder} from './support/pact-broker-builder/provider-pacts-builder';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    pathBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import {
    default as swaggerPactValidatorLoader,
    MockFileSystemResponses,
    MockHttpClientResponses,
    MockMetadataResponses,
    MockUuidGeneratorResponses
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

        mockHttpClient = swaggerPactValidatorLoader.createMockHttpClient(mockUrls);
    });

    const invokeValidation = (options: SwaggerMockValidatorOptions) => {
        mockUrls['http://analytics.com/event'] = q('');

        return swaggerPactValidatorLoader.invokeWithMocks({
            analyticsUrl: 'http://analytics.com/event',
            fileSystem: swaggerPactValidatorLoader.createMockFileSystem(mockFiles),
            httpClient: mockHttpClient,
            metadata: swaggerPactValidatorLoader.createMockMetadata(mockMetadataResponses),
            mockPathOrUrl: options.mockPathOrUrl,
            providerName: options.providerName,
            specPathOrUrl: options.specPathOrUrl,
            uuidGenerator: swaggerPactValidatorLoader.createMockUuidGenerator(mockUuids)
        });
    };

    const invokeValidationWithUrls = (pactFile?: Pact, swaggerFile?: Swagger): Promise<ValidationSuccess> => {
        mockUrls['http://domain.com/pact.json'] = q(JSON.stringify(pactFile || defaultPactBuilder.build()));
        mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerFile || defaultSwaggerBuilder.build()));

        return invokeValidation({
            mockPathOrUrl: 'http://domain.com/pact.json',
            specPathOrUrl: 'http://domain.com/swagger.json'
        });
    };

    const invokeValidationWithPaths = (pactFile?: Pact, swaggerFile?: Swagger): Promise<ValidationSuccess> => {
        mockFiles['pact.json'] = q(JSON.stringify(pactFile || defaultPactBuilder.build()));
        mockFiles['swagger.json'] = q(JSON.stringify(swaggerFile || defaultSwaggerBuilder.build()));

        return invokeValidation({
            mockPathOrUrl: 'pact.json',
            specPathOrUrl: 'swagger.json'
        });
    };

    const invokeValidationWithPactBroker = (
        consumer1PactFile?: Pact,
        consumer2PactFile?: Pact,
        swaggerFile?: Swagger
    ): Promise<ValidationSuccess> => {
        mockUrls['http://pact-broker.com'] = q(JSON.stringify(
            pactBrokerBuilder
                .withLatestProviderPactsLink('http://pact-broker.com/a-provider/pacts')
                .build()
        ));
        mockUrls['http://pact-broker.com/a-provider/pacts'] = q(JSON.stringify(
            providerPactsBuilder
                .withPact('http://pact-broker.com/a-provider/consumer-1/pact')
                .withPact('http://pact-broker.com/a-provider/consumer-2/pact')
                .build()
        ));
        mockUrls['http://pact-broker.com/a-provider/consumer-1/pact'] =
            q(JSON.stringify(consumer1PactFile || defaultPactBuilder.build()));
        mockUrls['http://pact-broker.com/a-provider/consumer-2/pact'] =
            q(JSON.stringify(consumer2PactFile || defaultPactBuilder.build()));
        mockUrls['http://domain.com/swagger.json'] = q(JSON.stringify(swaggerFile || defaultSwaggerBuilder.build()));

        return invokeValidation({
            mockPathOrUrl: 'http://pact-broker.com',
            providerName: 'a-provider',
            specPathOrUrl: 'http://domain.com/swagger.json'
        });
    };

    const getPostBody = (eventNumber?: number) =>
        (mockHttpClient.post as jasmine.Spy).calls.all()[eventNumber || 0].args[1];

    it('should make a post request to the analyticsUrl', willResolve(() =>
        invokeValidationWithUrls().then(() => {
            expect(mockHttpClient.post).toHaveBeenCalledWith('http://analytics.com/event', jasmine.any(Object));
        })
    ));

    it('should succeed when the validation is successful and the analytics has an error', willResolve(() => {
        (mockHttpClient.post as jasmine.Spy).and.returnValue(q.reject(new Error('an-error')));

        return invokeValidationWithUrls();
    }));

    it('should fail with the original error when validation fails and analytics has an error', willResolve(() => {
        (mockHttpClient.post as jasmine.Spy).and.returnValue(q.reject(new Error('an-error')));

        const pactFile = defaultPactBuilder
            .withInteraction(interactionBuilder.withRequestPath('/does/not/exist'))
            .build();

        const result = invokeValidationWithUrls(pactFile);

        return expectToReject(result).then((error) => {
            expect(error).toEqual(new Error(
                'Mock file "http://domain.com/pact.json" is not compatible ' +
                'with swagger file "http://domain.com/swagger.json"'
            ));
        });
    }));

    it('should send the consumer name', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withConsumer('a-consumer')
            .build();

        return invokeValidationWithUrls(pactFile).then(() => {
            expect(getPostBody().execution.consumer).toBe('a-consumer');
        });
    }));

    it('should send the mock format', willResolve(() =>
        invokeValidationWithUrls().then(() => {
            expect(getPostBody().execution.mockFormat).toBe('pact');
        })
    ));

    it('should send the mock path or url', willResolve(() =>
        invokeValidationWithUrls().then(() => {
            expect(getPostBody().execution.mockPathOrUrl).toBe('http://domain.com/pact.json');
        })
    ));

    it('should send the mock path when using the pact broker', willResolve(() =>
        invokeValidationWithPactBroker().then(() => {
            expect(getPostBody(0).execution.mockPathOrUrl).toBe('http://pact-broker.com/a-provider/consumer-1/pact');
            expect(getPostBody(1).execution.mockPathOrUrl).toBe('http://pact-broker.com/a-provider/consumer-2/pact');
        })
    ));

    it('should send the mock source as url when the source is a url', willResolve(() =>
        invokeValidationWithUrls().then(() => {
            expect(getPostBody().execution.mockSource).toBe('url');
        })
    ));

    it('should send the mock source as path when the source is a path', willResolve(() =>
        invokeValidationWithPaths().then(() => {
            expect(getPostBody().execution.mockSource).toBe('path');
        })
    ));

    it('should send the mock source as pactBroker when the source is a pact broker', willResolve(() =>
        invokeValidationWithPactBroker().then(() => {
            expect(getPostBody().execution.mockSource).toBe('pactBroker');
        })
    ));

    it('should send the provider name', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withProvider('a-provider')
            .build();

        return invokeValidationWithUrls(pactFile).then(() => {
            expect(getPostBody().execution.provider).toBe('a-provider');
        });
    }));

    it('should send the spec format', willResolve(() =>
        invokeValidationWithUrls().then(() => {
            expect(getPostBody().execution.specFormat).toBe('swagger');
        })
    ));

    it('should send the spec path or url', willResolve(() =>
        invokeValidationWithUrls().then(() => {
            expect(getPostBody().execution.specPathOrUrl).toBe('http://domain.com/swagger.json');
        })
    ));

    it('should send the spec source as url when the source is a url', willResolve(() =>
        invokeValidationWithUrls().then(() => {
            expect(getPostBody().execution.specSource).toBe('url');
        })
    ));

    it('should send the spec source as path when the source is a path', willResolve(() =>
        invokeValidationWithPaths().then(() => {
            expect(getPostBody().execution.specSource).toBe('path');
        })
    ));

    it('should send an id', willResolve(() => {
        mockUuids[0] = 'a-unique-parent-id';
        mockUuids[1] = 'a-unique-id';

        return invokeValidationWithUrls().then(() => {
            expect(getPostBody().id).toBe('a-unique-id');
        });
    }));

    it('should send a unique id per analytic event', willResolve(() => {
        mockUuids[0] = 'a-unique-parent-id';
        mockUuids[1] = 'a-unique-id-1';
        mockUuids[2] = 'a-unique-id-2';

        return invokeValidationWithPactBroker().then(() => {
            expect(getPostBody(0).id).toBe('a-unique-id-1');
            expect(getPostBody(1).id).toBe('a-unique-id-2');
        });
    }));

    it('should send the hostname', willResolve(() => {
        mockMetadataResponses.hostname = 'a-hostname';

        return invokeValidationWithUrls().then(() => {
            expect(getPostBody().metadata.hostname).toBe('a-hostname');
        });
    }));

    it('should send the os version', willResolve(() => {
        mockMetadataResponses.osVersion = 'an-os-version';

        return invokeValidationWithUrls().then(() => {
            expect(getPostBody().metadata.osVersion).toBe('an-os-version');
        });
    }));

    it('should send the tool version', willResolve(() => {
        mockMetadataResponses.toolVersion = 'a-tool-version';

        return invokeValidationWithUrls().then(() => {
            expect(getPostBody().metadata.toolVersion).toBe('a-tool-version');
        });
    }));

    it('should send a parent id', willResolve(() => {
        mockUuids[0] = 'a-unique-parent-id';
        mockUuids[1] = 'a-unique-id-1';
        mockUuids[2] = 'a-unique-id-2';

        return invokeValidationWithPactBroker().then(() => {
            expect(getPostBody(0).parentId).toBe('a-unique-parent-id');
            expect(getPostBody(1).parentId).toBe('a-unique-parent-id');
        });
    }));

    it('should send the duration in seconds', willResolve(() => {
        mockMetadataResponses.uptime = 1.234;

        return invokeValidationWithUrls().then(() => {
            expect(getPostBody().result.duration).toBe(1.234);
        });
    }));

    it('should send the error count when there are no errors', willResolve(() =>
        invokeValidationWithUrls().then(() => {
            expect(getPostBody().result.errors).toEqual({count: 0});
        })
    ));

    it('should send the error count when there are errors', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(interactionBuilder.withRequestPath('/does/not/exist'))
            .build();

        const result = invokeValidationWithUrls(pactFile);

        return expectToReject(result).then(() => {
            expect(getPostBody().result.errors.count).toBe(1);
        });
    }));

    it('should send the count of each error type when there are errors', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(interactionBuilder.withRequestPath('/does/not/exist'))
            .withInteraction(interactionBuilder.withRequestPath('/also/does/not/exist'))
            .withInteraction(interactionBuilder.withRequestPath('/does/exist').withResponseStatus(201))
            .build();

        const result = invokeValidationWithUrls(pactFile);

        return expectToReject(result).then(() => {
            expect(getPostBody().result.errors['spv.request.path-or-method.unknown']).toBe(2);
            expect(getPostBody().result.errors['spv.response.status.unknown']).toBe(1);
        });
    }));

    it('should send the success of the validation when it is successful', willResolve(() =>
        invokeValidationWithUrls().then(() => {
            expect(getPostBody().result.success).toBe(true);
        })
    ));

    it('should send the success of the validation when it fails', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(interactionBuilder.withRequestPath('/does/not/exist'))
            .build();

        const result = invokeValidationWithUrls(pactFile);

        return expectToReject(result).then(() => {
            expect(getPostBody().result.success).toBe(false);
        });
    }));

    it('should send the warning count when there are no warnings', willResolve(() =>
        invokeValidationWithUrls().then(() => {
            expect(getPostBody().result.warnings).toEqual({count: 0});
        })
    ));

    it('should send the warning count when there are warnings', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(interactionBuilder
                .withRequestPath('/does/exist')
                .withRequestBody({not: 'in the spec'})
            )
            .build();

        return invokeValidationWithUrls(pactFile).then(() => {
            expect(getPostBody().result.warnings.count).toBe(1);
        });
    }));

    it('should send the count of each warning type when there are warnings', willResolve(() => {
        const doesExistInteractionBuilder = interactionBuilder.withRequestPath('/does/exist');

        const pactFile = defaultPactBuilder
            .withInteraction(doesExistInteractionBuilder.withRequestBody({not: 'in the spec'}))
            .withInteraction(doesExistInteractionBuilder.withRequestBody({also: 'not in the spec'}))
            .withInteraction(doesExistInteractionBuilder.withRequestHeader('x-not-in-the', 'spec'))
            .build();

        return invokeValidationWithUrls(pactFile).then(() => {
            expect(getPostBody().result.warnings['spv.request.body.unknown']).toBe(2);
            expect(getPostBody().result.warnings['spv.request.header.unknown']).toBe(1);
        });
    }));

    it('should send the source', willResolve(() =>
        invokeValidationWithUrls().then(() => {
            expect(getPostBody().source).toBe('swagger-mock-validator');
        })
    ));
});
