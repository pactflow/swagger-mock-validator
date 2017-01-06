import * as _ from 'lodash';
import * as q from 'q';
import * as VError from 'verror';
import jsonLoader from './swagger-pact-validator/json-loader';
import defaultFileSystem from './swagger-pact-validator/json-loader/file-system';
import defaultHttpClient from './swagger-pact-validator/json-loader/http-client';
import mockParser from './swagger-pact-validator/mock-parser';
import resolveSwagger from './swagger-pact-validator/resolve-swagger';
import specParser from './swagger-pact-validator/spec-parser';
import {
    FileSystem,
    HttpClient,
    PactBroker,
    PactBrokerProviderPacts,
    PactBrokerProviderPactsLinksPact,
    SwaggerPactValidator,
    ValidationFailureError,
    ValidationResult,
    ValidationSuccess
} from './swagger-pact-validator/types';
import validatePact from './swagger-pact-validator/validate-pact';
import validateSwagger from './swagger-pact-validator/validate-swagger';
import validateSwaggerAndPact from './swagger-pact-validator/validate-swagger-and-pact';

type LoadJson = <T>(pathOrUrl: string) => q.Promise<T>;

const createLoadJsonFunction = (fileSystem: FileSystem, httpClient: HttpClient): LoadJson =>
    (pathOrUrl: string) =>
        jsonLoader.load(pathOrUrl, fileSystem || defaultFileSystem, httpClient || defaultHttpClient);

const validate = (
    swaggerPathOrUrl: string,
    pactPathOrUrl: string,
    loadJson: LoadJson
): q.Promise<ValidationSuccess> => {
    const whenSwaggerJson = loadJson(swaggerPathOrUrl);

    const whenSwaggerValidationResults = whenSwaggerJson
        .then((swaggerJson) => validateSwagger(swaggerJson, swaggerPathOrUrl));

    const whenParsedSwagger = whenSwaggerValidationResults
        .thenResolve(whenSwaggerJson)
        .then(resolveSwagger)
        .then((swaggerJson) => specParser.parseSwagger(swaggerJson, swaggerPathOrUrl));

    const whenPactJson = loadJson(pactPathOrUrl);

    const whenPactValidationResults = whenPactJson
        .then((pactJson) => validatePact(pactJson, pactPathOrUrl));

    const whenParsedPact = whenPactValidationResults
        .thenResolve(whenPactJson)
        .then((pactJson: any) => mockParser.parsePact(pactJson, pactPathOrUrl));

    const whenSwaggerPactValidationResults =
        q.all([whenParsedPact, whenParsedSwagger]).spread(validateSwaggerAndPact);

    return q.all([whenSwaggerValidationResults, whenSwaggerPactValidationResults])
        .spread((swaggerValidationResults, swaggerPactValidationResults) => ({
            warnings: _.concat([], swaggerValidationResults.warnings, swaggerPactValidationResults.warnings)
        }));
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
    validate: (options) => {
        const loadJson = createLoadJsonFunction(options.fileSystem, options.httpClient);
        const whenPactFiles = options.providerName
            ? getPactFilesFromBroker(options.pactPathOrUrl, options.providerName, loadJson)
            : q([options.pactPathOrUrl]);

        return whenPactFiles
            .then((pactPathsOrUrls) =>
                q.allSettled(
                    _.map(pactPathsOrUrls, (pactPathOrUrl) =>
                        validate(options.swaggerPathOrUrl, pactPathOrUrl, loadJson)
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
                    .map((validationResult) => validationResult.value.warnings)
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
