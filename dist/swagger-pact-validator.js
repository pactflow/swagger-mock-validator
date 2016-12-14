"use strict";
const _ = require("lodash");
const q = require("q");
const json_loader_1 = require("./swagger-pact-validator/json-loader");
const file_system_1 = require("./swagger-pact-validator/json-loader/file-system");
const http_client_1 = require("./swagger-pact-validator/json-loader/http-client");
const mock_parser_1 = require("./swagger-pact-validator/mock-parser");
const resolve_swagger_1 = require("./swagger-pact-validator/resolve-swagger");
const spec_parser_1 = require("./swagger-pact-validator/spec-parser");
const validate_swagger_1 = require("./swagger-pact-validator/validate-swagger");
const validate_swagger_and_pact_1 = require("./swagger-pact-validator/validate-swagger-and-pact");
const createLoadJsonFunction = (fileSystem, httpClient) => (pathOrUrl) => json_loader_1.default.load(pathOrUrl, fileSystem || file_system_1.default, httpClient || http_client_1.default);
const swaggerPactValidator = {
    validate: (options) => {
        const loadJson = createLoadJsonFunction(options.fileSystem, options.httpClient);
        const whenSwaggerJson = loadJson(options.swaggerPathOrUrl);
        const whenSwaggerValidationResults = whenSwaggerJson
            .then((swaggerJson) => validate_swagger_1.default(swaggerJson, options.swaggerPathOrUrl));
        const whenParsedPact = loadJson(options.pactPathOrUrl)
            .then((pactJson) => mock_parser_1.default.parsePact(pactJson, options.pactPathOrUrl));
        const whenParsedSwagger = whenSwaggerValidationResults
            .thenResolve(whenSwaggerJson)
            .then(resolve_swagger_1.default)
            .then((swaggerJson) => spec_parser_1.default.parseSwagger(swaggerJson, options.swaggerPathOrUrl));
        const whenSwaggerPactValidationResults = q.all([whenParsedPact, whenParsedSwagger]).spread(validate_swagger_and_pact_1.default);
        return q.all([whenSwaggerValidationResults, whenSwaggerPactValidationResults])
            .spread((swaggerValidationResults, swaggerPactValidationResults) => ({ warnings: _.concat([], swaggerValidationResults.warnings, swaggerPactValidationResults.warnings) }));
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = swaggerPactValidator;
