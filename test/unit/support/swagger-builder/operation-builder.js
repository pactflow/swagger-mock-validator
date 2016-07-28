'use strict';

const addToArrayOn = require('../builder-utilities').addToArrayOn;
const cloneDeep = require('lodash').cloneDeep;

const createOperationBuilder = (operation) => ({
    build: () => cloneDeep(operation),
    withParameter: (parameterBuilder) => createOperationBuilder(
        addToArrayOn(operation, 'parameters', parameterBuilder.build())
    )
});

module.exports = createOperationBuilder({responses: {200: {description: 'default-200-response'}}});
