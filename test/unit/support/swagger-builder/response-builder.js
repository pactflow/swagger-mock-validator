'use strict';

const cloneDeep = require('lodash').cloneDeep;
const setValueOn = require('../builder-utilities').setValueOn;

const createResponseBuilder = (response) => ({
    build: () => cloneDeep(response),
    withDescription: (description) => createResponseBuilder(setValueOn(response, 'description', description)),
    withSchema: (schemaBuilder) => createResponseBuilder(setValueOn(response, 'schema', schemaBuilder.build()))
});

module.exports = createResponseBuilder({description: 'default-response'});
