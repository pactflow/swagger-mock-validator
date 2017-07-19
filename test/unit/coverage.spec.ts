import {willResolve} from 'jasmine-promise-tools';
import * as q from 'q';
import displayCoverage from '../../lib/swagger-mock-validator/coverage/console-coverage-reporter';
import {
    CoverageHit,
    HttpClient,
    Pact,
    ParsedSpecOperation,
    ParsedSpecResponse,
    Printer,
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

interface CoverageAnalyzer {
    results: SpecCoverage | undefined;
    countTotalHits: () => number;
    countOperationHits: (operation: string) => number;
    countResponseHits: (response: string) => number;
    getResponseHits: (response: string) => CoverageHit[];
}

interface ConsoleLogMock {
    print: Printer;
    lines: () => string[];
}

const newPrinter = ((): ConsoleLogMock => {
    const calls: string[] = [];
    return {
        lines: () => calls.join('\n').split('\n'),
        print: (message?: any) => calls.push(message)
    };
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

    const newCoverageAnalyzer = ((results: SpecCoverage | undefined): CoverageAnalyzer => {
        const analyzer = {
            countOperationHits: (operation: string): number => {
                return analyzer.traverse(
                    (parsedOperation: ParsedSpecOperation) => parsedOperation.location === operation,
                    () => true
                ).length;
            },
            countResponseHits: (response: string): number => {
                return analyzer.getResponseHits(response).length;
            },
            countTotalHits: (): number => {
                return analyzer.traverse(() => true, () => true).length;
            },
            getResponseHits: (response: string): CoverageHit[] => {
                return analyzer.traverse(
                    () => true,
                    (parsedResponse: ParsedSpecResponse) => parsedResponse.location === response
                );
            },
            results,
            traverse: (
                operationFilter: (operation: ParsedSpecOperation) => boolean,
                responseFilter: (response: ParsedSpecResponse) => boolean
            ): CoverageHit[] => {
                const found: CoverageHit[] = [];
                if (!analyzer.results) {
                    return found;
                }
                analyzer.results.operations.forEach((operationCoverage: SpecOperationCoverage) => {
                    if (operationFilter(operationCoverage.operation)) {
                        operationCoverage.responses.forEach((responseCoverage: SpecResponseCoverage) => {
                            if (responseFilter(responseCoverage.response)) {
                                found.push.apply(found, responseCoverage.hits);
                            }
                        });
                    }
                });
                return found;
            }
        };
        return analyzer;
    });

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
        }).then((results: SwaggerMockValidatorOutcome) => newCoverageAnalyzer(results.coverage));
    };

    const invokeValidationWithPaths = (
        pactFile?: Pact,
        swaggerFile?: Swagger,
        disableCoverage?: boolean
    ): Promise<CoverageAnalyzer> => {
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
    ): Promise<CoverageAnalyzer> => {
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
        invokeValidationWithPaths().then((coverage: CoverageAnalyzer) => {
            expect(coverage.countTotalHits()).toBe(0);
        })
    ));

    it('should print a report with the coverage summary', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(
                interactionBuilder
                    .withDescription('Unauthorized')
                    .withRequestMethodGet()
                    .withRequestPath('/exist/resource')
                    .withResponseStatus(401)
            )
            .withInteraction(
                interactionBuilder
                    .withDescription('OK')
                    .withRequestMethodGet()
                    .withRequestPath('/exist/resource')
                    .withResponseStatus(200)
            )
            .withInteraction(
                interactionBuilder
                    .withDescription('Server Error')
                    .withRequestMethodPost()
                    .withRequestPath('/exist/resource')
                    .withResponseStatus(500)
            )
            .build();
        return invokeValidationWithPaths(pactFile).then((coverage) => {
            const chalk = require('chalk');
            const printer = newPrinter();

            chalk.enabled = false;
            displayCoverage(coverage.results, printer.print);
            chalk.enabled = true;

            expect(printer.lines()).toEqual([
                'COVERAGE:',
                '---------',
                '[Spec: 75.00%] swagger.json',
                '  [Operation: 100.00%] GET /exist/resource',
                '    - Response: 200 ✔',
                '      ○ a-default-consumer ⇨ a-default-provider: OK',
                '    - Response: 401 ✔',
                '      ○ a-default-consumer ⇨ a-default-provider: Unauthorized',
                '  [Operation: 50.00%] POST /exist/resource',
                '    - Response: 200 ✘',
                '    - Response: 500 ✔',
                '      ○ a-default-consumer ⇨ a-default-provider: Server Error',
                '',
                ''
            ]);
        });
    }));

    it('should report interaction coverage on the matched spec operation and response', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(
                interactionBuilder
                    .withRequestMethodGet()
                    .withResponseStatus(401)
                    .withRequestPath('/exist/resource')
            )
            .build();
        return invokeValidationWithPaths(pactFile).then((coverage) => {
            expect(coverage.countTotalHits()).toBe(1);
            expect(coverage.countOperationHits('[swaggerRoot].paths./exist/resource.get')).toBe(1);
            expect(coverage.countResponseHits('[swaggerRoot].paths./exist/resource.get.responses.401')).toBe(1);
        });
    }));

    it('should report interaction coverage for all the verified operations', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(
                interactionBuilder
                    .withRequestMethodGet()
                    .withRequestPath('/exist/resource')
                    .withResponseStatus(401)
            )
            .withInteraction(
                interactionBuilder
                    .withRequestMethodGet()
                    .withRequestPath('/exist/resource')
                    .withResponseStatus(200)
            )
            .withInteraction(
                interactionBuilder
                    .withRequestMethodPost()
                    .withRequestPath('/exist/resource')
                    .withResponseStatus(500)
            )
            .build();
        return invokeValidationWithPaths(pactFile).then((coverage) => {
            expect(coverage.countTotalHits()).toBe(3);
            expect(coverage.countOperationHits('[swaggerRoot].paths./exist/resource.get')).toBe(2);
            expect(coverage.countOperationHits('[swaggerRoot].paths./exist/resource.post')).toBe(1);
            expect(coverage.countResponseHits('[swaggerRoot].paths./exist/resource.get.responses.401')).toBe(1);
            expect(coverage.countResponseHits('[swaggerRoot].paths./exist/resource.get.responses.200')).toBe(1);
            expect(coverage.countResponseHits('[swaggerRoot].paths./exist/resource.post.responses.500')).toBe(1);
            expect(coverage.countResponseHits('[swaggerRoot].paths./exist/resource.post.responses.201')).toBe(0);
        });
    }));

    it('should track what interactions covered a particular response', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(
                interactionBuilder
                    .withDescription('interaction 1')
                    .withRequestMethodGet()
                    .withResponseStatus(401)
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
        return invokeValidationWithPaths(pactFile).then((coverage) => {
            const r401hits = coverage.getResponseHits(
                '[swaggerRoot].paths./exist/resource.get.responses.401'
            );
            const r200hits = coverage.getResponseHits(
                '[swaggerRoot].paths./exist/resource.get.responses.200'
            );
            expect(coverage.countTotalHits()).toBe(2);
            expect(r401hits.length).toBe(1);
            expect(r401hits[0].interaction.description).toEqual('interaction 1');
            expect(r200hits.length).toBe(1);
            expect(r200hits[0].interaction.description).toEqual('interaction 2');
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
        return invokeValidationWithPaths(pactFile).then((coverage) => {
            const r200hits = coverage.getResponseHits(
                '[swaggerRoot].paths./exist/resource.get.responses.200'
            );
            expect(coverage.countTotalHits()).toBe(2);
            expect(r200hits.length).toBe(2);
            expect(r200hits[0].interaction.description).toEqual('interaction 1');
            expect(r200hits[1].interaction.description).toEqual('interaction 2');
        });
    }));

    it('should consolidate coverage information when multiple consumers are validated', willResolve(() => {
        const pactA = defaultPactBuilder
            .withConsumer('consumer A')
            .withInteraction(
                interactionBuilder
                    .withDescription('interaction 1')
                    .withRequestMethodGet()
                    .withResponseStatus(200)
                    .withRequestPath('/exist/resource')
            );
        const pactB = pactA.withConsumer('consumer B');
        return invokeValidationWithPactBroker(pactA.build(), pactB.build()).then((coverage) => {
            expect(coverage.countTotalHits()).toBe(2);
            const hits = coverage.getResponseHits('[swaggerRoot].paths./exist/resource.get.responses.200');
            expect(hits[0].mock.consumer).toEqual('consumer A');
            expect(hits[1].mock.consumer).toEqual('consumer B');
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
        return invokeValidationWithPaths(pactFile, defaultSwaggerBuilder.build(), true).then((coverage) => {
            expect(coverage.results).toBeUndefined();
        });
    }));
});
