import * as Ajv from 'ajv';
import * as _ from 'lodash';
import {JsonSchema} from '../types';
import {isBinary} from './validate-json/binary';
import {isByte} from './validate-json/byte';
import {doubleAjvKeyword, formatForDoubleNumbers, formatForDoubleStrings, isDouble} from './validate-json/double';
import {floatAjvKeyword, formatForFloatNumbers, formatForFloatStrings, isFloat} from './validate-json/float';
import {formatForInt32Numbers, formatForInt32Strings, int32AjvKeyword, isInt32} from './validate-json/int32';
import {formatForInt64Numbers, formatForInt64Strings, int64AjvKeyword, isInt64} from './validate-json/int64';
import {isPassword} from './validate-json/password';

const addSwaggerFormatsForStringType = (ajv: Ajv.Ajv) => {
    ajv.addFormat('binary', isBinary);
    ajv.addFormat('byte', isByte);
    ajv.addFormat('password', isPassword);
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

const addSwaggerFormatsForNumberTypesSentAsStrings = (ajv: Ajv.Ajv) => {
    ajv.addFormat('double', isDouble);
    ajv.addFormat('float', isFloat);
    ajv.addFormat('int32', isInt32);
    ajv.addFormat('int64', isInt64);
};

const changeTypeToStringForCustomFormats = (schema: JsonSchema) => {
    formatForDoubleStrings(schema);
    formatForFloatStrings(schema);
    formatForInt32Strings(schema);
    formatForInt64Strings(schema);
    _.each(schema.properties, changeTypeToStringForCustomFormats);
};

const addSwaggerFormatsForNumberTypesSentAsNumbers = (ajv: Ajv.Ajv) => {
    // tslint:disable:variable-name
    ajv.addKeyword(doubleAjvKeyword, {type: 'number', validate: (_schema: any, data: number) => isDouble(data)});
    ajv.addKeyword(floatAjvKeyword, {type: 'number', validate: (_schema: any, data: number) => isFloat(data)});
    ajv.addKeyword(int32AjvKeyword, {type: 'integer', validate: (_schema: any, data: number) => isInt32(data)});
    ajv.addKeyword(int64AjvKeyword, {type: 'integer', validate: (_schema: any, data: number) => isInt64(data)});
};

const changeTypeToKeywordForCustomFormats = (schema: JsonSchema) => {
    formatForDoubleNumbers(schema);
    formatForFloatNumbers(schema);
    formatForInt32Numbers(schema);
    formatForInt64Numbers(schema);
    _.each(schema.properties, changeTypeToKeywordForCustomFormats);
};

export default (jsonSchema: JsonSchema, json: any, numbersSentAsStrings: boolean = false) => {
    const ajv = new Ajv({
        allErrors: true,
        coerceTypes: numbersSentAsStrings,
        unknownFormats: 'ignore',
        verbose: true
    });

    addSwaggerFormatsForStringType(ajv);
    removeNonSwaggerAjvFormats(ajv);

    const ajvCompatibleJsonSchema = _.clone(jsonSchema);

    if (numbersSentAsStrings) {
        addSwaggerFormatsForNumberTypesSentAsStrings(ajv);
        changeTypeToStringForCustomFormats(ajvCompatibleJsonSchema);
    } else {
        addSwaggerFormatsForNumberTypesSentAsNumbers(ajv);
        changeTypeToKeywordForCustomFormats(ajvCompatibleJsonSchema);
    }

    ajv.validate(ajvCompatibleJsonSchema, json);

    return ajv.errors || [];
};
