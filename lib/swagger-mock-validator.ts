import * as _ from 'lodash';
import * as q from 'q';
import * as VError from 'verror';
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
    ValidationFailureError,
    ValidationResult,
    ValidationSuccess
} from './swagger-mock-validator/types';
import defaultUuidGenerator from './swagger-mock-validator/uuid-generator';
import validatePact from './swagger-mock-validator/validate-pact';
import validateSpecAndMock from './swagger-mock-validator/validate-spec-and-mock';
import validateSwagger from './swagger-mock-validator/validate-swagger';

type LoadJson = <T>(pathOrUrl: string) => q.Promise<T>;
type PostAnalyticEvent = (
    parsedMock: ParsedMock,
    parsedSpec: ParsedSpec,
    errors: ValidationResult[],
    warnings: ValidationResult[],
    success: boolean
) => q.Promise<void>;

const getMockSource = (mockPathOrUrl: string, providerName?: string): MockSource => {
    if (providerName) {
        return 'pactBroker';
    } else if (mockPathOrUrl.indexOf('http') === 0) {
        return 'url';
    }

    return 'path';
};

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

const createLoadJsonFunction = (fileSystem: FileSystem, httpClient: HttpClient): LoadJson =>
    (pathOrUrl: string) => jsonLoader.load(pathOrUrl, fileSystem, httpClient);

const createPostAnalyticEventFunction = (options: ParsedSwaggerMockValidatorOptions): PostAnalyticEvent => {
    const analyticsUrl = options.analyticsUrl;

    if (!analyticsUrl) {
        return () => q.resolve(undefined);
    }

    const parentId = options.uuidGenerator.generate();

    return (parsedMock, parsedSpec, errors, warnings, success) => analytics.postEvent({
        analyticsUrl,
        errors,
        httpClient: options.httpClient,
        metadata: options.metadata,
        mockSource: options.mockSource,
        parentId,
        parsedMock,
        parsedSpec,
        specSource: options.specSource,
        success,
        uuidGenerator: options.uuidGenerator,
        warnings
    });
};

const validate = (
    specPathOrUrl: string,
    mockPathOrUrl: string,
    loadJson: LoadJson,
    postAnalyticEvent: PostAnalyticEvent
): q.Promise<ValidationSuccess> => {
    const whenSpecJson = loadJson<any>(specPathOrUrl);

    const whenSpecValidationResults = whenSpecJson
        .then((specJson) => validateSwagger(specJson, specPathOrUrl));

    const whenParsedSpec = whenSpecValidationResults
        .then(() => whenSpecJson)
        .then(resolveSwagger)
        .then((specJson) => specParser.parseSwagger(specJson, specPathOrUrl));

    const whenMockJson = loadJson<Pact>(mockPathOrUrl);

    const whenMockValidationResults = whenMockJson
        .then((mockJson) => validatePact(mockJson, mockPathOrUrl));

    const whenParsedMock = whenMockValidationResults
        .then(() => whenMockJson)
        .then((mockJson: Pact) => mockParser.parsePact(mockJson, mockPathOrUrl));

    const whenSpecMockValidationResults =
        q.all([whenParsedMock, whenParsedSpec]).spread(validateSpecAndMock);

    const whenAllValidationResults = q.all([whenSpecValidationResults, whenSpecMockValidationResults])
        .spread((specValidationResults, specMockValidationResults) => ({
            warnings: _.concat([], specValidationResults.warnings, specMockValidationResults.warnings)
        }));

    return whenAllValidationResults
        .then(
            (results: ValidationSuccess) =>
                q.all([whenParsedMock, whenParsedSpec, q([]), q(results.warnings), q(true)]),
            (error: ValidationFailureError) => {
                let errors: ValidationResult[] = [];
                let warnings: ValidationResult[] = [];

                if (error.details) {
                    errors = error.details.errors;
                    warnings = error.details.warnings;
                }

                return q.all([whenParsedMock, whenParsedSpec, q(errors), q(warnings), q(false)]);
            }
        )
        .spread(postAnalyticEvent)
        .then(() => whenAllValidationResults, () => whenAllValidationResults);
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

    return q.all([whenProviderPactsResponse, whenProviderPactsUrl])
        .spread((providerPactsResponse, providerPactsUrl) => {
            const providerPacts = _.get<PactBrokerProviderPactsLinksPact[]>(providerPactsResponse, '_links.pacts', []);

            if (providerPacts.length === 0) {
                throw new Error(`Empty pact file list found at "${providerPactsUrl}"`);
            }

            return _.map(providerPacts, (providerPact) => providerPact.href);
        });
};

const swaggerMockValidator: SwaggerMockValidator = {
    validate: (userOptions) => {
        const options = parseUserOptions(userOptions);
        const loadJson = createLoadJsonFunction(options.fileSystem, options.httpClient);
        const postAnalyticEvent = createPostAnalyticEventFunction(options);
        const whenMockFiles = options.providerName
            ? getPactFilesFromBroker(options.mockPathOrUrl, options.providerName, loadJson)
            : q([options.mockPathOrUrl]);

        return whenMockFiles
            .then((mockPathsOrUrls) =>
                q.allSettled(
                    _.map(mockPathsOrUrls, (mockPathOrUrl) =>
                        validate(options.specPathOrUrl, mockPathOrUrl, loadJson, postAnalyticEvent)
                    )
                )
            )
            .then((validationResults) => {
                const rejectedResults =
                    _.filter(validationResults, (validationResult) => validationResult.state === 'rejected');

                const rejectedErrors = _(rejectedResults)
                    .map((validationResult) => _.get(validationResult, 'reason.details.errors', []))
                    .flatten<ValidationResult>()
                    .value();

                const rejectedWarnings = _(rejectedResults)
                    .map((validationResult) => _.get(validationResult, 'reason.details.warnings', []))
                    .flatten<ValidationResult>()
                    .value();

                const rejectedErrorMessages = _(rejectedResults)
                    .map((validationResult) => validationResult.reason.message)
                    .join(', ');

                const fulfilledWarnings = _(validationResults)
                    .filter((validationResult) => validationResult.state === 'fulfilled')
                    .map((validationResult) => _.get<ValidationResult[]>(validationResult, 'value.warnings', []))
                    .flatten<ValidationResult>()
                    .value();

                const combinedWarnings = _.concat(rejectedWarnings, fulfilledWarnings);

                if (rejectedResults.length > 0) {
                    const error: ValidationFailureError = (rejectedResults.length === 1)
                        ? rejectedResults[0].reason
                        : new VError(rejectedErrorMessages);

                    error.details = {
                        errors: rejectedErrors,
                        warnings: combinedWarnings
                    };

                    return q.reject<ValidationSuccess>(error);
                }

                return q.resolve<ValidationSuccess>({warnings: combinedWarnings});
            });
    }
};

export default swaggerMockValidator;
