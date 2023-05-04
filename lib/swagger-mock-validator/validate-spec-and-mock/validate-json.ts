import Ajv from 'ajv';
import _ from 'lodash';
import {traverseJsonSchema} from '../common/traverse-json-schema';
import {ParsedSpecJsonSchema, ParsedSpecJsonSchemaCore} from '../spec-parser/parsed-spec';
import {isBinary} from './validate-json/binary';
import {isByte} from './validate-json/byte';
import {doubleAjvKeyword, formatForDoubleNumbers, isDouble} from './validate-json/double';
import {floatAjvKeyword, formatForFloatNumbers, isFloat} from './validate-json/float';
import {formatForInt32Numbers, int32AjvKeyword, isInt32} from './validate-json/int32';
import {formatForInt64Numbers, int64AjvKeyword, isInt64} from './validate-json/int64';
import { formatForString, isString, stringAjvKeyword } from './validate-json/string';
import {isPassword} from './validate-json/password';
import draft4MetaSchema from 'ajv/lib/refs/json-schema-draft-04.json';

const removeLeadingDotIfPresent = (dataPath: string): string =>
    dataPath.replace(/^\./, '');

const getRawValueFromJson = (rawJson: any, dataPath?: string): any =>
    dataPath ? _.get(rawJson, removeLeadingDotIfPresent(dataPath)) : rawJson;

const addSwaggerFormatsAndKeywords = (ajv: Ajv.Ajv, rawJson: any) => {
    ajv.addFormat('binary', isBinary);
    ajv.addFormat('byte', isByte);
    ajv.addFormat('password', isPassword);
    ajv.addKeyword(doubleAjvKeyword, {
        type: 'number',
        validate: (_schema: any, _data: number, _parentSchema: any, dataPath?: string) => {
            const rawValue = getRawValueFromJson(rawJson, dataPath);
            return isDouble(rawValue);
        }
    });
    ajv.addKeyword(floatAjvKeyword, {
        type: 'number',
        validate: (_schema: any, _data: number, _parentSchema: any, dataPath?: string) => {
            const rawValue = getRawValueFromJson(rawJson, dataPath);
            return isFloat(rawValue);
        }
    });
    ajv.addKeyword(int32AjvKeyword, {
        type: 'integer',
        validate: (_schema: any, _data: number, _parentSchema: any, dataPath?: string) => {
            const rawValue = getRawValueFromJson(rawJson, dataPath);
            return isInt32(rawValue);
        }
    });
    ajv.addKeyword(int64AjvKeyword, {
        type: 'integer',
        validate: (_schema: any, _data: number, _parentSchema: any, dataPath?: string) => {
            const rawValue = getRawValueFromJson(rawJson, dataPath);
            return isInt64(rawValue);
        }
    });
    ajv.addKeyword(stringAjvKeyword, {
        type: 'string',
        validate: (_schema: any, _data: string, _parentSchema: any, dataPath?: string) => {
            const rawValue = getRawValueFromJson(rawJson, dataPath);
            return isString(rawValue);
        }
    });
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
    'uuid',
    'url',
    'uri-template',
    'uri-reference'
];

const alwaysTrue = () => true;

const removeNonSwaggerAjvFormats = (ajv: Ajv.Ajv) => {
    nonSwaggerAjvFormats.forEach((formatName) => {
        ajv.addFormat(formatName, alwaysTrue);
    });
};

const updateSchemaPropertyToDraft4 = (schema: ParsedSpecJsonSchema) => {
    (schema as any).$schema = 'http://json-schema.org/draft-04/schema';
};

const changeTypeToKeywordForCustomFormats = (schema?: ParsedSpecJsonSchema) => {
    traverseJsonSchema(schema, (mutableSchema: ParsedSpecJsonSchemaCore) => {
        formatForDoubleNumbers(mutableSchema);
        formatForFloatNumbers(mutableSchema);
        formatForInt32Numbers(mutableSchema);
        formatForInt64Numbers(mutableSchema);
        formatForString(mutableSchema);
    });
};
const createAjvForDraft4 = (userOptions: Ajv.Options) => {
    const optionsRequiredForDraft4 = {
        logger: false,
        schemaId: 'id'
    };

    const options: Ajv.Options = _.defaultsDeep({}, userOptions, optionsRequiredForDraft4);

    const ajv = new Ajv(options);
    ajv.addMetaSchema(draft4MetaSchema);

    return ajv;
};

export const validateJson = (jsonSchema: ParsedSpecJsonSchema, json: any, numbersSentAsStrings?: boolean) => {
    const ajv = createAjvForDraft4({
        allErrors: true,
        coerceTypes: numbersSentAsStrings || false,
        verbose: true
    });

    addSwaggerFormatsAndKeywords(ajv, json);
    removeNonSwaggerAjvFormats(ajv);

    const ajvCompatibleJsonSchema = _.cloneDeep(jsonSchema);
    changeTypeToKeywordForCustomFormats(ajvCompatibleJsonSchema);
    updateSchemaPropertyToDraft4(ajvCompatibleJsonSchema);
    ajv.validate(ajvCompatibleJsonSchema, _.cloneDeep(json));
    return ajv.errors || [];
};
