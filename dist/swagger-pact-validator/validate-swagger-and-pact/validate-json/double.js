"use strict";
const Decimal = require("decimal.js");
const maximumDoublePrecision = 15;
const isDoubleFormat = (schema) => schema.type === 'number' && schema.format === 'double';
exports.doubleAjvKeyword = 'formatDouble';
exports.formatForDoubleNumbers = (schema) => {
    if (isDoubleFormat(schema)) {
        delete schema.format;
        schema[exports.doubleAjvKeyword] = true;
    }
};
exports.formatForDoubleStrings = (schema) => {
    if (isDoubleFormat(schema)) {
        schema.type = 'string';
    }
};
exports.isDouble = (rawValue) => {
    let value;
    try {
        value = new Decimal(rawValue);
    }
    catch (error) {
        return false;
    }
    return value.precision() <= maximumDoublePrecision;
};
