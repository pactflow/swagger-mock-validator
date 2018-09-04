import * as _ from 'lodash';
import {
    ValidationOutcome,
    ValidationResult
} from './api-types';
import {Analytics} from './swagger-mock-validator/analytics';
import {FileStore} from './swagger-mock-validator/file-store';
import {MockParser} from './swagger-mock-validator/mock-parser';
import {ParsedMock} from './swagger-mock-validator/mock-parser/parsed-mock';
import {ResourceLoader} from './swagger-mock-validator/resource-loader';
import {SpecParser} from './swagger-mock-validator/spec-parser';
import {SwaggerMockValidatorErrorImpl} from './swagger-mock-validator/swagger-mock-validator-error-impl';
import {
    MockSource,
    PactBroker,
    PactBrokerProviderPacts,
    PactBrokerProviderPactsLinksPact, PactBrokerUserOptions,
    ParsedSwaggerMockValidatorOptions,
    SerializedMock, SerializedSpec,
    SpecSource,
    SwaggerMockValidatorUserOptions,
    ValidateOptions
} from './swagger-mock-validator/types';
import {validateSpecAndMock} from './swagger-mock-validator/validate-spec-and-mock';

const getMockSource = (mockPathOrUrl: string, providerName?: string): MockSource => {
    if (providerName) {
        return 'pactBroker';
    } else if (FileStore.isUrl(mockPathOrUrl)) {
        return 'url';
    }

    return 'path';
};

const getSpecSource = (specPathOrUrl: string): SpecSource => FileStore.isUrl(specPathOrUrl) ? 'url' : 'path';

// tslint:disable:cyclomatic-complexity
const parseUserOptions = (userOptions: SwaggerMockValidatorUserOptions): ParsedSwaggerMockValidatorOptions => ({
    analyticsUrl: userOptions.analyticsUrl,
    mockPathOrUrl: userOptions.mockPathOrUrl,
    mockSource: getMockSource(userOptions.mockPathOrUrl, userOptions.providerName),
    providerName: userOptions.providerName,
    specPathOrUrl: userOptions.specPathOrUrl,
    specSource: getSpecSource(userOptions.specPathOrUrl),
    tag: userOptions.tag
});

const combineValidationResults = (validationResults: ValidationResult[][]): ValidationResult[] => {
    const flattenedValidationResults = _.flatten(validationResults);
    return _.uniqWith(flattenedValidationResults, _.isEqual);
};

const combineValidationOutcomes = (validationOutcomes: ValidationOutcome[]): ValidationOutcome => {
    return {
        errors: combineValidationResults(validationOutcomes.map((validationOutcome) => validationOutcome.errors)),
        failureReason: _(validationOutcomes)
            .map((outcome: ValidationOutcome) => outcome.failureReason)
            .filter((failureReason) => failureReason !== undefined)
            .join(', ') || undefined,
        success: _.every(validationOutcomes, (outcome: ValidationOutcome) => outcome.success),
        warnings: combineValidationResults(validationOutcomes.map((validationOutcome) => validationOutcome.warnings))
    };
};

interface ValidationSpecAndMockContentResult {
    parsedMock?: ParsedMock;
    validationOutcome: ValidationOutcome;
}

export const validateSpecAndMockContent = async (
    options: ValidateOptions
): Promise<ValidationSpecAndMockContentResult> => {
    const spec = options.spec;
    const mock = options.mock;

    const parsedSpec = await SpecParser.parse(spec);
    const parsedMock = MockParser.parse(mock);
    const validationOutcome = await validateSpecAndMock(parsedMock, parsedSpec);

    return {
        parsedMock,
        validationOutcome
    };
};

export class SwaggerMockValidator {
    private static getNoMocksInBrokerValidationOutcome(): ValidationOutcome[] {
        const noMocksValidationOutcome: ValidationOutcome = {
            errors: [],
            success: true,
            warnings: [{
                code: 'pact-broker.no-pacts-found',
                message: 'No consumer pacts found in Pact Broker',
                source: 'pact-broker',
                type: 'warning'
            }]
        };
        return [noMocksValidationOutcome];
    }

    private static getProviderTemplateUrl(pactBrokerRootResponse: PactBroker, template: string): string {
        return _.get(pactBrokerRootResponse, template);
    }

    public constructor(
        private readonly fileStore: FileStore,
        private readonly resourceLoader: ResourceLoader,
        private readonly analytics: Analytics) {
    }

    public async validate(userOptions: SwaggerMockValidatorUserOptions): Promise<ValidationOutcome> {
        const options = parseUserOptions(userOptions);
        const {spec, mocks} = await this.loadSpecAndMocks(options);

        const validationOutcomes = await this.getValidationOutcomes(spec, mocks, options);

        return combineValidationOutcomes(validationOutcomes);
    }

