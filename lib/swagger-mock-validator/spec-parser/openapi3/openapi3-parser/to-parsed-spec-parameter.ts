import {ParsedSpecJsonSchemaCore, ParsedSpecOperation, ParsedSpecParameter} from '../../parsed-spec';
import {Header, Openapi3Schema, Parameter} from '../openapi3';
import {getSchemaWithSpecDefinitions} from './get-schema-with-spec-definitions';

interface ToParsedSpecParameterOptions {
    parameter: Header | Parameter;
    name: string;
    parentOperation: ParsedSpecOperation;
    location: string;
    spec: Openapi3Schema;
}

const isParameterSchemaUnsupported = (schema: ParsedSpecJsonSchemaCore): boolean =>
    schema.type === 'object' || schema.type === 'array';

const prepareParameterSchema = (schema: ParsedSpecJsonSchemaCore, spec: Openapi3Schema): ParsedSpecJsonSchemaCore =>
    isParameterSchemaUnsupported(schema)
        ? {}
        : getSchemaWithSpecDefinitions(schema, spec);

const getParameterSchema = (parameter: Header | Parameter, spec: Openapi3Schema): ParsedSpecJsonSchemaCore =>
    parameter.schema
        ? prepareParameterSchema(parameter.schema, spec)
        : {};

export const toParsedSpecParameter = (
    {parameter, name, parentOperation, location, spec}: ToParsedSpecParameterOptions
): ParsedSpecParameter => {
    return {
        location,
        name,
        parentOperation,
        required: parameter.required || false,
        schema: getParameterSchema(parameter, spec),
        value: parameter
    };
};
