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
const file_store_1 = require("./swagger-mock-validator/file-store");
const mock_parser_1 = require("./swagger-mock-validator/mock-parser");
const spec_parser_1 = require("./swagger-mock-validator/spec-parser");
const swagger_mock_validator_error_impl_1 = require("./swagger-mock-validator/swagger-mock-validator-error-impl");
const validate_spec_and_mock_1 = require("./swagger-mock-validator/validate-spec-and-mock");
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
    mockPathOrUrl: userOptions.mockPathOrUrl,
    mockSource: getMockSource(userOptions.mockPathOrUrl, userOptions.providerName),
    providerName: userOptions.providerName,
    specPathOrUrl: userOptions.specPathOrUrl,
    specSource: getSpecSource(userOptions.specPathOrUrl)
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
exports.validateSpecAndMockContent = (options) => __awaiter(this, void 0, void 0, function* () {
    const spec = options.spec;
    const mock = options.mock;
    const parsedSpec = yield spec_parser_1.SpecParser.parse(spec);
    const parsedMock = mock_parser_1.MockParser.parse(mock);
    const validationOutcome = yield validate_spec_and_mock_1.validateSpecAndMock(parsedMock, parsedSpec);
    return {
        parsedMock,
        validationOutcome
    };
});
class SwaggerMockValidator {
    constructor(fileStore, resourceLoader, analytics) {
        this.fileStore = fileStore;
        this.resourceLoader = resourceLoader;
        this.analytics = analytics;
    }
    validate(userOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = parseUserOptions(userOptions);
            const { spec, mocks } = yield this.loadSpecAndMocks(options);
            const validationOutcomes = yield Promise.all(mocks.map((mock) => this.validateSpecAndMock(spec, mock, options)));
            return combineValidationOutcomes(validationOutcomes);
        });
    }
    loadSpecAndMocks(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const whenSpecContent = this.fileStore.loadFile(options.specPathOrUrl);
            const mockPathsOrUrls = options.providerName
                ? yield this.getPactFilesFromBroker(options.mockPathOrUrl, options.providerName)
                : [options.mockPathOrUrl];
            const whenMocks = Promise.all(mockPathsOrUrls.map((mockPathOrUrl) => __awaiter(this, void 0, void 0, function* () {
                return ({
                    content: yield this.fileStore.loadFile(mockPathOrUrl),
                    format: 'auto-detect',
                    pathOrUrl: mockPathOrUrl
                });
            })));
            const [specContent, mocks] = yield Promise.all([whenSpecContent, whenMocks]);
            const spec = {
                content: specContent,
                format: 'auto-detect',
                pathOrUrl: options.specPathOrUrl
            };
            return { spec, mocks };
        });
    }
    validateSpecAndMock(spec, mock, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield exports.validateSpecAndMockContent({ mock, spec });
            if (result.parsedMock) {
                yield this.postAnalyticEvent(options, result.parsedMock, result.validationOutcome);
            }
            return result.validationOutcome;
        });
    }
    postAnalyticEvent(options, parsedMock, validationOutcome) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.analyticsUrl) {
                try {
                    yield this.analytics.postEvent({
                        analyticsUrl: options.analyticsUrl,
                        consumer: parsedMock.consumer,
                        mockPathOrUrl: parsedMock.pathOrUrl,
                        mockSource: options.mockSource,
                        provider: parsedMock.provider,
                        specPathOrUrl: options.specPathOrUrl,
                        specSource: options.specSource,
                        validationOutcome
                    });
                }
                catch (error) {
                    // do not fail tool on analytics errors
                }
            }
        });
    }
    getPactFilesFromBroker(mockPathOrUrl, providerName) {
        return __awaiter(this, void 0, void 0, function* () {
            const pactBrokerResponse = yield this.resourceLoader.load(mockPathOrUrl);
            const providerPactsUrlTemplate = _.get(pactBrokerResponse, '_links.pb:latest-provider-pacts.href');
            if (!providerPactsUrlTemplate) {
                throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_READ_ERROR', `Unable to read "${mockPathOrUrl}": No latest pact file url found`);
            }
            const providerPactsUrl = providerPactsUrlTemplate.replace('{provider}', providerName);
            const providerPactsResponse = yield this.resourceLoader.load(providerPactsUrl);
            const providerPacts = _.get(providerPactsResponse, '_links.pacts', []);
            return _.map(providerPacts, (providerPact) => providerPact.href);
        });
    }
}
exports.SwaggerMockValidator = SwaggerMockValidator;
