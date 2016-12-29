"use strict";
const Ajv = require("ajv");
const _ = require("lodash");
const binary_1 = require("./validate-json/binary");
const byte_1 = require("./validate-json/byte");
const double_1 = require("./validate-json/double");
const float_1 = require("./validate-json/float");
const int32_1 = require("./validate-json/int32");
const int64_1 = require("./validate-json/int64");
const password_1 = require("./validate-json/password");
const addSwaggerFormatsForStringType = (ajv) => {
    ajv.addFormat('binary', binary_1.isBinary);
    ajv.addFormat('byte', byte_1.isByte);
    ajv.addFormat('password', password_1.isPassword);
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
const addSwaggerFormatsForNumberTypesSentAsStrings = (ajv) => {
    ajv.addFormat('double', double_1.isDouble);
    ajv.addFormat('float', float_1.isFloat);
    ajv.addFormat('int32', int32_1.isInt32);
    ajv.addFormat('int64', int64_1.isInt64);
};
const changeTypeToStringForCustomFormats = (schema) => {
    double_1.formatForDoubleStrings(schema);
    float_1.formatForFloatStrings(schema);
    int32_1.formatForInt32Strings(schema);
    int64_1.formatForInt64Strings(schema);
    _.each(schema.properties, changeTypeToStringForCustomFormats);
};
const addSwaggerFormatsForNumberTypesSentAsNumbers = (ajv) => {
    // tslint:disable:variable-name
    ajv.addKeyword(double_1.doubleAjvKeyword, { type: 'number', validate: (_schema, data) => double_1.isDouble(data) });
    ajv.addKeyword(float_1.floatAjvKeyword, { type: 'number', validate: (_schema, data) => float_1.isFloat(data) });
    ajv.addKeyword(int32_1.int32AjvKeyword, { type: 'integer', validate: (_schema, data) => int32_1.isInt32(data) });
    ajv.addKeyword(int64_1.int64AjvKeyword, { type: 'integer', validate: (_schema, data) => int64_1.isInt64(data) });
};
const changeTypeToKeywordForCustomFormats = (schema) => {
    double_1.formatForDoubleNumbers(schema);
    float_1.formatForFloatNumbers(schema);
    int32_1.formatForInt32Numbers(schema);
    int64_1.formatForInt64Numbers(schema);
    _.each(schema.properties, changeTypeToKeywordForCustomFormats);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (jsonSchema, json, numbersSentAsStrings = false) => {
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
    }
    else {
        addSwaggerFormatsForNumberTypesSentAsNumbers(ajv);
        changeTypeToKeywordForCustomFormats(ajvCompatibleJsonSchema);
    }
    ajv.validate(ajvCompatibleJsonSchema, json);
    return ajv.errors || [];
};
