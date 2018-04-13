"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const int32MinValue = decimal_js_1.Decimal.pow(2, 31).negated();
const int32MaxValue = decimal_js_1.Decimal.pow(2, 31).minus(1);
exports.int32AjvKeyword = 'formatInt32';
exports.formatForInt32Numbers = (schema) => {
    if (schema.type === 'integer' && schema.format === 'int32') {
        delete schema.format;
        schema[exports.int32AjvKeyword] = true;
    }
};
exports.isInt32 = (rawValue) => {
    try {
        const value = new decimal_js_1.Decimal(rawValue);
        return value.isInteger() && value.greaterThanOrEqualTo(int32MinValue) && value.lessThanOrEqualTo(int32MaxValue);
    }
    catch (error) {
        return false;
    }
};
