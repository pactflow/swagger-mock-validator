import {cloneDeep} from 'lodash';
import {JsonSchema} from '../../../../lib/swagger-pact-validator/types';
import {addToArrayOn, setValueOn, setValuesOn} from '../builder-utilities';

export interface SchemaBuilder {
    build: () => JsonSchema;
}

const createSchemaBuilder = (schema: JsonSchema) => ({
    build: () => cloneDeep(schema),
    withFormatDouble: () => createSchemaBuilder(setValueOn(schema, 'format', 'double')),
    withFormatFloat: () => createSchemaBuilder(setValueOn(schema, 'format', 'float')),
    withFormatInt32: () => createSchemaBuilder(setValueOn(schema, 'format', 'int32')),
    withFormatInt64: () => createSchemaBuilder(setValueOn(schema, 'format', 'int64')),
    withOptionalProperty: (name: string, propertySchemaBuilder: SchemaBuilder) =>
        createSchemaBuilder(setValueOn(schema, `properties.${name}`, propertySchemaBuilder.build())),
    withRequiredProperty: (name: string, propertySchemaBuilder: SchemaBuilder) =>
        createSchemaBuilder(addToArrayOn(schema, 'required', name))
            .withOptionalProperty(name, propertySchemaBuilder),
    withTypeArray: (itemsSchemaBuilder: SchemaBuilder) => createSchemaBuilder(
        setValuesOn(schema, {
            items: itemsSchemaBuilder.build(),
            properties: undefined,
            required: undefined,
            type: 'array'
        })
    ),
    withTypeInteger: () => createSchemaBuilder(setValueOn(schema, 'type', 'integer')),
    withTypeNumber: () => createSchemaBuilder(setValueOn(schema, 'type', 'number')),
    withTypeObject: () => createSchemaBuilder(setValueOn(schema, 'type', 'object')),
    withTypeString: () => createSchemaBuilder(setValueOn(schema, 'type', 'string'))
});

export default createSchemaBuilder({type: 'string'});
