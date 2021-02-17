"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchemaWithSpecDefinitions = void 0;
const _ = require("lodash");
const traverse_json_schema_1 = require("../../../common/traverse-json-schema");
const isSingleTypeDefinition = (typeDefinition) => typeDefinition !== undefined && !Array.isArray(typeDefinition);
const convertNullableToTypeNull = (mutableSchema) => {
    if (mutableSchema.nullable && isSingleTypeDefinition(mutableSchema.type)) {
        mutableSchema.type = [mutableSchema.type, 'null'];
    }
};
const fixJsonSchemaReferences = (mutableSchema) => {
    if (mutableSchema.$ref && mutableSchema.$ref.indexOf('#/components/schemas/') === 0) {
        mutableSchema.$ref = mutableSchema.$ref.replace(/^#\/components\/schemas\//, '#/definitions/');
    }
};
const prepareOpenApi3SchemaForValidationVisitor = (mutableSchema) => {
    convertNullableToTypeNull(mutableSchema);
    fixJsonSchemaReferences(mutableSchema);
};
const prepareOpenApi3SchemaForValidation = (schema) => {
    traverse_json_schema_1.traverseJsonSchema(schema, prepareOpenApi3SchemaForValidationVisitor);
    return schema;
};
const getOpenApi3SchemaComponents = (spec) => (spec.components || {}).schemas;
const getSchemaWithSpecDefinitions = (schema, spec) => {
    const modifiedSchema = _.cloneDeep(schema);
    const schemaComponents = getOpenApi3SchemaComponents(spec);
    modifiedSchema.definitions = schemaComponents;
    return prepareOpenApi3SchemaForValidation(modifiedSchema);
};
exports.getSchemaWithSpecDefinitions = getSchemaWithSpecDefinitions;
