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
    PactBrokerProviderPactsLinksPact,
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
    specSource: getSpecSource(userOptions.specPathOrUrl)
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
    public constructor(
        private readonly fileStore: FileStore,
        private readonly resourceLoader: ResourceLoader,
        private readonly analytics: Analytics) {}

    public async validate(userOptions: SwaggerMockValidatorUserOptions): Promise<ValidationOutcome> {
        const options = parseUserOptions(userOptions);
        const {spec, mocks} = await this.loadSpecAndMocks(options);

        const validationOutcomes = await Promise.all(
            mocks.map((mock) => this.validateSpecAndMock(spec, mock, options))
        );

        return combineValidationOutcomes(validationOutcomes);
    }

    private async loadSpecAndMocks(
        options: ParsedSwaggerMockValidatorOptions
    ): Promise<{spec: SerializedSpec, mocks: SerializedMock[]}> {
        const whenSpecContent = this.fileStore.loadFile(options.specPathOrUrl);

        const mockPathsOrUrls = options.providerName
            ? await this.getPactFilesFromBroker(options.mockPathOrUrl, options.providerName)
            : [options.mockPathOrUrl];

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

    private async getPactFilesFromBroker(mockPathOrUrl: string, providerName: string): Promise<string[]> {
        const pactBrokerResponse = await this.resourceLoader.load<PactBroker>(mockPathOrUrl);

        const providerPactsUrlTemplate: string = _.get(pactBrokerResponse, '_links.pb:latest-provider-pacts.href');
        if (!providerPactsUrlTemplate) {
            throw new SwaggerMockValidatorErrorImpl(
                'SWAGGER_MOCK_VALIDATOR_READ_ERROR',
                `Unable to read "${mockPathOrUrl}": No latest pact file url found`
            );
        }
        const providerPactsUrl = providerPactsUrlTemplate.replace('{provider}', providerName);
        const providerPactsResponse = await this.resourceLoader.load<PactBrokerProviderPacts>(providerPactsUrl);

        const providerPacts: PactBrokerProviderPactsLinksPact[] = _.get(providerPactsResponse, '_links.pacts', []);
        return _.map(providerPacts, (providerPact) => providerPact.href);
    }
}
