import { ParsedSpecJsonSchemaCore, ParsedSpecOperation, ParsedSpecParameter } from '../../parsed-spec';
import { Header, Parameter } from '../openapi3';

interface ToParsedSpecParameterOptions {
    parameter: Header | Parameter;
    name: string;
    parentOperation: ParsedSpecOperation;
    location: string;
}

const isParameterSchemaUndefined = (schema?: ParsedSpecJsonSchemaCore): schema is undefined => schema === undefined;

const isParameterSchemaUnsupported = (schema: ParsedSpecJsonSchemaCore): boolean =>
    schema.type === 'object' || schema.type === 'array';

// draft-06 onwards converts exclusiveMinimum and exclusiveMaximum to numbers
const upgradeSchema = (schema: ParsedSpecJsonSchemaCore): ParsedSpecJsonSchemaCore => {
    if (schema.exclusiveMaximum) {
        schema.exclusiveMaximum = schema.maximum;
    }
    if (schema.exclusiveMinimum) {
        schema.exclusiveMinimum = schema.minimum;
    }
    return schema;
};

const getParameterSchema = (parameter: Header | Parameter): ParsedSpecJsonSchemaCore =>
    isParameterSchemaUndefined(parameter.schema) || isParameterSchemaUnsupported(parameter.schema)
        ? {}
        : upgradeSchema(parameter.schema);

export const toParsedSpecParameter = ({
    parameter,
    name,
    parentOperation,
    location,
}: ToParsedSpecParameterOptions): ParsedSpecParameter => {
    return {
        location,
        name,
        parentOperation,
        required: parameter.required || false,
        schema: getParameterSchema(parameter),
        value: parameter,
    };
};
