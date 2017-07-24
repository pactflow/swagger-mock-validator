import {willResolve} from 'jasmine-promise-tools';
import * as q from 'q';
import {
    CoverageHit,
    HttpClient,
    Pact,
    SpecCoverage,
    SpecOperationCoverage,
    SpecResponseCoverage,
    Swagger,
    SwaggerMockValidatorOptions, SwaggerMockValidatorOutcome
} from '../../lib/swagger-mock-validator/types';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {pactBrokerBuilder} from './support/pact-broker-builder';
import {providerPactsBuilder} from './support/pact-broker-builder/provider-pacts-builder';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    pathBuilder,
    responseBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import {
    default as swaggerPactValidatorLoader,
    MockFileSystemResponses, MockHttpClientResponses
} from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

const getCoverageHits = ((coverage?: SpecCoverage): string[][] => {
    if (!coverage) {
        throw Error('No coverage');
    }
    const hits: string[][] = [];
    coverage.operations.forEach((operationCoverage: SpecOperationCoverage) => {
        operationCoverage.responses.forEach((responseCoverage: SpecResponseCoverage) => {
            responseCoverage.hits.forEach((coverageHit: CoverageHit) => {
                hits.push([responseCoverage.response.location, coverageHit.interaction.description]);
            });
        });
    });
    return hits.sort();
});

describe('coverage', () => {
    let mockFiles: MockFileSystemResponses;
    let mockUrls: MockHttpClientResponses;
    let mockHttpClient: HttpClient;
    const defaultPactBuilder = pactBuilder
        .withConsumer('a-default-consumer')
        .withProvider('a-default-provider');

    const defaultSwaggerBuilder = swaggerBuilder
        .withPath('/exist/resource',
            pathBuilder
                .withGetOperation(
                    operationBuilder
                        .withResponse(200, responseBuilder)
                        .withResponse(401, responseBuilder)
                )
                .withPostOperation(
                    operationBuilder
                        .withResponse(200, responseBuilder)
                        .withResponse(500, responseBuilder))
        );

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
        mockFiles = {};
        mockUrls = {};
        mockHttpClient = swaggerPactValidatorLoader.createMockHttpClient(mockUrls);
    });

    const invokeValidation = (options: SwaggerMockValidatorOptions) => {
        return swaggerPactValidatorLoader.invokeWithMocks({
            coverage: options.coverage,
            fileSystem: swaggerPactValidatorLoader.createMockFileSystem(mockFiles),
            httpClient: mockHttpClient,
            mockPathOrUrl: options.mockPathOrUrl,
            providerName: options.providerName,
            specPathOrUrl: options.specPathOrUrl
        });
    };

    const invokeValidationWithPaths = (
        pactFile?: Pact,
        swaggerFile?: Swagger,
        disableCoverage?: boolean
    ): Promise<SwaggerMockValidatorOutcome> => {
        mockFiles['pact.json'] = q(JSON.stringify(pactFile || defaultPactBuilder.build()));
        mockFiles['swagger.json'] = q(JSON.stringify(swaggerFile || defaultSwaggerBuilder.build()));

        return invokeValidation({
            coverage: !disableCoverage,
            mockPathOrUrl: 'pact.json',
            specPathOrUrl: 'swagger.json'
        });
    };

    const invokeValidationWithPactBroker = (
        consumer1PactFile?: Pact,
        consumer2PactFile?: Pact,
        swaggerFile?: Swagger
    ): Promise<SwaggerMockValidatorOutcome> => {
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
            coverage: true,
            mockPathOrUrl: 'http://pact-broker.com',
            providerName: 'a-provider',
            specPathOrUrl: 'http://domain.com/swagger.json'
        });
    };

    it('should report no coverage when no interactions are defined', willResolve(() =>
        invokeValidationWithPaths().then((outcome) => {
            expect(getCoverageHits(outcome.coverage)).toEqual([]);
        })
    ));

    it('should report interaction coverage on the matched spec operation and response', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(
                interactionBuilder
                    .withDescription('interaction A')
                    .withRequestMethodGet()
                    .withResponseStatus(401)
                    .withRequestPath('/exist/resource')
            )
            .build();
        return invokeValidationWithPaths(pactFile).then((outcome) => {
            expect(getCoverageHits(outcome.coverage)).toEqual([
                ['[swaggerRoot].paths./exist/resource.get.responses.401', 'interaction A']
            ]);
        });
    }));

    it('should report interaction coverage for all the verified operations', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(
                interactionBuilder
                    .withDescription('interaction A')
                    .withRequestMethodGet()
                    .withRequestPath('/exist/resource')
                    .withResponseStatus(401)
            )
            .withInteraction(
                interactionBuilder
                    .withDescription('interaction B')
                    .withRequestMethodGet()
                    .withRequestPath('/exist/resource')
                    .withResponseStatus(200)
            )
            .withInteraction(
                interactionBuilder
                    .withDescription('interaction C')
                    .withRequestMethodPost()
                    .withRequestPath('/exist/resource')
                    .withResponseStatus(500)
            )
            .build();
        return invokeValidationWithPaths(pactFile).then((outcome) => {
            expect(getCoverageHits(outcome.coverage)).toEqual([
                ['[swaggerRoot].paths./exist/resource.get.responses.401', 'interaction A'],
                ['[swaggerRoot].paths./exist/resource.get.responses.200', 'interaction B'],
                ['[swaggerRoot].paths./exist/resource.post.responses.500', 'interaction C']
            ].sort());
        });
    }));

    it('should support multiple interactions covering the same response', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(
                interactionBuilder
                    .withDescription('interaction 1')
                    .withRequestMethodGet()
                    .withResponseStatus(200)
                    .withRequestPath('/exist/resource')
            )
            .withInteraction(
                interactionBuilder
                    .withDescription('interaction 2')
                    .withRequestMethodGet()
                    .withRequestPath('/exist/resource')
                    .withResponseStatus(200)
            )
            .build();
        return invokeValidationWithPaths(pactFile).then((outcome) => {
            expect(getCoverageHits(outcome.coverage)).toEqual([
                ['[swaggerRoot].paths./exist/resource.get.responses.200', 'interaction 1'],
                ['[swaggerRoot].paths./exist/resource.get.responses.200', 'interaction 2']
            ].sort());
        });
    }));

    it('should consolidate coverage information when multiple consumers are validated', willResolve(() => {
        const interaction = interactionBuilder
            .withRequestMethodGet()
            .withResponseStatus(200)
            .withRequestPath('/exist/resource');
        const pactA = defaultPactBuilder
            .withConsumer('consumer A')
            .withInteraction(
                interaction.withDescription('interaction 1')
            );
        const pactB = defaultPactBuilder
            .withConsumer('consumer B')
            .withInteraction(
                interaction.withDescription('interaction 2')
            );

        return invokeValidationWithPactBroker(pactA.build(), pactB.build()).then((outcome) => {
            expect(getCoverageHits(outcome.coverage)).toEqual([
                ['[swaggerRoot].paths./exist/resource.get.responses.200', 'interaction 1'],
                ['[swaggerRoot].paths./exist/resource.get.responses.200', 'interaction 2']
            ].sort());
        });
    }));

    it('should not process coverage information when disabled', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(
                interactionBuilder
                    .withRequestMethodGet()
                    .withResponseStatus(401)
                    .withRequestPath('/exist/resource')
            )
            .build();
        return invokeValidationWithPaths(pactFile, defaultSwaggerBuilder.build(), true).then((outcome) => {
            expect(outcome.coverage).toBeUndefined();
        });
    }));
});
