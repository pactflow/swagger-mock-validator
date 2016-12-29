"use strict";
const Decimal = require("decimal.js");
const int64MinValue = new Decimal('-9223372036854775808');
const int64MaxValue = new Decimal('9223372036854775807');
const isInt64Format = (schema) => schema.type === 'integer' && schema.format === 'int64';
exports.int64AjvKeyword = 'formatInt64';
exports.formatForInt64Numbers = (schema) => {
    if (isInt64Format(schema)) {
        delete schema.format;
        schema[exports.int64AjvKeyword] = true;
    }
};
exports.formatForInt64Strings = (schema) => {
    if (isInt64Format(schema)) {
        schema.type = 'string';
    }
};
exports.isInt64 = (rawValue) => {
    let value;
    try {
        value = new Decimal(rawValue);
    }
    catch (error) {
        return false;
    }
    return value.isInteger() && value.greaterThanOrEqualTo(int64MinValue) && value.lessThanOrEqualTo(int64MaxValue);
};
