import {willResolve} from 'jasmine-promise-tools';
import * as q from 'q';
import displayCoverage from '../../lib/swagger-mock-validator/coverage/console-coverage-reporter';
import {
    FormatterSet,
    Pact,
    Printer,
    SpecCoverage,
    Swagger,
    SwaggerMockValidatorOptions, SwaggerMockValidatorOutcome
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
    default as swaggerPactValidatorLoader,
    MockFileSystemResponses
} from './support/swagger-mock-validator-loader';

declare function expect<T>(actual: T): CustomMatchers<T>;

interface ConsoleLogMock {
    print: Printer;
    output: () => string;
    lines: () => string[];
}

const newPrinter = ((): ConsoleLogMock => {
    const calls: string[] = [];
    return {
        lines: () => calls.join('\n').split('\n'),
        output: () => calls.join('\n'),
        print: (message?: any) => calls.push(message)
    };
});

describe('coverage-report', () => {
    let mockFiles: MockFileSystemResponses;
    const defaultPactBuilder = pactBuilder
        .withConsumer('a-default-consumer')
        .withProvider('a-default-provider')
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
        );

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
        )
        .withPath('/not/covered',
            pathBuilder
                .withGetOperation(
                    operationBuilder
                        .withResponse(200, responseBuilder)
                        .withResponse(404, responseBuilder)
                )
        );

    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
        mockFiles = {};
    });

    const invokeValidation = (options: SwaggerMockValidatorOptions) => {
        return swaggerPactValidatorLoader.invokeWithMocks({
            coverage: true,
            fileSystem: swaggerPactValidatorLoader.createMockFileSystem(mockFiles),
            mockPathOrUrl: options.mockPathOrUrl,
            providerName: options.providerName,
            specPathOrUrl: options.specPathOrUrl
        }).then((results: SwaggerMockValidatorOutcome) => results.coverage);
    };

    const invokeValidationWithPaths = (
        pactFile?: Pact,
        swaggerFile?: Swagger
    ): Promise<SpecCoverage> => {
        mockFiles['pact.json'] = q(JSON.stringify(pactFile || defaultPactBuilder.build()));
        mockFiles['swagger.json'] = q(JSON.stringify(swaggerFile || defaultSwaggerBuilder.build()));

        return invokeValidation({
            mockPathOrUrl: 'pact.json',
            specPathOrUrl: 'swagger.json'
        });
    };

    it('should print a report with the coverage information', willResolve(() => {
        return invokeValidationWithPaths().then((coverage) => {
            const printer = newPrinter();

            const noFormat: FormatterSet = {
                bold: ((text) => text),
                green: ((text) => text),
                red: ((text) => text),
                yellow: ((text) => text)
            };

            displayCoverage(coverage, printer.print, noFormat);
            expect(printer.lines()).toEqual(['',
                'COVERAGE:',
                '---------',
                '[Spec: 50.00%] swagger.json',
                '  [Operation: 100.00%] GET /exist/resource',
                '   - Response: 200 ✔',
                '     ○ a-default-consumer ⇨ a-default-provider: OK',
                '   - Response: 401 ✔',
                '     ○ a-default-consumer ⇨ a-default-provider: Unauthorized',
                '  [Operation: 50.00%] POST /exist/resource',
                '   - Response: 200 ✘',
                '   - Response: 500 ✔',
                '     ○ a-default-consumer ⇨ a-default-provider: Server Error',
                '  [Operation: 0.00%] GET /not/covered',
                '   - Response: 200 ✘',
                '   - Response: 404 ✘',
                ''
            ]);
        });
    }));

    it('should print the report with correct formatting', willResolve(() => {
        return invokeValidationWithPaths().then((coverage) => {
            const printer = newPrinter();

            const mockFormat: FormatterSet = {
                bold: ((text) => `BOLD<${text}>`),
                green: ((text) => `GREEN<${text}>`),
                red: ((text) => `RED<${text}>`),
                yellow: ((text) => `YELLOW<${text}>`)
            };

            displayCoverage(coverage, printer.print, mockFormat);
            const content = printer.output();
            expect(content).toEqual(jasmine.stringMatching('BOLD<swagger.json>'));
            expect(content).toEqual(jasmine.stringMatching('BOLD<GET /exist/resource>'));
            expect(content).toEqual(jasmine.stringMatching('BOLD<Response: 401 GREEN<✔>>'));
            expect(content).toEqual(jasmine.stringMatching('BOLD<Response: 404 RED<✘>>'));
            expect(content).toEqual(jasmine.stringMatching('YELLOW<50.00%>'));
            expect(content).toEqual(jasmine.stringMatching('GREEN<100.00%>'));
            expect(content).toEqual(jasmine.stringMatching('RED<0.00%>'));
        });
    }));
});
