'use strict';

const addToArrayOn = require('../builder-utilities').addToArrayOn;
const cloneDeep = require('lodash').cloneDeep;
const setValueOn = require('../builder-utilities').setValueOn;
const defaultResponseBuilder = require('./response-builder');

const createOperationBuilder = (operation) => ({
    build: () => cloneDeep(operation),
    withParameter: (parameterBuilder) => createOperationBuilder(
        addToArrayOn(operation, 'parameters', parameterBuilder.build())
    ),
    withResponse: (statusCode, responseBuilder) => createOperationBuilder(
        setValueOn(operation, `responses.${statusCode}`, responseBuilder.build())
    )
});

module.exports = createOperationBuilder({responses: {200: defaultResponseBuilder.build()}});