    private async loadSpecAndMocks(
        options: ParsedSwaggerMockValidatorOptions
    ): Promise<{ spec: SerializedSpec, mocks: SerializedMock[] }> {
        const whenSpecContent = this.fileStore.loadFile(options.specPathOrUrl);

        const mockPathsOrUrls = options.providerName
            ? await this.getPactUrlsFromBroker({
                pactBrokerUrl: options.mockPathOrUrl,
                providerName: options.providerName,
                tag: options.tag
            }) : [options.mockPathOrUrl];

        const whenMocks = Promise.all(
            mockPathsOrUrls.map(async (mockPathOrUrl): Promise<SerializedMock> => ({
                content: await this.fileStore.loadFile(mockPathOrUrl),
                format: 'auto-detect',
                pathOrUrl: mockPathOrUrl
            }))
        );

        const [specContent, mocks] = await Promise.all([whenSpecContent, whenMocks]);

        const spec: SerializedSpec = {
            content: specContent,
            format: 'auto-detect',
            pathOrUrl: options.specPathOrUrl
        };
        return {spec, mocks};
    }

    private async getValidationOutcomes(
        spec: SerializedSpec, mocks: SerializedMock[], options: ParsedSwaggerMockValidatorOptions
    ): Promise<ValidationOutcome[]> {
        if (mocks.length === 0) {
            return SwaggerMockValidator.getNoMocksInBrokerValidationOutcome();
        }

        return Promise.all(
            mocks.map((mock) => this.validateSpecAndMock(spec, mock, options))
        );
    }

    private async validateSpecAndMock(
        spec: SerializedSpec, mock: SerializedMock, options: ParsedSwaggerMockValidatorOptions
    ): Promise<ValidationOutcome> {
        const result = await validateSpecAndMockContent({mock, spec});

        if (result.parsedMock) {
            await this.postAnalyticEvent(options, result.parsedMock, result.validationOutcome);
        }

        return result.validationOutcome;
    }

    private async postAnalyticEvent(
        options: ParsedSwaggerMockValidatorOptions,
        parsedMock: ParsedMock,
        validationOutcome: ValidationOutcome
    ): Promise<void> {
        if (options.analyticsUrl) {
            try {
                await this.analytics.postEvent({
                    analyticsUrl: options.analyticsUrl,
                    consumer: parsedMock.consumer,
                    mockPathOrUrl: parsedMock.pathOrUrl,
                    mockSource: options.mockSource,
                    provider: parsedMock.provider,
                    specPathOrUrl: options.specPathOrUrl,
                    specSource: options.specSource,
                    validationOutcome
                });
            } catch (error) {
                // do not fail tool on analytics errors
            }
        }
    }

    private async getPactUrlsFromBroker(options: PactBrokerUserOptions): Promise<string[]> {
        const pactBrokerRootResponse = await this.resourceLoader.load<PactBroker>(options.pactBrokerUrl);
        const providerPactsUrl = this.getUrlForProviderPacts(pactBrokerRootResponse, options);

        return this.getPactUrls(providerPactsUrl);
    }

    private getUrlForProviderPacts(pactBrokerRootResponse: PactBroker, options: PactBrokerUserOptions): string {
        return options.tag
            ? this.getUrlForProviderPactsByTag(pactBrokerRootResponse, {
                pactBrokerUrl: options.pactBrokerUrl,
                providerName: options.providerName,
                tag: options.tag
            })
            : this.getUrlForAllProviderPacts(pactBrokerRootResponse, options);
    }

    private getUrlForProviderPactsByTag(pactBrokerRootResponse: PactBroker,
                                        options: Required<PactBrokerUserOptions>): string {
        const providerTemplateUrl = SwaggerMockValidator.getProviderTemplateUrl(
            pactBrokerRootResponse,
            '_links.pb:latest-provider-pacts-with-tag.href'
        );

        if (!providerTemplateUrl) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                `Unable to read "${options.pactBrokerUrl}": No latest pact file url found for tag`
            );
        }

        return this.getSpecificUrlFromTemplate(
            providerTemplateUrl, {provider: options.providerName, tag: options.tag}
        );
    }

    private getUrlForAllProviderPacts(pactBrokerRootResponse: PactBroker, options: PactBrokerUserOptions): string {
        const providerTemplateUrl = SwaggerMockValidator.getProviderTemplateUrl(
            pactBrokerRootResponse,
            '_links.pb:latest-provider-pacts.href'
        );

        if (!providerTemplateUrl) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                `Unable to read "${options.pactBrokerUrl}": No latest pact file url found`
            );
        }

        return this.getSpecificUrlFromTemplate(
            providerTemplateUrl, {provider: options.providerName}
        );
    }

    private getSpecificUrlFromTemplate(
        providerTemplateUrl: string, parameters: { [key: string]: string }
    ): string {
        let specificUrl = providerTemplateUrl;
        Object.keys(parameters).forEach((key) => {
            const encodedParameterValue = encodeURIComponent(parameters[key]);
            specificUrl = specificUrl.replace(`{${key}}`, encodedParameterValue);
        });

        return specificUrl;
    }

    private async getPactUrls(providerPactsUrl: string): Promise<string[]> {
        const providerUrlResponse = await this.resourceLoader.load<PactBrokerProviderPacts>(providerPactsUrl);
        const providerPactEntries: PactBrokerProviderPactsLinksPact[] = _.get(providerUrlResponse, '_links.pacts', []);

        return _.map(providerPactEntries, (providerPact) => providerPact.href);
    }
}
