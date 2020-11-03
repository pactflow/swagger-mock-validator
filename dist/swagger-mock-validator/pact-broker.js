"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PactBroker = void 0;
const _ = require("lodash");
const swagger_mock_validator_error_impl_1 = require("./swagger-mock-validator-error-impl");
class PactBroker {
    constructor(pactBrokerClient) {
        this.pactBrokerClient = pactBrokerClient;
    }
    static getProviderTemplateUrl(pactBrokerRootResponse, template) {
        return _.get(pactBrokerRootResponse, template);
    }
    loadPacts(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerPactsUrl = yield this.getUrlForProviderPacts(options);
            const pactUrls = yield this.getPactUrls(providerPactsUrl);
            return this.getPacts(pactUrls);
        });
    }
    getUrlForProviderPacts(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const pactBrokerRootResponse = yield this.pactBrokerClient.loadAsObject(options.pactBrokerUrl);
            return options.tag
                ? this.getUrlForProviderPactsByTag(pactBrokerRootResponse, {
                    pactBrokerUrl: options.pactBrokerUrl,
                    providerName: options.providerName,
                    tag: options.tag
                }) : this.getUrlForAllProviderPacts(pactBrokerRootResponse, options);
        });
    }
    getUrlForProviderPactsByTag(pactBrokerRootResponse, options) {
        const providerTemplateUrl = PactBroker.getProviderTemplateUrl(pactBrokerRootResponse, '_links.pb:latest-provider-pacts-with-tag.href');
        if (!providerTemplateUrl) {
            throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_READ_ERROR', `Unable to read "${options.pactBrokerUrl}": No latest pact file url found for tag`);
        }
        return this.getSpecificUrlFromTemplate(providerTemplateUrl, { provider: options.providerName, tag: options.tag });
    }
    getUrlForAllProviderPacts(pactBrokerRootResponse, options) {
        const providerTemplateUrl = PactBroker.getProviderTemplateUrl(pactBrokerRootResponse, '_links.pb:latest-provider-pacts.href');
        if (!providerTemplateUrl) {
            throw new swagger_mock_validator_error_impl_1.SwaggerMockValidatorErrorImpl('SWAGGER_MOCK_VALIDATOR_READ_ERROR', `Unable to read "${options.pactBrokerUrl}": No latest pact file url found`);
        }
        return this.getSpecificUrlFromTemplate(providerTemplateUrl, { provider: options.providerName });
    }
    getSpecificUrlFromTemplate(providerTemplateUrl, parameters) {
        let specificUrl = providerTemplateUrl;
        Object.keys(parameters).forEach((key) => {
            const encodedParameterValue = encodeURIComponent(parameters[key]);
            specificUrl = specificUrl.replace(`{${key}}`, encodedParameterValue);
        });
        return specificUrl;
    }
    getPactUrls(providerPactsUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerUrlResponse = yield this.pactBrokerClient.loadAsObject(providerPactsUrl);
            const providerPactEntries = _.get(providerUrlResponse, '_links.pacts', []);
            return _.map(providerPactEntries, (providerPact) => providerPact.href);
        });
    }
    getPacts(pactUrls) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.all(pactUrls.map((mockPathOrUrl) => __awaiter(this, void 0, void 0, function* () {
                return ({
                    content: yield this.pactBrokerClient.loadAsString(mockPathOrUrl),
                    format: 'auto-detect',
                    pathOrUrl: mockPathOrUrl
                });
            })));
        });
    }
}
exports.PactBroker = PactBroker;
