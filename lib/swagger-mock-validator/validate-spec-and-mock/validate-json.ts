import * as Ajv from 'ajv';
import * as _ from 'lodash';
import {JsonSchema, JsonSchemaAllOf, JsonSchemaValue} from '../types';
import {isBinary} from './validate-json/binary';
import {isByte} from './validate-json/byte';
import {doubleAjvKeyword, formatForDoubleNumbers, isDouble} from './validate-json/double';
import {floatAjvKeyword, formatForFloatNumbers, isFloat} from './validate-json/float';
import {formatForInt32Numbers, int32AjvKeyword, isInt32} from './validate-json/int32';
import {formatForInt64Numbers, int64AjvKeyword, isInt64} from './validate-json/int64';
import {isPassword} from './validate-json/password';

// tslint:disable:no-var-requires
// tslint:disable:no-submodule-imports
const draft4MetaSchema = require('ajv/lib/refs/json-schema-draft-04.json');

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

const changeTypeToKeywordForCustomFormats = (schema?: JsonSchema) => {
    if (!schema) {
        return;
    }

    _.each(schema.definitions, changeTypeToKeywordForCustomFormats);
    _.each((schema as JsonSchemaAllOf).allOf, changeTypeToKeywordForCustomFormats);

    formatForDoubleNumbers(schema);
    formatForFloatNumbers(schema);
    formatForInt32Numbers(schema);
    formatForInt64Numbers(schema);

    _.each((schema as JsonSchemaValue).properties, changeTypeToKeywordForCustomFormats);
    changeTypeToKeywordForCustomFormats((schema as JsonSchemaValue).items);

    const schemaAsJsonSchemaValue = schema as JsonSchemaValue;
    if (typeof schemaAsJsonSchemaValue.additionalProperties === 'object') {
        changeTypeToKeywordForCustomFormats(schemaAsJsonSchemaValue.additionalProperties);
    }
};

const createAjvForDraft4 = (userOptions: Ajv.Options) => {
    // see ajv migration guide for ajv v4 -> ajv v5 for details on what all these settings do

    const optionsRequiredForDraft4 = {
        extendRefs: true,
        meta: true,
        unknownFormats: 'ignore'
    };

    const options: Ajv.Options = _.defaultsDeep({}, userOptions, optionsRequiredForDraft4);

    const ajv = new Ajv(options);
    ajv.addMetaSchema(draft4MetaSchema);
    (ajv as any)._opts.defaultMeta = draft4MetaSchema.id;
    (ajv as any)._refs['http://json-schema.org/schema'] = 'http://json-schema.org/draft-04/schema';
    ajv.removeKeyword('propertyNames');
    ajv.removeKeyword('contains');
    ajv.removeKeyword('const');

    return ajv;
};

export default (jsonSchema: JsonSchema, json: any, numbersSentAsStrings?: boolean) => {
    const ajv = createAjvForDraft4({
        allErrors: true,
        coerceTypes: numbersSentAsStrings || false,
        verbose: true
    });

    addSwaggerFormatsAndKeywords(ajv);
    removeNonSwaggerAjvFormats(ajv);

    const ajvCompatibleJsonSchema = _.cloneDeep(jsonSchema);

    changeTypeToKeywordForCustomFormats(ajvCompatibleJsonSchema);

    ajv.validate(ajvCompatibleJsonSchema, json);

    return ajv.errors || [];
};
