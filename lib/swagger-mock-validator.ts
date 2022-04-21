import * as _ from 'lodash';
import {
    ValidationOutcome,
    ValidationResult
} from './api-types';
import {Analytics} from './swagger-mock-validator/analytics';
import {FileStore} from './swagger-mock-validator/file-store';
import {MockParser} from './swagger-mock-validator/mock-parser';
import {ParsedMock} from './swagger-mock-validator/mock-parser/parsed-mock';
import {PactBroker} from './swagger-mock-validator/pact-broker';
import {SpecParser} from './swagger-mock-validator/spec-parser';
import {
    MockSource,
    ParsedSwaggerMockValidatorOptions,
    SerializedMock,
    SerializedSpec,
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

const parseUserOptions = (userOptions: SwaggerMockValidatorUserOptions): ParsedSwaggerMockValidatorOptions => ({
    ...userOptions,
    mockSource: getMockSource(userOptions.mockPathOrUrl, userOptions.providerName),
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

    public constructor(
        private readonly fileStore: FileStore,
        private readonly pactBroker: PactBroker,
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
        const whenSpecContent = this.getSpecFromFileOrUrl(options.specPathOrUrl);

        const whenMocks = options.providerName ?
            this.pactBroker.loadPacts({
                pactBrokerUrl: options.mockPathOrUrl,
                providerName: options.providerName,
                tag: options.tag
            }) : this.getPactFromFileOrUrl(options.mockPathOrUrl);

        const [spec, mocks] = await Promise.all([whenSpecContent, whenMocks]);
        return {spec, mocks};
    }

    private async getSpecFromFileOrUrl(specPathOrUrl: string): Promise<SerializedSpec> {
        const content = await this.fileStore.loadFile(specPathOrUrl);

        return {
            content,
            format: 'auto-detect',
            pathOrUrl: specPathOrUrl
        };
    }

    private async getPactFromFileOrUrl(mockPathOrUrl: string): Promise<SerializedMock[]> {
        const content = await this.fileStore.loadFile(mockPathOrUrl);

        return [{
            content,
            format: 'auto-detect',
            pathOrUrl: mockPathOrUrl
        }];
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
}
