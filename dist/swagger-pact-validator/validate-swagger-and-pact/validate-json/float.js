"use strict";
const Decimal = require("decimal.js");
const maximumFloatPrecision = 6;
const isFloatFormat = (schema) => schema.type === 'number' && schema.format === 'float';
exports.floatAjvKeyword = 'formatFloat';
exports.formatForFloatNumbers = (schema) => {
    if (isFloatFormat(schema)) {
        delete schema.format;
        schema[exports.floatAjvKeyword] = true;
    }
};
exports.formatForFloatStrings = (schema) => {
    if (isFloatFormat(schema)) {
        schema.type = 'string';
    }
};
exports.isFloat = (rawValue) => {
    let value;
    try {
        value = new Decimal(rawValue);
    }
    catch (error) {
        return false;
    }
    return value.precision() <= maximumFloatPrecision;
};
