"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJson = void 0;
const Ajv = require("ajv");
const _ = require("lodash");
const traverse_json_schema_1 = require("../common/traverse-json-schema");
const binary_1 = require("./validate-json/binary");
const byte_1 = require("./validate-json/byte");
const double_1 = require("./validate-json/double");
const float_1 = require("./validate-json/float");
const int32_1 = require("./validate-json/int32");
const int64_1 = require("./validate-json/int64");
const string_1 = require("./validate-json/string");
const password_1 = require("./validate-json/password");
// tslint:disable:no-var-requires
// tslint:disable:no-submodule-imports
const draft4MetaSchema = require('ajv/lib/refs/json-schema-draft-04.json');
const removeLeadingDotIfPresent = (dataPath) => dataPath.replace(/^\./, '');
const getRawValueFromJson = (rawJson, dataPath) => dataPath ? _.get(rawJson, removeLeadingDotIfPresent(dataPath)) : rawJson;
const addSwaggerFormatsAndKeywords = (ajv, rawJson) => {
    ajv.addFormat('binary', binary_1.isBinary);
    ajv.addFormat('byte', byte_1.isByte);
    ajv.addFormat('password', password_1.isPassword);
    // tslint:disable:variable-name
    ajv.addKeyword(double_1.doubleAjvKeyword, {
        type: 'number',
        validate: (_schema, _data, _parentSchema, dataPath) => {
            const rawValue = getRawValueFromJson(rawJson, dataPath);
            return (0, double_1.isDouble)(rawValue);
        }
    });
    ajv.addKeyword(float_1.floatAjvKeyword, {
        type: 'number',
        validate: (_schema, _data, _parentSchema, dataPath) => {
            const rawValue = getRawValueFromJson(rawJson, dataPath);
            return (0, float_1.isFloat)(rawValue);
        }
    });
    ajv.addKeyword(int32_1.int32AjvKeyword, {
        type: 'integer',
        validate: (_schema, _data, _parentSchema, dataPath) => {
            const rawValue = getRawValueFromJson(rawJson, dataPath);
            return (0, int32_1.isInt32)(rawValue);
        }
    });
    ajv.addKeyword(int64_1.int64AjvKeyword, {
        type: 'integer',
        validate: (_schema, _data, _parentSchema, dataPath) => {
            const rawValue = getRawValueFromJson(rawJson, dataPath);
            return (0, int64_1.isInt64)(rawValue);
        }
    });
    ajv.addKeyword(string_1.stringAjvKeyword, {
        type: 'string',
        validate: (_schema, _data, _parentSchema, dataPath) => {
            const rawValue = getRawValueFromJson(rawJson, dataPath);
            return (0, string_1.isString)(rawValue);
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
const removeNonSwaggerAjvFormats = (ajv) => {
    nonSwaggerAjvFormats.forEach((formatName) => {
        ajv.addFormat(formatName, alwaysTrue);
    });
};
const updateSchemaPropertyToDraft4 = (schema) => {
    schema.$schema = 'http://json-schema.org/draft-04/schema';
};
const changeTypeToKeywordForCustomFormats = (schema) => {
    (0, traverse_json_schema_1.traverseJsonSchema)(schema, (mutableSchema) => {
        (0, double_1.formatForDoubleNumbers)(mutableSchema);
        (0, float_1.formatForFloatNumbers)(mutableSchema);
        (0, int32_1.formatForInt32Numbers)(mutableSchema);
        (0, int64_1.formatForInt64Numbers)(mutableSchema);
        (0, string_1.formatForString)(mutableSchema);
    });
};
const createAjvForDraft4 = (userOptions) => {
    const optionsRequiredForDraft4 = {
        logger: false,
        schemaId: 'id'
    };
    const options = _.defaultsDeep({}, userOptions, optionsRequiredForDraft4);
    const ajv = new Ajv(options);
    ajv.addMetaSchema(draft4MetaSchema);
    return ajv;
};
const validateJson = (jsonSchema, json, numbersSentAsStrings) => {
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
exports.validateJson = validateJson;
