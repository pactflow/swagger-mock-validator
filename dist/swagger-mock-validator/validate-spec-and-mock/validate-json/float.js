"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const maximumFloatPrecision = 6;
exports.floatAjvKeyword = 'formatFloat';
exports.formatForFloatNumbers = (schema) => {
    if (schema.type === 'number' && schema.format === 'float') {
        delete schema.format;
        schema[exports.floatAjvKeyword] = true;
    }
};
exports.isFloat = (rawValue) => {
    try {
        return new decimal_js_1.Decimal(rawValue).precision() <= maximumFloatPrecision;
    }
    catch (error) {
        return false;
    }
};
