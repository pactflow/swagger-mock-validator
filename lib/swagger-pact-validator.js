'use strict';

const defaultFileSystem = require('./swagger-pact-validator/json-loader/file-system');
const defaultHttpClient = require('./swagger-pact-validator/json-loader/http-client');
const jsonLoader = require('./swagger-pact-validator/json-loader');
const mockParser = require('./swagger-pact-validator/mock-parser');
const q = require('q');
const resolveSwagger = require('./swagger-pact-validator/resolve-swagger');
const specParser = require('./swagger-pact-validator/spec-parser');
const validateSwagger = require('./swagger-pact-validator/validate-swagger');
const validateSwaggerAndPact = require('./swagger-pact-validator/validate-swagger-and-pact');
const _ = require('lodash');

const createLoadJsonFunction = (fileSystem, httpClient) =>
    (pathOrUrl) => jsonLoader.load(pathOrUrl, fileSystem || defaultFileSystem, httpClient || defaultHttpClient);

module.exports = {
    validate: (options) => {
        const loadJson = createLoadJsonFunction(options.fileSystem, options.httpClient);

        const whenSwaggerJson = loadJson(options.swaggerPathOrUrl);

        const whenSwaggerValidationResults = whenSwaggerJson
            .then((swaggerJson) => validateSwagger(swaggerJson, options.swaggerPathOrUrl));

        const whenParsedPact = loadJson(options.pactPathOrUrl)
            .then((pactJson) => mockParser.parsePact(pactJson, options.pactPathOrUrl));

        const whenParsedSwagger = whenSwaggerValidationResults
            .thenResolve(whenSwaggerJson)
            .then(resolveSwagger)
            .then((swaggerJson) => specParser.parseSwagger(swaggerJson, options.swaggerPathOrUrl));

        const whenSwaggerPactValidationResults =
            q.all([whenParsedPact, whenParsedSwagger]).spread(validateSwaggerAndPact);

        return q.all([whenSwaggerValidationResults, whenSwaggerPactValidationResults])
            .spread((swaggerValidationResults, swaggerPactValidationResults) => (
                {warnings: _.concat([], swaggerValidationResults.warnings, swaggerPactValidationResults.warnings)}
            )
        );
    }
};
