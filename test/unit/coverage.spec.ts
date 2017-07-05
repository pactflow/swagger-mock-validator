import {willResolve} from 'jasmine-promise-tools';
import * as q from 'q';
import {
    Pact, ParsedMockInteraction, ParsedSpecOperation, ParsedSpecResponse, SpecOperationCoverage, SpecResponseCoverage,
    Swagger,
    SwaggerMockValidatorOptions,
    ValidationSuccess
} from '../../lib/swagger-mock-validator/types';
import {customMatchers, CustomMatchers} from './support/custom-jasmine-matchers';
import {interactionBuilder, pactBuilder} from './support/pact-builder';
import {
    operationBuilder,
    pathBuilder,
    responseBuilder,
    swaggerBuilder
} from './support/swagger-builder';
import {
    CoverageAnalyzer,
    default as swaggerPactValidatorLoader,
    MockFileSystemResponses
} from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

describe('coverage', () => {
    let mockFiles: MockFileSystemResponses;
    let coverage: CoverageAnalyzer;
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

    const newCoverageAnalyzer = ((): CoverageAnalyzer => {
        const analyzer = {
            getOperationHits: (operation: string): number => {
                return analyzer.traverse(
                    (parsedOperation: ParsedSpecOperation) => parsedOperation.location === operation).length;
            },
            getResponseHits: (response: string): number => {
                return analyzer.getResponseInteractions(response).length;
            },
            getResponseInteractions: (response: string): ParsedMockInteraction[] => {
                return analyzer.traverse(
                    () => true,
                    (parsedResponse: ParsedSpecResponse) => parsedResponse.location === response
                );
            },
            getTotalHits: (): number => {
                return analyzer.traverse(() => true, () => true).length;
            },
            results: [],
            traverse: (
                operationFilter: (operation: ParsedSpecOperation) => boolean = (() => true),
                responseFilter: (response: ParsedSpecResponse) => boolean = (() => true)
            ): ParsedMockInteraction[] => {
                const found: ParsedMockInteraction[] = [];
                analyzer.results.forEach((operationCoverage: SpecOperationCoverage) => {
                    if (operationFilter(operationCoverage.operation)) {
                        operationCoverage.responses.forEach((responseCoverage: SpecResponseCoverage) => {
                            if (responseFilter(responseCoverage.response)) {
                                found.push.apply(found, responseCoverage.interactions);
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
        coverage = newCoverageAnalyzer();
    });

    const invokeValidation = (options: SwaggerMockValidatorOptions) => {
        return swaggerPactValidatorLoader.invokeWithMocks({
            coverage: options.coverage,
            coverageReporter: swaggerPactValidatorLoader.createMockCoverageReporter(coverage),
            fileSystem: swaggerPactValidatorLoader.createMockFileSystem(mockFiles),
            mockPathOrUrl: options.mockPathOrUrl,
            providerName: options.providerName,
            specPathOrUrl: options.specPathOrUrl
        });
    };

    const invokeValidationWithPaths = (
        pactFile?: Pact,
        swaggerFile?: Swagger,
        coverageEnabled: boolean = true
    ): Promise<ValidationSuccess> => {
        mockFiles['pact.json'] = q(JSON.stringify(pactFile || defaultPactBuilder.build()));
        mockFiles['swagger.json'] = q(JSON.stringify(swaggerFile || defaultSwaggerBuilder.build()));

        return invokeValidation({
            coverage: coverageEnabled,
            mockPathOrUrl: 'pact.json',
            specPathOrUrl: 'swagger.json'
        });
    };

    it('should report no coverage when no interactions are defined', willResolve(() =>
        invokeValidationWithPaths().then(() => {
            expect(coverage.getTotalHits()).toBe(0);
        })
    ));

    it('should report interaction coverage on the matched spec operation and response', willResolve(() => {
        const pactFile = defaultPactBuilder
            .withInteraction(
                interactionBuilder
                    .withRequestMethodGet()
                    .withResponseStatus(401)
                    .withRequestPath('/exist/resource')
            )
            .build();
        return invokeValidationWithPaths(pactFile).then(() => {
            expect(coverage.getTotalHits()).toBe(1);
            expect(coverage.getOperationHits('[swaggerRoot].paths./exist/resource.get')).toBe(1);
            expect(coverage.getResponseHits('[swaggerRoot].paths./exist/resource.get.responses.401')).toBe(1);
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
        return invokeValidationWithPaths(pactFile).then(() => {
            expect(coverage.getTotalHits()).toBe(3);
            expect(coverage.getOperationHits('[swaggerRoot].paths./exist/resource.get')).toBe(2);
            expect(coverage.getOperationHits('[swaggerRoot].paths./exist/resource.post')).toBe(1);
            expect(coverage.getResponseHits('[swaggerRoot].paths./exist/resource.get.responses.401')).toBe(1);
            expect(coverage.getResponseHits('[swaggerRoot].paths./exist/resource.get.responses.200')).toBe(1);
            expect(coverage.getResponseHits('[swaggerRoot].paths./exist/resource.post.responses.500')).toBe(1);
            expect(coverage.getResponseHits('[swaggerRoot].paths./exist/resource.post.responses.201')).toBe(0);
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
        return invokeValidationWithPaths(pactFile).then(() => {
            const r401interactions = coverage.getResponseInteractions(
                '[swaggerRoot].paths./exist/resource.get.responses.401'
            );
            const r200interactions = coverage.getResponseInteractions(
                '[swaggerRoot].paths./exist/resource.get.responses.200'
            );
            expect(coverage.getTotalHits()).toBe(2);
            expect(r401interactions.length).toBe(1);
            expect(r401interactions[0].description).toEqual('interaction 1');
            expect(r200interactions.length).toBe(1);
            expect(r200interactions[0].description).toEqual('interaction 2');
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
        return invokeValidationWithPaths(pactFile).then(() => {
            const r200interactions = coverage.getResponseInteractions(
                '[swaggerRoot].paths./exist/resource.get.responses.200'
            );
            expect(coverage.getTotalHits()).toBe(2);
            expect(r200interactions.length).toBe(2);
            expect(r200interactions[0].description).toEqual('interaction 1');
            expect(r200interactions[1].description).toEqual('interaction 2');
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
        return invokeValidationWithPaths(pactFile, defaultSwaggerBuilder.build(), false).then(() => {
            expect(coverage.getTotalHits()).toBe(0);
        });
    }));
});
