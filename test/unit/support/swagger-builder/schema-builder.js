'use strict';

const addToArrayOn = require('../builder-utilities').addToArrayOn;
const cloneDeep = require('lodash').cloneDeep;
const setValueOn = require('../builder-utilities').setValueOn;
const setValuesOn = require('../builder-utilities').setValuesOn;

const createSchemaBuilder = (schema) => ({
    build: () => cloneDeep(schema),
    withOptionalProperty: (name, propertySchemaBuilder) =>
        createSchemaBuilder(setValueOn(schema, `properties.${name}`, propertySchemaBuilder.build())),
    withRequiredProperty: (name, propertySchemaBuilder) =>
        createSchemaBuilder(addToArrayOn(schema, 'required', name))
            .withOptionalProperty(name, propertySchemaBuilder),
    withTypeArray: (itemsSchemaBuilder) => createSchemaBuilder(
        setValuesOn(schema, {
            items: itemsSchemaBuilder.build(),
            properties: undefined,
            required: undefined,
            type: 'array'
        })
    ),
    withTypeNumber: () => createSchemaBuilder(setValueOn(schema, 'type', 'number')),
    withTypeObject: () => createSchemaBuilder(setValueOn(schema, 'type', 'object')),
    withTypeString: () => createSchemaBuilder(setValueOn(schema, 'type', 'string'))
});

module.exports = createSchemaBuilder({type: 'string'});
