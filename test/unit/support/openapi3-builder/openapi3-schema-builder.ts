import {cloneDeep} from 'lodash';
import {Schema} from '../../../../lib/swagger-mock-validator/spec-parser/openapi3/openapi3';
import {setValueOn} from '../builder-utilities';

export interface OpenApi3SchemaBuilder {
    build: () => Schema;
}

const createOpenApi3SchemaBuilder = (openApi3Schema: Schema) => ({
    build: () => cloneDeep(openApi3Schema),
    withAnyOf: (schemaBuilders: OpenApi3SchemaBuilder[]) =>
        createOpenApi3SchemaBuilder(
            setValueOn(openApi3Schema, `anyOf`, schemaBuilders.map((builder) => builder.build()))),
    withFormatDouble: () => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'format', 'double')),
    withFormatFloat: () => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'format', 'float')),
    withFormatInt32: () => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'format', 'int32')),
    withFormatInt64: () => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'format', 'int64')),
    withFormatAny: (value: string) => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'format', value)),
    withItems: (items: OpenApi3SchemaBuilder) =>
        createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'items', items.build())),
    withNot: (schemaBuilder: OpenApi3SchemaBuilder) =>
        createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, `not`, schemaBuilder.build())),
    withNullable: (value: boolean) => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'nullable', value)),
    withOneOf: (schemaBuilders: OpenApi3SchemaBuilder[]) =>
        createOpenApi3SchemaBuilder(
            setValueOn(openApi3Schema, `oneOf`, schemaBuilders.map((builder) => builder.build()))),
    withOptionalProperty: (name: string, propertySchemaBuilder: OpenApi3SchemaBuilder) =>
        createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, `properties.${name}`, propertySchemaBuilder.build())),
    withReference: (referenceName: string) => createOpenApi3SchemaBuilder({$ref: referenceName}),
    withTypeArray: () => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'type', 'array')),
    withTypeBoolean: () => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'type', 'boolean')),
    withTypeInteger: () => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'type', 'integer')),
    withTypeNumber: () => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'type', 'number')),
    withTypeObject: () => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'type', 'object')),
    withTypeString: () => createOpenApi3SchemaBuilder(setValueOn(openApi3Schema, 'type', 'string'))
});

export const openApi3SchemaBuilder = createOpenApi3SchemaBuilder({});
