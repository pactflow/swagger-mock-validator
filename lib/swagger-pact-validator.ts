import * as _ from 'lodash';
import * as q from 'q';
import * as VError from 'verror';
import analytics from './swagger-pact-validator/analytics';
import defaultMetadata from './swagger-pact-validator/analytics/metadata';
import jsonLoader from './swagger-pact-validator/json-loader';
import defaultFileSystem from './swagger-pact-validator/json-loader/file-system';
import defaultHttpClient from './swagger-pact-validator/json-loader/http-client';
import mockParser from './swagger-pact-validator/mock-parser';
import resolveSwagger from './swagger-pact-validator/resolve-swagger';
import specParser from './swagger-pact-validator/spec-parser';
import {
    FileSystem,
    HttpClient,
    Pact,
    PactBroker,
    PactBrokerProviderPacts,
    PactBrokerProviderPactsLinksPact,
    PactSource,
    ParsedMock,
    ParsedSpec,
    ParsedSwaggerPactValidatorOptions,
    SwaggerPactValidator,
    SwaggerPactValidatorOptions,
    SwaggerSource,
    ValidationFailureError,
    ValidationResult,
    ValidationSuccess
} from './swagger-pact-validator/types';
import defaultUuidGenerator from './swagger-pact-validator/uuid-generator';
import validatePact from './swagger-pact-validator/validate-pact';
import validateSwagger from './swagger-pact-validator/validate-swagger';
import validateSwaggerAndPact from './swagger-pact-validator/validate-swagger-and-pact';

type LoadJson = <T>(pathOrUrl: string) => q.Promise<T>;
type PostAnalyticEvent = (
    parsedMock: ParsedMock,
    parsedSpec: ParsedSpec,
    errors: ValidationResult[],
    warnings: ValidationResult[],
    success: boolean
) => q.Promise<void>;

const getPactSource = (pactPathOrUrl: string, providerName?: string): PactSource => {
    if (providerName) {
        return 'pactBroker';
    } else if (pactPathOrUrl.indexOf('http') === 0) {
        return 'url';
    }

    return 'path';
};

const getSwaggerSource = (swaggerPathOrUrl: string): SwaggerSource =>
    swaggerPathOrUrl.indexOf('http') === 0 ? 'url' : 'path';

// tslint:disable:cyclomatic-complexity
const parseUserOptions = (userOptions: SwaggerPactValidatorOptions): ParsedSwaggerPactValidatorOptions => ({
    analyticsUrl: userOptions.analyticsUrl,
    fileSystem: userOptions.fileSystem || defaultFileSystem,
    httpClient: userOptions.httpClient || defaultHttpClient,
    metadata: userOptions.metadata || defaultMetadata,
    pactPathOrUrl: userOptions.pactPathOrUrl,
    pactSource: getPactSource(userOptions.pactPathOrUrl, userOptions.providerName),
    providerName: userOptions.providerName,
    swaggerPathOrUrl: userOptions.swaggerPathOrUrl,
    swaggerSource: getSwaggerSource(userOptions.swaggerPathOrUrl),
    uuidGenerator: userOptions.uuidGenerator || defaultUuidGenerator
});

const createLoadJsonFunction = (fileSystem: FileSystem, httpClient: HttpClient): LoadJson =>
    (pathOrUrl: string) => jsonLoader.load(pathOrUrl, fileSystem, httpClient);

const createPostAnalyticEventFunction = (options: ParsedSwaggerPactValidatorOptions): PostAnalyticEvent => {
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
        mockSource: options.pactSource,
        parentId,
        parsedMock,
        parsedSpec,
        specSource: options.swaggerSource,
        success,
        uuidGenerator: options.uuidGenerator,
        warnings
    });
};

const validate = (
    swaggerPathOrUrl: string,
    pactPathOrUrl: string,
    loadJson: LoadJson,
    postAnalyticEvent: PostAnalyticEvent
): q.Promise<ValidationSuccess> => {
    const whenSwaggerJson = loadJson<any>(swaggerPathOrUrl);

    const whenSwaggerValidationResults = whenSwaggerJson
        .then((swaggerJson) => validateSwagger(swaggerJson, swaggerPathOrUrl, pactPathOrUrl));

    const whenParsedSwagger = whenSwaggerValidationResults
        .then(() => whenSwaggerJson)
        .then(resolveSwagger)
        .then((swaggerJson) => specParser.parseSwagger(swaggerJson, swaggerPathOrUrl));

    const whenPactJson = loadJson<Pact>(pactPathOrUrl);

    const whenPactValidationResults = whenPactJson
        .then((pactJson) => validatePact(pactJson, pactPathOrUrl, swaggerPathOrUrl));

    const whenParsedPact = whenPactValidationResults
        .then(() => whenPactJson)
        .then((pactJson: Pact) => mockParser.parsePact(pactJson, pactPathOrUrl));

    const whenSwaggerPactValidationResults =
        q.all([whenParsedPact, whenParsedSwagger]).spread(validateSwaggerAndPact);

    const whenAllValidationResults = q.all([whenSwaggerValidationResults, whenSwaggerPactValidationResults])
        .spread((swaggerValidationResults, swaggerPactValidationResults) => ({
            warnings: _.concat([], swaggerValidationResults.warnings, swaggerPactValidationResults.warnings)
        }));

    return whenAllValidationResults
        .then(
            (results: ValidationSuccess) =>
                q.all([whenParsedPact, whenParsedSwagger, q([]), q(results.warnings), q(true)]),
            (error: ValidationFailureError) => {
                let errors: ValidationResult[] = [];
                let warnings: ValidationResult[] = [];

                if (error.details) {
                    errors = error.details.errors;
                    warnings = error.details.warnings;
                }

                return q.all([whenParsedPact, whenParsedSwagger, q(errors), q(warnings), q(false)]);
            }
        )
        .spread(postAnalyticEvent)
        .then(() => whenAllValidationResults, () => whenAllValidationResults);
};

const getPactFilesFromBroker = (
    pactPathOrUrl: string,
    providerName: string,
    loadJson: LoadJson
): q.Promise<string[]> => {
    const whenPactBrokerResponse = loadJson<PactBroker>(pactPathOrUrl);
    const whenProviderPactsUrl = whenPactBrokerResponse.then((pactBrokerResponse) => {
        const providerPactsUrlTemplate = _.get<string>(pactBrokerResponse, '_links.pb:latest-provider-pacts.href');

        if (!providerPactsUrlTemplate) {
            throw new Error(`No latest pact file url found at "${pactPathOrUrl}"`);
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

const swaggerPactValidator: SwaggerPactValidator = {
    validate: (userOptions) => {
        const options = parseUserOptions(userOptions);
        const loadJson = createLoadJsonFunction(options.fileSystem, options.httpClient);
        const postAnalyticEvent = createPostAnalyticEventFunction(options);
        const whenPactFiles = options.providerName
            ? getPactFilesFromBroker(options.pactPathOrUrl, options.providerName, loadJson)
            : q([options.pactPathOrUrl]);

        return whenPactFiles
            .then((pactPathsOrUrls) =>
                q.allSettled(
                    _.map(pactPathsOrUrls, (pactPathOrUrl) =>
                        validate(options.swaggerPathOrUrl, pactPathOrUrl, loadJson, postAnalyticEvent)
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

export default swaggerPactValidator;
