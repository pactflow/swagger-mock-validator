import * as _ from 'lodash';
import * as q from 'q';
import analytics from './swagger-mock-validator/analytics';
import defaultMetadata from './swagger-mock-validator/analytics/metadata';
import jsonLoader from './swagger-mock-validator/json-loader';
import defaultFileSystem from './swagger-mock-validator/json-loader/file-system';
import defaultHttpClient from './swagger-mock-validator/json-loader/http-client';
import mockParser from './swagger-mock-validator/mock-parser';
import resolveSwagger from './swagger-mock-validator/resolve-swagger';
import specParser from './swagger-mock-validator/spec-parser';
import {
    FileSystem,
    HttpClient,
    MockSource,
    Pact,
    PactBroker,
    PactBrokerProviderPacts,
    PactBrokerProviderPactsLinksPact,
    ParsedMock,
    ParsedSpec,
    ParsedSwaggerMockValidatorOptions,
    SpecSource,
    SwaggerMockValidator,
    SwaggerMockValidatorOptions,
    ValidationOutcome,
    ValidationResult
} from './swagger-mock-validator/types';
import defaultUuidGenerator from './swagger-mock-validator/uuid-generator';
import validatePact from './swagger-mock-validator/validate-pact';
import validateSpecAndMock from './swagger-mock-validator/validate-spec-and-mock';
import validateSwagger from './swagger-mock-validator/validate-swagger';

type LoadJson = <T>(pathOrUrl: string) => q.Promise<T>;
type PostAnalyticEvent = (
    parsedMock: ParsedMock,
    outcome: ValidationOutcome
) => q.Promise<void>;

const getMockSource = (mockPathOrUrl: string, providerName?: string): MockSource => {
    if (providerName) {
        return 'pactBroker';
    } else if (mockPathOrUrl.indexOf('http') === 0) {
        return 'url';
    }

    return 'path';
};

interface LoadMockResult {
    outcome: ValidationOutcome;
    mock?: ParsedMock;
}

const getSpecSource = (specPathOrUrl: string): SpecSource =>
    specPathOrUrl.indexOf('http') === 0 ? 'url' : 'path';

