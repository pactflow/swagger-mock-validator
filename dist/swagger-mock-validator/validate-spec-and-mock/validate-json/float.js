"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFloat = exports.formatForFloatNumbers = exports.floatAjvKeyword = void 0;
const decimal_js_1 = require("decimal.js");
const is_type_supported_1 = require("./is-type-supported");
const maximumFloatPrecision = 6;
exports.floatAjvKeyword = 'formatFloat';
const formatForFloatNumbers = (schema) => {
    if (is_type_supported_1.isTypeSupported('number', schema.type) && schema.format === 'float') {
        delete schema.format;
        schema[exports.floatAjvKeyword] = true;
    }
};
exports.formatForFloatNumbers = formatForFloatNumbers;
const isFloat = (rawValue) => {
    try {
        return new decimal_js_1.Decimal(rawValue).precision() <= maximumFloatPrecision;
    }
    catch (error) {
        return false;
    }
};
exports.isFloat = isFloat;
