"use strict";
const Decimal = require("decimal.js");
const maximumFloatPrecision = 6;
exports.floatAjvKeyword = 'formatFloat';
exports.formatForFloatNumbers = (schema) => {
    if (schema.type === 'number' && schema.format === 'float') {
        delete schema.format;
        schema[exports.floatAjvKeyword] = true;
    }
};
exports.isFloat = (value) => new Decimal(value).precision() <= maximumFloatPrecision;
