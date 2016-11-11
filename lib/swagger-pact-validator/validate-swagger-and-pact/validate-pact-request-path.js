'use strict';

const getSwaggerPath = require('./get-swagger-path');

module.exports = (interactionContext, parsedPactInteraction, parsedSwagger) =>
    getSwaggerPath(interactionContext, parsedPactInteraction, parsedSwagger).results;
