'use strict';

const getSwaggerPath = require('./get-swagger-path');

module.exports = (interactionContext, pactInteraction, swagger) =>
    getSwaggerPath(interactionContext, pactInteraction, swagger).results;
