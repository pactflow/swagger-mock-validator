"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const traverse_json_schema_1 = require("../../../common/traverse-json-schema");
const fixReferencesJsonSchemaVisitor = (mutableSchema) => {
    if (mutableSchema.$ref && mutableSchema.$ref.indexOf('#/components/schemas/') === 0) {
        mutableSchema.$ref = mutableSchema.$ref.replace(/^#\/components\/schemas\//, '#/definitions/');
    }
};
const pointComponentsSchemasToDefinitions = (schema) => {
    traverse_json_schema_1.traverseJsonSchema(schema, fixReferencesJsonSchemaVisitor);
    return schema;
};
const getOpenApi3SchemaComponents = (spec) => (spec.components || {}).schemas;
exports.getSchemaWithSpecDefinitions = (schema, spec) => {
    const modifiedSchema = _.cloneDeep(schema);
    const schemaComponents = getOpenApi3SchemaComponents(spec);
    modifiedSchema.definitions = schemaComponents;
    return pointComponentsSchemasToDefinitions(modifiedSchema);
};
