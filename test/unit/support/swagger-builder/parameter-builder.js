'use strict';

const cloneDeep = require('lodash').cloneDeep;
const setValuesOn = require('../builder-utilities').setValuesOn;

const createParameterBuilder = (parameter) => {
    const builder = {
        build: () => cloneDeep(parameter),
        withArrayOfNumberInPathNamed: (name) => createParameterBuilder(setValuesOn(parameter, {
            in: 'path',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array'
        })),
        withBooleanInPathNamed: (name) => createParameterBuilder(setValuesOn(parameter, {
            in: 'path',
            name,
            required: true,
            type: 'boolean'
        })),
        withIntegerInPathNamed: (name) => createParameterBuilder(setValuesOn(parameter, {
            in: 'path',
            name,
            required: true,
            type: 'integer'
        })),
        withNumberInPathNamed: (name) => createParameterBuilder(setValuesOn(parameter, {
            in: 'path',
            name,
            required: true,
            type: 'number'
        })),
        withOptionalSchemaInBody: (schemaBuilder) => createParameterBuilder(setValuesOn(parameter, {
            in: 'body',
            name: 'body',
            required: false,
            schema: schemaBuilder.build(),
            type: undefined
        })),
        withRequiredNumberInQueryNamed: (name) => createParameterBuilder(setValuesOn(parameter, {
            in: 'query',
            name,
            required: true,
            type: 'number'
        })),
        withRequiredSchemaInBody: (schemaBuilder) => createParameterBuilder(setValuesOn(parameter, {
            in: 'body',
            name: 'body',
            required: true,
            schema: schemaBuilder.build(),
            type: undefined
        })),
        withStringInPathNamed: (name) => createParameterBuilder(setValuesOn(parameter, {
            in: 'path',
            name,
            required: true,
            type: 'string'
        }))
    };

    return builder;
};

module.exports = createParameterBuilder({
    in: 'path',
    name: 'default-name',
    required: false,
    type: 'number'
});
