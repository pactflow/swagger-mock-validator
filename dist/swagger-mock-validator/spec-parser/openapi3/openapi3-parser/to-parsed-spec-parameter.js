"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isParameterSchemaUndefined = (schema) => schema === undefined;
const isParameterSchemaUnsupported = (schema) => schema.type === 'object' || schema.type === 'array';
const getParameterSchema = (parameter) => isParameterSchemaUndefined(parameter.schema) || isParameterSchemaUnsupported(parameter.schema)
    ? {}
    : parameter.schema;
exports.toParsedSpecParameter = ({ parameter, name, parentOperation, location }) => {
    return {
        location,
        name,
        parentOperation,
        required: parameter.required || false,
        schema: getParameterSchema(parameter),
        value: parameter
    };
};
