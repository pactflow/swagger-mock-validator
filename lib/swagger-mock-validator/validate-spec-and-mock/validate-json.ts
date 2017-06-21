import * as Ajv from 'ajv';
import * as _ from 'lodash';
import {JsonSchema, JsonSchemaProperties, JsonSchemaReference, JsonSchemaValue} from '../types';
import {isBinary} from './validate-json/binary';
import {isByte} from './validate-json/byte';
import {doubleAjvKeyword, formatForDoubleNumbers, isDouble} from './validate-json/double';
import {floatAjvKeyword, formatForFloatNumbers, isFloat} from './validate-json/float';
import {formatForInt32Numbers, int32AjvKeyword, isInt32} from './validate-json/int32';
import {formatForInt64Numbers, int64AjvKeyword, isInt64} from './validate-json/int64';
import {isPassword} from './validate-json/password';

const addSwaggerFormatsAndKeywords = (ajv: Ajv.Ajv) => {
    ajv.addFormat('binary', isBinary);
    ajv.addFormat('byte', isByte);
    ajv.addFormat('password', isPassword);
    // tslint:disable:variable-name
    ajv.addKeyword(doubleAjvKeyword, {type: 'number', validate: (_schema: any, data: number) => isDouble(data)});
    ajv.addKeyword(floatAjvKeyword, {type: 'number', validate: (_schema: any, data: number) => isFloat(data)});
    ajv.addKeyword(int32AjvKeyword, {type: 'integer', validate: (_schema: any, data: number) => isInt32(data)});
    ajv.addKeyword(int64AjvKeyword, {type: 'integer', validate: (_schema: any, data: number) => isInt64(data)});
};

const nonSwaggerAjvFormats = [
    'email',
    'hostname',
    'ipv4',
    'ipv6',
    'json-pointer',
    'regex',
    'relative-json-pointer',
    'time',
    'uri',
    'uuid'
];

const alwaysTrue = () => true;

const removeNonSwaggerAjvFormats = (ajv: Ajv.Ajv) => {
    nonSwaggerAjvFormats.forEach((formatName) => {
        ajv.addFormat(formatName, alwaysTrue);
    });
};

const changeTypeToKeywordForCustomFormats = (schema: JsonSchema) => {
    _.each(schema.definitions, changeTypeToKeywordForCustomFormats);

    if ((schema as JsonSchemaReference).$ref) {
        return;
    }

    const schemaValue = schema as JsonSchemaValue;

    formatForDoubleNumbers(schemaValue);
    formatForFloatNumbers(schemaValue);
    formatForInt32Numbers(schemaValue);
    formatForInt64Numbers(schemaValue);
    _.each(schemaValue.properties as JsonSchemaProperties, changeTypeToKeywordForCustomFormats);

    if (schemaValue.items) {
        changeTypeToKeywordForCustomFormats(schemaValue.items);
    }

    if (typeof schemaValue.additionalProperties === 'object') {
        changeTypeToKeywordForCustomFormats(schemaValue.additionalProperties);
    }
};

export default (jsonSchema: JsonSchema, json: any, numbersSentAsStrings?: boolean) => {
    const ajv = new Ajv({
        allErrors: true,
        coerceTypes: numbersSentAsStrings || false,
        unknownFormats: 'ignore',
        verbose: true
    });

    addSwaggerFormatsAndKeywords(ajv);
    removeNonSwaggerAjvFormats(ajv);

    const ajvCompatibleJsonSchema = _.cloneDeep(jsonSchema);

    changeTypeToKeywordForCustomFormats(ajvCompatibleJsonSchema);

    ajv.validate(ajvCompatibleJsonSchema, json);

    return ajv.errors || [];
};
