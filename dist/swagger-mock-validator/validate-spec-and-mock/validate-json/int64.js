"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const int64MinValue = decimal_js_1.Decimal.pow(2, 63).negated();
const int64MaxValue = decimal_js_1.Decimal.pow(2, 63).minus(1);
exports.int64AjvKeyword = 'formatInt64';
exports.formatForInt64Numbers = (schema) => {
    if (schema.type === 'integer' && schema.format === 'int64') {
        delete schema.format;
        schema[exports.int64AjvKeyword] = true;
    }
};
exports.isInt64 = (parsedValue) => {
    try {
        const value = new decimal_js_1.Decimal(parsedValue);
        return value.isInteger() && value.greaterThanOrEqualTo(int64MinValue) && value.lessThanOrEqualTo(int64MaxValue);
    }
    catch (error) {
        return false;
    }
};
