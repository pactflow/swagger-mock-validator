import * as _ from 'lodash';
import {JsonSchemaVisitor, traverseJsonSchema} from '../../../common/traverse-json-schema';
import {ParsedSpecJsonSchemaCore, ParsedSpecJsonSchemaType} from '../../parsed-spec';
import {Openapi3Schema, Schema as Openapi3JsonSchema} from '../openapi3';

interface SchemaComponents {
    [name: string]: Openapi3JsonSchema;
}

const isSingleTypeDefinition = (
    typeDefinition: ParsedSpecJsonSchemaType | ParsedSpecJsonSchemaType[] | undefined
): typeDefinition is ParsedSpecJsonSchemaType =>
    typeDefinition !== undefined && !Array.isArray(typeDefinition);

const convertNullableToTypeNull = (mutableSchema: ParsedSpecJsonSchemaCore) => {
    if ((mutableSchema as Openapi3JsonSchema).nullable && isSingleTypeDefinition(mutableSchema.type)) {
        mutableSchema.type = [mutableSchema.type, 'null'];
    }
};

const fixJsonSchemaReferences = (mutableSchema: ParsedSpecJsonSchemaCore) => {
    if (mutableSchema.$ref && mutableSchema.$ref.indexOf('#/components/schemas/') === 0) {
        mutableSchema.$ref = mutableSchema.$ref.replace(/^#\/components\/schemas\//, '#/definitions/');
    }
};

const prepareOpenApi3SchemaForValidationVisitor: JsonSchemaVisitor = (mutableSchema: ParsedSpecJsonSchemaCore) => {
    convertNullableToTypeNull(mutableSchema);
    fixJsonSchemaReferences(mutableSchema);
};

const prepareOpenApi3SchemaForValidation = (schema: Openapi3JsonSchema): ParsedSpecJsonSchemaCore => {
    traverseJsonSchema(schema, prepareOpenApi3SchemaForValidationVisitor);
    return schema;
};

const getOpenApi3SchemaComponents = (spec: Openapi3Schema): SchemaComponents | undefined =>
    (spec.components || {}).schemas;

export const getSchemaWithSpecDefinitions = (
    schema: Openapi3JsonSchema, spec: Openapi3Schema
): ParsedSpecJsonSchemaCore => {
    const modifiedSchema = _.cloneDeep(schema);
    const schemaComponents = getOpenApi3SchemaComponents(spec);
    modifiedSchema.definitions = schemaComponents;
    return prepareOpenApi3SchemaForValidation(modifiedSchema);
};
