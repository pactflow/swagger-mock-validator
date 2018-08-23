"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_schema_with_spec_definitions_1 = require("./get-schema-with-spec-definitions");
const isParameterSchemaUnsupported = (schema) => schema.type === 'object' || schema.type === 'array';
const prepareParameterSchema = (schema, spec) => isParameterSchemaUnsupported(schema)
    ? {}
    : get_schema_with_spec_definitions_1.getSchemaWithSpecDefinitions(schema, spec);
const getParameterSchema = (parameter, spec) => parameter.schema
    ? prepareParameterSchema(parameter.schema, spec)
    : {};
exports.toParsedSpecParameter = ({ parameter, name, parentOperation, location, spec }) => {
    return {
        location,
        name,
        parentOperation,
        required: parameter.required || false,
        schema: getParameterSchema(parameter, spec),
        value: parameter
    };
};
