'use strict';

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
        const whenSwaggerJson = jsonLoader.load(swaggerPathOrUrl);

        const whenSwaggerValidationResults = whenSwaggerJson
            .then((swaggerJson) => validateSwagger(swaggerJson, swaggerPathOrUrl));

        const whenParsedPact = jsonLoader.load(pactPathOrUrl)
            .then((pactJson) => mockParser.parsePact(pactJson, pactPathOrUrl));

        const whenParsedSwagger = whenSwaggerValidationResults
            .thenResolve(whenSwaggerJson)
            .then(resolveSwagger)
            .then((swaggerJson) => specParser.parseSwagger(swaggerJson, swaggerPathOrUrl));

        const whenSwaggerPactValidationResults =
            q.all([whenParsedPact, whenParsedSwagger]).spread(validateSwaggerAndPact);

        return q.all([whenSwaggerValidationResults, whenSwaggerPactValidationResults])
            .spread((swaggerValidationResults, swaggerPactValidationResults) => (
                {warnings: _.concat([], swaggerValidationResults.warnings, swaggerPactValidationResults.warnings)}
            )
        );
    }
};
