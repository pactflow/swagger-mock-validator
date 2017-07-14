"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const q = require("q");
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
const combineValidationOutcomes = (validationOutcomes) => {
    return {
        errors: _(validationOutcomes)
            .map((outcome) => outcome.errors)
            .flatten()
            .value(),
        reason: _(validationOutcomes)
            .map((outcome) => outcome.reason)
            .filter((reason) => reason !== undefined)
            .join(', ') || undefined,
        success: _(validationOutcomes).every((outcome) => outcome.success),
        warnings: _(validationOutcomes)
            .map((outcome) => outcome.warnings)
            .flatten()
            .value()
    };
};
const createLoadJsonFunction = (fileSystem, httpClient) => (pathOrUrl) => json_loader_1.default.load(pathOrUrl, fileSystem, httpClient);
const createPostAnalyticEventFunction = (options, specValidationOutcome) => {
    const analyticsUrl = options.analyticsUrl;
    if (!analyticsUrl) {
        return () => q.resolve(undefined);
    }
    const parentId = options.uuidGenerator.generate();
    return (parsedMock, outcome) => analytics_1.default.postEvent({
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
const loadMock = (mockPathOrUrl, loadJson) => {
    const whenMockJson = loadJson(mockPathOrUrl);
    const whenMockValidationOutcome = whenMockJson
        .then((mockJson) => validate_pact_1.default(mockJson, mockPathOrUrl));
    return whenMockValidationOutcome
        .then((mockValidationOutcome) => {
        if (!mockValidationOutcome.success) {
            return q({ outcome: mockValidationOutcome });
        }
        return whenMockJson
            .then((mockJson) => mock_parser_1.default.parsePact(mockJson, mockPathOrUrl))
            .then((parsedMock) => ({ outcome: mockValidationOutcome, mock: parsedMock }));
    });
};
const validateMock = (mockPathOrUrl, loadJson, parsedSpec, postAnalyticEvent) => {
    return loadMock(mockPathOrUrl, loadJson)
        .then((loadMockResult) => {
        if (!loadMockResult.mock) {
            return loadMockResult.outcome;
        }
        return validate_spec_and_mock_1.default(loadMockResult.mock, parsedSpec)
            .then((specAndMockOutcome) => {
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
const validateMocks = (mockPathOrUrl, providerName, parsedSpec, loadJson, postAnalyticEvent) => {
    const whenMockFiles = providerName
        ? getPactFilesFromBroker(mockPathOrUrl, providerName, loadJson)
        : q([mockPathOrUrl]);
    return whenMockFiles
        .then((mockFiles) => q.all(_.map(mockFiles, (mockFile) => validateMock(mockFile, loadJson, parsedSpec, postAnalyticEvent))))
        .then((validationOutcomes) => combineValidationOutcomes(validationOutcomes));
};
const swaggerMockValidator = {
    validate: (userOptions) => {
        const options = parseUserOptions(userOptions);
        const loadJson = createLoadJsonFunction(options.fileSystem, options.httpClient);
        const whenSpecJson = loadJson(options.specPathOrUrl);
        const whenSpecValidationOutcome = whenSpecJson
            .then((specJson) => validate_swagger_1.default(specJson, options.specPathOrUrl));
        return whenSpecValidationOutcome.then((specValidationOutcome) => {
            if (!specValidationOutcome.success) {
                return specValidationOutcome;
            }
            const postAnalyticEvent = createPostAnalyticEventFunction(options, specValidationOutcome);
            const whenParsedSpec = whenSpecValidationOutcome
                .then(() => whenSpecJson)
                .then(resolve_swagger_1.default)
                .then((specJson) => spec_parser_1.default.parseSwagger(specJson, options.specPathOrUrl));
            return whenParsedSpec
                .then((parsedSpec) => {
                return validateMocks(options.mockPathOrUrl, options.providerName, parsedSpec, loadJson, postAnalyticEvent);
            })
                .then((mocksValidationOutcome) => {
                return combineValidationOutcomes([specValidationOutcome, mocksValidationOutcome]);
            });
        });
    }
};
exports.default = swaggerMockValidator;
