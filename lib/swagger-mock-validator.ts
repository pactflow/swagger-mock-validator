import * as _ from 'lodash';
import {
    SwaggerMockValidatorOptions, SwaggerMockValidatorOptionsMockType, SwaggerMockValidatorOptionsSpecType,
    ValidationOutcome,
    ValidationResult
} from './api-types';
import analytics from './swagger-mock-validator/analytics';
import defaultMetadata from './swagger-mock-validator/analytics/metadata';
import {FileStore} from './swagger-mock-validator/file-store';
import defaultFileSystem from './swagger-mock-validator/json-loader/file-system';
import defaultHttpClient from './swagger-mock-validator/json-loader/http-client';
import mockParser from './swagger-mock-validator/mock-parser';
import resolveSwagger from './swagger-mock-validator/resolve-swagger';
import {ResourceLoader} from './swagger-mock-validator/resource-loader';
import specParser from './swagger-mock-validator/spec-parser';
import {transformStringToObject} from './swagger-mock-validator/transform-string-to-object';
import {
    MockSource,
    Pact,
    PactBroker,
    PactBrokerProviderPacts,
    PactBrokerProviderPactsLinksPact,
    ParsedMock,
    ParsedSwaggerMockValidatorOptions,
    SpecSource,
    SwaggerMockValidatorInternal,
    SwaggerMockValidatorInternalOptions
} from './swagger-mock-validator/types';
import defaultUuidGenerator from './swagger-mock-validator/uuid-generator';
import validatePact from './swagger-mock-validator/validate-pact';
import validateSpecAndMock from './swagger-mock-validator/validate-spec-and-mock';
import validateSwagger from './swagger-mock-validator/validate-swagger';

type PostAnalyticEvent = (parsedMock: ParsedMock,
                          outcome: ValidationOutcome) => Promise<void>;

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
const parseUserOptions = (userOptions: SwaggerMockValidatorInternalOptions): ParsedSwaggerMockValidatorOptions => ({
    analyticsUrl: userOptions.analyticsUrl,
    fileSystem: userOptions.fileSystem || defaultFileSystem,
    httpClient: userOptions.httpClient || defaultHttpClient,
    metadata: userOptions.metadata || defaultMetadata,
    mockPathOrUrl: userOptions.mockPathOrUrl,
    mockSource: getMockSource(userOptions.mockPathOrUrl, userOptions.providerName),
    providerName: userOptions.providerName,
    specPathOrUrl: userOptions.specPathOrUrl,
    specSource: getSpecSource(userOptions.specPathOrUrl),
    uuidGenerator: userOptions.uuidGenerator || defaultUuidGenerator
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

const createPostAnalyticEventFunction = (options: ParsedSwaggerMockValidatorOptions): PostAnalyticEvent => {
    const analyticsUrl = options.analyticsUrl;

    if (!analyticsUrl) {
        return () => Promise.resolve(undefined);
    }

    const parentId = options.uuidGenerator.generate();

    return (parsedMock, validationOutcome) => analytics.postEvent({
        analyticsUrl,
        consumer: parsedMock.consumer,
        httpClient: options.httpClient,
        metadata: options.metadata,
        mockPathOrUrl: parsedMock.pathOrUrl,
        mockSource: options.mockSource,
        parentId,
        provider: parsedMock.provider,
        specPathOrUrl: options.specPathOrUrl,
        specSource: options.specSource,
        uuidGenerator: options.uuidGenerator,
        validationOutcome
    }).catch(() => {
        return;
    });
};

const getPactFilesFromBroker = async (mockPathOrUrl: string,
                                      providerName: string,
                                      resourceLoader: ResourceLoader): Promise<string[]> => {

    const pactBrokerResponse = await resourceLoader.load<PactBroker>(mockPathOrUrl);

    const providerPactsUrlTemplate: string = _.get(pactBrokerResponse, '_links.pb:latest-provider-pacts.href');
    if (!providerPactsUrlTemplate) {
        throw new Error(`No latest pact file url found at "${mockPathOrUrl}"`);
    }
    const providerPactsUrl = providerPactsUrlTemplate.replace('{provider}', providerName);
    const providerPactsResponse = await resourceLoader.load<PactBrokerProviderPacts>(providerPactsUrl);

    const providerPacts: PactBrokerProviderPactsLinksPact[] = _.get(providerPactsResponse, '_links.pacts', []);
    return _.map(providerPacts, (providerPact) => providerPact.href);
};

interface ValidationSpecAndMockContentResult {
    parsedMock?: ParsedMock;
    validationOutcome: ValidationOutcome;
}

export const validateSpecAndMockContent = async (
    options: SwaggerMockValidatorOptions
): Promise<ValidationSpecAndMockContentResult> => {
    const spec = options.spec;
    const mock = options.mock;

    const specJson = transformStringToObject(spec.content, spec.pathOrUrl);
    const specOutcome = await validateSwagger(specJson, spec.pathOrUrl);

    if (!specOutcome.success) {
        return {validationOutcome: specOutcome};
    }

    const mockJson = transformStringToObject<Pact>(mock.content, mock.pathOrUrl);

    const mockOutcome = validatePact(mockJson, mock.pathOrUrl);

    if (!mockOutcome.success) {
        return {validationOutcome: mockOutcome};
    }

    const resolvedSpec = await resolveSwagger(specJson);
    const parsedSpec = specParser.parseSwagger(resolvedSpec, spec.pathOrUrl);
    const parsedMock = mockParser.parsePact(mockJson, mock.pathOrUrl);
    const specAndMockOutcome = await validateSpecAndMock(parsedMock, parsedSpec);
    const validationOutcome = combineValidationOutcomes([specOutcome, mockOutcome, specAndMockOutcome]);

    return {
        parsedMock,
        validationOutcome
    };
};

const swaggerMockValidator: SwaggerMockValidatorInternal = {
    validate: async (userOptions) => {
        const options = parseUserOptions(userOptions);
        const fileStore = new FileStore(options.fileSystem, options.httpClient);
        const resourceLoader = new ResourceLoader(fileStore);
        const postAnalyticEvent = createPostAnalyticEventFunction(options);

        const whenSpecContent = fileStore.loadFile(options.specPathOrUrl);

        const whenMockPathsOrUrls = options.providerName
            ? getPactFilesFromBroker(options.mockPathOrUrl, options.providerName, resourceLoader)
            : Promise.resolve([options.mockPathOrUrl]);

        const whenMocks = whenMockPathsOrUrls.then((mockPathsOrUrls) => {
            return Promise.all(mockPathsOrUrls.map((mockPathOrUrl) => {
                return fileStore.loadFile(mockPathOrUrl).then((content) => {
                    return {
                        content,
                        format: 'pact' as SwaggerMockValidatorOptionsMockType,
                        pathOrUrl: mockPathOrUrl
                    };
                });
            }));
        });

        const specContentAndMocks = await Promise.all([whenSpecContent, whenMocks]);
        const spec = {
            content: specContentAndMocks[0],
            format: 'swagger2' as SwaggerMockValidatorOptionsSpecType,
            pathOrUrl: options.specPathOrUrl
        };
        const mocks = specContentAndMocks[1];

        const validationOutcomes = await Promise.all(mocks.map(async (mock) => {
            const result = await validateSpecAndMockContent({mock, spec});

            if (result.parsedMock) {
                await postAnalyticEvent(result.parsedMock, result.validationOutcome);
            }

            return result.validationOutcome;
        }));

        return combineValidationOutcomes(validationOutcomes);
    }
};

export default swaggerMockValidator;
