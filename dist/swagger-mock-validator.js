"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const q = require("q");
const VError = require("verror");
const analytics_1 = require("./swagger-mock-validator/analytics");
const metadata_1 = require("./swagger-mock-validator/analytics/metadata");
const json_loader_1 = require("./swagger-mock-validator/json-loader");
const file_system_1 = require("./swagger-mock-validator/json-loader/file-system");
const http_client_1 = require("./swagger-mock-validator/json-loader/http-client");
const mock_parser_1 = require("./swagger-mock-validator/mock-parser");
const resolve_swagger_1 = require("./swagger-mock-validator/resolve-swagger");
const spec_parser_1 = require("./swagger-mock-validator/spec-parser");
const uuid_generator_1 = require("./swagger-mock-validator/uuid-generator");
const validate_pact_1 = require("./swagger-mock-validator/validate-pact");
const validate_spec_and_mock_1 = require("./swagger-mock-validator/validate-spec-and-mock");
const validate_swagger_1 = require("./swagger-mock-validator/validate-swagger");
const getMockSource = (mockPathOrUrl, providerName) => {
    if (providerName) {
        return 'pactBroker';
    }
    else if (mockPathOrUrl.indexOf('http') === 0) {
        return 'url';
    }
    return 'path';
};
const getSpecSource = (specPathOrUrl) => specPathOrUrl.indexOf('http') === 0 ? 'url' : 'path';
// tslint:disable:cyclomatic-complexity
const parseUserOptions = (userOptions) => ({
    analyticsUrl: userOptions.analyticsUrl,
    fileSystem: userOptions.fileSystem || file_system_1.default,
    httpClient: userOptions.httpClient || http_client_1.default,
    metadata: userOptions.metadata || metadata_1.default,
    mockPathOrUrl: userOptions.mockPathOrUrl,
    mockSource: getMockSource(userOptions.mockPathOrUrl, userOptions.providerName),
    providerName: userOptions.providerName,
    specPathOrUrl: userOptions.specPathOrUrl,
    specSource: getSpecSource(userOptions.specPathOrUrl),
    uuidGenerator: userOptions.uuidGenerator || uuid_generator_1.default
});
const createLoadJsonFunction = (fileSystem, httpClient) => (pathOrUrl) => json_loader_1.default.load(pathOrUrl, fileSystem, httpClient);
const createPostAnalyticEventFunction = (options) => {
    const analyticsUrl = options.analyticsUrl;
    if (!analyticsUrl) {
        return () => q.resolve(undefined);
    }
    const parentId = options.uuidGenerator.generate();
    return (parsedMock, parsedSpec, errors, warnings, success) => analytics_1.default.postEvent({
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
const validate = (specPathOrUrl, mockPathOrUrl, loadJson, postAnalyticEvent) => {
    const whenSpecJson = loadJson(specPathOrUrl);
    const whenSpecValidationResults = whenSpecJson
        .then((specJson) => validate_swagger_1.default(specJson, specPathOrUrl, mockPathOrUrl));
    const whenParsedSpec = whenSpecValidationResults
        .then(() => whenSpecJson)
        .then(resolve_swagger_1.default)
        .then((specJson) => spec_parser_1.default.parseSwagger(specJson, specPathOrUrl));
    const whenMockJson = loadJson(mockPathOrUrl);
    const whenMockValidationResults = whenMockJson
        .then((mockJson) => validate_pact_1.default(mockJson, mockPathOrUrl, specPathOrUrl));
    const whenParsedMock = whenMockValidationResults
        .then(() => whenMockJson)
        .then((mockJson) => mock_parser_1.default.parsePact(mockJson, mockPathOrUrl));
    const whenSpecMockValidationResults = q.all([whenParsedMock, whenParsedSpec]).spread(validate_spec_and_mock_1.default);
    const whenAllValidationResults = q.all([whenSpecValidationResults, whenSpecMockValidationResults])
        .spread((specValidationResults, specMockValidationResults) => ({
        warnings: _.concat([], specValidationResults.warnings, specMockValidationResults.warnings)
    }));
    return whenAllValidationResults
        .then((results) => q.all([whenParsedMock, whenParsedSpec, q([]), q(results.warnings), q(true)]), (error) => {
        let errors = [];
        let warnings = [];
        if (error.details) {
            errors = error.details.errors;
            warnings = error.details.warnings;
        }
        return q.all([whenParsedMock, whenParsedSpec, q(errors), q(warnings), q(false)]);
    })
        .spread(postAnalyticEvent)
        .then(() => whenAllValidationResults, () => whenAllValidationResults);
};
const getPactFilesFromBroker = (mockPathOrUrl, providerName, loadJson) => {
    const whenPactBrokerResponse = loadJson(mockPathOrUrl);
    const whenProviderPactsUrl = whenPactBrokerResponse.then((pactBrokerResponse) => {
        const providerPactsUrlTemplate = _.get(pactBrokerResponse, '_links.pb:latest-provider-pacts.href');
        if (!providerPactsUrlTemplate) {
            throw new Error(`No latest pact file url found at "${mockPathOrUrl}"`);
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
const swaggerMockValidator = {
    validate: (userOptions) => {
        const options = parseUserOptions(userOptions);
        const loadJson = createLoadJsonFunction(options.fileSystem, options.httpClient);
        const postAnalyticEvent = createPostAnalyticEventFunction(options);
        const whenMockFiles = options.providerName
            ? getPactFilesFromBroker(options.mockPathOrUrl, options.providerName, loadJson)
            : q([options.mockPathOrUrl]);
        return whenMockFiles
            .then((mockPathsOrUrls) => q.allSettled(_.map(mockPathsOrUrls, (mockPathOrUrl) => validate(options.specPathOrUrl, mockPathOrUrl, loadJson, postAnalyticEvent))))
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
exports.default = swaggerMockValidator;
