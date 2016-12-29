"use strict";
const _ = require("lodash");
const int32MinValue = -2147483648;
const int32MaxValue = 2147483647;
const isInt32Format = (schema) => schema.type === 'integer' && schema.format === 'int32';
exports.int32AjvKeyword = 'formatInt32';
exports.formatForInt32Numbers = (schema) => {
    if (isInt32Format(schema)) {
        delete schema.format;
        schema[exports.int32AjvKeyword] = true;
    }
};
exports.formatForInt32Strings = (schema) => {
    if (isInt32Format(schema)) {
        schema.type = 'string';
    }
};
exports.isInt32 = (rawValue) => {
    const value = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;
    return _.isInteger(value) && value >= int32MinValue && value <= int32MaxValue;
};
