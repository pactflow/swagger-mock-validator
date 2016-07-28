'use strict';

const cloneDeep = require('lodash').cloneDeep;
const removeValueOn = require('./builder-utilities').removeValueOn;
const setValueOn = require('./builder-utilities').setValueOn;

const createSwaggerBuilder = (swagger) => ({
    build: () => cloneDeep(swagger),
    withMissingInfoTitle: () => createSwaggerBuilder(removeValueOn(swagger, 'info.title')),
    withParameter: (name, parameterBuilder) => createSwaggerBuilder(
        setValueOn(swagger, `parameters.${name}`, parameterBuilder.build())
    ),
    withPath: (path, pathObjBuilder) =>
        createSwaggerBuilder(setValueOn(swagger, `paths.${path}`, pathObjBuilder.build()))
});

const swaggerBuilder = createSwaggerBuilder({
    swagger: '2.0',
    paths: {},
    info: {
        title: 'default-title',
        version: '1.0.0'
    }
});

swaggerBuilder.operation = require('./swagger-builder/operation-builder');
swaggerBuilder.parameter = require('./swagger-builder/parameter-builder');
swaggerBuilder.path = require('./swagger-builder/path-builder');

module.exports = swaggerBuilder;
