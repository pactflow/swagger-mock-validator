'use strict';

const emptyContext = require('./swagger-pact-validator/context');
const jsonLoader = require('./swagger-pact-validator/json-loader');
const mockParser = require('./swagger-pact-validator/mock-parser');
const q = require('q');
const resolveSwagger = require('./swagger-pact-validator/resolve-swagger');
const specParser = require('./swagger-pact-validator/spec-parser');
const validateSwagger = require('./swagger-pact-validator/validate-swagger');
const validateSwaggerAndPact = require('./swagger-pact-validator/validate-swagger-and-pact');
const _ = require('lodash');

module.exports = {
    validate: (swaggerPathOrUrl, pactPathOrUrl) => {
        const initialContext = emptyContext
            .setPactFileName(pactPathOrUrl)
            .setPactLocation('[pactRoot]')
            .setSwaggerFileName(swaggerPathOrUrl)
            .setSwaggerLocation('[swaggerRoot]');

        const whenSwaggerJson = jsonLoader.load(swaggerPathOrUrl);

        const whenSwaggerValidationResults = whenSwaggerJson
            .then((swaggerJson) => validateSwagger(swaggerJson, initialContext));

        const whenResolvedSwaggerJson = whenSwaggerValidationResults
            .thenResolve(whenSwaggerJson)
            .then(resolveSwagger);

        const whenPactJson = jsonLoader.load(pactPathOrUrl);

        const whenParsedPact = whenPactJson.then((pactJson) => mockParser.parsePact(pactJson, pactPathOrUrl));
        const whenParsedSwagger = whenResolvedSwaggerJson
            .then((swaggerJson) => specParser.parseSwagger(swaggerJson, swaggerPathOrUrl));

        const whenSwaggerPactValidationResults =
            q.all([whenResolvedSwaggerJson, whenPactJson, whenParsedPact, whenParsedSwagger])
                // eslint-disable-next-line max-params
                .spread((swaggerJson, pactJson, parsedPact, parsedSwagger) => validateSwaggerAndPact(
                    initialContext
                        .setPactValue(pactJson)
                        .setSwaggerValue(swaggerJson),
                        parsedPact,
                        parsedSwagger
                    ));

        return q.all([whenSwaggerValidationResults, whenSwaggerPactValidationResults])
            .spread((swaggerValidationResults, swaggerPactValidationResults) => (
                {warnings: _.concat([], swaggerValidationResults.warnings, swaggerPactValidationResults.warnings)}
            ));
    }
};
