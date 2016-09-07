'use strict';

const emptyContext = require('./swagger-pact-validator/context');
const jsonLoader = require('./swagger-pact-validator/json-loader');
const q = require('q');
const resolveSwagger = require('./swagger-pact-validator/resolve-swagger');
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

        return q.all([whenValidatedSwaggerJson, whenPactJson])
            .spread((swaggerJson, pactJson) => validateSwaggerAndPact(initialContext
                .setPactValue(pactJson)
                .setSwaggerValue(swaggerJson)
            ));
    }
};
