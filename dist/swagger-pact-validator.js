"use strict";
const _ = require("lodash");
const q = require("q");
const VError = require("verror");
const json_loader_1 = require("./swagger-pact-validator/json-loader");
const file_system_1 = require("./swagger-pact-validator/json-loader/file-system");
const http_client_1 = require("./swagger-pact-validator/json-loader/http-client");
const mock_parser_1 = require("./swagger-pact-validator/mock-parser");
const resolve_swagger_1 = require("./swagger-pact-validator/resolve-swagger");
const spec_parser_1 = require("./swagger-pact-validator/spec-parser");
const validate_pact_1 = require("./swagger-pact-validator/validate-pact");
const validate_swagger_1 = require("./swagger-pact-validator/validate-swagger");
const validate_swagger_and_pact_1 = require("./swagger-pact-validator/validate-swagger-and-pact");
const createLoadJsonFunction = (fileSystem, httpClient) => (pathOrUrl) => json_loader_1.default.load(pathOrUrl, fileSystem || file_system_1.default, httpClient || http_client_1.default);
const validate = (swaggerPathOrUrl, pactPathOrUrl, loadJson) => {
    const whenSwaggerJson = loadJson(swaggerPathOrUrl);
    const whenSwaggerValidationResults = whenSwaggerJson
        .then((swaggerJson) => validate_swagger_1.default(swaggerJson, swaggerPathOrUrl, pactPathOrUrl));
    const whenParsedSwagger = whenSwaggerValidationResults
        .thenResolve(whenSwaggerJson)
        .then(resolve_swagger_1.default)
        .then((swaggerJson) => spec_parser_1.default.parseSwagger(swaggerJson, swaggerPathOrUrl));
    const whenPactJson = loadJson(pactPathOrUrl);
    const whenPactValidationResults = whenPactJson
        .then((pactJson) => validate_pact_1.default(pactJson, pactPathOrUrl, swaggerPathOrUrl));
    const whenParsedPact = whenPactValidationResults
        .thenResolve(whenPactJson)
        .then((pactJson) => mock_parser_1.default.parsePact(pactJson, pactPathOrUrl));
    const whenSwaggerPactValidationResults = q.all([whenParsedPact, whenParsedSwagger]).spread(validate_swagger_and_pact_1.default);
    return q.all([whenSwaggerValidationResults, whenSwaggerPactValidationResults])
        .spread((swaggerValidationResults, swaggerPactValidationResults) => ({
        warnings: _.concat([], swaggerValidationResults.warnings, swaggerPactValidationResults.warnings)
    }));
};
const getPactFilesFromBroker = (pactPathOrUrl, providerName, loadJson) => {
    const whenPactBrokerResponse = loadJson(pactPathOrUrl);
    const whenProviderPactsUrl = whenPactBrokerResponse.then((pactBrokerResponse) => {
        const providerPactsUrlTemplate = _.get(pactBrokerResponse, '_links.pb:latest-provider-pacts.href');
        if (!providerPactsUrlTemplate) {
            throw new Error(`No latest pact file url found at "${pactPathOrUrl}"`);
        }
        return providerPactsUrlTemplate.replace('{provider}', providerName);
    });
    const whenProviderPactsResponse = whenProviderPactsUrl.then((providerPactsUrl) => loadJson(providerPactsUrl));
    return q.all([whenProviderPactsResponse, whenProviderPactsUrl])
        .spread((providerPactsResponse, providerPactsUrl) => {
        const providerPacts = _.get(providerPactsResponse, '_links.pacts', []);
        if (providerPacts.length === 0) {
            throw new Error(`Empty pact file list found at "${providerPactsUrl}"`);
        }
        return _.map(providerPacts, (providerPact) => providerPact.href);
    });
};
const swaggerPactValidator = {
    validate: (options) => {
        const loadJson = createLoadJsonFunction(options.fileSystem, options.httpClient);
        const whenPactFiles = options.providerName
            ? getPactFilesFromBroker(options.pactPathOrUrl, options.providerName, loadJson)
            : q([options.pactPathOrUrl]);
        return whenPactFiles
            .then((pactPathsOrUrls) => q.allSettled(_.map(pactPathsOrUrls, (pactPathOrUrl) => validate(options.swaggerPathOrUrl, pactPathOrUrl, loadJson))))
            .then((validationResults) => {
            const rejectedResults = _.filter(validationResults, (validationResult) => validationResult.state === 'rejected');
            const rejectedErrors = _(rejectedResults)
                .map((validationResult) => _.get(validationResult, 'reason.details.errors', []))
                .flatten()
                .value();
            const rejectedWarnings = _(rejectedResults)
                .map((validationResult) => _.get(validationResult, 'reason.details.warnings', []))
                .flatten()
                .value();
            const rejectedErrorMessages = _(rejectedResults)
                .map((validationResult) => validationResult.reason.message)
                .join(', ');
            const fulfilledWarnings = _(validationResults)
                .filter((validationResult) => validationResult.state === 'fulfilled')
                .map((validationResult) => _.get(validationResult, 'value.warnings', []))
                .flatten()
                .value();
            const combinedWarnings = _.concat(rejectedWarnings, fulfilledWarnings);
            if (rejectedResults.length > 0) {
                const error = (rejectedResults.length === 1)
                    ? rejectedResults[0].reason
                    : new VError(rejectedErrorMessages);
                error.details = {
                    errors: rejectedErrors,
                    warnings: combinedWarnings
                };
                return q.reject(error);
            }
            return q.resolve({ warnings: combinedWarnings });
        });
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = swaggerPactValidator;
