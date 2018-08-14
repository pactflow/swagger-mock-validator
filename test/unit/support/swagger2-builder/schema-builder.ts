import {cloneDeep} from 'lodash';
import {
    Swagger2JsonSchema,
    Swagger2JsonSchemaAllOf,
    Swagger2JsonSchemaReference,
    Swagger2JsonSchemaValue
} from '../../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';
import {addToArrayOn, setValueOn, setValuesOn} from '../builder-utilities';

export interface SchemaBuilder {
    build: () => Swagger2JsonSchema;
}

const createSchemaReferenceBuilder = (schema: Swagger2JsonSchemaReference) => ({
    build: () => cloneDeep(schema)
});

const createSchemaAllOfBuilder = (schema: Swagger2JsonSchemaAllOf) => ({
    build: () => cloneDeep(schema)
});

const createSchemaValueBuilder = (schema: Swagger2JsonSchemaValue) => ({
    build: () => cloneDeep(schema),
    withAdditionalPropertiesBoolean: (value: boolean) =>
        createSchemaValueBuilder(setValueOn(schema, 'additionalProperties', value)),
    withAdditionalPropertiesSchema: (additionalPropertiesSchemaBuilder: SchemaBuilder) =>
        createSchemaValueBuilder(setValueOn(schema, 'additionalProperties', additionalPropertiesSchemaBuilder.build())),
    withAllOf: (schemas: SchemaBuilder[]) => createSchemaAllOfBuilder({allOf: schemas.map((s) => s.build())}),
    withFormatDouble: () => createSchemaValueBuilder(setValueOn(schema, 'format', 'double')),
    withFormatFloat: () => createSchemaValueBuilder(setValueOn(schema, 'format', 'float')),
    withFormatInt32: () => createSchemaValueBuilder(setValueOn(schema, 'format', 'int32')),
    withFormatInt64: () => createSchemaValueBuilder(setValueOn(schema, 'format', 'int64')),
    withOptionalProperty: (name: string, propertySchemaBuilder: SchemaBuilder) =>
        createSchemaValueBuilder(setValueOn(schema, `properties.${name}`, propertySchemaBuilder.build())),
    withReference: (referenceName: string) => createSchemaReferenceBuilder({$ref: referenceName}),
    withRequiredProperty: (name: string, propertySchemaBuilder: SchemaBuilder) =>
        createSchemaValueBuilder(addToArrayOn(schema, 'required', name))
            .withOptionalProperty(name, propertySchemaBuilder),
    withTypeArray: (itemsSchemaBuilder: SchemaBuilder) => createSchemaValueBuilder(
        setValuesOn(schema, {
            items: itemsSchemaBuilder.build(),
            properties: undefined,
            required: undefined,
            type: 'array'
        })
    ),
    withTypeInteger: () => createSchemaValueBuilder(setValueOn(schema, 'type', 'integer')),
    withTypeNumber: () => createSchemaValueBuilder(setValueOn(schema, 'type', 'number')),
    withTypeObject: () => createSchemaValueBuilder(setValueOn(schema, 'type', 'object')),
    withTypeString: () => createSchemaValueBuilder(setValueOn(schema, 'type', 'string'))
});

export const schemaBuilder = createSchemaValueBuilder({type: 'string'});