// tslint:disable:cyclomatic-complexity
const parseUserOptions = (userOptions: SwaggerMockValidatorOptions): ParsedSwaggerMockValidatorOptions => ({
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

const combineValidationOutcomes = (validationOutcomes: ValidationOutcome[]): ValidationOutcome => {
    return {
        errors: _(validationOutcomes)
            .map((outcome: ValidationOutcome) => outcome.errors)
            .flatten<ValidationResult>()
            .value(),
        reason: _(validationOutcomes)
            .map((outcome: ValidationOutcome) => outcome.reason)
            .filter((reason) => reason !== undefined)
            .join(', ') || undefined,
        success: _(validationOutcomes).every((outcome: ValidationOutcome) => outcome.success ),
        warnings: _(validationOutcomes)
            .map((outcome: ValidationOutcome) => outcome.warnings)
            .flatten<ValidationResult>()
            .value()
    };
};

const createLoadJsonFunction = (fileSystem: FileSystem, httpClient: HttpClient): LoadJson =>
    (pathOrUrl: string) => jsonLoader.load(pathOrUrl, fileSystem, httpClient);

const createPostAnalyticEventFunction = (
    options: ParsedSwaggerMockValidatorOptions,
    specValidationOutcome: ValidationOutcome
): PostAnalyticEvent => {
    const analyticsUrl = options.analyticsUrl;

    if (!analyticsUrl) {
        return () => q.resolve(undefined);
    }

    const parentId = options.uuidGenerator.generate();

    return (parsedMock, outcome) => analytics.postEvent({
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
        validationOutcome: combineValidationOutcomes([specValidationOutcome, outcome])
    }).catch(() => {
        return;
    });
};

const loadMock = (
    mockPathOrUrl: string,
    loadJson: LoadJson
): q.Promise<LoadMockResult> => {
    const whenMockJson = loadJson<Pact>(mockPathOrUrl);

    const whenMockValidationOutcome = whenMockJson
        .then((mockJson) => validatePact(mockJson, mockPathOrUrl));

    return whenMockValidationOutcome
        .then((mockValidationOutcome) => {
            if (!mockValidationOutcome.success) {
                return q({outcome: mockValidationOutcome});
            }
            return whenMockJson
                .then((mockJson: Pact) => mockParser.parsePact(mockJson, mockPathOrUrl))
                .then((parsedMock) => ({outcome: mockValidationOutcome, mock: parsedMock}));
        });
};

const validateMock = (
    mockPathOrUrl: string,
    loadJson: LoadJson,
    parsedSpec: ParsedSpec,
    postAnalyticEvent: PostAnalyticEvent
): q.Promise<ValidationOutcome> => {
    return loadMock(mockPathOrUrl, loadJson)
        .then((loadMockResult: LoadMockResult) => {
            if (!loadMockResult.mock) {
                return loadMockResult.outcome;
            }

            return validateSpecAndMock(loadMockResult.mock, parsedSpec)
                .then((specAndMockOutcome: ValidationOutcome) => {
                    return [
                        loadMockResult.mock,
                        combineValidationOutcomes([loadMockResult.outcome, specAndMockOutcome])
                    ];
                })
                .spread((parsedMock, combinedOutcome) => {
                    postAnalyticEvent(parsedMock, combinedOutcome);
                    return combinedOutcome;
                });
        });
};

const getPactFilesFromBroker = (
    mockPathOrUrl: string,
    providerName: string,
    loadJson: LoadJson
): q.Promise<string[]> => {
    const whenPactBrokerResponse = loadJson<PactBroker>(mockPathOrUrl);
    const whenProviderPactsUrl = whenPactBrokerResponse.then((pactBrokerResponse) => {
        const providerPactsUrlTemplate = _.get<string>(pactBrokerResponse, '_links.pb:latest-provider-pacts.href');

        if (!providerPactsUrlTemplate) {
            throw new Error(`No latest pact file url found at "${mockPathOrUrl}"`);
        }

        return providerPactsUrlTemplate.replace('{provider}', providerName);
    });
    const whenProviderPactsResponse = whenProviderPactsUrl.then((providerPactsUrl) =>
        loadJson<PactBrokerProviderPacts>(providerPactsUrl));

    return whenProviderPactsResponse.then((providerPactsResponse) => {
        const providerPacts = _.get<PactBrokerProviderPactsLinksPact[]>(providerPactsResponse, '_links.pacts', []);

        return _.map(providerPacts, (providerPact) => providerPact.href);
    });
};

const validateMocks = (
    mockPathOrUrl: string,
    providerName: string | undefined,
    parsedSpec: ParsedSpec,
    loadJson: LoadJson,
    postAnalyticEvent: PostAnalyticEvent
): q.Promise<ValidationOutcome> => {
    const whenMockFiles = providerName
        ? getPactFilesFromBroker(mockPathOrUrl, providerName, loadJson)
        : q([mockPathOrUrl]);

    return whenMockFiles
        .then((mockFiles) => q.all(
            _.map(mockFiles, (mockFile) => validateMock(mockFile, loadJson, parsedSpec, postAnalyticEvent))
        ))
        .then((validationOutcomes: ValidationOutcome[]) => combineValidationOutcomes(validationOutcomes));
};

const swaggerMockValidator: SwaggerMockValidator = {
    validate: (userOptions) => {
        const options = parseUserOptions(userOptions);
        const loadJson = createLoadJsonFunction(options.fileSystem, options.httpClient);

        const whenSpecJson = loadJson<any>(options.specPathOrUrl);
        const whenSpecValidationOutcome = whenSpecJson
            .then((specJson) => validateSwagger(specJson, options.specPathOrUrl));

        return whenSpecValidationOutcome.then((specValidationOutcome) => {
            if (!specValidationOutcome.success) {
                return specValidationOutcome;
            }

            const postAnalyticEvent = createPostAnalyticEventFunction(options, specValidationOutcome);
            const whenParsedSpec = whenSpecValidationOutcome
                .then(() => whenSpecJson)
                .then(resolveSwagger)
                .then((specJson) => specParser.parseSwagger(specJson, options.specPathOrUrl));

            return whenParsedSpec
                .then((parsedSpec) => {
                    return validateMocks(
                        options.mockPathOrUrl, options.providerName, parsedSpec, loadJson, postAnalyticEvent
                    );
                })
                .then((mocksValidationOutcome: ValidationOutcome) => {
                    return combineValidationOutcomes([specValidationOutcome, mocksValidationOutcome]);
                });
        });
    }
};

export default swaggerMockValidator;
