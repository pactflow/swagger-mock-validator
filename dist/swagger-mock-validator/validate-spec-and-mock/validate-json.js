"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Ajv = require("ajv");
const _ = require("lodash");
const binary_1 = require("./validate-json/binary");
const byte_1 = require("./validate-json/byte");
const double_1 = require("./validate-json/double");
const float_1 = require("./validate-json/float");
const int32_1 = require("./validate-json/int32");
const int64_1 = require("./validate-json/int64");
const password_1 = require("./validate-json/password");
// tslint:disable:no-var-requires
// tslint:disable:no-submodule-imports
const draft4MetaSchema = require('ajv/lib/refs/json-schema-draft-04.json');
const addSwaggerFormatsAndKeywords = (ajv) => {
    ajv.addFormat('binary', binary_1.isBinary);
    ajv.addFormat('byte', byte_1.isByte);
    ajv.addFormat('password', password_1.isPassword);
    // tslint:disable:variable-name
    ajv.addKeyword(double_1.doubleAjvKeyword, { type: 'number', validate: (_schema, data) => double_1.isDouble(data) });
    ajv.addKeyword(float_1.floatAjvKeyword, { type: 'number', validate: (_schema, data) => float_1.isFloat(data) });
    ajv.addKeyword(int32_1.int32AjvKeyword, { type: 'integer', validate: (_schema, data) => int32_1.isInt32(data) });
    ajv.addKeyword(int64_1.int64AjvKeyword, { type: 'integer', validate: (_schema, data) => int64_1.isInt64(data) });
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
const removeNonSwaggerAjvFormats = (ajv) => {
    nonSwaggerAjvFormats.forEach((formatName) => {
        ajv.addFormat(formatName, alwaysTrue);
    });
};
const changeTypeToKeywordForCustomFormats = (schema) => {
    if (!schema) {
        return;
    }
    _.each(schema.definitions, changeTypeToKeywordForCustomFormats);
    _.each(schema.allOf, changeTypeToKeywordForCustomFormats);
    double_1.formatForDoubleNumbers(schema);
    float_1.formatForFloatNumbers(schema);
    int32_1.formatForInt32Numbers(schema);
    int64_1.formatForInt64Numbers(schema);
    _.each(schema.properties, changeTypeToKeywordForCustomFormats);
    changeTypeToKeywordForCustomFormats(schema.items);
    const schemaAsJsonSchemaValue = schema;
    if (typeof schemaAsJsonSchemaValue.additionalProperties === 'object') {
        changeTypeToKeywordForCustomFormats(schemaAsJsonSchemaValue.additionalProperties);
    }
};
const createAjvForDraft4 = (userOptions) => {
    // see ajv migration guide for ajv v4 -> ajv v5 for details on what all these settings do
    const optionsRequiredForDraft4 = {
        extendRefs: true,
        meta: true,
        unknownFormats: 'ignore'
    };
    const options = _.defaultsDeep({}, userOptions, optionsRequiredForDraft4);
    const ajv = new Ajv(options);
    ajv.addMetaSchema(draft4MetaSchema);
    ajv._opts.defaultMeta = draft4MetaSchema.id;
    ajv._refs['http://json-schema.org/schema'] = 'http://json-schema.org/draft-04/schema';
    ajv.removeKeyword('propertyNames');
    ajv.removeKeyword('contains');
    ajv.removeKeyword('const');
    return ajv;
};
exports.default = (jsonSchema, json, numbersSentAsStrings) => {
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
