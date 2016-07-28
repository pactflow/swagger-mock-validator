'use strict';

const cloneDeep = require('lodash').cloneDeep;
const addToArrayOn = require('../builder-utilities').addToArrayOn;
const setValueOn = require('../builder-utilities').setValueOn;

const createPathBuilder = (path) => ({
    build: () => cloneDeep(path),
    withGetOperation: (operationBuilder) => createPathBuilder(setValueOn(path, 'get', operationBuilder.build())),
    withParameter: (parameterBuilder) => createPathBuilder(addToArrayOn(path, 'parameters', parameterBuilder.build())),
    withParameterReference: (name) => createPathBuilder(
        addToArrayOn(path, 'parameters', {$ref: `#/parameters/${name}`})
    ),
    withPostOperation: (operationBuilder) => createPathBuilder(setValueOn(path, 'post', operationBuilder.build()))
});

module.exports = createPathBuilder({});
