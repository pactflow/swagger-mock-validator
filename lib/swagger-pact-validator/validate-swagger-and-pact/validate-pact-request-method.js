'use strict';

const getSwaggerOperation = require('./get-swagger-operation');

module.exports = (interactionContext, pactInteraction, swagger) =>
    getSwaggerOperation(interactionContext, pactInteraction, swagger).results;
