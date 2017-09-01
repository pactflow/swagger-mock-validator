"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const analytics_1 = require("./swagger-mock-validator/analytics");
const metadata_1 = require("./swagger-mock-validator/analytics/metadata");
const file_store_1 = require("./swagger-mock-validator/file-store");
const file_system_1 = require("./swagger-mock-validator/json-loader/file-system");
const http_client_1 = require("./swagger-mock-validator/json-loader/http-client");
const mock_parser_1 = require("./swagger-mock-validator/mock-parser");
const resolve_swagger_1 = require("./swagger-mock-validator/resolve-swagger");
const resource_loader_1 = require("./swagger-mock-validator/resource-loader");
const spec_parser_1 = require("./swagger-mock-validator/spec-parser");
const transform_string_to_object_1 = require("./swagger-mock-validator/transform-string-to-object");
const uuid_generator_1 = require("./swagger-mock-validator/uuid-generator");
const validate_pact_1 = require("./swagger-mock-validator/validate-pact");
const validate_spec_and_mock_1 = require("./swagger-mock-validator/validate-spec-and-mock");
const validate_swagger_1 = require("./swagger-mock-validator/validate-swagger");
const getMockSource = (mockPathOrUrl, providerName) => {
    if (providerName) {
        return 'pactBroker';
    }
    else if (file_store_1.FileStore.isUrl(mockPathOrUrl)) {
        return 'url';
    }
    return 'path';
};
const getSpecSource = (specPathOrUrl) => file_store_1.FileStore.isUrl(specPathOrUrl) ? 'url' : 'path';
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
const combineValidationResults = (validationResults) => {
    const flattenedValidationResults = _.flatten(validationResults);
    return _.uniqWith(flattenedValidationResults, _.isEqual);
};
const combineValidationOutcomes = (validationOutcomes) => {
    return {
        errors: combineValidationResults(validationOutcomes.map((validationOutcome) => validationOutcome.errors)),
        failureReason: _(validationOutcomes)
            .map((outcome) => outcome.failureReason)
            .filter((failureReason) => failureReason !== undefined)
            .join(', ') || undefined,
        success: _.every(validationOutcomes, (outcome) => outcome.success),
        warnings: combineValidationResults(validationOutcomes.map((validationOutcome) => validationOutcome.warnings))
    };
};
const createPostAnalyticEventFunction = (options) => {
    const analyticsUrl = options.analyticsUrl;
    if (!analyticsUrl) {
        return () => Promise.resolve(undefined);
    }
    const parentId = options.uuidGenerator.generate();
    return (parsedMock, validationOutcome) => analytics_1.default.postEvent({
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
const getPactFilesFromBroker = (mockPathOrUrl, providerName, resourceLoader) => __awaiter(this, void 0, void 0, function* () {
    const pactBrokerResponse = yield resourceLoader.load(mockPathOrUrl);
    const providerPactsUrlTemplate = _.get(pactBrokerResponse, '_links.pb:latest-provider-pacts.href');
    if (!providerPactsUrlTemplate) {
        throw new Error(`No latest pact file url found at "${mockPathOrUrl}"`);
    }
    const providerPactsUrl = providerPactsUrlTemplate.replace('{provider}', providerName);
    const providerPactsResponse = yield resourceLoader.load(providerPactsUrl);
    const providerPacts = _.get(providerPactsResponse, '_links.pacts', []);
    return _.map(providerPacts, (providerPact) => providerPact.href);
});
exports.validateSpecAndMockContent = (options) => __awaiter(this, void 0, void 0, function* () {
    const spec = options.spec;
    const mock = options.mock;
    const specJson = transform_string_to_object_1.transformStringToObject(spec.content, spec.pathOrUrl);
    const specOutcome = yield validate_swagger_1.default(specJson, spec.pathOrUrl);
    if (!specOutcome.success) {
        return { validationOutcome: specOutcome };
    }
    const mockJson = transform_string_to_object_1.transformStringToObject(mock.content, mock.pathOrUrl);
    const mockOutcome = validate_pact_1.default(mockJson, mock.pathOrUrl);
    if (!mockOutcome.success) {
        return { validationOutcome: mockOutcome };
    }
    const resolvedSpec = yield resolve_swagger_1.default(specJson);
    const parsedSpec = spec_parser_1.default.parseSwagger(resolvedSpec, spec.pathOrUrl);
    const parsedMock = mock_parser_1.default.parsePact(mockJson, mock.pathOrUrl);
    const specAndMockOutcome = yield validate_spec_and_mock_1.default(parsedMock, parsedSpec);
    const validationOutcome = combineValidationOutcomes([specOutcome, mockOutcome, specAndMockOutcome]);
    return {
        parsedMock,
        validationOutcome
    };
});
const swaggerMockValidator = {
    validate: (userOptions) => __awaiter(this, void 0, void 0, function* () {
        const options = parseUserOptions(userOptions);
        const fileStore = new file_store_1.FileStore(options.fileSystem, options.httpClient);
        const resourceLoader = new resource_loader_1.ResourceLoader(fileStore);
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
                        format: 'pact',
                        pathOrUrl: mockPathOrUrl
                    };
                });
            }));
        });
        const specContentAndMocks = yield Promise.all([whenSpecContent, whenMocks]);
        const spec = {
            content: specContentAndMocks[0],
            format: 'swagger2',
            pathOrUrl: options.specPathOrUrl
        };
        const mocks = specContentAndMocks[1];
        const validationOutcomes = yield Promise.all(mocks.map((mock) => __awaiter(this, void 0, void 0, function* () {
            const result = yield exports.validateSpecAndMockContent({ mock, spec });
            if (result.parsedMock) {
                yield postAnalyticEvent(result.parsedMock, result.validationOutcome);
            }
            return result.validationOutcome;
        })));
        return combineValidationOutcomes(validationOutcomes);
    })
};
exports.default = swaggerMockValidator;
