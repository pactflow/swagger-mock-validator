import * as _ from 'lodash';
import {JsonSchemaVisitor, traverseJsonSchema} from '../../../common/traverse-json-schema';
import {ParsedSpecJsonSchemaCore} from '../../parsed-spec';
import {Openapi3Schema, Schema as Openapi3JsonSchema} from '../openapi3';

interface SchemaComponents {
    [name: string]: Openapi3JsonSchema;
}

const fixReferencesJsonSchemaVisitor: JsonSchemaVisitor = (mutableSchema: ParsedSpecJsonSchemaCore) => {
    if (mutableSchema.$ref && mutableSchema.$ref.indexOf('#/components/schemas/') === 0) {
        mutableSchema.$ref = mutableSchema.$ref.replace(/^#\/components\/schemas\//, '#/definitions/');
    }
};

const pointComponentsSchemasToDefinitions = (schema: Openapi3JsonSchema): ParsedSpecJsonSchemaCore => {
    traverseJsonSchema(schema, fixReferencesJsonSchemaVisitor);
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
    return pointComponentsSchemasToDefinitions(modifiedSchema);
};
