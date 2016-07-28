'use strict';

const emptyContext = require('./swagger-pact-validator/context');
const q = require('q');
const readFileAsJson = require('./swagger-pact-validator/read-file-as-json');
const resolveSwagger = require('./swagger-pact-validator/resolve-swagger');
const validateSwagger = require('./swagger-pact-validator/validate-swagger');
const validateSwaggerAndPact = require('./swagger-pact-validator/validate-swagger-and-pact');


module.exports = {
    validate: (swaggerFileName, pactFileName) => {
        const whenSwaggerJson = readFileAsJson(swaggerFileName);
        const whenValidatedSwaggerJson = whenSwaggerJson
            .then((json) => validateSwagger(json, swaggerFileName))
            .thenResolve(whenSwaggerJson)
            .then(resolveSwagger);
        const whenPactJson = readFileAsJson(pactFileName);

        return q.all([whenValidatedSwaggerJson, whenPactJson])
            .spread((swaggerJson, pactJson) => validateSwaggerAndPact(emptyContext
                .setPactFileName(pactFileName)
                .setPactLocation('[pactRoot]')
                .setPactValue(pactJson)
                .setSwaggerFileName(swaggerFileName)
                .setSwaggerLocation('[swaggerRoot]')
                .setSwaggerValue(swaggerJson)
            ));
    }
};
