'use strict';

const addToArrayOn = require('../builder-utilities').addToArrayOn;
const cloneDeep = require('lodash').cloneDeep;
const setValueOn = require('../builder-utilities').setValueOn;

const createSchemaBuilder = (schema) => ({
    build: () => cloneDeep(schema),
    withOptionalProperty: (name, propertySchemaBuilder) =>
        createSchemaBuilder(setValueOn(schema, `properties.${name}`, propertySchemaBuilder.build())),
    withRequiredProperty: (name, propertySchemaBuilder) =>
        createSchemaBuilder(addToArrayOn(schema, 'required', name))
            .withOptionalProperty(name, propertySchemaBuilder),
    withTypeInteger: () => createSchemaBuilder(setValueOn(schema, 'type', 'integer')),
    withTypeObject: () => createSchemaBuilder(setValueOn(schema, 'type', 'object'))
});

module.exports = createSchemaBuilder({type: 'string'});
