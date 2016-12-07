import {cloneDeep} from 'lodash';
import {JsonSchema} from '../../../../lib/swagger-pact-validator/types';
import {addToArrayOn, setValueOn, setValuesOn} from '../builder-utilities';

export interface SchemaBuilder {
    build: () => JsonSchema;
}

const createSchemaBuilder = (schema: JsonSchema) => ({
    build: () => cloneDeep(schema),
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
    withTypeNumber: () => createSchemaBuilder(setValueOn(schema, 'type', 'number')),
    withTypeObject: () => createSchemaBuilder(setValueOn(schema, 'type', 'object')),
    withTypeString: () => createSchemaBuilder(setValueOn(schema, 'type', 'string'))
});

export default createSchemaBuilder({type: 'string'});
