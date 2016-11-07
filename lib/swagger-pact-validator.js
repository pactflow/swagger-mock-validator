'use strict';

const emptyContext = require('./swagger-pact-validator/context');
const jsonLoader = require('./swagger-pact-validator/json-loader');
const mockParser = require('./swagger-pact-validator/mock-parser');
const q = require('q');
const resolveSwagger = require('./swagger-pact-validator/resolve-swagger');
const specParser = require('./swagger-pact-validator/spec-parser');
const validateSwagger = require('./swagger-pact-validator/validate-swagger');
const validateSwaggerAndPact = require('./swagger-pact-validator/validate-swagger-and-pact');

module.exports = {
    validate: (swaggerPathOrUrl, pactPathOrUrl) => {
        const initialContext = emptyContext
            .setPactFileName(pactPathOrUrl)
            .setPactLocation('[pactRoot]')
            .setSwaggerFileName(swaggerPathOrUrl)
            .setSwaggerLocation('[swaggerRoot]');

        const whenSwaggerJson = jsonLoader.load(swaggerPathOrUrl);
        const whenValidatedSwaggerJson = whenSwaggerJson
            .then((swaggerJson) => validateSwagger(swaggerJson, initialContext))
            .thenResolve(whenSwaggerJson)
            .then(resolveSwagger);

        const whenPactJson = jsonLoader.load(pactPathOrUrl);

        const whenParsedPact = whenPactJson.then((pactJson) => mockParser.parsePact(pactJson, pactPathOrUrl));
        const whenParsedSwagger = whenValidatedSwaggerJson
            .then((swaggerJson) => specParser.parseSwagger(swaggerJson, swaggerPathOrUrl));

        return q.all([whenValidatedSwaggerJson, whenPactJson, whenParsedPact, whenParsedSwagger])
            // eslint-disable-next-line max-params
            .spread((swaggerJson, pactJson, parsedPact, parsedSwagger) => validateSwaggerAndPact(
                initialContext
                    .setPactValue(pactJson)
                    .setSwaggerValue(swaggerJson),
                parsedPact,
                parsedSwagger
            ));
    }
};
